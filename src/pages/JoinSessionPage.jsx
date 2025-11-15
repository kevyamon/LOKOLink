// src/pages/JoinSessionPage.jsx

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { HowToReg, WhatsApp } from '@mui/icons-material';
import api from '../services/api';
import FormContainer from '../components/FormContainer';
import { PageTransition } from '../components/PageTransition';

const pillTextFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '50px',
    backgroundColor: '#f9f9f9',
    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
  },
};

const JoinSessionPage = () => {
  const { code } = useParams(); // On récupère le code depuis l'URL (ex: /rejoindre/LOKO-123)
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [sessionCode, setSessionCode] = useState(code || '');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [sessionName, setSessionName] = useState('');

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
              width: 80, height: 80, 
              borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2 
            }}>
              <HowToReg sx={{ fontSize: 40, color: '#2e7d32' }} />
            </Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom color="success.main">
              Félicitations !
            </Typography>
            <Typography variant="h6" paragraph>
              Vous êtes officiellement Parrain/Marraine pour la session :
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>
              {sessionName}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              Merci pour votre engagement. Le délégué a reçu votre inscription en temps réel.
            </Typography>
            <Button 
              variant="outlined" 
              sx={{ mt: 4, borderRadius: '50px' }}
              onClick={() => navigate('/')}
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
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Devenir Parrain 🤝
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Rejoignez l'aventure et aidez les nouveaux étudiants.
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
           {/* Champ Code LOKO (Pré-rempli si lien, mais modifiable au cas où) */}
           <TextField
            label="Code de la Session"
            fullWidth
            required
            value={sessionCode}
            onChange={(e) => setSessionCode(e.target.value)}
            disabled={loading || !!code} // Désactivé si passé dans l'URL pour éviter les erreurs
            sx={{ ...pillTextFieldSx, mb: 2 }}
          />

          <TextField
            label="Votre Nom Complet"
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            sx={{ ...pillTextFieldSx, mb: 2 }}
          />

          <TextField
            label="Numéro WhatsApp"
            type="tel"
            fullWidth
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
            sx={{ ...pillTextFieldSx, mb: 3 }}
            InputProps={{
              startAdornment: <WhatsApp sx={{ color: 'text.secondary', mr: 1 }} />,
            }}
          />

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '16px' }}>{error}</Alert>}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            sx={{ 
              py: 1.5, 
              fontSize: '1.1rem', 
              fontWeight: 'bold',
              borderRadius: '50px',
              boxShadow: '0 4px 14px rgba(25, 118, 210, 0.4)'
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Je m'inscris !"}
          </Button>
        </Box>
      </FormContainer>
    </PageTransition>
  );
};

export default JoinSessionPage;