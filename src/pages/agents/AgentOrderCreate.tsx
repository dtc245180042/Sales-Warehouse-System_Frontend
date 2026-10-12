import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  ChevronDown,
  MapPin,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  Package,
  Tag,
  User,
  Truck,
  FileText,
  AlertCircle,
  TrendingDown,
  Sparkles,
  Info,
  Layers,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { agentService } from '../../services/agentService';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import { Agent } from '../../types/Agent';
import { Product } from '../../types/Product';
import { Order } from '../../types/Order';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  DiscountTier,
  volumeDiscountService,
} from '../../services/volumeDiscountService';
import { VolumeDiscountPolicyModal } from '../../components/sales/VolumeDiscountPolicyModal';
import { DraftOrdersModal } from '../../components/agents/DraftOrdersModal';

// Re-export để đảm bảo tương thích với các module khác
export type { DiscountTier };
export const VOLUME_DISCOUNT_TIERS: DiscountTier[] = volumeDiscountService.getTiers();

export function getVolumeDiscountInfo(qty: number, tiers?: DiscountTier[]) {
  return volumeDiscountService.calculateDiscount(qty, tiers);
}

interface CartLine {
  productId: string;
  sku: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  discountPct: number;   // % chiết khấu theo số lượng (SCRUM-486)
  discountAmt: number;   // Tiền chiết khấu trên dòng
  lineTotal: number;     // Thành tiền sau chiết khấu
  neededForNext: number; // Cần thêm bao nhiêu sp để lên mốc CK tiếp theo
  nextTierPct: number;   // % của mốc tiếp theo
}

function calculateCartLine(product: Product, qty: number, tiers?: DiscountTier[]): CartLine {
  const { discountPct, nextTier, neededForNext } = volumeDiscountService.calculateDiscount(qty, tiers);
  const rawTotal = product.salePrice * qty;
  const discountAmt = Math.round((rawTotal * discountPct) / 100);
  const lineTotal = rawTotal - discountAmt;

  return {
    productId: product.id,
    sku: product.sku,
    name: product.name,
    image: product.image,
    unitPrice: product.salePrice,
    quantity: qty,
    discountPct,
    discountAmt,
    lineTotal,
    neededForNext,
    nextTierPct: nextTier ? nextTier.discountPct : discountPct,
  };
}

// ─── Component Chính ─────────────────────────────────────────────────────────

