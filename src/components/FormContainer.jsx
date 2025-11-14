// src/components/FormContainer.jsx

import React from 'react';
import { Container, Box } from '@mui/material';

/**
 * Un composant "wrapper" pour standardiser l'apparence
 * de toutes nos pages de formulaire.
 * @param {React.Node} children - Le contenu à afficher (le formulaire).
 * @param {String} maxWidth - 'xs', 'sm', 'md', 'lg' (défaut 'sm').
 */
const FormContainer = ({ children, maxWidth = 'sm' }) => {
  return (
    <Container maxWidth={maxWidth}>
      <Box
        sx={{
          mt: 8,
          p: { xs: 3, sm: 5 }, // Plus de padding interne
          // bgcolor: '#FFF9FB', // Fond très légèrement rose comme GTY (optionnel)
          bgcolor: 'rgba(255, 255, 255, 0.95)', // Gardons blanc pur mais plus opaque
          borderRadius: '24px', // BEAUCOUP plus arrondi (style GTY)
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)', // Ombre plus douce et large
        }}
      >
        {children}
      </Box>
    </Container>
  );
};

export default FormContainer;