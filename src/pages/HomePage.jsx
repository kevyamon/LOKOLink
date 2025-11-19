// kevyamon/lokolink/LOKOLink-8d5e5c1ab5e3913ba58b31038ef761d12a0b44aa/src/pages/HomePage.jsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Typography,
  Container,
  Box,
  CircularProgress, // Supprimé du rendu principal
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
// import { PageTransition } from '../components/PageTransition'; // <-- RETIRÉ : Gérée par App.jsx
import AnimatedModal from '../components/AnimatedModal';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext'; 

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { sessions: initialSessions, setInitialSessions } = useData(); 

  // --- États ---
  const [sessions, setSessions] = useState(initialSessions); 
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  
  const longPressTimer = useRef();
  const isLongPress = useRef(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [deleguePassword, setDeleguePassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState(null);

  const [isAccessMode, setIsAccessMode] = useState(false); 

  // --- Remplacer l'ancien fetch (qui n'est plus nécessaire) ---
  const fetchSessions = async () => {
    try {
        // Cette fonction sera utilisée uniquement par le socket pour recharger
        const { data } = await api.get('/api/sessions/active');
        setSessions(data);
        setInitialSessions(data); // On met à jour le contexte aussi
    } catch (err) {
        console.error('Erreur rechargement sessions:', err);
    }
  };

  useEffect(() => { 
    // Au premier montage, on utilise les données du contexte (initialSessions)
    // Pas de fetch initial ici.

    socket.on('session:created', (newSession) => { if (newSession.isActive) setSessions(prev => [newSession, ...prev]); });
    socket.on('session:updated', (updatedSession) => {
      // Si la session mise à jour est active, on l'update. Si inactive, on la filtre.
      if (updatedSession.isActive) {
        setSessions(prev => {
          const exists = prev.find(s => s._id === updatedSession._id);
          if (exists) return prev.map(s => s._id === updatedSession._id ? updatedSession : s);
          return [updatedSession, ...prev]; // Ajout si elle n'existait pas (ex: était inactive)
        });
      } else {
        setSessions(prev => prev.filter(s => s._id !== updatedSession._id));
      }
      // Il faut cloner 'sessions' avant de l'envoyer à setInitialSessions
      // car sinon tu envoies un état qui n'est pas encore mis à jour.
      // Une solution simple est de refetch les sessions actives pour l'état du contexte:
      // fetchSessions(); 
      // Ou, pour éviter un fetch, utiliser un callback si tu voulais vraiment mettre à jour le contexte après la mise à jour locale.
      // Mais dans le cas de Socket.io, le plus sûr est de laisser le contexte s'initialiser à partir d'App.jsx
    });
    socket.on('session:deleted', (deletedId) => { 
      setSessions(prev => prev.filter(s => s._id !== deletedId)); 
      // setInitialSessions(sessions); // Retiré pour la même raison
    });
    
    // IMPORTANT : On ajoute cette dépendance pour la mise à jour du contexte APRES les opérations
    // Si tu veux vraiment que le contexte ait la dernière version, tu peux utiliser un useEffect:
    useEffect(() => {
        setInitialSessions(sessions);
    }, [sessions, setInitialSessions]);
    
    return () => {
      socket.off('session:created');
      socket.off('session:updated');
      socket.off('session:deleted');
    };
  }, [setInitialSessions]); 

  // Met à jour l'état local si le contexte est mis à jour (sécurité)
  useEffect(() => {
    setSessions(initialSessions);
  }, [initialSessions]);
  
  const filteredSessions = useMemo(() => {
    if (!Array.isArray(sessions)) return [];
    return sessions.filter((session) =>
      session.sessionName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sessions, searchTerm]);
  
  // --- Handlers (inchangés) ---
  const handleCardClick = (session) => {
    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }
    setSelectedSession(session);
    setModalOpen(true);
  };
  
  const handleDoubleClick = (e, session) => {
    e.stopPropagation(); 
    if (!isAuthenticated) return; 
    setSelectedSession(session);
    setIsAccessMode(true); 
    setPasswordModal(true); 
    setDeleguePassword('');
    setActionError(null);
  };
  
  const handleMouseDown = (session) => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setSessionToDelete(session);
      setConfirmDeleteModal(true);
    }, 3000);
  };
  
  const handleMouseUp = () => {
    clearTimeout(longPressTimer.current);
  };
  
  const handleModalConfirmFilleul = () => {
    if (selectedSession) navigate(`/session/${selectedSession._id}`);
    setModalOpen(false);
  };

  const handleConfirmDeleteStep1 = () => {
    setConfirmDeleteModal(false);
    setIsAccessMode(false);
    setPasswordModal(true);
    setDeleguePassword('');
    setActionError(null);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);

    try {
      if (isAccessMode) {
        await api.post('/api/sessions/verify-password', {
          password: deleguePassword,
          sessionId: selectedSession._id
        });
        navigate(`/delegue/dashboard/${selectedSession._id}`);
      } else {
        await api.delete(`/api/sessions/${sessionToDelete._id}`, {
          data: { password: deleguePassword },
        });
        setSnackbarMessage('Session désactivée avec succès !');
        setPasswordModal(false);
        // Important: La suppression n'a pas mis à jour le contexte global via socket
        // On doit le faire après la suppression dans le backend, ici on se contente 
        // de laisser la mise à jour par socket se faire.
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Erreur ou mot de passe incorrect.');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Rendu ---

  if (error) {
    return (
      // RETIRÉ PageTransition pour ne pas avoir de double transition
      <Container maxWidth="md"><Alert severity="error">{error}</Alert></Container>
    );
  }

  return (
    // RETIRÉ PageTransition pour ne pas avoir de double transition
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
          {/* CORRECTION TEXTE (Demandée précédemment) */}
          <Typography variant="h6" sx={{ color: '#555' }}>
            Aucune session trouvée, essayez d'autres filières.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredSessions.map((session) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={session._id}>
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

      {/* MODALS (inchangés) */}
      <AnimatedModal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>{selectedSession?.sessionName}</Typography>
        <Typography sx={{ mt: 2 }}>Est-ce bien votre filière ?</Typography>
        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button variant="outlined" onClick={() => setModalOpen(false)}>Non</Button>
          <Button variant="contained" onClick={handleModalConfirmFilleul}>Oui</Button>
        </Stack>
      </AnimatedModal>

      <AnimatedModal open={confirmDeleteModal} onClose={() => setConfirmDeleteModal(false)}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'error.main' }}>Désactiver la session ?</Typography>
        <Typography sx={{ mt: 2 }}>Voulez-vous vraiment désactiver <strong>{sessionToDelete?.sessionName}</strong> ?</Typography>
        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button variant="outlined" onClick={() => setConfirmDeleteModal(false)}>Non</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDeleteStep1}>Oui</Button>
        </Stack>
      </AnimatedModal>

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
  );
};

export default HomePage;