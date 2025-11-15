// src/pages/SessionCreatePage.jsx

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Fade,
  InputAdornment,
  Tooltip,
  LinearProgress,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Lock, Group, CameraAlt, Image as ImageIcon, CloudUpload } from '@mui/icons-material';
import { createWorker } from 'tesseract.js'; 
import api from '../services/api';
import FormContainer from '../components/FormContainer';
import { PageTransition } from '../components/PageTransition';

// --- Styles Gélule ---
const pillTextFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '50px',
    backgroundColor: '#f9f9f9',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      border: '2px solid',
      borderColor: 'primary.main',
    },
  },
};

const pillButtonSx = (color = 'primary') => ({
  fontWeight: 'bold',
  borderRadius: '50px',
  padding: '12px 0',
  fontSize: '1rem',
  backgroundColor: color === 'primary' ? '#1976d2' : '#2E7D32',
  boxShadow: `0 4px 12px rgba(${color === 'primary' ? '25, 118, 210' : '46, 125, 50'}, 0.4)`,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    backgroundColor: color === 'primary' ? '#1565c0' : '#388E3C',
    transform: 'translateY(-2px)',
    boxShadow: `0 6px 16px rgba(${color === 'primary' ? '25, 118, 210' : '46, 125, 50'}, 0.5)`,
  },
});

