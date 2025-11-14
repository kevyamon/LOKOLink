// src/pages/NotFoundPage.jsx

import React from 'react';
import {
  Typography,
  Button,
  Box,
} from '@mui/material';
import { Link } from 'react-router-dom';
import FormContainer from '../components/FormContainer';
import { PageTransition } from '../components/PageTransition'; // 1. Import

// Définition du style "gélule" pour le bouton
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

const NotFoundPage = () => {
  return (
    // 2. Emballage avec PageTransition
    <PageTransition>
      <FormContainer maxWidth="sm">
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h1" component="h1" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
            404
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom>
            Page non trouvée
          </Typography>
          <Typography gutterBottom>
            Désolé, la page que vous recherchez n'existe pas.
          </Typography>
          <Button
            variant="contained"
            component={Link}
            to="/"
            sx={{ mt: 3, ...pillButtonSx() }}
          >
            Retour à l'accueil
          </Button>
        </Box>
      </FormContainer>
    </PageTransition>
  );
};

export default NotFoundPage;