import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Auth pages
import { Login } from '../pages/auth/Login';
import { ForgotPassword } from '../pages/auth/ForgotPassword';

// Dashboard
import { Dashboard } from '../pages/dashboard/Dashboard';

// Products
import { ProductList } from '../pages/products/ProductList';
import { ProductCreate } from '../pages/products/ProductCreate';
import { ProductEdit } from '../pages/products/ProductEdit';
import { ProductDetail } from '../pages/products/ProductDetail';

// Inventory
import { InventoryOverview } from '../pages/inventory/InventoryOverview';
import { StockIn } from '../pages/inventory/StockIn';
import { StockOut } from '../pages/inventory/StockOut';
import { InventoryHistory } from '../pages/inventory/InventoryHistory';

// Sales & POS
import { POS } from '../pages/sales/POS';
import { Orders } from '../pages/sales/Orders';
import { OrderDetail } from '../pages/sales/OrderDetail';

// Customers
import { CustomerList } from '../pages/customers/CustomerList';
import { CustomerDetail } from '../pages/customers/CustomerDetail';

// Suppliers
import { SupplierList } from '../pages/suppliers/SupplierList';
import { SupplierDetail } from '../pages/suppliers/SupplierDetail';

// Reports
import { RevenueReport } from '../pages/reports/RevenueReport';
import { SalesReport } from '../pages/reports/SalesReport';
import { InventoryReport } from '../pages/reports/InventoryReport';

// Users & Settings
import { UserManagement } from '../pages/users/UserManagement';
import { Settings } from '../pages/settings/Settings';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Protected App Routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Products */}
        <Route
          path="/products"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
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
            <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
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
            <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
