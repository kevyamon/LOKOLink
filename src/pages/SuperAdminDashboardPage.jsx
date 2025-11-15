// src/pages/SuperAdminDashboardPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Container,
  Box,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Divider,
  Chip,
  Button,
  Stack,
  TextField,
  Tabs,
  Tab,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Switch,
  InputAdornment,
} from '@mui/material';
import {
  Edit,
  DeleteForever,
  People,
  Person,
  VpnKey,
  AddCircle,
  CopyAll,
  Check,
  EditNote,
  Lock,
  CloudUpload,
} from '@mui/icons-material';
import api from '../services/api';
import socket from '../services/socket'; // IMPORT SOCKET
import { PageTransition } from '../components/PageTransition';
import AnimatedModal from '../components/AnimatedModal';

// Helper pour les onglets
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SuperAdminDashboardPage = () => {
  // États globaux
  const [tabValue, setTabValue] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // États Feedback visuel
  const [copiedCode, setCopiedCode] = useState(null); // Pour les codes d'invitation
  const [copiedSessionCode, setCopiedSessionCode] = useState(null); // Pour les codes LOKO

  // États Modals Session
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [sessionToEdit, setSessionToEdit] = useState(null); // Pour éditer les parrains
  const [sponsorToEdit, setSponsorToEdit] = useState(null);
  const [sponsorData, setSponsorData] = useState({ name: '', phone: '' });
  const [loadingAction, setLoadingAction] = useState(false);

  // État Modal Création Session
  const [createSessionModalOpen, setCreateSessionModalOpen] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    sessionName: '',
    sessionCode: '',
    sponsorsList: '',
  });

  // État Génération Code
  const [newCodeRole, setNewCodeRole] = useState('delegue');

  // --- CHARGEMENT DES DONNÉES ---
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sessionsRes, usersRes, codesRes] = await Promise.all([
        api.get('/api/admin/sessions'),
        api.get('/api/admin/users'),
        api.get('/api/admin/codes'),
      ]);
      setSessions(sessionsRes.data);
      setUsers(usersRes.data);
      setCodes(codesRes.data);
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
      setError(err.response?.data?.message || 'Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();

    // --- ÉCOUTEURS SOCKET.IO ---
    
    // 1. Sessions
    socket.on('session:created', (newSession) => {
      setSessions((prev) => [newSession, ...prev]);
    });

    socket.on('session:updated', (updatedSession) => {
      setSessions((prev) =>
        prev.map((s) => (s._id === updatedSession._id ? updatedSession : s))
      );
      // Si on édite cette session en ce moment, mettre à jour le modal aussi
      setSessionToEdit((prev) =>
        prev && prev._id === updatedSession._id ? updatedSession : prev
      );
    });

    socket.on('session:deleted', (deletedId) => {
      setSessions((prev) => prev.filter((s) => s._id !== deletedId));
    });

    // 2. Codes
    socket.on('code:created', (newCode) => {
      setCodes((prev) => [...prev, newCode]);
    });

    socket.on('code:deleted', (deletedId) => {
      setCodes((prev) => prev.filter((c) => c._id !== deletedId));
    });

    // Nettoyage
    return () => {
      socket.off('session:created');
      socket.off('session:updated');
      socket.off('session:deleted');
      socket.off('code:created');
      socket.off('code:deleted');
    };
  }, [fetchAllData]);

  // --- 1. GESTION DU STATUS SESSION (ACTIVER/DÉSACTIVER) ---
  const handleToggleSessionStatus = async (session) => {
    // Optimistic UI update
    const originalSessions = [...sessions];
    const updatedSessions = sessions.map(s => 
      s._id === session._id ? { ...s, isActive: !s.isActive } : s
    );
    setSessions(updatedSessions);

    try {
      await api.patch(`/api/admin/sessions/${session._id}/toggle-status`);
    } catch (err) {
      // Revert en cas d'erreur
      setSessions(originalSessions);
      setError("Erreur lors du changement de statut.");
    }
  };

  // --- 2. GESTION DE LA CRÉATION DE SESSION ---
  const handleOpenCreateSession = () => setCreateSessionModalOpen(true);
  const handleCloseCreateSession = () => {
    setCreateSessionModalOpen(false);
    setNewSessionData({ sessionName: '', sessionCode: '', sponsorsList: '' });
  };

  const handleCreateSessionChange = (e) => {
    setNewSessionData({ ...newSessionData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewSessionData(prev => ({ ...prev, sponsorsList: e.target.result }));
      };
      reader.readAsText(file);
    }
    event.target.value = null;
  };

  const handleCreateSessionSubmit = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      await api.post('/api/sessions/create', newSessionData);
      setSuccess(`Session "${newSessionData.sessionName}" créée avec succès !`);
      handleCloseCreateSession();
      // Pas besoin de fetchAllData, le socket s'en charge
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la création.");
    } finally {
      setLoadingAction(false);
    }
  };

  // --- 3. GESTION DES ACTIONS CLASSIQUES ---
  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    setLoadingAction(true);
    try {
      await api.delete(`/api/admin/sessions/${sessionToDelete._id}`);
      setSessionToDelete(null);
      // Pas besoin de fetchAllData
    } catch (err) {
      setError('Erreur suppression session.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleUpdateSponsor = async (e) => {
    e.preventDefault();
    if (!sponsorToEdit || !sessionToEdit) return;
    setLoadingAction(true);
    try {
      const { data } = await api.put(
        `/api/admin/sessions/${sessionToEdit._id}/sponsors/${sponsorToEdit._id}`,
        sponsorData
      );
      // Le socket mettra à jour la liste principale
      // On doit juste fermer le petit modal
      setSponsorToEdit(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  // --- 4. GESTION DES CODES ---
  const handleGenerateCode = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const { data } = await api.post('/api/admin/generate-code', { role: newCodeRole });
      setSuccess(`Code généré: ${data.code.code}`);
      // Pas besoin de fetchAllData
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur génération code.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteCode = async (codeId) => {
    if(window.confirm("Supprimer ce code ?")) {
      try {
        await api.delete(`/api/admin/codes/${codeId}`);
        // Pas besoin de fetchAllData
      } catch (err) { setError("Erreur suppression code."); }
    }
  };

  // --- Helpers Copie ---
  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'invite') {
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2000);
    } else {
      setCopiedSessionCode(text);
      setTimeout(() => setCopiedSessionCode(null), 2000);
    }
  };

  // --- Rendu ---
  if (loading && sessions.length === 0) {
    return (
      <PageTransition>
        <Container sx={{ textAlign: 'center', mt: 10 }}><CircularProgress /></Container>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
            Dashboard Super-Admin
          </Typography>
          
          {error && <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: '16px', mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ borderRadius: '16px', mb: 2 }}>{success}</Alert>}

          {/* --- BARRE D'ACTIONS RAPIDES --- */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddCircle />}
              onClick={handleOpenCreateSession}
              sx={{ borderRadius: '50px', fontWeight: 'bold', boxShadow: 3 }}
            >
              Nouvelle Session
            </Button>
          </Box>

          <Paper sx={{ borderRadius: '16px 16px 0 0', bgcolor: 'rgba(255, 255, 255, 0.9)' }}>
            <Tabs 
              value={tabValue} 
              onChange={(e, v) => setTabValue(v)} 
              indicatorColor="primary" 
              textColor="primary" 
              variant="fullWidth"
            >
              <Tab label="Sessions" />
              <Tab label="Utilisateurs" />
              <Tab label="Codes Invitation" />
            </Tabs>
          </Paper>

          <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.9)', borderRadius: '0 0 16px 16px', boxShadow: 3, minHeight: '400px' }}>
            
            {/* --- TAB SESSIONS --- */}
            <TabPanel value={tabValue} index={0}>
              <List>
                {sessions.map((session) => (
                  <React.Fragment key={session._id}>
                    <ListItem
                      alignItems="flex-start"
                      secondaryAction={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {/* Switch Actif/Inactif */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 2 }}>
                            <Switch 
                              checked={session.isActive}
                              onChange={() => handleToggleSessionStatus(session)}
                              color="success"
                              size="small"
                            />
                            <Typography variant="caption" color={session.isActive ? "success.main" : "text.disabled"}>
                              {session.isActive ? "ACTIVE" : "OFF"}
                            </Typography>
                          </Box>

                          <Tooltip title="Modifier Parrains">
                            <IconButton onClick={() => setSessionToEdit(session)}><Edit /></IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer Session">
                            <IconButton onClick={() => setSessionToDelete(session)}><DeleteForever color="error" /></IconButton>
                          </Tooltip>
                        </Stack>
                      }
                    >
                      {/* Icône à gauche */}
                      <ListItemIcon sx={{ minWidth: '40px' }}>
                        <People color="primary" />
                      </ListItemIcon>
                      
                      {/* Texte principal */}
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle1" fontWeight="bold">{session.sessionName}</Typography>
                            <Chip 
                              icon={<Lock fontSize="small"/>} 
                              label={session.sessionCode} 
                              size="small" 
                              variant="outlined"
                              onClick={() => copyToClipboard(session.sessionCode, 'session')}
                              deleteIcon={copiedSessionCode === session.sessionCode ? <Check /> : <CopyAll />}
                              onDelete={() => copyToClipboard(session.sessionCode, 'session')}
                              color={copiedSessionCode === session.sessionCode ? "success" : "default"}
                              sx={{ cursor: 'pointer' }}
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              Créé par: {session.createdBy?.email || 'Inconnu'}
                            </Typography>
                            <br />
                            {` ${session.sponsors.length} parrains inscrits`}
                          </>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            </TabPanel>

            {/* --- TAB UTILISATEURS --- */}
            <TabPanel value={tabValue} index={1}>
              <List>
                {users.map((user) => (
                  <ListItem key={user._id}>
                    <ListItemIcon><Person /></ListItemIcon>
                    <ListItemText
                      primary={user.email}
                      secondary={`Rôle: ${user.role.toUpperCase()} | Expiration: ${user.accountExpiresAt ? new Date(user.accountExpiresAt).toLocaleDateString() : 'Jamais'}`}
                    />
                    <Chip 
                      label={user.isActive ? 'Actif' : 'Inactif'}
                      color={user.isActive ? 'success' : 'default'}
                      size="small" 
                    />
                  </ListItem>
                ))}
              </List>
            </TabPanel>

            {/* --- TAB CODES --- */}
            <TabPanel value={tabValue} index={2}>
              <Box component="form" onSubmit={handleGenerateCode} sx={{ display: 'flex', gap: 2, mb: 3, p: 2, border: '1px dashed grey', borderRadius: '16px', alignItems: 'center' }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Rôle à générer</InputLabel>
                  <Select value={newCodeRole} label="Rôle à générer" onChange={(e) => setNewCodeRole(e.target.value)}>
                    <MenuItem value="delegue">Délégué</MenuItem>
                    <MenuItem value="superadmin">Super-Admin</MenuItem>
                  </Select>
                </FormControl>
                <Button type="submit" variant="contained" disabled={loadingAction} startIcon={<AddCircle />}>
                  Générer
                </Button>
              </Box>
              <List>
                {codes.map((code) => (
                  <ListItem key={code._id}
                    secondaryAction={
                      !code.isUsed && (
                        <IconButton onClick={() => handleDeleteCode(code._id)}><DeleteForever color="error" /></IconButton>
                      )
                    }
                  >
                    <ListItemIcon><VpnKey color={code.isUsed ? 'disabled' : 'success'} /></ListItemIcon>
                    <ListItemText
                      primary={code.code}
                      secondary={code.isUsed ? "Utilisé" : `Pour: ${code.role}`}
                      sx={{ textDecoration: code.isUsed ? 'line-through' : 'none', color: code.isUsed ? 'text.disabled' : 'text.primary' }}
                    />
                    <Button 
                      size="small" 
                      startIcon={copiedCode === code.code ? <Check /> : <CopyAll />} 
                      onClick={() => copyToClipboard(code.code, 'invite')}
                      disabled={code.isUsed}
                    >
                      {copiedCode === code.code ? 'Copié' : 'Copier'}
                    </Button>
                  </ListItem>
                ))}
              </List>
            </TabPanel>

          </Box>
        </Container>

        {/* --- MODAL CRÉATION SESSION --- */}
        <AnimatedModal open={createSessionModalOpen} onClose={handleCloseCreateSession} maxWidth="md">
          <Typography variant="h5" component="h2" gutterBottom fontWeight="bold" align="center">
            Créer une Nouvelle Session
          </Typography>
          <Box component="form" onSubmit={handleCreateSessionSubmit} sx={{ mt: 2 }}>
            <TextField
              label="Nom de la session (ex: Info Groupe A)"
              name="sessionName"
              fullWidth
              required
              value={newSessionData.sessionName}
              onChange={handleCreateSessionChange}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Code LOKO (Secret pour les filleuls)"
              name="sessionCode"
              fullWidth
              required
              value={newSessionData.sessionCode}
              onChange={handleCreateSessionChange}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: <InputAdornment position="end"><Lock /></InputAdornment>,
              }}
            />
            <TextField
              label="Liste des Parrains (Nom, Téléphone)"
              name="sponsorsList"
              fullWidth
              required
              multiline
              rows={6}
              value={newSessionData.sponsorsList}
              onChange={handleCreateSessionChange}
              placeholder="Jean Dupont, 0102030405"
              helperText="Un parrain par ligne. Format: Nom, Téléphone"
              sx={{ mb: 2 }}
            />
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<CloudUpload />}
              sx={{ mb: 3 }}
            >
              Importer depuis un fichier .txt
              <input type="file" hidden accept=".txt" onChange={handleFileUpload} />
            </Button>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button onClick={handleCloseCreateSession} variant="outlined">Annuler</Button>
              <Button type="submit" variant="contained" disabled={loadingAction}>
                {loadingAction ? <CircularProgress size={24} /> : 'Créer la Session'}
              </Button>
            </Stack>
          </Box>
        </AnimatedModal>

        {/* --- MODAL SUPPRESSION --- */}
        <AnimatedModal open={Boolean(sessionToDelete)} onClose={() => setSessionToDelete(null)}>
          <Typography variant="h6" component="h2" gutterBottom>
            Supprimer définitivement ?
          </Typography>
          <Typography sx={{ mt: 2 }}>
            Session: <strong>{sessionToDelete?.sessionName}</strong>
          </Typography>
          <Typography color="error" variant="caption" display="block" sx={{ mt: 1 }}>
            Action irréversible.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button onClick={() => setSessionToDelete(null)}>Annuler</Button>
            <Button variant="contained" color="error" onClick={handleDeleteSession}>
              Supprimer
            </Button>
          </Stack>
        </AnimatedModal>

        {/* --- MODAL ÉDITION SESSION (LISTE PARRAINS) --- */}
        <AnimatedModal open={Boolean(sessionToEdit)} onClose={() => setSessionToEdit(null)} maxWidth="md">
          <Typography variant="h6" gutterBottom>
            Parrains de : {sessionToEdit?.sessionName}
          </Typography>
          <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
            {sessionToEdit?.sponsors.map((sponsor) => (
              <ListItem
                key={sponsor._id}
                secondaryAction={
                  <IconButton onClick={() => { setSponsorToEdit(sponsor); setSponsorData({ name: sponsor.name, phone: sponsor.phone }); }}>
                    <EditNote />
                  </IconButton>
                }
              >
                <ListItemText primary={sponsor.name} secondary={sponsor.phone} />
              </ListItem>
            ))}
          </List>
          <Button fullWidth onClick={() => setSessionToEdit(null)} sx={{ mt: 2 }}>
            Fermer
          </Button>
        </AnimatedModal>

        {/* --- MODAL ÉDITION PARRAIN (FORMULAIRE) --- */}
        <AnimatedModal open={Boolean(sponsorToEdit)} onClose={() => setSponsorToEdit(null)}>
          <Typography variant="h6">Modifier Parrain</Typography>
          <Box component="form" onSubmit={handleUpdateSponsor} sx={{ mt: 2 }}>
            <TextField
              label="Nom"
              name="name"
              fullWidth
              value={sponsorData.name}
              onChange={(e) => setSponsorData({...sponsorData, name: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Téléphone"
              name="phone"
              fullWidth
              value={sponsorData.phone}
              onChange={(e) => setSponsorData({...sponsorData, phone: e.target.value})}
            />
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button onClick={() => setSponsorToEdit(null)}>Annuler</Button>
              <Button type="submit" variant="contained">Sauvegarder</Button>
            </Stack>
          </Box>
        </AnimatedModal>

      </>
    </PageTransition>
  );
};

export default SuperAdminDashboardPage;