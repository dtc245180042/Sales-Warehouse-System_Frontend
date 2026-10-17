/**
 * Service gọi API Báo cáo Công nợ Quá hạn theo Tuổi nợ (Story S8-09).
 *
 * Tuân thủ AGENTS.md:
 * - Dùng 127.0.0.1 (không dùng localhost để tránh timeout IPv6 trên Windows).
 * - Giữ cơ chế fallback demo khi API chưa sẵn sàng.
 */
import { apiClient } from '../api/client';
import {
  DebtAgingReportResponse,
  DebtAgingReportFilter,
  DebtAgingCustomerRow,
} from '../types/DebtAgingReport';

// ===========================================================================
// DỮ LIỆU DEMO (Fallback khi backend chưa sẵn sàng)
// ===========================================================================
const DEMO_REPORT: DebtAgingReportResponse = {
  report_date: new Date().toLocaleDateString('vi-VN'),
  total_customers_with_debt: 0,
  total_debt_amount: 0,
  total_overdue_amount: 0,
  total_invoices_outstanding: 0,
  bucket_summaries: [],
  customers: [],
};

// Top risk customers derived from demo data
DEMO_REPORT.top_risk_customers = DEMO_REPORT.customers
  .filter((c) => c.risk_level !== 'LOW')
  .slice(0, 10);

// ===========================================================================
// SERVICE
// ===========================================================================
export const debtAgingReportService = {
  /**
   * Lấy báo cáo công nợ quá hạn theo tuổi nợ.
   * Fallback về dữ liệu demo nếu API chưa sẵn sàng.
   */
  getReport: async (filters?: DebtAgingReportFilter): Promise<DebtAgingReportResponse> => {
    try {
      const params: Record<string, string> = {};
      if (filters?.customer_id) params.customer_id = filters.customer_id;
      if (filters?.sales_rep) params.sales_rep = filters.sales_rep;
      if (filters?.region) params.region = filters.region;
      if (filters?.as_of_date) params.as_of_date = filters.as_of_date;

      const res = await apiClient.get<DebtAgingReportResponse>('/debt-aging-reports', { params });
      if (res.data && typeof res.data.total_customers_with_debt === 'number') {
        return res.data;
      }
    } catch (err) {
      console.warn('[debtAgingReportService] Fallback to demo data:', err);
    }
    // Lọc demo data theo filter
    let demo = { ...DEMO_REPORT };
    if (filters?.sales_rep) {
      const repFilter = filters.sales_rep.toLowerCase();
      demo = {
        ...demo,
        customers: demo.customers.filter(
          (c) => c.assigned_sales_rep?.toLowerCase().includes(repFilter)
        ),
      };
    }
    if (filters?.region) {
      const regionFilter = filters.region.toLowerCase();
      demo = {
        ...demo,
        customers: demo.customers.filter(
          (c) => c.region?.toLowerCase().includes(regionFilter)
        ),
      };
    }
    return demo;
  },

  /**
   * Xuất Excel - gọi URL download trực tiếp.
   */
  exportExcel: async (filters?: DebtAgingReportFilter): Promise<void> => {
    const params = new URLSearchParams();
    if (filters?.customer_id) params.append('customer_id', filters.customer_id);
    if (filters?.sales_rep) params.append('sales_rep', filters.sales_rep);
    if (filters?.region) params.append('region', filters.region);
    if (filters?.as_of_date) params.append('as_of_date', filters.as_of_date);

    const token =
      localStorage.getItem('kv_auth_token') ||
      localStorage.getItem('user_token') ||
      localStorage.getItem('access_token');

    const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001/api/v1';
    const url = `${baseUrl}/debt-aging-reports/export?${params.toString()}`;

    // Dùng fetch để xử lý blob download với Authorization header
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error('Không thể xuất Excel. Vui lòng thử lại.');
    }

    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `BaoCaoCongNoQuaHan_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  },
};
