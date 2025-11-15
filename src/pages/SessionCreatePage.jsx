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
import { createWorker, PSM } from 'tesseract.js';
import api from '../services/api';
import FormContainer from '../components/FormContainer';
import { PageTransition } from '../components/PageTransition';

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

// --- FONCTION DE PRÉ-TRAITEMENT D'IMAGE ---
const preprocessImage = (imageFile) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(imageFile);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const MAX_WIDTH = 1500;
      const scale = MAX_WIDTH / img.width;
      canvas.width = scale < 1 ? MAX_WIDTH : img.width;
      canvas.height = scale < 1 ? img.height * scale : img.height;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
        const value = gray > 130 ? 255 : 0;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
      }

      ctx.putImageData(imgData, 0, 0);
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.9);
    };
    
    img.onerror = (err) => reject(err);
  });
};

const SessionCreatePage = () => {
  const navigate = useNavigate();

  const [sessionName, setSessionName] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [expectedGodchildCount, setExpectedGodchildCount] = useState('');
  const [sponsorsList, setSponsorsList] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState(''); 
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);

  const handleOcrProcess = async (event) => {
    const rawFile = event.target.files[0];
    if (!rawFile) return;

    setIsOcrProcessing(true);
    setOcrProgress(0);
    setOcrStatus("Nettoyage de l'image...");
    setError(null);

    let worker = null;

    try {
      const processedFile = await preprocessImage(rawFile);
      setOcrStatus("Initialisation IA...");

      worker = await createWorker('fra', 1, {
        logger: (m) => {
          if (m.status === 'loading tesseract core' || m.status === 'initializing api') {
            setOcrStatus("Chargement du moteur...");
            setOcrProgress(10);
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

      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK, 
      });

      const { data: { text } } = await worker.recognize(processedFile);
      
      const cleanText = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => {
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
        `Session "${data.session.sessionName}" créée ! Redirection vers le tableau de bord...`
      );
      
      setSessionName('');
      setSessionCode('');
      setExpectedGodchildCount('');
      setSponsorsList('');
      
      // REDIRECTION VERS LE DASHBOARD DU DÉLÉGUÉ
      setTimeout(() => {
        navigate(`/delegue/dashboard/${data.session._id}`);
      }, 2000);

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
            <Tooltip title="Optionnel : Nombre de filleuls attendus." arrow>
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

          <TextField
            label="Liste des Parrains/Marraines"
            variant="outlined"
            fullWidth
            required={false} // On peut laisser vide si on compte sur le lien
            multiline
            rows={8}
            value={sponsorsList}
            onChange={(e) => setSponsorsList(e.target.value)}
            disabled={loading || isOcrProcessing}
            placeholder="Collez la liste ici OU laissez vide et utilisez le lien d'invitation plus tard."
            helperText="Format manuel : Nom Complet, Numéro"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '24px',
                backgroundColor: '#f9f9f9',
              },
            }}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
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
              Scanner
              <input type="file" hidden accept="image/*" capture="environment" onChange={handleOcrProcess} />
            </Button>

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
              Galerie
              <input type="file" hidden accept="image/*" onChange={handleOcrProcess} />
            </Button>

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

          {isOcrProcessing && (
             <Box sx={{ width: '100%', mt: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 2, border: '1px solid #90caf9' }}>
               <Typography variant="body2" align="center" gutterBottom fontWeight="bold" color="primary">
                 {ocrStatus}
               </Typography>
               <LinearProgress variant="determinate" value={ocrProgress} sx={{ height: 10, borderRadius: 5 }} />
             </Box>
          )}

          {error && <Alert severity="error" sx={{ mt: 2, borderRadius: '16px' }}>{error}</Alert>}
          {success && (
            <Fade in={true}>
              <Alert severity="success" sx={{ mt: 2, borderRadius: '16px' }}>{success}</Alert>
            </Fade>
          )}

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