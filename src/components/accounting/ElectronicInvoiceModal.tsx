import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Copy,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';
import { ElectronicInvoice } from '../../types/Invoice';
import { formatCurrency } from '../../utils/formatters';
import { invoiceService } from '../../services/invoiceService';

interface ElectronicInvoiceModalProps {
  open: boolean;
  invoice: ElectronicInvoice | null;
  onClose: () => void;
  onDownloadSuccess?: (msg: string) => void;
}

export const ElectronicInvoiceModal: React.FC<ElectronicInvoiceModalProps> = ({
  open,
  invoice,
  onClose,
  onDownloadSuccess,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  if (!open || !invoice) return null;

  const handleCopyLookup = () => {
    navigator.clipboard.writeText(invoice.lookupCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownload = () => {
    invoiceService.downloadInvoicePdf(invoice);
    if (onDownloadSuccess) {
      onDownloadSuccess(`Đã tải lại tệp hoá đơn điện tử ${invoice.invoiceCode} thành công!`);
    }
  };

  const handlePrint = () => {
    invoiceService.printInvoice(invoice);
  };

  const cleanNum = (val: number) => {
    return formatCurrency(val).replace(' ₫', '').replace(' đ', '');
  };

  const issueDateFormatted = invoice.issueDate
    ? invoice.issueDate.split(' ')[0]
    : '10/05/2026';

  const isBankTransfer = (invoice.paymentMethod || '').toLowerCase().includes('chuyển khoản');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full my-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[94vh] overflow-hidden">
        {/* Modal Topbar (hidden during print) */}
        <div className="p-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                  Hóa Đơn - Phiếu Thu Tiền Cước Vận Chuyển
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Liên 2: Giao cho khách
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono">
                Số: {invoice.invoiceNumber || '0091829'} • Ký hiệu: {invoice.series || 'HK/11T'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - Strict reproduction of the user's provided official sales invoice / receipt layout */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950">
          <div
            id="printable-invoice"
            className="mx-auto max-w-3xl bg-white text-black p-8 sm:p-10 shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-0 print:m-0 font-serif text-[13px] leading-relaxed select-text"
          >
            {/* 1. TOP HEADER: LEFT ISSUING OFFICE & RIGHT FORM METADATA */}
            <div className="flex justify-between items-start gap-4 pb-2 border-b border-transparent">
              {/* Left Header */}
              <div className="space-y-1 max-w-[62%]">
                {/* Brand Logo & Logotype */}
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    TN
                  </div>
                  <div>
                    <div className="font-bold text-base tracking-wide text-red-600 uppercase font-sans">
                      TRƯỜNG NAM LOGISTICS
                    </div>
                    <div className="text-[11px] text-slate-700 font-sans font-semibold tracking-tight">
                      Vietnam Airlines Cargo / OMS Pro
                    </div>
                  </div>
                </div>

                <div className="text-[12.5px]">
                  <span className="font-semibold">Nơi xuất vé (Issuing Office):</span>{' '}
                  <span>{invoice.sellerName || 'CTY CP EN VIET'}</span>
                </div>
                <div className="text-[12px] text-slate-800">
                  <span className="font-semibold">Địa chỉ (Address):</span>{' '}
                  <span>{invoice.sellerAddress || '69B Nguyen Huu Dat, P. Tay Thanh, Q. Tan Phu, TP.HCM'}</span>
                </div>
              </div>

              {/* Right Header: Form No, Serial, Invoice No */}
              <div className="text-right text-[12.5px] space-y-1 shrink-0 pt-1">
                <div>
                  <span className="font-semibold">Mẫu số (Form No):</span>{' '}
                  <b className="font-sans font-semibold">{invoice.templateCode || '01GTKT3/004'}</b>
                </div>
                <div>
                  <span className="font-semibold">Ký hiệu (Serial):</span>{' '}
                  <b className="font-sans font-semibold">{invoice.series || 'HK/11T'}</b>
                </div>
                <div>
                  <span className="font-semibold">Số hóa đơn (Invoice No):</span>{' '}
                  <b className="font-sans font-black text-sm text-red-700 print:text-black">
                    {invoice.invoiceNumber || '0091829'}
                  </b>
                </div>
              </div>
            </div>

            {/* 2. CENTER TITLE */}
            <div className="text-center my-4 space-y-0.5">
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide">
                HÓA ĐƠN - PHIẾU THU TIỀN CƯỚC VẬN CHUYỂN
              </h2>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                (SALES INVOICE / RECEIPT)
              </h3>
              <p className="text-[12px] italic text-slate-700 pt-0.5">
                Liên 2 : Giao cho khách ( Copy 2 for Customer )
              </p>
            </div>

            {/* 3. ISSUING ENTITY & VAT CODE */}
            <div className="space-y-1 text-[12.5px] border-t border-slate-300 pt-2.5">
              <div>
                <span className="font-semibold">
                  Tổng công ty Hàng không Việt Nam ( Vietnam Airlines ) / Đơn vị cung cấp:
                </span>{' '}
                <span>{invoice.sellerName}</span>
              </div>
              <div>
                <span className="font-semibold">Mã số thuế (Vat Code) :</span>{' '}
                <span className="font-sans font-bold">{invoice.sellerTaxCode}</span>
              </div>
            </div>

            {/* 4. CUSTOMER INFORMATION */}
            <div className="space-y-1 text-[12.5px] pt-2">
              <div>
                <span className="font-semibold">Tên khách hàng (Customer):</span>{' '}
                <b className="uppercase">{invoice.buyerUnitName || invoice.buyerName}</b>
              </div>
              <div>
                <span className="font-semibold">Mã số thuế (VAT Code):</span>{' '}
                <span className="font-sans font-bold">{invoice.buyerTaxCode}</span>
              </div>
              <div>
                <span className="font-semibold">Địa chỉ (Address):</span>{' '}
                <span>{invoice.buyerAddress}</span>
              </div>
            </div>

            {/* 5. ITEM BREAKDOWN (1. TIỀN VÉ / TIỀN CƯỚC) */}
            <div className="pt-3 space-y-2">
              <div className="font-bold text-[13px]">
                1. Tiền vé ( Due to VietNam Airlines ) / Tiền cước:
              </div>
              <div className="pl-3 font-semibold text-[12.5px]">
                1.1 Giá cước ( Air fare ):
              </div>

              {/* Items Table with standard borders */}
              <div className="overflow-x-auto my-1">
                <table className="w-full text-left text-[12px] border-collapse border border-slate-500">
                  <thead className="bg-slate-50 border-b border-slate-500 font-bold text-center">
                    <tr>
                      <th className="p-2 border border-slate-500">
                        Số vé<br />
                        <span className="font-normal italic text-[11px]">(Ticket No)</span>
                      </th>
                      <th className="p-2 border border-slate-500">
                        Hành trình / Diễn giải<br />
                        <span className="font-normal italic text-[11px]">(Route)</span>
                      </th>
                      <th className="p-2 border border-slate-500 w-16">
                        Số lượng<br />
                        <span className="font-normal italic text-[11px]">(Quantity)</span>
                      </th>
                      <th className="p-2 border border-slate-500 text-right w-24">
                        Đơn giá<br />
                        <span className="font-normal italic text-[11px]">(Unit price)</span>
                      </th>
                      <th className="p-2 border border-slate-500 text-right w-28">
                        Thành tiền<br />
                        <span className="font-normal italic text-[11px]">(Amount)</span>
                      </th>
                      <th className="p-2 border border-slate-500 text-center w-20">
                        Loại tiền<br />
                        <span className="font-normal italic text-[11px]">(Currency)</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-400">
                    {invoice.items.map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td className="p-2 border border-slate-400 font-sans text-center">
                          {it.sku || it.productId || `738242056749${idx}`}
                        </td>
                        <td className="p-2 border border-slate-400">
                          <div className="font-semibold">{it.productName}</div>
                        </td>
                        <td className="p-2 border border-slate-400 font-sans text-center font-bold">
                          {it.quantity}
                        </td>
                        <td className="p-2 border border-slate-400 font-sans text-right">
                          {cleanNum(it.unitPrice)}
                        </td>
                        <td className="p-2 border border-slate-400 font-sans text-right font-bold">
                          {cleanNum(it.subtotal)}
                        </td>
                        <td className="p-2 border border-slate-400 text-center font-sans">
                          VND
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 1.2 Thuế GTGT */}
              <div className="flex justify-between items-center text-[12.5px] pl-3 pt-1">
                <div>
                  <span className="font-semibold">
                    1.2 Thuế GTGT (Value Added Tax) ({invoice.taxRate}%):
                  </span>
                </div>
                <div className="font-sans font-bold flex gap-4 text-right">
                  <span>{cleanNum(invoice.taxAmount)}</span>
                  <span className="w-12 text-center">VND</span>
                </div>
              </div>

              {/* 1.3 Thuế Phí khác */}
              <div className="text-[12.5px] pl-3 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">1.3 Thuế Phí khác (Other Tax charge):</span>
                  <div className="font-sans font-bold flex gap-4 text-right">
                    <span>0</span>
                    <span className="w-12 text-center">VND</span>
                  </div>
                </div>
                <div className="pl-6 text-[11.5px] space-y-0.5 text-slate-700">
                  <div>Thuế khác (Other Tax):</div>
                  <div>Phí khác (Other charge):</div>
                  <div>Hoa hồng (Commission):</div>
                </div>
              </div>

              {/* 1.4 Tổng tiền vé / hàng */}
              <div className="flex justify-between items-center text-[13px] font-bold pl-3 pt-1.5 border-t border-slate-300">
                <div>
                  1.4 Tổng tiền vé (1.1 + 1.2 + 1.3):
                </div>
                <div className="font-sans flex gap-4 text-right font-black">
                  <span>{cleanNum(invoice.totalAmount)}</span>
                  <span className="w-12 text-center">VND</span>
                </div>
              </div>
            </div>

            {/* SOLID HORIZONTAL DIVIDER */}
            <div className="border-t-2 border-black my-3.5" />

            {/* 6. PAYMENT TOTALS & FORM OF PAYMENT */}
            <div className="space-y-2.5 text-[12.5px]">
              {/* Tổng số tiền thanh toán */}
              <div className="flex justify-between items-center">
                <div className="font-bold text-[13px]">
                  Tổng số tiền thanh toán (Equivalent amount paid):
                </div>
                <div className="flex items-center gap-10">
                  <div className="text-center font-sans">
                    <div className="text-[11px] text-slate-600">Tỷ giá</div>
                    <div className="font-bold">1</div>
                  </div>
                  <div className="font-sans font-black text-base flex gap-4 text-right">
                    <span>{cleanNum(invoice.totalAmount)}</span>
                    <span className="w-12 text-center">VND</span>
                  </div>
                </div>
              </div>

              {/* Hình thức thanh toán */}
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-semibold">Hình thức thanh toán (Form of payment):</span>
                </div>
                <div className="flex items-center gap-10">
                  <div className="font-sans font-bold text-center text-xs">
                    {isBankTransfer ? 'CHUYỂN KHOẢN' : 'CASH'}
                  </div>
                  <div className="font-sans font-bold flex gap-4 text-right">
                    <span>{cleanNum(invoice.totalAmount)}</span>
                    <span className="w-12 text-center">VND</span>
                  </div>
                </div>
              </div>

              {/* In words */}
              <div className="italic text-[12px] text-slate-700 pt-0.5">
                (Số tiền viết bằng chữ: {invoice.amountInWords})
              </div>
            </div>

            {/* 7. CHECK BEFORE LEAVING ADVICE */}
            <div className="italic text-[11.5px] text-slate-600 mt-4 text-left">
              Đề nghị quý khách kiểm tra kỹ trước khi rời quầy thu (Please kindly check before leaving)
            </div>

            {/* 8. SIGNATURE & DATE SECTION */}
            <div className="mt-6 pt-2">
              <div className="text-right text-[12.5px] mb-3">
                <span className="font-semibold">Ngày (Date) :</span> {issueDateFormatted}
              </div>

              <div className="grid grid-cols-2 gap-8 text-center text-[12.5px]">
                {/* Customer Signature */}
                <div className="space-y-1">
                  <div className="font-bold">Khách hàng</div>
                  <div className="italic text-[11.5px] text-slate-600">(Customer)</div>
                  <div className="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
                  <div className="h-20" />
                  <div className="font-bold uppercase text-[12px] leading-tight">
                    {invoice.buyerUnitName || invoice.buyerName}
                  </div>
                </div>

                {/* Salesperson Signature */}
                <div className="space-y-1">
                  <div className="font-bold">Người bán hàng</div>
                  <div className="italic text-[11.5px] text-slate-600">(Salesperson)</div>
                  <div className="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
                  <div className="h-20 flex items-center justify-center">
                    {invoice.digitalSignature?.isValid && (
                      <div className="text-[10px] font-sans border-2 border-dashed border-emerald-600 text-emerald-700 px-3 py-1 rounded-lg">
                        <b>✓ ĐÃ KÝ ĐIỆN TỬ</b>
                        <div className="text-[9px] text-slate-500">
                          {invoice.digitalSignature.signedAt?.split('T')[0]}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="font-bold uppercase text-[12px]">
                    {invoice.digitalSignature?.signedBy || 'NGUYEN THI PHUONG MAI'}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Lookup & Verification Footer */}
            <div className="mt-8 pt-2.5 border-t border-slate-300 text-[11px] text-slate-500 font-sans flex flex-wrap justify-between items-center gap-2">
              <div>
                Tra cứu hóa đơn: <b className="font-mono text-black">{invoice.lookupCode}</b> • Mã CQT: <b className="font-mono text-black">{invoice.taxAuthorityCode}</b>
              </div>
              <button
                onClick={handleCopyLookup}
                className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1 font-bold no-print"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'Đã sao chép mã tra cứu' : 'Sao chép mã'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls (no-print) */}
        <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="text-xs text-slate-500">
            Định dạng hóa đơn song ngữ chuẩn (Form 01GTKT3/004) theo quy định vận chuyển & phân phối.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              <span>In hoá đơn</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-red-600/25 transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Tải file hoá đơn</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
