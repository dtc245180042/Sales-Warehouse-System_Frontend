import React from 'react';
import { Modal } from '../common/Modal';
import { SystemLog } from '../../types/SystemLog';
import { Badge } from '../common/Badge';
import { Clock, User, Shield, ArrowRight, Laptop, Activity } from 'lucide-react';

interface LogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: SystemLog | null;
}

export const LogDetailModal: React.FC<LogDetailModalProps> = ({ isOpen, onClose, log }) => {
  if (!log) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'warning';
      case 'DELETE':
        return 'danger';
      case 'LOGIN':
      case 'LOGOUT':
        return 'info';
      case 'LOCK':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết Nhật ký Hệ thống"
      subtitle={`Mã truy vết: ${log.id}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Header Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Người thực hiện</h4>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="font-medium text-slate-900 dark:text-white">{log.executorName}</div>
                <div className="text-sm text-slate-500">{log.executorId}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mt-3">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Vai trò: <span className="font-medium text-slate-900 dark:text-white">{log.executorRole}</span></span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Thông tin thao tác</h4>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500 w-20">Hành động:</span>
                <Badge variant={getActionColor(log.action)}>{log.action}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500 w-20">Thời gian:</span>
                <span className="font-medium text-slate-900 dark:text-white">{formatDate(log.timestamp)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Laptop className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500 w-20">Nội dung:</span>
                <span className="text-slate-900 dark:text-white line-clamp-1" title={log.description}>{log.description}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Changes Detail (Before & After) */}
        {log.changes && log.changes.length > 0 ? (
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <span>Đối chiếu dữ liệu thay đổi</span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full">
                {log.changes.length} mục
              </span>
            </h4>
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-medium border-b border-slate-200 dark:border-slate-700 w-1/4">Trường dữ liệu</th>
                    <th className="px-4 py-3 font-medium border-b border-slate-200 dark:border-slate-700 w-1/3 text-red-600 dark:text-red-400">Giá trị trước</th>
                    <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 w-10 text-center"></th>
                    <th className="px-4 py-3 font-medium border-b border-slate-200 dark:border-slate-700 w-1/3 text-emerald-600 dark:text-emerald-400">Giá trị sau</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/50">
                  {log.changes.map((change, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300 flex flex-col">
                        <span>{change.fieldLabel}</span>
                        <span className="text-xs text-slate-400 font-mono mt-0.5">{change.field}</span>
                      </td>
                      <td className="px-4 py-3">
                        {change.oldValue !== null && change.oldValue !== undefined && change.oldValue !== '' ? (
                          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-1.5 rounded text-sm border border-red-100 dark:border-red-800/30 break-all">
                            {String(change.oldValue)}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Không có</span>
                        )}
                      </td>
                      <td className="px-2 py-3 text-center">
                        <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                      </td>
                      <td className="px-4 py-3">
                        {change.newValue !== null && change.newValue !== undefined && change.newValue !== '' ? (
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded text-sm border border-emerald-100 dark:border-emerald-800/30 break-all shadow-sm">
                            {String(change.newValue)}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Trống</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 text-center border border-slate-100 dark:border-slate-700/50">
            <p className="text-slate-500 dark:text-slate-400 text-sm">Bản ghi nhật ký này không chứa thông tin thay đổi dữ liệu chi tiết.</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
