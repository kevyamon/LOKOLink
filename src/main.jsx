// src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  GlobalStyles,
} from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import backgroundImage from './assets/background.png';
import { AuthProvider } from './contexts/AuthContext'; 

// 1. DÉFINITION DES STYLES GLOBAUX
const globalStyles = {
  body: {
    // L'image est gérée ici
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    minHeight: '100vh',
    margin: 0,
    padding: 0,
    // On force la transparence ici pour voir l'image
    backgroundColor: 'transparent', 
  },
  // On s'assure que le conteneur racine est aussi transparent
  '#root': {
    minHeight: '100vh',
    backgroundColor: 'transparent',
  }
};

// 2. DÉFINITION DU THÈME
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    // CORRECTION CRITIQUE ICI :
    // On remet une couleur "réelle" (#ffffff) pour que MUI puisse faire ses calculs
    // (ombres, contrastes, snackbars, modales).
    // La transparence visuelle est gérée par globalStyles ci-dessus.
    background: {
      default: '#ffffff', 
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          // On force la transparence du body au niveau CSS Baseline aussi
          backgroundColor: 'transparent',
        },
      },
    },
    // On peut aussi forcer la transparence des Cards/Paper si tu veux qu'elles soient semi-transparentes
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Évite les overlays blancs automatiques du mode sombre/clair
        }
      }
    }
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <AuthProvider>
          <CssBaseline />
          <GlobalStyles styles={globalStyles} />
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);