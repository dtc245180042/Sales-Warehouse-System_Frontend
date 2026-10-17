import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  ShoppingBag,
  Package,
  LogOut,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  User,
  ShieldCheck,
  Download,
  Receipt,
  Search,
  CreditCard,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { invoiceService } from '../../services/invoiceService';
import { ElectronicInvoice, AgentDebtSummary } from '../../types/Invoice';
import { ElectronicInvoiceModal } from '../../components/accounting/ElectronicInvoiceModal';
import { QuickPaymentModal } from '../../components/accounting/QuickPaymentModal';

// -------------------------------------------------------------
// Sub-components declared OUTSIDE main component (AGENTS.md rule)
// -------------------------------------------------------------

interface PaymentStatusBadgeProps {
  status?: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
}

const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'PAID':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Đã thanh toán đủ
        </span>
      );
    case 'OVERDUE':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5" />
          Quá hạn thanh toán
        </span>
      );
    case 'PARTIAL':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800">
          <Clock className="w-3.5 h-3.5" />
          Đã thanh toán 1 phần
        </span>
      );
    case 'PENDING':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
          <Clock className="w-3.5 h-3.5" />
          Còn nợ trong hạn
        </span>
      );
  }
};

interface DueDateBadgeProps {
  dueDate?: string;
  status?: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
  daysOverdue?: number;
  daysRemaining?: number;
}

