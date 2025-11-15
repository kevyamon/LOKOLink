// src/pages/DelegateSessionsPage.jsx

import React, { useState, useEffect } from 'react';
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
  IconButton,
  Stack,
  Chip,
  Button,
} from '@mui/material';
import { DeleteForever, Visibility, Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { PageTransition } from '../components/PageTransition';
import AnimatedModal from '../components/AnimatedModal';

const DelegateSessionsPage = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  useEffect(() => {
    fetchMySessions();
  }, []);

  const fetchMySessions = async () => {
    try {
      const { data } = await api.get('/api/sessions/my-sessions');
      setSessions(data);
      setLoading(false);
    } catch (err) {
      setError("Impossible de charger vos sessions.");
      setLoading(false);
    }
  };

  const handleCardClick = (sessionId) => {
    // Clic sur la carte -> Ouvre le détail (Gestion parrains)
    navigate(`/delegue/dashboard/${sessionId}`);
  };

  const handleDeleteClick = (e, session) => {
    e.stopPropagation(); // Empêche d'ouvrir la carte
    setSessionToDelete(session);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;
    try {
      // On supprime (désactive) sans demander de mot de passe car le délégué est déjà connecté
      await api.delete(`/api/sessions/${sessionToDelete._id}`, {
        // Pas de body password nécessaire car middleware 'protect' suffit
        // (J'ai adapté le controller pour ça, sinon il faudra demander le mdp)
        // Pour simplifier l'UX, on peut envoyer un mdp vide ou modifier le controller.
        // MODIF : Le controlleur attend un mdp. 
        // Solution UX : On va juste désactiver l'UI.
        // ATTENTION : Le controller 'deleteSession' attend un password.
        // Pour faire simple : on va demander "Confirmer" et envoyer le mdp du user s'il est stocké (non sécurisé)
        // MIEUX : On va modifier le controller (fait à l'étape 1) pour qu'il accepte la suppression SANS mdp si c'est le délégué connecté.
        // (Voir étape 1 : j'ai laissé la vérif mdp par sécurité, donc on va demander le mdp ici)
      });
      // ERREUR : Je ne veux pas compliquer l'interface avec un prompt de mot de passe ici.
      // J'ai modifié le controller à l'étape 1 pour qu'il exige un mot de passe.
      // Si tu veux une suppression fluide, il faut envoyer le mot de passe.
      // MAIS : Pour cette démo, on va faire simple : On demande confirmation visuelle uniquement
      // et on envoie un faux mot de passe si on veut... NON.
      // OK, on va afficher un champ mot de passe dans le modal.
    } catch (err) {
        // On gère ça dans le modal
    }
  };

  // VERSION SIMPLE AVEC MODAL CONFIRMATION + MDP (Sécurité)
  const [password, setPassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleFinalDelete = async (e) => {
    e.preventDefault();
    setDeleteLoading(true);
    try {
        await api.delete(`/api/sessions/${sessionToDelete._id}`, {
            data: { password } 
        });
        setDeleteModalOpen(false);
        setPassword('');
        fetchMySessions(); // Rafraichir la liste
    } catch (err) {
        setDeleteError(err.response?.data?.message || "Erreur");
    } finally {
        setDeleteLoading(false);
    }
  };

  if (loading) return <PageTransition><Container sx={{textAlign:'center', mt:10}}><CircularProgress /></Container></PageTransition>;

  return (
    <PageTransition>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" fontWeight="bold">
            Mes Sessions
            </Typography>
            <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={() => navigate('/delegue/creer')}
                sx={{ borderRadius: '50px' }}
            >
                Créer
            </Button>
        </Box>

        {sessions.length === 0 ? (
            <Alert severity="info">Vous n'avez créé aucune session pour le moment.</Alert>
        ) : (
            <Grid container spacing={3}>
            {sessions.map((session) => (
                <Grid item xs={12} sm={6} md={4} key={session._id}>
                <Card sx={{ 
                    borderRadius: '16px', 
                    boxShadow: session.isActive ? 3 : 1,
                    opacity: session.isActive ? 1 : 0.7,
                    border: session.isActive ? '1px solid transparent' : '1px dashed gray'
                }}>
                    <CardActionArea onClick={() => handleCardClick(session._id)} sx={{ height: '100%' }}>
                    <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                                <Typography variant="h6" fontWeight="bold">{session.sessionName}</Typography>
                                <Typography variant="body2" color="text.secondary">Code: {session.sessionCode}</Typography>
                                <Typography variant="caption" display="block" mt={1}>
                                    {session.sponsors.length} Parrains inscrits
                                </Typography>
                            </Box>
                            <Chip 
                                label={session.isActive ? "Active" : "Terminée"} 
                                color={session.isActive ? "success" : "default"} 
                                size="small" 
                            />
                        </Stack>
                    </CardContent>
                    </CardActionArea>
                    {/* Zone Actions en bas de carte */}
                    {session.isActive && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1, borderTop: '1px solid #eee' }}>
                            <IconButton size="small" color="error" onClick={(e) => handleDeleteClick(e, session)}>
                                <DeleteForever />
                            </IconButton>
                        </Box>
                    )}
                </Card>
                </Grid>
            ))}
            </Grid>
        )}

        {/* Modal Suppression */}
        <AnimatedModal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
            <Typography variant="h6" gutterBottom color="error">Terminer la session ?</Typography>
            <Typography variant="body2">
                Cela rendra la session invisible pour les étudiants.
                Pour confirmer, entrez votre mot de passe.
            </Typography>
            <Box component="form" onSubmit={handleFinalDelete} sx={{ mt: 2 }}>
                <input 
                    type="password" 
                    placeholder="Votre mot de passe" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                    required
                />
                {deleteError && <Typography color="error" variant="caption" display="block">{deleteError}</Typography>}
                <Stack direction="row" spacing={2} justifyContent="flex-end" mt={2}>
                    <Button onClick={() => setDeleteModalOpen(false)}>Annuler</Button>
                    <Button type="submit" variant="contained" color="error" disabled={deleteLoading}>
                        {deleteLoading ? <CircularProgress size={20} /> : "Confirmer"}
                    </Button>
                </Stack>
            </Box>
        </AnimatedModal>

      </Container>
    </PageTransition>
  );
};

export default DelegateSessionsPage;