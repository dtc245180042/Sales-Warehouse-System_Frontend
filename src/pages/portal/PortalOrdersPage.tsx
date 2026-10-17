import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  Search,
  Building2,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Truck,
  XCircle,
  Eye,
  LogOut,
  RefreshCw,
  X,
  ChevronRight,
  MapPin,
  Phone,
  User,
  CreditCard,
  FileText,
  Boxes,
  Edit3,
  RotateCcw,
  Check,
  ShieldCheck,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import {
  portalService,
  PortalOrderListItem,
  PortalOrderDetail,
  PortalProfile,
  PortalDeliveryAddress
} from '../../services/portalService';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { OrderDeliveryTimeline } from '../../components/delivery/OrderDeliveryTimeline';
import { OrderItemsDeliveryTable } from '../../components/delivery/OrderItemsDeliveryTable';
import { buildMilestones } from '../../services/deliveryTrackingService';

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  pending: {
    label: 'Chờ duyệt',
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  pending_approval: {
    label: 'Chờ duyệt',
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  confirmed: {
    label: 'Đã xác nhận',
    bg: 'bg-sky-50 border-sky-200',
    text: 'text-sky-700',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  approved: {
    label: 'Đã duyệt',
    bg: 'bg-sky-50 border-sky-200',
    text: 'text-sky-700',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  shipping: {
    label: 'Đang giao hàng',
    bg: 'bg-indigo-50 border-indigo-200',
    text: 'text-indigo-700 font-bold',
    icon: <Truck className="w-3.5 h-3.5" />,
  },
  completed: {
    label: 'Đã giao thành công',
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  delivered: {
    label: 'Đã giao thành công',
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  cancelled: {
    label: 'Đã hủy',
    bg: 'bg-rose-50 border-rose-200',
    text: 'text-rose-700',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

export const PortalOrdersPage: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Core Data State
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [orders, setOrders] = useState<PortalOrderListItem[]>([]);
  const [deliveryAddresses, setDeliveryAddresses] = useState<PortalDeliveryAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Detail Modal
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<PortalOrderDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Cancel Order Modal State
  const [orderToCancel, setOrderToCancel] = useState<PortalOrderListItem | null>(null);
  const [cancelReasonPreset, setCancelReasonPreset] = useState<string>('Đặt nhầm sản phẩm hoặc số lượng');
  const [cancelReasonCustom, setCancelReasonCustom] = useState<string>('');
  const [cancelling, setCancelling] = useState(false);

  // Edit Order Modal State
  const [orderToEdit, setOrderToEdit] = useState<PortalOrderListItem | null>(null);
  const [editAddressId, setEditAddressId] = useState<number | null>(null);
  const [editExpectedDate, setEditExpectedDate] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  // Confirm Received Modal State
  const [orderToConfirmDelivery, setOrderToConfirmDelivery] = useState<PortalOrderListItem | null>(null);
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);

  // Initial Load
  useEffect(() => {
    loadProfileAndAddresses();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [selectedStatus, page]);

  const loadProfileAndAddresses = async () => {
    try {
      const [p, addrs] = await Promise.all([
        portalService.getProfile(),
        portalService.getDeliveryAddresses(),
      ]);
      setProfile(p);
      setDeliveryAddresses(addrs);
    } catch {
      // Ignore
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const params: { status?: string; page: number; limit: number } = { page, limit };
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }
      const res = await portalService.getOrders(params);
      setOrders(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể tải danh sách đơn hàng của bạn.');
    } finally {
      setLoading(false);
    }
  };

  // Detail Modal Handlers
  const handleOpenDetail = async (orderId: string) => {
    setSelectedOrderId(orderId);
    setLoadingDetail(true);
    setDetailError(null);
    setOrderDetail(null);
    try {
      const detail = await portalService.getOrderDetail(orderId);
      setOrderDetail(detail);
    } catch (err: any) {
      setDetailError(err.message || 'Không thể tải chi tiết đơn hàng.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedOrderId(null);
    setOrderDetail(null);
    setDetailError(null);
  };

  // Cancel Modal Handlers
  const openCancelModal = (order: PortalOrderListItem) => {
    if (order.status === 'shipping') {
      alert('Đơn hàng đang giao, không thể hủy! Bạn chỉ có quyền xác nhận khi đã nhận được hàng.');
      return;
    }
    setOrderToCancel(order);
    setCancelReasonPreset('Đặt nhầm sản phẩm hoặc số lượng');
    setCancelReasonCustom('');
  };

  const executeCancelOrder = async () => {
    if (!orderToCancel) return;
    const finalReason = cancelReasonPreset === 'Khác' ? cancelReasonCustom.trim() : cancelReasonPreset;
    if (!finalReason) {
      alert('Vui lòng nhập lý do hủy đơn hàng.');
      return;
    }

    setCancelling(true);
    try {
      await portalService.cancelOrder(orderToCancel.id, finalReason);
      setOrderToCancel(null);
      setActionSuccessToast(`Đã hủy thành công đơn hàng #${orderToCancel.code}`);
      setTimeout(() => setActionSuccessToast(null), 3500);
      loadOrders();
      if (selectedOrderId === orderToCancel.id) {
        handleCloseDetail();
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi hủy đơn hàng.');
    } finally {
      setCancelling(false);
    }
  };

  // Edit Modal Handlers
  const openEditModal = (order: PortalOrderListItem) => {
    if (order.status === 'shipping') {
      alert('Đơn hàng đang giao, không thể chỉnh sửa!');
      return;
    }
    setOrderToEdit(order);
    setEditExpectedDate(order.expected_delivery_date || '');
    setEditNotes('');
    if (deliveryAddresses.length > 0) {
      setEditAddressId(deliveryAddresses[0].id);
    }
  };

  const executeUpdateOrder = async () => {
    if (!orderToEdit) return;
    setUpdating(true);
    try {
      await portalService.updateOrder(orderToEdit.id, {
        delivery_address_id: editAddressId || undefined,
        expected_delivery_date: editExpectedDate || undefined,
        delivery_notes: editNotes.trim() || undefined,
      });
      setOrderToEdit(null);
      setActionSuccessToast(`Cập nhật thông tin giao nhận đơn #${orderToEdit.code} thành công.`);
      setTimeout(() => setActionSuccessToast(null), 3500);
      loadOrders();
      if (selectedOrderId === orderToEdit.id) {
        handleOpenDetail(orderToEdit.id);
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật đơn hàng.');
    } finally {
      setUpdating(false);
    }
  };

  // Confirm Received Handlers (Only when shipping!)
  const openConfirmDeliveryModal = (order: PortalOrderListItem) => {
    if (order.status !== 'shipping') {
      alert('Chỉ có thể xác nhận nhận hàng khi đơn đang ở trạng thái Đang giao hàng.');
      return;
    }
    setOrderToConfirmDelivery(order);
  };

  const executeConfirmDelivery = async () => {
    if (!orderToConfirmDelivery) return;
    setConfirmingDelivery(true);
    try {
      await portalService.confirmDelivery(orderToConfirmDelivery.id);
      setOrderToConfirmDelivery(null);
      setActionSuccessToast(`Chúc mừng! Đã xác nhận đã nhận hàng thành công cho đơn #${orderToConfirmDelivery.code}.`);
      setTimeout(() => setActionSuccessToast(null), 4000);
      loadOrders();
      if (selectedOrderId === orderToConfirmDelivery.id) {
        handleCloseDetail();
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xác nhận nhận hàng.');
    } finally {
      setConfirmingDelivery(false);
    }
  };

  // Filtered by search client-side
  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.trim().toLowerCase();
    return orders.filter(
      (o) =>
        o.code.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        (o.expected_delivery_date && o.expected_delivery_date.includes(q))
    );
  }, [orders, search]);

  // Statistics
  const stats = useMemo(() => {
    const totalCount = total;
    const pendingCount = orders.filter((o) => o.status === 'pending' || o.status === 'pending_approval').length;
    const shippingCount = orders.filter((o) => o.status === 'shipping').length;
    const completedCount = orders.filter((o) => o.status === 'completed' || o.status === 'delivered').length;
    return { totalCount, pendingCount, shippingCount, completedCount };
  }, [orders, total]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Header (Bright White Theme) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur shadow-xs border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/25">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider">CỔNG ĐẠI LÝ B2B</div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                {profile?.customer_name || 'Đại lý của bạn'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => logout()}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition flex items-center gap-1.5 text-xs font-semibold"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-6xl mx-auto px-4 flex border-t border-slate-100">
          <button
            onClick={() => navigate('/portal/order')}
            className="flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 border-transparent text-slate-500 hover:text-indigo-600 transition"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Đặt Hàng Trực Tuyến</span>
          </button>
          <button
            className="flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 border-indigo-600 text-indigo-600 transition"
          >
            <Package className="w-4 h-4" />
            <span>Theo Dõi Đơn Hàng Của Tôi</span>
          </button>
          <button
            onClick={() => navigate('/portal/tracking')}
            className="flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 border-transparent text-slate-500 hover:text-indigo-600 transition"
            title="Xem màn hình theo dõi lộ trình & 5 mốc giao hàng"
          >
            <Truck className="w-4 h-4" />
            <span>Tiến Độ Giao Vận (Timeline)</span>
          </button>
          <button
            onClick={() => navigate('/portal/debt')}
            className="flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 border-transparent text-slate-500 hover:text-indigo-600 transition"
            title="Xem tổng hợp công nợ, hạn mức & hoá đơn"
          >
            <CreditCard className="w-4 h-4" />
            <span>Công Nợ & Hoá Đơn</span>
          </button>
          <button
            onClick={() => navigate('/portal/reconciliation')}
            className="flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 border-transparent text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            <FileText className="w-4 h-4" />
            <span>Đối Chiếu Công Nợ</span>
          </button>
        </div>
      </header>


      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-5 space-y-5">
        {/* Toast Alert */}
        {actionSuccessToast && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm shadow-xs animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionSuccessToast}</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs shadow-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 2. Overview Stats (White Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-semibold">Tổng số đơn</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{stats.totalCount}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-amber-200 bg-amber-50/20 shadow-xs">
            <div className="text-xs text-amber-700 font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Chờ phê duyệt</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-700 mt-1">{stats.pendingCount}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-indigo-200 bg-indigo-50/20 shadow-xs">
            <div className="text-xs text-indigo-700 font-bold flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" />
              <span>Đang giao hàng</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-indigo-700 mt-1">{stats.shippingCount}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-emerald-200 bg-emerald-50/20 shadow-xs">
            <div className="text-xs text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã hoàn thành</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">{stats.completedCount}</div>
          </div>
        </div>

        {/* 3. Search and Status Filters */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm mã đơn hàng (ví dụ: DH-202610...)..."
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

            <button
              onClick={loadOrders}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tải lại</span>
            </button>
          </div>

          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
            {[
              { id: 'all', label: 'Tất cả đơn' },
              { id: 'pending', label: 'Chờ duyệt' },
              { id: 'confirmed', label: 'Đã xác nhận' },
              { id: 'shipping', label: 'Đang giao hàng' },
              { id: 'completed', label: 'Đã hoàn thành' },
              { id: 'cancelled', label: 'Đã hủy' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  setSelectedStatus(st.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedStatus === st.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Orders List Display */}
        {loading ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-sm font-semibold text-slate-600">Đang tải danh sách đơn hàng...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 p-8">
            <Package className="w-14 h-14 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">Chưa có đơn hàng nào</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Không tìm thấy đơn hàng phù hợp với bộ lọc hiện tại. Hãy chuyển sang tab Đặt Hàng Trực Tuyến để tạo đơn mới.
            </p>
            <button
              onClick={() => navigate('/portal/order')}
              className="mt-4 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm shadow-indigo-600/20"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Tạo đơn đặt hàng ngay</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const cfg = STATUS_CONFIG[order.status] || {
                label: order.status,
                bg: 'bg-slate-100 border-slate-200',
                text: 'text-slate-700',
                icon: <Clock className="w-3.5 h-3.5" />,
              };
              const isShipping = order.status === 'shipping';
              const isPending = order.status === 'pending' || order.status === 'pending_approval' || order.status === 'draft';
              const isCompleted = order.status === 'completed' || order.status === 'delivered';
              const isCancelled = order.status === 'cancelled';

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-xs transition hover:shadow-md ${
                    isShipping ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="font-mono font-bold text-sm text-slate-900">{order.code}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cfg.bg} ${cfg.text}`}
                      >
                        {cfg.icon}
                        <span>{cfg.label}</span>
                      </span>

                      {isShipping && (
                        <span className="text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-semibold animate-pulse">
                          🚚 Đang trên đường giao
                        </span>
                      )}

                      {order.has_short_delivery && (
                        <span className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>Giao thiếu hàng</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 font-mono">
                      {order.created_at ? new Date(order.created_at).toLocaleString('vi-VN') : ''}
                    </div>
                  </div>

                  {/* Summary Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Số dòng hàng</span>
                      <span className="font-bold text-slate-800 text-sm">{order.items_count} sản phẩm</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block">Ngày giao dự kiến</span>
                      <span className="font-semibold text-slate-700">
                        {order.expected_delivery_date || 'Theo thỏa thuận'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block">Thanh toán</span>
                      <span className="font-semibold text-indigo-600">Công nợ hạn mức</span>
                    </div>

                    <div className="sm:text-right">
                      <span className="text-slate-400 block">Tổng tiền</span>
                      <span className="font-black text-indigo-600 text-base">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </div>

                  {/* Operational Action Bar (Strict Logic) */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    {/* Notice for Shipping */}
                    {isShipping ? (
                      <div className="text-xs text-indigo-700 font-medium flex items-center gap-1.5">
                        <Truck className="w-4 h-4 shrink-0" />
                        <span>Đơn hàng đang giao. Khách chỉ có quyền xác nhận khi nhận được đơn và xem đơn.</span>
                      </div>
                    ) : isPending ? (
                      <div className="text-xs text-amber-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>Đơn đang chờ NVKD duyệt. Bạn có thể sửa thông tin hoặc hủy đơn.</span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400">
                        {isCompleted ? '✓ Đơn hàng đã hoàn thành trọn vẹn.' : 'Đơn hàng đã được lưu trữ.'}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 ml-auto">
                      {/* TRACK DELIVERY (SCRUM-260) */}
                      <button
                        onClick={() => navigate(`/portal/orders/${order.id}/tracking`)}
                        className="py-1.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1 transition"
                        title="Theo dõi trạng thái giao hàng"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Theo dõi</span>
                      </button>

                      {/* VIEW DETAIL (Always allowed) */}
                      <button
                        onClick={() => handleOpenDetail(order.id)}
                        className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem chi tiết</span>
                      </button>

                      {/* WHEN SHIPPING: ONLY CONFIRM DELIVERY BUTTON (NO EDIT, NO DELETE) */}
                      {isShipping && (
                        <button
                          onClick={() => openConfirmDeliveryModal(order)}
                          className="py-1.5 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-600/25 transition active:scale-95"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Xác nhận đã nhận hàng</span>
                        </button>
                      )}

                      {/* WHEN PENDING/DRAFT: CAN EDIT OR CANCEL WITH REASON */}
                      {isPending && (
                        <>
                          <button
                            onClick={() => openEditModal(order)}
                            className="py-1.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1 transition"
                            title="Sửa địa chỉ / ghi chú"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Sửa đơn</span>
                          </button>
                          <button
                            onClick={() => openCancelModal(order)}
                            className="py-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 transition"
                            title="Hủy đơn hàng"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Hủy đơn</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 5. CANCEL ORDER MODAL (Reason Required) */}
      {orderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <XCircle className="w-5 h-5" />
                <h3 className="font-bold text-slate-900">Hủy đơn hàng #{orderToCancel.code}</h3>
              </div>
              <button
                onClick={() => setOrderToCancel(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed">
              Vui lòng chọn hoặc nhập lý do hủy đơn để tránh đặt nhầm và thông báo tự động tới nhân viên kinh doanh phụ trách:
            </div>

            {/* Reason Presets */}
            <div className="space-y-2">
              {[
                'Đặt nhầm sản phẩm hoặc số lượng',
                'Muốn thay đổi địa chỉ nhận hàng',
                'Thay đổi kế hoạch nhập hàng / Chưa có nhu cầu',
                'Khác',
              ].map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                    cancelReasonPreset === reason
                      ? 'bg-rose-50/50 border-rose-300 text-rose-900 font-bold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    checked={cancelReasonPreset === reason}
                    onChange={() => setCancelReasonPreset(reason)}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            {/* Custom Reason Textarea */}
            {cancelReasonPreset === 'Khác' && (
              <textarea
                rows={3}
                placeholder="Nhập lý do chi tiết của quý khách..."
                value={cancelReasonCustom}
                onChange={(e) => setCancelReasonCustom(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white"
              />
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setOrderToCancel(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Đóng
              </button>
              <button
                onClick={executeCancelOrder}
                disabled={cancelling}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/25 transition"
              >
                {cancelling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>Xác nhận hủy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. EDIT ORDER MODAL */}
      {orderToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-indigo-600">
                <Edit3 className="w-5 h-5" />
                <h3 className="font-bold text-slate-900">Sửa giao nhận đơn #{orderToEdit.code}</h3>
              </div>
              <button
                onClick={() => setOrderToEdit(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Điểm giao hàng mới</label>
                <select
                  value={editAddressId || ''}
                  onChange={(e) => setEditAddressId(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                >
                  {deliveryAddresses.map((addr) => (
                    <option key={addr.id} value={addr.id}>
                      {addr.name} - {addr.address} ({addr.receiver_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ngày nhận mong muốn</label>
                <input
                  type="date"
                  value={editExpectedDate}
                  onChange={(e) => setEditExpectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi chú giao hàng mới</label>
                <input
                  type="text"
                  placeholder="Giao giờ hành chính, liên hệ trước..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setOrderToEdit(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={executeUpdateOrder}
                disabled={updating}
                className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/25 transition"
              >
                {updating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. CONFIRM DELIVERY MODAL (Only when shipping!) */}
      {orderToConfirmDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">
                Xác nhận đã nhận đủ hàng?
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Đơn hàng <b>#{orderToConfirmDelivery.code}</b> trị giá <b>{formatCurrency(orderToConfirmDelivery.total)}</b>.
                Quý khách vui lòng xác nhận khi đã kiểm tra nguyên vẹn kiện hàng và nhận đủ số lượng.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setOrderToConfirmDelivery(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Kiểm tra lại
              </button>
              <button
                onClick={executeConfirmDelivery}
                disabled={confirmingDelivery}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
              >
                {confirmingDelivery ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Đã nhận đủ hàng</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. ORDER DETAIL MODAL */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Chi Tiết Đơn Hàng</span>
                <h3 className="text-base font-bold text-slate-900 font-mono">
                  {orderDetail?.code || selectedOrderId}
                </h3>
              </div>
              <button
                onClick={handleCloseDetail}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {loadingDetail ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                  <span>Đang tải dòng hàng...</span>
                </div>
              ) : orderDetail ? (
                <>
                  {/* Status Banner */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-500 block">Trạng thái xử lý</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {STATUS_CONFIG[orderDetail.status]?.label || orderDetail.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block">Tổng tiền</span>
                      <span className="font-black text-indigo-600 text-base">
                        {formatCurrency(orderDetail.total)}
                      </span>
                    </div>
                  </div>

                  {/* SCRUM-260: Mốc tiến độ giao hàng trên giao diện chi tiết đơn */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-indigo-600" />
                        Tiến độ giao hàng (Timeline 5 mốc)
                      </span>
                      <button
                        onClick={() => navigate(`/portal/orders/${orderDetail.id}/tracking`)}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition hover:underline"
                      >
                        <span>Mở toàn màn hình theo dõi</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                    <OrderDeliveryTimeline
                      milestones={buildMilestones(orderDetail.status, new Date(orderDetail.created_at || Date.now())).list}
                      currentKey={buildMilestones(orderDetail.status, new Date(orderDetail.created_at || Date.now())).currentKey}
                      progressPercentage={buildMilestones(orderDetail.status, new Date(orderDetail.created_at || Date.now())).progress}
                      compact={true}
                    />
                  </div>

                  {/* Delivery Address */}
                  {orderDetail.delivery_profile && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Điểm nhận hàng: {orderDetail.delivery_profile.delivery_address_name}</span>
                      </div>
                      <div className="text-slate-600 pl-5">
                        {orderDetail.delivery_profile.delivery_address}
                      </div>
                      <div className="text-slate-500 pl-5">
                        Người nhận: {orderDetail.delivery_profile.delivery_receiver_name} - SĐT: {orderDetail.delivery_profile.delivery_phone}
                      </div>
                      {orderDetail.delivery_profile.delivery_notes && (
                        <div className="text-slate-500 pl-5 italic mt-1">
                          Ghi chú: {orderDetail.delivery_profile.delivery_notes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SCRUM-696: Khu vực chi tiết dòng hàng hiển thị số lượng đặt, thực giao và các trường hợp giao thiếu */}
                  <div>
                    <OrderItemsDeliveryTable
                      items={orderDetail.items}
                      orderStatus={orderDetail.status}
                      hasShortDelivery={orderDetail.has_short_delivery}
                      onRequestBackorder={() => {
                        setActionSuccessToast('Đã ghi nhận yêu cầu giao bù đợt 2 cho đơn hàng này.');
                        setTimeout(() => setActionSuccessToast(null), 3500);
                      }}
                      onRequestDebtDeduction={() => {
                        setActionSuccessToast('Đã ghi nhận yêu cầu khấu trừ hàng thiếu vào công nợ.');
                        setTimeout(() => setActionSuccessToast(null), 3500);
                      }}
                    />
                  </div>
                </>
              ) : null}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={handleCloseDetail}
                className="py-2 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
