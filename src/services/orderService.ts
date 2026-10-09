import {
  Order,
  OrderStatus,
  OrderCalculateRequest,
  OrderCalculateResponse,
  ProductSearchForOrder,
  PurchaseHistorySuggestionResponse,
} from '../types/Order';
import { initialOrders } from '../mock/orders';
import { getStorageItem, setStorageItem } from './storage';
import { productService } from './productService';
import { apiClient } from '../api/client';

const STORAGE_KEY = 'kv_orders';

function mapApiOrder(o: any): Order {
  return {
    id: String(o.id),
    code: o.code || '',
    customerId: o.customerId || o.customer_id || '',
    customerName: o.customerName || o.customer_name || '',
    customerPhone: o.customerPhone || o.customer_phone || '',
    customerAddress: o.customerAddress || o.customer_address || undefined,
    items: (o.items || []).map((itm: any) => ({
      productId: String(itm.productId || itm.product_id || ''),
      sku: itm.sku || '',
      name: itm.name || '',
      unit: itm.unit || 'cái',
      price: Number(itm.price || 0),
      quantity: Number(itm.quantity || 1),
      discount: Number(itm.discount || 0),
      subtotal: Number(itm.subtotal || 0),
      appliedDiscountPolicyName: itm.appliedDiscountPolicyName || itm.applied_discount_policy_name || undefined,
      discountRate: itm.discountRate || itm.discount_rate || undefined,
      discountAmount: itm.discountAmount || itm.discount_amount || undefined,
    })),
    subtotal: Number(o.subtotal || 0),
    discount: Number(o.discount || 0),
    tax: Number(o.tax || 0),
    total: Number(o.total || 0),
    paidAmount: Number(o.paidAmount ?? o.paid_amount ?? 0),
    changeAmount: Number(o.changeAmount ?? o.change_amount ?? 0),
    paymentMethod: o.paymentMethod || o.payment_method || 'cash',
    paymentStatus: o.paymentStatus || o.payment_status || 'paid',
    status: o.status || 'pending',
    staffId: String(o.staffId || o.staff_id || ''),
    staffName: o.staffName || o.staff_name || '',
    note: o.note || undefined,
    deliveryAddressId: o.deliveryAddressId ?? o.delivery_address_id ?? undefined,
    deliveryAddressName: o.deliveryAddressName ?? o.delivery_address_name ?? undefined,
    deliveryReceiverName: o.deliveryReceiverName ?? o.delivery_receiver_name ?? undefined,
    deliveryPhone: o.deliveryPhone ?? o.delivery_phone ?? undefined,
    deliveryAddress: o.deliveryAddress ?? o.delivery_address ?? undefined,
    deliveryNotes: o.deliveryNotes ?? o.delivery_notes ?? undefined,
    expectedDeliveryDate: o.expectedDeliveryDate || o.expected_delivery_date || undefined,
    createdAt: o.createdAt || (o.created_at ? o.created_at.replace('T', ' ').slice(0, 16) : new Date().toISOString().replace('T', ' ').slice(0, 16)),
    updatedAt: o.updatedAt || (o.updated_at ? o.updated_at.replace('T', ' ').slice(0, 16) : new Date().toISOString().replace('T', ' ').slice(0, 16)),
  };
}

