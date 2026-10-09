import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Minus, Trash2, Save, Send, Calendar, MapPin, Building2, ShoppingBag } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { customerService } from '../../services/customerService';
import { productService } from '../../services/productService';
import { Customer } from '../../types/Customer';
import { Product } from '../../types/Product';
import { useToast } from '../../contexts/ToastContext';

interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  stock: number;
}

export const MobileOrderCreate: React.FC = () => {
  const { showToast } = useToast();
  
  // Data sources
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Order Header
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [deliveryPoint, setDeliveryPoint] = useState<string>('');
  const [expectedDate, setExpectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  // Cart
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  
  // Search Products Modal
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    customerService.getAll().then(setCustomers);
    productService.getAll().then(setProducts);
    
    // Load draft if exists
    const draft = localStorage.getItem('mobile_order_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setSelectedCustomerId(parsed.selectedCustomerId || '');
        setDeliveryPoint(parsed.deliveryPoint || '');
        setExpectedDate(parsed.expectedDate || '');
        setCart(parsed.cart || []);
        setDiscountAmount(parsed.discountAmount || 0);
        showToast('Đã tải lại đơn nháp', 'info');
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    }
  }, []);

  // Update delivery point when customer changes
  useEffect(() => {
    if (selectedCustomerId) {
      const c = customers.find(c => c.id === selectedCustomerId);
      if (c && !deliveryPoint) {
        setDeliveryPoint(c.address);
      }
    }
  }, [selectedCustomerId, customers]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery)
    );
  }, [products, searchQuery]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      showToast('Sản phẩm đã hết hàng', 'warning');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
            showToast('Vượt quá tồn kho', 'warning');
            return prev;
        }
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        price: product.salePrice,
        quantity: 1,
        unit: product.unit,
        stock: product.stock
      }];
    });
    setIsSearchModalOpen(false);
    setSearchQuery('');
    showToast(`Đã thêm ${product.name}`, 'success');
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        if (newQty > item.stock) {
          showToast('Vượt quá tồn kho', 'warning');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const saveDraft = () => {
    const draft = {
      selectedCustomerId,
      deliveryPoint,
      expectedDate,
      cart,
      discountAmount
    };
    localStorage.setItem('mobile_order_draft', JSON.stringify(draft));
    showToast('Đã lưu nháp', 'success');
  };

  const submitOrder = () => {
    if (!selectedCustomerId) {
      showToast('Vui lòng chọn đại lý', 'error');
      return;
    }
    if (cart.length === 0) {
      showToast('Đơn hàng trống', 'error');
      return;
    }
    
    // Simulate API call
    setTimeout(() => {
      showToast('Tạo đơn thành công!', 'success');
      localStorage.removeItem('mobile_order_draft');
      setCart([]);
      setSelectedCustomerId('');
      setDeliveryPoint('');
      setDiscountAmount(0);
    }, 500);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = Math.max(0, subtotal - discountAmount);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-[360px] mx-auto bg-slate-50 dark:bg-slate-900 overflow-hidden relative border-x border-slate-200 dark:border-slate-800 shadow-xl">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-4 shadow-md shrink-0">
        <h1 className="text-base font-bold flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          Tạo Đơn Hàng Mới
        </h1>
        <p className="text-[11px] text-indigo-100 mt-1">Dành cho Sales thị trường</p>
      </div>

      {/* Main Content scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-24">
        
        {/* Customer Info Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-slate-100 dark:border-slate-700 space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
              Đại lý / Khách hàng *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">-- Chọn đại lý --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
              Điểm giao hàng
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={deliveryPoint}
                onChange={e => setDeliveryPoint(e.target.value)}
                placeholder="Nhập địa chỉ giao"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
              Ngày giao mong muốn
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={expectedDate}
                onChange={e => setExpectedDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Cart Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Sản phẩm ({cart.length})</h2>
            <Button size="sm" variant="secondary" onClick={() => setIsSearchModalOpen(true)} className="text-xs py-1 px-2 h-auto">
              <Plus className="w-3 h-3 mr-1" /> Thêm
            </Button>
          </div>

          {cart.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              Chưa có sản phẩm nào
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.productId} className="flex flex-col gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">{item.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{item.sku} • {formatCurrency(item.price)}/{item.unit}</p>
                    </div>
                    <button onClick={() => updateQty(item.productId, -item.quantity)} className="p-1 text-slate-400 hover:text-rose-500 shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 p-0.5">
                      <button onClick={() => updateQty(item.productId, -1)} className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-300">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => updateQty(item.productId, 1)} className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-300">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-slate-100 dark:border-slate-700 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Tổng tiền hàng:</span>
            <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span>Chiết khấu (VNĐ):</span>
            <input 
              type="number" 
              value={discountAmount || ''} 
              onChange={e => setDiscountAmount(Number(e.target.value))}
              placeholder="0"
              className="w-24 px-2 py-1 text-right text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 text-rose-600 font-semibold"
            />
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-bold">
            <span className="text-slate-900 dark:text-white">Khách phải trả:</span>
            <span className="text-indigo-600 dark:text-indigo-400 text-lg">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-800 p-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] border-t border-slate-200 dark:border-slate-700 flex gap-2 z-10">
        <Button variant="secondary" className="flex-1 py-3 text-sm font-bold" onClick={saveDraft}>
          <Save className="w-4 h-4 mr-1.5" /> Lưu nháp
        </Button>
        <Button variant="primary" className="flex-1 py-3 text-sm font-bold" onClick={submitOrder}>
          <Send className="w-4 h-4 mr-1.5" /> Chốt Đơn
        </Button>
      </div>

      {/* Search Product Modal for Mobile */}
      {isSearchModalOpen && (
        <div className="absolute inset-0 bg-white dark:bg-slate-900 z-50 flex flex-col">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm mã hoặc tên SP..."
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <Button variant="secondary" className="px-3" onClick={() => setIsSearchModalOpen(false)}>Hủy</Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {filteredProducts.map(p => (
              <div key={p.id} className="p-3 border-b border-slate-100 dark:border-slate-800 flex gap-3 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors" onClick={() => addToCart(p)}>
                <img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded-md bg-slate-100 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">{p.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{p.sku}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs font-bold text-indigo-600">{formatCurrency(p.salePrice)}/{p.unit}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${p.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>Tồn: {p.stock}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