const SessionCreatePage = () => {
  const navigate = useNavigate();

  // États du formulaire
  const [sessionName, setSessionName] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [expectedGodchildCount, setExpectedGodchildCount] = useState('');
  const [sponsorsList, setSponsorsList] = useState('');

  // États de retour
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // État OCR
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState(''); // Pour afficher "Téléchargement..." ou "Lecture..."
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);

  // Nettoyage du worker si le composant est démonté
  useEffect(() => {
    return () => {
      // Cleanup si besoin
    };
  }, []);

  // --- GESTION OCR (PHOTO & GALERIE) ---
  const handleOcrProcess = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsOcrProcessing(true);
    setOcrProgress(0);
    setOcrStatus("Initialisation...");
    setError(null);

    let worker = null;

    try {
      // 1. Création du worker avec un logger précis
      worker = await createWorker('fra', 1, {
        logger: (m) => {
          // On distingue le chargement du modèle (langue) de la reconnaissance
          if (m.status === 'loading tesseract core' || m.status === 'initializing api') {
            setOcrStatus("Démarrage du moteur IA...");
            setOcrProgress(0.1);
          } else if (m.status === 'recognizing text') {
            setOcrStatus("Lecture du texte en cours...");
            setOcrProgress(m.progress * 100);
          } else if (m.status.includes('downloading')) {
             // Gestion du téléchargement du fichier de langue (~20Mo)
             setOcrStatus("Téléchargement des données de langue...");
             // Le progress de downloading n'est pas toujours 0-1, on fait une estimation
             setOcrProgress(50); 
          } else {
            setOcrStatus(m.status);
          }
        },
      });

      // 2. Reconnaissance
      const { data: { text } } = await worker.recognize(file);
      
      // 3. Nettoyage du texte brut
      const cleanText = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 2) // Filtre les bruits
        .join('\n');

      if (!cleanText || cleanText.length === 0) {
        throw new Error("Aucun texte lisible détecté. Image trop floue ?");
      }

      // Ajout au texte existant
      setSponsorsList((prev) => (prev ? prev + '\n' + cleanText : cleanText));
      
      setSuccess("Liste importée ! Vérifiez les noms et ajoutez les numéros manquants.");
      
    } catch (err) {
      console.error("Erreur OCR:", err);
      setError("Impossible de lire l'image. Vérifiez votre connexion (téléchargement initial nécessaire) ou essayez une image plus nette.");
    } finally {
      // Toujours terminer le worker pour libérer la mémoire
      if (worker) {
        await worker.terminate();
      }
      setIsOcrProcessing(false);
      setOcrStatus('');
      event.target.value = null; // Reset pour pouvoir réimporter le même fichier
    }
  };

  // --- GESTION FICHIER TXT ---
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSponsorsList(e.target.result);
      };
      reader.readAsText(file);
    } else {
      setError('Veuillez sélectionner un fichier .txt valide.');
    }
    event.target.value = null;
  };

  // --- SOUMISSION ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data } = await api.post('/api/sessions/create', {
        sessionName,
        sponsorsList,
        sessionCode,
        expectedGodchildCount: expectedGodchildCount ? parseInt(expectedGodchildCount) : 0,
      });

      setLoading(false);
      setSuccess(
        `Session "${data.session.sessionName}" créée avec succès ! Vous allez être redirigé.`
      );
      
      // Reset
      setSessionName('');
      setSessionCode('');
      setExpectedGodchildCount('');
      setSponsorsList('');
      
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Erreur serveur. Vérifiez vos données.');
    }
  };

  return (
    <PageTransition>
      <FormContainer maxWidth="md">
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
          Créer une session
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          
          {/* CHAMPS PRINCIPAUX (Session & Code) */}
          <TextField
            label="Nom de la session (ex: IACC Groupe A)"
            fullWidth
            required
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            disabled={loading || isOcrProcessing}
            sx={{ ...pillTextFieldSx, mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              label="Code LOKO (Secret)"
              fullWidth
              required
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value)}
              disabled={loading || isOcrProcessing}
              sx={{ ...pillTextFieldSx, flex: 1 }}
              InputProps={{
                endAdornment: <InputAdornment position="end" sx={{ mr: 1 }}><Lock /></InputAdornment>,
              }}
            />
            <Tooltip title="Optionnel : Nombre de filleuls attendus pour le calcul des binômes." arrow>
              <TextField
                label="Nb. estimé de filleuls"
                type="number"
                fullWidth
                value={expectedGodchildCount}
                onChange={(e) => setExpectedGodchildCount(e.target.value)}
                disabled={loading || isOcrProcessing}
                sx={{ ...pillTextFieldSx, flex: 1 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end" sx={{ mr: 1 }}><Group /></InputAdornment>,
                }}
              />
            </Tooltip>
          </Box>

          {/* ZONE DE TEXTE */}
          <TextField
            label="Liste des Parrains/Marraines"
            variant="outlined"
            fullWidth
            required
            multiline
            rows={8}
            value={sponsorsList}
            onChange={(e) => setSponsorsList(e.target.value)}
            disabled={loading || isOcrProcessing}
            placeholder="Scannez une liste ou collez : Nom Complet, Numéro (un par ligne)."
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '24px',
                backgroundColor: '#f9f9f9',
              },
            }}
          />

          {/* BOUTONS D'ACTION RAPIDE (SCAN & IMPORT) */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
            
            {/* 1. BOUTON CAMÉRA (Force la caméra sur mobile) */}
            <Button
              variant="contained"
              component="label"
              fullWidth
              startIcon={<CameraAlt />}
              disabled={loading || isOcrProcessing}
              sx={{
                borderRadius: '50px',
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                color: 'white'
              }}
            >
              Scanner (Caméra)
              <input
                type="file"
                hidden
                accept="image/*"
                capture="environment" // FORCE LA CAMÉRA ARRIÈRE
                onChange={handleOcrProcess}
              />
            </Button>

            {/* 2. BOUTON GALERIE (Ouvre la galerie) */}
            <Button
              variant="contained"
              component="label"
              fullWidth
              startIcon={<ImageIcon />}
              disabled={loading || isOcrProcessing}
              sx={{
                borderRadius: '50px',
                fontWeight: 'bold',
                backgroundColor: '#8e44ad', // Violet
                '&:hover': { backgroundColor: '#732d91' }
              }}
            >
              Depuis Galerie
              <input
                type="file"
                hidden
                accept="image/*"
                // PAS DE CAPTURE = GALERIE
                onChange={handleOcrProcess}
              />
            </Button>

            {/* 3. BOUTON FICHIER TXT */}
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<CloudUpload />}
              disabled={loading || isOcrProcessing}
              sx={{ borderRadius: '50px', fontWeight: 'bold' }}
            >
              Fichier .txt
              <input type="file" hidden accept=".txt" onChange={handleFileUpload} />
            </Button>
          </Stack>

          {/* BARRE DE PROGRESSION OCR */}
          {isOcrProcessing && (
             <Box sx={{ width: '100%', mt: 3, p: 2, bgcolor: '#f0f4c3', borderRadius: 2 }}>
               <Typography variant="body2" align="center" gutterBottom fontWeight="bold">
                 {ocrStatus}
               </Typography>
               <LinearProgress variant="determinate" value={ocrProgress} sx={{ height: 10, borderRadius: 5 }} />
               <Typography variant="caption" align="center" display="block" sx={{ mt: 1 }}>
                 Le premier scan peut être plus long (chargement du moteur IA).
               </Typography>
             </Box>
          )}

          {/* MESSAGES */}
          {error && <Alert severity="error" sx={{ mt: 2, borderRadius: '16px' }}>{error}</Alert>}
          {success && (
            <Fade in={true}>
              <Alert severity="success" sx={{ mt: 2, borderRadius: '16px' }}>{success}</Alert>
            </Fade>
          )}

          {/* SOUMISSION FINALE */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading || isOcrProcessing}
            sx={{ mt: 3, ...pillButtonSx('success') }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Créer la session'}
          </Button>
        </Box>
      </FormContainer>
    </PageTransition>
  );
};

export default SessionCreatePage;