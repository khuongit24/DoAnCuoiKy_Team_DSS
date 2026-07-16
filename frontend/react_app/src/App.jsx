import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { ThemeProvider, ThemeContext } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { MainLayout } from './components/Layout/MainLayout';

const PurchaseManagerDashboard = lazy(() => import('./pages/PurchaseManager/PurchaseManagerDashboard').then(module => ({ default: module.PurchaseManagerDashboard })));
const WarehouseDashboard = lazy(() => import('./pages/Warehouse/WarehouseDashboard').then(module => ({ default: module.WarehouseDashboard })));

const ProductsPage = lazy(() => import('./pages/DataManagement/ProductsPage').then(module => ({ default: module.ProductsPage })));
const SalesPage = lazy(() => import('./pages/DataManagement/SalesPage').then(module => ({ default: module.SalesPage })));
const InventoryPage = lazy(() => import('./pages/DataManagement/InventoryPage').then(module => ({ default: module.InventoryPage })));
const SuppliersPage = lazy(() => import('./pages/DataManagement/SuppliersPage').then(module => ({ default: module.SuppliersPage })));
const MarketPage = lazy(() => import('./pages/DataManagement/MarketPage').then(module => ({ default: module.MarketPage })));

const NotFoundPage = lazy(() => import('./pages/NotFound/NotFoundPage'));
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage'));

const SalesDirectorDashboard = lazy(() => import('./pages/SalesDirector/SalesDirectorDashboard'));
const FinanceDashboard = lazy(() => import('./pages/Finance/FinanceDashboard'));
const HomePage = lazy(() => import('./pages/HomePage/HomePage').then(module => ({ default: module.HomePage })));

import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';

function AppContent() {
  const { isDarkMode } = React.useContext(ThemeContext);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#3b82f6',
          fontFamily: 'Inter, sans-serif',
          borderRadius: 8,
        },
      }}
    >
      <ErrorBoundary>
        <Router>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage />} />
                
                <Route path="/dashboard/purchase" element={<PurchaseManagerDashboard />} />
                <Route path="/dashboard/warehouse" element={<WarehouseDashboard />} />
                <Route path="/dashboard/sales" element={<SalesDirectorDashboard />} />
                <Route path="/dashboard/finance" element={<FinanceDashboard />} />

                {/* Data Management common routes - accessible by multiple roles later */}
                <Route path="/data/products" element={<ProductsPage />} />
                <Route path="/data/sales" element={<SalesPage />} />
                <Route path="/data/inventory" element={<InventoryPage />} />
                <Route path="/data/suppliers" element={<SuppliersPage />} />
                <Route path="/data/market" element={<MarketPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </Router>
      </ErrorBoundary>
    </ConfigProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;

