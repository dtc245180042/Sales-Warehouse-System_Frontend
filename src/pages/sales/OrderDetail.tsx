import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  FileDown,
  Ban,
  CreditCard,
  User,
  MapPin,
  Phone,
  Truck,
  ExternalLink,
  FileText,
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
import { deliveryTrackingService } from '../../services/deliveryTrackingService';
import { debtInvoiceService } from '../../services/debtInvoiceService';
import { Order } from '../../types/Order';
import { DeliveryMilestoneKey, DeliveryTrackingDetails } from '../../types/DeliveryTracking';
import { DebtInvoice } from '../../types/DebtInvoice';
import { DeliveryTimeline } from '../../components/delivery/DeliveryTimeline';
import { DeliveryTrackingCard } from '../../components/delivery/DeliveryTrackingCard';
import { OrderDeliveryItemsTable } from '../../components/delivery/OrderDeliveryItemsTable';
import { UpdateItemDeliveryQuantityModal } from '../../components/delivery/UpdateItemDeliveryQuantityModal';
import { InvoiceDetailModal } from '../../components/debts/InvoiceDetailModal';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<DeliveryTrackingDetails | null>(null);
  const [invoice, setInvoice] = useState<DebtInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isEditQuantityModalOpen, setIsEditQuantityModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
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

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [orderData, trackingData] = await Promise.all([
        orderService.getById(id),
        deliveryTrackingService.getByOrderId(id),
      ]);
      if (orderData) {
        setOrder(orderData);
        const inv = debtInvoiceService.getById(orderData.id) || debtInvoiceService.getById(orderData.code);
        if (inv) setInvoice(inv);
      }
      if (trackingData) setTracking(trackingData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAdvanceMilestone = async (nextMilestone: DeliveryMilestoneKey) => {
    if (!id) return;
    try {
      const updated = await deliveryTrackingService.updateMilestone(id, nextMilestone);
      setTracking(updated);
      const refreshed = await orderService.getById(id);
      if (refreshed) setOrder(refreshed);
      showToast(`Đã chuyển mốc giao hàng: ${nextMilestone}`, 'success');
    } catch {
      showToast('Lỗi cập nhật tiến trình giao hàng', 'error');
    }
  };

  const handleSaveItemDeliveryQuantities = async (
    updates: { productId: string; deliveredQuantity: number; shortageReason?: string }[],
    resolutionNote: string
  ) => {
    if (!order) return;
    try {
      const updated = await orderService.updateItemDeliveryQuantities(
        order.id,
        updates,
        resolutionNote
      );
      setOrder(updated);
      showToast('Đã lưu số lượng thực giao theo dòng hàng thành công', 'success');
    } catch {
      showToast('Lỗi cập nhật số lượng thực giao', 'error');
    }
  };

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
      if (id) {
        const trackingData = await deliveryTrackingService.getByOrderId(id);
        if (trackingData) setTracking(trackingData);
      }
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
          <Link to={`/orders/${order.id}/delivery`}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Truck className="w-4 h-4 text-indigo-600" />}
              className="text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50"
            >
              Hành trình giao hàng
            </Button>
          </Link>
          {invoice && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInvoiceModalOpen(true)}
              leftIcon={<FileText className="w-4 h-4 text-emerald-600" />}
              className="text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50"
            >
              Hóa đơn VAT ({invoice.invoiceNumber})
            </Button>
          )}

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
      {/* Order Delivery Status Timeline Tracker - SCRUM-695: 5 Mốc Giao Hàng */}
      {tracking && (
        <div className="mb-6 space-y-3">
          <DeliveryTimeline
            milestones={tracking.milestones}
            currentMilestone={tracking.currentMilestone}
            isCancelled={order.status === 'cancelled'}
            cancelledReason="Đơn hàng này đã bị hủy bỏ. Toàn bộ tiến trình giao nhận đã dừng lại."
            variant="stepper"
            canManage={order.status !== 'cancelled'}
            onAdvanceMilestone={handleAdvanceMilestone}
          />
          <div className="flex items-center justify-end">
            <Link
              to={`/orders/${order.id}/delivery`}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Xem toàn bộ nhật ký giao nhận & chi tiết vận đơn</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
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
        {/* Left: Products & Delivery Item Quantities (SCRUM-696) (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <OrderDeliveryItemsTable
            items={order.items}
            orderTotal={order.total}
            hasShortage={order.hasShortage}
            shortageResolution={order.shortageResolution}
            canEdit={order.status !== 'cancelled'}
            onOpenEditModal={() => setIsEditQuantityModalOpen(true)}
          />
        </div>

        {/* Right: Delivery Info, Customer & Financials (1 col) */}
        <div className="space-y-6">
          {/* Thông tin giao nhận & vận chuyển (SCRUM-695) */}
          {tracking && (
            <DeliveryTrackingCard tracking={tracking} showViewTrackingLink={true} />
          )}

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
              Thông Tin Đại Lý / Khách Hàng
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

      {/* Modal cập nhật số lượng thực giao (SCRUM-696) */}
      <UpdateItemDeliveryQuantityModal
        isOpen={isEditQuantityModalOpen}
        onClose={() => setIsEditQuantityModalOpen(false)}
        items={order.items}
        currentResolution={order.shortageResolution}
        onSave={handleSaveItemDeliveryQuantities}
      />

      {/* Modal xem chi tiết & tải lại hoá đơn điện tử (SCRUM-755) */}
      <InvoiceDetailModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoice={invoice}
      />

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
