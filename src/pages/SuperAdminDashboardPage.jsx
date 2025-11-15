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
  useMediaQuery,
  useTheme
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
  Email,
  Event
} from '@mui/icons-material';
import api from '../services/api';
import socket from '../services/socket';
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
      {value === index && <Box sx={{ p: { xs: 2, md: 3 } }}>{children}</Box>}
    </div>
  );
}

const SuperAdminDashboardPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // États globaux
  const [tabValue, setTabValue] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // États Feedback visuel
  const [copiedCode, setCopiedCode] = useState(null);
  const [copiedSessionCode, setCopiedSessionCode] = useState(null);

  // États Modals Session
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [sessionToEdit, setSessionToEdit] = useState(null);
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

    // Écouteurs Socket
    socket.on('session:created', (newSession) => setSessions((prev) => [newSession, ...prev]));
    socket.on('session:updated', (updatedSession) => {
      setSessions((prev) => prev.map((s) => (s._id === updatedSession._id ? updatedSession : s)));
      setSessionToEdit((prev) => prev && prev._id === updatedSession._id ? updatedSession : prev);
    });
    socket.on('session:deleted', (deletedId) => setSessions((prev) => prev.filter((s) => s._id !== deletedId)));
    socket.on('code:created', (newCode) => setCodes((prev) => [...prev, newCode]));
    socket.on('code:deleted', (deletedId) => setCodes((prev) => prev.filter((c) => c._id !== deletedId)));

    return () => {
      socket.off('session:created');
      socket.off('session:updated');
      socket.off('session:deleted');
      socket.off('code:created');
      socket.off('code:deleted');
    };
  }, [fetchAllData]);

  // --- HANDLERS ---
  const handleToggleSessionStatus = async (session) => {
    try {
      await api.patch(`/api/admin/sessions/${session._id}/toggle-status`);
    } catch (err) {
      setError("Erreur lors du changement de statut.");
    }
  };

  const handleCreateSessionSubmit = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      // On envoie une liste vide si pas remplie
      const payload = { ...newSessionData, sponsorsList: newSessionData.sponsorsList || "" };
      await api.post('/api/sessions/create', payload);
      setSuccess(`Session "${newSessionData.sessionName}" créée !`);
      setCreateSessionModalOpen(false);
      setNewSessionData({ sessionName: '', sessionCode: '', sponsorsList: '' });
    } catch (err) {
      setError(err.response?.data?.message || "Erreur création.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    setLoadingAction(true);
    try {
      await api.delete(`/api/admin/sessions/${sessionToDelete._id}`);
      setSessionToDelete(null);
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
      await api.put(
        `/api/admin/sessions/${sessionToEdit._id}/sponsors/${sponsorToEdit._id}`,
        sponsorData
      );
      setSponsorToEdit(null);
    } catch (err) { console.error(err); } finally { setLoadingAction(false); }
  };

  const handleGenerateCode = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const { data } = await api.post('/api/admin/generate-code', { role: newCodeRole });
      setSuccess(`Code généré: ${data.code.code}`);
    } catch (err) { setError(err.response?.data?.message || 'Erreur.'); } finally { setLoadingAction(false); }
  };

  const handleDeleteCode = async (codeId) => {
    if(window.confirm("Supprimer ce code ?")) {
      try { await api.delete(`/api/admin/codes/${codeId}`); } catch (err) { setError("Erreur suppression."); }
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'invite') { setCopiedCode(text); setTimeout(() => setCopiedCode(null), 2000); }
    else { setCopiedSessionCode(text); setTimeout(() => setCopiedSessionCode(null), 2000); }
  };

  // --- Rendu ---
  if (loading && sessions.length === 0) {
    return <PageTransition><Container sx={{ textAlign: 'center', mt: 10 }}><CircularProgress /></Container></PageTransition>;
  }

  return (
    <PageTransition>
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 } }}>
        <Box sx={{ textAlign: 'center', mb: 4, mt: 2 }}>
          <Typography variant="h4" component="h1" fontWeight="900" gutterBottom sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
            Dashboard Super-Admin
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddCircle />}
            onClick={() => setCreateSessionModalOpen(true)}
            sx={{ borderRadius: '50px', fontWeight: 'bold', mt: 1, px: 4 }}
          >
            Nouvelle Session
          </Button>
        </Box>
        
        {error && <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: '16px', mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ borderRadius: '16px', mb: 2 }}>{success}</Alert>}

        <Paper sx={{ borderRadius: '20px', overflow: 'hidden', bgcolor: 'rgba(255, 255, 255, 0.95)', boxShadow: 4 }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, v) => setTabValue(v)} 
            indicatorColor="primary" 
            textColor="primary" 
            variant="scrollable" // IMPORTANT POUR MOBILE
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Sessions" />
            <Tab label="Utilisateurs" />
            <Tab label="Codes Invitation" />
          </Tabs>

          {/* --- TAB SESSIONS (Refait pour Mobile) --- */}
          <TabPanel value={tabValue} index={0}>
            <Stack spacing={2}>
              {sessions.map((session) => (
                <Paper 
                  key={session._id} 
                  elevation={2} 
                  sx={{ 
                    p: 2, 
                    borderRadius: '16px',
                    borderLeft: `6px solid ${session.isActive ? '#4caf50' : '#bdbdbd'}`,
                    bgcolor: '#fff'
                  }}
                >
                  {/* Ligne 1 : Nom et Switch */}
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2, mr: 1 }}>
                      {session.sessionName}
                    </Typography>
                    <Box display="flex" flexDirection="column" alignItems="flex-end">
                      <Switch 
                        checked={session.isActive} 
                        onChange={() => handleToggleSessionStatus(session)} 
                        color="success" 
                        size="small"
                      />
                      <Typography variant="caption" color={session.isActive ? "success.main" : "text.disabled"} fontWeight="bold">
                        {session.isActive ? "ACTIVE" : "OFF"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Ligne 2 : Code et Infos */}
                  <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center" mb={2}>
                    <Chip 
                      icon={<Lock fontSize="small"/>} 
                      label={session.sessionCode} 
                      size="small" 
                      onClick={() => copyToClipboard(session.sessionCode, 'session')}
                      deleteIcon={copiedSessionCode === session.sessionCode ? <Check /> : <CopyAll />}
                      onDelete={() => copyToClipboard(session.sessionCode, 'session')}
                      color={copiedSessionCode === session.sessionCode ? "success" : "default"}
                      sx={{ mb: 1 }}
                    />
                    <Chip 
                      icon={<People fontSize="small"/>} 
                      label={`${session.sponsors.length} parrains`} 
                      size="small" 
                      variant="outlined" 
                      sx={{ mb: 1 }}
                    />
                  </Stack>

                  <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" mb={2}>
                    <Email fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} /> 
                    {session.createdBy?.email || 'Inconnu'}
                  </Typography>

                  {/* Ligne 3 : Actions */}
                  <Divider sx={{ mb: 1 }} />
                  <Box display="flex" justifyContent="flex-end" gap={1}>
                    <Button 
                      size="small" 
                      startIcon={<Edit />} 
                      onClick={() => setSessionToEdit(session)}
                      variant="outlined"
                      sx={{ borderRadius: '20px' }}
                    >
                      Gérer
                    </Button>
                    <Button 
                      size="small" 
                      startIcon={<DeleteForever />} 
                      onClick={() => setSessionToDelete(session)}
                      color="error"
                      variant="contained"
                      sx={{ borderRadius: '20px' }}
                    >
                      Supprimer
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Stack>
          </TabPanel>

          {/* --- TAB UTILISATEURS --- */}
          <TabPanel value={tabValue} index={1}>
            <List>
              {users.map((user) => (
                <ListItem key={user._id} divider>
                  <ListItemIcon><Person /></ListItemIcon>
                  <ListItemText
                    primary={user.email}
                    secondary={
                      <React.Fragment>
                        <Typography component="span" variant="body2" color="text.primary">
                          {user.role.toUpperCase()}
                        </Typography>
                        {` — Expire: ${user.accountExpiresAt ? new Date(user.accountExpiresAt).toLocaleDateString() : 'Jamais'}`}
                      </React.Fragment>
                    }
                  />
                  <Chip label={user.isActive ? 'Actif' : 'Inactif'} color={user.isActive ? 'success' : 'default'} size="small" />
                </ListItem>
              ))}
            </List>
          </TabPanel>

          {/* --- TAB CODES --- */}
          <TabPanel value={tabValue} index={2}>
            <Box component="form" onSubmit={handleGenerateCode} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3, p: 2, border: '1px dashed grey', borderRadius: '16px' }}>
              <Typography variant="subtitle2">Générer un nouveau code</Typography>
              <Box display="flex" gap={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Rôle</InputLabel>
                  <Select value={newCodeRole} label="Rôle" onChange={(e) => setNewCodeRole(e.target.value)}>
                    <MenuItem value="delegue">Délégué</MenuItem>
                    <MenuItem value="superadmin">Super-Admin</MenuItem>
                  </Select>
                </FormControl>
                <Button type="submit" variant="contained" disabled={loadingAction} startIcon={<AddCircle />}>
                  Créer
                </Button>
              </Box>
            </Box>
            <List>
              {codes.map((code) => (
                <ListItem key={code._id} divider>
                  <ListItemIcon><VpnKey color={code.isUsed ? 'disabled' : 'success'} /></ListItemIcon>
                  <ListItemText
                    primary={code.code}
                    secondary={code.isUsed ? "Utilisé" : `Pour: ${code.role.toUpperCase()}`}
                    sx={{ textDecoration: code.isUsed ? 'line-through' : 'none', color: code.isUsed ? 'text.disabled' : 'text.primary' }}
                  />
                  <Button size="small" onClick={() => copyToClipboard(code.code, 'invite')} disabled={code.isUsed}>
                    {copiedCode === code.code ? 'Copié' : 'Copier'}
                  </Button>
                  {!code.isUsed && <IconButton onClick={() => handleDeleteCode(code._id)} color="error"><DeleteForever /></IconButton>}
                </ListItem>
              ))}
            </List>
          </TabPanel>
        </Paper>

        {/* MODALS (Création, Suppression, Edition) */}
        <AnimatedModal open={createSessionModalOpen} onClose={() => setCreateSessionModalOpen(false)} maxWidth="md">
          <Typography variant="h5" align="center" fontWeight="bold" mb={3}>Nouvelle Session</Typography>
          <Box component="form" onSubmit={handleCreateSessionSubmit}>
            <TextField label="Nom (ex: IACC A)" fullWidth required value={newSessionData.sessionName} onChange={(e) => setNewSessionData({...newSessionData, sessionName: e.target.value})} sx={{ mb: 2 }} />
            <TextField label="Code LOKO" fullWidth required value={newSessionData.sessionCode} onChange={(e) => setNewSessionData({...newSessionData, sessionCode: e.target.value})} sx={{ mb: 2 }} InputProps={{ endAdornment: <InputAdornment position="end"><Lock /></InputAdornment> }} />
            <TextField label="Parrains (Optionnel)" fullWidth multiline rows={3} value={newSessionData.sponsorsList} onChange={(e) => setNewSessionData({...newSessionData, sponsorsList: e.target.value})} placeholder="Nom, Numéro" sx={{ mb: 3 }} />
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button onClick={() => setCreateSessionModalOpen(false)}>Annuler</Button>
              <Button type="submit" variant="contained" disabled={loadingAction}>{loadingAction ? <CircularProgress size={20}/> : "Créer"}</Button>
            </Stack>
          </Box>
        </AnimatedModal>

        <AnimatedModal open={Boolean(sessionToDelete)} onClose={() => setSessionToDelete(null)}>
          <Typography variant="h6" gutterBottom>Supprimer la session ?</Typography>
          <Typography sx={{ mb: 3 }}>Action irréversible pour <strong>{sessionToDelete?.sessionName}</strong>.</Typography>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={() => setSessionToDelete(null)}>Annuler</Button>
            <Button variant="contained" color="error" onClick={handleDeleteSession} disabled={loadingAction}>Supprimer</Button>
          </Stack>
        </AnimatedModal>

        <AnimatedModal open={Boolean(sessionToEdit)} onClose={() => setSessionToEdit(null)} maxWidth="md">
          <Typography variant="h6" gutterBottom>Parrains: {sessionToEdit?.sessionName}</Typography>
          <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
            {sessionToEdit?.sponsors.map((sponsor) => (
              <ListItem key={sponsor._id} divider secondaryAction={<IconButton onClick={() => { setSponsorToEdit(sponsor); setSponsorData({ name: sponsor.name, phone: sponsor.phone }); }}><EditNote /></IconButton>}>
                <ListItemText primary={sponsor.name} secondary={sponsor.phone} />
              </ListItem>
            ))}
          </List>
          <Button fullWidth onClick={() => setSessionToEdit(null)} sx={{ mt: 2 }}>Fermer</Button>
        </AnimatedModal>

        <AnimatedModal open={Boolean(sponsorToEdit)} onClose={() => setSponsorToEdit(null)}>
          <Typography variant="h6">Modifier Parrain</Typography>
          <Box component="form" onSubmit={handleUpdateSponsor} sx={{ mt: 2 }}>
            <TextField label="Nom" fullWidth value={sponsorData.name} onChange={(e) => setSponsorData({...sponsorData, name: e.target.value})} sx={{ mb: 2 }} />
            <TextField label="Téléphone" fullWidth value={sponsorData.phone} onChange={(e) => setSponsorData({...sponsorData, phone: e.target.value})} />
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button onClick={() => setSponsorToEdit(null)}>Annuler</Button>
              <Button type="submit" variant="contained" disabled={loadingAction}>Sauvegarder</Button>
            </Stack>
          </Box>
        </AnimatedModal>

      </Container>
    </PageTransition>
  );
};

export default SuperAdminDashboardPage;