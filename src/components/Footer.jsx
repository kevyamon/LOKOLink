  // src/components/Footer.jsx

import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 2, // padding vertical
        px: 2, // padding horizontal
        mt: 'auto', // Pousse le footer en bas (magie de flexbox)
        backgroundColor: 'rgba(255, 255, 255, 0.7)', // Fond blanc semi-transparent
        backdropFilter: 'blur(5px)', // Effet de flou
        borderTop: '1px solid rgba(0,0,0,0.1)',
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" align="center">
          {/* Copyright dynamique (Cahier des charges) */}
          {`© ${currentYear} LOKOlink. Tous droits réservés.`}
        </Typography>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Une initiative de Kevin Amon
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
