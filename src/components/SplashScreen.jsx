// src/components/SplashScreen.jsx

import React, { useRef, useEffect } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion'; // On utilise motion pour la sortie
import videoAnim from '../assets/logo_anim.mp4'; 
import logoStatic from '../assets/logo.png';

const SplashScreen = ({ progress, onVideoEnd }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl) {
      // S'assurer que la vidéo joue
      videoEl.play().catch(() => {
        // Si autoplay bloqué, on considère fini après 3s
        setTimeout(onVideoEnd, 3000);
      });

      const handleEnded = () => {
        onVideoEnd();
      };

      videoEl.addEventListener('ended', handleEnded);
      return () => videoEl.removeEventListener('ended', handleEnded);
    } else {
        // Sécurité si pas de ref
        onVideoEnd();
    }
  }, [onVideoEnd]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }} // Fondu de sortie fluide
      transition={{ duration: 0.8, ease: "easeInOut" }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999, // Très haut pour couvrir le site
      }}
    >
      {/* CONTENEUR VIDÉO */}
      <Box sx={{ 
        width: '250px', 
        height: '250px', 
        mb: 4,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <video
          ref={videoRef}
          muted // Obligatoire pour autoplay
          playsInline
          src={videoAnim}
          poster={logoStatic}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            borderRadius: '50%',
          }}
        />
      </Box>

      <Typography 
        variant="h6" 
        sx={{ color: '#fff', fontWeight: 'bold', mb: 1, letterSpacing: 2, fontSize: '0.9rem' }}
      >
        CONNEXION AU SERVEUR...
      </Typography>

      <Box sx={{ width: '80%', maxWidth: '300px' }}>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{
            height: 6,
            borderRadius: 5,
            bgcolor: 'rgba(255,255,255,0.2)',
            '& .MuiLinearProgress-bar': {
              bgcolor: '#d32f2f',
              borderRadius: 5,
              transition: 'transform 0.2s linear'
            }
          }}
        />
        <Typography align="right" sx={{ color: '#555', fontSize: '0.75rem', mt: 0.5, fontFamily: 'monospace' }}>
          {Math.round(progress)}%
        </Typography>
      </Box>
    </motion.div>
  );
};

export default SplashScreen;