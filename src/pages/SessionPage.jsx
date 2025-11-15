// src/pages/SessionPage.jsx

import React, { useState, useEffect } from 'react';
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
import { motion } from 'framer-motion'; // IMPORTER FRAMER MOTION
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
    '& .MuiOutlinedInput-notchedOutline': {
      border: 'none',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      border: '2px solid',
      borderColor: 'primary.main',
    },
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

// --- Hook Utilitaire pour la taille de l'écran (inchangé) ---
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

// --- NOUVEAU COMPOSANT : AnimatedPhoneNumber ---
const AnimatedPhoneNumber = ({ phoneNumber }) => {
  const [displayedNumber, setDisplayedNumber] = useState('');
  const [animationStarted, setAnimationStarted] = useState(false);

  useEffect(() => {
    if (phoneNumber && !animationStarted) {
      setAnimationStarted(true);
      setDisplayedNumber(''); // Réinitialise pour une nouvelle animation
      const digits = phoneNumber.split('');
      let index = 0;

      // Durée totale de l'animation : 5 secondes (5000 ms)
      // Nombre de chiffres : 10
      // Délai entre chaque chiffre : 5000ms / 10 chiffres = 500ms par chiffre
      const interval = setInterval(() => {
        if (index < digits.length) {
          setDisplayedNumber((prev) => prev + digits[index]);
          index++;
        } else {
          clearInterval(interval);
        }
      }, 500); // 500ms de délai entre chaque chiffre

      return () => clearInterval(interval);
    }
  }, [phoneNumber, animationStarted]);

  return (
    <Typography variant="h5" sx={{ mt: 2, fontWeight: 'bold' }}>
      Contact : {displayedNumber}
    </Typography>
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

  // 1. Charger les détails de la session (inchangé)
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

  // 2. Gestion du Timer Confettis (inchangé)
  useEffect(() => {
    if (pairingResult) {
      const timer = setTimeout(() => {
        setRecycleConfetti(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [pairingResult]);

  // 3. Gestion de la soumission (inchangé)
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

  // Cas 1: Résultat (Félicitations + Confettis + Animations)
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
            
            {/* ANIMATION BATTEMENT DE CŒUR (NOM DU PARRAIN) */}
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.05, 1] }} // Battement léger (agrandir, puis revenir)
              transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }} // Animation infinie et douce
              style={{ display: 'inline-block' }} // Pour que l'animation n'affecte pas tout le bloc
            >
              <Typography variant="h3" color="primary" sx={{ mt: 2, mb: 2, fontWeight: '900', textTransform: 'uppercase' }}>
                {pairingResult.sponsorName}
              </Typography>
            </motion.div>

            {/* ANIMATION NUMÉRO DE TÉLÉPHONE CHIFFRE PAR CHIFFRE */}
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
  
  // Cas Erreur critique (inchangé)
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

  // Cas 2: Formulaire de recherche (inchangé)
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
              <Alert severity="error" sx={{ mt: 2, borderRadius: '16px' }}>
                {error}
              </Alert>
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

        <AnimatedModal
          open={showErrorModal}
          onClose={handleCloseErrorModal}
        >
          <Typography variant="h6" component="h2" gutterBottom>
            {error === "Code LOKO incorrect." ? "Code Incorrect" : "Information"}
          </Typography>
          <Typography sx={{ mt: 2 }}>
            {error}
          </Typography>
          <Button
            variant="contained"
            fullWidth
            onClick={handleCloseErrorModal}
            sx={{ mt: 3, ...pillButtonSx() }}
          >
            Fermer
          </Button>
        </AnimatedModal>
      </>
    </PageTransition>
  );
};

export default SessionPage;