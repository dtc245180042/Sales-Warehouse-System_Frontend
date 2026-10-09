import React, { useState } from 'react';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const DiscountPolicies: React.FC = () => {
  const [policies] = useState([
    { id: 1, name: 'Chiết khấu mua sỉ mức 1', minQty: 10, discountPercent: 5, status: 'active' },
    { id: 2, name: 'Chiết khấu mua sỉ mức 2', minQty: 50, discountPercent: 10, status: 'active' },
    { id: 3, name: 'Chiết khấu đại lý lớn', minQty: 100, discountPercent: 15, status: 'active' },
  ]);

  return (
    <PageContainer
      title="Chính Sách Chiết Khấu (S3-01)"
      subtitle="Khai báo mức chiết khấu tự động theo ngưỡng sản lượng mua"
      actions={
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
          Thêm chính sách
        </Button>
      }
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Tên chính sách</th>
              <th className="px-4 py-3 font-semibold">Sản lượng tối thiểu</th>
              <th className="px-4 py-3 font-semibold">% Chiết khấu</th>
              <th className="px-4 py-3 font-semibold">Trạng thái</th>
              <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {policies.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3 font-medium flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-500" />
                  {p.name}
                </td>
                <td className="px-4 py-3">&ge; {p.minQty} sản phẩm</td>
                <td className="px-4 py-3 text-emerald-600 font-bold">{p.discountPercent}%</td>
                <td className="px-4 py-3">
                  <Badge variant={p.status === 'active' ? 'success' : 'neutral'}>
                    {p.status === 'active' ? 'Đang áp dụng' : 'Tạm ngưng'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="p-1 text-slate-400 hover:text-indigo-600"><Edit className="w-4 h-4" /></button>
                  <button className="p-1 text-slate-400 hover:text-rose-600 ml-2"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
};
