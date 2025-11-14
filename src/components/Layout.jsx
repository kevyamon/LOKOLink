  // src/components/Layout.jsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import Header from './Header'; // On importera bientôt
import Footer from './Footer'; // On importera bientôt

// On importe la Sidebar (elle sera contrôlée par le Header)
import Sidebar from './Sidebar';

const Layout = () => {
  // État pour contrôler l'ouverture/fermeture de la Sidebar
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
          flexGrow: 1, // Prend tout l'espace vertical restant
          p: 3, // Ajoute un "padding" interne
          // On s'assure que le contenu n'est pas caché sous le Header
          // (On affinera ça avec la hauteur du Header)
          mt: '64px',
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
