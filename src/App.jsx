// src/App.jsx

import React, { useState, useEffect, Suspense } from 'react'; // 1. Importer Suspense
import { Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './contexts/AuthContext'; // 2. Importer notre "cerveau"

// --- COMPOSANTS DE BASE (chargés immédiatement) ---
import Layout from './components/Layout';
import SplashScreen from './components/SplashScreen';

// --- PAGES (chargées paresseusement) ---
// 3. Utilisation de React.lazy (Ma P3)
const HomePage = React.lazy(() => import('./pages/HomePage'));
const SessionPage = React.lazy(() => import('./pages/SessionPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

// Nouvelles pages d'authentification
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const EternalRegisterPage = React.lazy(() => import('./pages/EternalRegisterPage'));

// Anciennes pages (que nous supprimons des routes)
// const DelegueLoginPage = React.lazy(() => import('./pages/DelegueLoginPage'));
// const SuperAdminLoginPage = React.lazy(() => import('./pages/SuperAdminLoginPage'));

// Pages protégées
const SessionCreatePage = React.lazy(() => import('./pages/SessionCreatePage'));
const SuperAdminDashboardPage = React.lazy(() => import('./pages/SuperAdminDashboardPage'));


// 4. SPINNER DE CHARGEMENT POUR LE LAZY LOADING
const LazySpinner = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
    <CircularProgress />
  </Box>
);

// 5. GARDE POUR LES ROUTES DÉLÉGUÉ/ADMIN
const ProtectedRoute = () => {
  const { isAuthenticated, isDelegue, isAdmin } = useAuth();
  if (!isAuthenticated || (!isDelegue && !isAdmin)) {
    // Si pas connecté OU ni délégué ni admin, on redirige vers le login
    return <Navigate to="/login" replace />;
  }
  return <Outlet />; // Affiche la page enfant (ex: SessionCreatePage)
};

// 6. GARDE POUR LES ROUTES SUPER-ADMIN
const AdminRoute = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated || !isAdmin) {
    // Si pas admin ('superadmin' ou 'eternal'), on redirige vers l'accueil
    return <Navigate to="/" replace />;
  }
  return <Outlet />; // Affiche le Dashboard
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
      {/* 7. Suspense est OBLIGATOIRE pour React.lazy */}
      <Suspense fallback={<LazySpinner />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Layout />}>
            
            {/* --- Routes Publiques --- */}
            <Route index element={<HomePage />} />
            <Route path="session/:id" element={<SessionPage />} />
            
            {/* --- Nouvelles Routes d'Auth --- */}
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            {/* La route pour vous, Architecte. Gardez-la secrète. */}
            <Route path="register-eternal" element={<EternalRegisterPage />} />

            {/* --- Routes Protégées (Délégué & Admin) --- */}
            <Route element={<ProtectedRoute />}>
              <Route path="delegue/creer" element={<SessionCreatePage />} />
            </Route>

            {/* --- Routes Protégées (Admin Seulement) --- */}
            <Route element={<AdminRoute />}>
              <Route path="superadmin/dashboard" element={<SuperAdminDashboardPage />} />
            </Route>
            
            {/* --- 404 --- */}
            <Route path="*" element={<NotFoundPage />} />
            
            {/* --- Anciennes routes (redirigées) --- */}
            <Route path="delegue/login" element={<Navigate to="/login" replace />} />
            <Route path="superadmin/login" element={<Navigate to="/login" replace />} />

          </Route>
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

export default App;