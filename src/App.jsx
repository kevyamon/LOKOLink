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

// --- PRÉ-IMPORTATION (POUR ÉVITER LE DEUXIÈME LOADER) ---
// On lance le téléchargement du fichier JS de la HomePage immédiatement
const homePagePromise = import('./pages/HomePage'); 

// --- PAGES (Lazy Loading) ---
const HomePage = React.lazy(() => homePagePromise); // On utilise la promesse lancée
const SessionPage = React.lazy(() => import('./pages/SessionPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));
const JoinSessionPage = React.lazy(() => import('./pages/JoinSessionPage')); // <--- IMPORT AJOUTÉ

// Auth
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const EternalRegisterPage = React.lazy(() => import('./pages/EternalRegisterPage'));

// Délégué & Admin
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
  const [showSplash, setShowSplash] = useState(true); // On contrôle l'affichage, pas le chargement
  const [progress, setProgress] = useState(0);
  const [backendReady, setBackendReady] = useState(false);
  const [animationFinished, setAnimationFinished] = useState(false);
  const location = useLocation();
  const videoRef = useRef(null); 

  // 1. GESTION VIDÉO
  useEffect(() => {
    const videoElement = videoRef.current;
    // Note: videoRef peut être null au premier render car le composant est conditionnel
    // Mais avec la nouvelle structure, on va le gérer différemment.
  }, []);

  // 2. LOGIQUE DE CHARGEMENT ET PING
  useEffect(() => {
    let isMounted = true;
    let pingInterval;

    // A. Barre de progression visuelle
    const progressTimer = setInterval(() => {
      setProgress((old) => {
        if (old >= 90) return 90; 
        const diff = Math.random() * 10;
        return Math.min(old + diff, 90);
      });
    }, 200);

    // B. Ping Serveur + Préchargement Page
    const checkServer = async () => {
        try {
            // On attend que le backend réponde
            await api.get('/');
            
            // On attend aussi que la page d'accueil soit téléchargée (normalement instantané ici)
            await homePagePromise;

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
      // On attend un peu pour que l'utilisateur voie le 100%
      const t = setTimeout(() => {
        setShowSplash(false); // Le rideau tombe
      }, 800); 
      return () => clearTimeout(t);
    }
  }, [backendReady, animationFinished]);

  // Callback passé au composant SplashScreen pour savoir quand la vidéo est finie
  const onVideoEnd = () => {
    setAnimationFinished(true);
  };

  return (
    <>
      {/* 1. LE SPLASH SCREEN (Superposé avec z-index élevé) */}
      <AnimatePresence>
        {showSplash && (
           <SplashScreen 
             progress={progress} 
             onVideoEnd={onVideoEnd} // On passe la fonction callback
           />
        )}
      </AnimatePresence>

      {/* 2. LE SITE (Chargé en arrière-plan) */}
      {/* On cache le scroll tant que le splash est là */}
      <Box sx={{ 
          height: showSplash ? '100vh' : 'auto', 
          overflow: showSplash ? 'hidden' : 'auto' 
      }}>
        <AnimatePresence mode="wait">
          {/* On retire le LazySpinner global pour éviter le flash, 
              car on a déjà préchargé HomePage */}
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