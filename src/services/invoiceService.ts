import { ElectronicInvoice, AgentDebtSummary } from '../types/Invoice';
import { formatCurrency } from '../utils/formatters';

export const INITIAL_INVOICES: ElectronicInvoice[] = [
  {
    id: 'INV-202610-001',
    invoiceNumber: '0012485',
    invoiceCode: 'HD-202610-001',
    templateCode: '1/001',
    series: '1K26TBB',
    orderId: 'ORD-101',
    orderCode: 'DH-20261017-01',
    issueDate: '2026-10-05 08:30:00',
    dueDate: '2026-10-25',
    paymentStatus: 'PARTIAL',
    daysRemaining: 8,
    signedDate: '2026-10-05 08:35:12',
    sellerName: 'CÔNG TY CỔ PHẦN PHÂN PHỐI OMS PRO VIỆT NAM',
    sellerTaxCode: '0314889988',
    sellerAddress: 'Tầng 8, Tòa nhà Pearl Plaza, 561A Điện Biên Phủ, Phường 25, Bình Thạnh, TP. HCM',
    sellerPhone: '1900 6868',
    sellerBankAccount: '19036888999018 - Techcombank CN TP.HCM',
    buyerName: 'Nguyễn Quốc Cường',
    buyerUnitName: 'Công Ty TNHH Thương Mại & Dịch Vụ Quốc Cường',
    buyerTaxCode: '0315778899',
    buyerAddress: '128 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. HCM',
    buyerPhone: '0903 112 233',
    paymentMethod: 'Chuyển khoản (Công nợ hạn mức 30 ngày)',
    currency: 'VND',
    subtotal: 25000000,
    taxRate: 10,
    taxAmount: 2500000,
    totalAmount: 27500000,
    paidAmount: 20000000,
    remainingDebt: 7500000,
    amountInWords: 'Hai mươi bảy triệu năm trăm nghìn đồng chẵn',
    status: 'ISSUED',
    lookupCode: 'MTC-202610-QC01',
    taxAuthorityCode: '00E9F230A5B1882',
    digitalSignature: {
      signedBy: 'CÔNG TY CỔ PHẦN PHÂN PHỐI OMS PRO VIỆT NAM',
      organization: 'Tổng Cục Thuế / VNPT-CA',
      signedAt: '2026-10-05T08:35:12Z',
      certificateSerial: '5404B6789C012D',
      isValid: true,
    },
    items: [
      {
        id: 'inv-item-1',
        productId: 'PRD-001',
        productName: 'iPhone 15 Pro 128GB Titan Tự Nhiên',
        sku: 'IP15P-128-TI',
        unit: 'Hộp',
        quantity: 1,
        unitPrice: 25000000,
        taxRate: 10,
        taxAmount: 2500000,
        subtotal: 25000000,
        total: 27500000,
      },
    ],
  },
  {
    id: 'INV-202609-002',
    invoiceNumber: '0012410',
    invoiceCode: 'HD-202609-002',
    templateCode: '1/001',
    series: '1K26TBB',
    orderId: 'ORD-102',
    orderCode: 'DH-20260920-02',
    issueDate: '2026-09-10 09:15:00',
    dueDate: '2026-10-10',
    paymentStatus: 'OVERDUE',
    daysOverdue: 7,
    signedDate: '2026-09-10 09:20:05',
    sellerName: 'CÔNG TY CỔ PHẦN PHÂN PHỐI OMS PRO VIỆT NAM',
    sellerTaxCode: '0314889988',
    sellerAddress: 'Tầng 8, Tòa nhà Pearl Plaza, 561A Điện Biên Phủ, Phường 25, Bình Thạnh, TP. HCM',
    sellerPhone: '1900 6868',
    sellerBankAccount: '19036888999018 - Techcombank CN TP.HCM',
    buyerName: 'Nguyễn Quốc Cường',
    buyerUnitName: 'Công Ty TNHH Thương Mại & Dịch Vụ Quốc Cường',
    buyerTaxCode: '0315778899',
    buyerAddress: '128 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. HCM',
    buyerPhone: '0903 112 233',
    paymentMethod: 'Chuyển khoản (Công nợ hạn mức 30 ngày)',
    currency: 'VND',
    subtotal: 31818182,
    taxRate: 10,
    taxAmount: 3181818,
    totalAmount: 35000000,
    paidAmount: 25000000,
    remainingDebt: 10000000,
    amountInWords: 'Ba mươi lăm triệu đồng chẵn',
    status: 'ISSUED',
    lookupCode: 'MTC-202609-QC02',
    taxAuthorityCode: '00E9F230A5B1993',
    digitalSignature: {
      signedBy: 'CÔNG TY CỔ PHẦN PHÂN PHỐI OMS PRO VIỆT NAM',
      organization: 'Tổng Cục Thuế / Viettel-CA',
      signedAt: '2026-09-10T09:20:05Z',
      certificateSerial: '5404B6789C033E',
      isValid: true,
    },
    items: [
      {
        id: 'inv-item-2',
        productId: 'PRD-003',
        productName: 'MacBook Air 13 inch M3 Midnight 16GB/512GB',
        sku: 'MBA-M3-16-512',
        unit: 'Chiếc',
        quantity: 1,
        unitPrice: 29545455,
        taxRate: 10,
        taxAmount: 2954545,
        subtotal: 29545455,
        total: 32500000,
      },
      {
        id: 'inv-item-3',
        productId: 'PRD-007',
        productName: 'Chuột Không Dây Logitech MX Master 3S',
        sku: 'LOGI-MXM3S-GR',
        unit: 'Cái',
        quantity: 1,
        unitPrice: 2272727,
        taxRate: 10,
        taxAmount: 227273,
        subtotal: 2272727,
        total: 2500000,
      },
    ],
  },
  {
    id: 'INV-202610-003',
    invoiceNumber: '0012487',
    invoiceCode: 'HD-202610-003',
    templateCode: '1/001',
    series: '1K26TBB',
    orderId: 'ORD-103',
    orderCode: 'DH-20261005-04',
    issueDate: '2026-10-01 14:00:00',
    dueDate: '2026-10-20',
    paymentStatus: 'PENDING',
    daysRemaining: 3,
    signedDate: '2026-10-01 14:05:00',
    sellerName: 'CÔNG TY CỔ PHẦN PHÂN PHỐI OMS PRO VIỆT NAM',
    sellerTaxCode: '0314889988',
    sellerAddress: 'Tầng 8, Tòa nhà Pearl Plaza, 561A Điện Biên Phủ, Phường 25, Bình Thạnh, TP. HCM',
    sellerPhone: '1900 6868',
    sellerBankAccount: '19036888999018 - Techcombank CN TP.HCM',
    buyerName: 'Nguyễn Quốc Cường',
    buyerUnitName: 'Công Ty TNHH Thương Mại & Dịch Vụ Quốc Cường',
    buyerTaxCode: '0315778899',
    buyerAddress: '128 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. HCM',
    buyerPhone: '0903 112 233',
    paymentMethod: 'Chuyển khoản (Công nợ hạn mức 30 ngày)',
    currency: 'VND',
    subtotal: 16363636,
    taxRate: 10,
    taxAmount: 1636364,
    totalAmount: 18000000,
    paidAmount: 0,
    remainingDebt: 18000000,
    amountInWords: 'Mười tám triệu đồng chẵn',
    status: 'ISSUED',
    lookupCode: 'MTC-202610-QC03',
    taxAuthorityCode: '00E9F230A5B2011',
    digitalSignature: {
      signedBy: 'CÔNG TY CỔ PHẦN PHÂN PHỐI OMS PRO VIỆT NAM',
      organization: 'Tổng Cục Thuế / VNPT-CA',
      signedAt: '2026-10-01T14:05:00Z',
      certificateSerial: '5404B6789C055A',
      isValid: true,
    },
    items: [
      {
        id: 'inv-item-4',
        productId: 'PRD-011',
        productName: 'Màn Hình LG UltraGear 27GP850-B 2K 165Hz',
        sku: 'LG-27GP850-B',
        unit: 'Chiếc',
        quantity: 2,
        unitPrice: 8181818,
        taxRate: 10,
        taxAmount: 1636364,
        subtotal: 16363636,
        total: 18000000,
      },
    ],
  },
  {
    id: 'INV-202609-004',
    invoiceNumber: '0012350',
    invoiceCode: 'HD-202609-004',
    templateCode: '1/001',
    series: '1K26TBB',
    orderId: 'ORD-104',
    orderCode: 'DH-20260928-09',
    issueDate: '2026-09-28 11:20:00',
    dueDate: '2026-10-28',
    paymentStatus: 'PARTIAL',
    daysRemaining: 11,
    signedDate: '2026-09-28 11:25:30',
    sellerName: 'CÔNG TY CỔ PHẦN PHÂN PHỐI OMS PRO VIỆT NAM',
    sellerTaxCode: '0314889988',
    sellerAddress: 'Tầng 8, Tòa nhà Pearl Plaza, 561A Điện Biên Phủ, Phường 25, Bình Thạnh, TP. HCM',
    sellerPhone: '1900 6868',
    sellerBankAccount: '19036888999018 - Techcombank CN TP.HCM',
    buyerName: 'Nguyễn Quốc Cường',
    buyerUnitName: 'Công Ty TNHH Thương Mại & Dịch Vụ Quốc Cường',
    buyerTaxCode: '0315778899',
    buyerAddress: '128 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. HCM',
    buyerPhone: '0903 112 233',
    paymentMethod: 'Chuyển khoản (Công nợ hạn mức 30 ngày)',
    currency: 'VND',
    subtotal: 21818182,
    taxRate: 10,
    taxAmount: 2181818,
    totalAmount: 24000000,
    paidAmount: 14300000,
    remainingDebt: 9700000,
    amountInWords: 'Hai mươi bốn triệu đồng chẵn',
    status: 'ISSUED',
    lookupCode: 'MTC-202609-QC04',
    taxAuthorityCode: '00E9F230A5B2088',
    digitalSignature: {
      signedBy: 'CÔNG TY CỔ PHẦN PHÂN PHỐI OMS PRO VIỆT NAM',
      organization: 'Tổng Cục Thuế / VNPT-CA',
      signedAt: '2026-09-28T11:25:30Z',
      certificateSerial: '5404B6789C066B',
      isValid: true,
    },
    items: [
      {
        id: 'inv-item-5',
        productId: 'PRD-020',
        productName: 'Bàn Phím Cơ Keychron K2 Pro Không Dây',
        sku: 'KIE-KEY-K2P-RGB',
        unit: 'Chiếc',
        quantity: 8,
        unitPrice: 2727273,
        taxRate: 10,
        taxAmount: 2181818,
        subtotal: 21818182,
        total: 24000000,
      },
    ],
  },
  {
    id: 'INV-202610-005',
    invoiceNumber: '0012488',
    invoiceCode: 'HD-202610-005',
    templateCode: '1/001',
    series: '1K26TBB',
    orderId: 'ORD-105',
    orderCode: 'DH-20261002-01',
    issueDate: '2026-10-02 16:30:00',
    dueDate: '2026-10-12',
    paymentStatus: 'PAID',
    signedDate: '2026-10-02 16:35:00',
    sellerName: 'CÔNG TY CỔ PHẦN PHÂN PHỐI OMS PRO VIỆT NAM',
    sellerTaxCode: '0314889988',
    sellerAddress: 'Tầng 8, Tòa nhà Pearl Plaza, 561A Điện Biên Phủ, Phường 25, Bình Thạnh, TP. HCM',
    sellerPhone: '1900 6868',
    sellerBankAccount: '19036888999018 - Techcombank CN TP.HCM',
    buyerName: 'Nguyễn Quốc Cường',
    buyerUnitName: 'Công Ty TNHH Thương Mại & Dịch Vụ Quốc Cường',
    buyerTaxCode: '0315778899',
    buyerAddress: '128 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. HCM',
    buyerPhone: '0903 112 233',
    paymentMethod: 'Chuyển khoản (Đã tất toán)',
    currency: 'VND',
    subtotal: 10909091,
    taxRate: 10,
    taxAmount: 1090909,
    totalAmount: 12000000,
    paidAmount: 12000000,
    remainingDebt: 0,
    amountInWords: 'Mười hai triệu đồng chẵn',
    status: 'ISSUED',
    lookupCode: 'MTC-202610-QC05',
    taxAuthorityCode: '00E9F230A5B2099',
    digitalSignature: {
      signedBy: 'CÔNG TY CỔ PHẦN PHÂN PHỐI OMS PRO VIỆT NAM',
      organization: 'Tổng Cục Thuế / Viettel-CA',
      signedAt: '2026-10-02T16:35:00Z',
      certificateSerial: '5404B6789C077C',
      isValid: true,
    },
    items: [
      {
        id: 'inv-item-6',
        productId: 'PRD-030',
        productName: 'Tai Nghe Apple AirPods Pro Gen 2 Type-C',
        sku: 'APP-AIRPODS-PRO2',
        unit: 'Chiếc',
        quantity: 2,
        unitPrice: 5454545,
        taxRate: 10,
        taxAmount: 1090909,
        subtotal: 10909091,
        total: 12000000,
      },
    ],
  },
];

