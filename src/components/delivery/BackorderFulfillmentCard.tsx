import React, { useState } from 'react';
import {
  Truck,
  PackageCheck,
  Calendar,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Printer,
  X,
  Sparkles,
  Building2,
  ArrowRight,
  RotateCcw,
  BadgeCheck,
  Phone,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export interface BackorderItemInfo {
  id: string | number;
  name: string;
  sku?: string;
  unit?: string;
  shortQty: number;
  price: number;
  shortAmount: number;
  warehouseAvailable?: number;
}

export interface BackorderFulfillmentCardProps {
  orderCode: string;
  orderId?: string;
  items: BackorderItemInfo[];
  totalShortAmount: number;
  isConfirmed?: boolean;
  onConfirmBackorder?: () => void;
  onSwitchToDeduction?: () => void;
}

export const BackorderFulfillmentCard: React.FC<BackorderFulfillmentCardProps> = ({
  orderCode,
  orderId = 'ORD-002',
  items,
  totalShortAmount,
  isConfirmed = true,
  onConfirmBackorder,
  onSwitchToDeduction,
}) => {
  const [showSlipModal, setShowSlipModal] = useState(false);
  const totalBackorderQty = items.reduce((acc, it) => acc + it.shortQty, 0);

  // Mocked details for the second batch
  const backorderSlipCode = `PX-BU-${orderCode.replace(/^DH-/, '') || '2026-002'}`;
  const backorderTripCode = `TRIP-BU-02`;
  const estimatedDelivery = '18/10/2026 (14:00 - 17:00)';
  const originWarehouse = 'Kho Tổng Tân Bình (Lô C3 KCN Tân Bình, Q. Tân Bình, TP.HCM)';
  const driverBackorder = {
    name: 'Nguyễn Văn Hùng',
    phone: '0912 345 678',
    vehicle: '51D-932.11 (Xe tải 1.9 tấn)',
  };

  const steps = [
    {
      title: 'Xác nhận lập phiếu bù',
      time: '17/10/2026 15:40',
      status: 'completed',
      desc: 'Hệ thống đã tự động phê duyệt phiếu xuất bù đợt 2',
    },
    {
      title: 'Soạn & Giữ hàng tại kho',
      time: '17/10/2026 17:15',
      status: 'completed',
      desc: 'Kho Tổng Tân Bình đã hoàn tất đóng gói và dán niêm phong',
    },
    {
      title: 'Bàn giao tài xế xuất kho',
      time: 'Dự kiến 08:30 sáng mai',
      status: 'current',
      desc: `Xe ${driverBackorder.vehicle} nhận kiện hàng giao tuyến Tân Bình - Quận 1`,
    },
    {
      title: 'Giao tận nơi cho đại lý',
      time: estimatedDelivery,
      status: 'upcoming',
      desc: 'Bàn giao, kiểm đếm đủ số lượng và ký biên bản giao bù',
    },
  ];

  return (
    <>
      <div className="rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 p-5 shadow-sm space-y-4">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100 dark:border-indigo-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Kế Hoạch Bù Hàng Đợt 2 (Backorder)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  ĐỦ ĐIỀU KIỆN XUẤT BÙ ({totalBackorderQty} SP)
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                Kho Tổng đã giữ chỗ hàng tồn & lên lịch giao bù đợt 2
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setShowSlipModal(true)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 transition shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Xem phiếu xuất bù</span>
            </button>
            {onSwitchToDeduction && (
              <button
                onClick={onSwitchToDeduction}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-amber-950/50 text-slate-600 hover:text-amber-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 transition"
                title="Đổi sang khấu trừ công nợ nếu không muốn chờ giao bù"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đổi sang trừ nợ</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Summary Infoboxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Card 1: Chuyến xe & Thời gian */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-semibold flex items-center gap-1.5 text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                Thời gian giao dự kiến
              </span>
              <span className="font-mono text-[10px] bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded text-indigo-700 dark:text-indigo-300 font-bold">
                Đợt 2
              </span>
            </div>
            <div className="font-black text-slate-800 dark:text-white text-sm">
              {estimatedDelivery}
            </div>
            <div className="text-[11px] text-slate-500">
              Mã chuyến xe: <b className="font-mono text-slate-700 dark:text-slate-300">{backorderTripCode}</b>
            </div>
          </div>

          {/* Card 2: Kho xuất & Cước phí */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-semibold flex items-center gap-1.5 text-[11px]">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                Kho điều phối xuất bù
              </span>
              <span className="font-mono text-[10px] bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded text-emerald-700 dark:text-emerald-300 font-bold">
                Cước: 0 đ
              </span>
            </div>
            <div className="font-bold text-slate-800 dark:text-white text-xs truncate" title={originWarehouse}>
              Kho Tổng Tân Bình (Có sẵn tồn kho)
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Miễn phí 100% cước giao bù phát sinh
            </div>
          </div>

          {/* Card 3: Tài xế phụ trách */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-semibold flex items-center gap-1.5 text-[11px]">
                <Truck className="w-3.5 h-3.5 text-indigo-600" />
                Tài xế giao đợt 2
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{driverBackorder.vehicle.split(' ')[0]}</span>
            </div>
            <div className="font-black text-slate-800 dark:text-white text-xs flex items-center justify-between">
              <span>{driverBackorder.name}</span>
              <a
                href={`tel:${driverBackorder.phone}`}
                className="text-indigo-600 hover:underline flex items-center gap-1 text-[11px]"
              >
                <Phone className="w-3 h-3" />
                {driverBackorder.phone}
              </a>
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {driverBackorder.vehicle}
            </div>
          </div>
        </div>

        {/* Danh sách sản phẩm được bù */}
        <div className="bg-white dark:bg-slate-800/90 rounded-xl border border-indigo-100 dark:border-slate-700 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              Sản phẩm nằm trong danh mục bù hàng đợt 2:
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              Tổng giá trị bù: {formatCurrency(totalShortAmount)}
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
            {items.map((it) => (
              <div key={it.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 dark:text-white truncate">
                    {it.name}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Mã SKU: <b className="font-mono text-slate-600 dark:text-slate-300">{it.sku || 'N/A'}</b></span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" />
                      Tồn kho đã khóa: {it.shortQty} {it.unit || 'sản phẩm'}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-black text-indigo-600 dark:text-indigo-400">
                    +{it.shortQty} {it.unit || 'sản phẩm'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Đơn giá: {formatCurrency(it.price)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mini Step Tracker for Backorder Delivery */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            Tiến độ chuẩn bị xuất bù đợt 2:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            {steps.map((st, i) => {
              const isCompleted = st.status === 'completed';
              const isCurrent = st.status === 'current';
              return (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl border text-xs transition ${
                    isCompleted
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                      : isCurrent
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : isCurrent ? (
                      <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-white text-[9px] flex items-center justify-center font-mono shrink-0 animate-pulse">
                        {i + 1}
                      </span>
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-[9px] flex items-center justify-center font-mono shrink-0">
                        {i + 1}
                      </span>
                    )}
                    <span className={`text-[11px] truncate ${isCurrent ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      {st.title}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">{st.time}</div>
                  <div className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                    {st.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal: Xem chi tiết phiếu xuất bù */}
      {showSlipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Phiếu Xuất Giao Bù Đợt 2 (Backorder Note)
                </h3>
              </div>
              <button
                onClick={() => setShowSlipModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Slip Content */}
            <div id="printable-backorder-slip" className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs uppercase font-black text-indigo-600">HỆ THỐNG KHO VẬN OMS PRO</div>
                  <div className="text-sm font-black text-slate-800 dark:text-white mt-1">
                    PHIẾU ĐIỀU PHỐI XUẤT BÙ ĐỢT 2
                  </div>
                  <div className="text-slate-400 font-mono mt-0.5">Số: {backorderSlipCode}</div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold font-mono text-[11px]">
                    SẴN SÀNG XUẤT KHO
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">Đơn gốc: {orderCode}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Kho xuất bù:</span>
                  <b className="text-slate-700 dark:text-slate-200">{originWarehouse}</b>
                </div>
                <div>
                  <span className="text-slate-400 block">Dự kiến giao:</span>
                  <b className="text-indigo-600 dark:text-indigo-400">{estimatedDelivery}</b>
                </div>
                <div>
                  <span className="text-slate-400 block">Tài xế nhận hàng:</span>
                  <b className="text-slate-700 dark:text-slate-200">{driverBackorder.name} ({driverBackorder.phone})</b>
                </div>
                <div>
                  <span className="text-slate-400 block">Cước phí giao bù:</span>
                  <b className="text-emerald-600 dark:text-emerald-400">0 đ (Miễn phí 100%)</b>
                </div>
              </div>

              {/* Items Table */}
              <div className="pt-2">
                <div className="font-bold text-slate-700 dark:text-slate-300 mb-2">Chi tiết mặt hàng xuất bù:</div>
                <table className="w-full text-left">
                  <thead className="bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="p-2">Sản phẩm</th>
                      <th className="p-2 text-center">SL Bù</th>
                      <th className="p-2 text-right">Đơn giá</th>
                      <th className="p-2 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {items.map((it) => (
                      <tr key={it.id}>
                        <td className="p-2 font-bold text-slate-800 dark:text-white">
                          {it.name}
                          <div className="text-[10px] text-slate-400 font-mono">{it.sku}</div>
                        </td>
                        <td className="p-2 text-center font-bold text-indigo-600">
                          {it.shortQty} {it.unit || 'cái'}
                        </td>
                        <td className="p-2 text-right">{formatCurrency(it.price)}</td>
                        <td className="p-2 text-right font-bold">{formatCurrency(it.shortAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-300 dark:border-slate-600 font-bold">
                      <td colSpan={3} className="p-2 text-right">Tổng giá trị giao bù:</td>
                      <td className="p-2 text-right text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(totalShortAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowSlipModal(false)}
                className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In phiếu bù</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
