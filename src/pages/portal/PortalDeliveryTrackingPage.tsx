import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Clock,
  Package,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Printer,
  Search,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';
import {
  deliveryTrackingService,
  OrderDeliveryTrackingData,
} from '../../services/deliveryTrackingService';
import { OrderDeliveryTimeline } from '../../components/delivery/OrderDeliveryTimeline';
import { OrderItemsDeliveryTable } from '../../components/delivery/OrderItemsDeliveryTable';



// -------------------------------------------------------------
// Main Component: PortalDeliveryTrackingPage
// -------------------------------------------------------------

export const PortalDeliveryTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [trackingData, setTrackingData] = useState<OrderDeliveryTrackingData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal actions
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmSuccessToast, setConfirmSuccessToast] = useState<string | null>(null);

  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueReason, setIssueReason] = useState('Giao thiếu sản phẩm');
  const [issueNote, setIssueNote] = useState('');
  const [submittingIssue, setSubmittingIssue] = useState(false);

  const targetOrderId = orderId || 'ORD-002';

  const loadTracking = async (id: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await deliveryTrackingService.getOrderTracking(id);
      setTrackingData(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không tìm thấy dữ liệu theo dõi đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTracking(targetOrderId);
  }, [targetOrderId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/portal/orders/${encodeURIComponent(searchQuery.trim())}/tracking`);
  };

  const handleConfirmDelivery = async () => {
    if (!trackingData) return;
    setConfirming(true);
    try {
      const res = await deliveryTrackingService.confirmDeliveryByDealer(trackingData.orderId);
      setShowConfirmModal(false);
      setConfirmSuccessToast(res.message);
      // Cập nhật mốc giao hàng đã giao
      loadTracking(trackingData.orderId);
      setTimeout(() => setConfirmSuccessToast(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xác nhận nhận hàng.');
    } finally {
      setConfirming(false);
    }
  };

  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingIssue(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setShowIssueModal(false);
      setIssueNote('');
      setConfirmSuccessToast('Đã gửi phản ánh sự cố giao hàng tới bộ phận điều phối kho!');
      setTimeout(() => setConfirmSuccessToast(null), 4000);
    } finally {
      setSubmittingIssue(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-16">
      {/* 1. Top Navbar / Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/portal/orders')}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
              title="Quay lại danh sách đơn"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Cổng Đại Lý / Vận Chuyển
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs text-slate-500">Mã đơn: <b className="font-mono text-slate-800 dark:text-slate-200 font-bold">{trackingData?.orderCode || targetOrderId}</b></span>
              </div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                Theo Dõi Tiến Độ Giao Hàng
              </h1>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadTracking(targetOrderId)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">In vận đơn</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {confirmSuccessToast && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-4 rounded-2xl bg-emerald-500 text-white shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-xs sm:text-sm font-bold flex-1">{confirmSuccessToast}</span>
            <button onClick={() => setConfirmSuccessToast(null)} className="opacity-75 hover:opacity-100 text-sm">✕</button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* 2. Order Search & Switcher Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Nhập mã đơn khác để tra cứu (VD: DH-2026-001, DH-2026-002)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-20 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition"
            >
              Tra cứu
            </button>
          </form>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Đơn mẫu:</span>
            {[
              { id: 'ORD-001', code: 'DH-2026-001 (Đã giao)' },
              { id: 'ORD-002', code: 'DH-2026-002 (Đang giao)' },
              { id: 'ORD-003', code: 'DH-2026-003 (Đã duyệt)' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/portal/orders/${p.id}/tracking`)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition ${
                  targetOrderId === p.id
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {p.code}
              </button>
            ))}
          </div>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
              Đang tải lộ trình & trạng thái giao hàng...
            </span>
          </div>
        ) : errorMessage ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
            <AlertTriangle className="w-12 h-12 mx-auto text-amber-500" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Không tìm thấy thông tin</h3>
            <p className="text-xs text-slate-500">{errorMessage}</p>
            <button
              onClick={() => navigate('/portal/orders')}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
            >
              Về danh sách đơn hàng
            </button>
          </div>
        ) : trackingData ? (
          <div id="printable-delivery" className="space-y-6">
            {/* Header khi in vận đơn */}
            <div className="hidden print:block pb-4 mb-3 border-b-2 border-slate-900 text-slate-900">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-wide">PHIẾU THEO DÕI VẬN ĐƠN & GIAO HÀNG</h1>
                  <p className="text-xs text-slate-600">Hệ Thống Quản Lý Phân Phối Kho Vận & Bán Hàng (OMS Pro)</p>
                </div>
                <div className="text-right text-xs">
                  <div>Mã đơn hàng: <b className="font-mono text-sm">{trackingData.orderId}</b></div>
                  <div>Chuyến xe: <b className="font-mono">{trackingData.tripCode}</b></div>
                  <div>Thời gian in: <b>{new Date().toLocaleString('vi-VN')}</b></div>
                </div>
              </div>
            </div>

            {/* 3. CORE TIMELINE COMPONENT (The 5 milestones & complete delivery info in detailed view) */}
            <OrderDeliveryTimeline
              milestones={trackingData.milestones}
              currentKey={trackingData.currentMilestoneKey}
              progressPercentage={trackingData.progressPercentage}
              compact={false}
              driverInfo={{
                driverName: trackingData.driverName,
                driverPhone: trackingData.driverPhone,
                vehiclePlate: trackingData.vehiclePlate,
              }}
              shipmentInfo={{
                tripCode: trackingData.tripCode,
                carrierName: trackingData.carrierName,
                expectedDeliveryDate: trackingData.expectedDeliveryDate,
                warehouseName: trackingData.warehouseName,
                warehouseAddress: trackingData.warehouseAddress,
                customerName: trackingData.customerName,
                customerPhone: trackingData.customerPhone,
                customerAddress: trackingData.customerAddress,
                deliveryNotes: trackingData.deliveryNotes,
                driverName: trackingData.driverName,
                driverPhone: trackingData.driverPhone,
                vehiclePlate: trackingData.vehiclePlate,
              }}
            />

            {/* 5. Shipment Items Table & Sign Confirmation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Items list (2 cols) */}
              <div className="lg:col-span-2">
                <OrderItemsDeliveryTable
                  items={trackingData.items}
                  orderStatus={trackingData.orderStatus}
                  hasShortDelivery={trackingData.hasShortDelivery}
                  orderCode={trackingData.orderCode}
                  onRequestBackorder={() => {
                    setConfirmSuccessToast('Đã ghi nhận yêu cầu lập chuyến giao bù đợt 2 tới bộ phận điều phối kho!');
                    setTimeout(() => setConfirmSuccessToast(null), 4000);
                  }}
                  onRequestDebtDeduction={() => {
                    setConfirmSuccessToast('Đã gửi yêu cầu khấu trừ hàng thiếu vào đối chiếu công nợ!');
                    setTimeout(() => setConfirmSuccessToast(null), 4000);
                  }}
                />
              </div>

              {/* Right: Actions & Support Bar (1 col) */}
              <div className="space-y-4">
                {/* Dealer Confirmation Box */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-indigo-950/40 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-900/50 space-y-3.5 no-print">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                    <ShieldCheck className="w-5 h-5" />
                    <h4 className="font-bold text-sm">Xác Nhận Nhận Hàng</h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Sau khi kiểm tra kiện hàng, số lượng và niêm phong đầy đủ từ tài xế giao vận, quý khách vui lòng bấm nút xác nhận để hoàn tất bàn giao.
                  </p>

                  {trackingData.currentMilestoneKey === 'delivered' ? (
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Đơn hàng đã được xác nhận giao thành công!</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Xác nhận đã nhận đủ hàng</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowIssueModal(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 transition"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Báo cáo sự cố kiện hàng</span>
                  </button>
                </div>

                {/* Hotlines & Support */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Hỗ Trợ Giao Vận 24/7
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Tài xế giao:</span>
                      <a href={`tel:${trackingData.driverPhone}`} className="font-bold text-indigo-600 hover:underline">
                        {trackingData.driverPhone}
                      </a>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Điều phối kho:</span>
                      <span className="font-bold text-slate-800 dark:text-white">1900 6868 (Ext 102)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">NVKD phụ trách:</span>
                      <span className="font-bold text-slate-800 dark:text-white">0918 223 344</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* 6. MODAL: Xác nhận đã nhận hàng */}
      {showConfirmModal && trackingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto shadow-xs">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Xác nhận đã nhận đủ hàng?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                Đơn hàng <b>#{trackingData.orderCode}</b> gồm <b>{trackingData.items.length} mặt hàng</b>.
                Quý khách vui lòng xác nhận khi đã kiểm tra nguyên vẹn kiện hàng và nhận đủ số lượng từ tài xế <b>{trackingData.driverName}</b>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
              >
                Kiểm tra lại
              </button>
              <button
                onClick={handleConfirmDelivery}
                disabled={confirming}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
              >
                {confirming ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Đã nhận đủ hàng</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: Báo cáo sự cố kiện hàng */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 dark:text-white">Phản ánh sự cố giao hàng</h3>
              </div>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReportIssue} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Loại sự cố</label>
                <select
                  value={issueReason}
                  onChange={(e) => setIssueReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="Giao thiếu sản phẩm">Giao thiếu sản phẩm trong kiện</option>
                  <option value="Kiện hàng bị móp méo / rách niêm phong">Kiện hàng bị móp méo / rách niêm phong</option>
                  <option value="Sản phẩm bị vỡ hỏng do vận chuyển">Sản phẩm bị vỡ hỏng do vận chuyển</option>
                  <option value="Giao sai địa chỉ hoặc trễ hẹn">Giao sai địa chỉ hoặc trễ hẹn</option>
                  <option value="Thái độ phục vụ của tài xế">Thái độ phục vụ của tài xế</option>
                  <option value="Khác">Lý do khác</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Vui lòng cung cấp chi tiết số lượng thiếu hoặc tình trạng để kho hỗ trợ bù đơn ngay..."
                  value={issueNote}
                  onChange={(e) => setIssueNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingIssue}
                  className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/25 transition"
                >
                  {submittingIssue ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                  <span>Gửi phản ánh</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
