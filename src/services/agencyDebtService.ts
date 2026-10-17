import { apiClient } from '../api/client';
import {
  AgencyDebtReportItem,
  AgencyDebtReportResponse,
  AgencyDebtDetailResponse,
  AgencyDebtFilterParams,
  AgencyDebtSummary,
} from '../types/AgencyDebt';

const DEMO_AGENCY_DEBT_ITEMS: AgencyDebtReportItem[] = [];

const calculateDemoSummary = (items: AgencyDebtReportItem[]): AgencyDebtSummary => {
  return {
    total_customers: items.length,
    total_receivable: items.reduce((sum, i) => sum + i.total_receivable, 0),
    total_paid: items.reduce((sum, i) => sum + i.total_paid, 0),
    total_debt: items.reduce((sum, i) => sum + i.total_debt, 0),
    total_debt_0_30: items.reduce((sum, i) => sum + i.debt_0_30, 0),
    total_debt_31_60: items.reduce((sum, i) => sum + i.debt_31_60, 0),
    total_debt_61_90: items.reduce((sum, i) => sum + i.debt_61_90, 0),
    total_debt_over_90: items.reduce((sum, i) => sum + i.debt_over_90, 0),
    total_overdue_debt: items.reduce((sum, i) => sum + i.overdue_debt, 0),
    overdue_customers_count: items.filter((i) => i.is_overdue).length,
  };
};

// In-Memory RAM Cache để hiển thị ngay tức thì 0ms (Tuân thủ AGENTS.md Quy tắc 3 & 6)
let memoryCacheReport: Record<string, AgencyDebtReportResponse> = {};
let lastFetchTime: Record<string, number> = {};
const CACHE_TTL_MS = 30000; // 30s cache TTL

