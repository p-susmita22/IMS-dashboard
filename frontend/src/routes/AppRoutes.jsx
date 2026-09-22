import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MainLayout } from '../components/layout/MainLayout';
import { Loader } from '../components/common/Loader';

// Pages
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Products } from '../pages/Products';
import { ProductDetails } from '../pages/ProductDetails';
import { AddStock } from '../pages/AddStock';
import { StockOut } from '../pages/StockOut';
import { Orders } from '../pages/Orders';
import { CreateOrder } from '../pages/CreateOrder';
import { OrderDetails } from '../pages/OrderDetails';
import { Returns } from '../pages/Returns';
import { Adjustments } from '../pages/Adjustments';
import { Vendors } from '../pages/Vendors';
import { Locations } from '../pages/Locations';
import { Reports } from '../pages/Reports';
import { Users } from '../pages/Users';
import { Settings } from '../pages/Settings';
import { TrashBin } from '../pages/TrashBin';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader message="Verifying authentication session..." className="h-screen" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/admin" element={<Login allowedRole="ADMIN" />} />
      <Route path="/staff" element={<Login allowedRole="STAFF" />} />
      <Route path="/login" element={<Navigate to="/admin" replace />} />

      {/* Authenticated Application Shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        
        {/* Products */}
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetails />} />

        {/* Stock In & Out */}
        <Route path="add-stock" element={<AddStock />} />
        <Route path="stock-out" element={<StockOut />} />

        {/* Orders */}
        <Route path="orders" element={<Orders />} />
        <Route path="orders/create" element={<CreateOrder />} />
        <Route path="orders/:id" element={<OrderDetails />} />

        {/* Returns */}
        <Route path="returns" element={<Returns />} />

        {/* Adjustments */}
        <Route path="adjustments" element={<Adjustments />} />

        {/* Vendors & Locations */}
        <Route
          path="vendors"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
              <Vendors />
            </ProtectedRoute>
          }
        />
        <Route
          path="locations"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
              <Locations />
            </ProtectedRoute>
          }
        />

        {/* Reports */}
        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* Users & Settings (Admin only) */}
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="trash"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
              <TrashBin />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
