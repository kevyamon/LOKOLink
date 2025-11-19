// kevyamon/lokolink/LOKOLink-8d5e5c1ab5e3913ba58b31038ef761d12a0b44aa/src/App.jsx

import React, { useState, useEffect, Suspense, useRef } from 'react';
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
import { PageTransition } from './components/PageTransition'; // Import pour usage conditionnel

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
  const [isTimeoutError, setIsTimeoutError] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [fixedAnimationTimerFinished, setFixedAnimationTimerFinished] = useState(false);
  const [sessionsFetched, setSessionsFetched] = useState(false); 
  // NOUVEL ÉTAT : Pour gérer l'animation de transition de la première page
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

  // 2. LOGIQUE DE CHARGEMENT & PING
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
        // ON BLOQUE À 90% (Backend réveillé) ET AUSSI À 99% (Données récupérées)
        if (old >= 99) return 99;
        if (old >= 90) return 90; 
        
        const diff = Math.random() * (old > 70 ? 2 : 10);
        return Math.min(old + diff, 90);
      });
    }, 200);

    // NOUVELLE FONCTION : Ping + Récupération des données critiques
    const checkServerAndFetchData = async () => {
        try {
            await api.get('/'); // 1. Ping Serveur (wake up Render)
            setBackendReady(true);
            
            const { data } = await api.get('/api/sessions/active'); // 2. Récupérer les données critiques
            
            if (isMounted) {
                setInitialSessions(data); // Stocker dans le contexte
                setSessionsFetched(true); // Signaler que les données sont là
                setProgress(99); // Avancer la barre à 99%
                clearInterval(pingInterval);
            }
        } catch (e) {
            console.log("En attente ou erreur serveur/données...", e);
        }
    };
    
    checkServerAndFetchData(); // Premier essai immédiat
    
    pingInterval = setInterval(() => {
        if (Date.now() - startTime > MAX_WAIT_TIME) {
            clearInterval(pingInterval);
            clearInterval(progressTimer);
            if (isMounted) setIsTimeoutError(true);
        } else if (!sessionsFetched) { // On ping tant que les sessions ne sont pas là
            checkServerAndFetchData();
        }
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(progressTimer);
      clearInterval(pingInterval);
      clearTimeout(minTimeTimeout);
    };
  }, [setInitialSessions]); 

  // 3. FERMETURE DU SPLASH
  useEffect(() => {
    // La condition de fermeture est maintenant: Sessions Fetchées ET Temps minimum passé
    if (sessionsFetched && fixedAnimationTimerFinished) {
      setProgress(100); 
      const t = setTimeout(() => {
        setShowSplash(false); // FINI ! Le contenu est prêt derrière.
        // MARQUER LE PREMIER CHARGEMENT COMME TERMINÉ
        setIsInitialLoad(false); 
      }, 500); 
      return () => clearTimeout(t);
    }
  }, [sessionsFetched, fixedAnimationTimerFinished]);

  const onVideoEnd = () => {
    // Cette fonction n'est plus critique pour la logique mais est conservée par sécurité
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

  // Fonction pour wrapper les routes de navigation (toutes SAUF la HomePage au premier chargement)
  const RouteWrapper = ({ element }) => {
    // Si c'est la page d'accueil ET le premier chargement, on ne met PAS la PageTransition.
    // Sinon, on l'applique.
    if (isInitialLoad && location.pathname === '/') {
        return element; 
    }
    return <PageTransition>{element}</PageTransition>;
  };
  
  return (
    <Box sx={{ height: '100vh', overflow: 'auto' }}>
      <AnimatePresence mode="wait">
        <Suspense fallback={<LazySpinner />}> 
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Layout />}>
              
              {/* Utilisation conditionnelle de RouteWrapper */}
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