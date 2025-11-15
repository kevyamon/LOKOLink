// src/pages/SessionCreatePage.jsx

import React, { useState } from 'react';
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
  LinearProgress, // Pour la barre de progression OCR
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Lock, Group, CameraAlt, CloudUpload } from '@mui/icons-material'; // Ajout CameraAlt
import { createWorker } from 'tesseract.js'; // Import du moteur OCR
import api from '../services/api';
import FormContainer from '../components/FormContainer';
import { PageTransition } from '../components/PageTransition';

// --- Styles Gélule ---
const pillTextFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '50px',
    backgroundColor: '#f9f9f9',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
    '& .MuiOutlinedInput-notchedOutline': {
      border: 'none',
    },
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
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);

  // --- GESTION OCR (PHOTO) ---
  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsOcrProcessing(true);
    setOcrProgress(0);
    setError(null);

    try {
      const worker = await createWorker({
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(parseInt(m.progress * 100));
          }
        },
      });

      // Chargement du langage (Français)
      await worker.loadLanguage('fra');
      await worker.initialize('fra');

      // Reconnaissance
      const { data: { text } } = await worker.recognize(file);
      
      // Nettoyage du texte brut
      // On garde les lignes qui ont du texte, on essaie de nettoyer un peu
      const cleanText = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 2) // Filtre les bruits
        .join('\n');

      if (cleanText.length === 0) {
        throw new Error("Aucun texte lisible détecté. Essayez une photo plus claire.");
      }

      // On ajoute le texte à la suite s'il y en a déjà
      setSponsorsList((prev) => (prev ? prev + '\n' + cleanText : cleanText));
      
      await worker.terminate();
      setSuccess("Liste importée ! Vérifiez et complétez les numéros si besoin.");

    } catch (err) {
      console.error(err);
      setError("Erreur de lecture de l'image. Assurez-vous que la photo est nette et bien éclairée.");
    } finally {
      setIsOcrProcessing(false);
      event.target.value = null; // Reset input
    }
  };

  // --- GESTION FICHIER TXT (Inchangé) ---
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
      setError(null);
      
      setSessionName('');
      setSessionCode('');
      setExpectedGodchildCount('');
      setSponsorsList('');
      
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (err) {
      setLoading(false);
      setError(
        err.response?.data?.message ||
          'Erreur serveur. Vérifiez vos données.'
      );
    }
  };

  return (
    <PageTransition>
      <FormContainer maxWidth="md">
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
          Créer une nouvelle session
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          {/* Nom de session */}
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
            {/* Code LOKO */}
            <TextField
              label="Code LOKO (Secret)"
              helperText="Code pour les filleuls."
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

            {/* Estimation */}
            <Tooltip title="Si vous avez plus de parrains, indiquez le nombre de filleuls. Le système créera des binômes." arrow>
              <TextField
                label="Nb. estimé de filleuls"
                helperText="Optionnel. Pour gérer le surplus."
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

          {/* Zone de texte principale */}
          <TextField
            label="Liste des Parrains/Marraines"
            variant="outlined"
            fullWidth
            required
            multiline
            rows={10}
            value={sponsorsList}
            onChange={(e) => setSponsorsList(e.target.value)}
            disabled={loading || isOcrProcessing}
            placeholder="Format : Nom Complet, Numéro (un par ligne). Si vous scannez une liste sans numéros, ajoutez-les manuellement ici."
            helperText="Vérifiez bien les données après un scan ou un import."
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '24px',
                backgroundColor: '#f9f9f9',
              },
            }}
          />

          {/* BARRE D'OUTILS D'IMPORTATION */}
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            
            {/* BOUTON SCAN PHOTO (NOUVEAU) */}
            <Button
              variant="contained"
              component="label"
              fullWidth
              color="secondary" // Couleur différente pour distinguer
              startIcon={isOcrProcessing ? <CircularProgress size={20} color="inherit"/> : <CameraAlt />}
              sx={{
                borderRadius: '50px',
                padding: '10px 0',
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)', // Un petit style sympa
                boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
              }}
              disabled={loading || isOcrProcessing}
            >
              {isOcrProcessing ? `Analyse en cours... ${ocrProgress}%` : "Scanner une liste (Photo)"}
              <input
                type="file"
                hidden
                accept="image/*"
                capture="environment" // Ouvre la caméra arrière sur mobile par défaut
                onChange={handlePhotoUpload}
              />
            </Button>

            {/* BOUTON IMPORT TXT (EXISTANT) */}
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<CloudUpload />}
              sx={{
                borderRadius: '50px',
                padding: '10px 0',
                fontWeight: 'bold',
              }}
              disabled={loading || isOcrProcessing}
            >
              Importer fichier .txt
              <input
                type="file"
                hidden
                accept=".txt, text/plain"
                onChange={handleFileUpload}
              />
            </Button>
          </Box>

          {/* Feedback OCR */}
          {isOcrProcessing && (
             <Box sx={{ width: '100%', mt: 2 }}>
               <LinearProgress variant="determinate" value={ocrProgress} sx={{ height: 10, borderRadius: 5 }} />
               <Typography variant="caption" align="center" display="block" sx={{ mt: 1 }}>
                 L'intelligence artificielle lit votre document... Veuillez patienter.
               </Typography>
             </Box>
          )}

          {/* Messages de retour */}
          {error && <Alert severity="error" sx={{ mt: 2, borderRadius: '16px' }}>{error}</Alert>}
          {success && (
            <Fade in={true}>
              <Alert severity="success" sx={{ mt: 2, borderRadius: '16px' }}>{success}</Alert>
            </Fade>
          )}

          {/* Bouton de soumission */}
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