export const invoiceService = {
  // Lấy tất cả hoá đơn đã phát hành
  getAllInvoices: (): ElectronicInvoice[] => {
    return INITIAL_INVOICES;
  },

  // Tổng hợp công nợ và hạn mức của đại lý (SCRUM-757)
  getAgentDebtSummary: (): AgentDebtSummary => {
    const invoices = INITIAL_INVOICES;
    const creditLimit = 100000000; // 100 triệu hạn mức
    
    let totalDebt = 0;
    let overdueDebt = 0;
    let inDueDebt = 0;
    let overdueCount = 0;
    let pendingCount = 0;
    let earliestDueDate = '';

    invoices.forEach((inv) => {
      const debt = inv.remainingDebt || 0;
      if (debt > 0) {
        totalDebt += debt;
        if (inv.paymentStatus === 'OVERDUE') {
          overdueDebt += debt;
          overdueCount++;
        } else {
          inDueDebt += debt;
          pendingCount++;
          if (inv.dueDate && (!earliestDueDate || inv.dueDate < earliestDueDate)) {
            earliestDueDate = inv.dueDate;
          }
        }
      }
    });

    const availableCredit = Math.max(0, creditLimit - totalDebt);
    const utilizationRate = Math.round((totalDebt / creditLimit) * 1000) / 10;

    return {
      creditLimit,
      totalDebt,
      availableCredit,
      inDueDebt,
      overdueDebt,
      utilizationRate,
      maxDebtDays: 30,
      earliestDueDate: earliestDueDate || '2026-10-20',
      overdueCount,
      pendingCount,
    };
  },

  // Tìm hoá đơn theo mã đơn hàng hoặc mã hoá đơn
  getInvoiceByOrderOrCode: (orderIdOrCode: string): ElectronicInvoice => {
    const normalized = orderIdOrCode.trim().toLowerCase();
    const matched = INITIAL_INVOICES.find(
      (inv) =>
        inv.orderId.toLowerCase() === normalized ||
        inv.orderCode.toLowerCase() === normalized ||
        inv.invoiceCode.toLowerCase() === normalized ||
        inv.invoiceNumber.toLowerCase() === normalized ||
        inv.id.toLowerCase() === normalized
    );

    if (matched) return matched;

    // Sinh tự động hoá đơn hợp lệ nếu không có sẵn trong mock
    const cleanCode = orderIdOrCode.replace(/[^a-zA-Z0-9-]/g, '');
    return {
      id: `INV-${cleanCode}`,
      invoiceNumber: `00${Math.floor(10000 + Math.random() * 90000)}`,
      invoiceCode: `HD-${cleanCode}`,
      templateCode: '1/001',
      series: '1K26TBB',
      orderId: orderIdOrCode,
      orderCode: orderIdOrCode,
      issueDate: '2026-10-10 10:00:00',
      dueDate: '2026-10-25',
      paymentStatus: 'PARTIAL',
      daysRemaining: 8,
      signedDate: '2026-10-10 10:05:00',
      sellerName: 'CÔNG TY CỔ PHẦN PHÂN PHỐI OMS PRO VIỆT NAM',
      sellerTaxCode: '0314889988',
      sellerAddress: 'Tầng 8, Tòa nhà Pearl Plaza, 561A Điện Biên Phủ, Phường 25, Bình Thạnh, TP. HCM',
      sellerPhone: '1900 6868',
      sellerBankAccount: '19036888999018 - Techcombank CN TP.HCM',
      buyerName: 'Nguyễn Quốc Cường',
      buyerUnitName: 'Công Ty TNHH Thương Mại & Dịch Vụ Quốc Cường',
      buyerTaxCode: '0315778899',
      buyerAddress: '128 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. HCM',
      buyerPhone: '0903 112 233',
      paymentMethod: 'Chuyển khoản (Công nợ hạn mức 30 ngày)',
      currency: 'VND',
      subtotal: 18181818,
      taxRate: 10,
      taxAmount: 1818182,
      totalAmount: 20000000,
      paidAmount: 15000000,
      remainingDebt: 5000000,
      amountInWords: 'Hai mươi triệu đồng chẵn',
      status: 'ISSUED',
      lookupCode: `MTC-${cleanCode}`,
      taxAuthorityCode: `00E9F230A5B${Math.floor(1000 + Math.random() * 9000)}`,
      digitalSignature: {
        signedBy: 'CÔNG TY CỔ PHẦN PHÂN PHỐI OMS PRO VIỆT NAM',
        organization: 'Tổng Cục Thuế / VNPT-CA',
        signedAt: new Date().toISOString(),
        certificateSerial: '5404B6789C888A',
        isValid: true,
      },
      items: [
        {
          id: 'item-gen-1',
          productId: 'PRD-001',
          productName: 'Mặt hàng theo đơn #' + orderIdOrCode,
          sku: 'SKU-OMS-2026',
          unit: 'Kiện',
          quantity: 1,
          unitPrice: 18181818,
          taxRate: 10,
          taxAmount: 1818182,
          subtotal: 18181818,
          total: 20000000,
        },
      ],
    };
  },

  // Tải lại hoá đơn PDF điện tử theo mẫu song ngữ Hóa Đơn - Phiếu Thu Tiền Cước Vận Chuyển
  downloadInvoicePdf: (invoice: ElectronicInvoice) => {
    const isBank = (invoice.paymentMethod || '').toLowerCase().includes('chuyển khoản');
    const dateFormatted = invoice.issueDate ? invoice.issueDate.split(' ')[0] : '10/05/2026';
    const clean = (val: number) => formatCurrency(val).replace(' ₫', '').replace(' đ', '');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Hóa Đơn - Phiếu Thu Tiền Cước Vận Chuyển ${invoice.invoiceNumber || '0091829'}</title>
        <style>
          body { font-family: "Times New Roman", Times, serif; padding: 30px 40px; color: #000; font-size: 13px; line-height: 1.45; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          .header-table td { vertical-align: top; }
          .logo-text { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; color: #dc2626; text-transform: uppercase; }
          .title { text-align: center; margin: 15px 0 10px 0; }
          .title h2 { font-size: 17px; font-weight: bold; margin: 0; text-transform: uppercase; }
          .title h3 { font-size: 14px; font-weight: bold; margin: 2px 0; text-transform: uppercase; }
          .title p { font-size: 12px; font-style: italic; margin: 2px 0; }
          .info-sec { margin: 8px 0; font-size: 13px; }
          .table-items { width: 100%; border-collapse: collapse; margin: 10px 0; border: 1px solid #444; }
          .table-items th, .table-items td { border: 1px solid #555; padding: 6px 8px; font-size: 12px; }
          .table-items th { background: #f9f9f9; text-align: center; font-weight: bold; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .font-sans { font-family: Arial, sans-serif; }
          .line-solid { border-top: 2px solid #000; margin: 12px 0; }
          .sum-row { display: flex; justify-content: space-between; align-items: center; margin: 4px 0; font-size: 13px; }
          .sign-table { width: 100%; margin-top: 25px; text-align: center; }
          .sign-table td { width: 50%; vertical-align: top; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="width: 60%;">
              <div class="logo-text">TRƯỜNG NAM LOGISTICS</div>
              <div style="font-size: 11px; font-family: Arial, sans-serif; margin-bottom: 6px;">VietNam Airlines Cargo / OMS Pro</div>
              <div><b>Nơi xuất vé (Issuing Office):</b> ${invoice.sellerName || 'CTY CP EN VIET'}</div>
              <div><b>Địa chỉ (Address):</b> ${invoice.sellerAddress || '69B Nguyen Huu Dat, P. Tay Thanh, Q. Tan Phu, TP.HCM'}</div>
            </td>
            <td style="width: 40%; text-align: right;">
              <div><b>Mẫu số (Form No):</b> <span class="font-sans">${invoice.templateCode || '01GTKT3/004'}</span></div>
              <div><b>Ký hiệu (Serial):</b> <span class="font-sans">${invoice.series || 'HK/11T'}</span></div>
              <div><b>Số hóa đơn (Invoice No):</b> <b class="font-sans" style="font-size: 14px; color: #dc2626;">${invoice.invoiceNumber || '0091829'}</b></div>
            </td>
          </tr>
        </table>

        <div class="title">
          <h2>HÓA ĐƠN - PHIẾU THU TIỀN CƯỚC VẬN CHUYỂN</h2>
          <h3>(SALES INVOICE / RECEIPT)</h3>
          <p>Liên 2 : Giao cho khách ( Copy 2 for Customer )</p>
        </div>

        <div class="info-sec" style="border-top: 1px solid #ccc; padding-top: 6px;">
          <div><b>Tổng công ty Hàng không Việt Nam ( Vietnam Airlines ) / Đơn vị cung ứng:</b> ${invoice.sellerName}</div>
          <div><b>Mã số thuế (Vat Code) :</b> <span class="font-sans"><b>${invoice.sellerTaxCode}</b></span></div>
        </div>

        <div class="info-sec">
          <div><b>Tên khách hàng (Customer):</b> <b style="text-transform: uppercase;">${invoice.buyerUnitName || invoice.buyerName}</b></div>
          <div><b>Mã số thuế (VAT Code):</b> <span class="font-sans"><b>${invoice.buyerTaxCode}</b></span></div>
          <div><b>Địa chỉ (Address):</b> ${invoice.buyerAddress}</div>
        </div>

        <div style="margin-top: 10px;">
          <div><b>1. Tiền vé ( Due to VietNam Airlines ) / Tiền cước:</b></div>
          <div style="padding-left: 15px;"><b>1.1 Giá cước ( Air fare ):</b></div>

          <table class="table-items">
            <thead>
              <tr>
                <th>Số vé<br><span style="font-weight: normal; font-style: italic; font-size: 11px;">(Ticket No)</span></th>
                <th>Hành trình / Diễn giải<br><span style="font-weight: normal; font-style: italic; font-size: 11px;">(Route)</span></th>
                <th style="width: 60px;">Số lượng<br><span style="font-weight: normal; font-style: italic; font-size: 11px;">(Quantity)</span></th>
                <th style="width: 90px;">Đơn giá<br><span style="font-weight: normal; font-style: italic; font-size: 11px;">(Unit price)</span></th>
                <th style="width: 100px;">Thành tiền<br><span style="font-weight: normal; font-style: italic; font-size: 11px;">(Amount)</span></th>
                <th style="width: 65px;">Loại tiền<br><span style="font-weight: normal; font-style: italic; font-size: 11px;">(Currency)</span></th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items
                .map(
                  (it, idx) => `
                <tr>
                  <td class="text-center font-sans">${it.sku || it.productId || `738242056749${idx}`}</td>
                  <td><b>${it.productName}</b></td>
                  <td class="text-center font-sans"><b>${it.quantity}</b></td>
                  <td class="text-right font-sans">${clean(it.unitPrice)}</td>
                  <td class="text-right font-sans"><b>${clean(it.subtotal)}</b></td>
                  <td class="text-center font-sans">VND</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div style="display: flex; justify-content: space-between; padding-left: 15px; margin: 4px 0;">
            <div><b>1.2 Thuế GTGT (Value Added Tax) (${invoice.taxRate}%):</b></div>
            <div class="font-sans" style="font-weight: bold; width: 170px; text-align: right;">${clean(invoice.taxAmount)} VND</div>
          </div>

          <div style="padding-left: 15px; margin: 4px 0;">
            <div style="display: flex; justify-content: space-between;">
              <div><b>1.3 Thuế Phí khác (Other Tax charge):</b></div>
              <div class="font-sans" style="font-weight: bold; width: 170px; text-align: right;">0 VND</div>
            </div>
            <div style="padding-left: 20px; font-size: 12px; color: #333;">
              <div>Thuế khác (Other Tax):</div>
              <div>Phí khác (Other charge):</div>
              <div>Hoa hồng (Commission):</div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; padding-left: 15px; margin-top: 6px; border-top: 1px solid #ccc; padding-top: 4px; font-weight: bold;">
            <div>1.4 Tổng tiền vé (1.1 + 1.2 + 1.3):</div>
            <div class="font-sans" style="width: 170px; text-align: right;">${clean(invoice.totalAmount)} VND</div>
          </div>
        </div>

        <div class="line-solid"></div>

        <div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px;">
            <div>Tổng số tiền thanh toán (Equivalent amount paid):</div>
            <div style="display: flex; gap: 30px;">
              <div style="text-align: center; font-size: 11px;">Tỷ giá<br><b>1</b></div>
              <div class="font-sans" style="font-size: 15px; width: 170px; text-align: right;">${clean(invoice.totalAmount)} VND</div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; margin-top: 6px;">
            <div><b>Hình thức thanh toán (Form of payment):</b></div>
            <div style="display: flex; gap: 30px;">
              <div class="font-sans" style="font-weight: bold;">${isBank ? 'BANK TRANSFER' : 'CASH'}</div>
              <div class="font-sans" style="font-weight: bold; width: 170px; text-align: right;">${clean(invoice.totalAmount)} VND</div>
            </div>
          </div>

          <div style="font-style: italic; font-size: 12px; margin-top: 6px;">
            (Số tiền viết bằng chữ: ${invoice.amountInWords})
          </div>
        </div>

        <div style="font-style: italic; font-size: 11.5px; color: #444; margin-top: 15px;">
          Đề nghị quý khách kiểm tra kỹ trước khi rời quầy thu (Please kindly check before leaving)
        </div>

        <div style="text-align: right; margin-top: 15px;">
          <b>Ngày (Date) :</b> ${dateFormatted}
        </div>

        <table class="sign-table">
          <tr>
            <td>
              <b>Khách hàng</b><br>
              <i>(Customer)</i><br>
              <span style="font-size: 11px; color: #777;">(Ký, ghi rõ họ tên)</span>
              <div style="height: 60px;"></div>
              <b style="text-transform: uppercase;">${invoice.buyerUnitName || invoice.buyerName}</b>
            </td>
            <td>
              <b>Người bán hàng</b><br>
              <i>(Salesperson)</i><br>
              <span style="font-size: 11px; color: #777;">(Ký, ghi rõ họ tên)</span>
              <div style="height: 60px;"></div>
              <b style="text-transform: uppercase;">${invoice.digitalSignature?.signedBy || 'NGUYEN THI PHUONG MAI'}</b>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HoaDonCangVan_${invoice.invoiceNumber || '0091829'}_${invoice.series || 'HK11T'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // In hoá đơn trực tiếp theo chuẩn song ngữ
  printInvoice: (invoice: ElectronicInvoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Vui lòng cho phép popup để in. Hãy bấm nút "Tải file hoá đơn" để tải về rồi in.');
      return;
    }

    const isBank = (invoice.paymentMethod || '').toLowerCase().includes('chuyển khoản');
    const dateFormatted = invoice.issueDate ? invoice.issueDate.split(' ')[0] : '10/05/2026';
    const clean = (val: number) => formatCurrency(val).replace(' ₫', '').replace(' đ', '');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>In Hoá Đơn - Phiếu Thu Tiền Cước Vận Chuyển ${invoice.invoiceNumber || '0091829'}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: "Times New Roman", Times, serif; padding: 20px 32px; color: #000; font-size: 13px; line-height: 1.5; margin: 0; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          .header-table td { vertical-align: top; }
          .logo-text { font-family: Arial, sans-serif; font-size: 15px; font-weight: bold; color: #c00; text-transform: uppercase; letter-spacing: 0.5px; }
          .title-block { text-align: center; padding: 8px 0; margin: 8px 0; }
          .title-block h2 { font-size: 16px; font-weight: bold; margin: 0 0 2px 0; text-transform: uppercase; letter-spacing: 0.5px; }
          .title-block h3 { font-size: 13px; font-weight: bold; margin: 0 0 2px 0; }
          .title-block p { font-size: 12px; font-style: italic; margin: 0; }
          .info-block { font-size: 13px; margin: 5px 0; }
          .items-table { width: 100%; border-collapse: collapse; margin: 6px 0; }
          .items-table th { border: 1px solid #333; padding: 5px 6px; font-size: 12px; text-align: center; font-weight: bold; background: #f5f5f5; vertical-align: bottom; }
          .items-table td { border: 1px solid #555; padding: 5px 6px; font-size: 12px; vertical-align: middle; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .sans { font-family: Arial, sans-serif; }
          .sep-line { border: none; border-top: 2px solid #000; margin: 10px 0; }
          .sign-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .sign-table td { width: 50%; text-align: center; vertical-align: top; padding-top: 4px; }
          .totals-row { display: flex; justify-content: space-between; align-items: baseline; margin: 3px 0; font-size: 13px; }
          .totals-nums { display: flex; align-items: baseline; gap: 0; }
          .num-amt { width: 105px; text-align: right; font-family: Arial, sans-serif; font-weight: bold; }
          .num-cur { width: 40px; text-align: center; font-family: Arial, sans-serif; padding-left: 4px; }
          @media print {
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 12px; text-align: right;">
          <button onclick="window.print()" style="padding: 5px 16px; font-weight: bold; background: #c00; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-family: Arial, sans-serif;">
            🖨️ In Hoá Đơn Này
          </button>
        </div>

        <!-- HEADER -->
        <table class="header-table">
          <tr>
            <td style="width: 58%;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <div style="width:34px;height:34px;border-radius:50%;background:#c00;color:#fff;display:flex;align-items:center;justify-content:center;font-family:Arial;font-weight:bold;font-size:10px;flex-shrink:0;">TN</div>
                <div>
                  <div class="logo-text">TRƯỜNG NAM LOGISTICS</div>
                  <div style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#555;">Vietnam Airlines</div>
                </div>
              </div>
              <div><b>Nơi xuất vé (Issuing Office):</b> ${invoice.sellerName || 'CTY CP EN VIET'}</div>
              <div style="margin-top:2px;"><b>Địa chỉ (Address):</b> ${invoice.sellerAddress || '69B Nguyen Huu Dat, P. Tay Thanh, Q. Tan Phu, TP.HCM'}</div>
            </td>
            <td style="width: 42%; text-align: right; vertical-align: bottom; padding-bottom: 3px;">
              <div><b>Mẫu số (Form No):</b> ${invoice.templateCode || '01GTKT3/004'}</div>
              <div><b>Ký hiệu (Serial):</b> ${invoice.series || 'HK/11T'}</div>
              <div><b>Số hóa đơn (Invoice No):</b> <b style="font-size:14px;">${invoice.invoiceNumber || '0091829'}</b></div>
            </td>
          </tr>
        </table>

        <!-- TITLE -->
        <div class="title-block" style="border-top:1px solid #999;border-bottom:1px solid #999;margin:8px 0;padding:6px 0;">
          <h2>HÓA ĐƠN - PHIẾU THU TIỀN CƯỚC VẬN CHUYỂN</h2>
          <h3>(SALES INVOICE / RECEIPT)</h3>
          <p>Liên 2 : Giao cho khách ( Copy 2 for Customer )</p>
        </div>

        <!-- SELLER -->
        <div class="info-block">
          <div>Tổng công ty Hàng không Việt Nam ( Vietnam Airlines )</div>
          <div><b>Mã số thuế (Vat Code) :</b> ${invoice.sellerTaxCode}</div>
        </div>
        <!-- BUYER -->
        <div class="info-block" style="margin-top:6px;">
          <div><b>Tên khách hàng (Customer):</b><b style="text-transform:uppercase;"> ${invoice.buyerUnitName || invoice.buyerName}</b></div>
          <div><b>Mã số thuế (VAT Code):</b> ${invoice.buyerTaxCode}</div>
          <div><b>Địa chỉ (Address):</b>${invoice.buyerAddress}</div>
        </div>

        <!-- ITEMS SECTION -->
        <div style="margin-top:8px;">
          <div><b>1. Tiền vé ( Due to VietNam Airlines ):</b></div>
          <div style="margin-left:15px;margin-top:2px;">1.1 Giá cước ( Air fare ):</div>
          <table class="items-table">
            <thead>
              <tr>
                <th>Số vé<br><i style="font-weight:normal;font-size:11px;">(Ticket No)</i></th>
                <th>Hành trình<br><i style="font-weight:normal;font-size:11px;">(Route)</i></th>
                <th style="width:52px;">Số lượng<br><i style="font-weight:normal;font-size:11px;">(Quantity)</i></th>
                <th style="width:88px;text-align:right;">Đơn giá<br><i style="font-weight:normal;font-size:11px;">(Unit price)</i></th>
                <th style="width:95px;text-align:right;">Thành tiền<br><i style="font-weight:normal;font-size:11px;">(Amount)</i></th>
                <th style="width:55px;">Loại tiền<br><i style="font-weight:normal;font-size:11px;">(Currency)</i></th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((it, idx) => `
                <tr>
                  <td class="text-center sans" style="font-size:11.5px;">${it.sku || `7382420567${idx}`}</td>
                  <td>${it.productName}</td>
                  <td class="text-center sans">${it.quantity}</td>
                  <td class="text-right sans">${clean(it.unitPrice)}</td>
                  <td class="text-right sans"><b>${clean(it.subtotal)}</b></td>
                  <td class="text-center sans">VND</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <!-- 1.2 VAT -->
          <div class="totals-row" style="margin-left:15px;">
            <div>1.2 Thuế GTGT (Value Added Tax)</div>
            <div class="totals-nums"><div class="num-amt">${clean(invoice.taxAmount)}</div><div class="num-cur">VND</div></div>
          </div>
          <!-- 1.3 Other -->
          <div style="margin-left:15px;">
            <div class="totals-row">
              <div>1.3 Thuế Phí khác (Other Tax charge):</div>
              <div class="totals-nums"><div class="num-amt">0</div><div class="num-cur">VND</div></div>
            </div>
            <div style="margin-left:20px;font-size:12px;">
              <div>Thuế khác (Other Tax):</div>
              <div>Phí khác (Other charge):</div>
              <div>Hoa hồng (Commission):</div>
            </div>
          </div>
          <!-- 1.4 Subtotal -->
          <div class="totals-row" style="margin-left:15px;border-top:1px solid #999;padding-top:3px;margin-top:4px;font-weight:bold;">
            <div>1.4 Tổng tiền vé (1.1+1.2 +1.3):</div>
            <div class="totals-nums"><div class="num-amt">${clean(invoice.totalAmount)}</div><div class="num-cur">VND</div></div>
          </div>
        </div>

        <hr class="sep-line">

        <!-- PAYMENT TOTALS -->
        <div>
          <!-- Tổng số tiền + Tỷ giá -->
          <div style="display:flex;justify-content:space-between;align-items:baseline;font-weight:bold;">
            <div><b>Tổng số tiền thanh toán (Equivalent amount paid):</b></div>
            <div style="display:flex;align-items:baseline;gap:16px;">
              <div style="text-align:center;font-family:Arial,sans-serif;font-size:12px;">Tỷ giá<br><b style="font-size:13px;">1</b></div>
              <div class="totals-nums"><div class="num-amt" style="font-size:14px;">${clean(invoice.totalAmount)}</div><div class="num-cur">VND</div></div>
            </div>
          </div>

          <!-- Hình thức thanh toán -->
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:8px;">
            <div>Hình thức thanh toán (Form of payment):</div>
            <div style="display:flex;align-items:baseline;gap:16px;">
              <div class="sans" style="font-weight:bold;font-size:12px;">${isBank ? 'BANK TRANSFER' : 'CASH'}</div>
              <div class="totals-nums"><div class="num-amt">${clean(invoice.totalAmount)}</div><div class="num-cur">VND</div></div>
            </div>
          </div>

          <div style="font-style:italic;font-size:12px;margin-top:5px;color:#333;">(Số tiền viết bằng chữ: ${invoice.amountInWords})</div>
        </div>

        <!-- ADVICE -->
        <div style="font-style:italic;font-size:12px;color:#444;margin-top:14px;border-top:1px dashed #bbb;padding-top:5px;">Đề nghị quý khách kiểm tra kỹ trước khi rời quầy thu (Please kindly check before leaving)</div>

        <!-- DATE -->
        <div style="text-align:right;margin-top:12px;"><b>Ngày (Date) :</b> ${dateFormatted}</div>

        <!-- SIGNATURES -->
        <table class="sign-table">
          <tr>
            <td>
              <b>Khách hàng</b><br><i style="font-size:12px;">(Customer)</i>
              <div style="height:75px;"></div>
              <div style="font-size:12px;text-transform:uppercase;max-width:200px;margin:0 auto;word-break:break-word;line-height:1.4;">${(invoice.buyerUnitName || invoice.buyerName)}</div>
            </td>
            <td>
              <b>Người bán hàng</b><br><i style="font-size:12px;">(Salesperson)</i>
              <div style="height:75px;"></div>
              <div style="font-size:12px;text-transform:uppercase;font-weight:bold;">${invoice.digitalSignature?.signedBy || 'NGUYEN THI PHUONG MAI'}</div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      try {
        printWindow.print();
      } catch {
        // Fallback if browser blocks automatic print trigger
      }
    }, 250);
  },
};
