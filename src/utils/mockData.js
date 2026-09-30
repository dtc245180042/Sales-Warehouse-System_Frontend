export const MOCK_PRODUCTS = [
  { id: '1', sku: 'SKU-BIA-SG-SPEC', name: 'Bia Sài Gòn Special Lon 330ml', pack: '24 lon / thùng (4 lốc x 6 lon)', unit: 'Lon', price: 15000, status: 'Có sẵn' },
  { id: '2', sku: 'SKU-CHOCOPIE-OR', name: 'Bánh Chocopie Orion Hộp 12 Cái', pack: '8 hộp / thùng', unit: 'Hộp', price: 55000, status: 'Có sẵn' },
  { id: '3', sku: 'SKU-LAVIE-500', name: 'Nước khoáng thiên nhiên Lavie Chai 500ml', pack: '24 chai / thùng', unit: 'Chai', price: 6000, status: 'Có sẵn' },
  { id: '4', sku: 'SKU-STING-DAU', name: 'Nước tăng lực Sting Dâu Chai 330ml', pack: '24 chai / thùng', unit: 'Chai', price: 10000, status: 'Có sẵn' },
  { id: '5', sku: 'SKU-SUA-VNM-180', name: 'Sữa tươi tiệt trùng Vinamilk Có đường 180ml', pack: '48 hộp / thùng (12 lốc x 4 hộp)', unit: 'Hộp', price: 8500, status: 'Có sẵn' },
];

export const MOCK_ACCOUNTS = [
  { fullName: 'Trần Quản Trị Hệ Thống', username: 'admin', password: 'Admin@1234', email: 'admin@warehouse.local', phone: '0901234567', role: 'admin', roleTitle: 'Quản trị viên (Admin)', createdAt: '01/01/2026', warehouse: null },
  { fullName: 'Nguyễn Văn Giám Đốc Kinh Doanh', username: 'sales_mgr', password: 'SalesMgr@1234', email: 'sales_mgr@warehouse.local', phone: '0902345678', role: 'sales_mgr', roleTitle: 'Quản lý kinh doanh (Sales Manager)', createdAt: '10/01/2026', warehouse: null },
  { fullName: 'Lê Thị Nhân Viên Kinh Doanh', username: 'sales_rep', password: 'SalesRep@1234', email: 'sales_rep@warehouse.local', phone: '0903456789', role: 'sales_rep', roleTitle: 'Nhân viên kinh doanh (Sales Rep)', createdAt: '15/01/2026', warehouse: null, assignedAgencies: ['Công ty TNHH Tuấn Phương', 'Đại lý Minh Phát', 'Đại lý Hồng Hà'] },
  { fullName: 'Phạm Văn Trưởng Kho', username: 'wh_mgr', password: 'WhMgr@1234', email: 'wh_mgr@warehouse.local', phone: '0904567890', role: 'wh_mgr', roleTitle: 'Quản lý kho (WH Manager)', createdAt: '20/01/2026', warehouse: 'Kho Tổng Hà Nội' },
  { fullName: 'Hoàng Văn Thủ Kho', username: 'warehouse', password: 'Warehouse@1234', email: 'warehouse@warehouse.local', phone: '0905678901', role: 'warehouse', roleTitle: 'Thủ kho (Warehouse Staff)', createdAt: '25/01/2026', warehouse: 'Kho Đà Nẵng' },
  { fullName: 'Đỗ Thị Kế Toán Trưởng', username: 'accountant', password: 'Accountant@1234', email: 'accountant@warehouse.local', phone: '0906789012', role: 'accountant', roleTitle: 'Kế toán (Accountant)', createdAt: '01/02/2026', warehouse: null },
  { fullName: 'Công ty TNHH Đại Lý Tuấn Phương', username: 'customer', password: 'Customer@1234', email: 'customer@warehouse.local', phone: '0907890123', role: 'customer', roleTitle: 'Đại lý cấp 1 (Customer)', createdAt: '10/02/2026', warehouse: null }
];

export const MOCK_FINANCIAL_MARGINS = [
  { sku: 'SKU-BIA-SG-SPEC', name: 'Bia Sài Gòn Special Lon 330ml', costPrice: 11500, salePrice: 15000, margin: '23.3%' },
  { sku: 'SKU-CHOCOPIE-OR', name: 'Bánh Chocopie Orion Hộp 12 Cái', costPrice: 42000, salePrice: 55000, margin: '23.6%' },
  { sku: 'SKU-LAVIE-500', name: 'Nước khoáng Lavie Chai 500ml', costPrice: 4200, salePrice: 6000, margin: '30.0%' },
  { sku: 'SKU-STING-DAU', name: 'Nước tăng lực Sting Dâu Chai 330ml', costPrice: 7000, salePrice: 10000, margin: '30.0%' },
  { sku: 'SKU-SUA-VNM-180', name: 'Sữa tươi Vinamilk Có đường 180ml', costPrice: 6500, salePrice: 8500, margin: '23.5%' },
];
