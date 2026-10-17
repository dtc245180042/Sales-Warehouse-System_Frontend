import { initialOrders } from '../mock/orders';
import { initialDeliveryTrips } from '../mock/deliveryTrips';
import { DeliveryTrip } from '../types/Delivery';

export type DeliveryMilestoneKey = 'confirmed' | 'preparing' | 'dispatched' | 'shipping' | 'delivered';

export interface MilestoneStep {
  key: DeliveryMilestoneKey;
  stepNumber: number;
  label: string;
  description: string;
  detail: string;
  status: 'completed' | 'current' | 'upcoming';
  timestamp?: string;
  operator?: string;
  role?: string;
  location?: string;
  note?: string;
}

export interface OrderDeliveryTrackingData {
  orderId: string;
  orderCode: string;
  orderStatus: string;
  createdAt: string;
  expectedDeliveryDate?: string;
  
  // Thông tin giao nhận đại lý
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryNotes?: string;

  // Thông tin chuyến xe & giao vận
  tripCode?: string;
  carrierName?: string;
  driverName?: string;
  driverPhone?: string;
  vehiclePlate?: string;
  warehouseName?: string;
  warehouseAddress?: string;

  // Tiến độ các mốc
  currentMilestoneKey: DeliveryMilestoneKey | 'pending' | 'cancelled';
  progressPercentage: number;
  milestones: MilestoneStep[];
  hasShortDelivery?: boolean;

  // Mặt hàng giao
  items: Array<{
    id: string;
    sku: string;
    name: string;
    quantity: number;
    deliveredQuantity: number;
    delivered_quantity?: number | null;
    is_short_delivered?: boolean;
    short_delivered_quantity?: number;
    shortfall_reason?: string;
    unit: string;
    price: number;
  }>;
}

const MILESTONES_CONFIG: Array<{
  key: DeliveryMilestoneKey;
  stepNumber: number;
  label: string;
  description: string;
  defaultRole: string;
  defaultLocation: string;
}> = [
  {
    key: 'confirmed',
    stepNumber: 1,
    label: 'Đã duyệt',
    description: 'Đơn hàng được xác nhận & chuyển bộ phận kho',
    defaultRole: 'Nhân viên kinh doanh / Quản lý',
    defaultLocation: 'Văn phòng bán hàng',
  },
  {
    key: 'preparing',
    stepNumber: 2,
    label: 'Đang soạn',
    description: 'Kho lập phiếu nhặt hàng & đóng gói kiện',
    defaultRole: 'Bộ phận Kho vận',
    defaultLocation: 'Kho Tổng TP.HCM',
  },
  {
    key: 'dispatched',
    stepNumber: 3,
    label: 'Đã xuất',
    description: 'Hoàn tất phiếu xuất kho & niêm phong kiện hàng',
    defaultRole: 'Thủ kho xuất',
    defaultLocation: 'Kho Tổng TP.HCM',
  },
  {
    key: 'shipping',
    stepNumber: 4,
    label: 'Đang giao',
    description: 'Bàn giao tài xế, đang di chuyển đến địa chỉ đại lý',
    defaultRole: 'Tài xế giao vận',
    defaultLocation: 'Trên tuyến đường giao hàng',
  },
  {
    key: 'delivered',
    stepNumber: 5,
    label: 'Đã giao',
    description: 'Đại lý ký biên bản giao nhận & hoàn tất bàn giao',
    defaultRole: 'Đại lý & Nhân viên giao nhận',
    defaultLocation: 'Điểm giao hàng đại lý',
  },
];

