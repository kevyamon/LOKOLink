// kevyamon/lokolink/LOKOLink-8d5e5c1ab5e3913ba58b31038ef761d12a0b44aa/src/App.jsx

import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './contexts/AuthContext';
import { useData } from './contexts/DataContext';
import api from './services/api'; 

// --- COMPOSANTS ---
import Layout from './components/Layout';
import SplashScreen from './components/SplashScreen';
import LoadingTimeout from './components/LoadingTimeout';
import { PageTransition } from './components/PageTransition'; 

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
  const [isTimeoutError, setIsTimeoutError] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [fixedAnimationTimerFinished, setFixedAnimationTimerFinished] = useState(false);
  const [sessionsFetched, setSessionsFetched] = useState(false); 
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const { setInitialSessions } = useData(); 
  const location = useLocation();
  const videoRef = useRef(null); 

  // 1. ÉCOUTEUR DE RÉSEAU
  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Utilisation de useCallback pour la fonction de ping/fetch - Elle prend maintenant les setters en dépendance
  const checkServerAndFetchData = useCallback(async () => {
      if (sessionsFetched) return; // NOUVEAU: Sortir si déjà réussi
      
      try {
          const [pingRes, sessionsRes] = await Promise.all([
              api.get('/'), 
              api.get('/api/sessions/active'),
          ]);
          
          setInitialSessions(sessionsRes.data); 
          
          // Mise à jour de l'état ici pour déclencher le useEffect de fermeture
          setSessionsFetched(true); 
          setProgress(99); 
          
          return true;
      } catch (e) {
          console.log("En attente ou erreur serveur/données...", e);
          return false;
      }
  }, [setInitialSessions, sessionsFetched]); // Ajout de sessionsFetched comme dépendance pour éviter le double appel réussi

  // 2. LOGIQUE DE CHARGEMENT & PING/FETCH
  useEffect(() => {
    let isMounted = true;
    let progressTimer;
    let pingInterval;
    const MAX_WAIT_TIME = 60000; 
    const startTime = Date.now();

    const minTimeTimeout = setTimeout(() => {
        if (isMounted) setFixedAnimationTimerFinished(true);
    }, 2500); 

    progressTimer = setInterval(() => {
      setProgress((old) => {
        if (old >= 99) return 99;
        if (old >= 90) return 90; 
        
        const diff = Math.random() * (old > 70 ? 2 : 10);
        return Math.min(old + diff, 90);
      });
    }, 200);

    const initialFetch = async () => {
        // Tente immédiatement de tout récupérer
        const success = await checkServerAndFetchData();
        
        // Si l'initial a échoué (ou n'a pas pu se synchroniser correctement au premier rendu)
        if (!success) { 
            pingInterval = setInterval(async () => {
                if (Date.now() - startTime > MAX_WAIT_TIME) {
                    clearInterval(pingInterval);
                    clearInterval(progressTimer);
                    if (isMounted) setIsTimeoutError(true);
                } else { 
                    await checkServerAndFetchData();
                }
            }, 2000);
        } else {
            // Si l'initial a réussi, on s'assure que l'intervalle ne se lance pas.
            // On compte sur le useEffect de fermeture pour faire le reste.
        }
    };
    
    initialFetch();

    // Nettoyage : On doit s'assurer que si sessionsFetched change, l'intervalle est aussi coupé.
    return () => {
      isMounted = false;
      clearInterval(progressTimer);
      clearInterval(pingInterval);
      clearTimeout(minTimeTimeout);
    };
  }, [checkServerAndFetchData]); 
  // IMPORTANT: J'ai retiré 'sessionsFetched' de la liste des dépendances du useEffect principal
  // pour éviter qu'il ne se relance entièrement après un succès, mais je l'ai laissé
  // dans la dépendance de checkServerAndFetchData pour optimiser l'appel.

  // 3. FERMETURE DU SPLASH
  useEffect(() => {
    // La condition de fermeture est: Sessions Fetchées ET Temps minimum passé
    if (sessionsFetched && fixedAnimationTimerFinished) {
      setProgress(100); 
      const t = setTimeout(() => {
        setShowSplash(false); // FINI ! Le contenu est prêt derrière.
        setIsInitialLoad(false); 
      }, 500); 
      return () => clearTimeout(t);
    }
  }, [sessionsFetched, fixedAnimationTimerFinished]);

  const LazySpinnerWrapper = <LazySpinner />;

  const RouteWrapper = ({ element }) => {
    if (isInitialLoad && location.pathname === '/') {
        return element; 
    }
    return <PageTransition>{element}</PageTransition>;
  };
  
  if (isOffline || isTimeoutError) return <LoadingTimeout />;

  if (showSplash) {
    return (
      <AnimatePresence>
         {showSplash && (
            <SplashScreen progress={progress} />
         )}
      </AnimatePresence>
    );
  }
  
  // Si le splash a disparu mais que les Lazy Imports n'ont pas fini, on montre le spinner générique
  const fallbackComponent = (location.pathname === '/' && !isInitialLoad) ? null : LazySpinnerWrapper;

  return (
    <Box sx={{ height: '100vh', overflow: 'auto' }}>
      <AnimatePresence mode="wait">
        <Suspense fallback={fallbackComponent}> 
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Layout />}>
              
              <Route index element={<RouteWrapper element={<HomePage />} />} />
              <Route path="session/:id" element={<RouteWrapper element={<SessionPage />} />} />
              <Route path="rejoindre/:code" element={<RouteWrapper element={<JoinSessionPage />} />} />
              <Route path="rejoindre" element={<RouteWrapper element={<JoinSessionPage />} />} />
              <Route path="login" element={<RouteWrapper element={<LoginPage />} />} />
              <Route path="register" element={<RouteWrapper element={<RegisterPage />} />} />
              <Route path="register-eternal" element={<RouteWrapper element={<EternalRegisterPage />} />} />
              
              <Route element={<ProtectedRoute />}>
                <Route path="delegue/creer" element={<RouteWrapper element={<SessionCreatePage />} />} />
                <Route path="delegue/sessions" element={<RouteWrapper element={<DelegateSessionsPage />} />} />
                <Route path="delegue/dashboard/:id" element={<RouteWrapper element={<DelegateDashboardPage />} />} />
              </Route>
              
              <Route element={<AdminRoute />}>
                <Route path="superadmin/dashboard" element={<RouteWrapper element={<SuperAdminDashboardPage />} />} />
              </Route>
              
              <Route path="*" element={<RouteWrapper element={<NotFoundPage />} />} />
              <Route path="delegue/login" element={<Navigate to="/login" replace />} />
              <Route path="superadmin/login" element={<Navigate to="/login" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </AnimatePresence>
    </Box>
  );
}

export default App;