export const AgentOrderCreate: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const { user } = useAuth();

  // ── Dữ liệu nền tảng ──
  const [agents, setAgents] = useState<Agent[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // ── Thông tin đơn hàng (SCRUM-474) ──
  const preselectedAgentId = searchParams.get('agent') || '';
  const [selectedAgentId, setSelectedAgentId] = useState(preselectedAgentId);
  const [agentSearch, setAgentSearch] = useState('');
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [deliveryPoint, setDeliveryPoint] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [note, setNote] = useState('');

  // ── Sản phẩm ──
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // ── Giỏ hàng ──
  const [cart, setCart] = useState<CartLine[]>([]);

  // ── Chiết khấu bổ sung toàn đơn & ghi nợ (SCRUM-480) ──
  const [extraDiscountPct, setExtraDiscountPct] = useState(0);
  const [isDebt, setIsDebt] = useState(false);

  // ── Chính sách chiết khấu theo sản lượng (SCRUM-486 / SCRUM-487) ──
  const [activeTiers, setActiveTiers] = useState<DiscountTier[]>(() => volumeDiscountService.getTiers());
  const [showTierModal, setShowTierModal] = useState(false);

  // ── Quản lý đơn nháp (SCRUM-481 Mở lại và tiếp tục đơn) ──
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [draftCount, setDraftCount] = useState(0);
  const [resumingOrder, setResumingOrder] = useState<{ id: string; code: string } | null>(null);

  // ── Submitting ──
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  // Đếm số lượng đơn nháp
  const refreshDraftCount = useCallback(() => {
    orderService
      .getAll()
      .then((all) => {
        const count = all.filter((o) => o.status === 'pending').length;
        setDraftCount(count);
      })
      .catch(() => {});
  }, []);

  // ── S4-02: Hạn mức công nợ & S4-04: Lịch sử mua hàng 90 ngày ──
  const [creditSummary, setCreditSummary] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Tải dữ liệu ban đầu
  useEffect(() => {
    agentService.getAll().then((data) => {
      setAgents(data);
      if (preselectedAgentId) {
        const found = data.find((a) => a.id === preselectedAgentId || a.code === preselectedAgentId);
        if (found) {
          setSelectedAgentId(found.id);
          setDeliveryPoint(found.address);
        }
      }
    });
    productService.getAll().then(setProducts);
    refreshDraftCount();
  }, [preselectedAgentId, refreshDraftCount]);

  // S4-02 & S4-04: Tự động tải hồ sơ công nợ và gợi ý lịch sử mua hàng 90 ngày khi chọn đại lý
  useEffect(() => {
    if (!selectedAgentId) {
      setCreditSummary(null);
      setSuggestions(null);
      return;
    }

    // 1. Lấy thông tin hạn mức công nợ thời gian thực (S4-02)
    orderService.getCreditSummary(selectedAgentId).then((res) => {
      if (res) setCreditSummary(res);
    });

    // 2. Lấy gợi ý mặt hàng 3 tháng gần nhất (S4-04)
    setLoadingSuggestions(true);
    orderService
      .getSuggestions(selectedAgentId, 90)
      .then((res) => {
        if (res) setSuggestions(res);
      })
      .finally(() => {
        setLoadingSuggestions(false);
      });
  }, [selectedAgentId]);

  // Nghe sự kiện thay đổi chính sách chiết khấu từ các module khác
  useEffect(() => {
    const handlePolicyChange = (e: CustomEvent<DiscountTier[]>) => {
      if (e.detail) {
        setActiveTiers(e.detail);
      }
    };
    window.addEventListener('volume_discount_policy_changed' as keyof WindowEventMap, handlePolicyChange as EventListener);
    return () => {
      window.removeEventListener('volume_discount_policy_changed' as keyof WindowEventMap, handlePolicyChange as EventListener);
    };
  }, []);

  // Mở lại đơn nháp đã chọn
  const handleSelectDraft = useCallback(
    (draft: Order) => {
      setResumingOrder({ id: draft.id, code: draft.code });
      setSelectedAgentId(draft.customerId);
      setDeliveryPoint(draft.customerAddress || '');
      setNote(draft.note || '');
      if (draft.paymentStatus === 'unpaid') {
        setIsDebt(true);
      }

      if (draft.items && draft.items.length > 0) {
        const currentTiers = volumeDiscountService.getTiers();
        setCart(
          draft.items.map((it) => {
            const matched = products.find((p) => p.id === it.productId || p.sku === it.sku);
            const fallbackProd: Product = matched || {
              id: it.productId,
              sku: it.sku,
              name: it.name,
              salePrice: it.price,
              costPrice: 0,
              stock: 999,
              minStock: 0,
              unit: 'Cái',
              image: '',
              category: 'Chung',
              status: 'active',
              createdAt: '',
              updatedAt: '',
            };
            return calculateCartLine(fallbackProd, it.quantity, currentTiers);
          })
        );
      }
      showToast(`Đã mở lại đơn nháp ${draft.code}`, 'info');
    },
    [products, showToast]
  );

  // Mở đơn nháp trực tiếp từ URL nếu có param ?orderId= hoặc ?draftId=
  const targetDraftId = searchParams.get('orderId') || searchParams.get('draftId') || '';
  useEffect(() => {
    if (targetDraftId) {
      orderService
        .getById(targetDraftId)
        .then((foundOrder) => {
          if (foundOrder) {
            handleSelectDraft(foundOrder);
          }
        })
        .catch(() => {});
    }
  }, [targetDraftId, handleSelectDraft]);

  const handleClearDraftMode = () => {
    setResumingOrder(null);
    setCart([]);
    setDeliveryPoint('');
    setNote('');
    setSelectedAgentId('');
    showToast('Đã thoát chế độ sửa đơn nháp, sẵn sàng tạo đơn mới', 'info');
  };

  const recalculateCartWithTiers = useCallback(
    (newTiers: DiscountTier[]) => {
      setActiveTiers(newTiers);
      setCart((prev) =>
        prev.map((line) => {
          const prod = products.find((p) => p.id === line.productId);
          if (!prod) return line;
          return calculateCartLine(prod, line.quantity, newTiers);
        })
      );
    },
    [products]
  );

  // Đại lý đã chọn
  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === selectedAgentId),
    [agents, selectedAgentId]
  );

  // ── Tính toán thời gian thực theo thời gian thực (SCRUM-480) ──
  const rawSubtotal = useMemo(
    () => cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
    [cart]
  );
  const totalVolumeDiscount = useMemo(
    () => cart.reduce((s, l) => s + l.discountAmt, 0),
    [cart]
  );
  const afterVolumeDiscount = rawSubtotal - totalVolumeDiscount;
  const extraDiscountAmt = Math.round((afterVolumeDiscount * extraDiscountPct) / 100);
  const grandTotal = Math.max(0, afterVolumeDiscount - extraDiscountAmt);
  const totalItems = cart.reduce((s, l) => s + l.quantity, 0);

  // Lọc đại lý theo tìm kiếm
  const filteredAgents = useMemo(() => {
    const q = agentSearch.toLowerCase().trim();
    if (!q) return agents.slice(0, 8);
    return agents
      .filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.code.toLowerCase().includes(q) ||
          a.phone.includes(q)
      )
      .slice(0, 8);
  }, [agents, agentSearch]);

  // Lọc sản phẩm theo tìm kiếm
  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.includes(q)
      )
      .slice(0, 10);
  }, [products, productSearch]);

  // ── Thêm sản phẩm vào giỏ hàng ──
  const addToCart = useCallback(
    (product: Product) => {
      if (product.stock <= 0) {
        showToast(`${product.name} đã hết hàng trong kho`, 'error');
        return;
      }
      setCart((prev) => {
        const idx = prev.findIndex((l) => l.productId === product.id);
        if (idx >= 0) {
          const newQty = prev[idx].quantity + 1;
          if (newQty > product.stock) {
            showToast(`Chỉ còn ${product.stock} sản phẩm khả dụng`, 'warning');
            return prev;
          }
          const updated = [...prev];
          updated[idx] = calculateCartLine(product, newQty, activeTiers);
          return updated;
        }
        return [...prev, calculateCartLine(product, 1, activeTiers)];
      });
      setProductSearch('');
      setShowProductDropdown(false);
      showToast(`Đã thêm ${product.name} vào giỏ`, 'info');
    },
    [activeTiers, showToast]
  );

  // ── Cập nhật số lượng (+ / - hoặc nhập tay) ──
  const updateQty = useCallback(
    (productId: string, newQty: number) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      if (newQty <= 0) {
        setCart((prev) => prev.filter((l) => l.productId !== productId));
        return;
      }

      if (newQty > product.stock) {
        showToast(`Kho chỉ còn ${product.stock} sản phẩm`, 'warning');
        newQty = product.stock;
      }

      setCart((prev) =>
        prev.map((line) => {
          if (line.productId !== productId) return line;
          return calculateCartLine(product, newQty, activeTiers);
        })
      );
    },
    [products, activeTiers, showToast]
  );

  // ── Xóa dòng hàng ──
  const removeLine = (productId: string) => {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  };

  // ── S4-04: Thêm nhanh mặt hàng từ gợi ý lịch sử 90 ngày (Quy tắc chống trùng dòng) ──
  const addSuggestionToCart = useCallback(
    (sug: { product_id: string; sku: string; name: string; avg_quantity?: number; unit?: string }) => {
      const prod = products.find((p) => p.id === sug.product_id || p.sku === sug.sku);
      if (!prod) {
        showToast(`Không tìm thấy sản phẩm ${sug.name || sug.sku} trong danh mục`, 'warning');
        return;
      }
      if (prod.stock <= 0) {
        showToast(`${prod.name} hiện đã hết hàng khả dụng trong kho`, 'error');
        return;
      }
      const qtyToAdd = Math.max(1, Math.round(sug.avg_quantity || 1));
      setCart((prev) => {
        const idx = prev.findIndex((l) => l.productId === prod.id);
        if (idx >= 0) {
          const newQty = prev[idx].quantity + qtyToAdd;
          if (newQty > prod.stock) {
            showToast(`Kho chỉ còn ${prod.stock} sản phẩm khả dụng, đã cộng tối đa tồn kho`, 'warning');
            const updated = [...prev];
            updated[idx] = calculateCartLine(prod, prod.stock, activeTiers);
            return updated;
          }
          const updated = [...prev];
          updated[idx] = calculateCartLine(prod, newQty, activeTiers);
          return updated;
        }
        const safeQty = Math.min(qtyToAdd, prod.stock);
        return [...prev, calculateCartLine(prod, safeQty, activeTiers)];
      });
      showToast(`Đã thêm ${prod.name} (×${qtyToAdd} ${sug.unit || prod.unit}) từ lịch sử 90 ngày`, 'info');
    },
    [products, activeTiers, showToast]
  );

  // S4-04: Thêm tất cả sản phẩm gợi ý vào đơn
  const addAllSuggestions = useCallback(() => {
    if (!suggestions?.suggested_products || suggestions.suggested_products.length === 0) return;
    let addedCount = 0;
    suggestions.suggested_products.forEach((sug: any) => {
      const prod = products.find((p) => p.id === sug.product_id || p.sku === sug.sku);
      if (prod && prod.stock > 0) {
        addSuggestionToCart(sug);
        addedCount++;
      }
    });
    if (addedCount > 0) {
      showToast(`Đã tự động thêm ${addedCount} mặt hàng thường mua vào đơn!`, 'success');
    }
  }, [suggestions, products, addSuggestionToCart, showToast]);

  // ── Lưu đơn (nháp hoặc gửi thật) ──
  const handleSubmit = async (draft: boolean) => {
    if (!selectedAgentId) {
      showToast('Vui lòng chọn đại lý trước khi tạo đơn', 'warning');
      return;
    }
    if (cart.length === 0) {
      showToast('Giỏ hàng đang trống, hãy thêm ít nhất một sản phẩm', 'warning');
      return;
    }
    setIsSubmitting(true);
    setIsDraft(draft);
    try {
      const agent = selectedAgent!;
      const itemsPayload = cart.map(({ image, discountPct, discountAmt, lineTotal, neededForNext, nextTierPct, ...rest }) => ({
        productId: rest.productId,
        sku: rest.sku,
        name: rest.name,
        price: rest.unitPrice,
        quantity: rest.quantity,
        discount: discountAmt,
        subtotal: lineTotal,
      }));

      if (resumingOrder) {
        // Cập nhật đơn nháp hiện có (SCRUM-481)
        await orderService.update(resumingOrder.id, {
          customerId: agent.id,
          customerName: agent.name,
          customerPhone: agent.phone,
          customerAddress: deliveryPoint || agent.address,
          items: itemsPayload,
          subtotal: rawSubtotal,
          discount: totalVolumeDiscount + extraDiscountAmt,
          tax: 0,
          total: grandTotal,
          paidAmount: isDebt ? 0 : grandTotal,
          paymentStatus: isDebt ? 'unpaid' : 'paid',
          status: draft ? 'pending' : 'confirmed',
          note:
            note ||
            `Đơn hàng đại lý - ${agent.name}${deliveryDate ? ' - Giao: ' + deliveryDate : ''}${isDebt ? ' [Ghi nợ]' : ''}`,
        });

        if (isDebt && !draft) {
          await agentService.update(agent.id, {
            outstandingDebt: (agent.outstandingDebt || 0) + grandTotal,
            totalOrders: (agent.totalOrders || 0) + 1,
            totalSpent: (agent.totalSpent || 0) + grandTotal,
          });
        }

        showToast(
          draft
            ? `Đã cập nhật đơn nháp ${resumingOrder.code} thành công!`
            : `Đã gửi duyệt đơn hàng ${resumingOrder.code} thành công!`,
          'success'
        );
      } else {
        // Tạo đơn mới
        await orderService.create({
          customerId: agent.id,
          customerName: agent.name,
          customerPhone: agent.phone,
          customerAddress: deliveryPoint || agent.address,
          items: itemsPayload,
          subtotal: rawSubtotal,
          discount: totalVolumeDiscount + extraDiscountAmt,
          tax: 0,
          total: grandTotal,
          paidAmount: isDebt ? 0 : grandTotal,
          changeAmount: 0,
          paymentMethod: isDebt ? 'transfer' : 'transfer',
          paymentStatus: isDebt ? 'unpaid' : 'paid',
          status: draft ? 'pending' : 'confirmed',
          staffId: user?.id || agent.assignedStaffId || 'USR-003',
          staffName: user?.name || agent.assignedStaffName || 'Nhân viên kinh doanh',
          note:
            note ||
            `Đơn hàng đại lý - ${agent.name}${deliveryDate ? ' - Giao: ' + deliveryDate : ''}${isDebt ? ' [Ghi nợ]' : ''}`,
        });

        if (isDebt) {
          await agentService.update(agent.id, {
            outstandingDebt: (agent.outstandingDebt || 0) + grandTotal,
            totalOrders: (agent.totalOrders || 0) + 1,
            totalSpent: (agent.totalSpent || 0) + grandTotal,
          });
        } else {
          await agentService.update(agent.id, {
            totalOrders: (agent.totalOrders || 0) + 1,
            totalSpent: (agent.totalSpent || 0) + grandTotal,
          });
        }

        showToast(
          draft ? 'Đã lưu nháp đơn hàng đại lý thành công!' : 'Đã tạo và gửi đơn hàng đại lý thành công!',
          'success'
        );
      }

      refreshDraftCount();
      navigate('/agents');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tạo đơn hàng';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16">
      {/* ── Topbar tối ưu Mobile 360px (SCRUM-474) ── */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 py-2.5 sm:px-6 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => navigate('/agents')}
              className="p-1.5 -ml-1 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Quay lại danh sách đại lý"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                {resumingOrder ? `Sửa Đơn Nháp ${resumingOrder.code}` : 'Tạo Đơn Hàng Đại Lý'}
              </h1>
              <p className="text-[11px] text-slate-500 truncate">
                {selectedAgent ? `${selectedAgent.name}` : 'Mobile 360px · OMS Pro'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Nút xem danh sách đơn nháp (SCRUM-481) */}
            <button
              onClick={() => setShowDraftsModal(true)}
              className="relative flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 rounded-xl hover:bg-amber-100 transition"
              title="Danh sách đơn nháp"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Đơn nháp</span>
              {draftCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-600 text-white rounded-full text-[10px] font-bold">
                  {draftCount}
                </span>
              )}
            </button>

            {/* Nút xem chính sách chiết khấu (SCRUM-486 / SCRUM-487) */}
            <button
              onClick={() => setShowTierModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl hover:bg-indigo-100 transition"
              title="Xem và chỉnh sửa chính sách chiết khấu số lượng"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Bậc CK</span>
            </button>

            {cart.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white rounded-lg text-xs font-black shadow-sm">
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{totalItems}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Container chính ── */}
      <main className="max-w-3xl mx-auto px-3 sm:px-6 py-4 space-y-4">
        {/* Banner hiển thị khi đang mở / sửa đơn nháp (SCRUM-481) */}
        {resumingOrder && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-300 dark:border-amber-800 flex items-center justify-between gap-3 text-xs shadow-xs animate-fadeIn">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 min-w-0">
              <FileText className="w-4 h-4 shrink-0 text-amber-600" />
              <div className="min-w-0">
                <p className="font-bold truncate">Đang chỉnh sửa đơn nháp: {resumingOrder.code}</p>
                <p className="text-[11px] text-amber-600/80 dark:text-amber-400">Bạn có thể cập nhật nội dung hoặc gửi duyệt đơn này.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearDraftMode}
              className="px-2.5 py-1 text-[11px] font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 rounded-lg shrink-0 transition"
            >
              Hủy / Soạn đơn mới
            </button>
          </div>
        )}
        {/* ── Card 1: Chọn đại lý (SCRUM-474) ── */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                1. Chọn Đại Lý
              </span>
              <span className="text-rose-500 text-xs font-bold">*</span>
            </div>
            {selectedAgent && (
              <button
                onClick={() => {
                  setSelectedAgentId('');
                  setAgentSearch('');
                }}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Đổi đại lý
              </button>
            )}
          </div>

          {selectedAgent ? (
            <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/80 dark:border-indigo-800/60 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                      {selectedAgent.code}
                    </span>
                    <span className="text-xs px-2 py-0.2 rounded-full font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 text-[10px]">
                      {selectedAgent.customerGroup}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {selectedAgent.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    SĐT: <strong>{selectedAgent.phone}</strong> · Khu vực: {selectedAgent.region}
                  </p>
                </div>
              </div>

              {/* S4-02: Widget Hạn Mức & Tình Trạng Công Nợ Thời Gian Thực */}
              <div className="mt-2 pt-2 border-t border-indigo-200/60 dark:border-indigo-800/40 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1 text-indigo-700 dark:text-indigo-300">
                    <Info className="w-3.5 h-3.5" />
                    Hồ sơ hạn mức công nợ (S4-02)
                  </span>
                  {creditSummary?.status_display && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        creditSummary.status === 'blocked'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : creditSummary.status === 'warning'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {creditSummary.status_display}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="block text-[10px] text-slate-400">Hạn mức</span>
                    <strong className="text-xs text-slate-900 dark:text-white font-bold">
                      {formatCurrency(creditSummary?.credit_limit ?? selectedAgent.creditLimit ?? 50000000)}
                    </strong>
                  </div>
                  <div className="p-2 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="block text-[10px] text-slate-400">Nợ hiện tại</span>
                    <strong className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                      {formatCurrency(creditSummary?.current_debt ?? selectedAgent.outstandingDebt ?? 0)}
                    </strong>
                  </div>
                  <div className="p-2 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="block text-[10px] text-slate-400">Còn lại</span>
                    <strong
                      className={`text-xs font-bold ${
                        (creditSummary?.remaining_credit ?? 0) <= 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {formatCurrency(
                        creditSummary?.remaining_credit ??
                          Math.max(
                            0,
                            (selectedAgent.creditLimit ?? 50000000) - (selectedAgent.outstandingDebt ?? 0)
                          )
                      )}
                    </strong>
                  </div>
                </div>

                {/* Cảnh báo nợ quá hạn */}
                {creditSummary?.overdue_invoices_count > 0 && (
                  <div className="flex items-center gap-1.5 p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>
                      Đại lý có <strong>{creditSummary.overdue_invoices_count} hóa đơn quá hạn</strong> (Tổng nợ quá hạn:{' '}
                      {formatCurrency(creditSummary.overdue_debt_amount)}).
                    </span>
                  </div>
                )}

                {/* Cảnh báo đơn này vượt hạn mức */}
                {isDebt &&
                  grandTotal > (creditSummary?.remaining_credit ?? 50000000) && (
                    <div className="flex items-center gap-1.5 p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200 animate-pulse">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>
                        ⚠️ Đơn hàng ({formatCurrency(grandTotal)}) sẽ làm vượt hạn mức nợ còn lại (
                        {formatCurrency(
                          grandTotal - (creditSummary?.remaining_credit ?? 50000000)
                        )}
                        ). Đơn sẽ tự động chuyển sang <strong>Chờ Quản lý duyệt ngoại lệ (S4-05)</strong>.
                      </span>
                    </div>
                  )}
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={agentSearch}
                  onChange={(e) => {
                    setAgentSearch(e.target.value);
                    setShowAgentDropdown(true);
                  }}
                  onFocus={() => setShowAgentDropdown(true)}
                  placeholder="Gõ tên, mã ĐL hoặc số điện thoại..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {showAgentDropdown && filteredAgents.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-20 max-h-56 overflow-y-auto">
                  {filteredAgents.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setSelectedAgentId(a.id);
                        setDeliveryPoint(a.address);
                        setShowAgentDropdown(false);
                      }}
                      className="w-full flex items-start gap-3 px-3.5 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-left transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {a.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {a.code} · {a.phone} · {a.province}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Card 2: Thông tin giao hàng (SCRUM-474) ── */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
              2. Điểm Giao & Thời Gian
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                <MapPin className="w-3 h-3 inline mr-1" />
                Điểm giao hàng
              </label>
              <input
                type="text"
                value={deliveryPoint}
                onChange={(e) => setDeliveryPoint(e.target.value)}
                placeholder="Địa chỉ giao cụ thể..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                <Calendar className="w-3 h-3 inline mr-1" />
                Ngày giao mong muốn
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </section>

        {/* ── S4-04: Panel Gợi Ý Mặt Hàng Từ Lịch Sử Mua Hàng 90 Ngày ── */}
        {selectedAgent && (
          <section className="bg-gradient-to-r from-violet-50/90 to-indigo-50/80 dark:from-slate-900 dark:to-indigo-950/30 rounded-2xl border border-violet-200 dark:border-violet-900/40 p-3.5 sm:p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    Gợi ý mặt hàng thường mua (90 ngày gần nhất)
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-violet-200/80 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200">
                      S4-04
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {loadingSuggestions
                      ? 'Đang phân tích dữ liệu mua sắm...'
                      : suggestions?.total_past_orders
                      ? `Phân tích từ ${suggestions.total_past_orders} đơn hàng đã hoàn tất`
                      : 'Đại lý chưa có lịch sử mua hàng trong 90 ngày'}
                  </p>
                </div>
              </div>

              {suggestions?.suggested_products && suggestions.suggested_products.length > 0 && (
                <button
                  type="button"
                  onClick={addAllSuggestions}
                  className="px-2.5 py-1 text-xs font-bold text-violet-700 dark:text-violet-300 bg-white/90 dark:bg-slate-800 hover:bg-violet-100 rounded-xl border border-violet-200 dark:border-violet-700 transition shadow-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm tất cả gợi ý</span>
                </button>
              )}
            </div>

            {loadingSuggestions ? (
              <div className="py-4 text-center text-xs text-slate-400">
                Đang tải dữ liệu gợi ý...
              </div>
            ) : suggestions?.suggested_products && suggestions.suggested_products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {suggestions.suggested_products.map((item: any) => {
                  const qtySug = Math.max(1, Math.round(item.avg_quantity || 1));
                  const inCart = cart.find(
                    (l) => l.productId === item.product_id || l.sku === item.sku
                  );
                  return (
                    <div
                      key={item.product_id || item.sku}
                      className="p-2.5 bg-white/90 dark:bg-slate-800/90 rounded-xl border border-violet-100 dark:border-violet-900/50 flex items-center justify-between gap-2 shadow-xs hover:border-violet-300 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>SKU: {item.sku}</span>
                          <span>·</span>
                          <span className="font-semibold text-violet-700 dark:text-violet-300">
                            TB: {qtySug} {item.unit || 'cái'}
                          </span>
                          {item.last_order_date && (
                            <>
                              <span>·</span>
                              <span>Gần nhất: {item.last_order_date}</span>
                            </>
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addSuggestionToCart(item)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold shrink-0 transition flex items-center gap-1 ${
                          inCart
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-violet-600 text-white hover:bg-violet-700 shadow-xs'
                        }`}
                        title="Thêm số lượng bình quân vào đơn hàng"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{inCart ? `+${qtySug} (Đã có ${inCart.quantity})` : `+${qtySug}`}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-2 text-center text-xs text-slate-400 italic">
                Chưa có đơn hàng trong 90 ngày để trích xuất gợi ý. Hãy thêm sản phẩm ở mục bên dưới.
              </div>
            )}
          </section>
        )}

        {/* ── Card 3: Thêm hàng hoá & Chiết khấu theo số lượng (SCRUM-474 + SCRUM-486) ── */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                3. Nhập Hàng Hoá
              </span>
            </div>
            {cart.length > 0 && (
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
                {cart.length} mặt hàng
              </span>
            )}
          </div>

          {/* Ô tìm kiếm sản phẩm nhanh */}
          <div className="relative">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowProductDropdown(true);
                }}
                onFocus={() => setShowProductDropdown(true)}
                placeholder="Tìm sản phẩm theo tên, SKU hoặc quét mã..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Dropdown kết quả tìm sản phẩm */}
            {showProductDropdown && productSearch && filteredProducts.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-20 max-h-64 overflow-y-auto">
                {filteredProducts.map((p) => {
                  const inCart = cart.find((l) => l.productId === p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addToCart(p)}
                      disabled={p.stock <= 0}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-left transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 disabled:opacity-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {p.sku} · Tồn kho: <strong className="text-slate-600 dark:text-slate-300">{p.stock}</strong>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-indigo-600">{formatCurrency(p.salePrice)}</p>
                        {inCart && (
                          <span className="text-[10px] text-emerald-600 font-bold">
                            Đã thêm: ×{inCart.quantity}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Banner gợi ý mức chiết khấu đại lý (SCRUM-486) */}
          <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-indigo-950/30 dark:to-purple-950/30 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="font-semibold">Chiết khấu số lượng tự động áp dụng khi tăng số lượng!</span>
            </div>
            <button
              type="button"
              onClick={() => setShowTierModal(true)}
              className="text-[11px] font-bold text-indigo-600 hover:underline shrink-0 ml-2"
            >
              Chi tiết
            </button>
          </div>

          {/* Danh sách các dòng hàng trong giỏ (SCRUM-486 Hiển thị chiết khấu dự kiến theo số lượng) */}
          {cart.length === 0 ? (
            <div className="py-8 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.2]" />
              <p className="text-xs sm:text-sm font-semibold">Chưa có sản phẩm nào trong đơn</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Tìm và chọn sản phẩm ở thanh tìm kiếm phía trên</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((line) => {
                const rawLineSubtotal = line.unitPrice * line.quantity;
                return (
                  <div
                    key={line.productId}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                            {line.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeLine(line.productId)}
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                            title="Xóa sản phẩm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400">SKU: {line.sku}</p>

                        {/* SCRUM-486: Hiển thị giá trước và sau chiết khấu */}
                        <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
                          {line.discountPct > 0 ? (
                            <>
                              <span className="line-through text-slate-400 text-[11px]">
                                {formatCurrency(line.unitPrice)}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {formatCurrency(Math.round(line.unitPrice * (1 - line.discountPct / 100)))}/sp
                              </span>
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold">
                                <TrendingDown className="w-2.5 h-2.5" />
                                CK {line.discountPct}%
                              </span>
                            </>
                          ) : (
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {formatCurrency(line.unitPrice)}/sp
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SCRUM-486: Gợi ý nâng bậc chiết khấu (Upsell helper) */}
                    {line.neededForNext > 0 && line.nextTierPct > line.discountPct && (
                      <div className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
                        <span>
                          Mua thêm <strong>{line.neededForNext} sp</strong> để hưởng mức <strong>CK {line.nextTierPct}%</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(line.productId, line.quantity + line.neededForNext)}
                          className="font-bold text-indigo-600 dark:text-indigo-400 underline hover:no-underline ml-1"
                        >
                          +{line.neededForNext} sp
                        </button>
                      </div>
                    )}

                    {/* Bộ điều chỉnh số lượng & Thành tiền dòng */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateQty(line.productId, line.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) => updateQty(line.productId, Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-12 py-1 text-center font-bold text-xs sm:text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => updateQty(line.productId, line.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        {line.discountAmt > 0 && (
                          <p className="text-[10px] text-emerald-600 font-medium">
                            Tiết kiệm: -{formatCurrency(line.discountAmt)}
                          </p>
                        )}
                        <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(line.lineTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Card 4: Ghi chú ── */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
              4. Ghi Chú Đơn Hàng
            </span>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Yêu cầu giao hàng, điều khoản phụ, ghi chú thanh toán..."
            rows={2}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </section>

        {/* ── Card 5: Tổng hợp tiền thời gian thực (SCRUM-480) ── */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                <Tag className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                5. Tổng Hợp Tiền Real-Time
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {totalItems} sản phẩm
            </span>
          </div>

          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Tổng tiền hàng (giá gốc):</span>
              <span className="font-semibold">{formatCurrency(rawSubtotal)}</span>
            </div>

            {totalVolumeDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  Chiết khấu theo số lượng:
                </span>
                <span>-{formatCurrency(totalVolumeDiscount)}</span>
              </div>
            )}

            {/* Chiết khấu bổ sung toàn đơn */}
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Chiết khấu bổ sung:</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={extraDiscountPct || ''}
                    onChange={(e) => setExtraDiscountPct(Math.min(100, Math.max(0, Number(e.target.value))))}
                    placeholder="0"
                    className="w-14 px-2 py-1 text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-500">%</span>
                </div>
                {extraDiscountAmt > 0 && (
                  <span className="text-xs text-emerald-600 font-semibold">
                    (-{formatCurrency(extraDiscountAmt)})
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white block">
                  Số Phải Thu:
                </span>
                {totalVolumeDiscount + extraDiscountAmt > 0 && (
                  <span className="text-[11px] text-emerald-600 font-medium">
                    Tổng tiết kiệm: {formatCurrency(totalVolumeDiscount + extraDiscountAmt)}
                  </span>
                )}
              </div>
              <span className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400">
                {formatCurrency(grandTotal)}
              </span>
            </div>

            {/* Chọn ghi nợ đại lý */}
            <label className="flex items-center gap-2.5 p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/80 rounded-xl cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={isDebt}
                onChange={(e) => setIsDebt(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-600 cursor-pointer"
              />
              <div className="min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-300">
                  Ghi nợ đại lý (Thu tiền sau)
                </span>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400">
                  Đơn hàng sẽ được cộng vào công nợ của đại lý
                </p>
              </div>
            </label>
          </div>
        </section>

        {/* ── 2 nút nhỏ góc bên phải ngay dưới ô tổng hợp tiền real time ── */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          {/* Nút Lưu nháp */}
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting || !selectedAgentId || cart.length === 0}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-indigo-400 hover:text-indigo-600 dark:hover:border-indigo-500 dark:hover:text-indigo-400 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            title={!selectedAgentId ? 'Vui lòng chọn đại lý trước' : cart.length === 0 ? 'Giỏ hàng đang trống' : resumingOrder ? 'Cập nhật nội dung đơn nháp' : 'Lưu nháp đơn hàng'}
          >
            {isSubmitting && isDraft ? 'Đang lưu...' : resumingOrder ? 'Cập nhật nháp' : 'Lưu nháp'}
          </button>

          {/* Nút Tạo & Gửi đơn */}
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting || !selectedAgentId || cart.length === 0}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            title={!selectedAgentId ? 'Vui lòng chọn đại lý trước' : cart.length === 0 ? 'Giỏ hàng đang trống' : isDebt ? 'Tạo đơn ghi nợ' : 'Tạo và gửi đơn hàng'}
          >
            {isSubmitting && !isDraft ? (
              <span>Đang gửi đơn...</span>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {resumingOrder ? 'Gửi đơn hàng' : isDebt ? 'Tạo đơn ghi nợ' : 'Tạo & gửi đơn hàng'}
                </span>
              </>
            )}
          </button>
        </div>
      </main>

      {/* ── Modal Chính Sách Chiết Khấu Số Lượng (SCRUM-486 / SCRUM-487) ── */}
      <VolumeDiscountPolicyModal
        isOpen={showTierModal}
        onClose={() => setShowTierModal(false)}
        onPolicyUpdated={recalculateCartWithTiers}
      />

      {/* ── Modal Đơn Nháp (SCRUM-481) ── */}
      <DraftOrdersModal
        isOpen={showDraftsModal}
        onClose={() => setShowDraftsModal(false)}
        onSelectDraft={handleSelectDraft}
      />
    </div>
  );
};

export default AgentOrderCreate;
