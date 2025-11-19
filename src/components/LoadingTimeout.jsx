// src/components/LoadingTimeout.jsx

import React from 'react';
import { Box, Typography, Fade } from '@mui/material';
import timeoutVideo from '../assets/timeout.mp4';

const LoadingTimeout = ({ visible = true }) => {
  // Si non visible, on cache tout mais on garde le DOM actif pour que la vidéo charge
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100vw',
    textAlign: 'center',
    p: 3,
    bgcolor: '#000',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 99999, // Toujours au-dessus de tout
    // Gestion de la visibilité sans démonter le composant
    opacity: visible ? 1 : 0,
    pointerEvents: visible ? 'auto' : 'none', // Empêche de cliquer quand caché
    transition: 'opacity 0.3s ease-in-out',
    visibility: visible ? 'visible' : 'hidden' // Sécurité supplémentaire
  };

  return (
    <Box sx={containerStyle}>
      {/* Le Lecteur Vidéo */}
      <Box
        component="video"
        src={timeoutVideo}
        autoPlay
        loop
        muted
        playsInline
        sx={{
          maxWidth: '100%',
          maxHeight: '50vh',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(255,0,0,0.2)',
          mb: 4,
          objectFit: 'contain'
        }}
      />

      <Typography
        variant="h4"
        component="h1"
        sx={{
          fontWeight: '900',
          color: '#d32f2f',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          textShadow: '0px 2px 4px rgba(0,0,0,0.5)',
          fontSize: { xs: '1.5rem', md: '2.5rem' }
        }}
      >
        CONNEXION PERDUE
      </Typography>
      
      <Typography
        variant="h6"
        component="h2"
        sx={{
          fontWeight: 'bold',
          color: '#aaa',
          mt: 2,
          fontSize: { xs: '1rem', md: '1.2rem' }
        }}
      >
        Vérifiez votre internet ou réessayez plus tard.
      </Typography>
      
      <button 
          onClick={() => window.location.reload()}
          style={{
              marginTop: '30px',
              padding: '12px 30px',
              borderRadius: '50px',
              border: '2px solid #d32f2f',
              background: 'transparent',
              color: '#d32f2f',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer'
          }}
      >
          RÉESSAYER
      </button>
    </Box>
  );
};

export default LoadingTimeout;