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
} from '@mui/material';
import { Lock } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import FormContainer from '../components/FormContainer';
import { PageTransition } from '../components/PageTransition';
import AnimatedModal from '../components/AnimatedModal';

// --- Styles Gélule (inchangés) ---
const pillTextFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '50px',
    backgroundColor: '#f9f9f9',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      border: '2px solid',
      borderColor: 'primary.main',
    },
    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
  },
};

const pillButtonSx = (color = 'primary') => ({
  fontWeight: 'bold',
  borderRadius: '50px',
  padding: '12px 0',
  fontSize: '1rem',
  backgroundColor: color === 'primary' ? '#1976d2' : '#2E7D32',
  boxShadow: `0 4px 12px rgba(${color === 'primary' ? '25, 118, 210' : '46, 125, 50'}, 0.4)`,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    backgroundColor: color === 'primary' ? '#1565c0' : '#388E3C',
    transform: 'translateY(-2px)',
    boxShadow: `0 6px 16px rgba(${color === 'primary' ? '25, 118, 210' : '46, 125, 50'}, 0.5)`,
  },
});

// --- Hook Utilitaire pour la taille de l'écran ---
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

// --- COMPOSANT ANIMÉ NUMÉRO (CORRIGÉ) ---
const AnimatedPhoneNumber = ({ phoneNumber }) => {
  const [displayedNumber, setDisplayedNumber] = useState('');
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!phoneNumber) {
      setDisplayedNumber('');
      return;
    }

    setDisplayedNumber('');
    const strPhone = String(phoneNumber); // Force string
    const digits = strPhone.split('');
    let currentIndex = 0;

    if (timeoutRef.current) clearInterval(timeoutRef.current);

    timeoutRef.current = setInterval(() => {
      // CORRECTION ICI : Vérification stricte
      if (currentIndex < digits.length) {
        const digit = digits[currentIndex];
        if (digit !== undefined) {
           setDisplayedNumber((prev) => prev + digit);
        }
        currentIndex++;
      } else {
        clearInterval(timeoutRef.current);
      }
    }, 500);

    return () => {
      if (timeoutRef.current) clearInterval(timeoutRef.current);
    };
  }, [phoneNumber]);

  return (
    <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Contact :
      </Typography>
      <Typography
        variant="h4"
        component="div"
        sx={{
          fontWeight: 'bold',
          color: '#d32f2f',
          letterSpacing: '4px',
          fontFamily: 'monospace',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
          minHeight: '40px',
          maxWidth: '100%',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}
      >
        {displayedNumber}
      </Typography>
    </Box>
  );
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

  // 1. Charger les détails de la session
  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        const { data } = await api.get(`/api/sessions/${sessionID}`);
        setSessionName(data.sessionName);
      } catch (err) {
        console.error('Erreur chargement session', err);
        const message = err.response?.data?.message || "Cette session n'existe pas.";
        setError(message);
        if (!message.includes('terminée')) {
           setTimeout(() => navigate('/'), 3000);
        }
      }
    };
    fetchSessionDetails();
  }, [sessionID, navigate]);

  // 2. Gestion Timer Confettis
  useEffect(() => {
    if (pairingResult) {
      const timer = setTimeout(() => {
        setRecycleConfetti(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [pairingResult]);

  // 3. Gestion Compte à Rebours
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
      }, 700);
      return () => clearInterval(countdownInterval);
    } else {
      setCountdown(null);
    }
  }, [pairingResult]);

  // 4. Soumission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!godchildGender || !sessionCode) {
      setError('Veuillez sélectionner votre genre et entrer le Code LOKO.');
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
      setShowErrorModal(true);
    }
  };

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
    setError(null);
  };

  // --- Rendu ---

  if (pairingResult) {
    const genreText = godchildGender === 'Homme' ? 'le Filleul' : 'la Filleule';
    return (
      <PageTransition>
        <Confetti
          width={width}
          height={height}
          numberOfPieces={400}
          gravity={0.15}
          recycle={recycleConfetti}
        />
        
        <FormContainer maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" component="div" gutterBottom>
              🥳🎉🎊
            </Typography>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Félicitations, {godchildName} !
            </Typography>
            <Typography variant="h6" sx={{ mt: 3 }}>
              Vous êtes {genreText} de :
            </Typography>
            
            <AnimatePresence mode="wait">
              {countdown > 0 && (
                <motion.div
                  key="countdown"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.3 }}
                >
                  <Typography variant="h2" color="primary" sx={{ mt: 2, mb: 2, fontWeight: '900' }}>
                    {countdown}
                  </Typography>
                </motion.div>
              )}
              {countdown === 0 && (
                <motion.div
                  key="sponsorName"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20
                  }}
                  style={{ display: 'inline-block' }}
                >
                  <Typography variant="h3" color="primary" sx={{ mt: 2, mb: 2, fontWeight: '900', textTransform: 'uppercase' }}>
                    {pairingResult.sponsorName}
                  </Typography>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatedPhoneNumber phoneNumber={pairingResult.sponsorPhone} />

            <Button
              variant="contained"
              onClick={() => navigate('/')}
              sx={{ mt: 4, ...pillButtonSx() }}
            >
              Retour à l'accueil
            </Button>
          </Box>
        </FormContainer>
      </PageTransition>
    );
  }
  
  if (error && !showErrorModal && !pairingResult) {
     return (
        <PageTransition>
          <FormContainer maxWidth="sm">
             <Alert severity="error" sx={{ borderRadius: '16px' }}>{error}</Alert>
             <Button
                variant="contained"
                onClick={() => navigate('/')}
                sx={{ mt: 3, ...pillButtonSx() }}
              >
                Retour à l'accueil
              </Button>
          </FormContainer>
        </PageTransition>
     );
  }

  return (
    <PageTransition>
      <>
        <FormContainer maxWidth="sm">
          <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
            {sessionName}
          </Typography>
          <Typography variant="h6" align="center" gutterBottom>
            Recherche de Parrain/Marraine
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField
              label="Entrez votre nom complet"
              fullWidth
              required
              value={godchildName}
              onChange={(e) => setGodchildName(e.target.value)}
              disabled={loading}
              sx={{ ...pillTextFieldSx, mb: 2 }}
            />
            
            <TextField
              label="Code LOKO de la session"
              helperText="Code fourni par votre délégué."
              fullWidth
              required
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value)}
              disabled={loading}
              sx={{ ...pillTextFieldSx, mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end" sx={{ mr: 1 }}>
                    <Lock />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl component="fieldset" required disabled={loading} error={Boolean(error && error.includes('genre'))} sx={{ ml: 2, mb: 1 }}>
              <FormLabel component="legend">Je suis :</FormLabel>
              <RadioGroup
                row
                name="godchildGender"
                value={godchildGender}
                onChange={(e) => setGodchildGender(e.target.value)}
              >
                <FormControlLabel value="Homme" control={<Radio />} label="un Homme" />
                <FormControlLabel value="Femme" control={<Radio />} label="une Femme" />
              </RadioGroup>
            </FormControl>

            {error && !showErrorModal && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: '16px' }}>{error}</Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mt: 3, ...pillButtonSx('success') }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Trouver mon parrain'}
            </Button>
          </Box>
        </FormContainer>

        <AnimatedModal open={showErrorModal} onClose={handleCloseErrorModal}>
          <Typography variant="h6" component="h2" gutterBottom>
            {error === "Code LOKO incorrect." ? "Code Incorrect" : "Information"}
          </Typography>
          <Typography sx={{ mt: 2 }}>{error}</Typography>
          <Button variant="contained" fullWidth onClick={handleCloseErrorModal} sx={{ mt: 3, ...pillButtonSx() }}>
            Fermer
          </Button>
        </AnimatedModal>
      </>
    </PageTransition>
  );
};

export default SessionPage;