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
  InputAdornment, // Pour l'icône
} from '@mui/material';
import { Lock } from '@mui/icons-material'; // Icône pour le code
import { useParams, useNavigate } from 'react-router-dom';
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
// --- Fin Styles ---

const SessionPage = () => {
  const { id: sessionID } = useParams();
  const navigate = useNavigate();

  // --- États ---
  const [godchildName, setGodchildName] = useState('');
  const [godchildGender, setGodchildGender] = useState('');
  const [sessionCode, setSessionCode] = useState(''); // 1. NOUVEL ÉTAT
  
  const [sessionName, setSessionName] = useState('...');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [pairingResult, setPairingResult] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // 1. Charger les détails de la session (inchangé)
  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        const { data } = await api.get(`/api/sessions/${sessionID}`);
        setSessionName(data.sessionName);
      } catch (err) {
        console.error('Erreur chargement session', err);
        // On récupère le message d'erreur (ex: "Session terminée")
        const message = err.response?.data?.message || "Cette session n'existe pas.";
        setError(message);
        // Si la session est terminée, on affiche le message sans rediriger tout de suite
        if (message.includes('terminée')) {
           // On ne redirige pas, on laisse l'erreur s'afficher
        } else {
           setTimeout(() => navigate('/'), 3000);
        }
      }
    };
    fetchSessionDetails();
  }, [sessionID, navigate]);

  // 2. Gestion de la soumission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!godchildGender || !sessionCode) {
      setError('Veuillez sélectionner votre genre et entrer le Code LOKO.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // 3. Envoyer le 'sessionCode' au backend (Plan P3)
      const { data } = await api.post('/api/pairings/find', {
        godchildName,
        godchildGender,
        sessionID,
        sessionCode, // Ajouté
      });

      // 4. SUCCÈS (Plan P4: Retrouver OU Matcher)
      setLoading(false);
      setPairingResult({
        sponsorName: data.sponsorName,
        sponsorPhone: data.sponsorPhone,
      });

    } catch (err) {
      // 5. ÉCHEC (Code LOKO incorrect, Session terminée, Déjà un parrain)
      setLoading(false);
      const errorMessage = err.response?.data?.message || 'Une erreur est survenue.';
      setError(errorMessage);
      setShowErrorModal(true); // Affiche le modal d'erreur
    }
  };

  // 6. Gestion du modal d'erreur (inchangé)
  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
    setError(null);
    // On ne vide pas le nom, au cas où c'est juste le code qui est faux
  };

  // --- Rendu ---

  // Cas 1: Résultat (Félicitations)
  if (pairingResult) {
    const genreText = godchildGender === 'Homme' ? 'le Filleul' : 'la Filleule';
    return (
      <PageTransition>
        <FormContainer maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Félicitations, {godchildName} !
            </Typography>
            <Typography variant="h6" sx={{ mt: 3 }}>
              Vous êtes {genreText} de :
            </Typography>
            <Typography variant="h4" color="primary" sx={{ mt: 2, fontWeight: 'bold' }}>
              {pairingResult.sponsorName}
            </Typography>
            <Typography variant="h5" sx={{ mt: 2 }}>
              Contact : {pairingResult.sponsorPhone}
            </Typography>
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
  
  // Si la session est introuvable ou terminée (erreur de useEffect)
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

  // Cas 2: Formulaire de recherche
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
            {/* Champ Nom Complet */}
            <TextField
              label="Entrez votre nom complet"
              fullWidth
              required
              value={godchildName}
              onChange={(e) => setGodchildName(e.target.value)}
              disabled={loading}
              sx={{ ...pillTextFieldSx, mb: 2 }}
            />
            
            {/* 7. NOUVEAU CHAMP "Code LOKO" */}
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

            {/* Cases à cocher (Genre) */}
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

            {/* Messages d'erreur (inline) */}
            {error && !showErrorModal && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: '16px' }}>
                {error}
              </Alert>
            )}

            {/* Bouton de soumission */}
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

        {/* Modal d'erreur (Code incorrect, Déjà un parrain, etc.) */}
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