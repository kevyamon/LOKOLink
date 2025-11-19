// src/pages/HomePage.jsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Typography,
  Container,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  TextField,
  Stack,
  Button,
  Snackbar,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AdminPanelSettings } from '@mui/icons-material';
import api from '../services/api';
import socket from '../services/socket';
import { PageTransition } from '../components/PageTransition';
import AnimatedModal from '../components/AnimatedModal';
import { useAuth } from '../contexts/AuthContext'; // Pour vérifier si connecté
import { useData } from '../contexts/DataContext'; // <--- NOUVEAU : Import du contexte de données

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { markHomeAsReady, isFirstLoad } = useData(); // <--- NOUVEAU : Récupération des fonctions du contexte

  // --- États ---
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // États Modals Filleul
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  
  // États Modals Suppression (Long Press)
  const longPressTimer = useRef();
  const isLongPress = useRef(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false); // Sert pour Delete ET Access
  const [deleguePassword, setDeleguePassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false); // Loading générique
  const [actionError, setActionError] = useState(null); // Erreur générique
  const [snackbarMessage, setSnackbarMessage] = useState(null);

  // État Modal Accès Délégué (Double Click)
  const [isAccessMode, setIsAccessMode] = useState(false); 

  // --- Chargement ---
  const fetchSessions = async () => {
    try {
      const { data } = await api.get('/api/sessions/active');
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur chargement sessions:', err);
      setError('Impossible de charger les sessions.');
      setSessions([]);
    } finally {
      setLoading(false);
      // <--- NOUVEAU : On signale que les données sont prêtes
      markHomeAsReady();
    }
  };

  useEffect(() => { 
    fetchSessions(); 
    socket.on('session:created', (newSession) => { if (newSession.isActive) setSessions(prev => [newSession, ...prev]); });
    socket.on('session:updated', (updatedSession) => {
      if (updatedSession.isActive) {
        setSessions(prev => {
          const exists = prev.find(s => s._id === updatedSession._id);
          if (exists) return prev.map(s => s._id === updatedSession._id ? updatedSession : s);
          return [updatedSession, ...prev];
        });
      } else {
        setSessions(prev => prev.filter(s => s._id !== updatedSession._id));
      }
    });
    socket.on('session:deleted', (deletedId) => { setSessions(prev => prev.filter(s => s._id !== deletedId)); });
    return () => {
      socket.off('session:created');
      socket.off('session:updated');
      socket.off('session:deleted');
    };
  }, []);
  
  const filteredSessions = useMemo(() => {
    if (!Array.isArray(sessions)) return [];
    return sessions.filter((session) =>
      session.sessionName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sessions, searchTerm]);
  
  // --- Handlers ---

  // 1. Click Simple (Filleul)
  const handleCardClick = (session) => {
    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }
    setSelectedSession(session);
    setModalOpen(true);
  };

  // 2. Double Click (Accès Délégué)
  const handleDoubleClick = (e, session) => {
    e.stopPropagation(); // Empêche le clic simple de se déclencher (si possible)
    if (!isAuthenticated) return; // Si pas connecté, rien ne se passe (ou redirect login)
    
    setSelectedSession(session);
    setIsAccessMode(true); // Mode "Accès" activé
    setPasswordModal(true); // On ouvre le modal de mot de passe
    setDeleguePassword('');
    setActionError(null);
  };
  
  // 3. Long Press (Suppression)
  const handleMouseDown = (session) => {
    isLongPress.current = false;
    // DÉLAI RÉGLÉ À 3 SECONDES (3000ms)
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setSessionToDelete(session);
      setConfirmDeleteModal(true); // Demande confirmation d'abord
    }, 3000);
  };
  
  const handleMouseUp = () => {
    clearTimeout(longPressTimer.current);
  };
  
  // --- Logique Modals ---

  const handleModalConfirmFilleul = () => {
    if (selectedSession) navigate(`/session/${selectedSession._id}`);
    setModalOpen(false);
  };

  const handleConfirmDeleteStep1 = () => {
    setConfirmDeleteModal(false);
    setIsAccessMode(false); // Mode "Suppression"
    setPasswordModal(true); // On demande le mot de passe
    setDeleguePassword('');
    setActionError(null);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);

    try {
      if (isAccessMode) {
        // --- CAS 1 : ACCÈS DASHBOARD ---
        // On vérifie que le mot de passe est celui du créateur
        await api.post('/api/sessions/verify-password', {
          password: deleguePassword,
          sessionId: selectedSession._id
        });
        // Si OK, on redirige
        navigate(`/delegue/dashboard/${selectedSession._id}`);
      } else {
        // --- CAS 2 : SUPPRESSION SESSION ---
        await api.delete(`/api/sessions/${sessionToDelete._id}`, {
          data: { password: deleguePassword },
        });
        setSnackbarMessage('Session désactivée avec succès !');
        setPasswordModal(false);
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Erreur ou mot de passe incorrect.');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Rendu ---
  if (loading) {
    // <--- NOUVEAU : Si c'est le premier chargement (sous le splash), on ne rend RIEN visuellement
    // Le splash screen est au-dessus, donc l'utilisateur ne voit pas le blanc.
    // Dès que loading passe à false, markHomeAsReady a été appelé, le splash disparaît, et la grille est là.
    if (isFirstLoad) {
      return null; 
    }
    
    return (
      <PageTransition>
        <Container sx={{ textAlign: 'center', mt: 10 }}><CircularProgress /><Typography>Chargement...</Typography></Container>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <Container maxWidth="md"><Alert severity="error">{error}</Alert></Container>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
          Bienvenue sur LOKOlink
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <TextField
            label="Rechercher une filière..."
            variant="outlined"
            sx={{
              width: '80%', maxWidth: '600px',
              '& .MuiOutlinedInput-root': { borderRadius: '50px', bgcolor: 'rgba(255,255,255,0.9)', border: 'none' }
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Box>

        {filteredSessions.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 5, p: 3, bgcolor: 'rgba(255,255,255,0.8)', borderRadius: 2 }}>
            <Typography variant="h6">Aucune session active.</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredSessions.map((session) => (
              // Note: Si tu utilises MUI v6, remplace 'item' par 'size' comme vu précédemment, sinon garde 'item'
              <Grid item xs={12} sm={6} md={4} key={session._id}>
                <Card
                  sx={{
                    height: '100%', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease', '&:hover': { transform: 'scale(1.03)' }
                  }}
                >
                  <CardActionArea
                    onClick={() => handleCardClick(session)}
                    onDoubleClick={(e) => handleDoubleClick(e, session)}
                    onMouseDown={() => handleMouseDown(session)}
                    onMouseUp={handleMouseUp}
                    onTouchStart={() => handleMouseDown(session)}
                    onTouchEnd={handleMouseUp}
                    onContextMenu={(e) => e.preventDefault()}
                    sx={{ height: '100%' }}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{session.sessionName}</Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* MODAL 1: Confirmation Filleul (Simple Click) */}
        <AnimatedModal open={modalOpen} onClose={() => setModalOpen(false)}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>{selectedSession?.sessionName}</Typography>
          <Typography sx={{ mt: 2 }}>Est-ce bien votre filière ?</Typography>
          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={() => setModalOpen(false)}>Non</Button>
            <Button variant="contained" onClick={handleModalConfirmFilleul}>Oui</Button>
          </Stack>
        </AnimatedModal>

        {/* MODAL 2: Confirmation Suppression (Long Press Step 1) */}
        <AnimatedModal open={confirmDeleteModal} onClose={() => setConfirmDeleteModal(false)}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'error.main' }}>Désactiver la session ?</Typography>
          <Typography sx={{ mt: 2 }}>Voulez-vous vraiment désactiver <strong>{sessionToDelete?.sessionName}</strong> ?</Typography>
          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={() => setConfirmDeleteModal(false)}>Non</Button>
            <Button variant="contained" color="error" onClick={handleConfirmDeleteStep1}>Oui</Button>
          </Stack>
        </AnimatedModal>

        {/* MODAL 3: Mot de Passe (Commun pour Accès et Suppression) */}
        <AnimatedModal open={passwordModal} onClose={() => setPasswordModal(false)}>
          <Box component="form" onSubmit={handlePasswordSubmit}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              {isAccessMode ? <AdminPanelSettings color="primary" /> : null}
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {isAccessMode ? "Accès Délégué" : "Confirmation Requise"}
              </Typography>
            </Box>
            
            <Typography sx={{ mt: 1, mb: 2 }}>
              {isAccessMode 
                ? "Entrez votre mot de passe pour accéder au tableau de bord." 
                : "Entrez le mot de passe Délégué pour confirmer la suppression."}
            </Typography>
            
            <TextField
              type="password"
              label="Mot de passe"
              fullWidth
              required
              value={deleguePassword}
              onChange={(e) => setDeleguePassword(e.target.value)}
              disabled={actionLoading}
              error={Boolean(actionError)}
              helperText={actionError}
            />
            
            <Button
              type="submit"
              variant="contained"
              color={isAccessMode ? "primary" : "error"}
              fullWidth
              disabled={actionLoading}
              sx={{ mt: 3, py: 1.5, fontWeight: 'bold', borderRadius: '50px' }}
            >
              {actionLoading ? <CircularProgress size={24} color="inherit" /> : (isAccessMode ? "Accéder" : "Confirmer")}
            </Button>
          </Box>
        </AnimatedModal>

        <Snackbar open={Boolean(snackbarMessage)} autoHideDuration={4000} onClose={() => setSnackbarMessage(null)} message={snackbarMessage} />
      </Container>
    </PageTransition>
  );
};

export default HomePage;