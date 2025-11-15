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
  InputAdornment,
  Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Lock, Group, Share } from '@mui/icons-material';
import api from '../services/api';
import FormContainer from '../components/FormContainer';
import { PageTransition } from '../components/PageTransition';

// --- Styles Gélule ---
const pillTextFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '50px',
    backgroundColor: '#f9f9f9',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
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
  const [sessionCode, setSessionCode] = useState('');
  const [expectedGodchildCount, setExpectedGodchildCount] = useState('');
  
  // États de retour
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // --- SOUMISSION ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data } = await api.post('/api/sessions/create', {
        sessionName,
        sessionCode,
        // On envoie une liste vide, le backend sait gérer maintenant
        sponsorsList: "", 
        expectedGodchildCount: expectedGodchildCount ? parseInt(expectedGodchildCount) : 0,
      });

      setLoading(false);
      setSuccess(
        `Session créée ! Préparation du tableau de bord...`
      );
      
      // Redirection vers le Dashboard
      setTimeout(() => {
        navigate(`/delegue/dashboard/${data.session._id}`);
      }, 1500);

    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Erreur serveur. Vérifiez vos données.');
    }
  };

  return (
    <PageTransition>
      <FormContainer maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
           <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Lancer le Parrainage 🚀
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Créez la session et invitez vos camarades via WhatsApp.
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          
          {/* CHAMPS PRINCIPAUX */}
          <TextField
            label="Nom de la session (ex: IACC Groupe A)"
            fullWidth
            required
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            disabled={loading}
            sx={{ ...pillTextFieldSx, mb: 3 }}
          />
          
          <Box sx={{ display: 'flex', gap: 2, mb: 4, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              label="Code LOKO (Secret)"
              fullWidth
              required
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value)}
              disabled={loading}
              sx={{ ...pillTextFieldSx, flex: 1 }}
              helperText="Code à donner aux FILLEULS uniquement."
              InputProps={{
                endAdornment: <InputAdornment position="end" sx={{ mr: 1 }}><Lock /></InputAdornment>,
              }}
            />
            <Tooltip title="Optionnel : Sert à calculer s'il faut créer des binômes de parrains." arrow>
              <TextField
                label="Nb. estimé de filleuls"
                type="number"
                fullWidth
                value={expectedGodchildCount}
                onChange={(e) => setExpectedGodchildCount(e.target.value)}
                disabled={loading}
                sx={{ ...pillTextFieldSx, flex: 1 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end" sx={{ mr: 1 }}><Group /></InputAdornment>,
                }}
              />
            </Tooltip>
          </Box>

          {/* MESSAGES */}
          {error && <Alert severity="error" sx={{ mt: 2, borderRadius: '16px' }}>{error}</Alert>}
          {success && (
            <Fade in={true}>
              <Alert severity="success" sx={{ mt: 2, borderRadius: '16px' }}>{success}</Alert>
            </Fade>
          )}

          {/* SOUMISSION FINALE */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            startIcon={<Share />}
            disabled={loading}
            sx={{ mt: 2, py: 1.5, ...pillButtonSx('success') }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Créer et obtenir le lien'}
          </Button>
        </Box>
      </FormContainer>
    </PageTransition>
  );
};

export default SessionCreatePage;