const DueDateBadge: React.FC<DueDateBadgeProps> = ({
  dueDate,
  status,
  daysOverdue,
  daysRemaining,
}) => {
  if (status === 'PAID') {
    return (
      <div className="flex flex-col">
        <span className="text-slate-500 font-mono text-xs">{dueDate}</span>
        <span className="text-[11px] text-emerald-600 font-medium">Đã tất toán</span>
      </div>
    );
  }

  if (status === 'OVERDUE' || (daysOverdue && daysOverdue > 0)) {
    return (
      <div className="flex flex-col">
        <span className="text-rose-600 font-mono font-bold text-xs flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {dueDate}
        </span>
        <span className="inline-block text-[10px] font-bold text-rose-700 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800 w-fit mt-0.5">
          Trễ {daysOverdue || 7} ngày
        </span>
      </div>
    );
  }

  if (daysRemaining !== undefined && daysRemaining <= 3) {
    return (
      <div className="flex flex-col">
        <span className="text-amber-700 dark:text-amber-400 font-mono font-bold text-xs flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {dueDate}
        </span>
        <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 w-fit mt-0.5">
          Còn {daysRemaining} ngày
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <span className="text-slate-700 dark:text-slate-300 font-mono text-xs font-medium">
        {dueDate}
      </span>
      {daysRemaining !== undefined && (
        <span className="text-[10px] text-slate-400 font-medium">
          Còn {daysRemaining} ngày
        </span>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// Main Component: PortalDebtPage (SCRUM-757)
// -------------------------------------------------------------

export const PortalDebtPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Debt & Invoices data
  const [invoices, setInvoices] = useState<ElectronicInvoice[]>(() => invoiceService.getAllInvoices());
  const [debtSummary, setDebtSummary] = useState<AgentDebtSummary>(() => invoiceService.getAgentDebtSummary());

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'remainingDebt' | 'issueDate'>('dueDate');

  // Modals state
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<ElectronicInvoice | null>(null);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<ElectronicInvoice | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Filtered & Sorted Invoices
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        // Search filter
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const matchCode =
            inv.invoiceNumber.toLowerCase().includes(q) ||
            inv.invoiceCode.toLowerCase().includes(q) ||
            inv.orderCode.toLowerCase().includes(q) ||
            inv.series.toLowerCase().includes(q);
          if (!matchCode) return false;
        }

        // Status filter
        if (selectedStatus === 'all') return true;
        if (selectedStatus === 'debtOnly') return (inv.remainingDebt || 0) > 0;
        return inv.paymentStatus === selectedStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'dueDate') {
          return (a.dueDate || '').localeCompare(b.dueDate || '');
        }
        if (sortBy === 'remainingDebt') {
          return (b.remainingDebt || 0) - (a.remainingDebt || 0);
        }
        return (b.issueDate || '').localeCompare(a.issueDate || '');
      });
  }, [invoices, search, selectedStatus, sortBy]);

  const handleDownloadInvoice = (invoice: ElectronicInvoice) => {
    invoiceService.downloadInvoicePdf(invoice);
    showToast(`Đang tải hoá đơn ${invoice.invoiceNumber} (${invoice.series}) thành công!`);
  };

  const handlePaymentSuccess = (invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
            ...inv,
            paidAmount: inv.totalAmount,
            remainingDebt: 0,
            paymentStatus: 'PAID',
          }
          : inv
      )
    );
    // Refresh summary
    setTimeout(() => {
      setDebtSummary(invoiceService.getAgentDebtSummary());
    }, 100);
    showToast('Hệ thống đã ghi nhận thông báo chuyển khoản của bạn. Kế toán sẽ xác nhận và đối soát!');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-slideIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
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
            onClick={() => navigate('/portal/tracking')}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all flex items-center gap-2"
          >
            <Truck className="w-4 h-4" />
            Tiến độ giao vận
          </button>

          <button
            type="button"
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary-600 text-white shadow-sm flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Tổng hợp công nợ & Hoá đơn
            {debtSummary.overdueCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse">
                {debtSummary.overdueCount} quá hạn
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/portal/reconciliation')}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Đối chiếu công nợ
          </button>
        </div>

        {/* Page Title & Dealer Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <ShieldCheck className="w-7 h-7 text-primary-600" />
              Tổng Hợp Công Nợ & Danh Sách Hoá Đơn
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Theo dõi hạn mức công nợ được cấp, hạn thanh toán và trạng thái từng hoá đơn phát hành
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
            <Building2 className="w-4 h-4 text-primary-600" />
            <span>Công Ty TNHH Thương Mại & Dịch Vụ Quốc Cường (MST: 0315778899)</span>
          </div>
        </div>

        {/* OVERVIEW CARDS: TỔNG HỢP CÔNG NỢ & HẠN MỨC (SCRUM-757 REQUIREMENT) */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Tổng Còn Nợ */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tổng còn nợ
                </span>
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-3">
                <div className="font-mono font-extrabold text-2xl text-slate-900 dark:text-white">
                  {formatCurrency(debtSummary.totalDebt)}
                </div>

                <div className="mt-2 flex flex-col gap-1 text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-slate-500">
                    <span>Nợ trong hạn:</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {formatCurrency(debtSummary.inDueDebt)}
                    </span>
                  </div>
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Nợ quá hạn:</span>
                    <span className="font-mono">
                      {formatCurrency(debtSummary.overdueDebt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Hạn Mức Còn Lại (Available Credit Limit) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Hạn mức còn lại
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-3">
                <div className="font-mono font-extrabold text-2xl text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(debtSummary.availableCredit)}
                </div>

                <div className="mt-2 flex justify-between items-center text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Được phép đặt hàng:</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Khả dụng
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Hạn Mức Được Cấp (Credit Limit) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Hạn mức được cấp
                </span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-3">
                <div className="font-mono font-extrabold text-2xl text-slate-900 dark:text-white">
                  {formatCurrency(debtSummary.creditLimit)}
                </div>

                <div className="mt-2 flex justify-between items-center text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Thời hạn công nợ:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Tối đa {debtSummary.maxDebtDays} ngày
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Hạn Thanh Toán Gần Nhất */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Hạn thanh toán kế tiếp
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-3">
                <div className="font-mono font-extrabold text-2xl text-amber-600 dark:text-amber-400">
                  {debtSummary.earliestDueDate}
                </div>

                <div className="mt-2 flex justify-between items-center text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Hoá đơn đang mở:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {debtSummary.pendingCount} hoá đơn
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Credit Limit Utilization Progress Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Tỷ lệ sử dụng hạn mức công nợ:
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {debtSummary.utilizationRate}%
                </span>
              </div>
              <span className="text-slate-500">
                Đã dùng {formatCurrency(debtSummary.totalDebt)} / {formatCurrency(debtSummary.creditLimit)}
              </span>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${debtSummary.utilizationRate > 90
                  ? 'bg-rose-500'
                  : debtSummary.utilizationRate > 70
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                  }`}
                style={{ width: `${Math.min(100, debtSummary.utilizationRate)}%` }}
              />
            </div>

            {debtSummary.overdueDebt > 0 && (
              <div className="flex items-center gap-2 text-rose-600 text-xs font-semibold pt-1">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Bạn đang có <strong>{formatCurrency(debtSummary.overdueDebt)}</strong> công nợ đã quá hạn.
                  Vui lòng ưu tiên thanh toán để tránh ảnh hưởng đến việc duyệt các đơn hàng mới!
                </span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION: DANH SÁCH HOÁ ĐƠN KÈM HẠN THANH TOÁN VÀ TRẠNG THÁI (SCRUM-757 REQUIREMENT) */}
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo số HĐ, ký hiệu, mã đơn hàng..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* Filter Status Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setSelectedStatus('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${selectedStatus === 'all'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
              >
                Tất cả ({invoices.length})
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('debtOnly')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1 ${selectedStatus === 'debtOnly'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
              >
                Còn nợ ({invoices.filter((i) => (i.remainingDebt || 0) > 0).length})
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('OVERDUE')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1 ${selectedStatus === 'OVERDUE'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 hover:bg-rose-100'
                  }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Quá hạn ({debtSummary.overdueCount})
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('PENDING')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${selectedStatus === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 hover:bg-amber-100'
                  }`}
              >
                Chờ thanh toán
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('PAID')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${selectedStatus === 'PAID'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100'
                  }`}
              >
                Đã thanh toán đủ
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
              >
                <option value="dueDate">Sắp xếp: Hạn thanh toán</option>
                <option value="remainingDebt">Sắp xếp: Số tiền còn nợ</option>
                <option value="issueDate">Sắp xếp: Ngày phát hành</option>
              </select>
            </div>
          </div>

          {/* Main Invoices Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3.5 px-4">Số hoá đơn / Ký hiệu</th>
                    <th className="py-3.5 px-4">Đơn hàng</th>
                    <th className="py-3.5 px-4">Ngày phát hành</th>
                    <th className="py-3.5 px-4">Hạn thanh toán</th>
                    <th className="py-3.5 px-4 text-right">Tổng tiền HĐ</th>
                    <th className="py-3.5 px-4 text-right">Đã thanh toán</th>
                    <th className="py-3.5 px-4 text-right">Số tiền còn nợ</th>
                    <th className="py-3.5 px-4 text-center">Trạng thái</th>
                    <th className="py-3.5 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                        Không tìm thấy hoá đơn nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const hasDebt = (inv.remainingDebt || 0) > 0;
                      return (
                        <tr
                          key={inv.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Invoice Number & Series */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                                <Receipt className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-mono font-bold text-slate-900 dark:text-white block text-sm">
                                  {inv.invoiceNumber}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {inv.templateCode} - {inv.series}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Order Code */}
                          <td className="py-3.5 px-4 font-mono font-semibold text-primary-600 dark:text-primary-400">
                            {inv.orderCode}
                          </td>

                          {/* Issue Date */}
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                            {inv.issueDate?.slice(0, 10)}
                          </td>

                          {/* Due Date Badge */}
                          <td className="py-3.5 px-4">
                            <DueDateBadge
                              dueDate={inv.dueDate}
                              status={inv.paymentStatus}
                              daysOverdue={inv.daysOverdue}
                              daysRemaining={inv.daysRemaining}
                            />
                          </td>

                          {/* Total Amount */}
                          <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {formatCurrency(inv.totalAmount)}
                          </td>

                          {/* Paid Amount */}
                          <td className="py-3.5 px-4 text-right font-mono text-emerald-600 font-medium">
                            {formatCurrency(inv.paidAmount || 0)}
                          </td>

                          {/* Remaining Debt */}
                          <td className="py-3.5 px-4 text-right">
                            <span
                              className={`font-mono font-extrabold text-sm ${hasDebt
                                ? inv.paymentStatus === 'OVERDUE'
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-400'
                                }`}
                            >
                              {formatCurrency(inv.remainingDebt || 0)}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-4 text-center">
                            <PaymentStatusBadge status={inv.paymentStatus} />
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Xem chi tiết */}
                              <button
                                type="button"
                                onClick={() => setSelectedInvoiceForView(inv)}
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-primary-50 hover:text-primary-600 dark:bg-slate-800 dark:hover:bg-primary-950 text-slate-700 dark:text-slate-300 font-semibold transition flex items-center gap-1 text-[11px]"
                                title="Xem chi tiết hoá đơn điện tử"
                              >
                                <Eye className="w-3 h-3 text-primary-600" />
                                Xem
                              </button>

                              {/* Tải lại */}
                              <button
                                type="button"
                                onClick={() => handleDownloadInvoice(inv)}
                                className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold transition flex items-center gap-1 text-[11px]"
                                title="Tải lại file hoá đơn (PDF/HTML)"
                              >
                                <Download className="w-3 h-3" />
                                Tải
                              </button>

                              {/* Thanh toán ngay (nếu còn nợ) */}
                              {hasDebt && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedInvoiceForPayment(inv)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition flex items-center gap-1 text-[11px] shadow-xs"
                                  title="Thanh toán chuyển khoản nhanh qua VietQR"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  Trả nợ
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modal 1: Xem chi tiết hoá đơn điện tử (SCRUM-755) */}
      <ElectronicInvoiceModal
        open={!!selectedInvoiceForView}
        invoice={selectedInvoiceForView}
        onClose={() => setSelectedInvoiceForView(null)}
        onDownload={(inv) => invoiceService.downloadInvoicePdf(inv)}
        onPrint={(inv) => invoiceService.printInvoice(inv)}
      />

      {/* Modal 2: Thanh toán chuyển khoản nhanh VietQR */}
      <QuickPaymentModal
        open={!!selectedInvoiceForPayment}
        invoice={selectedInvoiceForPayment}
        onClose={() => setSelectedInvoiceForPayment(null)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};
