import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Package,
  CreditCard,
  Truck,
  Check,
  RotateCcw,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { BackorderFulfillmentCard } from './BackorderFulfillmentCard';

export interface OrderItemDeliveryRow {
  id: string | number;
  product_id?: string;
  sku?: string;
  name: string;
  unit?: string;
  price: number;
  quantity: number;
  delivered_quantity?: number | null;
  is_short_delivered?: boolean;
  short_delivered_quantity?: number;
  shortfall_reason?: string;
  subtotal?: number;
}

export interface OrderItemsDeliveryTableProps {
  items: OrderItemDeliveryRow[];
  orderStatus?: string;
  hasShortDelivery?: boolean;
  orderCode?: string;
  onRequestBackorder?: () => void;
  onRequestDebtDeduction?: () => void;
  compact?: boolean;
}

export const OrderItemsDeliveryTable: React.FC<OrderItemsDeliveryTableProps> = ({
  items,
  orderStatus,
  hasShortDelivery = false,
  orderCode = 'DH-2026-002',
  onRequestBackorder,
  onRequestDebtDeduction,
  compact = false,
}) => {
  const [activeModal, setActiveModal] = useState<'backorder' | 'deduction' | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [dealerPlan, setDealerPlan] = useState<'backorder' | 'deduction'>('backorder');

  // Normalize delivery quantities
  const processedItems = items.map((it) => {
    const orderedQty = it.quantity || 0;
    let deliveredQty = it.delivered_quantity;

    if (deliveredQty == null) {
      if (it.is_short_delivered && it.short_delivered_quantity) {
        deliveredQty = Math.max(0, orderedQty - it.short_delivered_quantity);
      } else if (orderStatus === 'completed' || orderStatus === 'delivered' || orderStatus === 'shipping') {
        deliveredQty = orderedQty;
      } else {
        // Đơn chờ duyệt hoặc đang soạn: hiển thị dự kiến
        deliveredQty = orderedQty;
      }
    }

    const shortQty = it.short_delivered_quantity != null
      ? it.short_delivered_quantity
      : Math.max(0, orderedQty - (deliveredQty || 0));

    const isShort = it.is_short_delivered || shortQty > 0;
    const itemSubtotal = it.price * (deliveredQty || orderedQty);
    const shortAmount = it.price * shortQty;

    return {
      ...it,
      orderedQty,
      deliveredQty: deliveredQty || 0,
      shortQty,
      isShort,
      itemSubtotal,
      shortAmount,
      reason: it.shortfall_reason || (isShort ? 'Kho tạm hết hàng, nợ hàng giao bù đợt 2' : undefined),
    };
  });

  // Aggregated Statistics
  const totalOrderedQty = processedItems.reduce((acc, it) => acc + it.orderedQty, 0);
  const totalDeliveredQty = processedItems.reduce((acc, it) => acc + it.deliveredQty, 0);
  const totalShortQty = processedItems.reduce((acc, it) => acc + it.shortQty, 0);
  const totalShortAmount = processedItems.reduce((acc, it) => acc + it.shortAmount, 0);
  const isAnyShort = totalShortQty > 0 || hasShortDelivery;
  const fulfillmentRate = totalOrderedQty > 0 ? Math.round((totalDeliveredQty / totalOrderedQty) * 100) : 100;

  const shortItems = processedItems
    .filter((it) => it.isShort)
    .map((it) => ({
      id: it.id,
      name: it.name,
      sku: it.sku,
      unit: it.unit,
      shortQty: it.shortQty,
      price: it.price,
      shortAmount: it.shortAmount,
      warehouseAvailable: 25,
    }));

  const handleConfirmBackorder = () => {
    setActiveModal(null);
    setDealerPlan('backorder');
    setActionFeedback('Đã kích hoạt kế hoạch giao bù đợt 2 và gửi yêu cầu tới điều phối kho!');
    if (onRequestBackorder) onRequestBackorder();
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleConfirmDeduction = () => {
    setActiveModal(null);
    setDealerPlan('deduction');
    setActionFeedback(`Đã chuyển sang phương án khấu trừ ${formatCurrency(totalShortAmount)} vào kỳ đối chiếu công nợ!`);
    if (onRequestDebtDeduction) onRequestDebtDeduction();
    setTimeout(() => setActionFeedback(null), 4000);
  };

  return (
    <div className="space-y-4">
      {/* 1. Action Feedback Toast */}
      {actionFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* 2. Top Shortfall Alert Banner (If short delivery occurred) */}
      {isAnyShort && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-950/40 border-2 border-amber-300 dark:border-amber-800 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5 shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  CẢNH BÁO: ĐƠN HÀNG CÓ PHÁT SINH GIAO THIẾU HÀNG
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white font-mono">
                    Thiếu {totalShortQty} sản phẩm
                  </span>
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                  Kho xuất hàng đã ghi nhận số lượng thực giao ít hơn số lượng đặt do điều kiện tồn kho. Tổng trị giá phần hàng thiếu là{' '}
                  <b className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(totalShortAmount)}</b>.
                  Hệ thống kiểm tra: <b className="text-emerald-700 dark:text-emerald-300">Kho Tổng đã sẵn sàng lượng hàng thay thế để xuất bù đợt 2</b>.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons for dealer */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1 pl-10">
            <button
              onClick={() => {
                setDealerPlan('backorder');
                setActiveModal('backorder');
              }}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 ${
                dealerPlan === 'backorder'
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25 ring-2 ring-indigo-400/40'
                  : 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-slate-700'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Yêu cầu giao bù đợt 2 (Backorder)</span>
              {dealerPlan === 'backorder' && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-400 text-slate-900 text-[10px] font-black">
                  Đang chọn
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveModal('deduction')}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition ${
                dealerPlan === 'deduction'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Khấu trừ vào công nợ đại lý</span>
              {dealerPlan === 'deduction' && (
                <span className="px-1.5 py-0.5 rounded-full bg-white text-amber-900 text-[10px] font-black">
                  Đang chọn
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 3. Summary Stat Cards (Ordered vs Delivered vs Shortfall) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-slate-400 block text-[11px]">Tổng SL Đặt</span>
          <span className="text-base font-black text-slate-800 dark:text-white">
            {totalOrderedQty} <span className="text-xs font-normal text-slate-400">sản phẩm</span>
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-slate-400 block text-[11px]">SL Thực Giao</span>
          <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
            {totalDeliveredQty} <span className="text-xs font-normal text-slate-400">sản phẩm</span>
          </span>
        </div>

        <div className={`p-3 rounded-xl border ${
          totalShortQty > 0
            ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
        }`}>
          <span className="text-slate-400 block text-[11px]">Giao Thiếu (Nợ hàng)</span>
          <span className={`text-base font-black ${
            totalShortQty > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {totalShortQty > 0 ? `-${totalShortQty}` : '0'} <span className="text-xs font-normal text-slate-400">sản phẩm</span>
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-slate-400 block text-[11px]">Tỷ Lệ Đáp Ứng</span>
          <span className={`text-base font-black ${
            fulfillmentRate >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
          }`}>
            {fulfillmentRate}%
          </span>
        </div>
      </div>

      {/* 4. Main Breakdown Table (Detailed Rows with Ordered & Delivered Quantities) */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-indigo-600" />
            <h5 className="font-bold text-xs text-slate-800 dark:text-white uppercase tracking-wider">
              Chi Tiết Số Lượng Thực Giao Từng Dòng Hàng ({processedItems.length})
            </h5>
          </div>
          {isAnyShort && (
            <span className="text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
              Phát hiện {totalShortQty} sản phẩm thiếu
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/60 dark:bg-slate-800/50 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Sản phẩm</th>
                <th className="py-2.5 px-3 text-center">ĐVT</th>
                <th className="py-2.5 px-3 text-center">SL Đặt</th>
                <th className="py-2.5 px-3 text-center bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300">
                  SL Thực Giao
                </th>
                <th className="py-2.5 px-3 text-center">Trạng Thái Giao</th>
                <th className="py-2.5 px-3 text-right">Đơn Giá</th>
                <th className="py-2.5 px-3 text-right">Thành Tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {processedItems.map((itm) => (
                <tr
                  key={itm.id}
                  className={`transition ${
                    itm.isShort
                      ? 'bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/60'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Product & SKU */}
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 dark:text-white">{itm.name}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">{itm.sku}</div>
                    {itm.reason && (
                      <div className="text-[10px] text-amber-700 dark:text-amber-400 italic mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>{itm.reason}</span>
                      </div>
                    )}
                  </td>

                  {/* Unit */}
                  <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-300">
                    {itm.unit || 'cái'}
                  </td>

                  {/* Ordered Quantity */}
                  <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                    {itm.orderedQty}
                  </td>

                  {/* Delivered Quantity */}
                  <td className="py-3 px-3 text-center font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20 text-sm">
                    {itm.deliveredQty}
                  </td>

                  {/* Status / Shortfall Badge */}
                  <td className="py-3 px-3 text-center">
                    {itm.isShort ? (
                      <div className="inline-flex flex-col items-center gap-0.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          Thiếu -{itm.shortQty} ({itm.deliveredQty}/{itm.orderedQty})
                        </span>
                        <span className="text-[9px] text-rose-500 font-semibold">
                          Nợ {formatCurrency(itm.shortAmount)}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <Check className="w-3 h-3" />
                        Đủ hàng
                      </span>
                    )}
                  </td>

                  {/* Price */}
                  <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-300">
                    {formatCurrency(itm.price)}
                  </td>

                  {/* Line Total */}
                  <td className="py-3 px-3 text-right">
                    <div className="font-bold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(itm.itemSubtotal)}
                    </div>
                    {itm.isShort && (
                      <div className="text-[10px] text-rose-500 line-through">
                        {formatCurrency(itm.price * itm.orderedQty)}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4.1. PHẦN HIỂN THỊ KẾ HOẠCH GIAO BÙ ĐỢT 2 (NẾU BÙ ĐƯỢC HÀNG) */}
      {isAnyShort && shortItems.length > 0 && dealerPlan === 'backorder' && (
        <BackorderFulfillmentCard
          orderCode={orderCode}
          items={shortItems}
          totalShortAmount={totalShortAmount}
          onConfirmBackorder={() => setActiveModal('backorder')}
          onSwitchToDeduction={() => setActiveModal('deduction')}
        />
      )}

      {/* 4.2. Khấu trừ công nợ info (nếu đại lý chọn phương án khấu trừ) */}
      {isAnyShort && dealerPlan === 'deduction' && (
        <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 p-4 space-y-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5 shadow-2xs">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-amber-950 dark:text-amber-200">
                PHƯƠNG ÁN ĐÃ CHỌN: KHẤU TRỪ VÀO KỲ ĐỐI CHIẾU CÔNG NỢ
              </h5>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                Số tiền <b>{formatCurrency(totalShortAmount)}</b> ({totalShortQty} sản phẩm thiếu) sẽ được cấn trừ trực tiếp khi kế toán chốt sổ đối chiếu công nợ.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setDealerPlan('backorder');
              setActionFeedback('Đã chuyển sang phương án nhận giao bù đợt 2.');
              setTimeout(() => setActionFeedback(null), 3000);
            }}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 shadow-2xs flex items-center gap-1.5 self-start sm:self-auto shrink-0 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đổi sang nhận giao bù đợt 2</span>
          </button>
        </div>
      )}

      {/* 5. MODAL: Yêu cầu giao bù đợt 2 */}
      {activeModal === 'backorder' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center mx-auto shadow-xs">
              <Truck className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Xác nhận yêu cầu giao bù đợt 2?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                Hệ thống sẽ tự động lập phiếu giao bù cho <b>{totalShortQty} sản phẩm</b> đang thiếu.
                Bộ phận điều phối kho sẽ ưu tiên sắp xếp xe giao tới quý đại lý ngay khi hàng về kho.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmBackorder}
                className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition"
              >
                Gửi yêu cầu ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: Khấu trừ công nợ */}
      {activeModal === 'deduction' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto shadow-xs">
              <CreditCard className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Khấu trừ giá trị hàng thiếu vào công nợ?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                Số tiền <b>{formatCurrency(totalShortAmount)}</b> tương ứng với <b>{totalShortQty} sản phẩm</b> thiếu sẽ được tự động ghi giảm công nợ phải trả của đại lý trong biên bản đối chiếu kỳ này.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
              >
                Xem lại
              </button>
              <button
                onClick={handleConfirmDeduction}
                className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/25 transition"
              >
                Xác nhận khấu trừ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
