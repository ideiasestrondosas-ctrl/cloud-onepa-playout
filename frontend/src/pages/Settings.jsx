import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { useNotification } from '../contexts/NotificationContext';
import { authAPI, settingsAPI, protectedAPI, playoutAPI } from '../services/api';
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
  ToggleButton,
  ToggleButtonGroup,
  ListItemButton,
  ListItemIcon,
  Paper,
  Slider,
  RadioGroup,
  Radio,
  FormControlLabel,
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
  PlayArrow as PlayIcon,
  Star as StartIcon,
  Tv as TvIcon,
  Dvr as PlatformIcon,
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
  Warning as WarningIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
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
    version: '',
    releaseDate: '',
    overlay_enabled: true,
    channelName: 'Cloud Onepa',
    branding_type: 'static',
    overlayOpacity: 1.0,
    overlayScale: 1.0,
    srtMode: 'caller',
    system_version: '',
    release_date: ''
  });
  const [logs, setLogs] = useState([]);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);

  const [loading, setLoading] = useState(true);
  const [protectedAssets, setProtectedAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'operator' });
  const [saving, setSaving] = useState(false);
  const [releaseNotesOpen, setReleaseNotesOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState(null);
  const [mediaSelectorOpen, setMediaSelectorOpen] = useState(false);
  const [mediaTypeSelector, setMediaTypeSelector] = useState('image'); // 'image' or 'video'
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

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
    if (showLogsDialog) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 2000);
      return () => clearInterval(interval);
    }
  }, [showLogsDialog]);

  const fetchLogs = async () => {
    try {
      setIsRefreshingLogs(true);
      const response = await playoutAPI.getLogs();
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsRefreshingLogs(false);
    }
  };

  const handleRetryPlayout = async () => {
    try {
      showWarning('Reiniciando transmissão...');
      await playoutAPI.stop();
      await new Promise(r => setTimeout(r, 1000));
      await playoutAPI.start();
      showSuccess('Transmissão reiniciada!');
      if (showLogsDialog) fetchLogs();
    } catch (error) {
      showError('Erro ao reiniciar!');
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.get();
      const data = response.data;
      
      // Determine branding type from logo path extension
      const isVideoBranding = data.logo_path && (data.logo_path.endsWith('.mp4') || data.logo_path.endsWith('.webm'));
      
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
        version: data.system_version || '1.9.1-PRO', 
        releaseDate: data.release_date || '2026-01-12',
        overlay_enabled: data.overlay_enabled ?? true,
        channelName: data.channel_name || 'Cloud Onepa',
        branding_type: isVideoBranding ? 'video' : 'static',
        overlayOpacity: data.overlay_opacity ?? 1.0,
        overlayScale: data.overlay_scale ?? 1.0,
        srtMode: data.srt_mode || 'caller',
        protectedPath: data.protected_path || '/var/lib/onepa-playout/assets/protected',
        docsPath: data.docs_path || '/app/docs',
        system_version: data.system_version || '1.9.2-PRO',
        release_date: data.release_date || '2026-01-13'
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
      setProtectedAssets(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch protected assets:', error);
      setProtectedAssets([]);
    }
  };

  const setDefaultMedia = async (type, path) => {
    try {
      setSaving(true);
      const updateData = type === 'image' 
        ? { default_image_path: path || '' }
        : { default_video_path: path || '' };
        
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
    srt: { url: 'srt://mediamtx:8890?mode=caller&streamid=publish:live/stream', resolution: '1920x1080', bitrate: '5000k' },
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
      videoBitrate: defaults.bitrate,
      // Reset mode for UDP/SRT to defaults
      udpMode: type === 'udp' ? 'unicast' : undefined,
      srtMode: type === 'srt' ? 'caller' : undefined
    }));
    showSuccess(`Configuração atualizada para ${type.toUpperCase()}`);
  };

  const handleUdpModeChange = (mode) => {
      const type = settings.outputType;
      // Define defaults based on protocol and mode
      let newUrl = '';
      if (type === 'udp') {
          newUrl = mode === 'multicast' ? 'udp://239.0.0.1:1234?ttl=2' : 'udp://127.0.0.1:1234';
      }

      setSettings(prev => ({
          ...prev,
          outputUrl: newUrl,
          udpMode: mode
      }));
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
        overlay_enabled: settings.overlay_enabled,
        channel_name: settings.channelName,
        overlay_opacity: settings.overlayOpacity,
        overlay_scale: settings.overlayScale,
        srt_mode: settings.srtMode,
        system_version: settings.version,
        release_date: settings.releaseDate
      });
      showSuccess('Configurações salvas! Reiniciando transmissão...');
      
      // Auto-start engine with new settings
      try {
        await playoutAPI.start();
        showSuccess('Transmissão reiniciada com sucesso!');
      } catch (startErr) {
        console.warn('Auto-start failed/already running:', startErr);
      }

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

                   {settings.outputType === 'srt' && (
                     <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Modo de Operação SRT</Typography>
                        <FormControl fullWidth sx={{ mt: 1 }}>
                          <Select
                             value={settings.srtMode || 'caller'}
                             onChange={(e) => {
                               const mode = e.target.value;
                               setSettings({ 
                                 ...settings, 
                                 srtMode: mode,
                                 outputUrl: mode === 'listener' 
                                   ? 'srt://0.0.0.0:9900?mode=listener'
                                   : 'srt://mediamtx:8890?mode=caller&streamid=publish:live/stream'
                               });
                             }}
                          >
                             <MenuItem value="caller">Caller (Playout conecta ao receptor)</MenuItem>
                             <MenuItem value="listener">Listener (Playout aguarda conexão)</MenuItem>
                          </Select>
                        </FormControl>
                        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                           <Button 
                              size="small" 
                              variant="outlined" 
                              startIcon={<HistoryIcon />}
                              onClick={() => setShowLogsDialog(true)}
                           >
                              Ver Logs SRT
                           </Button>
                           <Button 
                              size="small" 
                              variant="outlined" 
                              color="warning"
                              startIcon={<RefreshIcon />}
                              onClick={handleRetryPlayout}
                           >
                              Tentar Novamente
                           </Button>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Escolha <strong>Listener</strong> para o Playout servir o sinal, ou <strong>Caller</strong> para enviar a um servidor.
                        </Typography>
                     </Box>
                   )}

                  {/* UDP Mode Selection (Multicast/Unicast) - Only for UDP */}
                  {settings.outputType === 'udp' && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                       <Typography variant="subtitle2" gutterBottom>Modo de Transmissão UDP</Typography>
                       <RadioGroup 
                          row 
                          value={settings.udpMode || (settings.outputUrl.includes('239.') || settings.outputUrl.includes('224.') ? 'multicast' : 'unicast')}
                          onChange={(e) => handleUdpModeChange(e.target.value)}
                       >
                          <FormControlLabel value="unicast" control={<Radio size="small" />} label="Unicast (Local/Direct)" />
                          <FormControlLabel value="multicast" control={<Radio size="small" />} label="Multicast (Rede Local)" />
                       </RadioGroup>
                       <Typography variant="caption" color="text.secondary">
                          {settings.udpMode === 'multicast' || (settings.outputUrl.includes('239.') || settings.outputUrl.includes('224.'))
                             ? (
                               <Box component="span" sx={{ display: 'block', mt: 1 }}>
                                  <strong style={{ color: '#ff9800' }}>⚠️ Configuração Multicast (Sender):</strong> {settings.outputUrl}<br/>
                                  <strong style={{ color: '#4caf50' }}>✅ Abrir no VLC (Receiver):</strong> <code>udp://@239.0.0.1:1234</code>
                               </Box>
                             )
                             : (
                               <Box component="span" sx={{ display: 'block', mt: 1 }}>
                                  <strong style={{ color: '#2196f3' }}>ℹ️ Configuração Unicast (Sender):</strong> {settings.outputUrl}<br/>
                                  <strong style={{ color: '#4caf50' }}>✅ Abrir no VLC (Receiver):</strong> <code>udp://@:1234</code>
                               </Box>
                             )
                          }
                       </Typography>
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={8}>
                      <TextField
                        fullWidth
                        label="URL de Saída"
                        value={settings.outputUrl}
                        onChange={(e) => setSettings({ ...settings, outputUrl: e.target.value })}
                        placeholder="rtmp://localhost:1935/stream"
                      />
                  
                      {/* RTMP Guidance */}
                      {settings.outputType === 'rtmp' && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" fontWeight="bold">Servidor RTMP (VLC/OBS)</Typography>
                          <Typography variant="caption" display="block">
                            O Playout atua como <strong>Publisher</strong>. Para ver no VLC:
                          </Typography>
                          <Paper sx={{ mt: 1, p: 0.5, bgcolor: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <code style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>rtmp://{window.location.hostname}:1935/live/stream</code>
                            <IconButton size="small" onClick={() => { navigator.clipboard.writeText(`rtmp://${window.location.hostname}:1935/live/stream`); showSuccess('Copiado!'); }}>
                                <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Paper>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            💡 <strong>Dica VLC:</strong> Se der erro de I/O, verifique se o container 'mediamtx' está rodando (porta 1935).
                          </Typography>
                        </Alert>
                      )}

                        {/* SRT Guidance */}
                        {settings.outputType === 'srt' && (
                          <Alert severity={settings.srtMode === 'listener' ? "success" : "info"} sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              🛰️ Conexão SRT: {settings.srtMode === 'listener' ? 'Conexão Direta (Playout Listener)' : 'Ponte MediaMTX (Recomendado)'}
                            </Typography>
                            
                            {settings.srtMode === 'caller' ? (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" display="block">
                                  <strong>Solução de Ponte:</strong> O Playout envia para o MediaMTX interno e você puxa de lá. 
                                  Isso evita problemas de Firewall no seu Mac.
                                </Typography>
                                <Paper sx={{ mt: 1, p: 1, bgcolor: 'rgba(0,0,0,0.1)' }}>
                                  <Typography variant="caption" display="block" sx={{ fontWeight: 'bold', color: 'primary.main' }}>Passo 1: No Playout (Output URL)</Typography>
                                  <code>srt://mediamtx:8890?mode=caller&streamid=publish:live/stream</code>
                                  
                                  <Typography variant="caption" display="block" sx={{ mt: 1, fontWeight: 'bold', color: 'success.main' }}>Passo 2: No VLC (Fluxo de Rede)</Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <code>srt://localhost:8890?mode=caller&streamid=read:live/stream</code>
                                    <IconButton size="small" onClick={() => { navigator.clipboard.writeText(`srt://localhost:8890?mode=caller&streamid=read:live/stream`); showSuccess('Copiado!'); }}>
                                      <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </Paper>
                              </Box>
                            ) : (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" display="block">
                                  <strong>Modo Listener Direto:</strong> O Playout aguarda conexão na porta 9900.
                                </Typography>
                                <Paper sx={{ mt: 1, p: 1, bgcolor: 'rgba(0,0,0,0.1)' }}>
                                  <Typography variant="caption" display="block" sx={{ fontWeight: 'bold', color: 'primary.main' }}>Passo 1: No Playout (Output URL)</Typography>
                                  <code>srt://0.0.0.0:9900?mode=listener</code>
                                  
                                  <Typography variant="caption" display="block" sx={{ mt: 1, fontWeight: 'bold', color: 'success.main' }}>Passo 2: No VLC (Fluxo de Rede como Caller)</Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <code>srt://{window.location.hostname}:9900?mode=caller</code>
                                    <IconButton size="small" onClick={() => { navigator.clipboard.writeText(`srt://${window.location.hostname}:9900?mode=caller`); showSuccess('Copiado!'); }}>
                                      <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </Paper>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                  💡 <strong>Dica:</strong> Certifique-se que o VLC está no modo <strong>Caller</strong> para conectar ao Playout.
                                </Typography>
                              </Box>
                            )}
                          </Alert>
                        )}
 
                        {/* Logs Dialog */}
                        <Dialog 
                          open={showLogsDialog} 
                          onClose={() => setShowLogsDialog(false)}
                          maxWidth="md"
                          fullWidth
                        >
                          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Logs de Transmissão (FFmpeg/SRT)
                            <IconButton onClick={() => setShowLogsDialog(false)} size="small">
                              <CloseIcon />
                            </IconButton>
                          </DialogTitle>
                          <DialogContent dividers>
                            <Box 
                              sx={{ 
                                bgcolor: '#1e1e1e', 
                                color: '#d4d4d4', 
                                p: 2, 
                                borderRadius: 1,
                                fontFamily: 'monospace',
                                fontSize: '0.85rem',
                                minHeight: '300px',
                                maxHeight: '500px',
                                overflow: 'auto',
                                whiteSpace: 'pre-wrap'
                              }}
                            >
                              {logs.length > 0 ? (
                                logs.map((log, i) => (
                                  <div key={i} style={{ 
                                    borderBottom: '1px solid #333', 
                                    padding: '2px 0',
                                    color: log.includes('error') || log.includes('failed') ? '#f44336' : 
                                           log.includes('warn') ? '#ff9800' : 'inherit'
                                  }}>
                                    {log}
                                  </div>
                                ))
                              ) : (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                  Nenhum log disponível no momento.
                                </Box>
                              )}
                            </Box>
                          </DialogContent>
                          <DialogActions>
                            <Button onClick={fetchLogs} disabled={isRefreshingLogs}>
                              Atualizar Logs
                            </Button>
                            <Button onClick={handleRetryPlayout} color="warning">
                              Reiniciar SRT
                            </Button>
                            <Button onClick={() => setShowLogsDialog(false)}>
                              Fechar
                            </Button>
                          </DialogActions>
                        </Dialog>

                      {/* UDP Guidance */}
                      {settings.outputType === 'udp' && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" fontWeight="bold">Configuração UDP</Typography>
                          <Typography variant="caption" display="block">Para Multicast use o prefixo @:</Typography>
                          <Paper sx={{ mt: 0.5, p: 0.5, bgcolor: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <code style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>udp://@239.0.0.1:1234</code>
                            <IconButton size="small" onClick={() => { navigator.clipboard.writeText('udp://@239.0.0.1:1234'); showSuccess('Copiado!'); }}>
                                <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Paper>
                          <Typography variant="caption" display="block" sx={{ mt: 1 }}>Para Unicast (VLC):</Typography>
                          <Paper sx={{ mt: 0.5, p: 0.5, bgcolor: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                             <code style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>udp://[IP_DESTINO]:1234</code>
                          </Paper>
                        </Alert>
                      )}

                      {/* Desktop Preview Guidance */}
                      {settings.outputType === 'desktop' && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" fontWeight="bold">Desktop Preview</Typography>
                          <Typography variant="caption">
                            Esta opção abre uma janela SDL direta no servidor. 
                            <strong> Pode não funcionar em ambientes Docker ou Cloud sem X11/Display.</strong>
                          </Typography>
                        </Alert>
                      )}

                      {settings.outputType === 'rtmp' && (
                        <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'primary.main', cursor: 'pointer' }} onClick={() => {
                              const rtmpUrl = `rtmp://${window.location.hostname}:1935/live/stream`;
                              navigator.clipboard.writeText(rtmpUrl);
                              showSuccess(`Link RTMP copiado: ${rtmpUrl}`);
                          }}>
                          Link RTMP (VLC): rtmp://{window.location.hostname}:1935/live/stream
                        </Typography>
                      )}

                      {settings.outputType === 'srt' && (
                        <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'primary.main', cursor: 'pointer' }} onClick={() => {
                              const srtUrl = `srt://${window.location.hostname}:8890?mode=caller`;
                              navigator.clipboard.writeText(srtUrl);
                              showSuccess(`Link SRT copiado: ${srtUrl}`);
                          }}>
                          Link SRT (VLC Caller): srt://{window.location.hostname}:8890?mode=caller
                        </Typography>
                      )}

                      {settings.outputType === 'udp' && (
                        <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'primary.main' }}>
                          Link UDP: {settings.outputUrl}
                        </Typography>
                      )}

                      {settings.outputType === 'hls' && (
                        <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'primary.main', cursor: 'pointer' }} onClick={() => {
                              const hlsUrl = `${window.location.origin}/hls/stream.m3u8`;
                              navigator.clipboard.writeText(hlsUrl);
                              showSuccess(`Link HLS copiado: ${hlsUrl}`);
                          }}>
                          Link HLS de Baixa Latência: {window.location.origin}/hls/stream.m3u8
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
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

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Caminho Assets Protegidos"
                    value={settings.protectedPath}
                    disabled
                    helperText="Diretório de segurança (Somente Leitura)"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Caminho Documentação"
                    value={settings.docsPath}
                    disabled
                    helperText="Localização dos manuais e guias"
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
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          variant="contained" 
                          startIcon={<WizardIcon />}
                          onClick={() => navigate('/setup')}
                        >
                          Configurar Canal
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => setResetConfirmOpen(true)}
                        >
                          Eliminar Tudo
                        </Button>
                      </Box>
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
                  <Typography variant="h6" gutterBottom id="channel-identity">
                    Identidade do Canal
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <TextField
                      label="Nome do Canal"
                      value={settings.channelName}
                      onChange={(e) => setSettings({ ...settings, channelName: e.target.value })}
                      helperText="Este nome aparecerá no Dashboard e nos relatórios."
                    />
                  </FormControl>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom id="overlay-section">
                    Overlay (Marca d'água)
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="subtitle1">Ativar Overlay de Canal</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Mostra o logotipo e gráficos sobre o vídeo transmitido
                        </Typography>
                      </Box>
                      <Button 
                        variant={settings.overlay_enabled ? "contained" : "outlined"}
                        color={settings.overlay_enabled ? "success" : "inherit"}
                        onClick={() => setSettings({ ...settings, overlay_enabled: !settings.overlay_enabled })}
                      >
                        {settings.overlay_enabled ? "ATIVADO" : "DESATIVADO"}
                      </Button>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Opacidade do Logo ({Math.round(settings.overlayOpacity * 100)}%)
                      </Typography>
                      <Slider
                        value={settings.overlayOpacity || 1.0}
                        min={0}
                        max={1}
                        step={0.1}
                        onChange={(e, val) => setSettings({ ...settings, overlayOpacity: val })}
                        valueLabelDisplay="auto"
                        sx={{ mb: 2 }}
                      />

                      <Typography variant="subtitle2" gutterBottom>
                        Escala do Logo ({settings.overlayScale}x)
                      </Typography>
                      <Slider
                        value={settings.overlayScale || 1.0}
                        min={0.1}
                        max={2.0}
                        step={0.1}
                        onChange={(e, val) => setSettings({ ...settings, overlayScale: val })}
                        valueLabelDisplay="auto"
                        sx={{ mb: 2 }}
                      />
                    </Box>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={8}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                    <TextField
                      fullWidth
                      label="Caminho Absoluto do Logo"
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
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                Branding da Aplicação
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Personalize o visual do sistema carregando seu próprio logotipo para a barra lateral (Sidebar) e Login.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box 
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    border: '1px solid', 
                    borderColor: 'divider',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.default'
                  }}
                >
                  <img 
                    src={`/api/settings/app-logo?t=${Date.now()}`}
                    alt="App Logo" 
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=APP+LOGO'; }}
                  />
                </Box>
                <Box>
                  <Button variant="outlined" component="label" startIcon={<AddIcon />}>
                    Carregar Logo da App
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('file', file);
                        try {
                          await settingsAPI.uploadAppLogo(formData);
                          showSuccess('Logo da aplicação atualizado!');
                          // Force refresh
                          fetchSettings();
                        } catch (error) {
                          showError('Erro ao carregar logo da aplicação');
                        }
                      }}
                    />
                  </Button>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Recomendado: SVG ou PNG transparente (512x512px)
                  </Typography>
                </Box>
              </Box>
            </TabPanel>

            {/* Protected Assets & Branding Tab */}
            <TabPanel value={tabValue} index={3}>
              <Typography variant="h6" gutterBottom>
                Branding & Assets Protegidos
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                Configure a identidade visual do canal e os ficheiros de contingência (fillers).
                Os assets protegidos estão em: <code>/var/lib/onepa-playout/assets/protected</code>
              </Alert>

              {/* Branding Section */}
              <Paper sx={{ p: 3, mb: 3 }}>
                 <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StartIcon /> Identidade Visual (Branding)
                 </Typography>
                 <Divider sx={{ mb: 2 }} />
                 <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                       <Box sx={{ p: 2, bgcolor: '#000', borderRadius: 1, textAlign: 'center', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {/* Preview of Branding */}
                          {(settings.brandingType === 'video' || settings.branding_type === 'video') ? (
                              <video 
                                src="/assets/protected/Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4" 
                                autoPlay loop muted playsInline
                                style={{ maxHeight: '100%', maxWidth: '100%' }}
                              />
                          ) : (
                              <img 
                                src={`/api/settings/app-logo?t=${Date.now()}`} 
                                alt="Logo" 
                                style={{ maxHeight: '100%', maxWidth: '100%' }}
                              />
                          )}
                        </Box>
                     </Grid>

                     <Grid item xs={12} md={6}>
                       <Typography variant="subtitle2" gutterBottom>Modo de Exibição</Typography>
                       <ToggleButtonGroup
                          value={settings.branding_type || 'static'}
                          exclusive
                          onChange={(e, val) => {
                            if (val) {
                              const newLogoPath = val === 'video' 
                                ? '/assets/protected/Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4'
                                : '/assets/protected/Cloud_Onepa_Playout_Infinity_Logo_remodelado.png';
                              
                              setSettings({
                                ...settings, 
                                branding_type: val,
                                logoPath: newLogoPath
                              });
                            }
                          }}
                          fullWidth
                          sx={{ mb: 3 }}
                       >
                          <ToggleButton value="static">
                             <ImageIcon sx={{ mr: 1 }} /> Logotipo Estático
                          </ToggleButton>
                          <ToggleButton value="video">
                             <MovieIcon sx={{ mr: 1 }} /> Vídeo Animado
                          </ToggleButton>
                       </ToggleButtonGroup>
                       
                       <Typography variant="subtitle2" gutterBottom>Ficheiro de Vídeo (Branding)</Typography>
                       <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField 
                             fullWidth 
                             size="small" 
                             value="/assets/protected/Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4"
                             disabled
                          />
                          {/* Hardcoded for now as per specific request, or could use selector */}
                       </Box>
                       <Alert severity="info" sx={{ mt: 2, fontSize: '0.8rem' }}>
                          A alteração reflete-se no Login e no topo do Dashboard.
                        </Alert>
                    </Grid>
                 </Grid>
              </Paper>

              <Typography variant="h6" gutterBottom>
                Assets de Contingência (Padrão)
              </Typography>
              <Grid container spacing={2}>
                 <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                       <CardContent>
                          <Typography color="text.secondary" gutterBottom>Imagem Padrão (Fallback)</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
                             <ImageIcon fontSize="large" color="primary" />
                             <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                                <Typography variant="body2" noWrap title={settings.defaultImagePath}>
                                   {settings.defaultImagePath ? settings.defaultImagePath.split('/').pop() : 'Não definido'}
                                </Typography>
                             </Box>
                          </Box>
                          <Button 
                             variant="outlined" 
                             fullWidth 
                             startIcon={<FolderIcon />}
                             onClick={() => { setMediaTypeSelector('image'); setMediaSelectorOpen(true); }}
                          >
                             Selecionar Imagem
                          </Button>
                       </CardContent>
                    </Card>
                 </Grid>
                 <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                       <CardContent>
                          <Typography color="text.secondary" gutterBottom>Vídeo Padrão (Filler)</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
                             <MovieIcon fontSize="large" color="primary" />
                             <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                                <Typography variant="body2" noWrap title={settings.defaultVideoPath}>
                                   {settings.defaultVideoPath ? settings.defaultVideoPath.split('/').pop() : 'Não definido'}
                                </Typography>
                             </Box>
                          </Box>
                          <Button 
                             variant="outlined" 
                             fullWidth 
                             startIcon={<FolderIcon />}
                             onClick={() => { setMediaTypeSelector('video'); setMediaSelectorOpen(true); }}
                          >
                             Selecionar Vídeo
                          </Button>
                       </CardContent>
                    </Card>
                 </Grid>
              </Grid>

              {/* Enhanced Media Selector Dialog with Preview */}
              <Dialog 
                open={mediaSelectorOpen} 
                onClose={() => { setMediaSelectorOpen(false); setPreviewAsset(null); }} 
                maxWidth="md" 
                fullWidth
              >
                 <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1.5, px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.paper' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                       {mediaTypeSelector === 'video' ? 'Selecionar Vídeo' : 'Selecionar Imagem'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Button 
                            variant="outlined" 
                            color="error" 
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => {
                                setDefaultMedia(mediaTypeSelector, null);
                                setMediaSelectorOpen(false);
                                setPreviewAsset(null);
                            }}
                            sx={{ height: 32, fontSize: '0.75rem' }}
                        >
                            LIMPAR (Padrão)
                        </Button>
                        <Button 
                            variant="contained" 
                            color="primary"
                            size="small"
                            disabled={!previewAsset}
                            onClick={() => {
                                setDefaultMedia(mediaTypeSelector, previewAsset.path);
                                setMediaSelectorOpen(false);
                                setPreviewAsset(null);
                            }}
                            sx={{ height: 32, fontSize: '0.75rem' }}
                        >
                            CONFIRMAR
                        </Button>
                        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                        <IconButton onClick={() => { setMediaSelectorOpen(false); setPreviewAsset(null); }} size="small" sx={{ bgcolor: 'rgba(0,0,0,0.05)' }}>
                           <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                 </DialogTitle>
                 <DialogContent sx={{ p: 0 }}>
                    <Grid container sx={{ height: 500 }}>
                       {/* Left Column: List */}
                       <Grid item xs={12} md={5} sx={{ borderRight: '1px solid', borderColor: 'divider', overflowY: 'auto' }}>
                          <List>
                             {protectedAssets
                                .filter(a => mediaTypeSelector === 'video' ? a.is_video : !a.is_video)
                                .map((asset) => (
                                   <ListItem key={asset.path} disablePadding>
                                      <ListItemButton 
                                        selected={previewAsset?.path === asset.path}
                                        onClick={() => setPreviewAsset(asset)}
                                      >
                                         <ListItemIcon>
                                            {asset.is_video ? <MovieIcon /> : <ImageIcon />}
                                         </ListItemIcon>
                                         <ListItemText 
                                            primary={asset.name} 
                                            secondary={`${(asset.size / 1024 / 1024).toFixed(2)} MB`} 
                                            primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                                         />
                                         {((mediaTypeSelector === 'video' && settings.defaultVideoPath === asset.path) || 
                                           (mediaTypeSelector === 'image' && settings.defaultImagePath === asset.path)) && (
                                            <CheckIcon color="success" fontSize="small" />
                                         )}
                                      </ListItemButton>
                                   </ListItem>
                             ))}
                             {protectedAssets.filter(a => mediaTypeSelector === 'video' ? a.is_video : !a.is_video).length === 0 && (
                                <Box sx={{ p: 4, textAlign: 'center', opacity: 0.6 }}>
                                   <PlatformIcon sx={{ fontSize: 48, mb: 1 }} />
                                   <Typography variant="body2">Nenhum asset encontrado.</Typography>
                                </Box>
                             )}
                          </List>
                       </Grid>

                       {/* Right Column: Preview & Confirm */}
                       <Grid item xs={12} md={7} sx={{ bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
                          <Box sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                             {previewAsset ? (
                                <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                   <Typography variant="subtitle2" gutterBottom color="primary">
                                      PREVIEW: {previewAsset.name}
                                   </Typography>
                                   <Box sx={{ 
                                      flexGrow: 1, 
                                      bgcolor: '#000', 
                                      borderRadius: 2, 
                                      overflow: 'hidden', 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center',
                                      boxShadow: 4,
                                      position: 'relative'
                                   }}>
                                      {previewAsset.is_video ? (
                                         <ReactPlayer
                                            url={protectedAPI.getStreamUrl(previewAsset.name)}
                                            width="100%"
                                            height="100%"
                                            playing={true}
                                            controls={true}
                                            muted={true}
                                            playsinline
                                            style={{ maxHeight: '100%' }}
                                         />
                                      ) : (
                                         <img 
                                            src={protectedAPI.getStreamUrl(previewAsset.name)} 
                                            alt="Preview" 
                                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                                         />
                                      )}
                                   </Box>
                                </Box>
                             ) : (
                                <Box sx={{ textAlign: 'center', opacity: 0.5 }}>
                                   <TvIcon sx={{ fontSize: 64, mb: 2 }} />
                                   <Typography>Selecione um ficheiro para pré-visualizar</Typography>
                                </Box>
                             )}
                          </Box>

                           {/* No footer buttons as they were moved to the top */}
                       </Grid>
                    </Grid>
                 </DialogContent>
              </Dialog>
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
                          <Typography variant="body1" fontWeight="bold">{settings.version ? (settings.version.startsWith('v') ? settings.version : 'v' + settings.version) : 'v1.9.2-PRO'}</Typography>
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
                        primary={<Typography variant="subtitle1"><strong>v1.9.2-PRO</strong> - 2026-01-12</Typography>}
                        secondary={
                          <Box component="span">
                            • Intermediary RTMP Server Integration (VLC Support)<br />
                            • Smart Media Deletion (Usage check & Replacement)<br />
                            • Friendly Media Copy (Cópia naming convention)<br />
                            • Calendar Event Deletion Fixes<br />
                            • Improved Output Configuration UI
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary={<Typography variant="subtitle1"><strong>v1.9.0-PRO</strong> - 2026-01-12</Typography>}
                        secondary={
                          <Box component="span">
                            • Áudio Standardizado (EBU R128 / Loudnorm)<br />
                            • Controlos de Overlay em Tempo Real (Opacidade/Escala)<br />
                            • Função Skip Instantâneo no Dashboard<br />
                            • Smart Launcher VLC com deteção de OS e Diagnóstico<br />
                            • Manual Visual e Ajuda Integrada
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary={<Typography variant="subtitle1"><strong>v1.8.1-EXP</strong> - 2026-01-11</Typography>}
                        secondary={
                          <Box component="span">
                            • Setup Wizard para configuração inicial<br />
                            • Melhorias na página de Settings (HLS links, Logo público)
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
                <TextField 
                  variant="standard" 
                  value={settings.version} 
                  onChange={(e) => setSettings({...settings, version: e.target.value})}
                  sx={{ width: 150 }}
                />
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="subtitle2" color="text.secondary">Última Atualização</Typography>
                <TextField 
                  variant="standard" 
                  value={settings.releaseDate} 
                  onChange={(e) => setSettings({...settings, releaseDate: e.target.value})}
                  sx={{ width: 150 }}
                />
              </Box>
              <Button size="small" color="primary" variant="outlined" onClick={() => setReleaseNotesOpen(true)}>Release Notes</Button>
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
      {/* Release Notes Dialog */}
      <Dialog 
        open={releaseNotesOpen} 
        onClose={() => setReleaseNotesOpen(false)} 
        maxWidth="md" 
        fullWidth
        scroll="paper"
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WizardIcon color="primary" /> Notas de Lançamento - {settings.version ? (settings.version.startsWith('v') ? settings.version : 'v' + settings.version) : 'v1.9.2-PRO'}
          </Box>
          <Chip label="PRO-RELEASE" color="success" size="small" />
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" color="primary" gutterBottom>Destaques da Versão 1.9.2-PRO</Typography>
            <Typography variant="body2" paragraph>
              Esta versão consolida a experiência PRO com refinamentos críticos na interface, estabilidade de upload e diagnósticos avançados de rede.
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, height: '100%', borderLeft: '4px solid', borderColor: 'primary.main' }}>
                  <Typography variant="subtitle2" fontWeight="bold">✨ UI/UX Refinements</Typography>
                  <Typography variant="caption">• Setup Wizard: Multi-select & Metadata</Typography><br />
                  <Typography variant="caption">• Playlist: Unique Clips & Bulk Add</Typography><br />
                  <Typography variant="caption">• Dashboard: Novo indicador ON AIR Pulsante</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, height: '100%', borderLeft: '4px solid', borderColor: 'success.main' }}>
                  <Typography variant="subtitle2" fontWeight="bold">📡 Protocol & Diagnostics</Typography>
                  <Typography variant="caption">• VLC Smart Launcher com Logs em Tempo Real</Typography><br />
                  <Typography variant="caption">• SRT: Configuração Dinâmica (Caller/Listener)</Typography><br />
                  <Typography variant="caption">• Safari: Fix Áudio Context & LUFS Meter</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, height: '100%', borderLeft: '4px solid', borderColor: 'warning.main' }}>
                  <Typography variant="subtitle2" fontWeight="bold">🛡️ Estabilidade Crítica</Typography>
                  <Typography variant="caption">• Fix: Upload Sequencial (White Screen)</Typography><br />
                  <Typography variant="caption">• Fix: Delete Confirm Dialog (Chrome)</Typography><br />
                  <Typography variant="caption">• Versão Sincronizada: v1.9.2-PRO</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, height: '100%', borderLeft: '4px solid', borderColor: 'secondary.main' }}>
                  <Typography variant="subtitle2" fontWeight="bold">🔧 Performance</Typography>
                  <Typography variant="caption">• Clean Build System (Docker Cache Reset)</Typography><br />
                  <Typography variant="caption">• Otimização de renderização de listas</Typography><br />
                  <Typography variant="caption">• Validação robusta de caminhos de arquivo</Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>Próximos Passos (Roadmap)</Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="📡 Fase 22: Conectividade & Live Inputs" secondary="WebRTC, NDI, SDI, Streaming nativo para YouTube/Facebook Live, SRT Support" />
            </ListItem>
            <ListItem>
              <ListItemText primary="📅 Fase 23: EPG & Metadata Engine" secondary="Gerador de EPG, Exportação Web, Compliance XMLTV/DVB-EIT" />
            </ListItem>
            <ListItem>
              <ListItemText primary="🎨 Fase 24: Graphics & Visual Experience" secondary="Editor Drag-and-Drop, HTML5 Graphics, Mobile Responsive Layout" />
            </ListItem>
            <ListItem>
              <ListItemText primary="🏢 Fase 25: Enterprise & Compliance" secondary="Multi-user (RBAC), Audit Logs, As-Run Logs, SCTE-35 Support" />
            </ListItem>
            <ListItem>
              <ListItemText primary="🚀 Fase 26: Future Tech" secondary="AI Integration, Multi-Channel Core, High Availability" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReleaseNotesOpen(false)}>Fechar</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setReleaseNotesOpen(false);
              showSuccess('Obrigado pelo seu feedback!');
            }}
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
      {/* Preview Dialog */}
      <Dialog 
        open={previewOpen} 
        onClose={() => setPreviewOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { bgcolor: '#000', color: '#fff' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#222' }}>
          <Typography variant="h6">{previewAsset?.name}</Typography>
          <IconButton onClick={() => setPreviewOpen(false)} sx={{ color: '#fff' }}>
            <AddIcon sx={{ transform: 'rotate(45deg)' }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          {previewAsset && (
            previewAsset.is_video ? (
              <ReactPlayer
                url={protectedAPI.getStreamUrl(previewAsset.name)}
                playing
                controls
                width="100%"
                height="100%"
                style={{ maxHeight: '70vh' }}
              />
            ) : (
              <img 
                src={protectedAPI.getStreamUrl(previewAsset.name)} 
                alt={previewAsset.name} 
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} 
              />
            )
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#222' }}>
          <Button onClick={() => setPreviewOpen(false)} sx={{ color: '#fff' }}>Fechar</Button>
          {previewAsset && (
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => {
                setDefaultMedia(previewAsset.is_video ? 'video' : 'image', previewAsset.path);
                setPreviewOpen(false);
              }}
            >
              Definir como Padrão
            </Button>
          )}
        </DialogActions>
      </Dialog>
      {/* Factory Reset Confirmation Dialog */}
      <Dialog open={resetConfirmOpen} onClose={() => setResetConfirmOpen(false)}>
        <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon /> Confirmar Factory Reset
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Tem a certeza que deseja eliminar <strong>TODOS</strong> os dados deste canal?
          </Typography>
          <Typography variant="body2" color="error" sx={{ fontWeight: 'bold' }}>
            Esta ação irá apagar permanentemente todas as playlists, agendamentos do calendário e restaurar as definições padrão. Não há volta atrás!
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetConfirmOpen(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            color="error" 
            autoFocus
            onClick={async () => {
              try {
                setSaving(true);
                await settingsAPI.resetAll();
                showSuccess('Canal resetado com sucesso!');
                setResetConfirmOpen(false);
                fetchSettings(); // Refresh to see defaults
              } catch (error) {
                showError('Erro ao realizar reset do canal');
              } finally {
                setSaving(false);
              }
            }}
          >
            Sim, Eliminar Tudo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
