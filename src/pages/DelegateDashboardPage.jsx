// src/pages/DelegateDashboardPage.jsx

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material';
import { 
  ContentCopy, 
  Person, 
  WhatsApp, 
  Check, 
  GroupAdd,
  HelpOutline // <--- Icône Aide
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../services/api';
import socket from '../services/socket';
import FormContainer from '../components/FormContainer';
import { PageTransition } from '../components/PageTransition';
import AnimatedModal from '../components/AnimatedModal'; // <--- Import Modal

const DelegateDashboardPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // État pour le Guide
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const { data } = await api.get(`/api/sessions/my-session/${id}`);
        setSession(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Impossible de charger la session.");
        setLoading(false);
      }
    };

    fetchSessionData();

    socket.on('session:updated', (updatedSession) => {
      if (updatedSession._id === id) {
        setSession(updatedSession);
      }
    });

    return () => {
      socket.off('session:updated');
    };
  }, [id]);

  const handleCopyLink = () => {
    const inviteLink = `${window.location.origin}/rejoindre/${session.sessionCode}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <PageTransition>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
          <CircularProgress />
        </Box>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <FormContainer maxWidth="sm">
          <Alert severity="error">{error}</Alert>
          <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>Retour Accueil</Button>
        </FormContainer>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <FormContainer maxWidth="md">
        {/* EN-TÊTE DU DASHBOARD */}
        <Box sx={{ textAlign: 'center', mb: 4, position: 'relative' }}>
          <Typography variant="overline" sx={{ fontWeight: 'bold', letterSpacing: 2, color: 'text.secondary' }}>
            TABLEAU DE BORD DÉLÉGUÉ
          </Typography>
          
          {/* Titre + Bouton Aide */}
          <Box display="flex" alignItems="center" justifyContent="center" gap={1} mt={1}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              {session.sessionName}
            </Typography>
            <IconButton onClick={() => setGuideOpen(true)} color="primary">
              <HelpOutline />
            </IconButton>
          </Box>

          <Chip 
            label={session.isActive ? "SESSION ACTIVE" : "SESSION TERMINÉE"} 
            color={session.isActive ? "success" : "default"}
            sx={{ mt: 1, fontWeight: 'bold' }} 
          />
        </Box>

        {/* CARTES D'ACTION */}
        <Card sx={{ mb: 4, borderRadius: '20px', bgcolor: '#e3f2fd', boxShadow: 'none', border: '1px solid #bbdefb' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                <GroupAdd sx={{ verticalAlign: 'middle', mr: 1 }} />
                Inviter des Parrains
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Partagez ce lien dans le groupe WhatsApp de la classe.
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={handleCopyLink}
              startIcon={copied ? <Check /> : <ContentCopy />}
              color={copied ? "success" : "primary"}
              sx={{ borderRadius: '50px', fontWeight: 'bold', textTransform: 'none' }}
            >
              {copied ? "Lien Copié !" : "Copier le lien d'invitation"}
            </Button>
          </CardContent>
        </Card>

        {/* STATISTIQUES RAPIDES */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, px: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            Parrains Inscrits ({session.sponsors.length})
          </Typography>
        </Box>

        {/* LISTE DES PARRAINS EN TEMPS RÉEL */}
        <List sx={{ bgcolor: 'background.paper', borderRadius: '16px', overflow: 'hidden' }}>
          <AnimatePresence>
            {[...session.sponsors].reverse().map((sponsor, index) => (
              <motion.div
                key={index} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ListItem 
                  divider 
                  secondaryAction={
                    <Tooltip title="Contacter sur WhatsApp">
                      <IconButton edge="end" aria-label="whatsapp" href={`https://wa.me/225${sponsor.phone.replace(/\s/g, '')}`} target="_blank">
                        <WhatsApp color="success" />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#1976d2' }}>
                      <Person />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight="bold">
                        {sponsor.name}
                      </Typography>
                    }
                    secondary={sponsor.phone}
                  />
                  {index === 0 && (
                    <Chip label="Nouveau" color="secondary" size="small" sx={{ mr: 2 }} />
                  )}
                </ListItem>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {session.sponsors.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
              <Typography>Aucun parrain pour le moment.</Typography>
              <Typography variant="caption">Partagez le lien pour commencer !</Typography>
            </Box>
          )}
        </List>

        {/* MODAL GUIDE */}
        <AnimatedModal open={guideOpen} onClose={() => setGuideOpen(false)}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Guide Délégué 🎓
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>1. Recruter les Parrains :</Typography>
            <Typography variant="body2" paragraph>
              Cliquez sur "Copier le lien d'invitation" et collez-le dans le groupe WhatsApp de votre classe (2ème année). Les volontaires s'inscriront eux-mêmes.
            </Typography>

            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>2. Le Jour J (En classe de 1ère année) :</Typography>
            <Typography variant="body2" paragraph>
              Écrivez le <strong>Code LOKO : {session.sessionCode}</strong> au tableau.
              Dites aux nouveaux d'aller sur le site, d'entrer leur nom et ce code.
            </Typography>

            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>3. Suivi :</Typography>
            <Typography variant="body2">
              Surveillez cette page. Les parrains s'affichent en temps réel. Une fois la séance finie, vous pourrez fermer la session (bientôt disponible).
            </Typography>
          </Box>
          <Button fullWidth variant="contained" onClick={() => setGuideOpen(false)} sx={{ mt: 3, borderRadius: '50px' }}>
            Compris !
          </Button>
        </AnimatedModal>

      </FormContainer>
    </PageTransition>
  );
};

export default DelegateDashboardPage;
