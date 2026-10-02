import React, { useState } from 'react';
import { ShieldAlert, Search, Filter, Eye } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LogDetailModal } from '../../components/settings/LogDetailModal';
import { SystemLog } from '../../types/SystemLog';

const MOCK_LOGS: SystemLog[] = [
  {
    id: 'LOG-20231002-001',
    action: 'UPDATE',
    module: 'INVENTORY',
    description: 'Điều chỉnh số lượng tồn kho do kiểm kê sai lệch',
    executorName: 'Nguyễn Văn Kho',
    executorRole: 'WarehouseManager',
    executorId: 'WH-001',
    timestamp: '2023-10-02T14:30:00Z',
    changes: [
      {
        field: 'stockQuantity',
        fieldLabel: 'Số lượng tồn',
        oldValue: 150,
        newValue: 145,
      },
      {
        field: 'note',
        fieldLabel: 'Ghi chú điều chỉnh',
        oldValue: '',
        newValue: 'Mất mát trong quá trình vận chuyển nội bộ',
      }
    ]
  },
  {
    id: 'LOG-20231002-002',
    action: 'UPDATE',
    module: 'USER_MANAGEMENT',
    description: 'Cập nhật phân quyền người dùng',
    executorName: 'Trần Admin',
    executorRole: 'Admin',
    executorId: 'ADM-001',
    timestamp: '2023-10-02T10:15:22Z',
    changes: [
      {
        field: 'role',
        fieldLabel: 'Vai trò hệ thống',
        oldValue: 'Staff',
        newValue: 'SalesManager',
      },
      {
        field: 'status',
        fieldLabel: 'Trạng thái hoạt động',
        oldValue: 'Pending',
        newValue: 'Active',
      }
    ]
  },
  {
    id: 'LOG-20231001-003',
    action: 'DELETE',
    module: 'SALES',
    description: 'Hủy đơn hàng bị lỗi hệ thống',
    executorName: 'Lê Sales',
    executorRole: 'SalesManager',
    executorId: 'SM-005',
    timestamp: '2023-10-01T16:45:10Z',
    changes: [
      {
        field: 'orderStatus',
        fieldLabel: 'Trạng thái đơn hàng',
        oldValue: 'PROCESSING',
        newValue: 'CANCELLED',
      }
    ]
  }
];

export const SystemLogs: React.FC = () => {
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'warning';
      case 'DELETE': return 'danger';
      case 'LOGIN': return 'info';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-indigo-500" />
            Nhật ký Hệ thống (Audit Logs)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi, đối chiếu các thay đổi dữ liệu và thao tác của người dùng trong hệ thống.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between shadow-sm">
        <div className="flex-1 min-w-[240px] max-w-md relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã log, người thực hiện..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-sm">
            <Filter className="w-4 h-4 mr-2" /> Lọc theo module
          </Button>
          <Button variant="outline" className="text-sm">
            <Filter className="w-4 h-4 mr-2" /> Lọc thời gian
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="px-6 py-4 font-medium border-b border-slate-200 dark:border-slate-700">Mã truy vết</th>
                <th className="px-6 py-4 font-medium border-b border-slate-200 dark:border-slate-700">Hành động</th>
                <th className="px-6 py-4 font-medium border-b border-slate-200 dark:border-slate-700">Người thực hiện</th>
                <th className="px-6 py-4 font-medium border-b border-slate-200 dark:border-slate-700">Thời điểm</th>
                <th className="px-6 py-4 font-medium border-b border-slate-200 dark:border-slate-700">Mô tả ngắn gọn</th>
                <th className="px-6 py-4 font-medium border-b border-slate-200 dark:border-slate-700 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {MOCK_LOGS.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{log.id}</td>
                  <td className="px-6 py-4">
                    <Badge variant={getActionColor(log.action)}>{log.action}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-white">{log.executorName}</div>
                    <div className="text-xs text-slate-500">{log.executorRole}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{formatDate(log.timestamp)}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 truncate max-w-[200px]" title={log.description}>
                    {log.description}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedLog(log)}
                      className="text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                    >
                      <Eye className="w-4 h-4 mr-1.5" /> Chi tiết
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <LogDetailModal 
        isOpen={!!selectedLog} 
        onClose={() => setSelectedLog(null)} 
        log={selectedLog} 
      />
    </div>
  );
};
