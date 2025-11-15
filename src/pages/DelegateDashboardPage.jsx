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
  Badge,
} from '@mui/material';
import { 
  ContentCopy, 
  Person, 
  WhatsApp, 
  Check, 
  QrCode2,
  GroupAdd
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../services/api';
import socket from '../services/socket'; // Notre connexion temps réel
import FormContainer from '../components/FormContainer';
import { PageTransition } from '../components/PageTransition';

const DelegateDashboardPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // 1. Charger les données initiales
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

    // 2. Écouter les mises à jour en temps réel (Socket.io)
    socket.on('session:updated', (updatedSession) => {
      // On vérifie que c'est bien NOTRE session qui a bougé
      if (updatedSession._id === id) {
        setSession(updatedSession);
      }
    });

    // Nettoyage quand on quitte la page
    return () => {
      socket.off('session:updated');
    };
  }, [id]);

  const handleCopyLink = () => {
    // Générer le lien d'invitation
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
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="overline" sx={{ fontWeight: 'bold', letterSpacing: 2, color: 'text.secondary' }}>
            TABLEAU DE BORD DÉLÉGUÉ
          </Typography>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mt: 1 }}>
            {session.sessionName}
          </Typography>
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
          {/* Ici on pourrait ajouter un bouton pour vider la liste ou exporter */}
        </Box>

        {/* LISTE DES PARRAINS EN TEMPS RÉEL */}
        <List sx={{ bgcolor: 'background.paper', borderRadius: '16px', overflow: 'hidden' }}>
          <AnimatePresence>
            {/* On inverse la liste pour voir les derniers inscrits en haut */}
            {[...session.sponsors].reverse().map((sponsor, index) => (
              <motion.div
                key={index} // Idéalement utiliser un ID unique si dispo, sinon index est ok pour l'affichage simple
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
                  {/* Badge "Nouveau" si c'est le tout premier de la liste inversée (le dernier ajouté) */}
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

      </FormContainer>
    </PageTransition>
  );
};

export default DelegateDashboardPage;