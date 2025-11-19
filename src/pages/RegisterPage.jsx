// src/pages/RegisterPage.jsx

import React, { useState, useEffect } from 'react';
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
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fade
} from '@mui/material';
import { Visibility, VisibilityOff, CheckCircle, Cancel, RadioButtonUnchecked } from '@mui/icons-material';
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

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // États du formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registrationCode, setRegistrationCode] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // États Sécurité Mot de Passe
  const [passwordScore, setPasswordScore] = useState(0);
  const [criteria, setCriteria] = useState({
    length: false,
    hasLetter: false,
    hasNumber: false,
  });

  // Handlers pour l'icône œil
  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  // ANALYSE DU MOT DE PASSE EN TEMPS RÉEL
  useEffect(() => {
    const newCriteria = {
      length: password.length >= 6,
      hasLetter: /[A-Za-z]/.test(password),
      hasNumber: /\d/.test(password),
    };
    setCriteria(newCriteria);

    // Calcul du score (0 à 100)
    let score = 0;
    if (newCriteria.length) score += 34;
    if (newCriteria.hasLetter) score += 33;
    if (newCriteria.hasNumber) score += 33;
    
    // Ajustement si tout est bon mais très court, on reste à 90 pour le style ? Non 100 c'est bien.
    setPasswordScore(score);

  }, [password]);

  // Couleur de la barre selon le score
  const getProgressColor = () => {
    if (passwordScore < 30) return 'error'; // Rouge
    if (passwordScore < 90) return 'warning'; // Jaune/Orange
    return 'success'; // Vert
  };

  // Gestion de la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Vérification Robustesse
    if (passwordScore < 100) {
      setError('Le mot de passe ne respecte pas les critères de sécurité.');
      return;
    }

    // 2. Vérification Correspondance
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // TENTATIVE A : Inscription Standard
      try {
        const { data } = await api.post('/api/auth/register', {
          email,
          password,
          registrationCode, 
        });
        finalizeLogin(data);
        return;

      } catch (standardError) {
        const msg = standardError.response?.data?.message || '';
        if (!msg.includes('Code') && !msg.includes('code')) {
           throw standardError; 
        }

        // TENTATIVE B : Inscription Eternal
        const { data: eternalData } = await api.post('/api/auth/register-eternal', {
          email,
          password,
          eternalKey: registrationCode, 
        });
        finalizeLogin(eternalData);
      }

    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Erreur. Vérifiez le code ou vos informations.');
    }
  };

  const finalizeLogin = (userData) => {
    login(userData);
    setLoading(false);
    if (userData.role === 'delegue') {
      navigate('/delegue/creer');
    } else {
      navigate('/superadmin/dashboard');
    }
  };

  // Composant item de liste pour les critères
  const CriteriaItem = ({ met, label }) => (
    <ListItem dense sx={{ py: 0 }}>
      <ListItemIcon sx={{ minWidth: 30 }}>
        {met ? <CheckCircle color="success" fontSize="small" /> : <RadioButtonUnchecked color="action" fontSize="small" />}
      </ListItemIcon>
      <ListItemText 
        primary={label} 
        primaryTypographyProps={{ 
          variant: 'caption', 
          color: met ? 'text.primary' : 'text.secondary',
          sx: { textDecoration: met ? 'none' : 'none' }
        }} 
      />
    </ListItem>
  );

  return (
    <PageTransition>
      <FormContainer maxWidth="sm">
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
          Inscription
        </Typography>
        <Typography gutterBottom align="center" sx={{ mb: 3 }}>
          Pour Délégués
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
            helperText="Entrez votre code délégué (ou la Clé Maîtresse)."
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
            sx={{ ...pillTextFieldSx, mb: 1 }} // Réduit la marge pour coller à la barre
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

          {/* BARRE DE SÉCURITÉ & CRITÈRES */}
          <Box sx={{ mb: 2, px: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
               <Typography variant="caption" sx={{ flexGrow: 1, fontWeight: 'bold', color: 'text.secondary' }}>
                 Sécurité : {passwordScore < 30 ? 'Faible' : passwordScore < 90 ? 'Moyen' : 'Fort'}
               </Typography>
               <Typography variant="caption" fontWeight="bold" color={`${getProgressColor()}.main`}>
                 {passwordScore}%
               </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={passwordScore} 
              color={getProgressColor()}
              sx={{ height: 6, borderRadius: 5, mb: 1 }} 
            />
            
            {/* Checklist des exigences */}
            <List disablePadding>
              <CriteriaItem met={criteria.length} label="Au moins 6 caractères" />
              <CriteriaItem met={criteria.hasLetter} label="Au moins une lettre" />
              <CriteriaItem met={criteria.hasNumber} label="Au moins un chiffre" />
            </List>
            
            {/* Note discrète sur les caractères spéciaux */}
            <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'text.disabled', fontSize: '0.7rem', px: 2 }}>
              Caractères spéciaux acceptés : @ $ ! % * # ? &
            </Typography>
          </Box>

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
            sx={{ ...pillTextFieldSx, mb: 2 }}
          />

          {error && (
            <Fade in={true}>
              <Alert severity="error" sx={{ mt: 2, mb: 2, borderRadius: '16px' }}>
                {error}
              </Alert>
            </Fade>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            // On désactive le bouton tant que ce n'est pas à 100% (Optionnel mais recommandé)
            disabled={loading || passwordScore < 100}
            sx={{ mt: 1, mb: 2, ...pillButtonSx(passwordScore === 100 ? 'success' : 'primary') }}
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

export default RegisterPage;