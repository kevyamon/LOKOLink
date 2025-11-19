// src/App.jsx

import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './contexts/AuthContext';
import { useData } from './contexts/DataContext'; 
import api from './services/api'; 

// --- COMPOSANTS DE BASE ---
import Layout from './components/Layout';
import SplashScreen from './components/SplashScreen';
import LoadingTimeout from './components/LoadingTimeout';

// --- PAGES (Lazy Loading) ---
const HomePage = React.lazy(() => import('./pages/HomePage'));
const SessionPage = React.lazy(() => import('./pages/SessionPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));
const JoinSessionPage = React.lazy(() => import('./pages/JoinSessionPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const EternalRegisterPage = React.lazy(() => import('./pages/EternalRegisterPage'));
const SessionCreatePage = React.lazy(() => import('./pages/SessionCreatePage'));
const DelegateDashboardPage = React.lazy(() => import('./pages/DelegateDashboardPage'));
const DelegateSessionsPage = React.lazy(() => import('./pages/DelegateSessionsPage'));
const SuperAdminDashboardPage = React.lazy(() => import('./pages/SuperAdminDashboardPage'));

const LazySpinner = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress sx={{ color: '#d32f2f' }} />
  </Box>
);

const ProtectedRoute = () => {
  const { isAuthenticated, isDelegue, isAdmin } = useAuth();
  if (!isAuthenticated || (!isDelegue && !isAdmin)) return <Navigate to="/login" replace />;
  return <Outlet />;
};

const AdminRoute = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated || !isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
};

function App() {
  const { isHomeReady, markFirstLoadComplete } = useData(); 
  const [showSplash, setShowSplash] = useState(true);
  const [progress, setProgress] = useState(0);
  const [backendReady, setBackendReady] = useState(false);
  const [isTimeoutError, setIsTimeoutError] = useState(false);
  
  // État de connexion (Initialisé correctement)
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const location = useLocation();

  // 1. GESTION HORS LIGNE (Écouteurs)
  useEffect(() => {
    const handleOnline = () => {
        console.log("Connexion rétablie !");
        setIsOffline(false);
    };
    const handleOffline = () => {
        console.log("Connexion perdue.");
        setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. PING SERVEUR & PROGRESSION
  useEffect(() => {
    // Si on est hors ligne, on met en pause la logique de ping
    if (isOffline) return;

    let isMounted = true;
    let progressTimer;
    let pingInterval;
    const MAX_WAIT_TIME = 60000; 
    const startTime = Date.now();

    // A. Barre de progression
    progressTimer = setInterval(() => {
      setProgress((old) => {
        if (old >= 90) return 90; 
        const diff = Math.random() * 4;
        return Math.min(old + diff, 90);
      });
    }, 200);

    // B. Ping Serveur
    const checkServer = async () => {
        try {
            await api.get('/');
            if (isMounted) {
                console.log("Serveur connecté.");
                setBackendReady(true);
                clearInterval(pingInterval);
            }
        } catch (e) {
            // Echec silencieux, on réessaiera
        }
    };
    
    // On lance un check immédiat
    checkServer();
    
    pingInterval = setInterval(() => {
        if (Date.now() - startTime > MAX_WAIT_TIME) {
            clearInterval(pingInterval);
            clearInterval(progressTimer);
            if (isMounted) setIsTimeoutError(true);
        } else if (!backendReady) {
            checkServer();
        }
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(progressTimer);
      clearInterval(pingInterval);
    };
    // IMPORTANT : isOffline est ajouté aux dépendances.
    // Si isOffline passe de true à false, cet effet redémarre et relance checkServer()
  }, [backendReady, isOffline]); 

  // 3. ORCHESTRATION FINALE
  useEffect(() => {
    if (backendReady && isHomeReady && !isOffline) {
      console.log("Tout est prêt. Ouverture dans 2s...");
      
      setProgress(100);

      const t = setTimeout(() => {
        setShowSplash(false);
        markFirstLoadComplete(); 
      }, 2000);
      
      return () => clearTimeout(t);
    }
  }, [backendReady, isHomeReady, isOffline]);

  return (
    <>
      {/* ECRAN HORS LIGNE / TIMEOUT
         On le rend TOUJOURS (pour précharger la vidéo), 
         mais on contrôle sa visibilité via la prop 'visible'.
      */}
      <LoadingTimeout visible={isOffline || isTimeoutError} />

      {/* SPLASH SCREEN (Z-index 9999, en dessous du LoadingTimeout qui est à 99999) */}
      <AnimatePresence>
        {showSplash && !isOffline && !isTimeoutError && <SplashScreen progress={progress} />}
      </AnimatePresence>

      {/* LE SITE (Chargé en background) */}
      <Box sx={{ 
          height: '100vh', 
          overflow: showSplash ? 'hidden' : 'auto',
      }}>
        <AnimatePresence mode="wait">
          <Suspense fallback={<LazySpinner />}> 
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="session/:id" element={<SessionPage />} />
                <Route path="rejoindre/:code" element={<JoinSessionPage />} />
                <Route path="rejoindre" element={<JoinSessionPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="register-eternal" element={<EternalRegisterPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="delegue/creer" element={<SessionCreatePage />} />
                  <Route path="delegue/sessions" element={<DelegateSessionsPage />} />
                  <Route path="delegue/dashboard/:id" element={<DelegateDashboardPage />} />
                </Route>
                <Route element={<AdminRoute />}>
                  <Route path="superadmin/dashboard" element={<SuperAdminDashboardPage />} />
                </Route>
                <Route path="*" element={<NotFoundPage />} />
                <Route path="delegue/login" element={<Navigate to="/login" replace />} />
                <Route path="superadmin/login" element={<Navigate to="/login" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </AnimatePresence>
      </Box>
    </>
  );
}

export default App;