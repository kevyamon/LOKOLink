// src/components/Sidebar.jsx

import React, { useState } from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Button,
  Stack,
  IconButton,
} from '@mui/material';
import {
  AddCircleOutline,
  AdminPanelSettings,
  ContactSupport,
  WhatsApp,
  Facebook,
  Close,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import AnimatedModal from './AnimatedModal';

// --- Secrets 1 & 2 (Animation Sidebar) ---
// On garde l'animation, mais on adapte la cible
const circleCenter = 'calc(100% - 32px) 32px';

const waveVariants = {
  hidden: {
    clipPath: `circle(0px at ${circleCenter})`,
    transition: { type: 'spring', stiffness: 400, damping: 40 },
  },
  visible: {
    // On augmente la taille du cercle pour être sûr de couvrir la sidebar
    clipPath: `circle(1200px at ${circleCenter})`, 
    transition: { type: 'spring', stiffness: 20, restDelta: 2 },
  },
};

const listContainerVariant = {
  visible: {
    transition: { delayChildren: 0.3, staggerChildren: 0.1 },
  },
  hidden: {
    transition: { staggerChildren: 0.05, staggerDirection: -1 },
  },
};

const listItemVariant = {
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100 },
  },
  hidden: {
    opacity: 0,
    y: 20,
  },
};

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  
  const [delegueModalOpen, setDelegueModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactLinks, setContactLinks] = useState({ whatsapp: '#', facebook: '#' });

  // --- Gestions des Modals ---
  const handleOpenDelegueModal = () => {
    onClose();
    setDelegueModalOpen(true);
  };
  const handleCloseDelegueModal = () => setDelegueModalOpen(false);
  const handleDelegueYes = () => {
    handleCloseDelegueModal();
    navigate('/delegue/login');
  };

  const handleOpenContactModal = async () => {
    onClose();
    try {
      const { data } = await api.get('/api/contact');
      setContactLinks({
        whatsapp: data.whatsappLink,
        facebook: data.facebookLink,
      });
      setContactModalOpen(true);
    } catch (error) {
      console.error("Erreur de récupération des liens de contact", error);
    }
  };
  const handleCloseContactModal = () => setContactModalOpen(false);
  
  const handleAdminAccess = () => {
    onClose();
    navigate('/superadmin/login');
  };

  return (
    <>
      {/* --- SIDEBAR --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={waveVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            style={{
              position: 'fixed', 
              top: 0, 
              right: 0,
              // CORRECTION 1: Largeur limitée (300px sur mobile/desktop)
              // au lieu de 100vw qui prenait tout l'écran
              width: '100%', 
              maxWidth: '300px', 
              height: '100vh',
              backgroundColor: '#1a1a1a', 
              zIndex: 1300,
              display: 'flex', 
              justifyContent: 'flex-end',
              boxShadow: '-4px 0 15px rgba(0,0,0,0.5)' // Ajout d'une ombre pour détacher du fond
            }}
          >
            <IconButton onClick={onClose} sx={{ position: 'absolute', top: '16px', right: '18px', color: 'white', zIndex: 1301 }}>
              <Close />
            </IconButton>
            
            <Box sx={{ width: '100%', p: 2, boxSizing: 'border-box', pt: '80px' }}>
              <motion.ul
                style={{ listStyle: 'none', padding: 0, margin: 0, color: 'white' }}
                variants={listContainerVariant}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <motion.li variants={listItemVariant}>
                  <ListItemButton onClick={handleOpenDelegueModal} sx={{ borderRadius: 2, mb: 1, color: 'white' }}>
                    <ListItemIcon sx={{ color: 'white' }}><AddCircleOutline /></ListItemIcon>
                    <ListItemText primary="Créer une session" />
                  </ListItemButton>
                </motion.li>
                <motion.li variants={listItemVariant}>
                  <ListItemButton onClick={handleAdminAccess} sx={{ borderRadius: 2, mb: 1, color: 'white' }}>
                    <ListItemIcon sx={{ color: 'white' }}><AdminPanelSettings /></ListItemIcon>
                    <ListItemText primary="Accès Admin" />
                  </ListItemButton>
                </motion.li>
                <motion.li variants={listItemVariant}>
                  <ListItemButton onClick={handleOpenContactModal} sx={{ borderRadius: 2, mb: 1, color: 'white' }}>
                    <ListItemIcon sx={{ color: 'white' }}><ContactSupport /></ListItemIcon>
                    <ListItemText primary="Contacter l'administrateur" />
                  </ListItemButton>
                </motion.li>
              </motion.ul>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals (inchangés) */}
      <AnimatedModal open={delegueModalOpen} onClose={handleCloseDelegueModal}>
        <Typography variant="h6" component="h2" gutterBottom>
          Êtes-vous délégué ?
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button variant="outlined" onClick={handleCloseDelegueModal}>
            Non
          </Button>
          <Button variant="contained" onClick={handleDelegueYes}>
            Oui
          </Button>
        </Stack>
      </AnimatedModal>
      
      <AnimatedModal open={contactModalOpen} onClose={handleCloseContactModal}>
        <Typography variant="h6" component="h2" gutterBottom>
          Contacter l'administrateur
        </Typography>
        <Stack direction="row" spacing={4} justifyContent="center" sx={{ mt: 3 }}>
          <IconButton
            color="primary"
            href={contactLinks.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ transform: 'scale(1.5)' }}
          >
            <WhatsApp sx={{ color: '#25D366' }} />
          </IconButton>
          <IconButton
            color="primary"
            href={contactLinks.facebook}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ transform: 'scale(1.5)' }}
          >
            <Facebook sx={{ color: '#1877F2' }} />
          </IconButton>
        </Stack>
      </AnimatedModal>
    </>
  );
};

export default Sidebar;