export const orderService = {
  getAll: async (): Promise<Order[]> => {
    try {
      const res = await apiClient.get('/orders');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const list = res.data.map(mapApiOrder);
        setStorageItem(STORAGE_KEY, list);
        return list;
      }
    } catch (err) {
      console.warn('[orderService] Backend error, fallback to storage:', err);
    }
    return getStorageItem<Order[]>(STORAGE_KEY, initialOrders);
  },

  getById: async (id: string): Promise<Order | undefined> => {
    try {
      const res = await apiClient.get(`/orders/${encodeURIComponent(id)}`);
      if (res.data) {
        return mapApiOrder(res.data);
      }
    } catch {}
    const orders = getStorageItem<Order[]>(STORAGE_KEY, initialOrders);
    return orders.find((o) => o.id === id || o.code === id);
  },

  create: async (orderData: Partial<Order> & { customerId: string; customerName: string; items: any[] }): Promise<Order> => {
    try {
      const payload = {
        customer_id: orderData.customerId,
        customer_name: orderData.customerName,
        customer_phone: orderData.customerPhone,
        customer_address: orderData.customerAddress,
        items: orderData.items.map((i) => ({
          product_id: i.productId || i.product_id,
          sku: i.sku,
          name: i.name,
          unit: i.unit || 'cái',
          price: i.price,
          quantity: i.quantity,
          discount: i.discount || 0,
          subtotal: i.subtotal || i.price * i.quantity,
        })),
        subtotal: orderData.subtotal,
        discount: orderData.discount,
        tax: orderData.tax || 0,
        total: orderData.total,
        paid_amount: orderData.paidAmount ?? 0,
        change_amount: orderData.changeAmount ?? 0,
        payment_method: orderData.paymentMethod || 'cash',
        payment_status: orderData.paymentStatus || 'paid',
        status: orderData.status || 'pending',
        staff_id: orderData.staffId,
        staff_name: orderData.staffName,
        note: orderData.note,
        delivery_address_id: orderData.deliveryAddressId,
        delivery_address_name: orderData.deliveryAddressName,
        delivery_receiver_name: orderData.deliveryReceiverName,
        delivery_phone: orderData.deliveryPhone,
        delivery_address: orderData.deliveryAddress,
        delivery_notes: orderData.deliveryNotes,
        expected_delivery_date: orderData.expectedDeliveryDate,
      };

      const res = await apiClient.post('/orders', payload);
      const created = mapApiOrder(res.data);
      const orders = getStorageItem<Order[]>(STORAGE_KEY, initialOrders);
      setStorageItem(STORAGE_KEY, [created, ...orders]);
      return created;
    } catch (err: any) {
      console.warn('[orderService] Backend error, creating locally:', err);
      // Nếu có thông điệp lỗi cụ thể từ API (vd: 400 Bad Request), ném lỗi để UI hiển thị thông báo
      if (err.response?.data?.detail) {
        throw new Error(err.response.data.detail);
      }
      const orders = getStorageItem<Order[]>(STORAGE_KEY, initialOrders);
      const newCode = `DH-2026-${String(orders.length + 1).padStart(3, '0')}`;
      const now = new Date();
      const dateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const newOrder: Order = {
        id: `ORD-${String(orders.length + 1).padStart(3, '0')}`,
        code: newCode,
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone || '',
        customerAddress: orderData.customerAddress,
        items: orderData.items,
        subtotal: orderData.subtotal || 0,
        discount: orderData.discount || 0,
        tax: orderData.tax || 0,
        total: orderData.total || 0,
        paidAmount: orderData.paidAmount || 0,
        changeAmount: orderData.changeAmount || 0,
        paymentMethod: orderData.paymentMethod || 'cash',
        paymentStatus: orderData.paymentStatus || 'paid',
        status: orderData.status || 'pending',
        staffId: orderData.staffId || 'NV-001',
        staffName: orderData.staffName || 'Nhân viên kinh doanh',
        note: orderData.note,
        deliveryAddressId: orderData.deliveryAddressId,
        deliveryAddressName: orderData.deliveryAddressName,
        deliveryReceiverName: orderData.deliveryReceiverName,
        deliveryPhone: orderData.deliveryPhone,
        deliveryAddress: orderData.deliveryAddress,
        deliveryNotes: orderData.deliveryNotes,
        expectedDeliveryDate: orderData.expectedDeliveryDate,
        createdAt: dateFormatted,
        updatedAt: dateFormatted,
      };

      if (newOrder.status !== 'draft') {
        for (const item of newOrder.items) {
          try {
            await productService.updateStock(item.productId, -item.quantity);
          } catch (e) {
            console.warn(e);
          }
        }
      }

      setStorageItem(STORAGE_KEY, [newOrder, ...orders]);
      return newOrder;
    }
  },

  calculate: async (req: OrderCalculateRequest): Promise<OrderCalculateResponse> => {
    try {
      const res = await apiClient.post('/orders/calculate', req);
      return res.data;
    } catch (err: any) {
      console.warn('[orderService] Calculate API failed, calculating locally:', err);
      // Local fallback calculation
      let subtotal = 0;
      const items = req.items.map((itm) => {
        const price = itm.price || 0;
        const lineSubtotal = price * itm.quantity;
        subtotal += lineSubtotal;
        return {
          product_id: String(itm.product_id),
          name: '',
          unit: itm.unit || 'cái',
          unit_price: price,
          quantity: itm.quantity,
          discount_amount: 0,
          discount_rate: 0,
          subtotal: lineSubtotal,
        };
      });
      return {
        subtotal,
        discount: 0,
        total: subtotal,
        items,
      };
    }
  },

  getDrafts: async (): Promise<Order[]> => {
    try {
      const res = await apiClient.get('/orders/drafts');
      if (Array.isArray(res.data)) {
        return res.data.map(mapApiOrder);
      }
    } catch (err) {
      console.warn('[orderService] getDrafts API failed:', err);
    }
    const orders = getStorageItem<Order[]>(STORAGE_KEY, initialOrders);
    return orders.filter((o) => o.status === 'draft');
  },

  searchProductsForOrder: async (query?: string): Promise<ProductSearchForOrder[]> => {
    try {
      const res = await apiClient.get('/orders/products/search', {
        params: query ? { q: query } : {},
      });
      if (Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn('[orderService] searchProductsForOrder API failed, fallback to productService:', err);
    }
    const prods = await productService.getAll();
    const qLower = (query || '').toLowerCase().trim();
    const filtered = prods.filter(
      (p) => !qLower || p.name.toLowerCase().includes(qLower) || p.sku.toLowerCase().includes(qLower)
    );
    return filtered.slice(0, 20).map((p) => {
      const available_units = [p.unit || 'cái'];
      if (p.packagingSpec) {
        const specLower = p.packagingSpec.toLowerCase();
        for (const u of ['hộp', 'thùng', 'lon', 'gói', 'chai', 'bộ', 'cặp', 'kg', 'cái']) {
          if (specLower.includes(u) && !available_units.includes(u)) {
            available_units.push(u);
          }
        }
      } else {
        ['hộp', 'thùng'].forEach((u) => {
          if (!available_units.includes(u)) available_units.push(u);
        });
      }
      return {
        id: typeof p.id === 'number' ? p.id : parseInt(p.id, 10) || 1,
        sku: p.sku,
        name: p.name,
        price: p.salePrice || p.price || 0,
        sale_price: p.salePrice || p.price || 0,
        stock: p.stock ?? 100,
        unit: p.unit || 'cái',
        packaging_spec: p.packagingSpec,
        available_units,
      };
    });
  },

  updateDraft: async (orderId: string, draftData: any): Promise<Order> => {
    try {
      const res = await apiClient.put(`/orders/${encodeURIComponent(orderId)}/draft`, draftData);
      const updated = mapApiOrder(res.data);
      const orders = getStorageItem<Order[]>(STORAGE_KEY, initialOrders);
      const idx = orders.findIndex((o) => o.id === orderId || o.code === orderId);
      if (idx !== -1) {
        orders[idx] = updated;
        setStorageItem(STORAGE_KEY, [...orders]);
      }
      return updated;
    } catch (err: any) {
      if (err.response?.data?.detail) {
        throw new Error(err.response.data.detail);
      }
      throw err;
    }
  },

  submitDraft: async (orderId: string): Promise<Order> => {
    try {
      const res = await apiClient.post(`/orders/${encodeURIComponent(orderId)}/submit`);
      const submitted = mapApiOrder(res.data);
      const orders = getStorageItem<Order[]>(STORAGE_KEY, initialOrders);
      const idx = orders.findIndex((o) => o.id === orderId || o.code === orderId);
      if (idx !== -1) {
        orders[idx] = submitted;
        setStorageItem(STORAGE_KEY, [...orders]);
      }
      return submitted;
    } catch (err: any) {
      if (err.response?.data?.detail) {
        throw new Error(err.response.data.detail);
      }
      throw err;
    }
  },

  updateStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    try {
      const res = await apiClient.patch(`/orders/${encodeURIComponent(id)}/status`, { status });
      const updated = mapApiOrder(res.data);
      const orders = getStorageItem<Order[]>(STORAGE_KEY, initialOrders);
      const idx = orders.findIndex((o) => o.id === id || o.code === id);
      if (idx !== -1) {
        orders[idx] = updated;
        setStorageItem(STORAGE_KEY, [...orders]);
      }
      return updated;
    } catch (err) {
      console.warn('[orderService] Backend error, updating locally:', err);
      const orders = getStorageItem<Order[]>(STORAGE_KEY, initialOrders);
      const index = orders.findIndex((o) => o.id === id || o.code === id);
      if (index === -1) throw new Error('Không tìm thấy đơn hàng');

      const updated = {
        ...orders[index],
        status,
        updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      };
      orders[index] = updated;
      setStorageItem(STORAGE_KEY, [...orders]);
      return updated;
    }
  },

  cancelOrder: async (id: string): Promise<Order> => {
    try {
      const res = await apiClient.post(`/orders/${encodeURIComponent(id)}/cancel`);
      const updated = mapApiOrder(res.data);
      const orders = getStorageItem<Order[]>(STORAGE_KEY, initialOrders);
      const idx = orders.findIndex((o) => o.id === id || o.code === id);
      if (idx !== -1) {
        orders[idx] = updated;
        setStorageItem(STORAGE_KEY, [...orders]);
      }
      return updated;
    } catch (err) {
      console.warn('[orderService] Backend error, cancelling locally:', err);
      const orders = getStorageItem<Order[]>(STORAGE_KEY, initialOrders);
      const index = orders.findIndex((o) => o.id === id || o.code === id);
      if (index === -1) throw new Error('Không tìm thấy đơn hàng');

      if (orders[index].status !== 'cancelled') {
        for (const item of orders[index].items) {
          try {
            await productService.updateStock(item.productId, item.quantity);
          } catch (e) {
            console.warn(e);
          }
        }
      }

      orders[index].status = 'cancelled';
      orders[index].updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 16);
      setStorageItem(STORAGE_KEY, [...orders]);
      return orders[index];
    }
  },

  // SCRUM-236 (S4-04): Lấy gợi ý mặt hàng từ lịch sử mua hàng 3 tháng gần nhất
  getPurchaseHistorySuggestions: async (
    customerId: string,
    windowDays: number = 90
  ): Promise<PurchaseHistorySuggestionResponse> => {
    const res = await apiClient.get(`/orders/suggestions/${encodeURIComponent(customerId)}?window_days=${windowDays}`);
    const d = res.data;
    return {
      customerId: String(d.customerId || d.customer_id || customerId),
      customerName: d.customerName || d.customer_name || '',
      timeWindowDays: d.timeWindowDays ?? d.time_window_days ?? windowDays,
      totalOrdersInWindow: d.totalOrdersInWindow ?? d.total_orders_in_window ?? 0,
      hasPurchaseHistory: Boolean(d.hasPurchaseHistory ?? d.has_purchase_history),
      items: (d.items || []).map((i: any) => ({
        productId: String(i.productId || i.product_id),
        sku: i.sku || undefined,
        name: i.name,
        unit: i.unit || 'cái',
        category: i.category || 'Khác',
        categoryId: i.categoryId ?? i.category_id ?? undefined,
        avgQuantity: Number(i.avgQuantity ?? i.avg_quantity ?? 1),
        totalQuantity: Number(i.totalQuantity ?? i.total_quantity ?? 0),
        orderCount: Number(i.orderCount ?? i.order_count ?? 0),
        lastQuantity: Number(i.lastQuantity ?? i.last_quantity ?? 1),
        lastPurchasedAt: i.lastPurchasedAt || i.last_purchased_at || undefined,
        lastPrice: Number(i.lastPrice ?? i.last_price ?? 0),
        currentPrice: Number(i.currentPrice ?? i.current_price ?? 0),
        stock: Number(i.stock ?? 0),
      })),
      groups: (d.groups || []).map((g: any) => ({
        category: g.category,
        categoryId: g.categoryId ?? g.category_id ?? undefined,
        itemCount: Number(g.itemCount ?? g.item_count ?? (g.items?.length || 0)),
        totalSuggestedQuantity: Number(g.totalSuggestedQuantity ?? g.total_suggested_quantity ?? 0),
        items: (g.items || []).map((i: any) => ({
          productId: String(i.productId || i.product_id),
          sku: i.sku || undefined,
          name: i.name,
          unit: i.unit || 'cái',
          category: i.category || g.category || 'Khác',
          categoryId: i.categoryId ?? i.category_id ?? undefined,
          avgQuantity: Number(i.avgQuantity ?? i.avg_quantity ?? 1),
          totalQuantity: Number(i.totalQuantity ?? i.total_quantity ?? 0),
          orderCount: Number(i.orderCount ?? i.order_count ?? 0),
          lastQuantity: Number(i.lastQuantity ?? i.last_quantity ?? 1),
          lastPurchasedAt: i.lastPurchasedAt || i.last_purchased_at || undefined,
          lastPrice: Number(i.lastPrice ?? i.last_price ?? 0),
          currentPrice: Number(i.currentPrice ?? i.current_price ?? 0),
          stock: Number(i.stock ?? 0),
        })),
      })),
      lastOrder: d.lastOrder || d.last_order ? {
        orderId: String((d.lastOrder || d.last_order).orderId || (d.lastOrder || d.last_order).order_id),
        code: (d.lastOrder || d.last_order).code,
        createdAt: (d.lastOrder || d.last_order).createdAt || (d.lastOrder || d.last_order).created_at,
        total: Number((d.lastOrder || d.last_order).total || 0),
        items: ((d.lastOrder || d.last_order).items || []).map((it: any) => ({
          productId: String(it.productId || it.product_id),
          sku: it.sku || undefined,
          name: it.name,
          unit: it.unit || 'cái',
          quantity: Number(it.quantity || 1),
          price: Number(it.price || 0),
        })),
      } : undefined,
    };
  },

  // Quy tắc chống trùng dòng khi thêm sản phẩm/nhóm hàng từ lịch sử mua
  mergeSuggestionItems: async (
    currentItems: any[],
    itemsToAdd: any[],
    strategy: 'merge' | 'replace_qty' = 'merge'
  ) => {
    try {
      const res = await apiClient.post('/orders/suggestions/merge-items', {
        current_items: currentItems.map((i) => ({
          product_id: i.productId || i.product_id,
          sku: i.sku,
          name: i.name,
          unit: i.unit || 'cái',
          price: i.price,
          quantity: i.quantity,
          discount: i.discount || 0,
          subtotal: i.subtotal || (i.price * i.quantity),
        })),
        items_to_add: itemsToAdd.map((i) => ({
          product_id: i.productId || i.product_id,
          sku: i.sku,
          name: i.name,
          unit: i.unit || 'cái',
          price: i.price,
          quantity: i.quantity,
          discount: i.discount || 0,
          subtotal: i.subtotal || (i.price * i.quantity),
        })),
        strategy,
      });
      return res.data;
    } catch {
      const copy = [...currentItems];
      const indexMap = new Map(copy.map((itm, idx) => [String(itm.productId), idx]));
      let mergedCount = 0;
      let addedCount = 0;

      for (const addItm of itemsToAdd) {
        const pid = String(addItm.productId);
        if (indexMap.has(pid)) {
          const idx = indexMap.get(pid)!;
          if (strategy === 'replace_qty') {
            copy[idx].quantity = addItm.quantity;
          } else {
            copy[idx].quantity += addItm.quantity;
          }
          copy[idx].subtotal = copy[idx].price * copy[idx].quantity - (copy[idx].discount || 0);
          mergedCount++;
        } else {
          copy.unshift({
            ...addItm,
            subtotal: addItm.price * addItm.quantity - (addItm.discount || 0),
          });
          indexMap.set(pid, 0);
          addedCount++;
        }
      }
      return { items: copy, merged_count: mergedCount, added_count: addedCount };
    }
  }
};

