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
  Tooltip
} from '@mui/material';
import { 
  DeleteForever, 
  Add, 
  HelpOutline // <--- Icône pour le Guide
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { PageTransition } from '../components/PageTransition';
import AnimatedModal from '../components/AnimatedModal';

const DelegateSessionsPage = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // État pour le Guide
  const [guideOpen, setGuideOpen] = useState(false);

  // États pour la suppression
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [password, setPassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

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
    navigate(`/delegue/dashboard/${sessionId}`);
  };

  const handleDeleteClick = (e, session) => {
    e.stopPropagation();
    setSessionToDelete(session);
    setDeleteModalOpen(true);
    setPassword('');
    setDeleteError(null);
  };

  const handleFinalDelete = async (e) => {
    e.preventDefault();
    setDeleteLoading(true);
    try {
        await api.delete(`/api/sessions/${sessionToDelete._id}`, {
            data: { password } 
        });
        setDeleteModalOpen(false);
        setPassword('');
        fetchMySessions(); 
    } catch (err) {
        setDeleteError(err.response?.data?.message || "Erreur mot de passe");
    } finally {
        setDeleteLoading(false);
    }
  };

  if (loading) return <PageTransition><Container sx={{textAlign:'center', mt:10}}><CircularProgress /></Container></PageTransition>;

  return (
    <PageTransition>
      <Container maxWidth="lg">
        {/* EN-TÊTE AVEC BOUTON GUIDE */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h4" component="h1" fontWeight="bold">
                    Mes Sessions
                </Typography>
                <Tooltip title="Comment ça marche ?">
                    <IconButton onClick={() => setGuideOpen(true)} color="primary">
                        <HelpOutline />
                    </IconButton>
                </Tooltip>
            </Box>

            <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={() => navigate('/delegue/creer')}
                sx={{ borderRadius: '50px', fontWeight: 'bold' }}
            >
                Créer
            </Button>
        </Box>

        {sessions.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: '12px' }}>
                Vous n'avez créé aucune session pour le moment. Cliquez sur "Créer" pour commencer.
            </Alert>
        ) : (
            <Grid container spacing={3}>
            {sessions.map((session) => (
                <Grid item xs={12} sm={6} md={4} key={session._id}>
                <Card sx={{ 
                    borderRadius: '16px', 
                    boxShadow: session.isActive ? 3 : 1,
                    opacity: session.isActive ? 1 : 0.7,
                    border: session.isActive ? '1px solid transparent' : '1px dashed gray',
                    transition: '0.3s',
                    '&:hover': { transform: 'translateY(-4px)' }
                }}>
                    <CardActionArea onClick={() => handleCardClick(session._id)} sx={{ height: '100%' }}>
                    <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                                <Typography variant="h6" fontWeight="bold">{session.sessionName}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Code : <strong>{session.sessionCode}</strong>
                                </Typography>
                                <Typography variant="caption" display="block" mt={1} color="primary">
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
                    
                    {/* Zone Actions */}
                    {session.isActive && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1, borderTop: '1px solid #eee' }}>
                            <Tooltip title="Désactiver la session">
                                <IconButton size="small" color="error" onClick={(e) => handleDeleteClick(e, session)}>
                                    <DeleteForever />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    )}
                </Card>
                </Grid>
            ))}
            </Grid>
        )}

        {/* --- MODAL GUIDE DÉLÉGUÉ --- */}
        <AnimatedModal open={guideOpen} onClose={() => setGuideOpen(false)}>
            <Typography variant="h5" gutterBottom fontWeight="bold" align="center" color="primary">
                Guide Délégué 🎓
            </Typography>
            <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold">1. Création 🛠️</Typography>
                <Typography variant="body2" paragraph color="text.secondary">
                    Cliquez sur <strong>"Créer"</strong>. Donnez un nom à votre session (ex: IACC 2025) et inventez un <strong>Code LOKO</strong> (ex: IACC25).
                </Typography>

                <Typography variant="subtitle1" fontWeight="bold">2. Recrutement 📢</Typography>
                <Typography variant="body2" paragraph color="text.secondary">
                    Une fois créée, ouvrez la session. Copiez le <strong>Lien d'Invitation</strong> et envoyez-le dans le groupe WhatsApp de votre classe (2ème année). Les parrains s'inscrivent eux-mêmes.
                </Typography>

                <Typography variant="subtitle1" fontWeight="bold">3. Le Jour J (Binômage) 🤝</Typography>
                <Typography variant="body2" paragraph color="text.secondary">
                    Passez voir les 1ère année. Écrivez le <strong>Code LOKO</strong> au tableau. Dites-leur d'aller sur le site, d'entrer leur nom et ce code. Le parrain est trouvé instantanément !
                </Typography>
            </Box>
            <Button fullWidth variant="contained" onClick={() => setGuideOpen(false)} sx={{ mt: 4, borderRadius: '50px' }}>
                C'est compris !
            </Button>
        </AnimatedModal>

        {/* --- MODAL SUPPRESSION --- */}
        <AnimatedModal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
            <Typography variant="h6" gutterBottom color="error" fontWeight="bold">
                Terminer la session ?
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
                Cela rendra la session invisible pour les étudiants.
                Pour confirmer, entrez votre mot de passe de connexion.
            </Typography>
            <Box component="form" onSubmit={handleFinalDelete}>
                <input 
                    type="password" 
                    placeholder="Votre mot de passe" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ccc' }}
                    required
                />
                {deleteError && <Typography color="error" variant="caption" display="block" mb={2}>{deleteError}</Typography>}
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button onClick={() => setDeleteModalOpen(false)}>Annuler</Button>
                    <Button type="submit" variant="contained" color="error" disabled={deleteLoading}>
                        {deleteLoading ? <CircularProgress size={20} color="inherit"/> : "Confirmer"}
                    </Button>
                </Stack>
            </Box>
        </AnimatedModal>

      </Container>
    </PageTransition>
  );
};

export default DelegateSessionsPage;