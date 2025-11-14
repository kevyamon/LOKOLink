  // src/pages/EternalRegisterPage.jsx

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
import { Visibility, VisibilityOff, VpnKey } from '@mui/icons-material';
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

const EternalRegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // États du formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [eternalKey, setEternalKey] = useState(''); // La Clé Maîtresse
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
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // 1. Appeler la route d'inscription "Eternal"
      const { data } = await api.post('/api/auth/register-eternal', {
        email,
        password,
        eternalKey, // On envoie la clé .env
      });

      // 2. SUCCÈS: On connecte l'utilisateur "Eternal"
      login(data);

      setLoading(false);
      
      // 3. Rediriger vers le Dashboard
      navigate('/superadmin/dashboard');

    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Erreur. Clé Maîtresse invalide ou email déjà pris.');
    }
  };

  return (
    <PageTransition>
      <FormContainer maxWidth="sm">
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
          Fondation
        </Typography>
        <Typography gutterBottom align="center" sx={{ mb: 3 }}>
          Création du compte "Eternal"
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
          
          {/* Clé Maîtresse */}
          <TextField
            type="password"
            label="Clé Maîtresse (Eternal Key)"
            fullWidth
            required
            value={eternalKey}
            onChange={(e) => setEternalKey(e.target.value)}
            disabled={loading}
            sx={{ ...pillTextFieldSx, mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ mr: 1 }}>
                  <VpnKey />
                </InputAdornment>
              ),
            }}
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
            sx={{ mt: 3, mb: 2, ...pillButtonSx('primary') }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Créer le compte Maître"}
          </Button>

          <Typography variant="body2" align="center">
            Retour à la{' '}
            <MuiLink component={RouterLink} to="/login" fontWeight="bold">
              Connexion
            </MuiLink>
          </Typography>
        </Box>
      </FormContainer>
    </PageTransition>
  );
};

export default EternalRegisterPage;