// Helper để tạo các mốc timeline chuẩn dựa trên trạng thái đơn hàng
export const buildMilestones = (
  orderStatus: string,
  baseDate: Date,
  driverName?: string,
  warehouseName?: string
): { currentKey: DeliveryMilestoneKey | 'pending' | 'cancelled'; progress: number; list: MilestoneStep[] } => {
  const normStatus = (orderStatus || '').toLowerCase();

  // Xác định mốc hiện tại
  let currentKey: DeliveryMilestoneKey | 'pending' | 'cancelled' = 'confirmed';
  let activeIndex = 0; // 0: confirmed, 1: preparing, 2: dispatched, 3: shipping, 4: delivered

  if (normStatus === 'draft' || normStatus === 'pending' || normStatus === 'pending_approval') {
    currentKey = 'pending';
    activeIndex = -1;
  } else if (normStatus === 'confirmed' || normStatus === 'approved') {
    currentKey = 'confirmed';
    activeIndex = 0;
  } else if (normStatus === 'preparing' || normStatus === 'picking') {
    currentKey = 'preparing';
    activeIndex = 1;
  } else if (normStatus === 'dispatched' || normStatus === 'ready_to_ship') {
    currentKey = 'dispatched';
    activeIndex = 2;
  } else if (normStatus === 'shipping' || normStatus === 'in_transit') {
    currentKey = 'shipping';
    activeIndex = 3;
  } else if (normStatus === 'completed' || normStatus === 'delivered') {
    currentKey = 'delivered';
    activeIndex = 4;
  } else if (normStatus === 'cancelled') {
    currentKey = 'cancelled';
    activeIndex = 0;
  } else {
    currentKey = 'confirmed';
    activeIndex = 0;
  }

  const list: MilestoneStep[] = MILESTONES_CONFIG.map((cfg, idx) => {
    let status: 'completed' | 'current' | 'upcoming' = 'upcoming';
    if (activeIndex === -1) {
      status = 'upcoming';
    } else if (idx < activeIndex) {
      status = 'completed';
    } else if (idx === activeIndex) {
      status = activeIndex === 4 ? 'completed' : 'current';
    } else {
      status = 'upcoming';
    }

    // Tạo timestamp thực tế
    const stepTime = new Date(baseDate.getTime() + idx * 45 * 60 * 1000);
    const timeFormatted = stepTime.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    let operator = cfg.defaultRole;
    if (cfg.key === 'shipping' && driverName) {
      operator = `Tài xế: ${driverName}`;
    }
    let location = cfg.defaultLocation;
    if (cfg.key === 'preparing' && warehouseName) {
      location = warehouseName;
    }

    let detail = '';
    switch (cfg.key) {
      case 'confirmed':
        detail = 'Đơn hàng hợp lệ, đã xác nhận công nợ và chuyển lệnh xuất kho';
        break;
      case 'preparing':
        detail = 'Nhân viên kho đang phân loại, kiểm đếm và đóng gói sản phẩm';
        break;
      case 'dispatched':
        detail = 'Phiếu xuất kho đã lập, hàng hóa được đóng seal và xếp lên xe tải';
        break;
      case 'shipping':
        detail = 'Tài xế đang di chuyển trên tuyến vận chuyển tới địa chỉ nhận của đại lý';
        break;
      case 'delivered':
        detail = 'Đại lý đã kiểm tra số lượng kiện, đồng kiểm và ký biên bản nhận hàng';
        break;
    }

    return {
      key: cfg.key,
      stepNumber: cfg.stepNumber,
      label: cfg.label,
      description: cfg.description,
      detail,
      status,
      timestamp: status !== 'upcoming' ? timeFormatted : undefined,
      operator,
      location,
    };
  });

  // Tính phần trăm tiến độ
  let progress = 0;
  if (activeIndex >= 0) {
    progress = Math.min(100, Math.round(((activeIndex + (currentKey === 'delivered' ? 1 : 0.5)) / 5) * 100));
  }

  return { currentKey, progress, list };
};

