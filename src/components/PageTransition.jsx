// src/components/PageTransition.jsx

import React from 'react';
import { motion } from 'framer-motion';
import { useData } from '../contexts/DataContext'; // On importe le contexte

const WIPE_COLOR = '#1976d2'; 

const rideauVariants = {
  initial: { x: '0vw' },
  animate: { x: '100vw', transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
  exit: { x: '100vw', transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

const PageTransition = ({ children }) => {
  const { isFirstLoad } = useData();

  // SI c'est le premier chargement (Splash actif), on ne veut PAS de rideau.
  // On rend juste les enfants directement.
  if (isFirstLoad) {
    return <>{children}</>;
  }

  // Sinon (navigation normale), on met le rideau
  return (
    <>
      {children}
      <motion.div
        style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: WIPE_COLOR, zIndex: 9998,
        }}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={rideauVariants}
      />
    </>
  );
};

export { PageTransition, WIPE_COLOR };