// src/pages/JoinSessionPage.jsx

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  InputAdornment,
  Avatar
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { HowToReg, WhatsApp, Lock, Person, Handshake } from '@mui/icons-material';
import api from '../services/api';
import FormContainer from '../components/FormContainer';
import { PageTransition } from '../components/PageTransition';
import { useData } from '../contexts/DataContext'; // <--- IMPORT CRUCIAL

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
  padding: '14px 0',
  fontSize: '1.1rem',
  backgroundColor: color === 'primary' ? '#1976d2' : '#2E7D32',
  boxShadow: `0 4px 12px rgba(${color === 'primary' ? '25, 118, 210' : '46, 125, 50'}, 0.4)`,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    backgroundColor: color === 'primary' ? '#1565c0' : '#388E3C',
    transform: 'translateY(-2px)',
    boxShadow: `0 6px 16px rgba(${color === 'primary' ? '25, 118, 210' : '46, 125, 50'}, 0.5)`,
  },
});

const JoinSessionPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { markHomeAsReady } = useData(); // <--- Récupération du signal

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [sessionCode, setSessionCode] = useState(code || '');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [sessionName, setSessionName] = useState('');

  // 1. SIGNAL "JE SUIS PRÊT" (Débloque le Splash)
  useEffect(() => {
    markHomeAsReady();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post('/api/sessions/join', {
        sessionCode,
        name,
        phone,
      });

      setSessionName(data.sessionName);
      setSuccess(true);
      setLoading(false);
      
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || "Erreur lors de l'inscription.");
    }
  };

  if (success) {
    return (
      <PageTransition>
        <FormContainer maxWidth="sm">
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Box sx={{ 
              bgcolor: '#e8f5e9', 
              width: 100, height: 100, 
              borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 3,
              boxShadow: '0 10px 30px rgba(46, 125, 50, 0.2)'
            }}>
              <Handshake sx={{ fontSize: 60, color: '#2e7d32' }} />
            </Box>
            <Typography variant="h4" fontWeight="900" gutterBottom color="success.main">
              Félicitations !
            </Typography>
            <Typography variant="h6" paragraph sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              Tu es officiellement Parrain pour :
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
              {sessionName}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 4 }}>
              Merci pour ton engagement. Les étudiants pourront bientôt te découvrir !
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/')}
              sx={{ borderRadius: '50px', px: 4, py: 1, fontWeight: 'bold' }}
            >
              Retour à l'accueil
            </Button>
          </Box>
        </FormContainer>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <FormContainer maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'primary.main', width: 60, height: 60, boxShadow: '0 4px 10px rgba(25, 118, 210, 0.3)' }}>
             <HowToReg fontSize="large" />
          </Avatar>
          <Typography variant="h4" component="h1" fontWeight="900" gutterBottom>
            Devenir Parrain 🤝
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Rejoins l'aventure et guide les nouveaux étudiants.
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
           <TextField
            label="Code de la Session"
            fullWidth
            required
            value={sessionCode}
            onChange={(e) => setSessionCode(e.target.value)}
            disabled={loading || !!code} 
            sx={{ ...pillTextFieldSx, mb: 3 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
            }}
          />

          <TextField
            label="Ton Nom Complet"
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            sx={{ ...pillTextFieldSx, mb: 3 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Person color="action" /></InputAdornment>,
            }}
          />

          <TextField
            label="Numéro WhatsApp"
            type="tel"
            fullWidth
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
            sx={{ ...pillTextFieldSx, mb: 4 }}
            helperText="Pour que ton filleul puisse te contacter."
            InputProps={{
              startAdornment: <InputAdornment position="start"><WhatsApp sx={{ color: '#25D366' }} /></InputAdornment>,
            }}
          />

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '16px' }}>{error}</Alert>}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            sx={{ ...pillButtonSx('primary') }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Je m'inscris !"}
          </Button>
        </Box>
      </FormContainer>
    </PageTransition>
  );
};

export default JoinSessionPage;