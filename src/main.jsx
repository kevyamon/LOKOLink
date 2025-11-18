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
import { DataProvider } from './contexts/DataContext'; // <--- NOUVEAU IMPORT

// 1. DÉFINITION DES STYLES GLOBAUX
// ... (styles inchangés) ...
const globalStyles = {
  body: {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    minHeight: '100vh',
    margin: 0,
    padding: 0,
    backgroundColor: 'transparent', 
  },
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
          backgroundColor: 'transparent',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', 
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
          {/* ENVELOPPEMENT FINAL */}
          <DataProvider>
            <CssBaseline />
            <GlobalStyles styles={globalStyles} />
            <App />
          </DataProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);