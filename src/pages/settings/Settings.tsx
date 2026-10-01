import React, { useState } from 'react';
import {
  User,
  Store,
  Receipt,
  Bell,
  Palette,
  ShieldCheck,
  Save,
  CheckCircle2,
  Sun,
  Moon,
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { getStorageItem, setStorageItem } from '../../services/storage';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'store' | 'tax' | 'notif' | 'appearance' | 'security'>('profile');

  // Store settings local state
  const [storeName, setStoreName] = useState(() => getStorageItem('kv_store_name', 'Hệ Thống KhoVận Pro Showroom'));
  const [storeAddress, setStoreAddress] = useState(() => getStorageItem('kv_store_address', '128 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. HCM'));
  const [storePhone, setStorePhone] = useState(() => getStorageItem('kv_store_phone', '1900 6868'));
  const [storeTaxId, setStoreTaxId] = useState(() => getStorageItem('kv_store_tax', '0314859620'));

  // Profile local state
  const [profileName, setProfileName] = useState(user?.name || 'Nguyễn Văn Quản Trị');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '0901234567');

  // Security
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Đã lưu thông tin hồ sơ người dùng!', 'success');
  };

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    setStorageItem('kv_store_name', storeName);
    setStorageItem('kv_store_address', storeAddress);
    setStorageItem('kv_store_phone', storePhone);
    setStorageItem('kv_store_tax', storeTaxId);
    showToast('Đã cập nhật thông tin cửa hàng thành công!', 'success');
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast('Mật khẩu mới phải có tối thiểu 6 ký tự', 'warning');
      return;
    }
    setOldPassword('');
    setNewPassword('');
    showToast('Đã đổi mật khẩu tài khoản thành công!', 'success');
  };

  const tabs = [
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: User },
    { id: 'store', label: 'Thông tin cửa hàng', icon: Store },
    { id: 'tax', label: 'Thuế & Tiền tệ', icon: Receipt },
    { id: 'notif', label: 'Cấu hình thông báo', icon: Bell },
    { id: 'appearance', label: 'Giao diện & Hiển thị', icon: Palette },
    { id: 'security', label: 'Bảo mật & Đổi mật khẩu', icon: ShieldCheck },
  ];

  return (
    <PageContainer
      title="Cài Đặt Hệ Thống"
      subtitle="Quản lý tùy biến thông tin doanh nghiệp, tài khoản, thuế và cấu hình giao diện"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Tabs */}
        <div className="lg:col-span-1 space-y-1 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card h-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panel */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                Hồ Sơ Cá Nhân
              </h3>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt="Avatar"
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-500/20"
                  />
                  <div>
                    <Button variant="outline" size="sm" type="button">
                      Thay đổi ảnh đại diện
                    </Button>
                    <p className="text-[11px] text-slate-400 mt-1">Định dạng PNG, JPG tối đa 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email (không thể đổi)
                    </label>
                    <input
                      type="email"
                      value={user?.email || 'admin@khovanpro.vn'}
                      disabled
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Vai trò tài khoản
                    </label>
                    <input
                      type="text"
                      value={user?.role || 'Admin'}
                      disabled
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-sm text-slate-500 cursor-not-allowed font-semibold"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button variant="primary" type="submit" leftIcon={<Save className="w-4 h-4" />}>
                    Lưu thông tin hồ sơ
                  </Button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'store' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                Thông Tin Thương Hiệu & Cửa Hàng
              </h3>
              <form onSubmit={handleSaveStore} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tên chuỗi cửa hàng / Doanh nghiệp
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Địa chỉ trụ sở chính (Hiển thị trên hóa đơn POS)
                  </label>
                  <input
                    type="text"
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Hotline chăm sóc khách hàng
                    </label>
                    <input
                      type="text"
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Mã số thuế doanh nghiệp
                    </label>
                    <input
                      type="text"
                      value={storeTaxId}
                      onChange={(e) => setStoreTaxId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button variant="primary" type="submit" leftIcon={<Save className="w-4 h-4" />}>
                    Lưu thông tin cửa hàng
                  </Button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'tax' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cấu Hình Thuế & Tiền Tệ
              </h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Đơn vị tiền tệ chính
                  </label>
                  <select className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm">
                    <option value="VND">Việt Nam Đồng (VNĐ - ₫)</option>
                    <option value="USD">Đô la Mỹ (USD - $)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Thuế suất mặc định khi xuất hóa đơn POS
                  </label>
                  <select className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm">
                    <option value="0">0% (Không tính thuế)</option>
                    <option value="8">8% (Thuế VAT ưu đãi nghị quyết)</option>
                    <option value="10">10% (Thuế VAT thông thường)</option>
                  </select>
                </div>
                <Button variant="primary" onClick={() => showToast('Đã lưu cấu hình thuế!', 'success')}>
                  Lưu cấu hình
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'notif' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Thiết Lập Thông Báo
              </h3>
              <div className="space-y-3">
                {[
                  { title: 'Cảnh báo khi tồn kho chạm mức tối thiểu', desc: 'Gửi cảnh báo popup và email khi số lượng &lt; minStock' },
                  { title: 'Thông báo đơn hàng mới từ quầy POS', desc: 'Phát âm thanh báo hiệu khi có giao dịch thanh toán thành công' },
                  { title: 'Báo cáo doanh số tự động cuối ngày', desc: 'Tổng kết doanh thu và đơn hàng gửi về email quản trị viên lúc 22:00' },
                ].map((item, idx) => (
                  <label key={idx} className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 mt-0.5 text-indigo-600 rounded" />
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">{item.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <Button variant="primary" onClick={() => showToast('Đã cập nhật cấu hình thông báo', 'success')}>
                Lưu cài đặt thông báo
              </Button>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card space-y-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Giao Diện & Màu Sắc
              </h3>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Chế độ giao diện (Theme Mode)
                </p>
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  <div
                    onClick={() => setTheme('light')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${
                      theme === 'light'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="p-3 rounded-xl bg-white shadow-sm text-amber-500 border border-slate-100">
                      <Sun className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Giao diện Sáng (Light)</span>
                  </div>

                  <div
                    onClick={() => setTheme('dark')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${
                      theme === 'dark'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="p-3 rounded-xl bg-slate-900 shadow-sm text-indigo-400 border border-slate-800">
                      <Moon className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Giao diện Tối (Dark)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                Bảo Mật & Mật Khẩu
              </h3>
              <form onSubmit={handleSaveSecurity} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="pt-2">
                  <Button variant="primary" type="submit">
                    Cập nhật mật khẩu
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};
