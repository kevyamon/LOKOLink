  // src/pages/RegisterPage.jsx

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

// --- Styles Gélule (déclarées plus bas) ---

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // États du formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registrationCode, setRegistrationCode] = useState(''); // Le code d'invitation
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
    
    // 1. Vérification du mot de passe
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // 2. Appeler la nouvelle route d'inscription
      const { data } = await api.post('/api/auth/register', {
        email,
        password,
        registrationCode, // On envoie le code d'invitation
      });

      // 3. SUCCÈS: On connecte l'utilisateur directement
      login(data);

      setLoading(false);
      
      // 4. Rediriger (on suppose qu'il va créer une session)
      if (data.role === 'delegue') {
        navigate('/delegue/creer');
      } else {
        navigate('/superadmin/dashboard');
      }

    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Erreur. Vérifiez vos informations.');
    }
  };

  return (
    <PageTransition>
      <FormContainer maxWidth="sm">
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
          Inscription
        </Typography>
        <Typography gutterBottom align="center" sx={{ mb: 3 }}>
          Pour Délégués & Super-Admins
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          {/* Email */}
          <TextField
            type="email"
            label="Email"
            fullWidth
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            sx={{ ...pillTextFieldSx, mb: 2 }}
          />
          
          {/* Code d'inscription */}
          <TextField
            type="text"
            label="Code d'invitation"
            fullWidth
            required
            value={registrationCode}
            onChange={(e) => setRegistrationCode(e.target.value)}
            disabled={loading}
            sx={{ ...pillTextFieldSx, mb: 2 }}
            helperText="Code unique fourni par un administrateur."
          />

          {/* Mot de passe */}
          <TextField
            type={showPassword ? 'text' : 'password'}
            label="Mot de passe"
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            sx={{ ...pillTextFieldSx, mb: 2 }}
            helperText="Minimum 6 caractères."
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ mr: 1 }}>
                  <IconButton onClick={handleClickShowPassword} onMouseDown={handleMouseDownPassword} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Confirmer Mot de passe */}
          <TextField
            type={showPassword ? 'text' : 'password'}
            label="Confirmer le mot de passe"
            fullWidth
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            error={Boolean(error && error.includes('correspondent'))}
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
            sx={{ mt: 3, mb: 2, ...pillButtonSx('success') }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "S'inscrire"}
          </Button>

          <Typography variant="body2" align="center">
            Déjà un compte ?{' '}
            <MuiLink component={RouterLink} to="/login" fontWeight="bold">
              Se connecter
            </MuiLink>
          </Typography>
        </Box>
      </FormContainer>
    </PageTransition>
  );
};

// Styles Gélule (Définitions complètes pour la Règle 3)
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

export default RegisterPage;
