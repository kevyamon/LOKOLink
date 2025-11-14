// src/components/AnimatedModal.jsx

import React from 'react';
import { Modal, Box, Backdrop } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

// --- CORRECTION: NOUVELLE ANIMATION "FLUIDE" (Ressort) ---
const modalAnimation = {
  // État caché
  hidden: {
    opacity: 0,
    scale: 0.9, // Commence un peu plus petit
    y: 20,      // Commence 20px plus bas
  },
  // État visible
  visible: {
    opacity: 1,
    scale: 1,
    y: 0, // Arrive à sa position finale
    transition: {
      type: 'spring',  // L'animation "physique"
      stiffness: 260,  // La force du ressort (ni trop dur, ni trop mou)
      damping: 20,     // La résistance (qui empêche de "bloquer")
    },
  },
  // État de sortie
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      type: 'tween', // Une sortie rapide
      duration: 0.2,
      ease: 'easeIn', // Accélère en sortant
    },
  },
};

/**
 * Notre composant Modal "Maître".
 * (Props inchangées)
 */
const AnimatedModal = ({ open, onClose, children, maxWidth = 'sm' }) => {
  
  // Style dynamique (inchangé)
  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', sm: 400 },
    ...(maxWidth === 'md' && {
      width: { xs: '90%', sm: 600 },
    }),
    ...(maxWidth === 'lg' && {
      width: { xs: '90%', sm: 800 },
    }),
    
    bgcolor: 'background.paper',
    borderRadius: '24px', // Notre style "ouf"
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    p: 4,
    maxHeight: '90vh',
    overflowY: 'auto',
  };

  return (
    <AnimatePresence>
      {open && (
        <Modal
          open={open}
          onClose={onClose}
          closeAfterTransition
          // Fond flouté (inchangé)
          BackdropComponent={Backdrop}
          BackdropProps={{
            sx: {
              backdropFilter: 'blur(5px)',
              backgroundColor: 'rgba(0,0,30,0.4)',
            },
            timeout: 500,
          }}
        >
          {/* Conteneur animé (utilise la nouvelle animation) */}
          <motion.div
            variants={modalAnimation}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Box sx={modalStyle}>
              {children}
            </Box>
          </motion.div>
        </Modal>
      )}
    </AnimatePresence>
  );
};

export default AnimatedModal;