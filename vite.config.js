// vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    
    // --- C'EST LA MAGIE (LA VRAIE SOLUTION) ---
    proxy: {
      // Si Vite voit une requête qui commence par '/api'...
      '/api': {
        // ...il la redirige vers notre backend Render.
        target: 'https://lokolink-backend.onrender.com',
        // Il se fait passer pour un serveur sécurisé.
        changeOrigin: true,
        // Il réécrit l'URL (ex: /api/auth devient /api/auth)
        secure: false, // Nécessaire pour communiquer de http à https
      },
    },
    // --- FIN DE LA MAGIE ---
  },
});