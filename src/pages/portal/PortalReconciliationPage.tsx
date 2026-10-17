import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  ShoppingBag,
  Package,
  LogOut,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  Eye,
  Check,
  X,
  Send,
  User,
  ShieldCheck,
  Download,
  Receipt,
  Search,
  Printer,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  DebtReconciliation,
  ReconciliationStatus,
} from '../../types/DebtReconciliation';
import { initialDebtReconciliations } from '../../mock/reconciliations';
import { formatCurrency } from '../../utils/formatters';
import { invoiceService } from '../../services/invoiceService';
import { ElectronicInvoice } from '../../types/Invoice';
import { ElectronicInvoiceModal } from '../../components/accounting/ElectronicInvoiceModal';

// -------------------------------------------------------------
// Sub-components declared OUTSIDE main component (AGENTS.md rule)
// -------------------------------------------------------------

interface PortalStatusBadgeProps {
  status: ReconciliationStatus;
  agentResponse?: 'confirmed' | 'disputed';
}

const PortalStatusBadge: React.FC<PortalStatusBadgeProps> = ({ status, agentResponse }) => {
  if (status === 'confirmed' || agentResponse === 'confirmed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Bạn đã xác nhận đúng
      </span>
    );
  }

  if (status === 'disputed' || agentResponse === 'disputed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
        <AlertTriangle className="w-3.5 h-3.5" />
        Đã báo lệch số liệu
      </span>
    );
  }

  if (status === 'resolved') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800">
        <FileCheck className="w-3.5 h-3.5" />
        Công ty đã xử lý lệch
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 animate-pulse">
      <Clock className="w-3.5 h-3.5" />
      Chờ bạn xác nhận
    </span>
  );
};

interface AgreeModalProps {
  open: boolean;
  code: string;
  onClose: () => void;
  onConfirm: (note: string) => void;
}

const AgreeModal: React.FC<AgreeModalProps> = ({ open, code, onClose, onConfirm }) => {
  const [note, setNote] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Xác Nhận Đồng Ý Biên Bản
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Bạn xác nhận đồng ý với toàn bộ số liệu công nợ trong biên bản đối chiếu{' '}
            <strong className="text-slate-900 dark:text-white">{code}</strong>?
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ghi chú thêm (tùy chọn)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Đã kiểm tra đầy đủ hóa đơn, đồng ý số dư cuối kỳ..."
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm(note);
                setNote('');
              }}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Xác nhận Đồng ý
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DisputeModalProps {
  open: boolean;
  code: string;
  closingBalance: number;
  onClose: () => void;
  onSubmit: (disputedAmount: number, reason: string) => void;
}

