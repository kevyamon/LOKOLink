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
  Tooltip, // Ajout pour le "copier"
} from '@mui/material';
import {
  Edit,
  DeleteForever,
  People,
  Person,
  Phone,
  EditNote,
  VpnKey,
  AddCircle,
  CopyAll,
  Check, // Pour le feedback "copié"
} from '@mui/icons-material';
import api from '../services/api';
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
  // État pour les onglets
  const [tabValue, setTabValue] = useState(0);

  // États de la page
  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // Pour le feedback (copier, générer)
  const [copiedCode, setCopiedCode] = useState(null); // Pour le feedback "Copié"

  // États pour les modals
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [sessionToEdit, setSessionToEdit] = useState(null);
  const [loadingEditModal, setLoadingEditModal] = useState(false);
  const [sponsorToEdit, setSponsorToEdit] = useState(null);
  const [sponsorData, setSponsorData] = useState({ name: '', phone: '' });

  // État pour la génération de code
  const [newCodeRole, setNewCodeRole] = useState('delegue');

  // --- Fonctions de chargement ---
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
      setError(err.response?.data?.message || 'Impossible de charger les données admin.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // --- GESTION DES SESSIONS ---
  const openDeleteModal = (session) => setSessionToDelete(session);
  const closeDeleteModal = () => setSessionToDelete(null);
  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    setLoading(true); // Bloque la page
    try {
      await api.delete(`/api/admin/sessions/${sessionToDelete._id}`);
      closeDeleteModal();
      await fetchAllData(); // Recharge tout
    } catch (err) {
      setError('Erreur lors de la suppression.');
      setLoading(false);
    }
  };

  const openEditModal = (session) => {
    // Pas besoin d'API call, on a déjà l'info
    setSessionToEdit(session);
  };
  const closeEditModal = () => setSessionToEdit(null);
  
  const openSponsorModal = (sponsor) => {
    setSponsorToEdit(sponsor);
    setSponsorData({ name: sponsor.name, phone: sponsor.phone });
  };
  const closeSponsorModal = () => setSponsorToEdit(null);

  const handleSponsorDataChange = (e) => {
    setSponsorData({ ...sponsorData, [e.target.name]: e.target.value });
  };
  
  const handleUpdateSponsor = async (e) => {
    e.preventDefault();
    if (!sponsorToEdit || !sessionToEdit) return;
    setLoadingEditModal(true);
    try {
      const { data: updatedSession } = await api.put(
        `/api/admin/sessions/${sessionToEdit._id}/sponsors/${sponsorToEdit._id}`,
        sponsorData
      );
      // Met à jour la session dans la liste principale
      setSessions(prevSessions => 
        prevSessions.map(s => s._id === updatedSession.session._id ? updatedSession.session : s)
      );
      setSessionToEdit(updatedSession.session); // Met à jour le modal
      closeSponsorModal();
    } catch (err) {
      console.error('Erreur MàJ parrain:', err);
      // On pourrait mettre une alerte dans le modal
    } finally {
      setLoadingEditModal(false);
    }
  };
  
  // --- GESTION DES CODES ---
  const handleGenerateCode = async (e) => {
    e.preventDefault();
    setLoading(true); // Utilise le loading global
    try {
      const { data } = await api.post('/api/admin/generate-code', { role: newCodeRole });
      setSuccess(`Code généré: ${data.code.code}`);
      await fetchAllData(); // Recharger tout
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la génération.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCode = async (codeId) => {
    if (window.confirm("Supprimer ce code ? Il ne pourra plus être utilisé.")) {
      setLoading(true);
      try {
        await api.delete(`/api/admin/codes/${codeId}`);
        await fetchAllData(); // Recharger tout
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur suppression code.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code); // Feedback visuel sur le bouton
    setTimeout(() => setCopiedCode(null), 2000);
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
          
          {error && <Alert severity="error" sx={{ borderRadius: '16px', mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ borderRadius: '16px', mb: 2 }}>{success}</Alert>}

          {/* SÉLECTEUR D'ONGLETS */}
          <Paper sx={{ borderRadius: '16px 16px 0 0', bgcolor: 'rgba(255, 255, 255, 0.9)' }}>
            <Tabs 
              value={tabValue} 
              onChange={(e, newValue) => setTabValue(newValue)} 
              indicatorColor="primary" 
              textColor="primary" 
              variant="fullWidth"
            >
              <Tab label={`Sessions (${sessions.length})`} />
              <Tab label={`Utilisateurs (${users.length})`} />
              <Tab label={`Codes d'invitation (${codes.length})`} />
            </Tabs>
          </Paper>

          {/* PANNEAUX D'ONGLETS */}
          <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.9)', borderRadius: '0 0 16px 16px', boxShadow: 3 }}>
            
            {/* PANNEAU 0: SESSIONS */}
            <TabPanel value={tabValue} index={0}>
              <List>
                {sessions.map((session) => (
                  <React.Fragment key={session._id}>
                    <ListItem
                      secondaryAction={
                        <>
                          <Tooltip title="Modifier Parrains">
                            <IconButton edge="end" aria-label="éditer" onClick={() => openEditModal(session)}><Edit /></IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer Session">
                            <IconButton edge="end" aria-label="supprimer" onClick={() => openDeleteModal(session)}><DeleteForever color="error" /></IconButton>
                          </Tooltip>
                        </>
                      }
                    >
                      <ListItemIcon><People /></ListItemIcon>
                      <ListItemText
                        primary={session.sessionName}
                        secondary={`Créé par: ${session.createdBy?.email || 'N/A'} | ${session.sponsors.length} parrain(s)`}
                        primaryTypographyProps={{ fontWeight: 'bold' }}
                      />
                      <Chip label={session.isActive ? 'Active' : 'Inactive'} color={session.isActive ? 'success' : 'default'} size="small" />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            </TabPanel>

            {/* PANNEAU 1: UTILISATEURS */}
            <TabPanel value={tabValue} index={1}>
              <List>
                {users.map((user) => (
                  <ListItem key={user._id}>
                    <ListItemIcon><Person /></ListItemIcon>
                    <ListItemText
                      primary={user.email}
                      secondary={`Rôle: ${user.role} | Expiration: ${user.accountExpiresAt ? new Date(user.accountExpiresAt).toLocaleDateString() : 'Jamais'}`}
                    />
                    <Chip 
                      label={user.isActive ? (user.accountExpiresAt && new Date(user.accountExpiresAt) < new Date() ? 'Expiré' : 'Actif') : 'Inactif'}
                      color={user.isActive ? (user.accountExpiresAt && new Date(user.accountExpiresAt) < new Date() ? 'warning' : 'success') : 'default'}
                      size="small" 
                    />
                  </ListItem>
                ))}
              </List>
            </TabPanel>

            {/* PANNEAU 2: CODES D'INVITATION */}
            <TabPanel value={tabValue} index={2}>
              {/* Formulaire de génération */}
              <Box component="form" onSubmit={handleGenerateCode} sx={{ display: 'flex', gap: 2, mb: 3, p: 2, border: '1px dashed grey', borderRadius: '16px' }}>
                <FormControl fullWidth>
                  <InputLabel id="role-select-label">Rôle à générer</InputLabel>
                  <Select
                    labelId="role-select-label"
                    value={newCodeRole}
                    label="Rôle à générer"
                    onChange={(e) => setNewCodeRole(e.target.value)}
                    size="small"
                  >
                    <MenuItem value="delegue">Délégué (Expire en 9 mois)</MenuItem>
                    <MenuItem value="superadmin">Super-Admin (Expire en 9 mois)</MenuItem>
                  </Select>
                </FormControl>
                <Button type="submit" variant="contained" disabled={loading} startIcon={<AddCircle />}>
                  {loading ? <CircularProgress size={24} /> : 'Générer'}
                </Button>
              </Box>
              
              {/* Liste des codes */}
              <List>
                {codes.map((code) => (
                  <ListItem key={code._id}
                    secondaryAction={
                      !code.isUsed && (
                        <Tooltip title="Supprimer ce code">
                          <IconButton edge="end" aria-label="supprimer" onClick={() => handleDeleteCode(code._id)} disabled={loading}>
                            <DeleteForever color="error" />
                          </IconButton>
                        </Tooltip>
                      )
                    }
                  >
                    <ListItemIcon><VpnKey color={code.isUsed ? 'disabled' : 'success'} /></ListItemIcon>
                    <ListItemText
                      primary={code.code}
                      secondary={`Rôle: ${code.role} | Créé par: ${code.createdBy?.email || 'N/A'}`}
                      sx={{ textDecoration: code.isUsed ? 'line-through' : 'none', color: code.isUsed ? 'text.disabled' : 'text.primary' }}
                    />
                    <Button 
                      size="small" 
                      startIcon={copiedCode === code.code ? <Check /> : <CopyAll />} 
                      onClick={() => handleCopyCode(code.code)} 
                      disabled={code.isUsed}
                      color={copiedCode === code.code ? 'success' : 'primary'}
                    >
                      {copiedCode === code.code ? 'Copié!' : 'Copier'}
                    </Button>
                  </ListItem>
                ))}
              </List>
            </TabPanel>

          </Box>
        </Container>

        {/* MODAL 1: Confirmation de Suppression */}
        <AnimatedModal 
          open={Boolean(sessionToDelete)} 
          onClose={closeDeleteModal} 
          maxWidth="md"
        >
          <Typography variant="h6" component="h2" gutterBottom>
            Supprimer la session ?
          </Typography>
          <Typography>
            Êtes-vous sûr de vouloir supprimer définitivement la session
            <strong> "{sessionToDelete?.sessionName}"</strong> ?
          </Typography>
          <Typography color="error" sx={{ mt: 1 }}>
            Cette action est irréversible et supprimera aussi tous les binômes associés.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={closeDeleteModal}>
              Annuler
            </Button>
            <Button variant="contained" color="error" onClick={handleDeleteSession} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Supprimer Définitivement'}
            </Button>
          </Stack>
        </AnimatedModal>

        {/* MODAL 2: Édition de Session (Liste des Parrains) */}
        <AnimatedModal 
          open={Boolean(sessionToEdit)} 
          onClose={closeEditModal} 
          maxWidth="md"
        >
          <Typography variant="h6" component="h2" gutterBottom>
            Éditer la session: {sessionToEdit?.sessionName}
          </Typography>
          {loadingEditModal ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {sessionToEdit?.sponsors.map((sponsor) => (
                <ListItem
                  key={sponsor._id}
                  secondaryAction={
                    <Tooltip title="Modifier ce parrain">
                      <IconButton edge="end" aria-label="éditer parrain" onClick={() => openSponsorModal(sponsor)}>
                        <EditNote />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemIcon>
                    <Person />
                  </ListItemIcon>
                  <ListItemText
                    primary={sponsor.name}
                    secondary={sponsor.phone}
                  />
                </ListItem>
              ))}
            </List>
          )}
          <Button variant="outlined" onClick={closeEditModal} sx={{ mt: 2 }}>
            Fermer
          </Button>
        </AnimatedModal>

        {/* MODAL 3: Édition d'un Parrain (Formulaire) */}
        <AnimatedModal open={Boolean(sponsorToEdit)} onClose={closeSponsorModal}>
          <Typography variant="h6" component="h2" gutterBottom>
            Modifier Parrain/Marraine
          </Typography>
          <Box component="form" onSubmit={handleUpdateSponsor}>
            <TextField
              label="Nom Complet"
              name="name"
              value={sponsorData.name}
              onChange={handleSponsorDataChange}
              fullWidth
              required
              sx={{ mt: 2 }}
            />
            <TextField
              label="Téléphone"
              name="phone"
              value={sponsorData.phone}
              onChange={handleSponsorDataChange}
              fullWidth
              required
              sx={{ mt: 2 }}
            />
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button variant="outlined" onClick={closeSponsorModal}>
                Annuler
              </Button>
              <Button variant="contained" type="submit" disabled={loadingEditModal}>
                {loadingEditModal ? <CircularProgress size={24} /> : 'Enregistrer'}
              </Button>
            </Stack>
          </Box>
        </AnimatedModal>
      </>
    </PageTransition>
  );
};

export default SuperAdminDashboardPage;