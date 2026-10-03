import React, { useEffect } from 'react';
import { X, User, Clock, Activity, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { AuditLogDetail } from '../types/auditLog';

export interface AuditLogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  logData: AuditLogDetail | null;
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({
  isOpen,
  onClose,
  logData,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !logData) return null;

  // Badge hiển thị loại hành động
  const getActionBadge = (action: AuditLogDetail['action']) => {
    switch (action) {
      case 'CREATE':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-800">
            Thêm mới
          </span>
        );
      case 'UPDATE':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 dark:border dark:border-blue-800">
            Cập nhật
          </span>
        );
      case 'DELETE':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 dark:border dark:border-red-800">
            Xóa
          </span>
        );
      default:
        return null;
    }
  };

  const formatValue = (val: any) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col border border-gray-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chi tiết nhật ký thao tác</h3>
              {getActionBadge(logData.action)}
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Mã bản ghi Log: <span className="font-mono font-medium">{logData.id}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng modal"
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung chính */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Thông tin Chung (Metadata) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            {/* Người thực hiện */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 rounded-lg shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Người thực hiện</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">{logData.performedBy.name}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{logData.performedBy.email}</p>
                {logData.performedBy.role && (
                  <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded">
                    {logData.performedBy.role}
                  </span>
                )}
              </div>
            </div>

            {/* Thời gian */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 rounded-lg shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Thời điểm thao tác</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{logData.timestamp}</p>
                {logData.ipAddress && (
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-mono">IP: {logData.ipAddress}</p>
                )}
              </div>
            </div>

            {/* Phân loại / Module */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 rounded-lg shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Chức năng / Module</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{logData.module}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{logData.actionName}</p>
              </div>
            </div>

            {/* Đối tượng tác động */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 rounded-lg shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Đối tượng tác động</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate" title={logData.targetEntity}>
                  {logData.targetEntity}
                </p>
              </div>
            </div>
          </div>

          {/* Bảng đối chiếu Giá trị Trước & Sau */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-bold text-gray-800 dark:text-slate-200">Bảng đối chiếu thay đổi dữ liệu</h4>
              {logData.changes && logData.changes.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                  {logData.changes.length} thay đổi
                </span>
              )}
            </div>

            <div className="border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100/70 dark:bg-slate-800/80 text-gray-700 dark:text-slate-300 text-xs uppercase font-semibold border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 w-1/4">Trường thông tin</th>
                    <th className="px-4 py-3 w-[35%] bg-red-50/50 dark:bg-red-950/30 text-red-700 dark:text-red-400">
                      Giá trị trước
                    </th>
                    <th className="px-4 py-3 w-[5%] text-center"></th>
                    <th className="px-4 py-3 w-[35%] bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
                      Giá trị sau
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {logData.changes && logData.changes.length > 0 ? (
                    logData.changes.map((item, index) => {
                      const isDifferent = item.oldValue !== item.newValue;
                      return (
                        <tr
                          key={index}
                          className={`hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                            isDifferent ? '' : 'opacity-75'
                          }`}
                        >
                          <td className="px-4 py-3 font-medium text-gray-700 dark:text-slate-300">
                            {item.fieldName}
                            <span className="block text-[11px] text-gray-400 dark:text-slate-500 font-mono">
                              {item.field}
                            </span>
                          </td>
                          {/* Giá trị trước */}
                          <td className="px-4 py-3 bg-red-50/30 dark:bg-red-950/20 font-mono text-red-900 dark:text-red-300 break-all">
                            {item.oldValue !== null && item.oldValue !== undefined ? (
                              <span className="line-through text-red-600/80 dark:text-red-400 mr-1">
                                {formatValue(item.oldValue)}
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-slate-500 italic text-xs">(Rỗng)</span>
                            )}
                          </td>
                          {/* Mũi tên hướng */}
                          <td className="px-2 py-3 text-center text-gray-400 dark:text-slate-500">
                            <ArrowRight className="w-4 h-4 inline" />
                          </td>
                          {/* Giá trị sau */}
                          <td className="px-4 py-3 bg-emerald-50/30 dark:bg-emerald-950/20 font-mono text-emerald-900 dark:text-emerald-300 font-semibold break-all">
                            {item.newValue !== null && item.newValue !== undefined ? (
                              <span>{formatValue(item.newValue)}</span>
                            ) : (
                              <span className="text-gray-400 dark:text-slate-500 italic text-xs font-normal">(Đã xóa)</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-gray-400 dark:text-slate-500 italic text-sm">
                        Không có trường dữ liệu nào được ghi nhận thay đổi
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogDetailModal;
