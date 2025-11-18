// src/App.jsx

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './contexts/AuthContext';
import api from './services/api'; 

// Composants
import Layout from './components/Layout';
import SplashScreen from './components/SplashScreen';

// --- PAGES (Lazy Loading STANDARD) ---
// On retire la promesse manuelle qui faisait planter
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
  const [showSplash, setShowSplash] = useState(true);
  const [progress, setProgress] = useState(0);
  const [backendReady, setBackendReady] = useState(false);
  const [animationFinished, setAnimationFinished] = useState(false);
  const location = useLocation();
  const videoRef = useRef(null); 

  // 1. GESTION VIDÉO
  useEffect(() => {
    // On laisse le composant SplashScreen gérer la lecture
    // Ce useEffect sert juste de sécurité globale
  }, []);

  // 2. LOGIQUE DE CHARGEMENT
  useEffect(() => {
    let isMounted = true;
    let pingInterval;

    // A. Barre de progression
    const progressTimer = setInterval(() => {
      setProgress((old) => {
        if (old >= 90) return 90; 
        const diff = Math.random() * 10;
        return Math.min(old + diff, 90);
      });
    }, 200);

    // B. Ping Serveur
    const checkServer = async () => {
        try {
            await api.get('/');
            if (isMounted) setBackendReady(true);
        } catch (e) {
            console.log("Serveur dort encore...");
        }
    };
    
    checkServer();
    pingInterval = setInterval(() => {
        if (!backendReady) checkServer();
        else clearInterval(pingInterval);
    }, 2000);

    // C. Timeout de sécurité (8s)
    const safetyTimeout = setTimeout(() => {
        if (isMounted) {
            console.log("⚠️ Timeout : Ouverture forcée.");
            setBackendReady(true);
            setAnimationFinished(true);
        }
    }, 8000);

    return () => {
      isMounted = false;
      clearInterval(progressTimer);
      clearInterval(pingInterval);
      clearTimeout(safetyTimeout);
    };
  }, [backendReady]);

  // 3. FERMETURE DU SPLASH
  useEffect(() => {
    if (backendReady && animationFinished) {
      setProgress(100);
      const t = setTimeout(() => {
        setShowSplash(false); 
      }, 800); 
      return () => clearTimeout(t);
    }
  }, [backendReady, animationFinished]);

  const onVideoEnd = () => {
    setAnimationFinished(true);
  };

  return (
    <>
      <AnimatePresence>
        {showSplash && (
           <SplashScreen 
             progress={progress} 
             onVideoEnd={onVideoEnd} 
           />
        )}
      </AnimatePresence>

      {/* Le site est chargé en arrière-plan, mais accessible */}
      <Box sx={{ 
          height: '100vh', 
          overflow: showSplash ? 'hidden' : 'auto' 
      }}>
        <AnimatePresence mode="wait">
          <Suspense fallback={null}> 
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