// src/contexts/DataContext.jsx
import React, { createContext, useContext, useState } from 'react';

const DataContext = createContext();

export const useData = () => {
  return useContext(DataContext);
};

export const DataProvider = ({ children }) => {
  const [sessions, setSessions] = useState([]);
  
  // Cette fonction sera appelée par App.jsx
  const setInitialSessions = (sessionsArray) => {
    setSessions(sessionsArray);
  };

  const value = {
    sessions,
    setInitialSessions,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};