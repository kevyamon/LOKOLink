// src/components/Header.jsx

import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';

// Importation du logo
import logo from '../assets/logo.png';

const Header = ({ onToggleSidebar, isSidebarOpen }) => {
  const navigate = useNavigate();

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        color: '#000',
      }}
    >
      <Toolbar>
        {/* Logo (Rendu Cliquable et Circulaire) */}
        <Box
          component="img"
          src={logo}
          alt="LOKOlink Logo"
          onClick={() => navigate('/')}
          sx={{
            height: '40px',
            width: '40px', // On force un carré pour que le cercle soit parfait
            mr: 2,
            cursor: 'pointer',
            borderRadius: '50%', // LA DÉCOUPE CIRCULAIRE
            objectFit: 'cover', // L'image remplit bien le cercle sans être écrasée
            transition: 'transform 0.2s ease',
            '&:hover': {
              transform: 'scale(1.05)',
            },
          }}
        />

        {/* Titre (Aussi rendu cliquable) */}
        <Typography
          variant="h6"
          component="div"
          onClick={() => navigate('/')}
          sx={{
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          LOKOlink
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        {/* Bouton Hamburger */}
        <IconButton
          color="inherit"
          aria-label="ouvrir le menu"
          edge="end"
          onClick={onToggleSidebar}
          sx={{
            opacity: isSidebarOpen ? 0 : 1,
            transition: 'opacity 0.2s linear',
            zIndex: (theme) => theme.zIndex.drawer + 2, 
          }}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Header;