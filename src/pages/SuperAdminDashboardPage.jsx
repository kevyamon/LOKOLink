// src/pages/SuperAdminDashboardPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Switch,
  InputAdornment,
  useMediaQuery,
  useTheme,
  Grid,
  Card,
  CardContent
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
  Email,
  Refresh,
  Search,
  Dns,
  SupervisedUserCircle
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

// --- COMPOSANT KPI CARD (Indicateurs Clés) ---
const KpiCard = ({ title, value, icon, color }) => (
  <Card sx={{ borderRadius: '20px', boxShadow: 3, height: '100%', position: 'relative', overflow: 'hidden' }}>
    <Box sx={{ 
      position: 'absolute', top: -10, right: -10, width: 80, height: 80, 
      bgcolor: color, opacity: 0.1, borderRadius: '50%' 
    }} />
    <CardContent sx={{ display: 'flex', alignItems: 'center', p: 2, '&:last-child': { pb: 2 } }}>
      <Box sx={{ 
        bgcolor: `${color}20`, 
        color: color, 
        borderRadius: '16px', 
        p: 1.5, 
        mr: 2, 
        display: 'flex' 
      }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ letterSpacing: 1 }}>
          {title.toUpperCase()}
        </Typography>
        <Typography variant="h5" fontWeight="900" color="text.primary">
          {value}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

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
  
  // État Recherche (Amélioration 2)
  const [searchTerm, setSearchTerm] = useState('');
  
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

  // --- FILTRAGE INTELLIGENT (Recherche + Masquage Eternal) ---
  
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => 
      s.sessionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.sessionCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sessions, searchTerm]);

  const filteredUsers = useMemo(() => {
    return users
      .filter(u => u.role !== 'eternal') // MISSION 2 : On cache Eternal
      .filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [users, searchTerm]);

  const filteredCodes = useMemo(() => {
    return codes.filter(c => c.code.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [codes, searchTerm]);

  // KPIs calculés
  const stats = {
    activeSessions: sessions.filter(s => s.isActive).length,
    totalUsers: users.filter(u => u.role !== 'eternal').length,
    availableCodes: codes.filter(c => !c.isUsed).length
  };

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

  // STYLE POUR LE SCROLL (Mission 1)
  const scrollableContainerSx = {
    maxHeight: '60vh', // Hauteur fixe qui force le scroll
    overflowY: 'auto', // Scroll vertical automatique
    pr: 1, // Padding pour éviter que la scrollbar colle
    // Custom Scrollbar (pour Chrome/Safari)
    '&::-webkit-scrollbar': { width: '6px' },
    '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '10px' },
    '&::-webkit-scrollbar-thumb': { background: '#ccc', borderRadius: '10px' },
    '&::-webkit-scrollbar-thumb:hover': { background: '#aaa' },
  };

  // --- Rendu ---
  if (loading && sessions.length === 0) {
    return <PageTransition><Container sx={{ textAlign: 'center', mt: 10 }}><CircularProgress /></Container></PageTransition>;
  }

  return (
    <PageTransition>
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 }, pb: 5 }}>
        
        {/* EN-TÊTE + BOUTON REFRESH (Amélioration 3) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, mt: 2 }}>
           <Box>
             <Typography variant="h4" component="h1" fontWeight="900" sx={{ fontSize: { xs: '1.5rem', md: '2.5rem' } }}>
              Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">Super-Admin Control Center</Typography>
           </Box>
           <Stack direction="row" spacing={1}>
             <Button 
               variant="contained" 
               color="inherit"
               onClick={fetchAllData} 
               sx={{ minWidth: 'auto', p: 1, borderRadius: '50%', bgcolor: 'white', color: 'primary.main', boxShadow: 2 }}
             >
               <Refresh />
             </Button>
             <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddCircle />}
              onClick={() => setCreateSessionModalOpen(true)}
              sx={{ borderRadius: '50px', fontWeight: 'bold', display: { xs: 'none', sm: 'flex' }, px: 3 }}
            >
              Session
            </Button>
           </Stack>
        </Box>

        {/* ALERTES */}
        {error && <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: '16px', mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ borderRadius: '16px', mb: 2 }}>{success}</Alert>}

        {/* 1. INDICATEURS CLÉS (Amélioration 1) */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <KpiCard title="Sessions Actives" value={stats.activeSessions} icon={<Dns />} color="#1976d2" />
          </Grid>
          <Grid item xs={6} sm={4}>
            <KpiCard title="Utilisateurs" value={stats.totalUsers} icon={<SupervisedUserCircle />} color="#2e7d32" />
          </Grid>
          <Grid item xs={6} sm={4}>
            <KpiCard title="Codes Dispo" value={stats.availableCodes} icon={<VpnKey />} color="#ed6c02" />
          </Grid>
        </Grid>

        {/* 2. BARRE DE RECHERCHE UNIFIÉE (Amélioration 2) */}
        <TextField
          fullWidth
          placeholder="Rechercher une session, un email, un code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment>,
          }}
          sx={{ 
            mb: 3, 
            bgcolor: 'white', 
            borderRadius: '16px',
            '& .MuiOutlinedInput-root': { borderRadius: '16px' },
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}
        />

        {/* ZONES À ONGLETS */}
        <Paper sx={{ borderRadius: '20px', overflow: 'hidden', bgcolor: 'rgba(255, 255, 255, 0.95)', boxShadow: 4 }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, v) => setTabValue(v)} 
            indicatorColor="primary" 
            textColor="primary" 
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={`Sessions (${filteredSessions.length})`} />
            <Tab label={`Comptes (${filteredUsers.length})`} />
            <Tab label={`Codes (${filteredCodes.length})`} />
          </Tabs>

          {/* --- TAB SESSIONS --- */}
          <TabPanel value={tabValue} index={0}>
            {/* Zone Scrollable */}
            <Box sx={scrollableContainerSx}>
              <Stack spacing={2}>
                {filteredSessions.map((session) => (
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
                {filteredSessions.length === 0 && (
                  <Typography align="center" color="text.secondary" py={4}>Aucune session trouvée.</Typography>
                )}
              </Stack>
            </Box>
          </TabPanel>

          {/* --- TAB UTILISATEURS --- */}
          <TabPanel value={tabValue} index={1}>
            {/* Zone Scrollable */}
            <Box sx={scrollableContainerSx}>
              <List>
                {filteredUsers.map((user) => (
                  <ListItem key={user._id} divider>
                    <ListItemIcon><Person color="primary" /></ListItemIcon>
                    <ListItemText
                      primary={user.email}
                      secondary={
                        <React.Fragment>
                          <Typography component="span" variant="body2" color="text.primary" fontWeight="bold">
                            {user.role.toUpperCase()}
                          </Typography>
                          {` — Expire: ${user.accountExpiresAt ? new Date(user.accountExpiresAt).toLocaleDateString() : 'Jamais'}`}
                        </React.Fragment>
                      }
                    />
                    <Chip label={user.isActive ? 'Actif' : 'Inactif'} color={user.isActive ? 'success' : 'default'} size="small" />
                  </ListItem>
                ))}
                {filteredUsers.length === 0 && (
                  <Typography align="center" color="text.secondary" py={4}>Aucun utilisateur trouvé (Eternal est masqué).</Typography>
                )}
              </List>
            </Box>
          </TabPanel>

          {/* --- TAB CODES --- */}
          <TabPanel value={tabValue} index={2}>
            <Box component="form" onSubmit={handleGenerateCode} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3, p: 2, border: '1px dashed grey', borderRadius: '16px' }}>
              <Typography variant="subtitle2" fontWeight="bold">Générer un nouveau code</Typography>
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
            
            {/* Zone Scrollable */}
            <Box sx={scrollableContainerSx}>
              <List>
                {filteredCodes.map((code) => (
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
                {filteredCodes.length === 0 && (
                  <Typography align="center" color="text.secondary" py={4}>Aucun code trouvé.</Typography>
                )}
              </List>
            </Box>
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