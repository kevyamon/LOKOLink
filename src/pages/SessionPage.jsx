// src/pages/SessionPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import {
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  InputAdornment,
  Avatar,
  Stack,
  Chip,
  Card,
  CardContent,
  CardActionArea,
  Divider // <--- LE COUPABLE EST LÀ (Ajouté)
} from '@mui/material';
import { 
  Lock, 
  Home, 
  WhatsApp, 
  Person, 
  EmojiEvents, 
  Verified, 
  People 
} from '@mui/icons-material'; 
import { useParams, useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import FormContainer from '../components/FormContainer';
import { PageTransition } from '../components/PageTransition';
import AnimatedModal from '../components/AnimatedModal';

// --- Styles Gélule (Input) Améliorés ---
const pillTextFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '50px',
    backgroundColor: '#f5f5f5', // Gris très léger pour le contraste
    border: '1px solid #e0e0e0', // Bordure fine pour la visibilité
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#eeeeee',
      borderColor: '#bdbdbd',
    },
    '&.Mui-focused': {
      backgroundColor: '#fff',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      border: '2px solid',
      borderColor: 'primary.main',
    },
    '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, // On cache la bordure par défaut de MUI
  },
  '& .MuiInputLabel-root': {
    fontWeight: '500', // Label plus gras
  }
};

