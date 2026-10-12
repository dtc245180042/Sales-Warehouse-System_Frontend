import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Package,
  DollarSign,
  AlertTriangle,
  XCircle,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Search,
  Download,
  SlidersHorizontal,
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { DataTable, Column } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { exportToCSV } from '../../utils/csvExporter';
import { productService } from '../../services/productService';
import { Product } from '../../types/Product';
import { productCategories } from '../../mock/products';
import { useToast } from '../../contexts/ToastContext';

interface InventoryItemView {
  productId: string;
  sku: string;
  name: string;
  image: string;
  category: string;
  warehouse: string;
  initialStock: number;
  imported: number;
  exported: number;
  currentStock: number;
  minStock: number;
  unit: string;
  costPrice: number;
  totalValue: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export const InventoryOverview: React.FC = () => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get('q') || '';
  const urlWarehouse = searchParams.get('warehouse') || 'all';
  const urlStatus = searchParams.get('status') || 'all';

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState(urlSearch);
  const [warehouseFilter, setWarehouseFilter] = useState(urlWarehouse);
  const [statusFilter, setStatusFilter] = useState(urlStatus);

  // Đồng bộ hai chiều từ URL -> State khi người dùng nhấn Back / Forward trên trình duyệt
  useEffect(() => {
    setSearch(urlSearch);
    setWarehouseFilter(urlWarehouse);
    setStatusFilter(urlStatus);
  }, [urlSearch, urlWarehouse, urlStatus]);

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    const params = new URLSearchParams(searchParams);
    if (newSearch.trim()) params.set('q', newSearch.trim());
    else params.delete('q');
    setSearchParams(params, { replace: true });
  };

  const handleWarehouseChange = (newWarehouse: string) => {
    setWarehouseFilter(newWarehouse);
    const params = new URLSearchParams(searchParams);
    if (newWarehouse && newWarehouse !== 'all') params.set('warehouse', newWarehouse);
    else params.delete('warehouse');
    setSearchParams(params, { replace: true });
  };

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    const params = new URLSearchParams(searchParams);
    if (newStatus && newStatus !== 'all') params.set('status', newStatus);
    else params.delete('status');
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    productService.getAll().then(setProducts);
  }, []);

  // Compute inventory data
  const inventoryItems: InventoryItemView[] = useMemo(() => {
    return products.map((p, index) => {
      const initialStock = p.stock + (index % 3) * 5;
      const imported = (index % 4) * 8 + 4;
      const exported = initialStock + imported - p.stock;
      const currentStock = p.stock;
      const totalValue = currentStock * p.costPrice;

      let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
      if (currentStock === 0) status = 'out_of_stock';
      else if (currentStock <= p.minStock) status = 'low_stock';

      return {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        warehouse: index % 2 === 0 ? 'Kho Tổng TP. HCM' : 'Kho Tổng Hà Nội',
        initialStock,
        imported,
        exported: Math.max(0, exported),
        currentStock,
        minStock: p.minStock,
        unit: p.unit,
        costPrice: p.costPrice,
        totalValue,
        status,
      };
    });
  }, [products]);

  // Filters
  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase());
      const matchWarehouse = warehouseFilter === 'all' || item.warehouse === warehouseFilter;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'under_threshold'
          ? item.currentStock <= item.minStock
          : item.status === statusFilter);
      return matchSearch && matchWarehouse && matchStatus;
    });
  }, [inventoryItems, search, warehouseFilter, statusFilter]);

  // Overall KPIs
  const totalUnits = inventoryItems.reduce((sum, item) => sum + item.currentStock, 0);
  const totalInventoryValue = inventoryItems.reduce((sum, item) => sum + item.totalValue, 0);
  const lowStockCount = inventoryItems.filter((i) => i.status === 'low_stock').length;
  const outOfStockCount = inventoryItems.filter((i) => i.status === 'out_of_stock').length;

  const handleExportCSV = () => {
    exportToCSV({
      filename: `bao_cao_ton_kho_${Date.now()}`,
      headers: ['SKU', 'Sản phẩm', 'Kho', 'Tồn đầu', 'Nhập kỳ', 'Xuất kỳ', 'Tồn cuối', 'Giá trị tồn (VNĐ)', 'Trạng thái'],
      rows: filteredItems.map((item) => [
        item.sku,
        item.name,
        item.warehouse,
        item.initialStock,
        item.imported,
        item.exported,
        item.currentStock,
        item.totalValue,
        item.status,
      ]),
    });
    showToast(`Đã xuất ${filteredItems.length} mặt hàng tồn kho thành công!`, 'success');
  };

  const columns: Column<InventoryItemView>[] = [
    {
      key: 'sku',
      header: 'Mã SKU',
      sortable: true,
      className: 'font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap',
    },
    {
      key: 'name',
      header: 'Sản Phẩm',
      sortable: true,
      className: 'min-w-[200px]',
      render: (item) => (
        <div className="truncate">
          <Link
            to={`/products/${item.productId}`}
            className="font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-600 truncate block"
          >
            {item.name}
          </Link>
          <span className="text-[11px] text-slate-400">{item.category}</span>
        </div>
      ),
    },
    {
      key: 'warehouse',
      header: 'Kho Hàng',
      sortable: true,
      render: (item) => (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {item.warehouse}
        </span>
      ),
    },
    {
      key: 'initialStock',
      header: 'Tồn Đầu',
      sortable: true,
      render: (item) => <span className="text-slate-500">{item.initialStock}</span>,
    },
    {
      key: 'imported',
      header: 'Nhập (+)',
      sortable: true,
      render: (item) => <span className="text-emerald-600 font-semibold">+{item.imported}</span>,
    },
    {
      key: 'exported',
      header: 'Xuất (-)',
      sortable: true,
      render: (item) => <span className="text-rose-500 font-semibold">-{item.exported}</span>,
    },
    {
      key: 'currentStock',
      header: 'Tồn Cuối',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5">
          <div
            className={`font-black text-sm ${
              item.currentStock === 0
                ? 'text-rose-600 dark:text-rose-400'
                : item.currentStock <= item.minStock
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {item.currentStock} {item.unit}
          </div>
          <div className="text-[11px] text-slate-400">
            Ngưỡng tối thiểu: <span className="font-semibold text-slate-600 dark:text-slate-300">{item.minStock}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'totalValue',
      header: 'Giá Trị Tồn',
      sortable: true,
      render: (item) => (
        <span className="font-bold text-slate-900 dark:text-slate-100">
          {formatCurrency(item.totalValue)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      sortable: true,
      render: (item) => {
        if (item.currentStock === 0) {
          return (
            <Badge variant="danger" size="sm" dot>
              HẾT HÀNG (0)
            </Badge>
          );
        }
        if (item.currentStock <= item.minStock) {
          return (
            <Badge variant="warning" size="sm" dot>
              DƯỚI NGƯỠNG ({item.currentStock}/{item.minStock})
            </Badge>
          );
        }
        return <Badge variant="success" size="sm" dot>ĐỦ ĐỊNH MỨC</Badge>;
      },
    },
  ];

  return (
    <PageContainer
      title="Tổng Quan Tồn Kho"
      subtitle="Theo dõi biến động xuất nhập tồn kho hàng thời gian thực"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Xuất Excel
          </Button>
          <Link to="/inventory/min-stock">
            <Button variant="outline" size="sm" leftIcon={<SlidersHorizontal className="w-4 h-4 text-indigo-500" />}>
              Định mức tồn (Min-Stock)
            </Button>
          </Link>
          <Link to="/inventory/history">
            <Button variant="secondary" size="sm" leftIcon={<History className="w-4 h-4" />}>
              Lịch sử kho
            </Button>
          </Link>
          <Link to="/inventory/stock-out">
            <Button variant="outline" size="sm" leftIcon={<ArrowUpRight className="w-4 h-4" />}>
              Xuất kho
            </Button>
          </Link>
          <Link to="/inventory/stock-in">
            <Button variant="primary" size="sm" leftIcon={<ArrowDownLeft className="w-4 h-4" />}>
              Nhập kho mới
            </Button>
          </Link>
        </div>
      }
    >
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Tổng Tồn Kho</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatNumber(totalUnits)} <span className="text-sm font-medium text-slate-400">đơn vị</span>
          </p>
          <span className="text-xs text-slate-400 mt-1 block">Trên 2 tổng kho chính</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Tổng Giá Trị Tồn</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatCurrency(totalInventoryValue)}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">Theo đơn giá giá nhập</span>
        </div>

        <div
          onClick={() => handleStatusChange(statusFilter === 'low_stock' ? 'all' : 'low_stock')}
          className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border cursor-pointer transition-all ${
            statusFilter === 'low_stock'
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md'
              : 'border-slate-200 dark:border-slate-800 hover:border-amber-300 shadow-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Sắp Hết Hàng</span>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {lowStockCount} <span className="text-sm font-medium text-slate-400">mặt hàng</span>
          </p>
          <span className="text-xs text-slate-400 mt-1 block">Dưới ngưỡng an toàn (Click lọc)</span>
        </div>

        <div
          onClick={() => handleStatusChange(statusFilter === 'out_of_stock' ? 'all' : 'out_of_stock')}
          className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border cursor-pointer transition-all ${
            statusFilter === 'out_of_stock'
              ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-md'
              : 'border-slate-200 dark:border-slate-800 hover:border-rose-300 shadow-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Hết Tồn Kho</span>
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {outOfStockCount} <span className="text-sm font-medium text-slate-400">mặt hàng</span>
          </p>
          <span className="text-xs text-slate-400 mt-1 block">Cần đặt hàng gấp (Click lọc)</span>
        </div>
      </div>

      {/* Warning alert banner (SCRUM-599) */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="mt-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              <strong>Cảnh báo tồn kho:</strong> Có <strong>{lowStockCount + outOfStockCount}</strong> mặt hàng đang dưới ngưỡng an toàn (gồm {outOfStockCount} SKU hết hàng và {lowStockCount} SKU sắp hết).
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="!text-xs !py-1"
              onClick={() => handleStatusChange(statusFilter === 'under_threshold' ? 'all' : 'under_threshold')}
            >
              {statusFilter === 'under_threshold' ? 'Xem tất cả SKU' : 'Lọc tất cả SKU dưới ngưỡng'}
            </Button>
            <Link to="/inventory/stock-in">
              <Button size="sm" variant="primary" className="!text-xs !py-1">
                Tạo phiếu nhập kho
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="mt-6">
        <DataTable
          data={filteredItems}
          columns={columns}
          keyExtractor={(item) => item.productId}
          filterComponent={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Tìm theo mã SKU hoặc tên sản phẩm..."
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={warehouseFilter}
                  onChange={(e) => handleWarehouseChange(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Tất cả kho hàng</option>
                  <option value="Kho Tổng TP. HCM">Kho Tổng TP. HCM</option>
                  <option value="Kho Tổng Hà Nội">Kho Tổng Hà Nội</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="under_threshold">⚠️ Cần nhập (Dưới ngưỡng / Hết hàng)</option>
                  <option value="in_stock">Còn hàng an toàn</option>
                  <option value="low_stock">Sắp hết hàng</option>
                  <option value="out_of_stock">Hết tồn kho (0)</option>
                </select>
              </div>
            </div>
          }
        />
      </div>
    </PageContainer>
  );
};
