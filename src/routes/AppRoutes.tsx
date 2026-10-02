import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { UserLayout } from '../layouts/UserLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

// Auth pages
import { Login } from '../pages/auth/Login';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { ErrorPage } from '../pages/error/ErrorPage';

// User / Sales Staff Pages
import { DashboardPage as UserDashboard } from '../pages/user/Dashboard';
import { ProductsPage as UserProducts } from '../pages/user/Products';
import { ProductDetailPage as UserProductDetail } from '../pages/user/ProductDetail';
import { CartPage as UserCart } from '../pages/user/Cart';
import { CreateOrderPage as UserCreateOrder } from '../pages/user/CreateOrder';
import { OrdersPage as UserOrders } from '../pages/user/Orders';
import { OrderDetailPage as UserOrderDetail } from '../pages/user/OrderDetail';
import { NotificationsPage as UserNotifications } from '../pages/user/Notifications';
import { ProfilePage as UserProfile } from '../pages/user/Profile';
import { ChangePasswordPage as UserChangePassword } from '../pages/user/ChangePassword';

// Admin / Management Dashboard
import { Dashboard } from '../pages/dashboard/Dashboard';

// Products (Management)
import { ProductList } from '../pages/products/ProductList';
import { ProductCreate } from '../pages/products/ProductCreate';
import { ProductEdit } from '../pages/products/ProductEdit';
import { ProductDetail } from '../pages/products/ProductDetail';

// Inventory (Management)
import { InventoryOverview } from '../pages/inventory/InventoryOverview';
import { StockIn } from '../pages/inventory/StockIn';
import { StockOut } from '../pages/inventory/StockOut';
import { InventoryHistory } from '../pages/inventory/InventoryHistory';

// Sales & POS (Management)
import { POS } from '../pages/sales/POS';
import { Orders } from '../pages/sales/Orders';
import { OrderDetail } from '../pages/sales/OrderDetail';

// Customers (Management)
import { CustomerList } from '../pages/customers/CustomerList';
import { CustomerDetail } from '../pages/customers/CustomerDetail';

// Suppliers (Management)
import { SupplierList } from '../pages/suppliers/SupplierList';
import { SupplierDetail } from '../pages/suppliers/SupplierDetail';

// Reports (Management)
import { RevenueReport } from '../pages/reports/RevenueReport';
import { SalesReport } from '../pages/reports/SalesReport';
import { InventoryReport } from '../pages/reports/InventoryReport';

// Users & Settings (Management)
import { UserManagement } from '../pages/users/UserManagement';
import { Settings } from '../pages/settings/Settings';

// Smart root redirect based on Role
const RootRedirect: React.FC = () => {
  const { role } = useAuth();
  if (role === 'User') {
    return <Navigate to="/user/dashboard" replace />;
  }
  if (role === 'Staff') {
    return <Navigate to="/sales/pos" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Root redirect */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <RootRedirect />
          </ProtectedRoute>
        }
      />

      {/* ================================================================ */}
      {/* ROLE USER / NHÂN VIÊN BÁN HÀNG ROUTES (Portal dành riêng cho User) */}
      {/* ================================================================ */}
      <Route
        path="/user"
        element={
          <ProtectedRoute allowedRoles={['User', 'Admin', 'Staff', 'Manager']}>
            <UserLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/user/dashboard" replace />} />
        <Route path="dashboard" element={<UserDashboard />} />
        <Route path="products" element={<UserProducts />} />
        <Route path="products/:id" element={<UserProductDetail />} />
        <Route path="cart" element={<UserCart />} />
        <Route path="orders/create" element={<UserCreateOrder />} />
        <Route path="orders" element={<UserOrders />} />
        <Route path="orders/:id" element={<UserOrderDetail />} />
        <Route path="notifications" element={<UserNotifications />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="change-password" element={<UserChangePassword />} />
      </Route>

      {/* Block User from Admin / Manager prefixes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/*"
        element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        }
      />

      {/* ================================================================ */}
      {/* MANAGEMENT & BACKOFFICE ROUTES (User role CANNOT access these)    */}
      {/* ================================================================ */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Staff']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Staff']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Products */}
        <Route
          path="/products"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Staff']}>
              <ProductList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/create"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
              <ProductCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/:id"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Staff']}>
              <ProductDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
              <ProductEdit />
            </ProtectedRoute>
          }
        />

        {/* Inventory */}
        <Route
          path="/inventory"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
              <InventoryOverview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/stock-in"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
              <StockIn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/stock-out"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
              <StockOut />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/history"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
              <InventoryHistory />
            </ProtectedRoute>
          }
        />

        {/* Sales & Orders */}
        <Route
          path="/sales/pos"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Staff']}>
              <POS />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Staff']}>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Staff']}>
              <OrderDetail />
            </ProtectedRoute>
          }
        />

        {/* Customers */}
        <Route
          path="/customers"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Staff']}>
              <CustomerList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/:id"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Staff']}>
              <CustomerDetail />
            </ProtectedRoute>
          }
        />

        {/* Suppliers */}
        <Route
          path="/suppliers"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
              <SupplierList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/suppliers/:id"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
              <SupplierDetail />
            </ProtectedRoute>
          }
        />

        {/* Reports */}
        <Route
          path="/reports/revenue"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
              <RevenueReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/sales"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
              <SalesReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/inventory"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
              <InventoryReport />
            </ProtectedRoute>
          }
        />

        {/* Users & Settings */}
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Staff']}>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback 404 Route - SCRUM-204 */}
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <ErrorPage code="404" />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
