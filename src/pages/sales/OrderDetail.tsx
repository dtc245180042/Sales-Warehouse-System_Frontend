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
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Loading } from '../../components/common/Loading';
import { EmptyState } from '../../components/common/EmptyState';
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

  const handleCancel = async () => {
    if (!order) return;
    try {
      const updated = await orderService.cancelOrder(order.id);
      setOrder(updated);
      showToast('Đã hủy đơn hàng thành công', 'success');
      setIsCancelModalOpen(false);
      // Reload tracking to reflect cancellation
      if (id) {
        const trackingData = await deliveryTrackingService.getByOrderId(id);
        if (trackingData) setTracking(trackingData);
      }
    } catch {
      showToast('Lỗi khi hủy đơn hàng', 'error');
    }
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
        <div className="flex items-center gap-2">
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            In phiếu xuất
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => showToast('Đang tạo và tải file PDF đơn hàng...', 'info')}
            leftIcon={<FileDown className="w-4 h-4" />}
          >
            Xuất PDF
          </Button>
          {order.status !== 'cancelled' && order.status !== 'completed' && (
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
                <span>+{formatCurrency(order.tax)}</span>
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

      <ConfirmDialog
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancel}
        title="Xác nhận hủy đơn hàng"
        message="Bạn có chắc chắn muốn hủy đơn hàng này? Toàn bộ số lượng sản phẩm sẽ được hoàn trả về tồn kho."
        confirmText="Hủy đơn"
        variant="danger"
      />
    </PageContainer>
  );
};