const DisputeModal: React.FC<DisputeModalProps> = ({
  open,
  code,
  closingBalance,
  onClose,
  onSubmit,
}) => {
  const [disputedAmount, setDisputedAmount] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputedAmount || Number(disputedAmount) < 0) {
      setError('Vui lòng nhập số dư công nợ theo sổ sách của bạn');
      return;
    }
    if (!reason.trim()) {
      setError('Vui lòng nêu chi tiết lý do chênh lệch');
      return;
    }

    onSubmit(Number(disputedAmount), reason.trim());
    setDisputedAmount('');
    setReason('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Phản Hồi Lệch Số Liệu: {code}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs space-y-1">
            <div className="text-slate-500">Số dư cuối kỳ công ty ghi nhận:</div>
            <div className="font-mono font-bold text-slate-900 dark:text-white text-base">
              {formatCurrency(closingBalance)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Số dư nợ thực tế theo sổ sách của bạn (VNĐ) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min={0}
              step={1000}
              value={disputedAmount}
              onChange={(e) => {
                setDisputedAmount(e.target.value ? Number(e.target.value) : '');
                if (error) setError('');
              }}
              placeholder="VD: 18000000"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white font-mono font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Lý do và chi tiết các khoản chênh lệch <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="VD: Đơn hàng DH-xxx bên em đã chuyển khoản 5 triệu ngày 28/09, chưa thấy tính giảm nợ..."
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              Gửi phản hồi lệch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface PortalDetailModalProps {
  open: boolean;
  item?: DebtReconciliation;
  onClose: () => void;
  onAgree: (item: DebtReconciliation) => void;
  onDispute: (item: DebtReconciliation) => void;
  onViewInvoice: (orderCode: string) => void;
  onDownloadInvoice?: (orderCode: string) => void;
}

const PortalDetailModal: React.FC<PortalDetailModalProps> = ({
  open,
  item,
  onClose,
  onAgree,
  onDispute,
  onViewInvoice,
}) => {
  if (!open || !item) return null;

  const canRespond = item.status === 'sent';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Chi Tiết Biên Bản Đối Chiếu: {item.code}
              </h3>
              <p className="text-xs text-slate-400">
                Kèm tra cứu hoá đơn điện tử đã phát hành
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Header Info */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs">
            <div>
              <span className="text-slate-400 block">Kỳ đối chiếu:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{item.period}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Thời gian:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {item.periodFrom} &rarr; {item.periodTo}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Trạng thái:</span>
              <PortalStatusBadge status={item.status} agentResponse={item.agentResponse} />
            </div>
          </div>

          {/* Numbers grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block mb-0.5">Dư đầu kỳ:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                {formatCurrency(item.openingBalance)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block mb-0.5">Mua trong kỳ:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                +{formatCurrency(item.totalOrderAmount)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block mb-0.5">Đã thanh toán:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                -{formatCurrency(item.totalPaidAmount)}
              </span>
            </div>
            <div className="p-3 bg-primary-50/50 dark:bg-primary-950/40 rounded-xl border-2 border-primary-500/50">
              <span className="text-primary-700 dark:text-primary-300 font-bold block mb-0.5">
                Dư nợ cuối kỳ:
              </span>
              <span className="font-mono font-bold text-primary-700 dark:text-primary-300 text-sm">
                {formatCurrency(item.closingBalance)}
              </span>
            </div>
          </div>

          {/* Orders & Invoices Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-primary-600" />
                Danh Sách Đơn Hàng & Hoá Đơn Điện Tử Đã Phát Hành
              </h4>
              <span className="text-[11px] text-slate-400">
                Bấm vào thao tác để xem hoá đơn gốc
              </span>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Mã đơn hàng</th>
                    <th className="py-2.5 px-3">Ngày</th>
                    <th className="py-2.5 px-3 text-right">Tổng tiền</th>
                    <th className="py-2.5 px-3 text-right">Đã trả</th>
                    <th className="py-2.5 px-3 text-right">Còn nợ</th>
                    <th className="py-2.5 px-3 text-center">Hoá đơn điện tử</th>
                    <th className="py-2.5 px-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {item.orders.map((o) => {
                    const invoice = invoiceService.getInvoiceByOrderOrCode(o.orderCode);
                    return (
                      <tr key={o.orderId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 dark:text-white">
                          {o.orderCode}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{o.orderDate}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium">
                          {formatCurrency(o.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-medium">
                          {formatCurrency(o.paidAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(o.debtAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {invoice ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 px-2 py-0.5 rounded border border-primary-200 dark:border-primary-800">
                              <Receipt className="w-3 h-3" />
                              Số: {invoice.invoiceNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Chưa phát hành</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => onViewInvoice(o.orderCode)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-primary-50 hover:text-primary-600 dark:bg-slate-800 dark:hover:bg-primary-950 text-slate-700 dark:text-slate-300 font-medium transition-colors flex items-center gap-1.5 text-[11px]"
                              title="Xem chi tiết hoá đơn điện tử"
                            >
                              <Eye className="w-3.5 h-3.5 text-primary-600" />
                              <span>Xem HĐ</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Agent feedback notes if responded */}
          {item.agentNote && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Phản hồi từ bạn ({item.agentRespondedAt?.slice(0, 10)}):
              </span>
              <p className="text-slate-600 dark:text-slate-400">{item.agentNote}</p>
              {item.agentDisputedAmount !== undefined && (
                <p className="font-mono font-bold text-rose-600">
                  Số dư bạn khai báo: {formatCurrency(item.agentDisputedAmount)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
          >
            Đóng
          </button>

          {canRespond && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDispute(item);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Phản hồi lệch
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAgree(item);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                Đồng ý đối chiếu
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Main PortalReconciliationPage Component (SCRUM-750 & SCRUM-755)
// -------------------------------------------------------------

export const PortalReconciliationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [reconciliations, setReconciliations] = useState<DebtReconciliation[]>(initialDebtReconciliations);
  const [selectedDetail, setSelectedDetail] = useState<DebtReconciliation | null>(null);
  const [agreeItem, setAgreeItem] = useState<DebtReconciliation | null>(null);
  const [disputeItem, setDisputeItem] = useState<DebtReconciliation | null>(null);

  // SCRUM-755: States for viewing and downloading invoices
  const [activeTab, setActiveTab] = useState<'reconciliations' | 'invoices'>('reconciliations');
  const [selectedInvoice, setSelectedInvoice] = useState<ElectronicInvoice | null>(null);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Filter reconciliations for current customer
  const agentReconciliations = useMemo(() => {
    return reconciliations.filter((r) => r.status !== 'draft');
  }, [reconciliations]);

  // All invoices associated with the customer's orders
  const allInvoices = useMemo(() => {
    return invoiceService.getAllInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    if (!invoiceSearch.trim()) return allInvoices;
    const query = invoiceSearch.trim().toLowerCase();
    return allInvoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(query) ||
        inv.invoiceCode.toLowerCase().includes(query) ||
        inv.orderCode.toLowerCase().includes(query) ||
        inv.series.toLowerCase().includes(query) ||
        inv.taxAuthorityCode.toLowerCase().includes(query)
    );
  }, [allInvoices, invoiceSearch]);

  const handleOpenInvoice = (orderCodeOrInvoiceCode: string) => {
    const inv = invoiceService.getInvoiceByOrderOrCode(orderCodeOrInvoiceCode);
    if (inv) {
      setSelectedInvoice(inv);
    } else {
      showToast('Không tìm thấy thông tin hoá đơn cho đơn hàng này.');
    }
  };

  const handleDownloadInvoice = (orderCodeOrInvoiceCode: string) => {
    const inv = invoiceService.getInvoiceByOrderOrCode(orderCodeOrInvoiceCode);
    if (inv) {
      invoiceService.downloadInvoicePdf(inv);
      showToast(`Đang tải lại hoá đơn điện tử ${inv.invoiceNumber} (${inv.series}) thành công!`);
    } else {
      showToast('Không thể tải lại hoá đơn do không tìm thấy dữ liệu.');
    }
  };

  const handlePrintInvoice = (orderCodeOrInvoiceCode: string) => {
    const inv = invoiceService.getInvoiceByOrderOrCode(orderCodeOrInvoiceCode);
    if (inv) {
      invoiceService.printInvoice(inv);
    }
  };

  const handleAgreeConfirm = (note: string) => {
    if (!agreeItem) return;

    setReconciliations((prev) =>
      prev.map((r) =>
        r.id === agreeItem.id
          ? {
              ...r,
              status: 'confirmed',
              agentResponse: 'confirmed',
              agentRespondedAt: new Date().toISOString(),
              agentNote: note || 'Đại lý xác nhận số liệu hoàn toàn chính xác.',
            }
          : r
      )
    );

    setAgreeItem(null);
    showToast('Cảm ơn bạn! Bạn đã xác nhận đồng ý với biên bản đối chiếu công nợ thành công.');
  };

  const handleDisputeSubmit = (disputedAmount: number, reason: string) => {
    if (!disputeItem) return;

    setReconciliations((prev) =>
      prev.map((r) =>
        r.id === disputeItem.id
          ? {
              ...r,
              status: 'disputed',
              agentResponse: 'disputed',
              agentRespondedAt: new Date().toISOString(),
              agentDisputedAmount: disputedAmount,
              agentNote: reason,
            }
          : r
      )
    );

    setDisputeItem(null);
    showToast('Đã gửi phản hồi lệch số liệu thành công! Phòng Kế toán công ty sẽ kiểm tra và liên hệ giải quyết với bạn sớm nhất.');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-slideIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              OMS
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                CỔNG ĐẠI LÝ B2B
              </div>
              <div className="text-[11px] text-slate-400">OMS Pro Distribution System</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <User className="w-4 h-4 text-primary-600" />
              <span>
                Xin chào, <strong>{user?.fullName || 'Đại lý Nguyễn Quốc Cường'}</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => navigate('/portal/orders')}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Đơn hàng của tôi
          </button>

          <button
            type="button"
            onClick={() => navigate('/portal/order')}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            Đặt hàng mới
          </button>

          <button
            type="button"
            onClick={() => navigate('/portal/debt')}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all flex items-center gap-2"
            title="Xem tổng hợp công nợ & hạn mức còn lại"
          >
            <CreditCard className="w-4 h-4" />
            Tổng hợp công nợ & Hạn mức
          </button>

          <button
            type="button"
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary-600 text-white shadow-sm flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Biên bản đối chiếu
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary-800 text-white">
              {agentReconciliations.filter((r) => r.status === 'sent').length}
            </span>
          </button>

        </div>

        {/* Section Title & Sub-tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <ShieldCheck className="w-7 h-7 text-primary-600" />
              Công Nợ & Hoá Đơn Điện Tử
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Kiểm tra số liệu công nợ định kỳ, xem chi tiết và tải lại từng hoá đơn điện tử đã phát hành
            </p>
          </div>

          {/* Sub Tabs: Reconciliations vs Invoices */}
          <div className="inline-flex p-1 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('reconciliations')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'reconciliations'
                  ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              Biên bản đối chiếu ({agentReconciliations.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'invoices'
                  ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4" />
              Hoá đơn đã phát hành ({allInvoices.length})
            </button>
          </div>
        </div>

        {/* TAB 1: Biên bản đối chiếu */}
        {activeTab === 'reconciliations' && (
          <div>
            {agentReconciliations.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  Chưa có biên bản đối chiếu nào
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Phòng Kế toán sẽ lập và gửi biên bản đối chiếu công nợ định kỳ hàng tháng cho bạn.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {agentReconciliations.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-primary-500 dark:hover:border-primary-500 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white text-base">
                              {item.code}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium text-slate-600 dark:text-slate-300">
                              {item.period}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Từ ngày {item.periodFrom} đến {item.periodTo}
                          </div>
                        </div>

                        <PortalStatusBadge
                          status={item.status}
                          agentResponse={item.agentResponse}
                        />
                      </div>

                      {/* Summary Grid */}
                      <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 dark:border-slate-800 my-3 text-xs">
                        <div>
                          <span className="text-slate-400 block mb-0.5">Dư nợ đầu kỳ:</span>
                          <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {formatCurrency(item.openingBalance)}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block mb-0.5">Phát sinh mua trong kỳ:</span>
                          <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                            +{formatCurrency(item.totalOrderAmount)}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block mb-0.5">Đã thanh toán:</span>
                          <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            -{formatCurrency(item.totalPaidAmount)}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block mb-0.5 font-bold text-slate-800 dark:text-slate-200">
                            Dư nợ cuối kỳ cần xác nhận:
                          </span>
                          <span className="font-mono font-extrabold text-primary-600 dark:text-primary-400 text-sm">
                            {formatCurrency(item.closingBalance)}
                          </span>
                        </div>
                      </div>

                      {/* Note info if disputed/confirmed */}
                      {item.agentNote && (
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-600 dark:text-slate-300">
                          <strong>Phản hồi của bạn:</strong> {item.agentNote}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedDetail(item)}
                          className="text-xs font-semibold text-primary-600 dark:text-primary-400 flex items-center gap-1 hover:underline"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Xem bảng kê & Hoá đơn ({item.orders.length})
                        </button>
                      </div>

                      {item.status === 'sent' && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDisputeItem(item)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Phản hồi lệch
                          </button>
                          <button
                            type="button"
                            onClick={() => setAgreeItem(item)}
                            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Đồng ý
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Danh sách Hoá đơn điện tử đã phát hành (SCRUM-755) */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  placeholder="Tìm theo số HĐ, ký hiệu, mã đơn..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                Hiển thị <strong>{filteredInvoices.length}</strong> hoá đơn điện tử có hiệu lực
              </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3.5 px-4">Số hoá đơn / Ký hiệu</th>
                      <th className="py-3.5 px-4">Mã đơn hàng</th>
                      <th className="py-3.5 px-4">Ngày phát hành</th>
                      <th className="py-3.5 px-4 text-right">Tiền hàng (chưa VAT)</th>
                      <th className="py-3.5 px-4 text-right">Tổng thanh toán</th>
                      <th className="py-3.5 px-4 text-center">Trạng thái CQT</th>
                      <th className="py-3.5 px-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Không tìm thấy hoá đơn nào phù hợp với từ khoá tìm kiếm.
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((inv) => (
                        <tr
                          key={inv.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                                <Receipt className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-mono font-bold text-slate-900 dark:text-white block text-sm">
                                  {inv.invoiceNumber}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  Mẫu {inv.templateCode} - {inv.series}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                            {inv.orderCode}
                          </td>

                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                            {inv.issueDate}
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                            {formatCurrency(inv.subtotal)}
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono font-bold text-primary-600 dark:text-primary-400 text-sm">
                            {formatCurrency(inv.totalAmount)}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Đã cấp mã CQT
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenInvoice(inv.invoiceCode)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-primary-50 hover:text-primary-600 dark:bg-slate-800 dark:hover:bg-primary-950 text-slate-700 dark:text-slate-300 font-semibold transition-colors flex items-center gap-1"
                                title="Xem chi tiết hoá đơn"
                              >
                                <Eye className="w-3.5 h-3.5 text-primary-600" />
                                Xem
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDownloadInvoice(inv.invoiceCode)}
                                className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 font-semibold transition-colors flex items-center gap-1"
                                title="Tải lại hoá đơn về máy"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Tải lại
                              </button>

                              <button
                                type="button"
                                onClick={() => handlePrintInvoice(inv.invoiceCode)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="In hoá đơn"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal Detail BBĐC (với danh sách hoá đơn kèm theo) */}
      <PortalDetailModal
        open={!!selectedDetail}
        item={selectedDetail || undefined}
        onClose={() => setSelectedDetail(null)}
        onAgree={(item) => setAgreeItem(item)}
        onDispute={(item) => setDisputeItem(item)}
        onViewInvoice={handleOpenInvoice}
        onDownloadInvoice={handleDownloadInvoice}
      />

      {/* Modal Agree */}
      <AgreeModal
        open={!!agreeItem}
        code={agreeItem?.code || ''}
        onClose={() => setAgreeItem(null)}
        onConfirm={handleAgreeConfirm}
      />

      {/* Modal Dispute */}
      <DisputeModal
        open={!!disputeItem}
        code={disputeItem?.code || ''}
        closingBalance={disputeItem?.closingBalance || 0}
        onClose={() => setDisputeItem(null)}
        onSubmit={handleDisputeSubmit}
      />

      {/* Modal Electronic Invoice (SCRUM-755) */}
      <ElectronicInvoiceModal
        open={!!selectedInvoice}
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onDownload={(inv) => invoiceService.downloadInvoicePdf(inv)}
        onPrint={(inv) => invoiceService.printInvoice(inv)}
      />
    </div>
  );
};
