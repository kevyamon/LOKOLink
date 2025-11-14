// src/components/SplashScreen.jsx

import React from 'react';
import { Box, Typography, CircularProgress, Fade } from '@mui/material';

// Importation du logo
import logo from '../assets/logo.png';

const SplashScreen = () => {
  return (
    // 'Fade in' pour une apparition douce
    <Fade in={true} timeout={1000}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          // Le composant est transparent, le fond du <body> s'appliquera
          color: 'text.primary',
        }}
      >
        {/* Logo */}
        <Box
          component="img"
          src={logo}
          alt="LOKOlink Logo"
          sx={{
            height: '100px',
            mb: 3,
            animation: 'pulse 2s infinite ease-in-out',
          }}
        />

        {/* Titre */}
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          LOKOlink
        </Typography> 
        {/* CORRECTION: Il manquait le '>' ici */}

        {/* Spinner */}
        <CircularProgress sx={{ my: 3 }} />

        {/* Mention (Cahier des charges) */}
        <Typography variant="h6">
          Une initiative de Kevin Amon
        </Typography>

        {/* CSS pour l'animation 'pulse' */}
        <style>
          {`
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.05); }
              100% { transform: scale(1); }
            }
          `}
        </style>
      </Box>
    </Fade>
  );
};

export default SplashScreen;