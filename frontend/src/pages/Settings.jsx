import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { authAPI, settingsAPI, protectedAPI } from '../services/api';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  AutoAwesome as WizardIcon,
  Folder as FolderIcon,
  Image as ImageIcon,
  Movie as MovieIcon,
  CheckCircle as CheckIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError, showWarning } = useNotification();
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState({
    outputType: 'rtmp',
    outputUrl: '',
    resolution: '1920x1080',
    fps: '25',
    videoBitrate: '5000k',
    audioBitrate: '192k',
    mediaPath: '',
    thumbnailsPath: '',
    playlistsPath: '',
    fillersPath: '',
    logoPath: '',
    logoPosition: 'top-right',
    dayStart: '06:00',
    defaultImagePath: '',
    defaultVideoPath: '',
    version: '1.7.0-PRO',
    releaseDate: '2026-01-10'
  });

  const [loading, setLoading] = useState(true);
  const [protectedAssets, setProtectedAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'operator' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchProtectedAssets();
    
    // Handle URL parameters for deep-linking
    const tab = searchParams.get('tab');
    if (tab === 'playout') {
      setTabValue(2); // Playout tab index
      
      // Scroll to overlay section after a short delay
      const focus = searchParams.get('focus');
      if (focus === 'overlay') {
        setTimeout(() => {
          const overlaySection = document.getElementById('overlay-section');
          if (overlaySection) {
            overlaySection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            overlaySection.style.backgroundColor = 'rgba(25, 118, 210, 0.1)';
            setTimeout(() => {
              overlaySection.style.backgroundColor = '';
            }, 2000);
          }
        }, 300);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (tabValue === 3) {
      fetchUsers();
    }
  }, [tabValue]);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.get();
      const data = response.data;
      setSettings({
        outputType: data.output_type || 'rtmp',
        outputUrl: data.output_url || '',
        resolution: data.resolution || '1920x1080',
        fps: data.fps || '25',
        videoBitrate: data.video_bitrate || '5000k',
        audioBitrate: data.audio_bitrate || '192k',
        mediaPath: data.media_path || '',
        thumbnailsPath: data.thumbnails_path || '',
        playlistsPath: data.playlists_path || '',
        fillersPath: data.fillers_path || '',
        logoPath: data.logo_path || '',
        logoPosition: data.logo_position || 'top-right',
        dayStart: data.day_start || '06:00',
        defaultImagePath: data.default_image_path || '',
        defaultVideoPath: data.default_video_path || '',
        version: '1.7.0-PRO', // Frontend override for consistency
        releaseDate: '2026-01-10'
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      showError('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const fetchProtectedAssets = async () => {
    try {
      const response = await protectedAPI.list();
      setProtectedAssets(response.data);
    } catch (error) {
      console.error('Failed to fetch protected assets:', error);
    }
  };

  const setDefaultMedia = async (type, path) => {
    try {
      setSaving(true);
      const updateData = type === 'image' 
        ? { default_image_path: path }
        : { default_video_path: path };
        
      await settingsAPI.update(updateData);
      setSettings(prev => ({
        ...prev,
        [type === 'image' ? 'defaultImagePath' : 'defaultVideoPath']: path
      }));
      showSuccess(`${type === 'image' ? 'Imagem' : 'Vídeo'} padrão atualizado!`);
    } catch (error) {
      console.error('Failed to set default media:', error);
      showError('Erro ao atualizar mídia padrão');
    } finally {
      setSaving(false);
    }
  };

  // Output Defaults Configuration
  const OUTPUT_DEFAULTS = {
    rtmp: { url: 'rtmp://localhost:1935/live/stream', resolution: '1280x720', bitrate: '2500k' },
    hls: { url: '/hls/stream.m3u8', resolution: '1920x1080', bitrate: '4000k' },
    srt: { url: 'srt://localhost:9000', resolution: '1920x1080', bitrate: '5000k' },
    udp: { url: 'udp://239.0.0.1:1234', resolution: '1280x720', bitrate: '3000k' },
    desktop: { url: 'local', resolution: '1920x1080', bitrate: '0' }
  };

  const handleOutputTypeChange = (type) => {
    const defaults = OUTPUT_DEFAULTS[type];
    setSettings(prev => ({
      ...prev,
      outputType: type,
      outputUrl: defaults.url,
      resolution: defaults.resolution,
      videoBitrate: defaults.bitrate
    }));
    showSuccess(`Configuração atualizada para ${type.toUpperCase()}`);
  };

  const fetchUsers = async () => {
    try {
      const response = await authAPI.listUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await settingsAPI.update({
        output_type: settings.outputType,
        output_url: settings.outputUrl,
        resolution: settings.resolution,
        fps: settings.fps,
        video_bitrate: settings.videoBitrate,
        audio_bitrate: settings.audioBitrate,
        media_path: settings.mediaPath,
        thumbnails_path: settings.thumbnailsPath,
        playlists_path: settings.playlistsPath,
        fillers_path: settings.fillersPath,
        logo_path: settings.logoPath,
        logo_position: settings.logoPosition,
        day_start: settings.dayStart,
      });
      showSuccess('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showError('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await settingsAPI.uploadLogo(formData);
      setSettings({ ...settings, logoPath: response.data.path });
      showSuccess('Logo carregado com sucesso!');
    } catch (error) {
      showError('Erro ao carregar logo');
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) {
      showWarning('Preencha nome de utilizador e password');
      return;
    }
    
    try {
      await authAPI.register(newUser.username, newUser.password, newUser.role);
      showSuccess('Utilizador criado com sucesso!');
      setUserDialogOpen(false);
      setNewUser({ username: '', password: '', role: 'operator' });
      fetchUsers();
    } catch (error) {
      showError(error.response?.data?.error || 'Erro ao criar utilizador');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este utilizador?')) return;
    try {
      await authAPI.deleteUser(id);
      showSuccess('Utilizador removido');
      fetchUsers();
    } catch (error) {
      showError('Erro ao deletar utilizador');
    }
  };

  const handleOpenPasswordDialog = (user) => {
    setSelectedUser(user);
    setPasswordDialogOpen(true);
    setNewPassword('');
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      showWarning('A password deve ter pelo menos 8 caracteres');
      return;
    }

    try {
      await authAPI.changePassword(selectedUser.id, newPassword);
      showSuccess('Password alterada com sucesso!');
      setPasswordDialogOpen(false);
      setNewPassword('');
      setSelectedUser(null);
    } catch (error) {
      showError('Erro ao alterar password');
    }
  };

  // Preset Selection
  const activePreset = settings.resolution === '1280x720' && settings.videoBitrate === '2500k' ? '720p' :
                       settings.resolution === '1920x1080' && settings.videoBitrate === '5000k' ? '1080p' :
                       settings.resolution === '3840x2160' && settings.videoBitrate === '15000k' ? '4k' : 'custom';

  const applyPreset = (preset) => {
    if (preset === '720p') {
      setSettings({ ...settings, resolution: '1280x720', videoBitrate: '2500k', fps: '25' });
    } else if (preset === '1080p') {
      setSettings({ ...settings, resolution: '1920x1080', videoBitrate: '5000k', fps: '25' });
    } else if (preset === '4k') {
      setSettings({ ...settings, resolution: '3840x2160', videoBitrate: '15000k', fps: '30' });
    }
    showSuccess(`Preset ${preset} aplicado!`);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Configurações
      </Typography>

      <Card>
        {(!settings || typeof settings !== 'object') ? (
          <Box sx={{ p: 3 }}><Alert severity="error">Erro ao carregar configurações. Tente recarregar a página.</Alert></Box>
        ) : (
          <>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
              <Tab label="Output" />
              <Tab label="Caminhos" />
              <Tab label="Playout" />
              <Tab label="Assets Protegidos" />
              <Tab label="Utilizadores" />
              <Tab label="Presets" />
              <Tab label="Release Notes" />
            </Tabs>

            {/* Output Tab */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Configuração de Output
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Output</InputLabel>
                    <Select
                      value={settings.outputType}
                      label="Tipo de Output"
                      onChange={(e) => handleOutputTypeChange(e.target.value)}
                    >
                      <MenuItem value="rtmp">RTMP Stream</MenuItem>
                      <MenuItem value="hls">HLS</MenuItem>
                      <MenuItem value="srt">SRT</MenuItem>
                      <MenuItem value="udp">UDP</MenuItem>
                      <MenuItem value="desktop">Desktop (Preview)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="URL de Output"
                    value={settings.outputUrl}
                    onChange={(e) => setSettings({ ...settings, outputUrl: e.target.value })}
                    placeholder="rtmp://localhost:1935/live/stream"
                  />
                  {settings.outputType === 'hls' && (
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'primary.main', cursor: 'pointer' }} onClick={() => window.open(`${window.location.origin}${settings.outputUrl}`, '_blank')}>
                      Link Direto: {window.location.origin}{settings.outputUrl}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Qualidade de Vídeo
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Resolução</InputLabel>
                    <Select
                      value={settings.resolution}
                      label="Resolução"
                      onChange={(e) => setSettings({ ...settings, resolution: e.target.value })}
                    >
                      <MenuItem value="1280x720">720p (1280x720)</MenuItem>
                      <MenuItem value="1920x1080">1080p (1920x1080)</MenuItem>
                      <MenuItem value="3840x2160">4K (3840x2160)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>FPS</InputLabel>
                    <Select
                      value={settings.fps}
                      label="FPS"
                      onChange={(e) => setSettings({ ...settings, fps: e.target.value })}
                    >
                      <MenuItem value="24">24 fps</MenuItem>
                      <MenuItem value="25">25 fps</MenuItem>
                      <MenuItem value="30">30 fps</MenuItem>
                      <MenuItem value="60">60 fps</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Bitrate de Vídeo"
                    value={settings.videoBitrate}
                    onChange={(e) => setSettings({ ...settings, videoBitrate: e.target.value })}
                    placeholder="5000k"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Bitrate de Áudio"
                    value={settings.audioBitrate}
                    onChange={(e) => setSettings({ ...settings, audioBitrate: e.target.value })}
                    placeholder="192k"
                  />
                </Grid>
              </Grid>
            </TabPanel>

            {/* Paths Tab */}
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Caminhos de Armazenamento
                  </Typography>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Certifique-se de que os diretórios existem e têm permissões adequadas.
                  </Alert>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Caminho de Media"
                    value={settings.mediaPath}
                    onChange={(e) => setSettings({ ...settings, mediaPath: e.target.value })}
                    helperText="Diretório onde os ficheiros de vídeo/áudio são armazenados"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Caminho de Thumbnails"
                    value={settings.thumbnailsPath}
                    onChange={(e) => setSettings({ ...settings, thumbnailsPath: e.target.value })}
                    helperText="Diretório para thumbnails gerados automaticamente"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Caminho de Playlists"
                    value={settings.playlistsPath}
                    onChange={(e) => setSettings({ ...settings, playlistsPath: e.target.value })}
                    helperText="Diretório para ficheiros JSON de playlists"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Caminho de Fillers"
                    value={settings.fillersPath}
                    onChange={(e) => setSettings({ ...settings, fillersPath: e.target.value })}
                    helperText="Diretório com vídeos para preencher espaços vazios"
                  />
                </Grid>
              </Grid>
            </TabPanel>

            {/* Playout Tab */}
            <TabPanel value={tabValue} index={2}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Configurações de Playout
                  </Typography>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">
                        Precisa de ajuda para configurar o seu canal? Use o assistente de configuração.
                      </Typography>
                      <Button 
                        variant="contained" 
                        startIcon={<WizardIcon />}
                        onClick={() => navigate('/setup')}
                        sx={{ ml: 2 }}
                      >
                        Configurar Canal
                      </Button>
                    </Box>
                  </Alert>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Início do Dia"
                    type="time"
                    value={settings.dayStart}
                    onChange={(e) => setSettings({ ...settings, dayStart: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    helperText="Horário de início do dia de programação (ex: 06:00)"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom id="overlay-section">
                    Overlay & Logo
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={8}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                    <TextField
                      fullWidth
                      label="Caminho Completo do Logo"
                      value={settings.logoPath}
                      onChange={(e) => setSettings({ ...settings, logoPath: e.target.value })}
                      placeholder="/path/to/logo.png"
                      helperText="Pode fornecer um caminho local absoluto ou fazer upload"
                    />
                    <input
                      type="file"
                      id="logo-upload"
                      hidden
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                    <label htmlFor="logo-upload">
                      <Button variant="contained" component="span" startIcon={<AddIcon />}>
                        Upload
                      </Button>
                    </label>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Box 
                    sx={{ 
                      border: '1px dashed #ccc', 
                      borderRadius: 1, 
                      p: 1, 
                      textAlign: 'center',
                      minHeight: 80,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: '#fafafa',
                      mb: 2
                    }}
                  >
                    {settings.logoPath ? (
                      <Box sx={{ width: '100%' }}>
                        <img 
                          src={`/api/settings/logo?t=${Date.now()}`} 
                          alt="Logo" 
                          style={{ maxWidth: '100%', maxHeight: '50px', objectFit: 'contain' }} 
                        />
                        <Typography 
                          variant="caption" 
                          sx={{ display: 'block', mt: 1, color: 'primary.main', cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => window.open(`${window.location.origin}/api/settings/logo`, '_blank')}
                        >
                          Link Público
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Sem logo
                      </Typography>
                    )}
                  </Box>
                  <FormControl fullWidth>
                    <InputLabel>Posição do Logo</InputLabel>
                    <Select
                      value={settings.logoPosition}
                      label="Posição do Logo"
                      onChange={(e) => setSettings({ ...settings, logoPosition: e.target.value })}
                    >
                      <MenuItem value="top-left">Superior Esquerdo</MenuItem>
                      <MenuItem value="top-right">Superior Direito</MenuItem>
                      <MenuItem value="bottom-left">Inferior Esquerdo</MenuItem>
                      <MenuItem value="bottom-right">Inferior Direito</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Protected Assets Tab */}
            <TabPanel value={tabValue} index={3}>
              <Typography variant="h6" gutterBottom>
                Diretório de Assets Protegidos
              </Typography>
              <Alert severity="warning" sx={{ mb: 3 }}>
                Estes ficheiros são protegidos pelo sistema e não podem ser eliminados pelo utilizador.
                Pode defini-los como mídia padrão para o playout.
              </Alert>

              <Grid container spacing={2}>
                {protectedAssets.map((asset) => (
                  <Grid item xs={12} sm={6} md={4} key={asset.name}>
                    <Card variant="outlined">
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          {asset.is_video ? <MovieIcon color="primary" /> : <ImageIcon color="secondary" />}
                          <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 'bold' }} noWrap title={asset.name}>
                            {asset.name}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Tamanho: {(asset.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
                          Caminho: {asset.path}
                        </Typography>
                      </CardContent>
                      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                        <Button 
                          size="small" 
                          startIcon={<ViewIcon />}
                          onClick={() => window.open(protectedAPI.getStreamUrl(asset.name), '_blank')}
                        >
                          Pré-visualizar
                        </Button>
                        <Box>
                          {!asset.is_video ? (
                            <Button 
                              size="small" 
                              color={settings.defaultImagePath === asset.path ? "success" : "primary"}
                              variant={settings.defaultImagePath === asset.path ? "contained" : "text"}
                              onClick={() => setDefaultMedia('image', asset.path)}
                              startIcon={settings.defaultImagePath === asset.path ? <CheckIcon /> : null}
                            >
                              Padrão Image
                            </Button>
                          ) : (
                            <Button 
                              size="small" 
                              color={settings.defaultVideoPath === asset.path ? "success" : "primary"}
                              variant={settings.defaultVideoPath === asset.path ? "contained" : "text"}
                              onClick={() => setDefaultMedia('video', asset.path)}
                              startIcon={settings.defaultVideoPath === asset.path ? <CheckIcon /> : null}
                            >
                              Padrão Vídeo
                            </Button>
                          )}
                        </Box>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Configurações de Mídia Padrão
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Mídia Padrão (Imagem)"
                      value={settings.defaultImagePath}
                      disabled
                      helperText="Usado quando não há conteúdo de imagem disponível"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Mídia Padrão (Vídeo)"
                      value={settings.defaultVideoPath}
                      disabled
                      helperText="Usado como filler de segurança global"
                    />
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>

            {/* Users Tab */}
            <TabPanel value={tabValue} index={4}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Utilizadores
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setUserDialogOpen(true)}
                >
                  Adicionar Utilizador
                </Button>
              </Box>

              <List>
                {Array.isArray(users) && users.map((user) => (
                  <ListItem
                    key={user.id}
                    secondaryAction={
                      <Box>
                        <Button 
                          size="small" 
                          onClick={() => handleOpenPasswordDialog(user)}
                          sx={{ mr: 1 }}
                        >
                          Alterar Password
                        </Button>
                        {user.username !== 'admin' && (
                          <IconButton edge="end" onClick={() => handleDeleteUser(user.id)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    }
                    sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1 }}
                  >
                    <ListItemText
                      primary={user.username}
                      secondary={`Role: ${user.role}`}
                    />
                  </ListItem>
                ))}
                {(!users || users.length === 0) && (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                    Nenhum utilizador encontrado.
                  </Typography>
                )}
              </List>
            </TabPanel>

            {/* Presets Tab */}
            <TabPanel value={tabValue} index={5}>
              <Typography variant="h6" gutterBottom>
                Presets de Configuração
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                Clique num preset para aplicar configurações pré-definidas
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      cursor: 'pointer', 
                      bgcolor: activePreset === '720p' ? 'action.selected' : 'background.paper',
                      border: activePreset === '720p' ? '2px solid' : '1px solid',
                      borderColor: activePreset === '720p' ? 'primary.main' : 'divider'
                    }}
                    onClick={() => applyPreset('720p')}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6">720p Streaming</Typography>
                        {activePreset === '720p' && <Chip label="ATIVO" color="primary" size="small" />}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        1280x720 @ 25fps<br />
                        Bitrate: 2500k<br />
                        Ideal para streaming básico
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      cursor: 'pointer', 
                      bgcolor: activePreset === '1080p' ? 'action.selected' : 'background.paper',
                      border: activePreset === '1080p' ? '2px solid' : '1px solid',
                      borderColor: activePreset === '1080p' ? 'primary.main' : 'divider'
                    }}
                    onClick={() => applyPreset('1080p')}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6">1080p HD</Typography>
                        {activePreset === '1080p' && <Chip label="ATIVO" color="primary" size="small" />}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        1920x1080 @ 25fps<br />
                        Bitrate: 5000k<br />
                        Qualidade profissional
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      cursor: 'pointer', 
                      bgcolor: activePreset === '4k' ? 'action.selected' : 'background.paper',
                      border: activePreset === '4k' ? '2px solid' : '1px solid',
                      borderColor: activePreset === '4k' ? 'primary.main' : 'divider'
                    }}
                    onClick={() => applyPreset('4k')}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6">4K Ultra HD</Typography>
                        {activePreset === '4k' && <Chip label="ATIVO" color="primary" size="small" />}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        3840x2160 @ 30fps<br />
                        Bitrate: 15000k<br />
                        Máxima qualidade
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Release Notes Tab */}
            <TabPanel value={tabValue} index={6}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Informação do Sistema
                  </Typography>
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="subtitle2" color="text.secondary">Versão do Sistema</Typography>
                          <Typography variant="body1" fontWeight="bold">{settings.version}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="subtitle2" color="text.secondary">Última Atualização</Typography>
                          <Typography variant="body1">{settings.releaseDate}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="subtitle2" color="text.secondary">Frontend</Typography>
                          <Typography variant="body1">React 18.3 + Vite 5.4</Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="subtitle2" color="text.secondary">Backend</Typography>
                          <Typography variant="body1">Rust + Actix-web</Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="subtitle2" color="text.secondary">Base de Dados</Typography>
                          <Typography variant="body1">PostgreSQL 16</Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="subtitle2" color="text.secondary">Sistema Operativo</Typography>
                          <Typography variant="body1">Docker Container (Linux)</Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="subtitle2" color="text.secondary">FFmpeg</Typography>
                          <Typography variant="body1">7.2+</Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="subtitle2" color="text.secondary">Ambiente</Typography>
                          <Typography variant="body1">Production</Typography>
                        </Grid>
                      </Grid>
                      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                        <Button 
                          variant="outlined" 
                          size="small"
                          onClick={() => window.open('https://github.com/ideiasestrondosas-ctrl/cloud-onepa-playout/blob/master/RELEASE_NOTES.md', '_blank')}
                        >
                          Ver Release Notes Completas
                        </Button>
                        <Button 
                          variant="outlined" 
                          size="small"
                          onClick={() => window.open('https://github.com/ideiasestrondosas-ctrl/cloud-onepa-playout', '_blank')}
                        >
                          GitHub Repository
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Histórico de Versões
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary={<Typography variant="subtitle1"><strong>v1.7.0-PRO</strong> - 2026-01-10</Typography>}
                        secondary={
                          <Box component="span">
                            • Setup Wizard para configuração inicial<br />
                            • Melhorias na página de Settings (HLS links, Logo público)<br />
                            • Correção de bugs em Templates e Media Library<br />
                            • Dashboard com ações rápidas de diagnóstico
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary={<Typography variant="subtitle1"><strong>v1.0.0</strong> - 2025-12-31</Typography>}
                        secondary={
                          <Box component="span">
                            • Lançamento inicial<br />
                            • Sistema de playout completo<br />
                            • Gestão de media, playlists e agendamento<br />
                            • Suporte HLS e RTMP
                          </Box>
                        }
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Version Info Section */}
            <Divider />
            <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Versão do Sistema</Typography>
                <Typography variant="body2">{settings.version}</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="subtitle2" color="text.secondary">Última Atualização</Typography>
                <Typography variant="body2">{settings.releaseDate}</Typography>
              </Box>
              <Button size="small" color="inherit">Release Notes</Button>
            </Box>

            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderTop: 1, borderColor: 'divider' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveSettings}
                disabled={saving}
              >
                {saving ? 'A Guardar...' : 'Guardar Configurações'}
              </Button>
            </Box>
          </>
        )}
      </Card>

      {/* Add User Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Utilizador</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Username"
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            sx={{ mt: 2 }}
            placeholder="ex: joao.silva"
            helperText="Nome de utilizador único"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            sx={{ mt: 2 }}
            placeholder="Mínimo 8 caracteres"
            helperText="Use letras, números e símbolos"
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={newUser.role}
              label="Role"
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="operator">Operator</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleAddUser}>
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>


      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Alterar Password: {selectedUser?.username}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nova Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="Mínimo 8 caracteres"
            helperText="A nova password para este utilizador"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleChangePassword}>
            Alterar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
