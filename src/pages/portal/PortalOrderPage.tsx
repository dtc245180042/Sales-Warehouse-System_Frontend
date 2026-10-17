import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Package,
  Search,
  CreditCard,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  Trash2,
  X,
  PackageCheck,
  Send,
  Loader2,
  MapPin,
  Calendar,
  Clock,
  LogOut,
  LayoutGrid,
  List,
  Check,
  FileText,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Info,
  Layers,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import {
  portalService,
  PortalProduct,
  PortalCredit,
  PortalProfile,
  PortalDeliveryAddress,
  CartCalculationResult
} from '../../services/portalService';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/formatters';

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

interface CartItem {
  product: PortalProduct;
  quantity: number;
}

export const PortalOrderPage: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Core Data State
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [credit, setCredit] = useState<PortalCredit | null>(null);
  const [products, setProducts] = useState<PortalProduct[]>([]);
  const [deliveryAddresses, setDeliveryAddresses] = useState<PortalDeliveryAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [expectedDate, setExpectedDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // UI & View State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [loading, setLoading] = useState(true);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Cart & Calculation
  const [cart, setCart] = useState<CartItem[]>([]);
  const [calculating, setCalculating] = useState(false);
  const [calcResult, setCalcResult] = useState<CartCalculationResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draftSavedToast, setDraftSavedToast] = useState(false);

  // Over limit confirmation modal
  const [showOverLimitConfirm, setShowOverLimitConfirm] = useState(false);

  // Load initial portal data
  useEffect(() => {
    loadPortalData();
  }, []);

  const loadPortalData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [profData, credData, prodsData, addrData] = await Promise.all([
        portalService.getProfile(),
        portalService.getCredit(),
        portalService.getProducts({ limit: 100 }),
        portalService.getDeliveryAddresses(),
      ]);
      setProfile(profData);
      setCredit(credData);
      setProducts(prodsData.items);
      setDeliveryAddresses(addrData);
      if (addrData.length > 0) {
        const defaultAddr = addrData.find((a) => a.is_default) || addrData[0];
        setSelectedAddressId(defaultAddr.id);
      }

      // Check saved draft in localStorage
      try {
        const savedDraft = localStorage.getItem('portal_order_draft');
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCart(parsed);
          }
        }
      } catch (e) {
        console.error('Lỗi nạp bản nháp:', e);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể tải dữ liệu cổng đại lý.');
    } finally {
      setLoading(false);
    }
  };

  // Categories list
  const categories = useMemo(() => {
    const units = Array.from(new Set(products.map((p) => p.unit).filter(Boolean)));
    return ['all', ...units];
  }, [products]);

  // Filter products by search & category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || p.unit === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  // Frequently purchased items for quick add
  const popularProducts = useMemo(() => {
    return products.slice(0, 4);
  }, [products]);

  // Cart Management
  const updateQuantity = (product: PortalProduct, delta: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (!existing && delta > 0) {
        return [...prev, { product, quantity: delta }];
      }
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) {
          return prev.filter((item) => item.product.id !== product.id);
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return prev;
    });
  };

  const setDirectQuantity = (product: PortalProduct, qtyStr: string) => {
    const val = parseInt(qtyStr, 10);
    const qty = isNaN(val) || val < 0 ? 0 : val;
    setCart((prev) => {
      if (qty === 0) {
        return prev.filter((item) => item.product.id !== product.id);
      }
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: qty } : item
        );
      }
      return [...prev, { product, quantity: qty }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('portal_order_draft');
  };

  const saveDraft = () => {
    if (cart.length === 0) {
      alert('Chưa có sản phẩm nào để lưu nháp.');
      return;
    }
    localStorage.setItem('portal_order_draft', JSON.stringify(cart));
    setDraftSavedToast(true);
    setTimeout(() => setDraftSavedToast(false), 3000);
  };

  // Recalculate cart totals with Server
  useEffect(() => {
    if (cart.length === 0) {
      setCalcResult(null);
      return;
    }
    const timer = setTimeout(async () => {
      setCalculating(true);
      try {
        const payload = cart.map((c) => ({
          product_id: c.product.id,
          quantity: c.quantity,
          unit: c.product.unit,
        }));
        const result = await portalService.calculateCart(payload);
        setCalcResult(result);
      } catch (err: any) {
        console.error('Lỗi tính giỏ hàng:', err);
      } finally {
        setCalculating(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [cart]);

  // Financial Computations
  const totalItemsCount = useMemo(() => cart.reduce((sum, itm) => sum + itm.quantity, 0), [cart]);
  const estimatedSubtotal = useMemo(() => {
    if (calcResult) return calcResult.subtotal;
    return cart.reduce((sum, itm) => sum + itm.product.sale_price * itm.quantity, 0);
  }, [cart, calcResult]);

  const estimatedDiscount = useMemo(() => {
    return calcResult ? calcResult.total_discount : 0;
  }, [calcResult]);

  const estimatedTotal = useMemo(() => {
    if (calcResult) return calcResult.total_amount;
    return Math.max(0, estimatedSubtotal - estimatedDiscount);
  }, [estimatedSubtotal, estimatedDiscount, calcResult]);

  // Credit limit evaluation
  const creditLimit = credit ? credit.credit_limit : 0;
  const currentUsedCredit = credit ? credit.total_used_credit : 0;
  const availableCredit = credit ? credit.available_credit : 0;
  const forecastUsedCredit = currentUsedCredit + estimatedTotal;
  const forecastRemainingCredit = Math.max(0, creditLimit - forecastUsedCredit);
  const forecastPercentage = creditLimit > 0 ? Math.min(100, Math.round((forecastUsedCredit / creditLimit) * 100)) : 0;
  const isCreditExceeded = creditLimit > 0 && forecastUsedCredit > creditLimit;

  // Primary Action Click Handler (Always bright and responsive!)
  const handlePrimarySubmitClick = () => {
    if (cart.length === 0) {
      alert('Vui lòng thêm ít nhất một sản phẩm vào đơn hàng trước khi gửi duyệt.');
      return;
    }
    if (!selectedAddressId) {
      alert('Vui lòng chọn địa chỉ nhận hàng.');
      return;
    }

    if (isCreditExceeded) {
      // Prompt confirmation for exceeding credit limit
      setShowOverLimitConfirm(true);
      return;
    }

    executeSubmitOrder();
  };

  // Submit Order to backend
  const executeSubmitOrder = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    setShowOverLimitConfirm(false);
    try {
      const idempotencyKey = generateUUID();
      const payload = {
        expected_total: estimatedTotal,
        delivery_address_id: selectedAddressId!,
        delivery_notes: deliveryNotes.trim() ? `[Giao ngày ${expectedDate}] ${deliveryNotes.trim()}` : `[Giao ngày ${expectedDate}]`,
        items: cart.map((c) => ({
          product_id: c.product.id,
          quantity: c.quantity,
          unit: c.product.unit,
        })),
      };

      const res = await portalService.createOrder(payload, idempotencyKey);
      setSuccessOrder(res);
      clearCart();
      setIsMobileCartOpen(false);

      // Refresh credit status
      const updatedCred = await portalService.getCredit();
      setCredit(updatedCred);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể gửi đơn hàng. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans pb-24 xl:pb-12 selection:bg-indigo-500 selection:text-white">
      {/* 1. TOP NAVBAR (Bright White Theme) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/25">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-indigo-600">
                  CỔNG ĐẶT HÀNG ĐẠI LÝ B2B
                </span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold border border-indigo-200">
                  {profile?.customer_group || 'Đại lý Cấp 1'}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-[200px] sm:max-w-md">
                {profile?.customer_name || 'Đại lý của bạn'}
              </h1>
            </div>
          </div>

          {/* Navigation Links & Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-xs transition"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Đặt Hàng Trực Tuyến</span>
              </button>
              <button
                onClick={() => navigate('/portal/orders')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Theo Dõi Đơn Của Tôi</span>
              </button>
            </div>

            {/* Cart Button */}
            <button
              onClick={() => setIsMobileCartOpen(true)}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md shadow-indigo-600/20 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Giỏ hàng</span>
              {totalItemsCount > 0 && (
                <span className="bg-white text-indigo-700 text-[11px] font-black px-1.5 py-0.2 rounded-full min-w-[20px] text-center shadow-xs">
                  {totalItemsCount}
                </span>
              )}
            </button>

            {/* Logout button */}
            <button
              onClick={() => logout()}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition"
              title="Đăng xuất khỏi cổng đại lý"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full space-y-6 flex-1">
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start justify-between gap-3 text-rose-800 text-sm shadow-xs animate-in fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Thông báo</p>
                <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Draft Saved Toast */}
        {draftSavedToast && (
          <div className="fixed top-20 right-6 z-50 p-3 bg-emerald-600 text-white rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã lưu tạm đơn hàng vào bộ nhớ nháp!</span>
          </div>
        )}

        {/* 2. DEALER PROFILE BANNER (Indigo Gradient with Crisp Light Content) */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white p-5 sm:p-6 shadow-md border border-indigo-500/30">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Dealer Identity */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide bg-white text-indigo-700 rounded-md shadow-xs">
                  {profile?.customer_group || 'Đại lý Cấp 1'}
                </span>
                <span className="text-xs font-mono text-indigo-100 bg-indigo-900/40 px-2 py-0.5 rounded border border-indigo-400/40">
                  Mã ĐL: {profile?.customer_code || profile?.customer_id || 'DL-CURRENT'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {profile?.customer_name || 'Đại lý Kinh Doanh B2B'}
              </h2>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-indigo-100">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
                  <span>{profile?.address || 'Khu công nghiệp / Kho nhận hàng chính'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>📞 {profile?.customer_phone || 'Chưa cập nhật SĐT'}</span>
                </div>
                <div className="flex items-center gap-1 bg-indigo-900/30 px-2 py-0.5 rounded text-indigo-100">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Kho phục vụ: Kho Thái Nguyên & Tổng Kho</span>
                </div>
              </div>
            </div>

            {/* Financial Cards (White Frosted Style inside Banner) */}
            {credit && (
              <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-white/10 p-3 sm:p-4 rounded-xl border border-white/20 backdrop-blur-md shadow-inner min-w-[300px] lg:min-w-[420px]">
                <div className="text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-100">Hạn Mức Cấp</div>
                  <div className="text-xs sm:text-sm font-extrabold text-white mt-1">
                    {formatCurrency(credit.credit_limit)}
                  </div>
                </div>

                <div className="text-center border-x border-white/20 px-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-100">Nợ Đã Dùng</div>
                  <div className="text-xs sm:text-sm font-extrabold text-indigo-200 mt-1">
                    {formatCurrency(credit.total_used_credit)}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-100">Còn Lại</div>
                  <div className={`text-xs sm:text-sm font-extrabold mt-1 ${credit.available_credit > 0 ? 'text-emerald-300' : 'text-rose-200'}`}>
                    {formatCurrency(credit.available_credit)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Intelligent Credit Progress & Live Forecast Bar */}
          {credit && (
            <div className="relative z-10 mt-5 pt-4 border-t border-indigo-400/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs mb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-200" />
                  <span className="font-semibold text-white">
                    Tình trạng bảo lãnh công nợ:
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    isCreditExceeded
                      ? 'bg-rose-500 text-white'
                      : forecastPercentage > 85
                      ? 'bg-amber-400 text-amber-950'
                      : 'bg-emerald-500 text-white'
                  }`}>
                    {isCreditExceeded ? 'Chờ duyệt vượt hạn mức' : 'Đủ điều kiện đặt nợ'}
                  </span>
                </div>

                <div className="text-xs font-mono text-indigo-100">
                  <span>Sau đơn này: </span>
                  <span className="font-bold text-white">
                    {formatCurrency(forecastUsedCredit)}
                  </span>
                  <span> ({forecastPercentage}% hạn mức)</span>
                </div>
              </div>

              {/* Multi-tier progress bar */}
              <div className="w-full bg-indigo-950/40 h-2.5 rounded-full overflow-hidden p-0.5 border border-indigo-400/30">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isCreditExceeded
                      ? 'bg-rose-400'
                      : forecastPercentage > 85
                      ? 'bg-amber-300'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, forecastPercentage)}%` }}
                />
              </div>
            </div>
          )}
        </section>

        {/* 3. ORDER PARAMETERS STRIP (Bright Light Card) */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
            {/* Delivery Point */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span>Điểm giao hàng đã đăng ký *</span>
              </label>
              <select
                value={selectedAddressId || ''}
                onChange={(e) => setSelectedAddressId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              >
                {deliveryAddresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.name} - {addr.address} ({addr.receiver_name} - {addr.phone})
                  </option>
                ))}
              </select>
            </div>

            {/* Expected Delivery Date */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ngày nhận mong muốn</span>
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>

            {/* Delivery Note */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ghi chú giao nhận / Lệnh xuất</span>
              </label>
              <input
                type="text"
                placeholder="Giao giờ hành chính, liên hệ kho trước..."
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>
        </section>

        {/* 4. WORKSPACE: 2 COLUMNS (Catalog on Left, Sticky Cart on Right) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* LEFT: PRODUCT CATALOG (xl:col-span-8) */}
          <section className="xl:col-span-8 space-y-4">
            {/* Filter & View Switcher Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search Box */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm theo tên sản phẩm hoặc mã SKU..."
                    className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-end sm:self-auto">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      viewMode === 'grid'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Dạng thẻ</span>
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      viewMode === 'table'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Dạng bảng</span>
                  </button>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-semibold mr-1">Nhóm ĐVT:</span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {cat === 'all' ? 'Tất cả nhóm hàng' : cat}
                  </button>
                ))}
              </div>

              {/* Popular Items Pills */}
              {popularProducts.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                  <span className="text-indigo-600 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Đại lý hay mua:
                  </span>
                  {popularProducts.map((pop) => (
                    <button
                      key={pop.id}
                      onClick={() => updateQuantity(pop, 1)}
                      className="px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-medium transition flex items-center gap-1.5"
                    >
                      <span>+ {pop.name.slice(0, 22)}...</span>
                      <span className="text-[10px] text-indigo-500 font-bold">({pop.unit})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PRODUCT CATALOG DISPLAY */}
            {loading ? (
              <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <span className="text-sm font-medium">Đang tải danh mục sản phẩm theo bảng giá B2B...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
                <PackageCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <h3 className="text-base font-bold text-slate-800">Không tìm thấy sản phẩm phù hợp</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Hãy thử gõ từ khóa tìm kiếm khác hoặc kiểm tra lại nhóm hàng.
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              /* GRID VIEW (Bright Clean Cards) */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredProducts.map((p) => {
                  const inCart = cart.find((item) => item.product.id === p.id);
                  const qty = inCart ? inCart.quantity : 0;
                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition flex flex-col justify-between group"
                    >
                      <div>
                        {/* SKU & Stock Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono text-slate-400 group-hover:text-indigo-600 transition">
                            {p.sku}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              p.stock_status === 'IN_STOCK'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : p.stock_status === 'LOW_STOCK'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {p.stock_status === 'IN_STOCK'
                              ? 'Còn hàng'
                              : p.stock_status === 'LOW_STOCK'
                              ? 'Sắp hết'
                              : 'Tạm hết'}
                          </span>
                        </div>

                        {/* Name */}
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-2 mt-2 group-hover:text-indigo-600 transition">
                          {p.name}
                        </h4>

                        {/* Packaging Spec */}
                        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                          <span className="text-slate-400">Quy cách:</span>
                          <span className="text-slate-700 font-semibold">
                            {p.packaging_spec || `1 ${p.unit}`}
                          </span>
                        </div>
                      </div>

                      {/* Pricing & Quantity Controls */}
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-[11px] text-slate-500">Giá đại lý ({p.unit})</span>
                          <span className="text-base font-black text-indigo-600">
                            {formatCurrency(p.sale_price)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {qty > 0 ? (
                            <div className="flex items-center flex-1 bg-slate-50 rounded-xl p-1 border border-indigo-300">
                              <button
                                onClick={() => updateQuantity(p, -1)}
                                className="w-8 h-8 rounded-lg bg-white text-slate-700 flex items-center justify-center hover:bg-slate-200 shadow-xs transition"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="number"
                                value={qty}
                                onChange={(e) => setDirectQuantity(p, e.target.value)}
                                className="w-full text-center bg-transparent text-xs font-bold text-slate-900 focus:outline-none"
                              />
                              <button
                                onClick={() => updateQuantity(p, 1)}
                                className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 shadow-xs transition"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => updateQuantity(p, 1)}
                              className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm shadow-indigo-600/20 active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Thêm vào đơn</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* TABLE VIEW (Clean B2B Table) */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">SKU</th>
                        <th className="py-3 px-4">Sản Phẩm</th>
                        <th className="py-3 px-4">ĐVT</th>
                        <th className="py-3 px-4 text-right">Giá Bảng Giá</th>
                        <th className="py-3 px-4 text-center">Tồn Khả Dụng</th>
                        <th className="py-3 px-4 text-center">Số Lượng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map((p) => {
                        const inCart = cart.find((item) => item.product.id === p.id);
                        const qty = inCart ? inCart.quantity : 0;
                        return (
                          <tr key={p.id} className="hover:bg-indigo-50/40 transition">
                            <td className="py-3 px-4 font-mono text-slate-500">{p.sku}</td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{p.name}</div>
                              {p.packaging_spec && (
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {p.packaging_spec}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-600">{p.unit}</td>
                            <td className="py-3 px-4 text-right font-black text-indigo-600">
                              {formatCurrency(p.sale_price)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  p.stock_status === 'IN_STOCK'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : p.stock_status === 'LOW_STOCK'
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {p.stock_status === 'IN_STOCK' ? 'Còn hàng' : 'Sắp hết'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => updateQuantity(p, -1)}
                                  disabled={qty <= 0}
                                  className="w-7 h-7 rounded bg-slate-100 text-slate-700 flex items-center justify-center disabled:opacity-30 hover:bg-slate-200"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-8 text-center font-bold text-slate-900">
                                  {qty}
                                </span>
                                <button
                                  onClick={() => updateQuantity(p, 1)}
                                  className="w-7 h-7 rounded bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 shadow-xs"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* RIGHT: DESKTOP STICKY ORDER WORKSPACE (Bright White Theme) */}
          <section className="hidden xl:block xl:col-span-4 sticky top-20">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-lg space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Dòng hàng ({cart.length})
                  </h3>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Làm mới</span>
                  </button>
                )}
              </div>

              {/* Items List */}
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-medium text-slate-500">Chưa có sản phẩm nào trong đơn hàng.</p>
                  <p className="text-[11px] text-slate-400">
                    Bấm "+ Thêm vào đơn" ở danh mục để chọn sản phẩm.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {cart.map((item) => {
                    const calcItem = calcResult?.items.find((ci) => ci.product_id === item.product.id);
                    const lineTotal = calcItem ? calcItem.line_total : item.product.sale_price * item.quantity;
                    const lineDiscount = calcItem ? calcItem.line_discount : 0;

                    return (
                      <div
                        key={item.product.id}
                        className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-start justify-between gap-2.5"
                      >
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold text-slate-900 truncate">
                            {item.product.name}
                          </h5>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                            <span className="font-mono text-slate-400">{item.product.sku}</span>
                            <span>•</span>
                            <span>{formatCurrency(item.product.sale_price)}/{item.product.unit}</span>
                          </div>

                          {lineDiscount > 0 && (
                            <div className="text-[10px] text-emerald-600 font-bold mt-1">
                              CK {calcItem?.discount_rate}% (-{formatCurrency(lineDiscount)})
                            </div>
                          )}
                        </div>

                        {/* Controls & Price */}
                        <div className="text-right shrink-0">
                          <div className="text-xs font-black text-indigo-600">
                            {formatCurrency(lineTotal)}
                          </div>

                          <div className="flex items-center gap-1 mt-2 bg-white p-0.5 rounded-lg border border-slate-200 shadow-xs">
                            <button
                              onClick={() => updateQuantity(item.product, -1)}
                              className="w-5 h-5 rounded bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product, 1)}
                              className="w-5 h-5 rounded bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="w-5 h-5 text-slate-400 hover:text-rose-600 flex items-center justify-center ml-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Order Financial Breakdown */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Tiền hàng</span>
                  <span className="font-bold text-slate-900">{formatCurrency(estimatedSubtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-emerald-600 font-semibold">
                  <span>Chiết khấu theo sản lượng</span>
                  <span>
                    {calculating ? 'Đang tính...' : `-${formatCurrency(estimatedDiscount)}`}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between text-slate-900">
                  <span className="text-sm font-extrabold">Tổng phải thu</span>
                  <span className="text-lg font-black text-indigo-600">
                    {formatCurrency(estimatedTotal)}
                  </span>
                </div>

                {creditLimit > 0 && (
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-500">Hạn mức còn lại sau đơn:</span>
                    <span className={`font-mono font-bold ${forecastRemainingCredit > 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                      {formatCurrency(forecastRemainingCredit)}
                    </span>
                  </div>
                )}
              </div>

              {/* Notice */}
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] text-indigo-800 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 text-indigo-600 mt-0.5" />
                <span>
                  Đơn sẽ chuyển sang <b>Chờ duyệt (Pending)</b>. Quản lý kinh doanh sẽ xử lý và điều phối xuất kho ngay.
                </span>
              </div>

              {/* Action Buttons (BRIGHT & CLICKABLE) */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handlePrimarySubmitClick}
                  disabled={submitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition active:scale-98 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang gửi đơn...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Gửi duyệt đơn hàng</span>
                    </>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={saveDraft}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition"
                  >
                    Lưu nháp
                  </button>
                  <button
                    onClick={() => navigate('/portal/orders')}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition"
                  >
                    Đơn đã đặt
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* 5. MOBILE FLOATING ACTION BAR */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3.5 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] text-slate-500">
              Đã chọn <b className="text-slate-900">{totalItemsCount}</b> sản phẩm
            </div>
            <div className="text-base font-black text-indigo-600">
              {formatCurrency(estimatedTotal)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileCartOpen(true)}
              className="py-2.5 px-4 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/25"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Xem dòng hàng ({cart.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6. MOBILE CART SLIDE-OVER DRAWER (Bright White Theme) */}
      {isMobileCartOpen && (
        <div className="xl:hidden fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileCartOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white border-l border-slate-200 h-full p-5 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Giỏ hàng của đại lý ({cart.length})
                  </h3>
                </div>
                <button
                  onClick={() => setIsMobileCartOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              {cart.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm">Giỏ hàng đang trống.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{item.product.name}</div>
                        <div className="text-[11px] text-slate-500">{formatCurrency(item.product.sale_price)}/{item.product.unit}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(item.product, -1)}
                          className="w-7 h-7 rounded bg-white text-slate-700 border border-slate-200 flex items-center justify-center shadow-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product, 1)}
                          className="w-7 h-7 rounded bg-indigo-600 text-white flex items-center justify-center shadow-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="w-7 h-7 text-slate-400 hover:text-rose-600 flex items-center justify-center ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Checkout Footer */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Tổng thanh toán:</span>
                <span className="text-lg font-black text-indigo-600">{formatCurrency(estimatedTotal)}</span>
              </div>

              <button
                onClick={handlePrimarySubmitClick}
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Gửi duyệt đơn hàng</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. OVER LIMIT CONFIRMATION MODAL */}
      {showOverLimitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900">
                Xác nhận gửi duyệt đơn vượt hạn mức
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Đơn hàng trị giá <b>{formatCurrency(estimatedTotal)}</b> vượt hạn mức khả dụng của đại lý.
                Hệ thống sẽ chuyển đơn sang trạng thái <b>Chờ duyệt đặc biệt (Pending)</b> để Quản lý kinh doanh xem xét phê duyệt.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Hạn mức cấp:</span>
                <span className="font-bold text-slate-800">{formatCurrency(creditLimit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nợ hiện tại:</span>
                <span className="font-bold text-slate-800">{formatCurrency(currentUsedCredit)}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-bold">
                <span>Dự kiến vượt hạn mức:</span>
                <span>+{formatCurrency(forecastUsedCredit - creditLimit)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowOverLimitConfirm(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Kiểm tra lại
              </button>
              <button
                onClick={executeSubmitOrder}
                disabled={submitting}
                className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/25 transition"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Gửi phê duyệt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. ORDER SUCCESS MODAL */}
      {successOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200 font-bold">
                Mã đơn: {successOrder.code}
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-3">
                Đặt hàng thành công!
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Đơn hàng của đại lý đã được gửi sang trạng thái <b>Chờ duyệt (Pending)</b>. Quản lý kinh doanh sẽ kiểm tra tồn kho và phê duyệt xuất giao ngay.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Tổng giá trị đơn:</span>
                <span className="font-extrabold text-slate-900">{formatCurrency(successOrder.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hình thức thanh toán:</span>
                <span className="text-indigo-600 font-bold">Công nợ hạn mức</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trạng thái:</span>
                <span className="text-amber-700 font-bold uppercase tracking-wider text-[10px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Chờ duyệt
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setSuccessOrder(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Tiếp tục đặt hàng
              </button>
              <button
                onClick={() => navigate('/portal/orders')}
                className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition"
              >
                <span>Xem đơn của tôi</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
