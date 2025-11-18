// src/components/LoadingTimeout.jsx

import React from 'react';
import { Box, Typography, Fade } from '@mui/material';
// On importe TA vidéo (assure-toi qu'elle est bien dans src/assets/timeout.mp4)
import timeoutVideo from '../assets/timeout.mp4';

const LoadingTimeout = () => {
  return (
    <Fade in={true} timeout={500}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh', // Plein écran
          width: '100vw',
          textAlign: 'center',
          p: 3,
          bgcolor: '#000', // Fond noir pour l'immersion vidéo
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 99999,
        }}
      >
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
            maxHeight: '50vh', // Prend la moitié de la hauteur max
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(255,0,0,0.2)', // Lueur rouge
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
        
        {/* Bouton pour réessayer manuellement */}
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
    </Fade>
  );
};

export default LoadingTimeout;