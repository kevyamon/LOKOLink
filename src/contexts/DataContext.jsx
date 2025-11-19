// src/contexts/DataContext.jsx
import React, { createContext, useContext, useState } from 'react';

const DataContext = createContext();

export const useData = () => {
  return useContext(DataContext);
};

export const DataProvider = ({ children }) => {
  const [sessions, setSessions] = useState([]);
  
  // --- NOUVEAUX ÉTATS POUR LA MISSION 1 ---
  // Est-ce le tout premier chargement de l'app ?
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  // Est-ce que la HomePage a fini de charger ses données ?
  const [isHomeReady, setIsHomeReady] = useState(false);

  const setInitialSessions = (sessionsArray) => {
    setSessions(sessionsArray);
  };

  const markHomeAsReady = () => {
    setIsHomeReady(true);
  };

  const markFirstLoadComplete = () => {
    setIsFirstLoad(false);
  };

  const value = {
    sessions,
    setInitialSessions,
    isFirstLoad,
    markFirstLoadComplete,
    isHomeReady,
    markHomeAsReady,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};