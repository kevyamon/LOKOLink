// src/pages/SessionCreatePage.jsx

import React, { useState } from 'react';
import {
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Fade,
  InputAdornment, // Pour l'icône
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Lock } from '@mui/icons-material'; // Icône pour le code
import api from '../services/api';
import FormContainer from '../components/FormContainer';
import { PageTransition } from '../components/PageTransition';
// Nous n'avons pas besoin de useAuth ici, le "garde" dans App.jsx fait le travail

// --- Styles Gélule ---
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

const SessionCreatePage = () => {
  const navigate = useNavigate();

  // États du formulaire
  const [sessionName, setSessionName] = useState('');
  const [sessionCode, setSessionCode] = useState(''); // 1. NOUVEL ÉTAT
  const [sponsorsList, setSponsorsList] = useState('');

  // États de retour
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Gestion du téléversement de fichier .txt (inchangé)
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSponsorsList(e.target.result);
      };
      reader.readAsText(file);
    } else {
      setError('Veuillez sélectionner un fichier .txt valide.');
    }
    event.target.value = null;
  };

  // Gestion de la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 2. Envoyer le 'sessionCode' au backend
      const { data } = await api.post('/api/sessions/create', {
        sessionName,
        sponsorsList,
        sessionCode, // Ajouté
      });

      // SUCCÈS (inchangé)
      setLoading(false);
      setSuccess(
        `Session "${data.session.sessionName}" créée avec succès ! Vous allez être redirigé.`
      );
      setError(null);
      setSessionName('');
      setSessionCode('');
      setSponsorsList('');
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (err) {
      setLoading(false);
      setError(
        err.response?.data?.message ||
          'Erreur serveur. Vérifiez vos données (le nom de session existe peut-être déjà).'
      );
    }
  };

  return (
    <PageTransition>
      <FormContainer maxWidth="md">
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
          Créer une nouvelle session
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          {/* Champ Nom de la session */}
          <TextField
            label="Nom de la session (ex: IACC Groupe A)"
            fullWidth
            required
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            disabled={loading}
            sx={{ ...pillTextFieldSx, mb: 2 }}
          />
          
          {/* 3. NOUVEAU CHAMP "Code LOKO" */}
          <TextField
            label="Code LOKO (ex: IACC2025)"
            helperText="Le code secret que les filleuls devront entrer pour rejoindre cette session."
            fullWidth
            required
            value={sessionCode}
            onChange={(e) => setSessionCode(e.target.value)}
            disabled={loading}
            sx={{ ...pillTextFieldSx, mb: 3 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ mr: 1 }}>
                  <Lock />
                </InputAdornment>
              ),
            }}
          />

          {/* Champ Liste des Parrains/Marraines */}
          <TextField
            label="Liste des Parrains/Marraines"
            variant="outlined"
            fullWidth
            required
            multiline
            rows={10}
            value={sponsorsList}
            onChange={(e) => setSponsorsList(e.target.value)}
            disabled={loading}
            placeholder="Collez votre liste en respectant ce format : Nom Complet, Numéro de Téléphone (un par ligne)."
            helperText="Format attendu : Nom Complet, Numéro de Téléphone (un par ligne)."
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '24px',
                backgroundColor: '#f9f9f9',
              },
            }}
          />

          {/* Bouton de téléversement .txt */}
          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{
              mt: 2,
              borderRadius: '50px',
              padding: '10px 0',
              fontWeight: 'bold',
            }}
            disabled={loading}
          >
            Ou téléverser un fichier .txt
            <input
              type="file"
              hidden
              accept=".txt, text/plain"
              onChange={handleFileUpload}
            />
          </Button>

          {/* Messages de retour */}
          {error && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: '16px' }}>
              {error}
            </Alert>
          )}
          {success && (
            <Fade in={true}>
              <Alert severity="success" sx={{ mt: 2, borderRadius: '16px' }}>
                {success}
              </Alert>
            </Fade>
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
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Créer la session'}
          </Button>
        </Box>
      </FormContainer>
    </PageTransition>
  );
};

export default SessionCreatePage;