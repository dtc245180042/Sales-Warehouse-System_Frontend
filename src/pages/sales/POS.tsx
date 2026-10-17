import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Search,
  Barcode,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  QrCode,
  Printer,
  ShoppingCart,
  ShoppingBag,
  User,
  X,
  Sparkles,
  TrendingDown,
  Layers,
  Info,
  ArrowRight,
  ShieldAlert,
  Lock,
  FolderOpen,
  Package,
  Zap,
  Check,
  RotateCcw,
  Receipt,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { CurrencyInput } from '../../components/common/CurrencyInput';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import { customerService } from '../../services/customerService';
import { categoryService } from '../../services/categoryService';
import { Product } from '../../types/Product';
import { Customer } from '../../types/Customer';
import { Category } from '../../types/Category';
import { OrderItem, PaymentMethod } from '../../types/Order';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { VOLUME_DISCOUNT_TIERS, getVolumeDiscountInfo } from '../../services/volumeDiscountService';
import { VolumeDiscountPolicyModal } from '../../components/sales/VolumeDiscountPolicyModal';

interface CartItem extends OrderItem {
  image?: string;
  stock: number;
  discountPct: number;
  discountAmt: number;
  neededForNext: number;
  nextTierPct: number;
}

export const POS: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // ─── Danh sách 20 sản phẩm ban đầu & phân trang/lọc ───
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);
  const [apiResponseTime, setApiResponseTime] = useState<number>(0);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);

  // Danh mục & Khách hàng
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('CUS-010'); // Default Walk-in

  // Tìm kiếm khách hàng theo tên / SĐT / Mã
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState<boolean>(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const customerSearchInputRef = useRef<HTMLInputElement>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Hóa đơn tạm
  const [invoiceCode] = useState<string>(() => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `HD-POS-${today}-${rand}`;
  });

  // Giỏ hàng Hóa đơn
  const [cart, setCart] = useState<CartItem[]>([]);
  const [manualDiscount, setManualDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0); // 0% or 8% or 10%
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashGiven, setCashGiven] = useState<number>(0);

  // Thanh tìm kiếm nhanh / Quét mã vạch bên ngoài hóa đơn
  const [quickInput, setQuickInput] = useState<string>('');
  const [quickSearchResults, setQuickSearchResults] = useState<Product[]>([]);
  const [isQuickSearching, setIsQuickSearching] = useState<boolean>(false);
  const [showQuickDropdown, setShowQuickDropdown] = useState<boolean>(false);
  const quickSearchRef = useRef<HTMLDivElement>(null);

  // Modal Giỏ Hàng & Chọn Sản Phẩm (F2)
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [pickerSearch, setPickerSearch] = useState<string>('');
  const [pickerCategory, setPickerCategory] = useState<string>('all');
  const [pickerInStockOnly, setPickerInStockOnly] = useState<boolean>(false);

  // Modal Bậc chiết khấu & Hóa đơn in
  const [showTierModal, setShowTierModal] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [isPaying, setIsPaying] = useState<boolean>(false);

  // ─── Tải 20 sản phẩm ban đầu khi vào trang POS ───
  const fetchProducts = useCallback(
    async (searchQuery: string = '', categoryQuery: string = 'all') => {
      setIsLoadingProducts(true);
      const res = await productService.getPaginated({
        page: 1,
        pageSize: 20, // Chỉ tải đúng 20 sản phẩm theo yêu cầu
        search: searchQuery,
        category: categoryQuery === 'all' ? '' : categoryQuery,
      });
      setProducts(res.items);
      setTotalProducts(res.total);
      setApiResponseTime(res.responseTimeMs);
      setIsFromCache(res.fromCache);
      setIsLoadingProducts(false);
    },
    []
  );

  useEffect(() => {
    // 1. Gọi ban đầu 20 sản phẩm
    fetchProducts('', 'all');

    // 2. Tải khách hàng & danh mục
    customerService.getAll().then(setCustomers);
    categoryService.getList().then((cats) => {
      if (Array.isArray(cats)) setCategories(cats);
    });
  }, [fetchProducts]);

  // Phím tắt bàn phím: F2 mở chọn sản phẩm
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setIsPickerOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Ẩn quick search dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickSearchRef.current && !quickSearchRef.current.contains(e.target as Node)) {
        setShowQuickDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ẩn customer search popover khi click ra ngoài
  useEffect(() => {
    const handleCustomerClickOutside = (e: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
        setIsCustomerSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleCustomerClickOutside);
    return () => document.removeEventListener('mousedown', handleCustomerClickOutside);
  }, []);

  // Chuẩn hóa tiếng Việt không dấu để tìm kiếm thông minh
  const removeVietnameseTones = (str: string) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  };

  // Danh sách khách hàng sau khi lọc theo từ khóa tìm kiếm
  const filteredCustomerList = useMemo(() => {
    const q = removeVietnameseTones(customerSearchQuery.trim());
    if (!q) return customers.slice(0, 20);
    return customers.filter((c) => {
      const nameMatch = removeVietnameseTones(c.name || '').includes(q);
      const phoneMatch = (c.phone || '').includes(q);
      const idMatch = removeVietnameseTones(c.id || '').includes(q);
      return nameMatch || phoneMatch || idMatch;
    });
  }, [customers, customerSearchQuery]);

  // Tìm kiếm nhanh ngoài hóa đơn (Debounce 150ms + Micro-cache < 2ms)
  useEffect(() => {
    const q = quickInput.trim();
    if (!q) {
      setQuickSearchResults([]);
      setShowQuickDropdown(false);
      return;
    }

    setIsQuickSearching(true);
    const timer = setTimeout(async () => {
      const res = await productService.getPaginated({
        page: 1,
        pageSize: 10,
        search: q,
      });
      setQuickSearchResults(res.items);
      setIsQuickSearching(false);
      setShowQuickDropdown(true);
    }, 150);

    return () => clearTimeout(timer);
  }, [quickInput]);

  // Khi thay đổi tìm kiếm hoặc danh mục trong Modal Chọn Sản Phẩm (Debounce 180ms)
  useEffect(() => {
    if (!isPickerOpen) return;
    const timer = setTimeout(() => {
      fetchProducts(pickerSearch, pickerCategory);
    }, 180);
    return () => clearTimeout(timer);
  }, [pickerSearch, pickerCategory, isPickerOpen, fetchProducts]);

  // Helper tính dòng giỏ hàng kèm chiết khấu theo số lượng (SCRUM-486)
  const buildCartItem = (product: Product, quantity: number): CartItem => {
    const { discountPct, nextTier, neededForNext } = getVolumeDiscountInfo(quantity);
    const rawTotal = product.salePrice * quantity;
    const discountAmt = Math.round((rawTotal * discountPct) / 100);
    const subtotal = rawTotal - discountAmt;

    return {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      price: product.salePrice,
      quantity,
      discount: discountAmt,
      discountPct,
      discountAmt,
      subtotal,
      image: product.image,
      stock: product.stock,
      neededForNext,
      nextTierPct: nextTier ? nextTier.discountPct : discountPct,
    };
  };

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const isCustomerLocked = selectedCustomer?.status === 'locked';

  const addToCart = (product: Product, quantityDelta: number = 1) => {
    if (product.stock <= 0) {
      showToast(`${product.name} đã hết hàng trong kho`, 'error');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        const newQty = existing.quantity + quantityDelta;
        if (newQty > product.stock) {
          showToast(`Chỉ còn ${product.stock} sản phẩm khả dụng trong kho`, 'warning');
          return prev;
        }
        if (newQty <= 0) {
          return prev.filter((item) => item.productId !== product.id);
        }
        return prev.map((item) =>
          item.productId === product.id ? buildCartItem(product, newQty) : item
        );
      } else {
        if (quantityDelta <= 0) return prev;
        return [...prev, buildCartItem(product, quantityDelta)];
      }
    });
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.stock) {
              showToast(`Đã đạt giới hạn tồn kho (${item.stock})`, 'warning');
              return item;
            }
            if (newQty <= 0) return { ...item, quantity: 0 };
            const { discountPct, nextTier, neededForNext } = getVolumeDiscountInfo(newQty);
            const rawTotal = item.price * newQty;
            const discountAmt = Math.round((rawTotal * discountPct) / 100);
            return {
              ...item,
              quantity: newQty,
              discount: discountAmt,
              discountPct,
              discountAmt,
              subtotal: rawTotal - discountAmt,
              neededForNext,
              nextTierPct: nextTier ? nextTier.discountPct : discountPct,
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleDirectQtyChange = (productId: string, val: number) => {
    const qty = Math.max(0, val);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            if (qty > item.stock) {
              showToast(`Chỉ còn ${item.stock} sản phẩm khả dụng`, 'warning');
              return item;
            }
            if (qty === 0) return { ...item, quantity: 0 };
            const { discountPct, nextTier, neededForNext } = getVolumeDiscountInfo(qty);
            const rawTotal = item.price * qty;
            const discountAmt = Math.round((rawTotal * discountPct) / 100);
            return {
              ...item,
              quantity: qty,
              discount: discountAmt,
              discountPct,
              discountAmt,
              subtotal: rawTotal - discountAmt,
              neededForNext,
              nextTierPct: nextTier ? nextTier.discountPct : discountPct,
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  // Quét mã vạch hoặc nhấn Enter ở ô tìm kiếm nhanh ngoài hóa đơn
  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = quickInput.trim();
    if (!q) return;

    // Tìm trong kết quả nhanh hoặc products
    const found =
      quickSearchResults.find(
        (p) =>
          p.barcode === q ||
          p.sku.toLowerCase() === q.toLowerCase() ||
          p.name.toLowerCase() === q.toLowerCase()
      ) ||
      products.find(
        (p) =>
          p.barcode === q ||
          p.sku.toLowerCase() === q.toLowerCase() ||
          p.name.toLowerCase() === q.toLowerCase()
      ) ||
      quickSearchResults[0];

    if (found) {
      addToCart(found);
      setQuickInput('');
      setShowQuickDropdown(false);
      showToast(`Đã thêm "${found.name}" vào hóa đơn`, 'success');
    } else {
      showToast(`Không tìm thấy sản phẩm khớp với "${q}"`, 'error');
    }
  };

  // Tính toán tiền hóa đơn
  const rawSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const volumeDiscountTotal = cart.reduce((sum, item) => sum + item.discountAmt, 0);
  const afterVolumeDiscount = rawSubtotal - volumeDiscountTotal;
  const totalDiscount = volumeDiscountTotal + (manualDiscount || 0);
  const taxAmount = Math.round(Math.max(0, afterVolumeDiscount - manualDiscount) * (taxRate / 100));
  const total = Math.max(0, afterVolumeDiscount - manualDiscount + taxAmount);
  const changeAmount = Math.max(0, (cashGiven || 0) - total);
  const totalItemsCount = cart.reduce((s, i) => s + i.quantity, 0);

  // Mặc định khách đưa = tổng tiền nếu đang ở chế độ tiền mặt
  useEffect(() => {
    if (paymentMethod === 'cash') {
      setCashGiven(total);
    }
  }, [total, paymentMethod]);

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Bạn có chắc chắn muốn hủy bỏ toàn bộ mặt hàng trong hóa đơn này?')) {
      setCart([]);
      setManualDiscount(0);
      showToast('Đã làm mới hóa đơn', 'info');
    }
  };

  const handleCheckout = async () => {
    if (isCustomerLocked) {
      showToast(`Đại lý '${selectedCustomer?.name}' đang bị khoá giao dịch. Không thể tạo đơn mới!`, 'error');
      return;
    }

    if (cart.length === 0) {
      showToast('Hóa đơn đang trống! Vui lòng thêm sản phẩm vào hóa đơn.', 'warning');
      return;
    }

    if (paymentMethod === 'cash' && cashGiven < total) {
      showToast('Số tiền khách đưa chưa đủ để thanh toán', 'warning');
      return;
    }

    setIsPaying(true);
    try {
      const customer = customers.find((c) => c.id === selectedCustomerId);
      const newOrder = await orderService.create({
        customerId: customer?.id || 'CUS-010',
        customerName: customer?.name || 'Khách Lẻ Tại Quầy',
        customerPhone: customer?.phone || '0900000000',
        items: cart.map(({ image, stock, discountPct, discountAmt, neededForNext, nextTierPct, ...rest }) => rest),
        subtotal: rawSubtotal,
        discount: totalDiscount,
        tax: taxAmount,
        total,
        paidAmount: paymentMethod === 'cash' ? cashGiven : total,
        changeAmount: paymentMethod === 'cash' ? changeAmount : 0,
        paymentMethod,
        paymentStatus: 'paid',
        status: 'completed',
        staffId: user?.id || 'USR-003',
        staffName: user?.name || 'Thu Ngân',
        note: `Đơn hàng POS bán tại quầy${volumeDiscountTotal > 0 ? ` (Chiết khấu SL: ${formatCurrency(volumeDiscountTotal)})` : ''}`,
      });

      setCompletedOrder({
        ...newOrder,
        code: newOrder.code || invoiceCode,
        volumeDiscountTotal,
        items: [...cart],
      });
      setIsReceiptModalOpen(true);
      setCart([]);
      setManualDiscount(0);
      showToast(`Thanh toán thành công! Mã đơn: ${newOrder.code || invoiceCode}`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi thanh toán đơn hàng';
      showToast(msg, 'error');
    } finally {
      setIsPaying(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // Lọc sản phẩm trong modal (kết hợp tồn kho)
  const modalFilteredProducts = useMemo(() => {
    if (!pickerInStockOnly) return products;
    return products.filter((p) => p.stock > 0);
  }, [products, pickerInStockOnly]);

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-3 overflow-hidden text-slate-800 dark:text-slate-100">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER HÓA ĐƠN & THÔNG TIN QUẦY POS
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Hóa Đơn Bán Lẻ POS
              </h2>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {invoiceCode}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>Thu ngân: <strong className="text-slate-700 dark:text-slate-300">{user?.name || 'Quản trị hệ thống'}</strong></span>
              <span>•</span>
              <span>Thời gian: {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
            </p>
          </div>
        </div>

        {/* Khách hàng & Đại lý Dropdown */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Khách hàng & Đại lý Dropdown + Nút Tìm Kiếm Thông Minh */}
          <div ref={customerDropdownRef} className="relative">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
              <User className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="text-xs text-slate-400 font-medium">Khách hàng:</span>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="bg-transparent border-0 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer max-w-[170px] truncate"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id} className="dark:bg-slate-800">
                    {c.name} {c.status === 'locked' ? '(⛔ BỊ KHOÁ GD)' : `(${c.phone})`}
                  </option>
                ))}
              </select>

              {/* Nút tìm kiếm nếu không thấy tên trong danh sách */}
              <button
                type="button"
                id="btn-customer-search-toggle"
                onClick={() => {
                  setIsCustomerSearchOpen((prev) => !prev);
                  if (!isCustomerSearchOpen) {
                    setTimeout(() => customerSearchInputRef.current?.focus(), 80);
                  }
                }}
                className={`p-1 rounded-lg transition flex items-center justify-center ${
                  isCustomerSearchOpen
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 bg-indigo-50 dark:bg-indigo-950/40'
                }`}
                title="Gõ tìm kiếm tên khách hàng, số điện thoại..."
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Popover gõ tìm tên khách hàng */}
            {isCustomerSearchOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 p-3 space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-indigo-600" />
                    Tìm kiếm khách hàng / đại lý
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCustomerSearchOpen(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={customerSearchInputRef}
                    type="text"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    placeholder="Nhập tên khách hàng, SĐT hoặc mã đại lý..."
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                  {customerSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCustomerSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1">
                  {filteredCustomerList.length > 0 ? (
                    filteredCustomerList.map((c) => {
                      const isSelected = c.id === selectedCustomerId;
                      const isLocked = c.status === 'locked';
                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomerId(c.id);
                            setIsCustomerSearchOpen(false);
                            showToast(`Đã chọn khách hàng: ${c.name}`, 'info');
                          }}
                          className={`p-2 rounded-xl flex items-center justify-between gap-2.5 cursor-pointer transition ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                                isLocked
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                                  : isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {c.name ? c.name.charAt(0).toUpperCase() : 'K'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                {c.name}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                SĐT: {c.phone || 'Chưa cập nhật'} | Mã: {c.id}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            {isLocked ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                ⛔ KHOÁ GD
                              </span>
                            ) : isSelected ? (
                              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
                                <Check className="w-3 h-3" /> Đang chọn
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Không tìm thấy khách hàng nào khớp với "{customerSearchQuery}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowTierModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition border border-indigo-200/50 dark:border-indigo-800/50 shadow-sm"
            title="Xem bảng chiết khấu số lượng"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Bậc CK</span>
          </button>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={handleClearCart}
              className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition border border-rose-200 dark:border-rose-800/40"
              title="Hủy hóa đơn hiện tại"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Cảnh báo nếu khách hàng bị khóa giao dịch */}
      {isCustomerLocked && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-800 dark:text-rose-200 flex items-center justify-between text-xs animate-pulse">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>CẢNH BÁO:</strong> Đại lý <strong>'{selectedCustomer?.name}'</strong> đang bị khoá giao dịch do nợ quá hạn. Không thể hoàn tất hóa đơn!
            </span>
          </div>
          <span className="font-mono text-[10px] bg-rose-200 dark:bg-rose-900 px-2 py-0.5 rounded font-bold">KHOÁ GD</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. THANH THAO TÁC BÁN HÀNG NHANH & NÚT CHỌN SẢN PHẨM (F2)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        {/* Nút lớn Mở Giỏ Hàng / Chọn Sản Phẩm */}
        <button
          type="button"
          id="btn-open-product-picker"
          onClick={() => setIsPickerOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/25 transition-all transform active:scale-95 group shrink-0"
        >
          <ShoppingBag className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          <span>Mở Giỏ Hàng Chọn Sản Phẩm</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-white/20 text-white font-mono font-bold">
            F2
          </span>
          {totalItemsCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-emerald-400 text-slate-950 font-black animate-bounce">
              {totalItemsCount} món
            </span>
          )}
        </button>

        {/* Ô quét mã vạch hoặc tìm kiếm nhanh sản phẩm thêm trực tiếp */}
        <div ref={quickSearchRef} className="relative flex-1 w-full max-w-xl">
          <form onSubmit={handleQuickSubmit} className="relative flex items-center">
            <Barcode className="w-4 h-4 absolute left-3.5 text-indigo-500" />
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              onFocus={() => quickInput.trim() && setShowQuickDropdown(true)}
              placeholder="Quét mã vạch hoặc gõ tên sản phẩm, mã SKU rồi nhấn [Enter]..."
              className="w-full pl-10 pr-24 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
            {quickInput && (
              <button
                type="button"
                onClick={() => { setQuickInput(''); setShowQuickDropdown(false); }}
                className="absolute right-12 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 px-2.5 py-1 text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition"
            >
              Thêm
            </button>
          </form>

          {/* Dropdown kết quả tìm kiếm nhanh (< 2ms) */}
          {showQuickDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              <div className="p-2 text-[11px] font-semibold text-slate-400 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <span>Gợi ý tìm kiếm nhanh ({quickSearchResults.length})</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Zap className="w-3 h-3" /> Siêu tốc
                </span>
              </div>
              {quickSearchResults.length > 0 ? (
                quickSearchResults.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      addToCart(prod);
                      setQuickInput('');
                      setShowQuickDropdown(false);
                      showToast(`Đã thêm "${prod.name}"`, 'success');
                    }}
                    className="p-2.5 hover:bg-indigo-50/70 dark:hover:bg-slate-800 flex items-center justify-between gap-3 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {prod.image ? (
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-8 h-8 rounded-lg object-cover bg-slate-100"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0 truncate">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          {prod.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          SKU: {prod.sku} | Tồn: <strong className={prod.stock <= 0 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}>{prod.stock}</strong>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(prod.salePrice)}
                      </p>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        + Thêm vào đơn
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  Không tìm thấy sản phẩm nào khớp với "{quickInput}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. KHÔNG GIAN HÓA ĐƠN CHÍNH (INVOICE WORKSPACE: 65% Items | 35% Payment)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0 overflow-hidden">
        {/* BẢNG CHI TIẾT MẶT HÀNG TRONG HÓA ĐƠN (65%) */}
        <div className="lg:w-2/3 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Chi Tiết Mặt Hàng Trong Hóa Đơn
              </span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full">
                {cart.length} mặt hàng ({totalItemsCount} sp)
              </span>
            </div>
            {cart.length > 0 && (
              <span className="text-[11px] text-slate-400">
                Giá đã tự động tính chiết khấu theo số lượng (SCRUM-486)
              </span>
            )}
          </div>

          {/* Danh sách các dòng mặt hàng */}
          <div className="flex-1 overflow-y-auto p-2">
            {cart.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {cart.map((item, index) => (
                  <div
                    key={item.productId}
                    className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 rounded-xl transition"
                  >
                    {/* Thông tin sản phẩm */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-xs font-mono font-bold text-slate-400 w-5 text-center">
                        {index + 1}
                      </span>
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-11 h-11 rounded-xl object-cover shrink-0 bg-slate-100 dark:bg-slate-800"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                          <span>SKU: {item.sku}</span>
                          <span>•</span>
                          <span>Tồn kho: <strong className="text-slate-700 dark:text-slate-300">{item.stock}</strong></span>
                        </div>
                        {/* Gợi ý bậc chiết khấu tiếp theo */}
                        {item.neededForNext > 0 && item.nextTierPct > item.discountPct && (
                          <div className="mt-1 text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md inline-flex items-center gap-1.5 font-medium">
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                            <span>
                              Thêm <strong>{item.neededForNext} sp</strong> để hưởng mức <strong>CK {item.nextTierPct}%</strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.productId, item.neededForNext)}
                              className="font-bold underline hover:no-underline ml-1"
                            >
                              +{item.neededForNext}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Đơn giá & Số lượng & Thành tiền */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      {/* Đơn giá */}
                      <div className="text-right min-w-[90px]">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {formatCurrency(item.price)}
                        </p>
                        {item.discountPct > 0 && (
                          <span className="inline-block text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            CK {item.discountPct}% (-{formatCurrency(item.discountAmt)})
                          </span>
                        )}
                      </div>

                      {/* Bộ điều khiển số lượng */}
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.productId, -1)}
                          className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={item.stock}
                          value={item.quantity}
                          onChange={(e) => handleDirectQtyChange(item.productId, Number(e.target.value))}
                          className="w-10 text-center text-xs font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.productId, 1)}
                          className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Thành tiền */}
                      <div className="text-right min-w-[100px]">
                        <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(item.subtotal)}
                        </p>
                      </div>

                      {/* Xóa */}
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.productId, -item.quantity)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                        title="Xóa khỏi hóa đơn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mb-3">
                  <ShoppingCart className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Hóa đơn hiện chưa có sản phẩm nào
                </h4>
                <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">
                  Bấm vào nút bên dưới (hoặc phím tắt <strong>F2</strong>) để mở giỏ hàng chọn sản phẩm, hoặc quét mã vạch ở thanh trên.
                </p>
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Chọn sản phẩm vào hóa đơn (F2)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* KHỐI THANH TOÁN & TỔNG TIỀN (35%) */}
        <div className="lg:w-1/3 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Thanh Toán Hóa Đơn
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">
              Tổng: {formatCurrency(total)}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {/* Chi tiết tính tiền */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Tạm tính (giá gốc):</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(rawSubtotal)}</span>
              </div>

              {volumeDiscountTotal > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Chiết khấu theo số lượng:
                  </span>
                  <span>-{formatCurrency(volumeDiscountTotal)}</span>
                </div>
              )}

              {/* Giảm giá thêm & Thuế */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-slate-500 block mb-1">Giảm giá thêm (VNĐ):</span>
                  <CurrencyInput
                    value={manualDiscount || 0}
                    onChange={(val) => setManualDiscount(val)}
                    placeholder="0"
                    suffix="đ"
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-right font-mono"
                  />
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Thuế VAT:</span>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value={0}>0% (Không thuế)</option>
                    <option value={8}>8% (VAT ưu đãi)</option>
                    <option value={10}>10% (VAT chuẩn)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Phương thức thanh toán */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 block mb-1.5 font-medium">
                Phương thức thanh toán:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-xs font-semibold border transition ${
                    paymentMethod === 'cash'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Tiền mặt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-xs font-semibold border transition ${
                    paymentMethod === 'transfer'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Chuyển khoản</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-xs font-semibold border transition ${
                    paymentMethod === 'card'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Quẹt thẻ</span>
                </button>
              </div>
            </div>

            {/* Chi tiết tiền khách đưa (nếu là tiền mặt) */}
            {paymentMethod === 'cash' && (
              <div className="space-y-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Khách đưa (VNĐ):</span>
                  <CurrencyInput
                    value={cashGiven}
                    onChange={(val) => setCashGiven(val)}
                    placeholder="0"
                    suffix="đ"
                    className="w-40 px-2.5 py-1 text-right bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Tiền thừa trả khách:</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatCurrency(changeAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* Hiển thị QR chuyển khoản nếu chọn hình thức chuyển khoản */}
            {paymentMethod === 'transfer' && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-1">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Mã QR Thanh Toán VietQR
                </p>
                <div className="w-32 h-32 mx-auto bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-slate-800" />
                </div>
                <p className="text-[10px] text-slate-400">
                  Nội dung CK: <strong className="font-mono text-slate-700 dark:text-slate-300">{invoiceCode}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Chân trang thanh toán: Tổng tiền & Nút hoàn tất */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block font-medium">TỔNG THANH TOÁN:</span>
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(total)}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {totalItemsCount} sản phẩm
              </span>
            </div>

            <Button
              id="btn-pos-checkout"
              variant={isCustomerLocked ? 'secondary' : 'primary'}
              size="lg"
              onClick={handleCheckout}
              isLoading={isPaying}
              disabled={cart.length === 0 || isCustomerLocked}
              className={`w-full py-3.5 font-bold text-sm rounded-xl shadow-lg ${
                isCustomerLocked
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25'
              }`}
              leftIcon={isCustomerLocked ? <Lock className="w-4 h-4 text-slate-400" /> : <CheckCircle2 className="w-4 h-4" />}
            >
              {isCustomerLocked ? 'Đại lý đang bị khoá' : 'Thanh Toán & In Hóa Đơn'}
            </Button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. MODAL GIỎ HÀNG & CHỌN SẢN PHẨM (F2)
             - Chỉ gọi API tải 20 sản phẩm ban đầu
             - Gọi API khi lọc từ khóa/danh mục
             - Tốc độ phản hồi < 2ms với RAM micro-cache
          ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        title="Giỏ Hàng & Tra Cứu Sản Phẩm (POS)"
        maxWidth="4xl"
        footer={
          <div className="w-full flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Đã chọn: <strong className="text-indigo-600 font-bold">{totalItemsCount}</strong> sản phẩm | Tổng tiền: <strong className="text-indigo-600 font-bold">{formatCurrency(total)}</strong>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setIsPickerOpen(false)}>
                Đóng (Esc)
              </Button>
              <Button
                variant="primary"
                onClick={() => setIsPickerOpen(false)}
                leftIcon={<Check className="w-4 h-4" />}
              >
                Hoàn Tất & Về Hóa Đơn
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Header trạng thái tải & đo tốc độ */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Hiển thị 20 sản phẩm | Tổng kho: {totalProducts.toLocaleString()} sp
              </span>
              {isLoadingProducts && (
                <span className="text-indigo-600 font-bold animate-pulse">• Đang tải...</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                  apiResponseTime <= 2
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>{apiResponseTime} ms</span>
                <span>({isFromCache ? 'RAM Cache < 2ms' : 'API'})</span>
              </span>
            </div>
          </div>

          {/* Thanh tìm kiếm & Tabs danh mục trong modal */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                placeholder="Nhập tên sản phẩm, mã SKU hoặc mã vạch để lọc (phản hồi siêu tốc < 2ms)..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {pickerSearch && (
                <button
                  type="button"
                  onClick={() => setPickerSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Danh mục tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                type="button"
                onClick={() => setPickerCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  pickerCategory === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Tất cả
              </button>
              {categories.slice(0, 15).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setPickerCategory(cat.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    pickerCategory === cat.name
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Lưới sản phẩm (Grid) trong Modal */}
          <div className="max-h-[50vh] overflow-y-auto pr-1">
            {modalFilteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {modalFilteredProducts.map((p) => {
                  const cartItem = cart.find((i) => i.productId === p.id);
                  const inCartQty = cartItem?.quantity || 0;
                  const isOutOfStock = p.stock <= 0;

                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                        isOutOfStock
                          ? 'border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50 dark:bg-slate-900/50'
                          : inCartQty > 0
                          ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-indigo-400'
                      }`}
                    >
                      {/* Ảnh & Tên */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="text-[10px] text-slate-400 font-mono block truncate">
                              {p.sku}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                p.stock <= 0
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              Tồn: {p.stock}
                            </span>
                          </div>
                        </div>

                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight">
                          {p.name}
                        </h4>
                      </div>

                      {/* Giá & Nút chọn */}
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 truncate">
                          {formatCurrency(p.salePrice)}
                        </span>

                        {isOutOfStock ? (
                          <span className="text-[10px] text-rose-500 font-bold">Hết hàng</span>
                        ) : inCartQty > 0 ? (
                          <div className="flex items-center border border-indigo-300 dark:border-indigo-700 rounded-lg bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(p.id, -1)}
                              className="w-6 h-6 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                              {inCartQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => addToCart(p, 1)}
                              className="w-6 h-6 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToCart(p, 1)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white dark:bg-indigo-950/60 dark:text-indigo-400 rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Thêm</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">
                <FolderOpen className="w-10 h-10 mx-auto mb-2 text-indigo-400" />
                <p className="text-xs font-semibold">Không tìm thấy sản phẩm nào khớp với bộ lọc</p>
                <button
                  type="button"
                  onClick={() => { setPickerSearch(''); setPickerCategory('all'); }}
                  className="mt-2 text-xs text-indigo-600 font-bold hover:underline"
                >
                  Xóa bộ lọc để xem 20 sản phẩm mặc định
                </button>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          5. MODAL BẬC CHIẾT KHẤU SỐ LƯỢNG (SCRUM-486)
          ───────────────────────────────────────────────────────────── */}
      <VolumeDiscountPolicyModal
        isOpen={showTierModal}
        onClose={() => setShowTierModal(false)}
        onPolicyUpdated={() => {
          setCart((prev) =>
            prev.map((it) => {
              const { discountPct, nextTier, neededForNext } = getVolumeDiscountInfo(it.quantity);
              const discountAmt = Math.round((it.price * it.quantity * discountPct) / 100);
              return {
                ...it,
                discountPct,
                discountAmt,
                subtotal: it.price * it.quantity - discountAmt,
                neededForNext,
                nextTierPct: nextTier ? nextTier.discountPct : discountPct,
              };
            })
          );
        }}
      />

      {/* ─────────────────────────────────────────────────────────────
          6. MODAL IN HÓA ĐƠN BÁN LẺ POS SAU KHI THANH TOÁN
          ───────────────────────────────────────────────────────────── */}
      {completedOrder && (
        <Modal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          title="Hóa Đơn Bán Lẻ POS (Thanh toán hoàn tất)"
          maxWidth="sm"
          footer={
            <div className="w-full flex items-center justify-between gap-3">
              <Button variant="secondary" onClick={() => setIsReceiptModalOpen(false)}>
                Đóng
              </Button>
              <Button
                variant="primary"
                onClick={handlePrintReceipt}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                In hóa đơn (Print)
              </Button>
            </div>
          }
        >
          <div id="printable-receipt" className="p-4 bg-white text-slate-900 text-xs font-mono">
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h2 className="text-base font-bold uppercase tracking-wider">Hệ Thống Quản Lý Kho & POS</h2>
              <p className="text-[11px] text-slate-500">Sales Warehouse System POS</p>
              <p className="text-[10px] text-slate-400 mt-1">Đ/c: 128 Lê Lợi, Bến Nghé, Q1, TP. HCM</p>
              <p className="text-[10px] text-slate-400">Hotline: 1900 6868</p>
            </div>

            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Mã đơn:</span>
                <span className="font-bold">{completedOrder.code}</span>
              </div>
              <div className="flex justify-between">
                <span>Thời gian:</span>
                <span>{formatDate(completedOrder.createdAt || new Date().toISOString())}</span>
              </div>
              <div className="flex justify-between">
                <span>Thu ngân:</span>
                <span>{completedOrder.staffName}</span>
              </div>
              <div className="flex justify-between">
                <span>Khách hàng:</span>
                <span className="font-bold">{completedOrder.customerName}</span>
              </div>
            </div>

            {/* Mặt hàng */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-2">
              {completedOrder.items?.map((it: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start text-[11px]">
                  <div className="flex-1 pr-2">
                    <p className="font-semibold">{it.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {it.quantity} x {formatCurrency(it.price)}
                      {it.discountAmt > 0 && ` (-${formatCurrency(it.discountAmt)})`}
                    </p>
                  </div>
                  <span className="font-bold shrink-0">{formatCurrency(it.subtotal)}</span>
                </div>
              ))}
            </div>

            {/* Tổng cộng */}
            <div className="pt-2.5 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <span>{formatCurrency(completedOrder.subtotal)}</span>
              </div>
              {completedOrder.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Tổng giảm giá:</span>
                  <span>-{formatCurrency(completedOrder.discount)}</span>
                </div>
              )}
              {completedOrder.tax > 0 && (
                <div className="flex justify-between">
                  <span>VAT:</span>
                  <span>+{formatCurrency(completedOrder.tax)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-slate-400">
                <span>TỔNG CỘNG:</span>
                <span className="text-indigo-600">{formatCurrency(completedOrder.total)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>Phương thức:</span>
                <span className="uppercase">{completedOrder.paymentMethod}</span>
              </div>
              {completedOrder.paymentMethod === 'cash' && (
                <>
                  <div className="flex justify-between">
                    <span>Tiền khách đưa:</span>
                    <span>{formatCurrency(completedOrder.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tiền thối lại:</span>
                    <span className="font-bold">{formatCurrency(completedOrder.changeAmount)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="text-center pt-4 text-[10px] text-slate-400 border-t border-dashed border-slate-300 mt-3">
              <p>Cảm ơn quý khách và hẹn gặp lại!</p>
              <p>Quý khách vui lòng kiểm tra hàng trước khi rời quầy.</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default POS;
