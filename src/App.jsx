// src/App.jsx

import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './contexts/AuthContext';

// --- COMPOSANTS DE BASE ---
import Layout from './components/Layout';
import SplashScreen from './components/SplashScreen';

// --- PAGES (Lazy Loading) ---
const HomePage = React.lazy(() => import('./pages/HomePage'));
const SessionPage = React.lazy(() => import('./pages/SessionPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

// Auth
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const EternalRegisterPage = React.lazy(() => import('./pages/EternalRegisterPage'));

// Délégué & Admin
const SessionCreatePage = React.lazy(() => import('./pages/SessionCreatePage'));
const DelegateDashboardPage = React.lazy(() => import('./pages/DelegateDashboardPage')); // <--- NOUVEAU
const SuperAdminDashboardPage = React.lazy(() => import('./pages/SuperAdminDashboardPage'));

// Invitation (Parrain)
const JoinSessionPage = React.lazy(() => import('./pages/JoinSessionPage')); // <--- NOUVEAU

// Spinner
const LazySpinner = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
    <CircularProgress />
  </Box>
);

// Garde Délégué/Admin
const ProtectedRoute = () => {
  const { isAuthenticated, isDelegue, isAdmin } = useAuth();
  if (!isAuthenticated || (!isDelegue && !isAdmin)) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

// Garde Super-Admin
const AdminRoute = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

function App() {
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<LazySpinner />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Layout />}>
            
            {/* --- Routes Publiques --- */}
            <Route index element={<HomePage />} />
            <Route path="session/:id" element={<SessionPage />} />
            
            {/* Routes d'invitation (Pour les parrains) */}
            <Route path="rejoindre/:code" element={<JoinSessionPage />} />
            <Route path="rejoindre" element={<JoinSessionPage />} />

            {/* --- Routes d'Auth --- */}
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="register-eternal" element={<EternalRegisterPage />} />

            {/* --- Routes Protégées (Délégué) --- */}
            <Route element={<ProtectedRoute />}>
              <Route path="delegue/creer" element={<SessionCreatePage />} />
              <Route path="delegue/dashboard/:id" element={<DelegateDashboardPage />} /> {/* <--- NOUVEAU */}
            </Route>

            {/* --- Routes Protégées (Admin) --- */}
            <Route element={<AdminRoute />}>
              <Route path="superadmin/dashboard" element={<SuperAdminDashboardPage />} />
            </Route>
            
            {/* --- 404 --- */}
            <Route path="*" element={<NotFoundPage />} />
            
            {/* Redirections legacy */}
            <Route path="delegue/login" element={<Navigate to="/login" replace />} />
            <Route path="superadmin/login" element={<Navigate to="/login" replace />} />

          </Route>
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

export default App;