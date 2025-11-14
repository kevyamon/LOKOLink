// src/contexts/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

// 1. Créer le Contexte
const AuthContext = createContext();

// 2. Créer le "Fournisseur" (Provider)
export const AuthProvider = ({ children }) => {
  // 3. L'état 'userInfo' est la source de vérité
  // On essaie de le récupérer du localStorage au 1er chargement
  const [userInfo, setUserInfo] = useState(() => {
    try {
      const storedUserInfo = localStorage.getItem('userInfo');
      return storedUserInfo ? JSON.parse(storedUserInfo) : null;
    } catch (error) {
      console.error('Erreur parsing userInfo localStorage', error);
      return null;
    }
  });

  // 4. Mettre à jour l'API et le localStorage quand userInfo change
  useEffect(() => {
    if (userInfo && userInfo.token) {
      // Configurer l'en-tête "Authorization" pour TOUS les appels API
      api.defaults.headers.common['Authorization'] = `Bearer ${userInfo.token}`;
      // Sauvegarder dans le localStorage
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
    } else {
      // Si pas d'info (logout), on supprime tout
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('userInfo');
    }
  }, [userInfo]);

  // 5. Fonctions de Login/Logout
  const login = (data) => {
    setUserInfo(data); // data = { _id, email, role, token }
  };

  const logout = () => {
    setUserInfo(null);
  };

  // 6. On fournit l'état et les fonctions aux enfants
  const value = {
    userInfo,
    login,
    logout,
    // Raccourcis pratiques
    isAuthenticated: !!userInfo,
    isDelegue: userInfo?.role === 'delegue',
    isAdmin: userInfo?.role === 'superadmin' || userInfo?.role === 'eternal',
    isEternal: userInfo?.role === 'eternal',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 7. Hook personnalisé pour un accès facile
export const useAuth = () => {
  return useContext(AuthContext);
}; 
