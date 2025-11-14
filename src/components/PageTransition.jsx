// src/components/PageTransition.jsx

import React from 'react';
import { motion } from 'framer-motion';

// La couleur du rideau (notre bleu primaire)
const WIPE_COLOR = '#1976d2'; 

// Nouvelle logique d'animation (horizontale)
const rideauVariants = {
  /**
   * 1. 'initial' (Nouvelle page)
   * Le rideau commence en couvrant tout l'écran.
   */
  initial: {
    x: '0vw',
  },
  /**
   * 2. 'animate' (Nouvelle page)
   * Le rideau se déplace vers la droite, DÉCOUVRANT la nouvelle page.
   */
  animate: {
    x: '100vw',
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }, // Une courbe "douce"
  },
  /**
   * 3. 'exit' (Ancienne page)
   * Le rideau (de l'ancienne page) se déplace vers la droite, COUVRANT l'ancienne page.
   */
  exit: {
    x: '100vw',
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * Ce composant gère la transition ET affiche les enfants (le contenu).
 * L'astuce est que le rideau est un 'motion.div' SÉPARÉ.
 */
const PageTransition = ({ children }) => {
  return (
    <>
      {/* 1. Le contenu de la page (les enfants) */}
      {children}

      {/* 2. Le rideau (Wipe) */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: WIPE_COLOR,
          zIndex: 9998, // Au-dessus de tout
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