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
  // Modal, // 1. SUPPRIMÉ
  Stack,
  Button,
  Snackbar,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { PageTransition } from '../components/PageTransition';
import AnimatedModal from '../components/AnimatedModal'; // 2. IMPORTÉ

// const modalStyle = { ... }; // 3. SUPPRIMÉ

const HomePage = () => {
  const navigate = useNavigate();

  // --- États (inchangés) ---
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState(null);

  // --- Fonctions (inchangées) ---
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
    }
  };
  useEffect(() => { fetchSessions(); }, []);
  
  const filteredSessions = useMemo(() => {
    if (!Array.isArray(sessions)) return [];
    return sessions.filter((session) =>
      session.sessionName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sessions, searchTerm]);
  
  const handleCardClick = (session) => {
    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }
    setSelectedSession(session);
    setModalOpen(true);
  };
  
  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedSession(null);
  };
  
  const handleModalConfirm = () => {
    if (selectedSession) {
      navigate(`/session/${selectedSession._id}`);
    }
    handleModalClose();
  };
  
  const handleMouseDown = (session) => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setSessionToDelete(session);
      setConfirmDeleteModal(true);
    }, 5000);
  };
  
  const handleMouseUp = () => {
    clearTimeout(longPressTimer.current);
  };
  
  const handleConfirmDelete = () => {
    setConfirmDeleteModal(false);
    setPasswordModal(true);
    setDeleteError(null);
    setDeleguePassword('');
  };
  
  const handleClosePasswordModal = () => {
    setPasswordModal(false);
    setSessionToDelete(null);
    setDeleteError(null);
  };
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await api.delete(`/api/sessions/${sessionToDelete._id}`, {
        data: { password: deleguePassword },
      });
      setDeleteLoading(false);
      handleClosePasswordModal();
      setSnackbarMessage('Session désactivée avec succès !');
      setLoading(true);
      await fetchSessions();
    } catch (err) {
      setDeleteLoading(false);
      setDeleteError(
        err.response?.data?.message || 'Erreur lors de la suppression.'
      );
    }
  };

  // --- Rendu ---
  if (loading) {
    return (
      <PageTransition>
        <Container sx={{ textAlign: 'center', mt: 10 }}>
          <CircularProgress />
          <Typography>Chargement des sessions...</Typography>
        </Container>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <Container maxWidth="md">
          <Alert severity="error">{error}</Alert>
        </Container>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
          Bienvenue sur LOKOlink
        </Typography>

        {/* Barre de recherche */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <TextField
            label="Rechercher une filière..."
            variant="outlined"
            sx={{
              width: '80%',
              maxWidth: '600px',
              '& .MuiOutlinedInput-root': {
                borderRadius: '50px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
              },
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Box>

        {/* Affichage des sessions */}
        {filteredSessions.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 5, p: 3, bgcolor: 'rgba(255, 255, 255, 0.8)', borderRadius: 2 }}>
            <Typography variant="h6">
              {sessions.length === 0
                ? "Aucune session de parrainage n'est active pour le moment."
                : 'Aucune session ne correspond à votre recherche.'}
            </Typography>
            <Typography>
              Veuillez revenir plus tard ou contacter un délégué.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredSessions.map((session) => (
              <Grid item xs={12} sm={6} md={4} key={session._id}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.03)',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => handleCardClick(session)}
                    onMouseDown={() => handleMouseDown(session)}
                    onMouseUp={handleMouseUp}
                    onTouchStart={() => handleMouseDown(session)}
                    onTouchEnd={handleMouseUp}
                    onContextMenu={(e) => e.preventDefault()}
                    sx={{ height: '100%' }}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                        {session.sessionName}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* 4. MODALS REFACTORISÉS (CODE COMPLET) */}

        {/* MODAL: Confirmation Filleul (Partie 4) */}
        {selectedSession && (
          <AnimatedModal open={modalOpen} onClose={handleModalClose}>
            <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
              {selectedSession.sessionName}
            </Typography>
            <Typography sx={{ mt: 2 }}>
              Est-ce bien votre filière ?
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button variant="outlined" onClick={handleModalClose}>
                Non
              </Button>
              <Button variant="contained" onClick={handleModalConfirm}>
                Oui
              </Button>
            </Stack>
          </AnimatedModal>
        )}

        {/* MODAL 1: "Êtes-vous sûr ?" (Partie 5) */}
        <AnimatedModal open={confirmDeleteModal} onClose={() => setConfirmDeleteModal(false)}>
          <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
            Désactiver la session ?
          </Typography>
          <Typography sx={{ mt: 2 }}>
            Êtes-vous sûr de vouloir désactiver la session :
            <strong> "{sessionToDelete?.sessionName}"</strong> ?
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={() => setConfirmDeleteModal(false)}>
              Non
            </Button>
            <Button variant="contained" color="error" onClick={handleConfirmDelete}>
              Oui
            </Button>
          </Stack>
        </AnimatedModal>

        {/* MODAL 2: "Mot de passe" (Partie 5) */}
        <AnimatedModal open={passwordModal} onClose={handleClosePasswordModal}>
          <Box component="form" onSubmit={handlePasswordSubmit}>
            <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Confirmation Requise
            </Typography>
            <Typography sx={{ mt: 2 }}>
              Pour confirmer la désactivation, veuillez entrer le mot de passe Délégué.
            </Typography>
            <TextField
              type="password"
              label="Mot de passe Délégué"
              variant="outlined"
              fullWidth
              required
              value={deleguePassword}
              onChange={(e) => setDeleguePassword(e.target.value)}
              disabled={deleteLoading}
              error={Boolean(deleteError)}
              sx={{ mt: 2 }}
            />
            {deleteError && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: '16px' }}>{deleteError}</Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              color="error"
              fullWidth
              disabled={deleteLoading}
              sx={{ mt: 3 }}
            >
              {deleteLoading ? <CircularProgress size={24} /> : 'Confirmer'}
            </Button>
          </Box>
        </AnimatedModal>

        {/* Snackbar (inchangé) */}
        <Snackbar
          open={Boolean(snackbarMessage)}
          autoHideDuration={4000}
          onClose={() => setSnackbarMessage(null)}
          message={snackbarMessage}
        />
      </Container>
    </PageTransition>
  );
};

export default HomePage;