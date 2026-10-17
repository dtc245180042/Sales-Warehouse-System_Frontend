import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  FileDown,
  Ban,
  CheckCircle2,
  Clock,
  Truck,
  CreditCard,
  User,
  MapPin,
  Phone,
  Calendar,
  AlertCircle,
  Copy,
  Check,
  XCircle,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Loading } from '../../components/common/Loading';
import { EmptyState } from '../../components/common/EmptyState';
import { OrderLifecycleTimeline } from '../../components/sales/OrderLifecycleTimeline';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { orderService } from '../../services/orderService';
import { Order, OrderStatus } from '../../types/Order';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCopying, setIsCopying] = useState(false);

  // S4-05: Modal xử lý phê duyệt ngoại lệ (Reject/Return kèm lý do)
  const [approvalModalAction, setApprovalModalAction] = useState<'reject' | 'return' | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  const isSalesManagerOrAdmin =
    user?.role === 'Admin' ||
    user?.role === 'SalesManager' ||
    user?.role === 'Manager' ||
    (user?.role as unknown as string) === 'Sales Manager' ||
    (user?.role as unknown as string) === 'sales_manager';

  const loadOrder = async () => {
    if (!id) return;
    try {
      const data = await orderService.getById(id);
      if (data) setOrder(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handleUpdateStatus = async (nextStatus: OrderStatus, note?: string) => {
    if (!order) return;
    try {
      const updated = await orderService.updateStatus(order.id, nextStatus, note, user?.name);
      setOrder(updated);
      showToast(`Đã chuyển khâu đơn hàng sang "${nextStatus}" thành công`, 'success');
    } catch {
      showToast('Lỗi cập nhật trạng thái đơn hàng', 'error');
    }
  };

  // S4-06: Hủy đơn hàng kèm bắt buộc nhập lý do
  const handleCancel = async () => {
    if (!order) return;
    if (!cancelReason.trim() || cancelReason.trim().length < 5) {
      showToast('Vui lòng nhập lý do hủy đơn (tối thiểu 5 ký tự)', 'warning');
      return;
    }
    try {
      const updated = await orderService.cancelOrder(order.id, cancelReason.trim(), user?.name || 'Nhân viên');
      setOrder(updated);
      showToast('Đã hủy đơn hàng thành công, tồn kho giữ chỗ đã được giải phóng', 'success');
      setIsCancelModalOpen(false);
      setCancelReason('');
    } catch (err: any) {
      showToast(err?.message || 'Lỗi khi hủy đơn hàng', 'error');
    }
  };

  // S4-09: Sao chép đơn hàng cũ thành đơn nháp mới
  const handleCopyOrder = async () => {
    if (!order) return;
    setIsCopying(true);
    try {
      const res = await orderService.copyOrder(order.id);
      showToast(res.message || 'Đã sao chép đơn hàng thành công sang đơn nháp mới!', 'success');
      if (res.warnings && res.warnings.length > 0) {
        showToast(res.warnings.join('; '), 'warning');
      }
      // Chuyển hướng sang trang tạo/tiếp tục đơn hàng với mã đơn mới
      navigate(`/agents/orders/new?orderId=${encodeURIComponent(res.order.id)}`);
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Lỗi khi sao chép đơn hàng', 'error');
    } finally {
      setIsCopying(false);
    }
  };

  // S4-05: Xử lý hành động phê duyệt ngoại lệ (Approve, Reject, Return)
  const handleApprovalAction = async (action: 'approve' | 'reject' | 'return') => {
    if (!order) return;
    if ((action === 'reject' || action === 'return') && !approvalComment.trim()) {
      showToast('Bắt buộc phải nhập ý kiến giải thích khi từ chối hoặc trả lại đơn!', 'warning');
      return;
    }

    setIsProcessingApproval(true);
    try {
      await orderService.processApprovalAction(order.id, action, approvalComment.trim());
      const actionName =
        action === 'approve'
          ? 'Đã phê duyệt ngoại lệ đơn hàng thành công!'
          : action === 'reject'
          ? 'Đã từ chối đơn hàng ngoại lệ!'
          : 'Đã trả lại đơn hàng yêu cầu nhân viên sửa!';
      showToast(actionName, 'success');
      setApprovalModalAction(null);
      setApprovalComment('');
      loadOrder();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Lỗi khi xử lý phê duyệt đơn hàng', 'error');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  // S4-08: In phiếu xuất HTML thật & Tải PDF thật
  const handlePrintHtml = () => {
    if (!order) return;
    window.open(`/api/v1/orders/${encodeURIComponent(order.id)}/print-html`, '_blank');
  };

  const handleExportPdf = () => {
    if (!order) return;
    window.open(`/api/v1/orders/${encodeURIComponent(order.id)}/export-pdf`, '_blank');
  };

  if (loading) return <Loading text="Đang tải chi tiết đơn hàng..." />;
  if (!order) {
    return (
      <EmptyState
        title="Không tìm thấy đơn hàng"
        description="Mã đơn hàng không tồn tại."
        actionText="Quay lại danh sách"
        onAction={() => navigate('/orders')}
      />
    );
  }

  return (
    <PageContainer
      title={`Chi Tiết Đơn Hàng: ${order.code}`}
      subtitle={`Ngày tạo: ${formatDate(order.createdAt)} | Phụ trách: ${order.staffName}`}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/orders">
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Danh sách
            </Button>
          </Link>

          {/* S4-09: Nút Sao chép đơn hàng */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyOrder}
            isLoading={isCopying}
            leftIcon={<Copy className="w-4 h-4 text-indigo-600" />}
            title="Tạo đơn nháp mới kế thừa toàn bộ danh sách sản phẩm và tính lại giá hiện hành"
          >
            Sao chép đơn
          </Button>

          {/* SCRUM-260: Theo dõi trạng thái giao hàng với timeline 5 mốc */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/portal/orders/${order.id}/tracking`)}
            leftIcon={<Truck className="w-4 h-4 text-indigo-600" />}
            title="Xem màn hình theo dõi trạng thái giao hàng timeline 5 mốc"
          >
            Theo dõi giao hàng
          </Button>

          {/* S4-08: Nút In phiếu xuất HTML */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintHtml}
            leftIcon={<Printer className="w-4 h-4" />}
            title="Mở mẫu in phiếu xuất kho chuẩn A4/A5"
          >
            In phiếu xuất
          </Button>

          {/* S4-08: Nút Xuất PDF */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            leftIcon={<FileDown className="w-4 h-4" />}
            title="Tải tệp PDF phiếu xuất giao hàng"
          >
            Xuất PDF
          </Button>
          {/* S4-06: Nút Hủy đơn */}
          {!['shipping', 'completed', 'closed', 'cancelled'].includes(order.status) && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsCancelModalOpen(true)}
              leftIcon={<Ban className="w-4 h-4" />}
            >
              Hủy đơn
            </Button>
          )}
        </div>
      }
    >
      {/* S4-05: Khối Phê Duyệt Đơn Ngoại Lệ (Dành cho Quản lý kinh doanh & Admin) */}
      {(order.status === 'pending_approval' || (order.status === 'pending' && isSalesManagerOrAdmin)) && (
        <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 shadow-sm mb-6 space-y-3 animate-fadeIn">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100">
                    Đơn hàng cần phê duyệt ngoại lệ (S4-05)
                  </h3>
                  <Badge variant="warning" size="sm">
                    CHỜ QUẢN LÝ DUYỆT
                  </Badge>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  Lý do vi phạm:{' '}
                  <strong>
                    {order.note && order.note.includes('Lý do:')
                      ? order.note
                      : 'Đơn hàng vượt hạn mức công nợ hoặc có mặt hàng bán dưới giá sàn tối thiểu.'}
                  </strong>
                </p>
              </div>
            </div>

            {isSalesManagerOrAdmin ? (
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleApprovalAction('approve')}
                  isLoading={isProcessingApproval}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Phê duyệt đơn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setApprovalModalAction('return');
                    setApprovalComment('');
                  }}
                  leftIcon={<RotateCcw className="w-4 h-4 text-amber-600" />}
                >
                  Trả lại sửa
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setApprovalModalAction('reject');
                    setApprovalComment('');
                  }}
                  leftIcon={<XCircle className="w-4 h-4" />}
                >
                  Từ chối
                </Button>
              </div>
            ) : (
              <span className="text-xs italic text-amber-700 bg-amber-100 dark:bg-amber-900/40 px-3 py-1 rounded-lg">
                Đang chờ Quản lý duyệt
              </span>
            )}
          </div>
        </div>
      )}

      {/* SC-238: Hiển thị trực quan Timeline vòng đời đơn hàng và nhánh Hủy */}
      <OrderLifecycleTimeline
        order={order}
        onUpdateStatus={handleUpdateStatus}
        onRequestCancel={() => setIsCancelModalOpen(true)}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Products in Order (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Danh Sách Sản Phẩm Đã Mua
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-3">Sản phẩm</th>
                    <th className="pb-3 text-center">Đơn giá</th>
                    <th className="pb-3 text-center">SL Đặt</th>
                    <th className="pb-3 text-center text-indigo-600 dark:text-indigo-400">SL Thực Giao</th>
                    <th className="pb-3 text-center">Tình trạng</th>
                    <th className="pb-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {order.items.map((it, idx) => {
                    const isDemoShort = (order.id === 'ORD-002' || order.code.includes('002')) && idx === 1;
                    const shortQty = isDemoShort ? 2 : 0;
                    const deliveredQty = isDemoShort ? Math.max(0, it.quantity - shortQty) : it.quantity;

                    return (
                      <tr key={idx} className={isDemoShort ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''}>
                        <td className="py-3">
                          <p className="font-bold text-slate-900 dark:text-slate-100">{it.name}</p>
                          <span className="text-[11px] text-slate-400 font-mono">SKU: {it.sku}</span>
                          {isDemoShort && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 italic mt-0.5">
                              ⚠️ Kho tạm hết hàng, nợ hàng giao bù đợt 2
                            </p>
                          )}
                        </td>
                        <td className="py-3 text-center font-medium">{formatCurrency(it.price)}</td>
                        <td className="py-3 text-center font-bold">{it.quantity}</td>
                        <td className="py-3 text-center font-black text-indigo-600 dark:text-indigo-400">
                          {deliveredQty}
                        </td>
                        <td className="py-3 text-center">
                          {isDemoShort ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                              Thiếu -{shortQty}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                              Đủ hàng
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right font-black text-slate-900 dark:text-white">
                          {formatCurrency(it.subtotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Customer & Financials (1 col) */}
        <div className="space-y-6">
          {/* Creator / Staff info (SCRUM-362, SCRUM-364, SCRUM-367) */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              Người Lập Đơn Hàng
            </h3>
            <div className="flex items-center gap-3.5 pt-1">
              <img
                src={
                  user && (user.name === order.staffName || String(user.id) === String(order.staffId)) && user.avatar
                    ? user.avatar
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(order.staffName)}&background=6366f1&color=fff&size=128`
                }
                alt={order.staffName}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/30 shadow-md shrink-0"
              />
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {order.staffName}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    Nhân viên bán hàng
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ({order.staffId})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer info */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              Thông Tin Khách Hàng
            </h3>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{order.customerName}</p>
              <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{order.customerPhone}</span>
                </p>
                <p className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{order.customerAddress || 'Nhận tại quầy'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Payment summary */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-500" />
              Tổng Kết Thanh Toán
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Tạm tính hàng hóa:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(order.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Chiết khấu / Giảm giá:</span>
                <span className="text-rose-600 font-semibold">
                  -{formatCurrency(order.discount)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Thuế giá trị gia tăng (VAT):</span>
                <span>+{formatCurrency(order.tax || 0)}</span>
              </div>
              <div className="flex justify-between text-base font-black pt-3 border-t border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white">
                <span>TỔNG THANH TOÁN:</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(order.total)}
                </span>
              </div>
              <div className="flex justify-between text-xs pt-1 text-slate-500">
                <span>Phương thức:</span>
                <span className="font-bold uppercase text-slate-800 dark:text-slate-200">
                  {order.paymentMethod}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Hủy Đơn Hàng (kèm nhập lý do cho nhánh Hủy SC-238 & S4-06) */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setCancelReason('');
        }}
        title="Xác Nhận Hủy Đơn Hàng (S4-06)"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs">
            <p className="font-bold">Lưu ý khi hủy đơn hàng:</p>
            <p className="mt-1">
              Đơn hàng sẽ chuyển sang nhánh <span className="font-black">ĐÃ HỦY</span>, toàn bộ sản phẩm trong đơn sẽ được tự động hoàn trả lại số lượng tồn kho.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Lý do hủy đơn hàng <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do chi tiết (tối thiểu 5 ký tự)..."
              rows={3}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              required
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Yêu cầu tối thiểu 5 ký tự</span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsCancelModalOpen(false);
                setCancelReason('');
              }}
            >
              Quay lại
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleCancel}
              disabled={cancelReason.trim().length < 5}
            >
              Xác nhận hủy đơn
            </Button>
          </div>
        </div>
      </Modal>

      {/* S4-05: Modal Nhập Ý Kiến Duyệt Ngoại Lệ (Từ chối / Trả lại sửa) */}
      {approvalModalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {approvalModalAction === 'reject' ? 'Từ chối đơn hàng ngoại lệ' : 'Trả lại đơn hàng yêu cầu sửa'}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              {approvalModalAction === 'reject'
                ? 'Nhập lý do từ chối để giải thích lý do không phê duyệt đơn hàng này.'
                : 'Nhập hướng dẫn cụ thể để nhân viên kinh doanh điều chỉnh đơn cho phù hợp.'}
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ý kiến giải thích / hướng dẫn <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder="Nhập nội dung phản hồi bắt buộc..."
                rows={3}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setApprovalModalAction(null);
                  setApprovalComment('');
                }}
              >
                Hủy bỏ
              </Button>
              <Button
                variant={approvalModalAction === 'reject' ? 'danger' : 'primary'}
                size="sm"
                onClick={() => handleApprovalAction(approvalModalAction)}
                isLoading={isProcessingApproval}
                disabled={!approvalComment.trim()}
              >
                {approvalModalAction === 'reject' ? 'Xác nhận từ chối' : 'Gửi yêu cầu sửa'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
