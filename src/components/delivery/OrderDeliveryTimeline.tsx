import React, { useState } from 'react';
import {
  CheckCircle2,
  Boxes,
  PackageCheck,
  Truck,
  ShieldCheck,
  Clock,
  MapPin,
  User,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  Phone,
  Building2,
  Copy,
  Check,
} from 'lucide-react';
import { MilestoneStep, DeliveryMilestoneKey } from '../../services/deliveryTrackingService';

export interface ShipmentDetails {
  tripCode?: string;
  carrierName?: string;
  expectedDeliveryDate?: string;
  warehouseName?: string;
  warehouseAddress?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  deliveryNotes?: string;
  driverName?: string;
  driverPhone?: string;
  vehiclePlate?: string;
}

interface OrderDeliveryTimelineProps {
  milestones: MilestoneStep[];
  currentKey?: DeliveryMilestoneKey | 'pending' | 'cancelled';
  progressPercentage?: number;
  compact?: boolean;
  onMilestoneClick?: (milestone: MilestoneStep) => void;
  driverInfo?: {
    driverName?: string;
    driverPhone?: string;
    vehiclePlate?: string;
  };
  shipmentInfo?: ShipmentDetails;
}

// Icon mapper for 5 milestones
const getMilestoneIcon = (key: DeliveryMilestoneKey, className: string = 'w-5 h-5') => {
  switch (key) {
    case 'confirmed':
      return <CheckCircle2 className={className} />;
    case 'preparing':
      return <Boxes className={className} />;
    case 'dispatched':
      return <PackageCheck className={className} />;
    case 'shipping':
      return <Truck className={className} />;
    case 'delivered':
      return <ShieldCheck className={className} />;
    default:
      return <Clock className={className} />;
  }
};

