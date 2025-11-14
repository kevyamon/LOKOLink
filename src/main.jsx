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
import { AuthProvider } from './contexts/AuthContext'; // 1. IMPORTER

// ... (code 'globalStyles' et 'theme' inchangé) ...

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        {/* 2. EMBALLER L'APPLICATION */}
        <AuthProvider>
          <CssBaseline />
          <GlobalStyles styles={globalStyles} />
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);