// --- Styles Bouton Standard ---
const pillButtonSx = (color = 'primary') => ({
  fontWeight: 'bold',
  borderRadius: '50px',
  padding: '14px 0', // Un peu plus haut
  fontSize: '1.1rem', // Texte plus gros
  textTransform: 'none', // Pas de MAJUSCULES forcées, plus lisible
  backgroundColor: color === 'primary' ? '#1976d2' : '#2E7D32',
  boxShadow: `0 6px 14px rgba(${color === 'primary' ? '25, 118, 210' : '46, 125, 50'}, 0.3)`,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    backgroundColor: color === 'primary' ? '#1565c0' : '#388E3C',
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 20px rgba(${color === 'primary' ? '25, 118, 210' : '46, 125, 50'}, 0.4)`,
  },
});

// --- Hook Taille Fenêtre ---
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return windowSize;
};

const SessionPage = () => {
  const { id: sessionID } = useParams();
  const navigate = useNavigate();
  const { width, height } = useWindowSize();

  // --- États ---
  const [godchildName, setGodchildName] = useState('');
  const [godchildGender, setGodchildGender] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  
  const [sessionName, setSessionName] = useState('...');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [pairingResult, setPairingResult] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const [recycleConfetti, setRecycleConfetti] = useState(true);
  const [countdown, setCountdown] = useState(null);

  const [isCriticalError, setIsCriticalError] = useState(false);

  // 1. Charger les détails
  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        const { data } = await api.get(`/api/sessions/${sessionID}`);
        setSessionName(data.sessionName);
      } catch (err) {
        console.error('Erreur chargement session', err);
        const message = err.response?.data?.message || "Cette session n'est plus disponible.";
        setError(message);
        setIsCriticalError(true); 
      }
    };
    fetchSessionDetails();
  }, [sessionID]);

  // 2. Confettis
  useEffect(() => {
    if (pairingResult) {
      const timer = setTimeout(() => {
        setRecycleConfetti(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [pairingResult]);

  // 3. Compte à rebours
  useEffect(() => {
    if (pairingResult) {
      setCountdown(3);
      let count = 3;
      const countdownInterval = setInterval(() => {
        count--;
        if (count >= 1) {
          setCountdown(count);
        } else {
          setCountdown(0);
          clearInterval(countdownInterval);
        }
      }, 800); 
      return () => clearInterval(countdownInterval);
    }
  }, [pairingResult]);

  // 4. Soumission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!godchildGender || !sessionCode) {
      setError('Veuillez sélectionner votre genre et entrer le Code LOKO.');
      setShowErrorModal(true);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post('/api/pairings/find', {
        godchildName,
        godchildGender,
        sessionID,
        sessionCode,
      });

      await new Promise(r => setTimeout(r, 500)); // Petit délai UX

      setLoading(false);
      setPairingResult({
        sponsorName: data.sponsorName,
        sponsorPhone: data.sponsorPhone,
      });
      setRecycleConfetti(true);

    } catch (err) {
      setLoading(false);
      const errorMessage = err.response?.data?.message || 'Une erreur est survenue.';
      setError(errorMessage);
      
      if (errorMessage.includes('terminée') || errorMessage.includes('introuvable')) {
        setIsCriticalError(true);
      } else {
        setShowErrorModal(true);
      }
    }
  };

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
    setError(null);
  };

  // --- RENDU CRITIQUE ---
  if (isCriticalError) {
    return (
      <PageTransition>
        <FormContainer maxWidth="sm">
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>⚠️</Typography>
            <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'error.main' }}>
              Session Indisponible
            </Typography>
            <Typography variant="body1" sx={{ mb: 4 }}>
              {error || "Cette session a été supprimée ou n'existe plus."}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Home />}
              onClick={() => navigate('/')}
              sx={{ ...pillButtonSx(), px: 4 }}
            >
              Retour à l'accueil
            </Button>
          </Box>
        </FormContainer>
      </PageTransition>
    );
  }

  // --- RENDU SUCCÈS (LE REVEAL) ---
  if (pairingResult) {
    const genreText = godchildGender === 'Homme' ? 'le Filleul' : 'la Filleule';
    const isDuo = pairingResult.sponsorName.includes('&'); 

    return (
      <PageTransition>
        <Confetti
          width={width}
          height={height}
          numberOfPieces={500}
          gravity={0.12}
          colors={['#FFD700', '#ff0000', '#000000', '#ffffff']}
          recycle={recycleConfetti}
        />
        
        <Box sx={{ 
          minHeight: '80vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          p: 2 
        }}>
          <AnimatePresence mode="wait">
            {/* COMPTE À REBOURS */}
            {countdown > 0 && (
              <motion.div
                key="countdown"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                exit={{ scale: 3, opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Typography variant="h1" sx={{ fontWeight: '900', color: 'white', textShadow: '0 0 20px rgba(0,0,0,0.5)', fontSize: '8rem' }}>
                  {countdown}
                </Typography>
              </motion.div>
            )}

            {/* CARTE FINALE */}
            {countdown === 0 && (
              <motion.div
                key="reveal"
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                style={{ width: '100%', maxWidth: '500px' }}
              >
                <Card sx={{ 
                  borderRadius: '30px', 
                  overflow: 'visible',
                  background: 'rgba(255, 255, 255, 0.95)', 
                  boxShadow: '0 20px 50px rgba(0,0,0,0.3)', 
                  position: 'relative',
                  textAlign: 'center'
                }}>
                  <Box sx={{ 
                    height: '120px', 
                    background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)', 
                    borderRadius: '30px 30px 50% 50%',
                    mb: -6 
                  }} />

                  <CardContent sx={{ pt: 0, px: 3, pb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                        <Avatar sx={{ 
                          width: 120, 
                          height: 120, 
                          bgcolor: '#fff', 
                          border: '6px solid #fff',
                          boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                          color: '#d32f2f'
                        }}>
                          {isDuo ? <People sx={{ fontSize: 60 }} /> : <Person sx={{ fontSize: 70 }} />}
                        </Avatar>
                    </Box>

                    <Chip 
                      icon={<Verified />} 
                      label="Parrain Officiel" 
                      color="primary" 
                      size="small" 
                      sx={{ mb: 2, fontWeight: 'bold' }} 
                    />

                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Félicitations <strong>{godchildName}</strong> !
                    </Typography>
                    
                    <Typography variant="body1" color="text.secondary">
                      Tu es {genreText} de :
                    </Typography>

                    <Typography variant="h4" component="h2" sx={{ 
                      fontWeight: '900', 
                      color: '#1a1a1a',
                      mt: 1, 
                      mb: 2,
                      textTransform: 'uppercase',
                      background: '-webkit-linear-gradient(45deg, #1a1a1a 30%, #d32f2f 90%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      letterSpacing: '-1px',
                      lineHeight: 1.1
                    }}>
                      {pairingResult.sponsorName}
                    </Typography>

                    <Divider variant="middle" sx={{ my: 2, borderColor: 'rgba(0,0,0,0.1)' }} />

                    <Stack spacing={2} alignItems="center">
                        <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#333', letterSpacing: 2 }}>
                           {pairingResult.sponsorPhone}
                        </Typography>
                        
                        <motion.div 
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                          style={{ width: '100%' }}
                        >
                            <Button
                                variant="contained"
                                startIcon={<WhatsApp />}
                                fullWidth
                                size="large"
                                href={`https://wa.me/225${pairingResult.sponsorPhone.split('/')[0].replace(/\s/g, '')}`} 
                                target="_blank"
                                sx={{ 
                                    borderRadius: '50px', 
                                    py: 1.5, 
                                    bgcolor: '#25D366', 
                                    fontSize: '1.1rem',
                                    fontWeight: 'bold',
                                    boxShadow: '0 4px 15px rgba(37, 211, 102, 0.4)',
                                    '&:hover': { bgcolor: '#1ebc57' }
                                }}
                            >
                                Contacter Maintenant
                            </Button>
                        </motion.div>
                    </Stack>

                  </CardContent>
                </Card>

                <Button
                  variant="text"
                  onClick={() => navigate('/')}
                  sx={{ mt: 4, color: 'white', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                  startIcon={<Home />}
                >
                  Retour à l'accueil
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </PageTransition>
    );
  }

  // --- RENDU FORMULAIRE ---
  return (
    <PageTransition>
      <>
        <FormContainer maxWidth="sm">
          <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <EmojiEvents fontSize="large" />
              </Avatar>
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                {sessionName}
              </Typography>
              {/* TEXTE MODIFIÉ ICI */}
              <Typography variant="subtitle1" color="text.secondary">
                Ton Parrain t'attend avec impatience !
              </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField
              label="Entrez votre nom complet"
              fullWidth
              required
              value={godchildName}
              onChange={(e) => setGodchildName(e.target.value)}
              disabled={loading}
              sx={{ ...pillTextFieldSx, mb: 3 }}
            />
            
            <TextField
              label="Code LOKO de la session"
              helperText="Code fourni par votre délégué."
              fullWidth
              required
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value)}
              disabled={loading}
              sx={{ ...pillTextFieldSx, mb: 3 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end" sx={{ mr: 1 }}>
                    <Lock color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl component="fieldset" required disabled={loading} error={Boolean(error && error.includes('genre'))} sx={{ width: '100%', mb: 2 }}>
              <FormLabel component="legend" sx={{ mb: 1.5, fontWeight: 'bold', color: 'text.primary' }}>Je suis :</FormLabel>
              <RadioGroup
                row
                name="godchildGender"
                value={godchildGender}
                onChange={(e) => setGodchildGender(e.target.value)}
                sx={{ justifyContent: 'space-between', gap: 2 }}
              >
                <CardActionArea 
                  sx={{ 
                    borderRadius: '16px', 
                    border: godchildGender === 'Homme' ? '2px solid #1976d2' : '1px solid #e0e0e0', 
                    p: 1.5, 
                    flex: 1,
                    bgcolor: godchildGender === 'Homme' ? 'rgba(25, 118, 210, 0.05)' : 'transparent',
                    transition: 'all 0.2s'
                  }} 
                  onClick={() => setGodchildGender('Homme')}
                >
                    <FormControlLabel 
                      value="Homme" 
                      control={<Radio sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }} />} // Radio plus gros
                      label="Un Homme" 
                      sx={{ m: 0, width: '100%', justifyContent: 'center' }} 
                    />
                </CardActionArea>

                <CardActionArea 
                  sx={{ 
                    borderRadius: '16px', 
                    border: godchildGender === 'Femme' ? '2px solid #e91e63' : '1px solid #e0e0e0', 
                    p: 1.5, 
                    flex: 1,
                    bgcolor: godchildGender === 'Femme' ? 'rgba(233, 30, 99, 0.05)' : 'transparent',
                    transition: 'all 0.2s'
                  }} 
                  onClick={() => setGodchildGender('Femme')}
                >
                    <FormControlLabel 
                      value="Femme" 
                      control={<Radio color="secondary" sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }} />} // Radio plus gros
                      label="Une Femme" 
                      sx={{ m: 0, width: '100%', justifyContent: 'center' }} 
                    />
                </CardActionArea>
              </RadioGroup>
            </FormControl>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mt: 3, ...pillButtonSx('success') }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Révéler mon Parrain'}
            </Button>
          </Box>
        </FormContainer>

        <AnimatedModal open={showErrorModal} onClose={handleCloseErrorModal}>
          <Typography variant="h6" component="h2" gutterBottom color="error" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lock /> Oups !
          </Typography>
          <Typography sx={{ mt: 2 }}>{error}</Typography>
          <Button variant="contained" fullWidth onClick={handleCloseErrorModal} sx={{ mt: 3, ...pillButtonSx() }}>
            Réessayer
          </Button>
        </AnimatedModal>
      </>
    </PageTransition>
  );
};

export default SessionPage;