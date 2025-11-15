// src/services/socket.js

import { io } from 'socket.io-client';

// URL du backend (adaptée selon Prod ou Dev)
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Initialisation du socket
const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: true,
});

export default socket;