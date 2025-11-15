// src/pages/LoginPage.jsx

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
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import FormContainer from '../components/FormContainer';
import { PageTransition } from '../components/PageTransition';

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

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // États du formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Handlers pour l'icône œil
  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  // Gestion de la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Appel API
      const { data } = await api.post('/api/auth/login', { email, password });

      // 2. Connexion dans le contexte
      login(data); // data = { _id, email, role, token }

      setLoading(false);
      
      // 3. REDIRECTION (C'est ici qu'on a modifié)
      if (data.role === 'delegue') {
        navigate('/delegue/sessions'); // <--- On va vers la liste des sessions
      } else if (data.role === 'superadmin' || data.role === 'eternal') {
        navigate('/superadmin/dashboard');
      } else {
        navigate('/');
      }

    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect.');
    }
  };

  return (
    <PageTransition>
      <FormContainer maxWidth="sm">
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
          Connexion
        </Typography>
        <Typography gutterBottom align="center" sx={{ mb: 3 }}>
          Accès Délégué & Administrateur
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          {/* Email */}
          <TextField
            type="email"
            label="Email"
            variant="outlined"
            fullWidth
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            sx={{ ...pillTextFieldSx, mb: 2 }}
          />
          
          {/* Mot de passe */}
          <TextField
            type={showPassword ? 'text' : 'password'}
            label="Mot de passe"
            variant="outlined"
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            error={Boolean(error)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ mr: 1 }}>
                  <IconButton
                    aria-label="afficher/masquer le mot de passe"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={pillTextFieldSx}
          />

          {error && (
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
            sx={{ mt: 3, mb: 2, ...pillButtonSx() }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Connexion'}
          </Button>

          <Typography variant="body2" align="center">
            Pas encore de compte ?{' '}
            <MuiLink component={RouterLink} to="/register" fontWeight="bold">
              S'inscrire
            </MuiLink>
          </Typography>
        </Box>
      </FormContainer>
    </PageTransition>
  );
};

export default LoginPage;