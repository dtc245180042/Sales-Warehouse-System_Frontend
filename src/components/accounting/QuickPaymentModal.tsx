import React, { useState, useRef } from 'react';
import {
  X,
  QrCode,
  Copy,
  Check,
  CheckCircle2,
  Building2,
  CreditCard,
  ShieldCheck,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { ElectronicInvoice } from '../../types/Invoice';
import { formatCurrency } from '../../utils/formatters';

interface QuickPaymentModalProps {
  open: boolean;
  invoice: ElectronicInvoice | null;
  onClose: () => void;
  onPaymentSuccess?: (invoiceId: string, proofImg?: string, paidAmount?: number) => void;
}

export const QuickPaymentModal: React.FC<QuickPaymentModalProps> = ({
  open,
  invoice,
  onClose,
  onPaymentSuccess,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string>('');
  const [enteredAmount, setEnteredAmount] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!open || !invoice) return null;

  const bankName = 'Ngân hàng Techcombank (TCB)';
  const accountNumber = '19036888999018';
  const accountHolder = 'CONG TY CP PHAN PHOI OMS PRO VIET NAM';
  const amountToPay = invoice.remainingDebt || invoice.totalAmount;
  const transferContent = `THANHTOAN HD${invoice.invoiceNumber} ${invoice.buyerName}`.replace(/[^a-zA-Z0-9 ]/g, '');

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const qrUrl = `https://img.vietqr.io/image/970407-${accountNumber}-compact2.png?amount=${amountToPay}&addInfo=${encodeURIComponent(
    transferContent
  )}&accountName=${encodeURIComponent(accountHolder)}`;

  // Handle image upload via input file or drag & drop
  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, JPEG, WebP)!');
      return;
    }
    setProofFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleRemoveImage = () => {
    setProofImage(null);
    setProofFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle amount input & formatting
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setEnteredAmount('');
      return;
    }
    const num = parseInt(raw, 10);
    setEnteredAmount(num.toLocaleString('vi-VN'));
  };

  const handleQuickFillAmount = () => {
    setEnteredAmount(amountToPay.toLocaleString('vi-VN'));
  };

  // Validation
  const parsedAmount = enteredAmount ? parseInt(enteredAmount.replace(/\D/g, ''), 10) : 0;
  const isAmountValid = parsedAmount === amountToPay;
  const isImageValid = Boolean(proofImage);
  const canSubmit = isAmountValid && isImageValid && !submitted;

  const handleConfirmPaid = () => {
    if (!canSubmit) return;
    setSubmitted(true);
    setTimeout(() => {
      if (onPaymentSuccess) {
        onPaymentSuccess(invoice.id, proofImage || undefined, parsedAmount);
      }
      setSubmitted(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full my-6 overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Thanh Toán Hoá Đơn Điện Tử
              </h3>
              <p className="text-xs text-slate-400">
                Chuyển khoản 24/7 qua VietQR Napas • Đính kèm biên lai xác thực
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 text-xs overflow-y-auto">
          {/* Invoice Summary Banner */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-slate-400 block text-[11px]">Hoá đơn số:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                {invoice.invoiceNumber} ({invoice.series})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Đơn hàng liên kết:</span>
              <span className="font-mono font-semibold text-primary-600 dark:text-primary-400 text-xs">
                {invoice.orderCode}
              </span>
            </div>
            <div className="sm:text-right">
              <span className="text-slate-400 block text-[11px]">Số tiền cần thanh toán:</span>
              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-lg">
                {formatCurrency(amountToPay)}
              </span>
            </div>
          </div>

          {/* 2-Column Grid: Left (VietQR & Bank Info) | Right (Upload Proof & Amount Validation) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            {/* COLUMN 1: VietQR & Beneficiary Bank Information */}
            <div className="space-y-4">
              {/* QR Code Presentation */}
              <div className="text-center p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl flex flex-col items-center">
                <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200 mb-2">
                  <img
                    src={qrUrl}
                    alt="VietQR Payment"
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold text-xs mt-1">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Mã QR đã tích hợp sẵn số tiền & nội dung</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Mở App ngân hàng bất kỳ để quét mã tự động điền
                </p>
              </div>

              {/* Transfer Bank Information Box */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-2.5 border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-1 border-b border-slate-200 dark:border-slate-700">
                  <Building2 className="w-3.5 h-3.5 text-primary-600" />
                  Thông tin thụ hưởng chính thức
                </div>

                <div className="space-y-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Ngân hàng:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{bankName}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <span className="text-slate-400 block">Số tài khoản:</span>
                      <span className="font-mono font-bold text-primary-600 dark:text-primary-400 text-sm">
                        {accountNumber}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(accountNumber, 'acc')}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-primary-600 transition flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      {copiedField === 'acc' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" /> Đã chép
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Chép STK
                        </>
                      )}
                    </button>
                  </div>

                  <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-400 block">Chủ tài khoản:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">
                      {accountHolder}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex-1 mr-2">
                      <span className="text-slate-400 block">Nội dung chuyển khoản:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white break-all">
                        {transferContent}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(transferContent, 'content')}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-primary-600 transition flex items-center gap-1 text-[11px] shrink-0 cursor-pointer"
                    >
                      {copiedField === 'content' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" /> Đã chép
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Chép cú pháp
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 2: Upload Proof Image & Exact Amount Verification */}
            <div className="space-y-4">
              {/* Box 1: Tải ảnh chuyển khoản */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    <span>Ảnh Biên Lai Chuyển Khoản</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </div>
                  {proofImage && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <Check className="w-3 h-3" /> Đã đính kèm
                    </span>
                  )}
                </div>

                {/* Hidden input file */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {/* Upload Area / Image Preview */}
                {!proofImage ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                      isDragging
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                        : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shadow-xs">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-white block">
                        Bấm để tải ảnh hoặc kéo thả vào đây
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Ảnh chụp màn hình App ngân hàng báo giao dịch thành công (JPG, PNG)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 space-y-2">
                    <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
                      <img
                        src={proofImage}
                        alt="Biên lai chuyển khoản"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 font-mono truncate max-w-[200px]" title={proofFileName}>
                        {proofFileName || 'bien_lai_chuyen_khoan.png'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                        >
                          Chọn ảnh khác
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                          title="Xoá ảnh này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Box 2: Xác thực số tiền đã chuyển khoản */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Xác Nhận Số Tiền Đã Chuyển</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickFillAmount}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Điền đúng số tiền
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={enteredAmount}
                    onChange={handleAmountChange}
                    placeholder={`Nhập số tiền chuyển (VD: ${amountToPay.toLocaleString('vi-VN')})...`}
                    className={`w-full px-3.5 py-2.5 pr-12 rounded-xl text-sm font-mono font-bold bg-white dark:bg-slate-900 border transition outline-hidden ${
                      enteredAmount === ''
                        ? 'border-slate-300 dark:border-slate-700 focus:border-indigo-500 text-slate-800 dark:text-white'
                        : isAmountValid
                        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-100 dark:ring-emerald-950/50'
                        : 'border-rose-400 text-rose-600 ring-2 ring-rose-100 dark:ring-rose-950/50'
                    }`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                    VNĐ
                  </span>
                </div>

                {/* Validation Feedback Message */}
                {enteredAmount !== '' && (
                  <div>
                    {isAmountValid ? (
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 text-[11px] font-semibold">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>Số tiền chuyển khoản hoàn toàn chính xác!</span>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-start gap-2 text-[11px] font-medium">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                        <div>
                          <span>
                            Số tiền bạn nhập (<b>{formatCurrency(parsedAmount)}</b>) không khớp với số tiền cần thanh toán (<b>{formatCurrency(amountToPay)}</b>).
                          </span>
                          <span className="block mt-0.5 text-rose-600 font-semibold">
                            Vui lòng nhập đúng để mở nút xác nhận!
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Validation Checklist */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5 text-[11px]">
                  <div className={`flex items-center gap-1.5 font-medium ${isImageValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    {isImageValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-400" />}
                    <span>1. Đã đính kèm ảnh biên lai thanh toán</span>
                  </div>
                  <div className={`flex items-center gap-1.5 font-medium ${isAmountValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    {isAmountValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-400" />}
                    <span>2. Số tiền chuyển khoản khớp {formatCurrency(amountToPay)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs">
            {!canSubmit ? (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Vui lòng đính kèm ảnh biên lai và nhập đúng số tiền để hoàn tất.
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-bold">
                <FileCheck2 className="w-4 h-4 shrink-0" />
                Đủ điều kiện gửi xác nhận thanh toán!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              Đóng
            </button>

            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleConfirmPaid}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                canSubmit
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 active:scale-95'
                  : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              {submitted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 animate-spin" /> Đang ghi nhận...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" /> Tôi đã chuyển khoản xong
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
