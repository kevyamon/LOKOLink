// src/App.jsx

import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './contexts/AuthContext';
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

// On garde le spinner lazy par sécurité, mais il ne devrait pas apparaître grâce au splash
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
  const [showSplash, setShowSplash] = useState(true);
  const [progress, setProgress] = useState(0);
  const [backendReady, setBackendReady] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false); // Nouvelle logique temporelle
  const [isTimeoutError, setIsTimeoutError] = useState(false);
  
  const location = useLocation();

  // 1. LOGIQUE DE TEMPS MINIMUM (2.5 secondes)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 2500); // Temps minimum d'affichage du Splash
    return () => clearTimeout(timer);
  }, []);

  // 2. PING SERVEUR & PROGRESSION
  useEffect(() => {
    let isMounted = true;
    let progressTimer;
    let pingInterval;
    const MAX_WAIT_TIME = 60000; // 60s max
    const startTime = Date.now();

    // A. Barre de progression "Psychologique"
    progressTimer = setInterval(() => {
      setProgress((old) => {
        // Si tout est prêt, on laisse le useEffect de fermeture gérer le 100%
        if (backendReady && minTimeElapsed) return old;
        
        // Sinon on bloque à 90% tant que ce n'est pas prêt
        if (old >= 90) return 90; 
        
        // Avancée aléatoire
        const diff = Math.random() * 4;
        return Math.min(old + diff, 90);
      });
    }, 200);

    // B. Ping Serveur (Réveil Backend)
    const checkServer = async () => {
        try {
            await api.get('/'); // Ping simple
            if (isMounted) {
                console.log("Serveur connecté.");
                setBackendReady(true);
                clearInterval(pingInterval);
            }
        } catch (e) {
            // On attend silencieusement
        }
    };
    
    checkServer(); // Premier essai
    
    pingInterval = setInterval(() => {
        if (Date.now() - startTime > MAX_WAIT_TIME) {
            clearInterval(pingInterval);
            clearInterval(progressTimer);
            if (isMounted) setIsTimeoutError(true);
        } else if (!backendReady) {
            checkServer();
        }
    }, 2000); // Réessaie toutes les 2s

    return () => {
      isMounted = false;
      clearInterval(progressTimer);
      clearInterval(pingInterval);
    };
  }, [backendReady, minTimeElapsed]);

  // 3. FERMETURE ET TRANSITION DU SPLASH
  useEffect(() => {
    // CONDITION ULTIME : Backend prêt ET Temps minimum écoulé
    if (backendReady && minTimeElapsed) {
      setProgress(100); // On complète la barre
      
      // Petite pause (500ms) pour voir la barre verte complète avant de couper
      const t = setTimeout(() => {
        setShowSplash(false); 
      }, 500); 
      return () => clearTimeout(t);
    }
  }, [backendReady, minTimeElapsed]);

  // CAS D'ERREUR FATALE
  if (isTimeoutError) {
      return <LoadingTimeout />;
  }

  return (
    <>
      <AnimatePresence>
        {showSplash && (
           <SplashScreen progress={progress} />
        )}
      </AnimatePresence>

      {/* CONTENU DU SITE */}
      <Box sx={{ 
          height: '100vh', 
          overflow: showSplash ? 'hidden' : 'auto',
          // Tant que le splash est là, on peut masquer le scrollbar
      }}>
        {/* On ne rend le contenu que si le backend est prêt ou presque,
            pour éviter que React Router ne charge des pages vides en arrière-plan trop tôt.
            Cependant, Suspense gère ça.
        */}
        {!showSplash && (
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
        )}
        
        {/* NOTE IMPORTANTE : 
           J'ai mis le contenu dans `!showSplash` pour garantir le "ZÉRO Loader".
           Tant que le splash est là, rien d'autre n'est rendu.
           Dès que `showSplash` passe à false, le site apparaît.
           Si tu veux précharger le site en arrière-plan, enlève la condition `!showSplash &&`.
        */}
      </Box>
    </>
  );
}

export default App;