// src/components/Layout.jsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';

const Layout = () => {
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Header onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />

      {/* Contenu principal de la page */}
      <Box
        component="main"
        sx={{
          flexGrow: 1, 
          p: 3, 
          mt: '64px',
          // FIX UX : Assurer la transparence par défaut du contenu pour voir le fond
          backgroundColor: 'transparent !important',
        }}
      >
        {/* 'Outlet' est l'endroit où React Router affichera la page active */}
        <Outlet />
      </Box>

      <Footer />
    </Box>
  );
};

export default Layout;