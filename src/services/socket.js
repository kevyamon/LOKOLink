// kevyamon/lokolink/LOKOLink-8d5e5c1ab5e3913ba58b31038ef761d12a0b44aa/src/services/socket.js

import { io } from 'socket.io-client';

// URL du backend (adaptée selon Prod ou Dev)
// On utilise VITE_API_URL qui, en prod, devrait pointer vers 'https://lokolink-backend.onrender.com'
// Et en dev, le proxy prend le relais.
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Initialisation du socket avec options de reconnexion robustes
const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: true,
  // --- OPTIMISATION RECONNEXION ---
  reconnection: true,             // Tenter de se reconnecter
  reconnectionAttempts: Infinity, // Tenter indéfiniment
  reconnectionDelay: 1000,        // Commencer après 1 seconde
  reconnectionDelayMax: 5000,     // Attendre max 5 secondes entre les tentatives
  timeout: 20000,                 // Délai avant qu'une tentative de connexion échoue
  transports: ['websocket', 'polling'], // Préférer le WebSocket, plus stable
  // ---------------------------------
});

// Écouteur pour le débug
socket.on('disconnect', (reason) => {
    console.warn(`Socket Disconnected. Reason: ${reason}. Attempting to reconnect...`);
    // Si la déconnexion est inattendue, forcer la reconnexion si autoConnect est désactivé, mais il est déjà à true.
});

socket.on('reconnect', (attemptNumber) => {
    console.log(`Socket Reconnected successfully after ${attemptNumber} attempts.`);
});

socket.on('connect_error', (err) => {
    // Si l'application perd la connexion après le chargement, elle ne doit pas
    // basculer sur l'écran d'erreur du SplashScreen, mais essayer de se reconnecter silencieusement.
    console.error("Socket Connection Error:", err.message);
});

export default socket;