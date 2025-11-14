// src/services/api.js

import axios from 'axios';

// 1. Créer une instance 'axios'
const api = axios.create({
  // 2. SUPPRIMER la baseURL
  // baseURL: import.meta.env.VITE_API_URL, // SUPPRIMÉ
  
  // Les requêtes seront relatives (ex: /api/auth/login)
  // et seront interceptées par le proxy Vite.
  
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;