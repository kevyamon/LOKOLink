// src/components/LoadingTimeout.jsx

import React from 'react';
import { Box, Typography, Fade } from '@mui/material';
import timeoutVideo from '../assets/timeout.mp4'; // La vidéo que tu vas ajouter

const LoadingTimeout = () => {
  return (
    <Fade in={true} timeout={500}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh', // Prend presque tout l'écran
          textAlign: 'center',
          p: 3,
        }}
      >
        {/* Vidéo au centre */}
        <Box
          component="video"
          src={timeoutVideo}
          autoPlay
          loop
          muted
          playsInline
          sx={{
            maxWidth: '100%',
            maxHeight: '400px',
            borderRadius: '16px', // Coins arrondis
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)', // Belle ombre
            mb: 4, // Marge en bas
          }}
        />

        {/* Message d'erreur en GROS et ROUGE */}
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: '900', // Très gras
            color: '#d32f2f', // Rouge erreur MUI
            textTransform: 'uppercase',
            letterSpacing: '1px',
            textShadow: '0px 2px 4px rgba(0,0,0,0.1)', // Légère ombre portée sur le texte
          }}
        >
          ERREUR DE CHARGEMENT.
        </Typography>
        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontWeight: 'bold',
            color: '#d32f2f',
            mt: 1,
          }}
        >
          VEUILLEZ VÉRIFIER VOTRE CONNEXION
        </Typography>
      </Box>
    </Fade>
  );
};

export default LoadingTimeout;