export const deliveryTrackingService = {
  // Lấy dữ liệu theo dõi trạng thái giao hàng của đơn
  getOrderTracking: async (orderIdOrCode: string): Promise<OrderDeliveryTrackingData> => {
    // 1. Tìm đơn trong mock orders
    const matchedOrder = initialOrders.find(
      (o) => o.id === orderIdOrCode || o.code.toLowerCase() === orderIdOrCode.toLowerCase()
    );

    // 2. Tìm chuyến giao trong mock trips
    let matchedTrip: DeliveryTrip | undefined;
    if (matchedOrder) {
      matchedTrip = initialDeliveryTrips.find((t) =>
        t.points.some((p) => p.orderId === matchedOrder.id || p.orderCode === matchedOrder.code)
      );
    } else {
      matchedTrip = initialDeliveryTrips.find((t) =>
        t.points.some((p) => p.orderId === orderIdOrCode || p.orderCode.toLowerCase() === orderIdOrCode.toLowerCase())
      );
    }

    const matchedPoint = matchedTrip?.points.find(
      (p) => p.orderId === orderIdOrCode || p.orderCode.toLowerCase() === orderIdOrCode.toLowerCase()
    );

    // Xây dựng thông tin cơ bản
    const orderId = matchedOrder?.id || matchedPoint?.orderId || orderIdOrCode;
    const orderCode = matchedOrder?.code || matchedPoint?.orderCode || `DH-${orderIdOrCode}`;
    const orderStatus = matchedOrder?.status || (matchedPoint?.status === 'delivered' ? 'completed' : 'shipping');
    const customerName = matchedOrder?.customerName || matchedPoint?.customerName || 'Đại lý Phúc Khang Trading';
    const customerPhone = matchedOrder?.customerPhone || matchedPoint?.customerPhone || '0908 777 888';
    const customerAddress = matchedOrder?.customerAddress || matchedPoint?.address || '128 Đường Lê Lợi, P. Bến Nghé, Quận 1, TP. HCM';
    const deliveryNotes = matchedOrder?.note || matchedPoint?.note || 'Giao giờ hành chính, gọi trước 15 phút';

    const driverName = matchedTrip?.driverName || 'Trần Văn Nam';
    const driverPhone = matchedTrip?.driverPhone || '0908 123 456';
    const vehiclePlate = matchedTrip?.vehiclePlate || '51F-889.23';
    const tripCode = matchedTrip?.code || 'DL-20261017-001';
    const warehouseName = matchedTrip?.warehouseName || 'Kho Tổng TP.HCM (Tân Bình)';

    const baseDate = new Date();
    baseDate.setHours(baseDate.getHours() - 3);

    const { currentKey, progress, list } = buildMilestones(
      orderStatus,
      baseDate,
      driverName,
      warehouseName
    );

    // Danh sách mặt hàng với hỗ trợ trường hợp giao thiếu (SCRUM-696)
    const isShortOrderDemo = orderId === 'ORD-002' || orderCode.includes('002');
    const items = matchedOrder?.items.map((it, idx) => {
      const isShortItem = isShortOrderDemo && idx === 1;
      const shortQty = isShortItem ? 2 : 0;
      const deliveredQty = isShortItem ? Math.max(0, it.quantity - shortQty) : it.quantity;

      return {
        id: it.productId || `item-${idx}`,
        sku: it.sku || `SKU-${idx + 100}`,
        name: it.name,
        quantity: it.quantity,
        deliveredQuantity: deliveredQty,
        delivered_quantity: deliveredQty,
        is_short_delivered: isShortItem,
        short_delivered_quantity: shortQty,
        shortfall_reason: isShortItem ? 'Kho tạm hết hàng, nợ hàng giao bù đợt 2' : undefined,
        unit: it.unit || 'Kiện',
        price: it.price,
      };
    }) || [
      {
        id: 'PRD-001',
        sku: 'IP15P-128-TI',
        name: 'iPhone 15 Pro 128GB Titan Tự Nhiên',
        quantity: 2,
        deliveredQuantity: 2,
        delivered_quantity: 2,
        is_short_delivered: false,
        short_delivered_quantity: 0,
        unit: 'Hộp',
        price: 26990000,
      },
      {
        id: 'PRD-006',
        sku: 'AP-PRO-2-USBC',
        name: 'AirPods Pro 2 USB-C MagSafe Case',
        quantity: 5,
        deliveredQuantity: 3,
        delivered_quantity: 3,
        is_short_delivered: true,
        short_delivered_quantity: 2,
        shortfall_reason: 'Kho tạm hết hàng, nợ hàng giao bù đợt 2',
        unit: 'Hộp',
        price: 5690000,
      },
    ];

    const hasShort = isShortOrderDemo || items.some((it) => it.is_short_delivered);

    return {
      orderId,
      orderCode,
      orderStatus,
      createdAt: matchedOrder?.createdAt || '2026-10-17 07:30',
      expectedDeliveryDate: matchedOrder?.expectedDeliveryDate || '2026-10-17 (Hôm nay)',
      customerName,
      customerPhone,
      customerAddress,
      deliveryNotes,
      tripCode,
      carrierName: 'Đội xe vận chuyển nội bộ OMS Pro',
      driverName,
      driverPhone,
      vehiclePlate,
      warehouseName,
      warehouseAddress: 'Lô B2, KCN Tân Bình, Tây Thạnh, Tân Phú, TP. HCM',
      currentMilestoneKey: currentKey,
      progressPercentage: progress,
      milestones: list,
      hasShortDelivery: hasShort,
      items,
    };
  },

  // Giả lập đại lý xác nhận đã nhận hàng
  confirmDeliveryByDealer: async (orderId: string): Promise<{ success: boolean; message: string }> => {
    // Giả lập delay mạng
    await new Promise((r) => setTimeout(r, 600));
    return {
      success: true,
      message: `Đại lý đã xác nhận nhận hàng thành công cho đơn #${orderId}!`,
    };
  },
};
