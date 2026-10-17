import { Order, OrderStatus } from '../types/Order';
import { initialOrders } from '../mock/orders';
import { getStorageItem, setStorageItem } from './storage';
import { productService } from './productService';
import { apiClient } from '../api/client';

const STORAGE_KEY = 'kv_orders';

function mapApiOrder(o: any): Order {
  return {
    id: o.id,
    code: o.code || '',
    customerId: o.customerId || o.customer_id || '',
    customerName: o.customerName || o.customer_name || '',
    customerPhone: o.customerPhone || o.customer_phone || '',
    customerAddress: o.customerAddress || o.customer_address || undefined,
    items: (o.items || []).map((itm: any) => ({
      productId: itm.productId || itm.product_id || '',
      sku: itm.sku || '',
      name: itm.name || '',
      price: Number(itm.price || 0),
      quantity: Number(itm.quantity || 1),
      deliveredQuantity: itm.deliveredQuantity !== undefined ? Number(itm.deliveredQuantity) : undefined,
      shortageReason: itm.shortageReason || undefined,
      unit: itm.unit || 'Cái',
      discount: Number(itm.discount || 0),
      subtotal: Number(itm.subtotal || 0),
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
    staffId: o.staffId || o.staff_id || '',
    staffName: o.staffName || o.staff_name || '',
    note: o.note || undefined,
    hasShortage: o.hasShortage ?? (o.items || []).some((it: any) => it.deliveredQuantity !== undefined && it.deliveredQuantity < it.quantity),
    shortageResolution: o.shortageResolution || undefined,
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
    const stored = getStorageItem<Order[]>(STORAGE_KEY, initialOrders);
    const hasAgentOrders = stored.some((o) => o.id.startsWith('ORD-AGT-'));
    if (!hasAgentOrders) {
      const merged = [...stored, ...initialOrders.filter((o) => o.id.startsWith('ORD-AGT-'))];
      setStorageItem(STORAGE_KEY, merged);
      return merged;
    }
    return stored;
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

  create: async (orderData: Omit<Order, 'id' | 'code' | 'createdAt' | 'updatedAt'>): Promise<Order> => {
    try {
      const payload = {
        customer_id: orderData.customerId,
        customer_name: orderData.customerName,
        customer_phone: orderData.customerPhone,
        customer_address: orderData.customerAddress,
        items: orderData.items.map((i) => ({
          product_id: i.productId,
          sku: i.sku,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          discount: i.discount,
          subtotal: i.subtotal,
        })),
        subtotal: orderData.subtotal,
        discount: orderData.discount,
        tax: orderData.tax,
        total: orderData.total,
        paid_amount: orderData.paidAmount,
        change_amount: orderData.changeAmount,
        payment_method: orderData.paymentMethod,
        payment_status: orderData.paymentStatus,
        status: orderData.status,
        staff_id: orderData.staffId,
        staff_name: orderData.staffName,
        note: orderData.note,
      };

      const res = await apiClient.post('/orders', payload);
      const created = mapApiOrder(res.data);
      const orders = getStorageItem<Order[]>(STORAGE_KEY, initialOrders);
      setStorageItem(STORAGE_KEY, [created, ...orders]);
      return created;
    } catch (err) {
      console.warn('[orderService] Backend error, creating locally:', err);
      const orders = getStorageItem<Order[]>(STORAGE_KEY, initialOrders);
      const newCode = `DH-2026-${String(orders.length + 1).padStart(3, '0')}`;
      const now = new Date();
      const dateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const newOrder: Order = {
        ...orderData,
        id: `ORD-${String(orders.length + 1).padStart(3, '0')}`,
        code: newCode,
        createdAt: dateFormatted,
        updatedAt: dateFormatted,
      };

      for (const item of newOrder.items) {
        try {
          await productService.updateStock(item.productId, -item.quantity);
        } catch (e) {
          console.warn(e);
        }
      }

      setStorageItem(STORAGE_KEY, [newOrder, ...orders]);
      return newOrder;
    }
  },

  updateStatus: async (id: string, status: OrderStatus, note?: string, performedBy?: string): Promise<Order> => {
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

      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
      const prevTimeline = orders[index].timeline || [];
      const updatedTimeline = [
        ...prevTimeline,
        {
          status,
          label: status,
          timestamp: nowStr,
          performedBy: performedBy || 'Nhân viên kinh doanh',
          note: note || `Chuyển sang trạng thái ${status}`,
        },
      ];

      const updated = {
        ...orders[index],
        status,
        timeline: updatedTimeline,
        updatedAt: nowStr,
      };
      orders[index] = updated;
      setStorageItem(STORAGE_KEY, [...orders]);
      return updated;
    }
  },

  update: async (id: string, partialData: Partial<Order>): Promise<Order> => {
    try {
      const res = await apiClient.put(`/orders/${encodeURIComponent(id)}`, partialData);
      const updated = mapApiOrder(res.data);
      const orders = getStorageItem<Order[]>(STORAGE_KEY, initialOrders);
      const idx = orders.findIndex((o) => o.id === id || o.code === id);
      if (idx !== -1) {
        orders[idx] = updated;
        setStorageItem(STORAGE_KEY, [...orders]);
      }
      return updated;
    } catch (err) {
      console.warn('[orderService] Backend error, updating order locally:', err);
      const orders = getStorageItem<Order[]>(STORAGE_KEY, initialOrders);
      const index = orders.findIndex((o) => o.id === id || o.code === id);
      if (index === -1) throw new Error('Không tìm thấy đơn hàng');

      const updated = {
        ...orders[index],
        ...partialData,
        updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      };
      orders[index] = updated;
      setStorageItem(STORAGE_KEY, [...orders]);
      return updated;
    }
  },

  cancelOrder: async (id: string, reason?: string, cancelledBy?: string): Promise<Order> => {
    const effectiveReason = reason?.trim() || 'Hủy đơn hàng theo yêu cầu';
    try {
      const res = await apiClient.post(`/orders/${encodeURIComponent(id)}/cancel`, {
        reason: effectiveReason,
      });
      const updated = mapApiOrder(res.data.order || res.data);
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
      const currentStatus = orders[index].status;
      if (currentStatus === 'shipping' || currentStatus === 'completed' || currentStatus === 'closed') {
        const statusLabel =
          currentStatus === 'shipping' ? 'Đã xuất kho' : currentStatus === 'completed' ? 'Đã giao' : 'Đóng';
        throw new Error(`Đơn hàng đang ở trạng thái "${statusLabel}", hàng đã xuất kho nên không thể hủy.`);
      }

      if (currentStatus !== 'cancelled') {
        for (const item of orders[index].items) {
          try {
            await productService.updateStock(item.productId, item.quantity);
          } catch (e) {
            console.warn(e);
          }
        }
      }

      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
      const cancelNote = reason || 'Khách hàng yêu cầu hủy đơn hàng';
      const prevTimeline = orders[index].timeline || [];
      const updatedTimeline = [
        ...prevTimeline,
        {
          status: 'cancelled' as OrderStatus,
          label: 'Đã hủy',
          timestamp: nowStr,
          performedBy: cancelledBy || 'Nhân viên kinh doanh',
          note: cancelNote,
        },
      ];

      orders[index].status = 'cancelled';
      orders[index].note = orders[index].note
        ? `${orders[index].note} [Lý do hủy: ${effectiveReason}]`
        : `[Lý do hủy: ${effectiveReason}]`;
      orders[index].cancelledReason = cancelNote;
      orders[index].cancelledAt = nowStr;
      orders[index].cancelledBy = cancelledBy || 'Nhân viên kinh doanh';
      orders[index].timeline = updatedTimeline;
      orders[index].updatedAt = nowStr;
      setStorageItem(STORAGE_KEY, [...orders]);
      return orders[index];
    }
  },

  /**
   * Cập nhật số lượng thực giao theo từng dòng hàng và lý do giao thiếu (SCRUM-696)
   */
  updateItemDeliveryQuantities: async (
    orderId: string,
    itemUpdates: { productId: string; deliveredQuantity: number; shortageReason?: string }[],
    resolutionNote?: string
  ): Promise<Order> => {
    const orders = getStorageItem<Order[]>(STORAGE_KEY, initialOrders);
    const index = orders.findIndex((o) => o.id === orderId || o.code === orderId);
    if (index === -1) throw new Error('Không tìm thấy đơn hàng');

    const currentOrder = orders[index];
    const updateMap = new Map(itemUpdates.map((u) => [u.productId, u]));

    let hasShortage = false;
    const updatedItems = currentOrder.items.map((it) => {
      const update = updateMap.get(it.productId);
      if (update) {
        const deliveredQty = Math.max(0, update.deliveredQuantity);
        if (deliveredQty < it.quantity) {
          hasShortage = true;
        }
        return {
          ...it,
          deliveredQuantity: deliveredQty,
          shortageReason: deliveredQty < it.quantity ? (update.shortageReason || 'Chưa ghi nhận lý do') : undefined,
        };
      }
      return it;
    });

    const updatedOrder: Order = {
      ...currentOrder,
      items: updatedItems,
      hasShortage,
      shortageResolution: hasShortage ? (resolutionNote || currentOrder.shortageResolution) : undefined,
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    orders[index] = updatedOrder;
    setStorageItem(STORAGE_KEY, [...orders]);
    return updatedOrder;
  },

  // S4-09: Sao chép đơn hàng cũ thành đơn nháp mới
  copyOrder: async (orderId: string): Promise<{ order: Order; warnings: string[]; message: string }> => {
    const res = await apiClient.post(`/orders/${encodeURIComponent(orderId)}/copy`);
    const mappedOrder = mapApiOrder(res.data.order || res.data);
    const orders = getStorageItem<Order[]>(STORAGE_KEY, initialOrders);
    setStorageItem(STORAGE_KEY, [mappedOrder, ...orders]);
    return {
      order: mappedOrder,
      warnings: res.data.warnings || [],
      message: res.data.message || 'Sao chép đơn thành công!',
    };
  },

  // S4-04: Lấy gợi ý sản phẩm từ lịch sử mua hàng 90 ngày
  getSuggestions: async (customerId: string, windowDays: number = 90): Promise<any> => {
    try {
      const res = await apiClient.get(
        `/orders/suggestions/${encodeURIComponent(customerId)}?window_days=${windowDays}`
      );
      return res.data;
    } catch (err) {
      console.warn('[orderService] Failed to load suggestions from backend:', err);
      return {
        customer_id: customerId,
        window_days: windowDays,
        total_past_orders: 0,
        suggested_products: [],
        categories_purchased: [],
      };
    }
  },

  // S4-02: Kiểm tra hồ sơ hạn mức công nợ thời gian thực của đại lý
  getCreditSummary: async (customerId: string): Promise<any> => {
    try {
      const res = await apiClient.get(`/customers/${encodeURIComponent(customerId)}/credit-summary`);
      return res.data;
    } catch (err) {
      console.warn('[orderService] Failed to load credit summary:', err);
      return null;
    }
  },

  // S4-05: Lấy chi tiết thông tin phê duyệt ngoại lệ của đơn hàng
  getApprovalDetail: async (orderId: string): Promise<any> => {
    try {
      const res = await apiClient.get(`/order-approvals/${encodeURIComponent(orderId)}`);
      return res.data;
    } catch (err) {
      console.warn('[orderService] Failed to load approval detail:', err);
      return null;
    }
  },

  // S4-05: Thao tác duyệt đơn ngoại lệ (Approve, Reject, Return) của Quản lý kinh doanh
  processApprovalAction: async (
    orderId: string,
    action: 'approve' | 'reject' | 'return',
    comment?: string
  ): Promise<any> => {
    const res = await apiClient.post(`/order-approvals/${encodeURIComponent(orderId)}/action`, {
      action,
      comment: comment?.trim() || undefined,
    });
    return res.data;
  },

  updateDraft: async (id: string, data: any): Promise<Order> => {
    try {
      const res = await apiClient.put(`/orders/${encodeURIComponent(id)}/draft`, data);
      return mapApiOrder(res.data.order || res.data);
    } catch (err) {
      console.warn('[orderService] Backend error, updating draft locally:', err);
      const orders = getStorageItem<Order[]>(STORAGE_KEY, initialOrders);
      const idx = orders.findIndex((o) => o.id === id || o.code === id);
      if (idx !== -1) {
        orders[idx] = { ...orders[idx], ...data, updatedAt: new Date().toISOString() };
        setStorageItem(STORAGE_KEY, [...orders]);
        return orders[idx];
      }
      throw new Error('Draft not found');
    }
  },

  submitDraft: async (id: string): Promise<Order> => {
    try {
      const res = await apiClient.post(`/orders/${encodeURIComponent(id)}/submit`);
      return mapApiOrder(res.data.order || res.data);
    } catch (err) {
      console.warn('[orderService] Backend error, submitting draft locally:', err);
      const orders = getStorageItem<Order[]>(STORAGE_KEY, initialOrders);
      const idx = orders.findIndex((o) => o.id === id || o.code === id);
      if (idx !== -1) {
        orders[idx] = { ...orders[idx], status: 'pending', updatedAt: new Date().toISOString() };
        setStorageItem(STORAGE_KEY, [...orders]);
        return orders[idx];
      }
      throw new Error('Draft not found');
    }
  },

  getDrafts: async (): Promise<Order[]> => {
    const all = await orderService.getAll();
    return all.filter((o) => o.status === 'draft');
  },

  getPurchaseHistorySuggestions: async (customerId: string, windowDays: number = 90): Promise<any> => {
    try {
      const res = await apiClient.get(
        `/orders/suggestions/${encodeURIComponent(customerId)}?window_days=${windowDays}`
      );
      return res.data;
    } catch {
      return {
        customerId,
        windowDays,
        items: [],
        groups: [],
      };
    }
  },

  searchProductsForOrder: async (query: string): Promise<any[]> => {
    try {
      const res = await apiClient.get(`/products?search=${encodeURIComponent(query)}`);
      if (Array.isArray(res.data)) {
        return res.data.map((p: any) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          unit: p.unit || 'cái',
          price: Number(p.salePrice || p.price || 0),
          stock: Number(p.stock || 0),
          availableUnits: [p.unit || 'cái', 'hộp', 'thùng'],
          category: p.category,
        }));
      }
    } catch {
      // fallback
    }
    const all = await productService.getAll();
    return all
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase()))
      .map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        unit: p.unit || 'cái',
        price: p.salePrice,
        stock: p.stock,
        availableUnits: [p.unit || 'cái', 'hộp', 'thùng'],
        category: p.category,
      }));
  },

  calculate: async (params: { customer_id: string; items: any[] }): Promise<any> => {
    try {
      const res = await apiClient.post('/orders/calculate', params);
      return res.data;
    } catch {
      const subtotal = params.items.reduce((s, itm) => s + Number(itm.price || 0) * Number(itm.quantity || 1), 0);
      return {
        subtotal,
        discount: 0,
        total: subtotal,
        items: params.items.map((i) => ({
          product_id: i.product_id,
          subtotal: Number(i.price || 0) * Number(i.quantity || 1),
          discount_amount: 0,
        })),
      };
    }
  },
};
