import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Clock,
  User,
  Activity,
  Layers,
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { AuditLogDetailModal } from '../../components/AuditLogDetailModal';
import { AuditLogDetail } from '../../types/auditLog';
import { auditLogService, INITIAL_AUDIT_LOGS } from '../../services/auditLogService';

export const AuditLogList: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  // Modal State for SCRUM-373
  const [selectedLog, setSelectedLog] = useState<AuditLogDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await auditLogService.getAll();
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter modules for dropdown
  const modules = useMemo(() => {
    const list = Array.from(new Set(logs.map((l) => l.module)));
    return list;
  }, [logs]);

  // Filtered log records
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const searchLower = search.toLowerCase();
      const matchSearch =
        (log.id?.toLowerCase() || '').includes(searchLower) ||
        (log.actionName?.toLowerCase() || '').includes(searchLower) ||
        (log.targetEntity?.toLowerCase() || '').includes(searchLower) ||
        (log.performedBy?.name?.toLowerCase() || '').includes(searchLower) ||
        (log.performedBy?.email?.toLowerCase() || '').includes(searchLower);

      const matchAction = actionFilter === 'all' || log.action === actionFilter;
      const matchModule = moduleFilter === 'all' || log.module === moduleFilter;

      return matchSearch && matchAction && matchModule;
    });
  }, [logs, search, actionFilter, moduleFilter]);

  const handleOpenDetail = (log: AuditLogDetail) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const handleOpenDemoScrum373 = () => {
    const demoLog = logs.find((l) => l.id === 'LOG-88392') || INITIAL_AUDIT_LOGS[0];
    setSelectedLog(demoLog);
    setIsModalOpen(true);
  };

  const getActionBadge = (action: AuditLogDetail['action']) => {
    switch (action) {
      case 'CREATE':
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            Thêm mới
          </span>
        );
      case 'UPDATE':
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            Cập nhật
          </span>
        );
      case 'DELETE':
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
            Xóa
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <PageContainer
      title="Nhật Ký Hoạt Động Hệ Thống (Audit Log)"
      subtitle="Theo dõi, tra cứu và đối chiếu chi tiết các thay đổi dữ liệu theo chuẩn SCRUM-373"
      breadcrumbs={[
        { label: 'Hệ thống', path: '/audit-logs' },
        { label: 'Nhật ký hoạt động' },
      ]}
    >
      <div className="space-y-6">
        {/* Top Action Bar & Quick Demo Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Kiểm soát lịch sử thay đổi (SCRUM-373)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ghi nhận các trường thông tin thay đổi trước và sau khi thao tác
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenDemoScrum373}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              Demo Modal SCRUM-373
            </button>
            <button
              onClick={fetchLogs}
              title="Làm mới"
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã log, hành động, người thực hiện..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Action Filter */}
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              aria-label="Lọc theo loại hành động"
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="all">Tất cả hành động</option>
              <option value="CREATE">Thêm mới (CREATE)</option>
              <option value="UPDATE">Cập nhật (UPDATE)</option>
              <option value="DELETE">Xóa (DELETE)</option>
            </select>
          </div>

          {/* Module Filter */}
          <div className="relative">
            <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              aria-label="Lọc theo phân hệ"
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="all">Tất cả phân hệ / module</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-xs uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Mã Log</th>
                  <th className="px-5 py-3.5">Hành động</th>
                  <th className="px-5 py-3.5">Phân hệ</th>
                  <th className="px-5 py-3.5">Đối tượng tác động</th>
                  <th className="px-5 py-3.5">Người thực hiện</th>
                  <th className="px-5 py-3.5">Thời gian</th>
                  <th className="px-5 py-3.5 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      Đang tải nhật ký...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      Không tìm thấy bản ghi nhật ký phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => handleOpenDetail(log)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-4 font-mono font-medium text-slate-900 dark:text-slate-100 text-xs">
                        {log.id}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col items-start gap-1">
                          {getActionBadge(log.action)}
                          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                            {log.actionName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {log.module}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate" title={log.targetEntity}>
                        {log.targetEntity}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <div>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {log.performedBy.name}
                            </p>
                            <p className="text-[11px] text-slate-400">{log.performedBy.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{log.timestamp}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(log);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors border border-blue-200 dark:border-blue-900"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Chi tiết Audit Log (SCRUM-373) */}
        <AuditLogDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          logData={selectedLog}
        />
      </div>
    </PageContainer>
  );
};

export default AuditLogList;
