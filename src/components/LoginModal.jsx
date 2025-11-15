// src/components/LoginModal.jsx

import React, { useState } from 'react';
import {
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
  Link as MuiLink,
  Stack
} from '@mui/material';
import { Visibility, VisibilityOff, Login } from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import AnimatedModal from './AnimatedModal';

// Styles
const pillTextFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '50px',
    backgroundColor: '#f9f9f9',
    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      border: '2px solid',
      borderColor: 'primary.main',
    },
  },
};

const LoginModal = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Connexion via l'API
      const { data } = await api.post('/api/auth/login', { email, password });

      // 2. Enregistrement dans le contexte
      login(data);
      setLoading(false);
      onClose(); // Fermer le modal

      // 3. REDIRECTION INTELLIGENTE (Le "Triage")
      if (data.role === 'delegue') {
        navigate('/delegue/sessions');
      } else if (data.role === 'superadmin' || data.role === 'eternal') {
        navigate('/superadmin/dashboard');
      } else {
        // Cas par défaut (sécurité)
        navigate('/');
      }

    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Identifiants incorrects.');
    }
  };

  const handleRegisterRedirect = () => {
    onClose();
    navigate('/register');
  };

  return (
    <AnimatedModal open={open} onClose={onClose} maxWidth="xs">
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Login sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
        <Typography variant="h5" fontWeight="bold">
          Espace Admin
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Connectez-vous pour gérer vos sessions.
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          label="Email"
          fullWidth
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          sx={{ ...pillTextFieldSx, mb: 2 }}
        />
        
        <TextField
          label="Mot de passe"
          type={showPassword ? 'text' : 'password'}
          fullWidth
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          sx={{ ...pillTextFieldSx, mb: 2 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end" sx={{ mr: 1 }}>
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert>}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={loading}
          sx={{ borderRadius: '50px', py: 1.5, fontWeight: 'bold', mb: 2 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrer'}
        </Button>

        <Typography variant="body2" align="center">
          Nouveau Délégué ?{' '}
          <MuiLink 
            component="button" 
            type="button"
            fontWeight="bold" 
            onClick={handleRegisterRedirect}
            underline="hover"
          >
            S'inscrire ici
          </MuiLink>
        </Typography>
      </Box>
    </AnimatedModal>
  );
};

export default LoginModal;