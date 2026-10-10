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
  const [cancelReason, setCancelReason] = useState('Khách hàng đổi ý / không nhận hàng');

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

  const handleCancel = async () => {
    if (!order) return;
    try {
      const updated = await orderService.cancelOrder(order.id, cancelReason, user?.name || 'Nhân viên');
      setOrder(updated);
      showToast('Đã hủy đơn hàng và hoàn lại số lượng tồn kho thành công', 'success');
      setIsCancelModalOpen(false);
    } catch (err: any) {
      showToast(err?.message || 'Lỗi khi hủy đơn hàng', 'error');
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
                    <th className="pb-3 text-center">Số lượng</th>
                    <th className="pb-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {order.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-3">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{it.name}</p>
                        <span className="text-[11px] text-slate-400 font-mono">SKU: {it.sku}</span>
                      </td>
                      <td className="py-3 text-center font-medium">{formatCurrency(it.price)}</td>
                      <td className="py-3 text-center font-bold">{it.quantity}</td>
                      <td className="py-3 text-right font-black text-slate-900 dark:text-white">
                        {formatCurrency(it.subtotal)}
                      </td>
                    </tr>
                  ))}
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

      {/* Modal Hủy Đơn Hàng (kèm nhập lý do cho nhánh Hủy SC-238) */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Xác Nhận Hủy Đơn Hàng"
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
              Lý do hủy đơn hàng *
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do chi tiết (VD: Khách đổi ý, hết hàng trong kho, sai thông tin giao hàng...)"
              rows={3}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="sm" onClick={() => setIsCancelModalOpen(false)}>
              Quay lại
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleCancel}
              disabled={!cancelReason.trim()}
            >
              Xác nhận hủy đơn
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
};
