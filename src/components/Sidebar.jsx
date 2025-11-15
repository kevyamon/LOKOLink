// src/components/Sidebar.jsx

import React, { useState } from 'react';
import {
  Box,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Stack,
  Button,
  Typography
} from '@mui/material';
import {
  AdminPanelSettings,
  ContactSupport,
  WhatsApp,
  Facebook,
  Close,
  Dashboard,
  Logout
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import AnimatedModal from './AnimatedModal';
import LoginModal from './LoginModal'; // <--- Import du nouveau modal
import { useAuth } from '../contexts/AuthContext';

// Animation du cercle
const circleCenter = 'calc(100% - 32px) 32px';
const waveVariants = {
  hidden: { clipPath: `circle(0px at ${circleCenter})`, transition: { type: 'spring', stiffness: 400, damping: 40 } },
  visible: { clipPath: `circle(1200px at ${circleCenter})`, transition: { type: 'spring', stiffness: 20, restDelta: 2 } },
};
const listContainerVariant = { visible: { transition: { delayChildren: 0.3, staggerChildren: 0.1 } }, hidden: { transition: { staggerChildren: 0.05, staggerDirection: -1 } } };
const listItemVariant = { visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }, hidden: { opacity: 0, y: 20 } };

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { isAuthenticated, isDelegue, isAdmin, logout } = useAuth();
  
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactLinks, setContactLinks] = useState({ whatsapp: '#', facebook: '#' });

  // --- LA LOGIQUE INTELLIGENTE ---
  const handleAdminAccess = () => {
    onClose();
    if (isAuthenticated) {
      // Si déjà connecté, on redirige directement vers le bon endroit
      if (isDelegue) navigate('/delegue/sessions');
      else if (isAdmin) navigate('/superadmin/dashboard');
    } else {
      // Si pas connecté, on ouvre le portail (Login Modal)
      setLoginModalOpen(true);
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/');
  };

  const handleOpenContactModal = async () => {
    onClose();
    try {
      const { data } = await api.get('/api/contact');
      setContactLinks({ whatsapp: data.whatsappLink, facebook: data.facebookLink });
      setContactModalOpen(true);
    } catch (error) { console.error(error); }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={waveVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            style={{
              position: 'fixed', top: 0, right: 0, width: '100%', maxWidth: '300px', 
              height: '100vh', backgroundColor: '#1a1a1a', zIndex: 1300,
              display: 'flex', justifyContent: 'flex-end', boxShadow: '-4px 0 15px rgba(0,0,0,0.5)'
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
                {/* BOUTON UNIFIÉ : ACCÈS ADMIN / MON ESPACE */}
                <motion.li variants={listItemVariant}>
                  <ListItemButton onClick={handleAdminAccess} sx={{ borderRadius: 2, mb: 1, color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}>
                    <ListItemIcon sx={{ color: '#4fc3f7' }}>
                      {isAuthenticated ? <Dashboard /> : <AdminPanelSettings />}
                    </ListItemIcon>
                    <ListItemText 
                      primary={isAuthenticated ? "Mon Espace" : "Accès Admin"} 
                      secondary={isAuthenticated ? (isDelegue ? "Délégué" : "SuperAdmin") : "Connexion"}
                      secondaryTypographyProps={{ style: { color: '#b0bec5' } }}
                    />
                  </ListItemButton>
                </motion.li>

                <motion.li variants={listItemVariant}>
                  <ListItemButton onClick={handleOpenContactModal} sx={{ borderRadius: 2, mb: 1, color: 'white' }}>
                    <ListItemIcon sx={{ color: 'white' }}><ContactSupport /></ListItemIcon>
                    <ListItemText primary="Contact" />
                  </ListItemButton>
                </motion.li>

                {isAuthenticated && (
                  <motion.li variants={listItemVariant}>
                    <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, mt: 4, color: '#ffcdd2' }}>
                      <ListItemIcon sx={{ color: '#ef5350' }}><Logout /></ListItemIcon>
                      <ListItemText primary="Déconnexion" />
                    </ListItemButton>
                  </motion.li>
                )}
              </motion.ul>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE CONNEXION UNIFIÉ */}
      <LoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
      
      {/* MODAL CONTACT */}
      <AnimatedModal open={contactModalOpen} onClose={() => setContactModalOpen(false)}>
        <Typography variant="h6" component="h2" gutterBottom>Contacter l'administrateur</Typography>
        <Stack direction="row" spacing={4} justifyContent="center" sx={{ mt: 3 }}>
          <IconButton color="primary" href={contactLinks.whatsapp} target="_blank" sx={{ transform: 'scale(1.5)' }}><WhatsApp sx={{ color: '#25D366' }} /></IconButton>
          <IconButton color="primary" href={contactLinks.facebook} target="_blank" sx={{ transform: 'scale(1.5)' }}><Facebook sx={{ color: '#1877F2' }} /></IconButton>
        </Stack>
      </AnimatedModal>
    </>
  );
};

export default Sidebar;