export const OrderDeliveryTimeline: React.FC<OrderDeliveryTimelineProps> = ({
  milestones,
  currentKey = 'shipping',
  progressPercentage = 75,
  compact = false,
  onMilestoneClick,
  driverInfo,
  shipmentInfo,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [showMilestoneLogs, setShowMilestoneLogs] = useState<boolean>(false);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  // Find currently active step
  const activeStep = milestones.find((m) => m.status === 'current') || milestones[milestones.length - 1];

  return (
    <div className={`w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all ${
      compact ? 'p-4 sm:p-5' : 'p-6 sm:p-7 shadow-sm'
    }`}>
      {/* 1. Header & Progress Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
              Tiến Độ Giao Hàng (Timeline 5 Mốc)
            </h4>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {progressPercentage}%
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi trạng thái: <b className="text-indigo-600 dark:text-indigo-400 font-bold">{activeStep?.label}</b> — {activeStep?.description}
          </p>
        </div>

        {/* Action button & Current status pill */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Nút xem/ẩn chi tiết nhật ký các mốc giao nhận */}
          {!compact && (
            <button
              type="button"
              onClick={() => setShowMilestoneLogs((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border shadow-xs cursor-pointer ${
                showMilestoneLogs
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-indigo-300'
              }`}
              title={showMilestoneLogs ? 'Ẩn chi tiết nhật ký các mốc' : 'Xem chi tiết nhật ký các mốc giao nhận'}
            >
              <Clock className={`w-3.5 h-3.5 ${showMilestoneLogs ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`} />
              <span>{showMilestoneLogs ? 'Ẩn nhật ký mốc' : 'Chi tiết nhật ký mốc'}</span>
              {showMilestoneLogs ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Current status pill */}
          {currentKey === 'delivered' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Đã giao thành công
            </span>
          ) : currentKey === 'shipping' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 animate-pulse">
              <Truck className="w-4 h-4 text-blue-600" />
              Đang trên đường giao
            </span>
          ) : currentKey === 'dispatched' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800">
              <PackageCheck className="w-4 h-4 text-purple-600" />
              Đã xuất kho bàn giao
            </span>
          ) : currentKey === 'preparing' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
              <Boxes className="w-4 h-4 text-amber-600" />
              Kho đang soạn hàng
            </span>
          ) : currentKey === 'confirmed' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800">
              <CheckCircle2 className="w-4 h-4 text-sky-600" />
              Đã duyệt đơn hàng
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              <Clock className="w-4 h-4" />
              Chờ duyệt
            </span>
          )}
        </div>
      </div>

      {/* 2. Visual Stepper Flow (Horizontal on desktop, responsive) */}
      <div className="pt-7 pb-4">
        {/* Horizontal Line Container */}
        <div className="relative">
          {/* Background gray connecting line */}
          <div className="hidden sm:block absolute top-6 left-8 right-8 h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 z-0" />

          {/* Active Progress colored line */}
          <div
            className="hidden sm:block absolute top-6 left-8 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500 -translate-y-1/2 z-0 transition-all duration-700"
            style={{ width: `${Math.max(0, Math.min(100, progressPercentage - 10))}%` }}
          />

          {/* Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
            {milestones.map((step, idx) => {
              const isCompleted = step.status === 'completed';
              const isCurrent = step.status === 'current';
              const isUpcoming = step.status === 'upcoming';

              return (
                <div
                  key={step.key}
                  onClick={() => {
                    if (onMilestoneClick) onMilestoneClick(step);
                    toggleExpand(idx);
                    if (!compact) setShowMilestoneLogs(true);
                  }}
                  className={`flex sm:flex-col items-center sm:text-center gap-3.5 p-2 rounded-xl transition cursor-pointer ${
                    isCurrent
                      ? 'bg-indigo-50/60 dark:bg-indigo-950/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {/* Step Node Icon Circle */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-xs ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                          : isCurrent
                          ? 'bg-indigo-600 text-white ring-4 ring-indigo-200 dark:ring-indigo-900/60 shadow-indigo-600/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {getMilestoneIcon(step.key, 'w-5 h-5')}
                    </div>

                    {/* Ping animation for active step */}
                    {isCurrent && (
                      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-indigo-500 border-2 border-white dark:border-slate-900" />
                      </span>
                    )}

                    {/* Step number badge */}
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-black flex items-center justify-center shadow-xs">
                      {step.stepNumber}
                    </div>
                  </div>

                  {/* Step Information */}
                  <div className="flex-1 sm:w-full min-w-0">
                    <div className="flex items-center sm:justify-center gap-1.5">
                      <span
                        className={`text-xs font-bold leading-tight ${
                          isCompleted
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : isCurrent
                            ? 'text-indigo-600 dark:text-indigo-400 font-black'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {step.label}
                      </span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-indigo-600 text-white sm:hidden">
                          Đang xử lý
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {step.description}
                    </p>

                    {/* Timestamp */}
                    {step.timestamp && (
                      <div className="flex items-center sm:justify-center gap-1 mt-1 text-[10px] text-slate-400 font-mono">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{step.timestamp.split(' ')[0]}</span>
                      </div>
                    )}

                    {isUpcoming && (
                      <span className="text-[10px] text-slate-400 italic block mt-0.5">
                        Chờ bước trước
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Detailed Milestone Expandable Cards (Shown when not compact, and showMilestoneLogs is true) */}
      {!compact && showMilestoneLogs && (
        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Chi Tiết Nhật Ký Các Mốc Giao Nhận
              </h5>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                5 Mốc
              </span>
            </div>

            {/* Thông tin tài xế giao vận trong header nhật ký mốc */}
            {driverInfo?.driverName && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-[11px]">
                <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-slate-500">Tài xế giao vận:</span>
                <span className="font-bold text-slate-800 dark:text-white">{driverInfo.driverName}</span>
                {driverInfo.vehiclePlate && (
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                    {driverInfo.vehiclePlate}
                  </span>
                )}
                {driverInfo.driverPhone && (
                  <a
                    href={`tel:${driverInfo.driverPhone}`}
                    className="ml-1 px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 transition shadow-xs"
                  >
                    <Phone className="w-2.5 h-2.5" />
                    <span>{driverInfo.driverPhone}</span>
                  </a>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400 hidden sm:inline">Bấm vào từng mốc để xem ghi chú vận hành</span>
              <button
                type="button"
                onClick={() => setShowMilestoneLogs(false)}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Thu gọn</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-1">
            {milestones.map((step, idx) => {
              const isCompleted = step.status === 'completed';
              const isCurrent = step.status === 'current';

              return (
                <div
                  key={step.key}
                  className={`p-3.5 rounded-xl border text-xs transition-all ${
                    isCurrent
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800 ring-1 ring-indigo-200 dark:ring-indigo-800'
                      : isCompleted
                      ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60 mb-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Mốc {step.stepNumber}: {step.label}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : isCurrent
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                      }`}
                    >
                      {isCompleted ? 'Hoàn tất' : isCurrent ? 'Đang chạy' : 'Chưa đến'}
                    </span>
                  </div>

                  {step.timestamp && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono mb-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{step.timestamp}</span>
                    </div>
                  )}

                  <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {step.operator && (
                      <div className="flex items-start gap-1">
                        <User className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{step.operator}</span>
                      </div>
                    )}
                    {step.location && (
                      <div className="flex items-start gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{step.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Khối thông tin tài xế & phương tiện chi tiết trong Mốc 4: Đang giao */}
                  {step.key === 'shipping' && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-blue-600" />
                          Tài xế giao vận
                        </span>
                        {(driverInfo?.vehiclePlate || '51F-889.23') && (
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs">
                            {driverInfo?.vehiclePlate || '51F-889.23'}
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {driverInfo?.driverName || step.operator || 'Trần Văn Nam'}
                      </div>
                      {(driverInfo?.driverPhone || '0908 123 456') && (
                        <div className="flex items-center justify-between pt-1 border-t border-blue-100 dark:border-blue-900/50">
                          <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300 font-semibold">
                            {driverInfo?.driverPhone || '0908 123 456'}
                          </span>
                          <a
                            href={`tel:${driverInfo?.driverPhone || '0908 123 456'}`}
                            className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 transition shadow-xs"
                          >
                            <Phone className="w-2.5 h-2.5" />
                            Gọi ngay
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 italic border-t border-slate-100 dark:border-slate-800 pt-1.5 leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              );
            })}
          </div>

          {/* CÁC THẺ THÔNG TIN CHI TIẾT CHUYẾN GIAO, KHO VÀ ĐIỂM NHẬN ĐẠI LÝ (ĐƯA VÀO ĐÂY THEO YÊU CẦU) */}
          {shipmentInfo && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              {/* Thẻ 1: Chuyến Giao Hàng */}
              <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-indigo-600" />
                    Chuyến Giao Hàng
                  </span>
                  {shipmentInfo.tripCode && (
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {shipmentInfo.tripCode}
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-xs">
                  <div className="text-slate-400 text-[11px]">Đơn vị vận chuyển:</div>
                  <div className="font-bold text-slate-800 dark:text-white">{shipmentInfo.carrierName || 'Đội xe vận chuyển nội bộ OMS Pro'}</div>
                </div>
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Dự kiến giao hàng:</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    {shipmentInfo.expectedDeliveryDate || 'Hôm nay'}
                  </span>
                </div>
              </div>

              {/* Thẻ 2: Kho Xuất Hàng */}
              <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    Kho Xuất Hàng
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-slate-800 dark:text-white">{shipmentInfo.warehouseName || 'Kho Tổng TP.HCM (Tân Bình)'}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {shipmentInfo.warehouseAddress || 'Lô B2, KCN Tân Bình, Tây Thạnh, Tân Phú, TP. HCM'}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-400 italic">
                  Niêm phong nguyên kiện xuất bến
                </div>
              </div>

              {/* Thẻ 3: Điểm Nhận Của Đại Lý */}
              <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    Điểm Nhận Của Đại Lý
                  </span>
                  {shipmentInfo.customerAddress && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(shipmentInfo.customerAddress || '');
                        setCopiedAddress(true);
                        setTimeout(() => setCopiedAddress(false), 2000);
                      }}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                      title="Sao chép địa chỉ"
                    >
                      {copiedAddress ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedAddress ? 'Đã chép' : 'Chép'}</span>
                    </button>
                  )}
                </div>
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-slate-800 dark:text-white flex items-center justify-between">
                    <span>{shipmentInfo.customerName}</span>
                    <span className="font-mono text-slate-500 text-[11px]">SĐT: {shipmentInfo.customerPhone}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                    {shipmentInfo.customerAddress}
                  </div>
                </div>
                {shipmentInfo.deliveryNotes && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-amber-600 dark:text-amber-400 italic">
                    Ghi chú: {shipmentInfo.deliveryNotes}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Compact Expandable Drawer (When compact = true and clicked) */}
      {compact && expandedIndex !== null && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          {(() => {
            const step = milestones[expandedIndex];
            if (!step) return null;
            return (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-white">
                  <span>Mốc {step.stepNumber}: {step.label}</span>
                  <button
                    onClick={() => setExpandedIndex(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Đóng
                  </button>
                </div>
                <p className="text-slate-600 dark:text-slate-300">{step.detail}</p>
                {step.timestamp && (
                  <div className="text-slate-500 font-mono text-[11px]">
                    Thời gian: {step.timestamp}
                  </div>
                )}
                {step.operator && (
                  <div className="text-slate-500 text-[11px]">
                    Người thực hiện: {step.operator}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
