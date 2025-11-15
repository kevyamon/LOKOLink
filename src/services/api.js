// src/services/api.js

import axios from 'axios';

// 1. Définir l'URL de base dynamiquement
// En PROD : VITE_API_URL sera défini dans les réglages de Render.
// En DEV : On n'en met pas, le proxy de vite.config.js prendra le relais sur les requêtes relatives.
const baseURL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: baseURL, 
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;