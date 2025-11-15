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
import { createWorker, PSM } from 'tesseract.js'; // Import PSM (Page Segmentation Mode)
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

// --- FONCTION DE PRÉ-TRAITEMENT D'IMAGE (Magie noire) ---
// Cette fonction prend l'image brute, la passe en noir et blanc et augmente le contraste
// pour que Tesseract arrête de lire les ombres.
const preprocessImage = (imageFile) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(imageFile);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // On redimensionne si l'image est trop géante (optimisation perf mobile)
      const MAX_WIDTH = 1500;
      const scale = MAX_WIDTH / img.width;
      canvas.width = scale < 1 ? MAX_WIDTH : img.width;
      canvas.height = scale < 1 ? img.height * scale : img.height;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Accès aux pixels
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Algorithme de Binarisation (Seuil) + Grayscale
      // On transforme tout ce qui n'est pas très sombre en blanc pur
      // Et ce qui est sombre en noir pur.
      for (let i = 0; i < data.length; i += 4) {
        // Niveau de gris = 0.3*R + 0.59*G + 0.11*B
        const gray = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
        
        // Seuil de contraste (Threshold) : 120 est une bonne moyenne
        // Si le pixel est plus clair que 120, il devient BLANC (255)
        // Sinon il devient NOIR (0)
        const value = gray > 130 ? 255 : 0;

        data[i] = value;     // R
        data[i + 1] = value; // G
        data[i + 2] = value; // B
        // Alpha (data[i+3]) reste inchangé
      }

      ctx.putImageData(imgData, 0, 0);
      
      // Retourne l'image traitée en Blob
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.9);
    };
    
    img.onerror = (err) => reject(err);
  });
};

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
  const [ocrStatus, setOcrStatus] = useState(''); 
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);

  useEffect(() => {
    return () => {};
  }, []);

  // --- GESTION OCR (PHOTO & GALERIE) ---
  const handleOcrProcess = async (event) => {
    const rawFile = event.target.files[0];
    if (!rawFile) return;

    setIsOcrProcessing(true);
    setOcrProgress(0);
    setOcrStatus("Nettoyage de l'image..."); // Feedback utilisateur
    setError(null);

    let worker = null;

    try {
      // 1. PRÉ-TRAITEMENT (C'est ici qu'on sauve la mise)
      const processedFile = await preprocessImage(rawFile);
      setOcrStatus("Initialisation IA...");

      // 2. Création du worker
      worker = await createWorker('fra', 1, {
        logger: (m) => {
          if (m.status === 'loading tesseract core' || m.status === 'initializing api') {
            setOcrStatus("Chargement du moteur...");
            setOcrProgress(10); // Barre fictive pour le chargement
          } else if (m.status === 'recognizing text') {
            setOcrStatus("Lecture du texte...");
            setOcrProgress(m.progress * 100);
          } else if (m.status.includes('downloading')) {
             setOcrStatus("Téléchargement des données...");
             setOcrProgress(30); 
          } else {
            setOcrStatus(m.status);
          }
        },
      });

      // 3. Configuration Avancée pour Listes
      // PSM 6 = Assume a single uniform block of text. (Meilleur pour les listes que le défaut)
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK, 
      });

      // 4. Reconnaissance sur l'image NETTOYÉE
      const { data: { text } } = await worker.recognize(processedFile);
      
      // 5. Nettoyage du texte brut
      // On enlève les lignes trop courtes (bruit) et les caractères bizarres uniques
      const cleanText = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => {
          // On garde la ligne si elle fait plus de 3 caractères 
          // ET si elle contient au moins une lettre (pour éviter les lignes de symboles '---')
          return line.length > 3 && /[a-zA-Z]/.test(line);
        })
        .join('\n');

      if (!cleanText || cleanText.length === 0) {
        throw new Error("Aucun texte lisible. L'image est peut-être trop floue ou trop sombre.");
      }

      setSponsorsList((prev) => (prev ? prev + '\n' + cleanText : cleanText));
      setSuccess("Liste importée ! Pensez à vérifier les numéros.");
      
    } catch (err) {
      console.error("Erreur OCR:", err);
      setError("Lecture difficile. Essayez de prendre la photo bien à plat, avec une bonne lumière.");
    } finally {
      if (worker) {
        await worker.terminate();
      }
      setIsOcrProcessing(false);
      setOcrStatus('');
      event.target.value = null; 
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
          
          {/* CHAMPS PRINCIPAUX */}
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
            helperText="Astuce pour le scan : Prenez la photo bien à plat, avec un bon éclairage."
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '24px',
                backgroundColor: '#f9f9f9',
              },
            }}
          />

          {/* BOUTONS D'ACTION RAPIDE */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
            
            {/* 1. BOUTON CAMÉRA */}
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
                capture="environment"
                onChange={handleOcrProcess}
              />
            </Button>

            {/* 2. BOUTON GALERIE */}
            <Button
              variant="contained"
              component="label"
              fullWidth
              startIcon={<ImageIcon />}
              disabled={loading || isOcrProcessing}
              sx={{
                borderRadius: '50px',
                fontWeight: 'bold',
                backgroundColor: '#8e44ad',
                '&:hover': { backgroundColor: '#732d91' }
              }}
            >
              Depuis Galerie
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleOcrProcess}
              />
            </Button>

            {/* 3. BOUTON TXT */}
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
             <Box sx={{ width: '100%', mt: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 2, border: '1px solid #90caf9' }}>
               <Typography variant="body2" align="center" gutterBottom fontWeight="bold" color="primary">
                 {ocrStatus}
               </Typography>
               <LinearProgress variant="determinate" value={ocrProgress} sx={{ height: 10, borderRadius: 5 }} />
               <Typography variant="caption" align="center" display="block" sx={{ mt: 1 }}>
                 Traitement de l'image pour améliorer la lisibilité...
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