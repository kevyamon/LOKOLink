// src/App.jsx

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './contexts/AuthContext';
import api from './services/api'; 

// --- COMPOSANTS DE BASE ---
import Layout from './components/Layout';
import SplashScreen from './components/SplashScreen';
import LoadingTimeout from './components/LoadingTimeout'; // <--- IMPORT AJOUTÉ

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
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
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
  const [showSplash, setShowSplash] = useState(true);
  const [progress, setProgress] = useState(0);
  const [backendReady, setBackendReady] = useState(false);
  const [animationFinished, setAnimationFinished] = useState(false);
  const [isTimeoutError, setIsTimeoutError] = useState(false); // <--- NOUVEL ÉTAT
  
  const location = useLocation();
  const videoRef = useRef(null); 

  // 1. GESTION VIDÉO
  useEffect(() => {
    // La gestion est faite dans SplashScreen, ce hook sert de sécurité si besoin
  }, []);

  // 2. LOGIQUE DE CHARGEMENT & PING "PATIENT"
  useEffect(() => {
    let isMounted = true;
    let progressTimer;
    let pingInterval;
    const MAX_WAIT_TIME = 60000; // 60 secondes max avant erreur
    const startTime = Date.now();

    // A. Barre de progression "Psychologique"
    progressTimer = setInterval(() => {
      setProgress((old) => {
        // On bloque à 90% tant que le backend n'est pas prêt
        if (old >= 90) return 90; 
        // Plus on avance, plus on ralentit pour ne pas atteindre 90 trop vite
        const diff = Math.random() * (old > 70 ? 2 : 10);
        return Math.min(old + diff, 90);
      });
    }, 200);

    // B. Ping Serveur (La boucle de réveil)
    const checkServer = async () => {
        try {
            console.log("Ping serveur...");
            await api.get('/'); // Tente de joindre le backend
            
            if (isMounted) {
                console.log("Serveur réveillé !");
                setBackendReady(true); // VICTOIRE !
                clearInterval(pingInterval);
            }
        } catch (e) {
            console.log("Serveur dort encore (ou erreur réseau)... on attend.");
        }
    };
    
    // Premier essai immédiat
    checkServer();
    
    // Puis on réessaie toutes les 2 secondes
    pingInterval = setInterval(() => {
        // Si on a dépassé le temps max (60s), on déclare le décès du serveur
        if (Date.now() - startTime > MAX_WAIT_TIME) {
            clearInterval(pingInterval);
            clearInterval(progressTimer);
            if (isMounted) setIsTimeoutError(true); // Affiche l'écran d'erreur
        } else if (!backendReady) {
            checkServer();
        }
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(progressTimer);
      clearInterval(pingInterval);
    };
  }, [backendReady]);

  // 3. FERMETURE DU SPLASH (Uniquement quand TOUT est prêt)
  useEffect(() => {
    if (backendReady && animationFinished) {
      setProgress(100); // On force la barre à 100% pour le plaisir visuel
      
      // Petite pause de 0.5s pour voir le 100% vert (ou rouge)
      const t = setTimeout(() => {
        setShowSplash(false); 
      }, 500); 
      return () => clearTimeout(t);
    }
  }, [backendReady, animationFinished]);

  const onVideoEnd = () => {
    setAnimationFinished(true);
  };

  // CAS D'ERREUR FATALE (Serveur HS après 60s)
  if (isTimeoutError) {
      return <LoadingTimeout />;
  }

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

      {/* Le site est là, caché, mais ne s'affichera que quand le splash partira */}
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