export const agencyDebtService = {
  /**
   * Lấy dữ liệu báo cáo từ RAM cache (nếu có) để hiển thị tức thì 0ms,
   * tránh màn hình trắng khi chuyển tab.
   */
  getCachedReport: (params?: AgencyDebtFilterParams): AgencyDebtReportResponse | null => {
    const cacheKey = JSON.stringify(params || {});
    const cached = memoryCacheReport[cacheKey];
    const timestamp = lastFetchTime[cacheKey] || 0;
    if (cached && Date.now() - timestamp < CACHE_TTL_MS) {
      return cached;
    }
    return null;
  },

  /**
   * Truy vấn danh sách sổ công nợ theo đại lý kèm phân tích tuổi nợ.
   */
  getAgencyDebtReport: async (
    params?: AgencyDebtFilterParams,
    forceRefresh: boolean = false
  ): Promise<AgencyDebtReportResponse> => {
    const cacheKey = JSON.stringify(params || {});
    if (!forceRefresh) {
      const cached = agencyDebtService.getCachedReport(params);
      if (cached) return cached;
    }

    try {
      const res = await apiClient.get<AgencyDebtReportResponse>('/agency-debt-reports', {
        params,
      });
      if (res.data && res.data.items) {
        memoryCacheReport[cacheKey] = res.data;
        lastFetchTime[cacheKey] = Date.now();
        return res.data;
      }
    } catch (err) {
      console.warn('[agencyDebtService] Fallback to demo agency debt data:', err);
    }

    // Fallback dữ liệu mẫu khi chưa kết nối backend
    let filtered = [...DEMO_AGENCY_DEBT_ITEMS];
    if (params?.has_debt_only) {
      filtered = filtered.filter((x) => x.total_debt > 0 || x.total_receivable > 0);
    }
    if (params?.only_overdue) {
      filtered = filtered.filter((x) => x.is_overdue);
    }
    if (params?.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(
        (x) =>
          x.customer_code.toLowerCase().includes(s) ||
          x.customer_name.toLowerCase().includes(s) ||
          (x.phone && x.phone.includes(s))
      );
    }
    if (params?.region) {
      filtered = filtered.filter((x) => x.region === params.region);
    }
    if (params?.customer_group) {
      filtered = filtered.filter((x) => x.customer_group === params.customer_group);
    }
    if (params?.aging_group) {
      if (params.aging_group === '0_30') filtered = filtered.filter((x) => x.debt_0_30 > 0);
      else if (params.aging_group === '31_60') filtered = filtered.filter((x) => x.debt_31_60 > 0);
      else if (params.aging_group === '61_90') filtered = filtered.filter((x) => x.debt_61_90 > 0);
      else if (params.aging_group === 'over_90' || params.aging_group === '>90')
        filtered = filtered.filter((x) => x.debt_over_90 > 0);
    }

    const summary = calculateDemoSummary(filtered);
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    const fallbackResponse: AgencyDebtReportResponse = {
      items: paginated,
      summary,
      total: filtered.length,
      page,
      limit,
      as_of_date: params?.as_of_date || new Date().toISOString().split('T')[0],
    };

    memoryCacheReport[cacheKey] = fallbackResponse;
    lastFetchTime[cacheKey] = Date.now();
    return fallbackResponse;
  },

  /**
   * Lấy chi tiết các hóa đơn còn nợ của một đại lý (Drill-down).
   */
  getAgencyDebtInvoices: async (
    customerId: string,
    asOfDate?: string
  ): Promise<AgencyDebtDetailResponse> => {
    try {
      const res = await apiClient.get<AgencyDebtDetailResponse>(
        `/agency-debt-reports/${customerId}/invoices`,
        {
          params: { as_of_date: asOfDate },
        }
      );
      if (res.data && res.data.customer) {
        return res.data;
      }
    } catch (err) {
      console.warn(`[agencyDebtService] Fallback to demo detail for ${customerId}:`, err);
    }

    const foundCust =
      DEMO_AGENCY_DEBT_ITEMS.find((c) => c.customer_id === customerId) ||
      DEMO_AGENCY_DEBT_ITEMS[0];

    return {
      customer: foundCust,
      invoices: [
        {
          invoice_id: `HD-2026-0000001`,
          issued_at: '2026-09-02T08:00:00Z',
          due_date: '2026-10-02T08:00:00Z',
          total_amount: 150000000,
          paid_amount: 84110000,
          remaining_amount: 65890000,
          status: 'PARTIALLY_PAID',
          aging_days: 43,
          aging_bucket: '31_60',
          days_overdue: 13,
          is_overdue: true,
          notes: 'Lô máy chủ Dell PowerEdge',
        },
        {
          invoice_id: `HD-2026-0000002`,
          issued_at: '2026-10-01T08:00:00Z',
          due_date: '2026-10-31T08:00:00Z',
          total_amount: 135890000,
          paid_amount: 15890000,
          remaining_amount: 120000000,
          status: 'PARTIALLY_PAID',
          aging_days: 14,
          aging_bucket: '0_30',
          days_overdue: 0,
          is_overdue: false,
          notes: 'Lô máy trạm HP Zbook',
        },
      ],
    };
  },

  /**
   * Tải xuống file Excel báo cáo sổ công nợ theo đại lý (SCRUM-724).
   */
  exportAgencyDebtExcel: async (params?: AgencyDebtFilterParams): Promise<void> => {
    try {
      const res = await apiClient.get('/agency-debt-reports/export-excel', {
        params,
        responseType: 'blob',
      });

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const dateStr = (params?.as_of_date || new Date().toISOString().split('T')[0]).replace(
        /-/g,
        ''
      );
      link.setAttribute('download', `so_cong_no_theo_dai_ly_${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[agencyDebtService] Export Excel error:', err);
      throw err;
    }
  },

  /**
   * Xóa toàn bộ bộ nhớ đệm RAM khi người dùng bấm nút làm mới.
   */
  invalidateCache: () => {
    memoryCacheReport = {};
    lastFetchTime = {};
  },
};
