import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingCart,
  Boxes,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Package,
  Clock,
  ArrowRight,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { PageContainer } from '../../components/layout/PageContainer';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';
import { monthlyRevenueData, dailyRevenueData, categoryDistribution, recentActivities } from '../../mock/dashboard';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { Order } from '../../types/Order';
import { Product } from '../../types/Product';

export const Dashboard: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<'today' | '7days' | '30days' | '12months'>('30days');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersData, productsData] = await Promise.all([
          orderService.getAll(),
          productService.getAll(),
        ]);
        setOrders(ordersData);
        setProducts(productsData);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute KPI values
  const totalRevenue = orders.reduce((sum, o) => (o.status !== 'cancelled' ? sum + o.total : sum), 0);
  const todayOrders = orders.filter((o) => o.createdAt.startsWith('2026-10-01'));
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

  // Top selling products mock computation
  const topProducts = [...products]
    .sort((a, b) => b.costPrice - a.costPrice)
    .slice(0, 5);

  const kpis = [
    {
      title: 'Tổng doanh thu',
      value: timeFilter === 'today' ? formatCurrency(todayRevenue) : formatCurrency(totalRevenue),
      change: '+14.8%',
      isPositive: true,
      subtext: 'so với tháng trước',
      icon: <DollarSign className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      bgIcon: 'bg-indigo-50 dark:bg-indigo-950/50',
    },
    {
      title: 'Đơn hàng mới',
      value: timeFilter === 'today' ? `${todayOrders.length} đơn` : `${orders.length} đơn`,
      change: '+8.2%',
      isPositive: true,
      subtext: 'tỷ lệ hoàn tất 95%',
      icon: <ShoppingCart className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      bgIcon: 'bg-emerald-50 dark:bg-emerald-950/50',
    },
    {
      title: 'Tổng mặt hàng',
      value: `${products.length} mã`,
      change: '+3 mã mới',
      isPositive: true,
      subtext: 'đang quản lý trên 6 danh mục',
      icon: <Boxes className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />,
      bgIcon: 'bg-cyan-50 dark:bg-cyan-950/50',
    },
    {
      title: 'Cần nhập hàng',
      value: `${lowStockProducts.length} sản phẩm`,
      change: 'Cảnh báo',
      isPositive: false,
      subtext: `${products.filter((p) => p.stock === 0).length} mã đã hết tồn`,
      icon: <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      bgIcon: 'bg-amber-50 dark:bg-amber-950/50',
    },
  ];

  return (
    <PageContainer
      title="Bảng Điều Khiển Tổng Quan"
      subtitle="Theo dõi hiệu suất kinh doanh, tồn kho và dòng tiền theo thời gian thực"
      actions={
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {[
            { id: 'today', label: 'Hôm nay' },
            { id: '7days', label: '7 ngày' },
            { id: '30days', label: '30 ngày' },
            { id: '12months', label: '12 tháng' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTimeFilter(item.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                timeFilter === item.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      }
    >
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card hover:shadow-soft transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {kpi.title}
              </span>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${kpi.bgIcon}`}>
                {kpi.icon}
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {kpi.value}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center text-xs font-bold ${
                    kpi.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {kpi.isPositive ? (
                    <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                  )}
                  {kpi.change}
                </span>
                <span className="text-xs text-slate-400">{kpi.subtext}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Revenue & Profit Area Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Biểu Đồ Doanh Thu & Lợi Nhuận
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {timeFilter === 'today' || timeFilter === '7days' ? 'Dữ liệu theo ngày gần nhất' : 'Dữ liệu 12 tháng qua'}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-600" />
                <span className="text-slate-600 dark:text-slate-300">Doanh thu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-300">Lợi nhuận</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {timeFilter === 'today' || timeFilter === '7days' ? (
                <AreaChart data={dailyRevenueData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(val) => `${val / 1000000}M`}
                  />
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val))}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              ) : (
                <AreaChart data={monthlyRevenueData}>
                  <defs>
                    <linearGradient id="colorRevM" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfitM" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(val) => `${val / 1000000}M`}
                  />
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val))}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevM)" />
                  <Area type="monotone" dataKey="profit" name="Lợi nhuận" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfitM)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Donut Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Cơ Cấu Ngành Hàng</h3>
            <p className="text-xs text-slate-400 mt-0.5">Tỷ trọng đóng góp doanh thu</p>
          </div>

          <div className="h-56 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {categoryDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[150px]">
                    {item.name}
                  </span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row: Recent Orders & Low Stock Warning */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Recent Orders (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Đơn Hàng Gần Đây</h3>
              <p className="text-xs text-slate-400 mt-0.5">5 giao dịch bán hàng mới phát sinh</p>
            </div>
            <Link to="/orders">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Xem tất cả
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3">Mã đơn</th>
                  <th className="pb-3">Khách hàng</th>
                  <th className="pb-3">Tổng tiền</th>
                  <th className="pb-3">Trạng thái</th>
                  <th className="pb-3 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-semibold text-indigo-600 dark:text-indigo-400">
                      {order.code}
                    </td>
                    <td className="py-3 text-slate-800 dark:text-slate-200 font-medium">
                      {order.customerName}
                    </td>
                    <td className="py-3 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={
                          order.status === 'completed'
                            ? 'success'
                            : order.status === 'shipping'
                            ? 'info'
                            : order.status === 'confirmed'
                            ? 'primary'
                            : order.status === 'pending'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                        dot
                      >
                        {order.status === 'completed'
                          ? 'Hoàn thành'
                          : order.status === 'shipping'
                          ? 'Đang giao'
                          : order.status === 'confirmed'
                          ? 'Đã duyệt'
                          : order.status === 'pending'
                          ? 'Chờ duyệt'
                          : 'Đã hủy'}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        to={`/orders/${order.id}`}
                        className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Warning Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Cảnh Báo Tồn Kho</h3>
                <p className="text-xs text-slate-400 mt-0.5">Sản phẩm sắp hoặc đã hết hàng</p>
              </div>
              <Link to="/inventory">
                <Button variant="ghost" size="sm">Kho</Button>
              </Link>
            </div>

            <div className="space-y-3">
              {lowStockProducts.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-10 h-10 rounded-lg object-cover bg-white shrink-0"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/product-placeholder.jpg"; }}
                    />
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {p.name}
                      </h4>
                      <p className="text-[11px] text-slate-400">SKU: {p.sku}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        p.stock === 0
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {p.stock === 0 ? 'Hết hàng' : `Còn ${p.stock}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link to="/inventory/stock-in">
              <Button variant="outline" size="sm" className="w-full">
                Tạo phiếu nhập hàng ngay
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Row: Top Selling Products & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Top Selling Products */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Top Sản Phẩm Giá Trị Cao</h3>
              <p className="text-xs text-slate-400 mt-0.5">Sản phẩm chủ lực đem lại doanh thu cao nhất</p>
            </div>
            <Link to="/products">
              <Button variant="ghost" size="sm">Tất cả SP</Button>
            </Link>
          </div>

          <div className="space-y-3">
            {topProducts.map((prod, index) => (
              <div key={prod.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 text-center text-xs font-bold text-slate-400">
                    0{index + 1}
                  </span>
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/product-placeholder.jpg"; }}
                  />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {prod.name}
                    </p>
                    <p className="text-[11px] text-slate-400">{prod.category}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(prod.salePrice)}
                  </div>
                  <div className="text-[10px] text-slate-400">Tồn: {prod.stock} {prod.unit}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Hoạt Động Hệ Thống</h3>
              <p className="text-xs text-slate-400 mt-0.5">Lịch sử thao tác nhân sự gần đây</p>
            </div>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-4">
            {recentActivities.map((act) => (
              <div key={act.id} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                    <span className="font-bold text-slate-900 dark:text-white">{act.user}</span>: {act.action}
                  </p>
                  <span className="text-[10px] text-slate-400">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
