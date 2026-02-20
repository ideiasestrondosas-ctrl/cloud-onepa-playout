import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactPlayer from 'react-player';
import axios from 'axios';
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
  Checkbox,
  Switch,
  Stack,
  Tooltip,
  CircularProgress,
  ListSubheader,
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
  AutoFixHigh as MagicIcon,
  AspectRatio as AspectRatioIcon,
  Crop as CropIcon,
  CloudUpload as UploadIcon,
  Person as UserIcon,
  Settings as SettingsIcon,
  Language as LanguageIcon,
  Sensors as SensorsIcon,
  EventNote as EpgIcon,
  Brush as GraphicsIcon,
  Business as EnterpriseIcon,
  Speed as ScalabilityIcon,
  RocketLaunch as RocketIcon,
  Memory as AiIcon,
  BugReport as BugIcon // Added for ErrorBoundary
} from '@mui/icons-material';

// --- Error Boundary for Safety ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Settings UI Crash:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 5, color: '#fff', textAlign: 'center' }}>
          <BugIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>Algo correu mal nas Definições.</Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'rgba(0,0,0,0.5)', p: 2, borderRadius: 2, mb: 3 }}>
            {this.state.error && this.state.error.toString()}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>Recarregar Página</Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function UdpVerificationDialog({ open, onClose, onConfirm }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main', fontWeight: 'bold' }}>
        <WarningIcon /> Configuração e Verificação UDP
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Configuração de Transmissão por UDP
        </Typography>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1, borderLeft: '4px solid #ed6c02' }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>1. Tipos de Protocolo:</Typography>
          <Typography variant="body2" component="div">
            • <strong>Unicast (Direto):</strong> Ideal para enviar para um IP específico (ex: <code>udp://192.168.1.100:1234</code>).<br />
            • <strong>Multicast (Rede):</strong> Envia para um grupo (ex: <code>udp://239.0.0.1:1234</code>). Útil para vários receptores na mesma rede local.<br />
          </Typography>

          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>2. Como Aceder (VLC / Player Externo):</Typography>
          <Typography variant="body2" component="div">
            • <strong>Na mesma máquina:</strong> Abra o VLC e use <code>udp://@:1234</code>.<br />
            • <strong>Outro computador (Rede Local):</strong> Use <code>udp://@[IP_DO_SERVIDOR]:1234</code>.<br />
            • <strong>Acesso Externo:</strong> Requer <i>Port Forwarding</i> no router (Porta UDP 1234). Use o seu IP Público.<br />
          </Typography>

          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>3. Requisitos de Rede:</Typography>
          <Typography variant="body2" component="div">
            • <strong>Multicast:</strong> Pode bloquear redes Wi-Fi se não houver "IGMP Snooping". Prefira rede gigabit cabeada.<br />
            • <strong>Latência:</strong> O UDP é ultra-rápido mas não tem correção de erro. Picos de rede causam "frizz" na imagem.
          </Typography>
        </Box>

        <Typography variant="caption" display="block" sx={{ mt: 2, fontStyle: 'italic' }}>
          * Certifique-se que o firewall do servidor permite tráfego na porta escolhida.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancelar</Button>
        <Button onClick={onConfirm} variant="contained" color="warning">Entendi e Desejo Ativar</Button>
      </DialogActions>
    </Dialog>
  );
}

function OverlayConverterDialog({ open, onClose, onSave }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 200 });
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [autoTrim, setAutoTrim] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(1);

  const handleFile = (selectedFile) => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);

      const img = new Image();
      img.onload = () => {
        setAspectRatio(img.width / img.height);
        setDimensions({ width: img.width, height: img.height });
      };
      img.src = url;
    }
  };

  const handleFileSelect = (e) => {
    handleFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleWidthChange = (val) => {
    const w = parseInt(val) || 0;
    if (maintainAspect && aspectRatio) {
      setDimensions({ width: w, height: Math.round(w / aspectRatio) });
    } else {
      setDimensions(prev => ({ ...prev, width: w }));
    }
  };

  const handleHeightChange = (val) => {
    const h = parseInt(val) || 0;
    if (maintainAspect && aspectRatio) {
      setDimensions({ width: Math.round(h * aspectRatio), height: h });
    } else {
      setDimensions(prev => ({ ...prev, height: h }));
    }
  };

  const processAndSave = async () => {
    setProcessing(true);
    try {
      const img = new Image();
      img.src = previewUrl;
      await new Promise(resolve => img.onload = resolve);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: true });
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      let finalBlob;
      if (autoTrim) {
        finalBlob = await new Promise((resolve) => {
          const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = pixels.data;
          let top = canvas.height, bottom = 0, left = canvas.width, right = 0;
          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
              if (data[(y * canvas.width + x) * 4 + 3] > 0) {
                if (y < top) top = y;
                if (y > bottom) bottom = y;
                if (x < left) left = x;
                if (x > right) right = x;
              }
            }
          }
          const trimW = right - left + 1, trimH = bottom - top + 1;
          if (trimW > 0 && trimH > 0) {
            const tCanvas = document.createElement('canvas');
            tCanvas.width = trimW; tCanvas.height = trimH;
            tCanvas.getContext('2d').drawImage(canvas, left, top, trimW, trimH, 0, 0, trimW, trimH);
            tCanvas.toBlob(resolve, 'image/png');
          } else {
            canvas.toBlob(resolve, 'image/png');
          }
        });
      } else {
        finalBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      }

      const convertedFile = new File([finalBlob], file.name.replace(/\.[^/.]+$/, "") + ".png", { type: 'image/png' });
      await onSave(file, convertedFile);
      onClose();
    } catch (error) {
      console.error('Processing failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Otimizador de Overlay Pro</DialogTitle>
      <DialogContent onDragOver={handleDragOver} onDrop={handleDrop}>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {!file ? (
            <Button variant="outlined" component="label" startIcon={<UploadIcon />} sx={{ height: 150, borderStyle: 'dashed' }}>
              Selecionar Imagem Original
              <input type="file" hidden accept="image/*" onChange={handleFileSelect} />
            </Button>
          ) : (
            <>
              <Box sx={{ textAlign: 'center', bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }} />
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth label="Largura" type="number" value={dimensions.width} onChange={(e) => handleWidthChange(e.target.value)} size="small" />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Altura" type="number" value={dimensions.height} onChange={(e) => handleHeightChange(e.target.value)} size="small" />
                </Grid>
              </Grid>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControlLabel control={<Radio checked={maintainAspect} onClick={() => setMaintainAspect(!maintainAspect)} />} label="Manter Aspecto" />
                <FormControlLabel control={<Radio checked={autoTrim} onClick={() => setAutoTrim(!autoTrim)} />} label="Auto-Trim" />
              </Box>
              <Button variant="outlined" component="label" size="small">Trocar Imagem<input type="file" hidden accept="image/*" onChange={handleFileSelect} /></Button>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={processAndSave} variant="contained" disabled={!file || processing} startIcon={processing ? <RefreshIcon className="spin" /> : <MagicIcon />}>
          {processing ? 'A Processar...' : 'Aplicar e Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Settings() {
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
    epgUrl: '',
    rtmpOutputUrl: '',
    srtOutputUrl: '',
    udpOutputUrl: '',
    rtmpEnabled: false,
    srtEnabled: false,
    udpEnabled: false,
    hlsEnabled: false,
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
    release_date: '',
    autoStartProtocols: true,
    udpMode: 'multicast',
    epgDays: 7,
    tmdbApiKey: '',
    omdbApiKey: '',
    tvmazeApiKey: '',
    dashEnabled: false,
    mssEnabled: false,
    ristEnabled: false,
    rtspEnabled: false,
    webrtcEnabled: false,
    llhlsEnabled: false,
    logPath: '/var/log/onepa',
  });
  const [logs, setLogs] = useState([]);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);
  const [logFilter, setLogFilter] = useState('ALL');
  const [logSearch, setLogSearch] = useState('');
  const [logRotationSettings, setLogRotationSettings] = useState({ maxSizeMb: 50, maxFiles: 5, compressOld: true, retentionDays: 30 });
  const [showLogRotationConfig, setShowLogRotationConfig] = useState(false);

  const [loading, setLoading] = useState(true);
  const [protectedAssets, setProtectedAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [viewMode, setViewMode] = useState('users'); // 'users' or 'profiles'
  const [newUser, setNewUser] = useState({ username: '', password: '', profile_id: '' });
  const [currentProfile, setCurrentProfile] = useState({ name: '', permissions: [] });
  const [saving, setSaving] = useState(false);
  const [releaseNotesOpen, setReleaseNotesOpen] = useState(false);
  const [autoConfigOpen, setAutoConfigOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState(null);
  const [mediaSelectorOpen, setMediaSelectorOpen] = useState(false);
  const [mediaTypeSelector, setMediaTypeSelector] = useState('image'); // 'image' or 'video'
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [converterOpen, setConverterOpen] = useState(false);
  const [converterData, setConverterData] = useState({
    file: null,
    previewUrl: null,
    width: 400,
    height: 200,
    maintainAspect: true,
    autoTrim: true,
    processing: false
  });
  const [releaseHistory, setReleaseHistory] = useState([]);
  const [udpConfirmOpen, setUdpConfirmOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [proxyStats, setProxyStats] = useState({ total_bytes: 0, proxy_count: 0 });
  const [purgingProxies, setPurgingProxies] = useState(false);
  const [proxiesList, setProxiesList] = useState([]);
  const [selectedProxyIds, setSelectedProxyIds] = useState([]);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchProtectedAssets();
    fetchUsers();
    fetchReleaseHistory();
    fetchProxyStats();
    fetchProxiesList();

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

    // Handle Wizard Auto-Open
    if (searchParams.get('wizard') === 'true') {
      setAutoConfigOpen(true);
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
      const response = await settingsAPI.getSystemLogs();
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

      // Determine branding type from database field, default to 'video' (ANIMADO)
      const brandingType = data.branding_type || 'video';
      const isVideoBranding = brandingType === 'video';

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
        logoPath: data.logo_path || '/assets/protected/Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4',
        logoPosition: data.logo_position || 'top-right',
        epgUrl: data.epg_url || '',
        dayStart: data.day_start || '06:00',
        defaultImagePath: data.default_image_path || '',

        defaultVideoPath: data.default_video_path || '',
        version: data.system_version || 'v2.2.0-ALPHA.23-PRO',
        releaseDate: data.release_date || '2026-02-18',
        overlay_enabled: data.overlay_enabled ?? true,
        channelName: data.channel_name || 'Cloud Onepa',
        branding_type: brandingType,
        overlayOpacity: data.overlay_opacity ?? 1.0,
        overlayScale: data.overlay_scale ?? 1.0,
        srtMode: data.srt_mode || 'caller',
        protectedPath: data.protected_path || '/var/lib/onepa-playout/assets/protected',
        docsPath: data.docs_path || '/app/docs',
        system_version: data.system_version || 'v2.2.0-ALPHA.23-PRO',
        release_date: data.release_date || '2026-02-18',
        rtmpOutputUrl: data.rtmp_output_url || '',
        srtOutputUrl: data.srt_output_url || '',
        udpOutputUrl: data.udp_output_url || '',
        rtmpEnabled: data.rtmp_enabled || false,
        srtEnabled: data.srt_enabled || false,
        udpEnabled: data.udp_enabled || false,
        hlsEnabled: data.hls_enabled || false,
        dashEnabled: data.dash_enabled || false,
        mssEnabled: data.mss_enabled || false,
        ristEnabled: data.rist_enabled || false,
        rtspEnabled: data.rtsp_enabled || false,
        webrtcEnabled: data.webrtc_enabled || false,
        llhlsEnabled: data.llhls_enabled || false,
        autoStartProtocols: data.auto_start_protocols ?? true,
        udpMode: data.udp_mode || 'multicast',
        videoCodec: data.video_codec || 'copy',
        audioCodec: data.audio_codec || 'copy',
        tmdbApiKey: data.tmdb_api_key || '',
        omdbApiKey: data.omdb_api_key || '',
        tvmazeApiKey: data.tvmaze_api_key || '',
        display_urls: data.display_urls || {},
        epgDays: data.epg_days || 7,
        logPath: data.log_path || '/var/log/onepa/playout.log',
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
    rtmp: { url: 'rtmp://localhost:1935/live_stream', resolution: '1280x720', bitrate: '2500k' },
    hls: { url: '/hls/stream.m3u8', resolution: '1920x1080', bitrate: '4000k' },
    srt: { url: 'srt://mediamtx:8890?mode=caller&streamid=publish:live_stream_srt', resolution: '1920x1080', bitrate: '5000k' },
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
      // Sync specific protocol URLs
      rtmpOutputUrl: type === 'rtmp' ? defaults.url : prev.rtmpOutputUrl,
      srtOutputUrl: type === 'srt' ? defaults.url : prev.srtOutputUrl,
      udpOutputUrl: type === 'udp' ? defaults.url : prev.udpOutputUrl,
      srtMode: type === 'srt' ? 'caller' : prev.srtMode
    }));
    showSuccess(`Configuração atualizada para ${type.toUpperCase()}`);
  };

  // PRESET LOGIC: Sync Resolution -> Preset Cards -> Bitrate Limits
  const PRESETS = {
    '3840x2160': { id: '4k', label: 'Ultra HD', bitrate: 15000, fps: '30' },
    '1920x1080': { id: '1080p', label: 'Full HD', bitrate: 5000, fps: '25' },
    '1280x720': { id: '720p', label: 'HD Ready', bitrate: 2500, fps: '25' },
    '640x360': { id: '360p', label: 'SD', bitrate: 1000, fps: '25' },
  };

  const [activePreset, setActivePreset] = useState(null);
  const [pendingPreset, setPendingPreset] = useState(null); // { id, title, res, bitrate, fps }

  useEffect(() => {
    // Sync active preset highlight based on current resolution
    const match = Object.values(PRESETS).find(p => p.bitrate + 'k' === settings.videoBitrate && settings.resolution === Object.keys(PRESETS).find(k => PRESETS[k].id === p.id));
    // Or simplified: just match resolution for highlighting for now, as user requested "highlight when I save"
    const simpleMatch = Object.entries(PRESETS).find(([res, p]) => res === settings.resolution);
    if (simpleMatch) {
      setActivePreset(simpleMatch[1].id);
    } else {
      setActivePreset(null);
    }
  }, [settings.resolution, settings.videoBitrate]);

  const handleResolutionChange = (val) => {
    const preset = PRESETS[val];
    setSettings(prev => ({
      ...prev,
      resolution: val,
      videoBitrate: preset ? `${preset.bitrate}k` : prev.videoBitrate,
      fps: preset ? preset.fps : '25'
    }));
  };

  const handleBitrateChange = (val) => {
    setSettings(prev => {
      // Clean numeric value
      let numericVal = parseInt(val.toString().toLowerCase().replace('k', '')) || 0;

      // Determine max allowed based on current resolution
      const currentPreset = PRESETS[prev.resolution];
      const maxAllowed = currentPreset ? currentPreset.bitrate : 15000; // Default max if unknown res

      // Enforce limit: "só não pode alterar para maior que for definido"
      // BUT: Allow lower values
      if (numericVal > maxAllowed) {
        showWarning(`Bitrate limitado a ${maxAllowed}k para ${prev.resolution}`);
        numericVal = maxAllowed;
      }

      return { ...prev, videoBitrate: `${numericVal}k` };
    });
  };

  const applyPreset = (presetId) => {
    const entry = Object.entries(PRESETS).find(([k, v]) => v.id === presetId);
    if (!entry) return;
    const [res, p] = entry;
    // Show confirmation dialog before applying — engine restart required
    setPendingPreset({ id: presetId, title: p.label, res, bitrate: p.bitrate, fps: p.fps });
  };

  const confirmApplyPreset = async () => {
    if (!pendingPreset) return;
    const presetRes = pendingPreset.res;
    const presetBitrate = `${pendingPreset.bitrate}k`;
    const presetFps = pendingPreset.fps;

    // Apply locally
    setSettings(prev => ({
      ...prev,
      resolution: presetRes,
      videoBitrate: presetBitrate,
      fps: presetFps
    }));

    // Save to DB immediately
    try {
      await settingsAPI.update({
        resolution: presetRes,
        video_bitrate: presetBitrate,
        fps: presetFps,
      });
      showSuccess(`Preset ${pendingPreset.title} guardado! Reinicie o motor para aplicar.`);
    } catch (e) {
      showError('Preset aplicado localmente mas erro ao guardar na base de dados.');
    }
    setPendingPreset(null);
  };

  const handleUdpModeChange = (mode) => {
    // Define defaults based on protocol and mode
    let newUrl = mode === 'multicast' ? 'udp://239.0.0.1:1234?ttl=2' : 'udp://127.0.0.1:1234';

    setSettings(prev => ({
      ...prev,
      outputUrl: newUrl,
      udpOutputUrl: newUrl,
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

  const fetchProfiles = async () => {
    try {
      const response = await authAPI.listProfiles();
      setProfiles(response.data || []);
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    }
  };

  const fetchProxyStats = async () => {
    try {
      const response = await mediaAPI.getProxyStats();
      setProxyStats(response.data);
    } catch (error) {
      console.error('Failed to fetch proxy stats:', error);
    }
  };

  const fetchProxiesList = async () => {
    try {
      const response = await mediaAPI.listProxies();
      setProxiesList(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch proxies list:', error);
      setProxiesList([]);
    }
  };

  const handleDeleteSelectedProxies = async () => {
    if (selectedProxyIds.length === 0) return;
    try {
      setPurgingProxies(true);
      const response = await mediaAPI.deleteSpecificProxies(selectedProxyIds);
      showSuccess(`${response.data.deleted_count} proxies removidos. (${(response.data.deleted_bytes / 1024 / 1024).toFixed(2)} MB libertados)`);
      setDeleteConfirmOpen(false);
      setSelectedProxyIds([]);
      await fetchProxyStats();
      await fetchProxiesList();
    } catch (error) {
      console.error('Failed to delete specific proxies:', error);
      showError('Erro ao apagar proxies selecionados');
    } finally {
      setPurgingProxies(false);
    }
  };

  const handlePurgeProxies = async () => {
    if (window.confirm('Tem a certeza que deseja eliminar todas as versões proxy? Isto não afetará os ficheiros originais, mas os previews na Media Library poderão demorar mais. Esta ação liberta espaço em disco.')) {
      setPurgingProxies(true);
      try {
        const res = await mediaAPI.purgeProxies();
        showSuccess(`Limpeza concluída. ${res.data.deleted_count} proxies removidos (${(res.data.deleted_bytes / 1024 / 1024).toFixed(2)} MB libertados).`);
        fetchProxyStats();
      } catch (err) {
        showError(`Erro ao limpar proxies: ${err.response?.data?.error || err.message}`);
      } finally {
        setPurgingProxies(false);
      }
    }
  };

  useEffect(() => {
    if (tabValue === 3) {
      fetchUsers();
      fetchProfiles();
    }
  }, [tabValue]);


  const roadmapData = [
    {
      phase: 'Phase 22',
      title: 'CONECTIVIDADE & LIVE INPUTS',
      focus: 'Expansão além da reprodução de ficheiros',
      icon: <SensorsIcon />,
      color: '#00e5ff',
      items: [
        { text: 'Suporte SRT: Implementação (Caller & Listener) para contribuição remota fiável', done: true },
        { text: 'Live Inputs: Integração de WebRTC, NDI e SDI para switching em direto', done: false },
        { text: 'Smart Folder Playback: Reprodução aleatória direta de pastas (sem checklists)', done: false }
      ]
    },
    {
      phase: 'Phase 23',
      title: 'EPG & METADATA ENGINE',
      focus: 'Guia de programação profissional e descoberta de conteúdos',
      icon: <EpgIcon />,
      color: '#ff9800',
      items: [
        { text: 'Gerador de EPG: Criação interna de guias eletrónicos de programação', done: true },
        { text: 'EPG Web Export: API pública JSON/XML para entidades externas', done: true },
        { text: 'Compliance Standards: Suporte para formatos XMLTV e DVB-EIT', done: true },
        { text: 'Sincronização Externa: Ligar EPG com agendamentos internos e eventos recorrentes', done: true }
      ]
    },
    {
      phase: 'Phase 24',
      title: 'GRAPHICS & VISUAL EXPERIENCE',
      focus: 'Branding avançado on-air e UX multi-dispositivo',
      icon: <GraphicsIcon />,
      color: '#e91e63',
      items: [
        { text: 'Editor Drag-and-Drop: Editor WYSIWYG baseado na web para templates ativos', done: false },
        { text: 'HTML5 Graphics Engine: Overlays dinâmicos usando tecnologias web standard', done: false },
        { text: 'Mobile Responsive Layout: Suporte móvel total para o dashboard', done: false },
        { text: 'Personalização de Temas: Motor avançado de temas por utilizador', done: false },
        { text: 'Suporte Multi-idioma: Implementação total de i18n (PT/EN/ES)', done: false }
      ]
    },
    {
      phase: 'Phase 25',
      title: 'ENTERPRISE & COMPLIANCE',
      focus: 'Escalabilidade e requisitos profissionais de broadcast',
      icon: <EnterpriseIcon />,
      color: '#4caf50',
      items: [
        { text: 'Sistema Multi-Utilizador: Controlo de acessos baseado em perfis (RBAC)', done: true },
        { text: 'Audit Logs: Rastreio completo de todas as ações de utilizadores', done: false },
        { text: 'As-Run Logs: Logs de exibição (Proof-of-Play) padrão da indústria', done: false },
        { text: 'Suporte SCTE-35: Gatilhos para inserção de anúncios em fluxos IPTV/Cabo', done: false },
        { text: 'Analytics Dashboard: Estatísticas de visualização e métricas de saúde do sistema', done: false }
      ]
    },
    {
      phase: 'Phase 26',
      title: 'FUTURE TECH & SCALABILITY',
      focus: 'Inovação e Elevada Disponibilidade',
      icon: <RocketIcon />,
      color: '#ce93d8',
      items: [
        { text: 'Integração de IA: Auto-tagging de conteúdos e geração inteligente de playlists', done: false },
        { text: 'Multi-Channel Core: Uma única instância gerindo múltiplos canais independentes', done: false },
        { text: 'Canais Dedicados: Logótipos e pastas de média/música próprios por canal', done: false },
        { text: 'Alta Disponibilidade: Arquitetura de redundância e failover automático', done: false },
        { text: 'Low-HLS Support: Latência ultra-baixa para streaming interactivo', done: false }
      ]
    }
  ];

  const fetchReleaseHistory = () => {
    // Curated local history — no external API dependency, works offline
    setReleaseHistory([
      { version: 'v2.2.0-ALPHA.23-PRO', date: '2026-02-19', changes: ['Streaming: Otimização profunda em Nginx (buffering off, byte ranges)', 'Frontend: Preview de media com suporte nativo a Buffering/Partial Content', 'Backend: Implementação de Range Requests no endpoint de stream (Rust)', 'Estabilidade: Melhor manuseamento de ficheiros grandes via Chunked Transfer', 'Versioning: Bump global para ALPHA.23 PRO'] },
      { version: 'v2.2.0-ALPHA.22-PRO', date: '2026-02-18', changes: ['Dashboard: painel de controlo com ícones profissionais (PlayCircle/StopCircle/Cast/Terminal/SkipNext)', 'Estados visuais dinâmicos: cor + ícone + glow por estado ON AIR/OFF AIR', 'Animações pulse/glow no botão principal e distribuição activa', 'Tooltip descritivo em hover em todos os controlos de emissão', 'Settings: histórico de versões completo até ALPHA.22'] },
      { version: 'v2.2.0-ALPHA.21-PRO', date: '2026-02-18', changes: ['Uptime com precisão ms (00h 00m 00s 000ms)', 'Stream clean preview (stream_clean.m3u8 sem overlay)', 'Protocol status real baseado em processo relay activo', 'SRT relay URL fix (publish: streamid)', 'Settings: botão REPOR PADRÕES para branding defaults'] },
      { version: 'v2.2.0-ALPHA.20-PRO', date: '2026-02-18', changes: ['Dashboard: redesign ícone UDP + estado real de protocolo', 'Settings: UI DASH/MSS/RTSP/WebRTC (desactivado, em breve)', 'Graphics: preview 16:9 proporcional sem imagens externas', 'EPG: barra TV Guide com data + ícones abrir/download', 'Logs: config de rotação (tamanho, ficheiros, compressão, retenção), filtro, export', 'Branding: botão RESTAURAR DEFAULTS + auto-assign em novo vídeo'] },
      { version: 'v2.2.0-ALPHA.19-PRO', date: '2026-02-18', changes: ['Ecrã preto: GlobalErrorBoundary global em main.jsx', 'Fix HelpSystem: toggleHelpMode não declarado', 'Login: gradiente CSS local (sem Unsplash)', 'Settings: painel de versões scrollable com histórico real', 'Fallbacks de versão corrigidos para ALPHA.19'] },
      { version: 'v2.2.0-ALPHA.18-PRO', date: '2026-02-12', changes: ['Logs de playout com rotação automática (50MB/5 ficheiros)', 'Log Viewer em tempo real com refresh 2s em Settings'] },
      { version: 'v2.2.0-ALPHA.17-PRO', date: '2026-02-12', changes: ['Relay cooldown: 5s → 15s', 'Master-feed inactive threshold: 10 → 20 ticks'] },
      { version: 'v2.2.0-ALPHA.16-PRO', date: '2026-02-12', changes: ['HLS duplo: stream.m3u8 + stream_low.m3u8 (640×360)', 'Player retry: 6 tentativas × 8s = 48s máximo'] },
      { version: 'v2.2.0-ALPHA.15-PRO', date: '2026-02-12', changes: ['Dashboard Live Monitor: dot laranja/verde', 'GraphicsEditor: cache-bust de logo após guardar'] },
      { version: 'v2.2.0-ALPHA.14-PRO', date: '2026-02-12', changes: ['Preset de qualidade com diálogo de confirmação', 'Limites de bitrate por resolução'] },
      { version: 'v2.2.0-ALPHA.13-PRO', date: '2026-02-12', changes: ['Layer Manager de gráficos', 'Layers: Marquee, Lower Third, Clock', 'API REST para CRUD de graphics layers'] },
      { version: 'v2.2.0-ALPHA.12-PRO', date: '2026-02-12', changes: ['RBAC granular: perfis com permissões individuais', 'Gestão de perfis e password reset por admin'] },
      { version: 'v2.2.0-ALPHA.11-PRO', date: '2026-02-12', changes: ['Metadata Fetcher: TMDB, OMDB, TVMaze', 'Revisão de metadados na Media Library', 'EPG enriquecido com sinopses e imagens'] },
      { version: 'v2.2.0-ALPHA.10-PRO', date: '2026-02-05', changes: ['Gapless playback melhorado', 'Engine watchdog com reinício automático'] },
      { version: 'v2.2.0-ALPHA.9-PRO', date: '2026-02-05', changes: ['SRT listener/caller mode configurável', 'Scripts de diagnóstico SRT'] },
      { version: 'v2.2.0-ALPHA.8-PRO', date: '2026-02-05', changes: ['UDP multicast/unicast configurável', 'Diálogo de verificação de rede UDP'] },
      { version: 'v2.2.0-ALPHA.7-PRO', date: '2026-02-05', changes: ['HLS via MediaMTX', 'Multi-protocol simultâneo', 'Presets de codec'] },
      { version: 'v2.2.0-ALPHA.6-PRO', date: '2026-02-05', changes: ['Coordenadas de overlay configuráveis', 'Opacidade e escala em tempo real'] },
      { version: 'v2.2.0-ALPHA.5-PRO', date: '2026-02-04', changes: ['Schedule exceptions', 'EPG XMLTV export', 'Dias de EPG configuráveis (1-30)'] },
      { version: 'v2.2.0-ALPHA.4-PRO', date: '2026-02-03', changes: ['Graphics Editor base', 'Templates reutilizáveis'] },
      { version: 'v2.2.0-ALPHA.3-PRO', date: '2026-01-31', changes: ['Branding type: estático/animado', 'Sincronização de logo sidebar/overlay'] },
      { version: 'v2.2.0-ALPHA.2-PRO', date: '2026-01-30', changes: ['Storage paths configuráveis', 'Validação de caminhos'] },
      { version: 'v2.2.0-ALPHA.1', date: '2026-01-28', changes: ['Portas dedicadas Alpha (3011/8181/5534)', 'Docker-only workflow', 'Login: erros 401 corrigidos'] },
    ]);
  };


  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      let payload = {};

      if (tabValue === 0) { // Output Tab
        payload = {
          output_type: settings.outputType,
          output_url: settings.outputUrl,
          resolution: settings.resolution,
          fps: settings.fps,
          video_bitrate: settings.videoBitrate,
          audio_bitrate: settings.audioBitrate,
          rtmp_output_url: settings.rtmpOutputUrl,
          srt_output_url: settings.srtOutputUrl,
          udp_output_url: settings.udpOutputUrl,
          rtmp_enabled: settings.rtmpEnabled,
          srt_enabled: settings.srtEnabled,
          udp_enabled: settings.udpEnabled,
          hls_enabled: settings.hlsEnabled,
          dash_enabled: settings.dashEnabled,
          mss_enabled: settings.mssEnabled,
          rist_enabled: settings.ristEnabled,
          rtsp_enabled: settings.rtspEnabled,
          webrtc_enabled: settings.webrtcEnabled,
          llhls_enabled: settings.llhlsEnabled,
          video_codec: settings.videoCodec,
          audio_codec: settings.audioCodec,
          udp_mode: settings.udpMode,
          srt_mode: settings.srtMode,
        };
      } else if (tabValue === 1) { // Caminhos/API Tab
        // Simple sanitization for OMDb key if it contains &apikey=
        let cleanOmdbKey = settings.omdbApiKey;
        if (cleanOmdbKey && cleanOmdbKey.includes('apikey=')) {
          const match = cleanOmdbKey.match(/apikey=([^&]+)/);
          if (match) cleanOmdbKey = match[1];
        }

        payload = {
          media_path: settings.mediaPath,
          thumbnails_path: settings.thumbnailsPath,
          playlists_path: settings.playlistsPath,
          fillers_path: settings.fillersPath,
          epg_url: settings.epgUrl,
          epg_days: settings.epgDays,
          tmdb_api_key: settings.tmdbApiKey,
          omdb_api_key: cleanOmdbKey, // Keep existing omdb_api_key
          tvmaze_api_key: settings.tvmazeApiKey,
          default_image_path: settings.defaultImagePath,
          default_video_path: settings.defaultVideoPath,
          logo_path: settings.logoPath,
          branding_type: settings.branding_type, // ADD: branding type for sidebar logo
          log_path: settings.logPath,
        };
      } else if (tabValue === 2) { // Playout Tab
        payload = {
          resolution: settings.resolution,
          fps: settings.fps,
          video_bitrate: settings.videoBitrate,
          audio_bitrate: settings.audioBitrate,
          day_start: settings.dayStart,
          overlay_enabled: settings.overlay_enabled,
          channel_name: settings.channelName,
          overlay_opacity: settings.overlayOpacity,
          overlay_scale: settings.overlayScale,
          epg_days: settings.epgDays,
          epg_url: settings.epgUrl,
          auto_start_protocols: settings.autoStartProtocols,
        };
      } else {
        // Fallback for other tabs if any
        payload = { ...settings };
      }

      await settingsAPI.update(payload);
      await fetchSettings(); // Re-sync state from DB to prevent stale overwrites
      showSuccess(`Configurações da aba ${['Output', 'Caminhos', 'Playout'][tabValue] || ''} salvas!`);

      // Auto-restart engine with new settings if in Output tab
      if (tabValue === 0) {
        try {
          await playoutAPI.start();
          showSuccess('Transmissão reiniciada com sucesso!');
        } catch (startErr) {
          console.warn('Auto-start failed/already running:', startErr);
        }
      }

    } catch (error) {
      console.error('Failed to save settings:', error);
      showError('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyDefaults = async () => {
    // Replaced window.confirm with Dialog
    setAutoConfigOpen(true);
  };

  const confirmApplyDefaults = async () => {
    setAutoConfigOpen(false);
    try {
      setSaving(true);
      const response = await settingsAPI.applyDefaults();
      if (response.data.success) {
        showSuccess('Chaves recomendadas aplicadas com sucesso!');
        fetchSettings(); // Refresh UI
      } else {
        showError(`Erro ao aplicar chaves: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Apply Defaults Error:', error);
      showError(`Falha ao aplicar chaves: ${error.response?.data?.error || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestApi = async (service) => {
    let key = '';
    if (service === 'tmdb') key = settings.tmdbApiKey;
    else if (service === 'omdb') {
      key = settings.omdbApiKey;
      if (key && key.includes('apikey=')) {
        const match = key.match(/apikey=([^&]+)/);
        if (match) key = match[1];
      }
    }
    else if (service === 'tvmaze') key = settings.tvmazeApiKey; // TVMaze might operate without key but we test reachability

    if (!key && service !== 'tvmaze') {
      showWarning(`Insira a chave API para ${service.toUpperCase()} antes de testar.`);
      return;
    }

    try {
      const response = await settingsAPI.testApi(service, key);
      if (response.data.success) {
        showSuccess(`API ${service.toUpperCase()} conectada com sucesso!`);
      } else {
        showError(`Erro na API ${service.toUpperCase()}: ${response.data.error}`);
      }
    } catch (error) {
      console.error('API Test Error:', error);
      showError(`Falha ao testar ${service.toUpperCase()}: ${error.response?.data?.error || error.message}`);
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

  const handleConverterSave = async (originalFile, convertedFile) => {
    const formData = new FormData();
    formData.append('original', originalFile);
    formData.append('converted', convertedFile);

    try {
      const response = await settingsAPI.uploadOverlayPair(formData);
      setSettings({ ...settings, logoPath: response.data.converted_path });
      showSuccess('Overlay otimizado e salvo com sucesso!');
      return true;
    } catch (error) {
      showError('Erro ao salvar overlay otimizado');
      return false;
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) {
      showWarning('Preencha nome de utilizador e password');
      return;
    }

    try {
      // Find selected profile to get role name for compatibility, or just send empty/default role
      // The backend will mostly rely on profile_id now.
      const selectedProfile = profiles.find(p => p.id === newUser.profile_id);
      const roleName = selectedProfile ? selectedProfile.name.toLowerCase() : 'viewer';

      await authAPI.register(newUser.username, newUser.password, roleName, [], newUser.profile_id);
      showSuccess('Utilizador criado com sucesso!');
      setUserDialogOpen(false);
      setNewUser({ username: '', password: '', profile_id: '' });
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

  const handleSaveProfile = async () => {
    if (!currentProfile.name) {
      showWarning('Nome do perfil é obrigatório');
      return;
    }
    try {
      if (currentProfile.id) {
        await authAPI.updateProfile(currentProfile.id, currentProfile.permissions);
        showSuccess('Perfil atualizado!');
      } else {
        await authAPI.createProfile(currentProfile.name, currentProfile.permissions);
        showSuccess('Perfil criado!');
      }
      setProfileDialogOpen(false);
      fetchProfiles();
    } catch (error) {
      showError(error.response?.data?.error || 'Erro ao salvar perfil');
    }
  };

  const handleDeleteProfile = async (id) => {
    if (!window.confirm('Tem certeza? Users associados a este perfil podem perder acesso.')) return; // Use custom dialog ideally
    try {
      await authAPI.deleteProfile(id);
      showSuccess('Perfil removido');
      fetchProfiles();
    } catch (error) {
      showError(error.response?.data?.error || 'Erro ao remover perfil');
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

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Background Glows */}
      <Box sx={{
        position: 'fixed',
        top: '10%',
        right: '5%',
        width: '600px',
        height: '600px',
        bgcolor: 'primary.main',
        filter: 'blur(180px)',
        opacity: 0.05,
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <Box sx={{
        position: 'fixed',
        bottom: '10%',
        left: '5%',
        width: '400px',
        height: '400px',
        bgcolor: 'secondary.main',
        filter: 'blur(150px)',
        opacity: 0.04,
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.1)', height: 25, my: 'auto', ml: -1 }} />
          <Box>
            <Typography variant="h4" className="neon-text" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>Definições</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>
              Painel de Controlo do Sistema
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Recarregar definições do servidor" arrow>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchSettings}
              sx={{ fontWeight: 800, borderColor: 'rgba(255,255,255,0.1)' }}
            >
              REFRESCAR
            </Button>
          </Tooltip>
          <Tooltip title="Ver novidades desta versão" arrow>
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => setReleaseNotesOpen(true)}
              sx={{ fontWeight: 800, borderColor: 'rgba(255,255,255,0.1)' }}
            >
              NOTAS DE VERSÃO
            </Button>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSaveSettings}
            disabled={saving}
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(45deg, #00e5ff 30%, #00b2cc 90%)',
              color: '#0a0b10',
              minWidth: '200px'
            }}
          >
            {saving ? 'A GUARDAR...' : 'GUARDAR ALTERAÇÕES'}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={4} sx={{ position: 'relative', zIndex: 1, flexGrow: 1, px: 2, pb: 4 }}>
        {/* Navigation Sidebar */}
        <Grid item xs={12} md={2.5}>
          <Paper className="glass-panel" sx={{ p: 1.5, position: 'sticky', top: 16 }}>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, mb: 1, px: 2, display: 'block', letterSpacing: 2 }}>
              CONFIGURAÇÃO
            </Typography>
            <List size="small">
              {[
                { icon: <TvIcon />, label: 'EMISSÃO & SAÍDA' },
                { icon: <FolderIcon />, label: 'CAMINHOS & MEDIA' },
                { icon: <PlatformIcon />, label: 'PLAYOUT & PRESETS' },
                { icon: <UserIcon />, label: 'UTILIZADORES' },
                { icon: <ViewIcon />, label: 'SOBRE O SISTEMA' }
              ].map((item, idx) => (
                <Tooltip key={idx} title={`Explorar ${item.label}`} placement="right" arrow>
                  <ListItemButton
                    selected={tabValue === idx}
                    onClick={() => setTabValue(idx)}
                    sx={{
                      borderRadius: 3,
                      mb: 0.5,
                      py: 1.5,
                      '&.Mui-selected': {
                        bgcolor: 'rgba(0, 229, 255, 0.1)',
                        color: 'primary.main',
                        '& .MuiListItemIcon-root': { color: 'primary.main' }
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: tabValue === idx ? 'primary.main' : 'text.disabled' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 800, fontSize: '0.75rem', letterSpacing: 1 }} />
                  </ListItemButton>
                </Tooltip>
              ))}
              <Divider sx={{ my: 2, opacity: 0.05 }} />
              <ListItemButton
                onClick={() => navigate('/backend-monitor')}
                sx={{ borderRadius: 3, py: 1.5 }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'text.disabled' }}><HistoryIcon /></ListItemIcon>
                <ListItemText primary="MONITOR BACKEND" primaryTypographyProps={{ fontWeight: 800, fontSize: '0.75rem', letterSpacing: 1 }} />
              </ListItemButton>
            </List>

            <Box sx={{ mt: 4, p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 4, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800, display: 'block' }}>SUPORTE TÉCNICO</Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>Cloud Onepa Intelligence</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Content Area */}
        <Grid item xs={12} md={9.5}>
          <TabPanel value={tabValue} index={0}>
            {/* Protocolo Section */}
            <Paper className="glass-panel" sx={{ p: 4, mb: 4 }}>
              <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>CONFIGURAÇÃO DE SAÍDA</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>GESTÃO DE PROTOCOLOS E DISTRIBUIÇÃO</Typography>
                </Box>
                <Chip label="ONLINE • ENGINE READY" color="success" sx={{ fontWeight: 800, fontSize: '0.65rem', height: 24 }} />
              </Box>

              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 800, letterSpacing: 1 }}>PROTOCOLO PRINCIPAL</Typography>
              <ToggleButtonGroup
                value={settings.outputType}
                exclusive
                onChange={(e, val) => val && handleOutputTypeChange(val)}
                fullWidth
                sx={{ mb: 4, gap: 1 }}
              >
                {['rtmp', 'srt', 'udp', 'hls', 'desktop'].map(type => (
                  <ToggleButton
                    key={type}
                    value={type}
                    sx={{
                      borderRadius: '12px !important',
                      border: '1px solid rgba(255,255,255,0.05) !important',
                      fontWeight: 800,
                      '&.Mui-selected': { bgcolor: 'primary.main', color: '#000', '&:hover': { bgcolor: 'primary.light' } }
                    }}
                  >
                    {type.toUpperCase()}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="URL DE SAÍDA PRINCIPAL"
                    value={settings.outputUrl}
                    onChange={(e) => setSettings({ ...settings, outputUrl: e.target.value })}
                    InputProps={{ sx: { bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3, fontWeight: 700, fontFamily: 'monospace' } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>RESOLUÇÃO</InputLabel>
                    <Select value={settings.resolution} label="RESOLUÇÃO" onChange={(e) => handleResolutionChange(e.target.value)} sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3 }}>
                      <MenuItem value="3840x2160">4K (Ultra HD)</MenuItem>
                      <MenuItem value="1920x1080">1080p (Full HD)</MenuItem>
                      <MenuItem value="1280x720">720p (HD)</MenuItem>
                      <MenuItem value="640x360">360p (SD)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="BITRATE VÍDEO (ex: 5000k)"
                    value={settings.videoBitrate}
                    onChange={(e) => handleBitrateChange(e.target.value)}
                    InputProps={{ sx: { bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3 } }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Secondary Protocols Section */}
            <Paper className="glass-panel" sx={{ p: 4 }}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>MULTI-STREAMING</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>ACTIVAÇÃO DE PROTOCOLOS ADICIONAIS</Typography>
              </Box>

              {/* Active protocols */}
              <Grid container spacing={4}>
                {[
                  { id: 'rtmp', label: 'RTMP Server', icon: <PlatformIcon /> },
                  { id: 'srt', label: 'SRT (Caller/Listener)', icon: <PlatformIcon /> },
                  { id: 'udp', label: 'UDP Streaming', icon: <PlatformIcon /> },
                  { id: 'hls', label: 'HLS Distribution', icon: <TvIcon /> }
                ].map(proto => (
                  <Grid item xs={12} md={6} key={proto.id}>
                    <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ p: 1, bgcolor: 'rgba(0,229,255,0.1)', borderRadius: 2, color: 'primary.main' }}>
                          {proto.icon}
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{proto.label}</Typography>
                      </Box>
                      <Checkbox
                        checked={settings[`${proto.id}Enabled`]}
                        onChange={(e) => setSettings({ ...settings, [`${proto.id}Enabled`]: e.target.checked })}
                        sx={{ color: 'primary.main', '&.Mui-checked': { color: 'primary.main' } }}
                      />
                    </Box>
                  </Grid>
                ))}

                {/* Divider */}
                <Grid item xs={12}>
                  <Divider sx={{ opacity: 0.08, my: 1 }}>
                    <Chip label="EM DESENVOLVIMENTO — BREVEMENTE DISPONÍVEIS" size="small" sx={{ fontWeight: 800, fontSize: '0.55rem', color: 'warning.main', bgcolor: 'rgba(255,152,0,0.08)', borderColor: 'rgba(255,152,0,0.2)', border: '1px solid' }} />
                  </Divider>
                </Grid>

                {/* Future protocols - disabled, not shown on dashboard */}
                {[
                  { id: 'dash', label: 'MPEG-DASH Adaptive', desc: 'Streaming adaptativo multi-bitrate' },
                  { id: 'mss', label: 'MSS (Microsoft Smooth)', desc: 'Smooth Streaming para Azure/CDN' },
                  { id: 'rtsp', label: 'RTSP Server', desc: 'Protocolo para IPTV e câmeras IP' },
                  { id: 'webrtc', label: 'WebRTC (Ultra Low Lat.)', desc: 'Latência sub-segundo para browser' }
                ].map(proto => (
                  <Grid item xs={12} md={6} key={proto.id}>
                    <Tooltip title={proto.desc + ' — Não aparece no dashboard quando desactivado'} arrow>
                      <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.01)', borderRadius: 4, border: '1px dashed rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.55 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ p: 1, bgcolor: 'rgba(255,152,0,0.07)', borderRadius: 2, color: 'warning.main' }}>
                            <PlatformIcon />
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.disabled' }}>{proto.label}</Typography>
                            <Typography variant="caption" sx={{ color: 'warning.main', fontSize: '0.6rem', fontWeight: 700 }}>EM DESENVOLVIMENTO</Typography>
                          </Box>
                        </Box>
                        <Tooltip title="Desactivado por defeito — brevemente disponível">
                          <span>
                            <Switch
                              size="small"
                              checked={settings[`${proto.id}Enabled`] || false}
                              onChange={(e) => setSettings({ ...settings, [`${proto.id}Enabled`]: e.target.checked })}
                              sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: 'warning.main' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'warning.main' } }}
                            />
                          </span>
                        </Tooltip>
                      </Box>
                    </Tooltip>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </TabPanel>

          {/* CATEGORY 1: CAMINHOS & MEDIA (Combined Old 1 & 3) */}
          <TabPanel value={tabValue} index={1}>
            <Paper className="glass-panel" sx={{ p: 4, mb: 4 }}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>CAMINHOS DE ARMAZENAMENTO</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>CONFIGURAÇÃO DE DIRETÓRIOS E VOLUMES</Typography>
              </Box>

              <Grid container spacing={3}>
                {[
                  { label: 'MEDIA & VIDEO', value: settings.mediaPath, key: 'mediaPath', helper: 'Armazenamento principal de conteúdos' },
                  { label: 'THUMBNAILS', value: settings.thumbnailsPath, key: 'thumbnailsPath', helper: 'Cache de miniaturas geradas' },
                  { label: 'PLAYLISTS DB', value: settings.playlistsPath, key: 'playlistsPath', helper: 'Base de dados das programações' },
                  { label: 'FILLERS & LOOPS', value: settings.fillersPath, key: 'fillersPath', helper: 'Conteúdos de preenchimento automático' },
                  {
                    label: 'PLAYOUT LOGS',
                    value: settings.logPath,
                    key: 'logPath',
                    helper: 'Localização do ficheiro de registos do sistema',
                    endAdornment: (
                      <IconButton onClick={() => setShowLogsDialog(true)} color="primary" sx={{ bgcolor: 'rgba(0,229,255,0.05)', borderRadius: 2 }}>
                        <HistoryIcon />
                      </IconButton>
                    )
                  },
                  { label: 'BRANDING & ASSETS PROTEGIDOS', value: settings.protectedPath, key: 'protectedPath', helper: 'Localização de logos e vídeos institucionais' }
                ].map(field => (
                  <Grid item xs={12} key={field.key}>
                    <TextField
                      fullWidth
                      label={field.label}
                      value={field.value}
                      onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                      helperText={field.helper}
                      InputProps={{
                        sx: { bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3 },
                        endAdornment: field.endAdornment
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* STORAGE MGMT SECTION */}
            <Paper className="glass-panel" sx={{ p: 4, mb: 4, borderLeft: '4px solid #9c27b0' }}>
              <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'secondary.main' }}>GESTÃO DE ESPAÇO (WEB PROXIES)</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>MONITORIZAÇÃO E CONTROLO DE CACHE</Typography>
                  <Typography variant="body2" sx={{ mt: 1, maxWidth: '600px', opacity: 0.8 }}>
                    As versões Proxy (720p H.264) são criadas automaticamente para garantir visualização e navegação instantânea no Portal, com zero-latência, sem pesar na largura de banda.
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 0.5 }}>ESPAÇO TOTAL EM DISCO (CACHE)</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'black', color: 'secondary.main', lineHeight: 1 }}>
                      {((proxyStats?.total_bytes || 0) / 1024 / 1024).toFixed(2)}
                      <Typography component="span" variant="h6" sx={{ fontWeight: 800, color: 'text.secondary', ml: 0.5 }}>MB</Typography>
                    </Typography>
                    <Tooltip title="Actualizar Métricas">
                      <IconButton size="small" onClick={fetchProxyStats} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                        <RefreshIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mt: 1, display: 'block' }}>{proxyStats?.proxy_count || 0} PROXIES WEB ACTIVOS</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={purgingProxies ? <CircularProgress size={20} color="secondary" /> : <DeleteIcon />}
                  onClick={handlePurgeProxies}
                  disabled={purgingProxies || proxyStats.proxy_count === 0}
                  sx={{ fontWeight: 800 }}
                >
                  {purgingProxies ? 'A LIMPAR...' : 'LIMPAR TUDO'}
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<ViewIcon />}
                  onClick={() => { fetchProxiesList(); setExplorerOpen(true); }}
                  disabled={proxyStats.proxy_count === 0}
                  sx={{ fontWeight: 800 }}
                >
                  EXPLORAR & GESTÃO GRANULAR
                </Button>
                <Typography variant="caption" sx={{ color: 'text.disabled', maxWidth: '300px' }}>
                  A limpeza afeta apenas os ficheiros otimizados (H.264). Os vídeos originais na Media Library nunca são apagados nesta ação.
                </Typography>
              </Box>
            </Paper>

            <Paper className="glass-panel" sx={{ p: 4, mb: 4 }}>
              <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>APIS DE METADADOS</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>INDEXAÇÃO INTELIGENTE (TMDB / OMDB)</Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<WizardIcon />}
                  onClick={handleApplyDefaults}
                  sx={{ fontWeight: 800, borderRadius: 2 }}
                >
                  AUTO-CONFIG
                </Button>
              </Box>

              <Grid container spacing={3}>
                {[
                  { id: 'tmdb', label: 'TMDB API KEY', key: 'tmdbApiKey' },
                  { id: 'omdb', label: 'OMDB API KEY', key: 'omdbApiKey' },
                  { id: 'tvmaze', label: 'TVMAZE KEY', key: 'tvmazeApiKey' }
                ].map(api => (
                  <Grid item xs={12} md={4} key={api.id}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        label={api.label}
                        value={settings[api.key]}
                        type="password"
                        onChange={(e) => setSettings({ ...settings, [api.key]: e.target.value })}
                        InputProps={{ sx: { bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3, fontSize: '0.8rem' } }}
                      />
                      <IconButton onClick={() => handleTestApi(api.id)} color="primary" sx={{ mt: 1 }}><RefreshIcon /></IconButton>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            <Paper className="glass-panel" sx={{ p: 4 }}>
              <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                      <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>BRANDING & ASSETS PROTEGIDOS</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>IDENTIDADE VISUAL E FALLBACKS</Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<RefreshIcon />}
                      onClick={async () => {
                        const defaults = {
                          branding_type: 'video',
                          logo_path: '/assets/protected/Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4',
                          overlay_enabled: true,
                          overlay_opacity: 1.0,
                          overlay_scale: 0.3,
                          overlay_x: 30,
                          overlay_y: 20,
                          overlay_anchor: 'top-right',
                        };
                        try {
                          await settingsAPI.update(defaults);
                          setSettings(prev => ({
                            ...prev,
                            branding_type: 'video',
                            logoPath: defaults.logo_path,
                            overlayOpacity: 1.0,
                            overlay_anchor: 'top-right',
                          }));
                          showSuccess('Branding reposto para os valores por defeito!');
                          fetchSettings();
                        } catch (e) {
                          showError('Erro ao repor branding');
                        }
                      }}
                      sx={{ fontWeight: 800, borderRadius: 2, fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                    >
                      REPOR PADRÕES
                    </Button>
                  </Box>
                </Box>
                <Tooltip title="Restaurar branding e assets para os valores por defeito do sistema" arrow>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={async () => {
                      const defaults = {
                        branding_type: 'video',
                        logo_path: '/assets/protected/Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4',
                        default_image_path: '/assets/protected/Cloud_Onepa_Playout_Infinity_Logo_remodelado.png',
                        default_video_path: '/assets/protected/Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4',
                      };
                      try {
                        await settingsAPI.update(defaults);
                        setSettings(prev => ({
                          ...prev,
                          branding_type: 'video',
                          logoPath: defaults.logo_path,
                          defaultImagePath: defaults.default_image_path,
                          defaultVideoPath: defaults.default_video_path,
                        }));
                        await fetchProtectedAssets();
                        showSuccess('Branding restaurado para os valores por defeito!');
                      } catch (e) { showError('Erro ao restaurar branding'); }
                    }}
                    sx={{ fontWeight: 800, fontSize: '0.7rem', borderColor: 'rgba(0,229,255,0.2)', color: 'primary.main' }}
                  >
                    RESTAURAR DEFAULTS
                  </Button>
                </Tooltip>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 3, bgcolor: 'rgba(0,0,0,0.4)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, mb: 2, display: 'block' }}>PREVIEW LOGO/VIDEO</Typography>
                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
                      {(settings.branding_type === 'video') ? (
                        <video src={settings.logoPath || "/assets/protected/Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4"} autoPlay loop muted style={{ maxWidth: '100%', maxHeight: '100%' }} />
                      ) : (
                        <img src={settings.logoPath || "/assets/protected/Cloud_Onepa_Playout_Infinity_Logo_remodelado.png"} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      )}
                    </Box>
                    <ToggleButtonGroup
                      value={settings.branding_type || 'video'}
                      exclusive
                      onChange={(e, v) => {
                        if (!v) return;
                        setSettings({
                          ...settings,
                          branding_type: v,
                          logoPath: (v === 'video') ? '/assets/protected/Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4' : '/assets/protected/Cloud_Onepa_Playout_Infinity_Logo_remodelado.png'
                        });
                      }}
                      fullWidth
                      sx={{ mt: 3 }}
                    >
                      <ToggleButton value="static" sx={{ fontWeight: 800 }}>ESTÁTICO</ToggleButton>
                      <ToggleButton value="video" sx={{ fontWeight: 800 }}>ANIMADO</ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <Button variant="outlined" component="label" fullWidth sx={{ py: 2, borderRadius: 3, fontWeight: 800 }}>
                      CARREGAR LOGO DA APP
                      <input type="file" hidden accept="image/*" onChange={(e) => {/* handle upload */ }} />
                    </Button>
                    <Divider sx={{ opacity: 0.1 }}>OU SELECIONAR FALLBACKS</Divider>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Button variant="contained" fullWidth onClick={() => { setMediaTypeSelector('image'); setMediaSelectorOpen(true); }} sx={{ bgcolor: 'rgba(255,255,255,0.05)', fontWeight: 800 }}>IMAGE FB</Button>
                      </Grid>
                      <Grid item xs={6}>
                        <Button variant="contained" fullWidth onClick={() => { setMediaTypeSelector('video'); setMediaSelectorOpen(true); }} sx={{ bgcolor: 'rgba(255,255,255,0.05)', fontWeight: 800 }}>VIDEO FB</Button>
                      </Grid>
                    </Grid>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
          </TabPanel>

          {/* CATEGORY 2: PLAYOUT & PRESETS */}
          <TabPanel value={tabValue} index={2}>
            <Paper className="glass-panel" sx={{ p: 4, mb: 4 }}>
              <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>MOTOR DE PLAYOUT</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>PERFORMANCE E SINCRONIZAÇÃO EM TEMPO REAL</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" startIcon={<WizardIcon />} onClick={() => navigate('/setup')} sx={{ borderRadius: 2, fontWeight: 800 }}>ASSISTENTE</Button>
                  <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setResetConfirmOpen(true)} sx={{ borderRadius: 2, fontWeight: 800 }}>RESET</Button>
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="INÍCIO DO DIA (PROGRAMAÇÃO)"
                    type="time"
                    value={settings.dayStart}
                    onChange={(e) => setSettings({ ...settings, dayStart: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ sx: { bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3 } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="NOME DO CANAL"
                    value={settings.channelName}
                    onChange={(e) => setSettings({ ...settings, channelName: e.target.value })}
                    InputProps={{ sx: { bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3 } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="FPS (BASE)"
                    value={settings.fps}
                    onChange={(e) => setSettings({ ...settings, fps: e.target.value })}
                    InputProps={{ sx: { bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3 } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>ENCODING PRESET</InputLabel>
                    <Select value={settings.encodingPreset || 'medium'} label="ENCODING PRESET" onChange={(e) => setSettings({ ...settings, encodingPreset: e.target.value })} sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3 }}>
                      <MenuItem value="ultrafast">Ultra Fast</MenuItem>
                      <MenuItem value="veryfast">Very Fast</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="slow">Slow</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            {/* EPG CONFIGURATION SECTION */}
            <Paper className="glass-panel" sx={{ p: 4, mb: 4 }}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>PROGRAMAÇÃO & EPG</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>DISTRIBUIÇÃO DE GUIA DE PROGRAMAÇÃO (XMLTV)</Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Tooltip title="URL estática para o seu fornecedor (M3U/IPTV)" arrow>
                    <TextField
                      fullWidth
                      label="URL DO EPG (LOCAL/REF)"
                      value={settings.epgUrl || `${window.location.protocol}//${window.location.host}/api/playlists/epg.xml`}
                      onChange={(e) => setSettings({ ...settings, epgUrl: e.target.value })}
                      helperText="URL para referenciar o seu guia de programação (XMLTV)"
                      InputProps={{
                        sx: { bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3 },
                        endAdornment: (
                          <IconButton onClick={() => {
                            navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}/api/playlists/epg.xml`);
                            showSuccess('URL copiada para a área de transferência!');
                          }}>
                            <MagicIcon />
                          </IconButton>
                        )
                      }}
                    />
                  </Tooltip>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Tooltip title="Número de dias futuros a incluir no guia" arrow>
                    <TextField
                      fullWidth
                      label="DIAS DE EPG (ANTECEDÊNCIA)"
                      type="number"
                      value={settings.epgDays}
                      onChange={(e) => setSettings({ ...settings, epgDays: parseInt(e.target.value) || 7 })}
                      inputProps={{ min: 1, max: 30 }}
                      InputProps={{ sx: { bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3 } }}
                    />
                  </Tooltip>
                </Grid>
              </Grid>
            </Paper>

            <Paper className="glass-panel" sx={{ p: 4, mb: 4 }}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>OVERLAY DE CANAL</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>GESTÃO DE MARCA D'ÁGUA EM TEMPO REAL</Typography>
              </Box>

              <Box sx={{ p: 3, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)', mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>ESTADO DO OVERLAY</Typography>
                    <Typography variant="caption" color="text.secondary">Ativar/Desativar camada de gráficos no output</Typography>
                  </Box>
                  <Switch
                    checked={settings.overlay_enabled}
                    onChange={(e) => setSettings({ ...settings, overlay_enabled: e.target.checked })}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: 'primary.main' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'primary.main' }
                    }}
                  />
                </Box>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, display: 'block' }}>OPACIDADE ({Math.round((settings.overlayOpacity ?? 0.6) * 100)}%)</Typography>
                    <Slider value={settings.overlayOpacity ?? 0.6} min={0} max={1} step={0.1} onChange={(e, v) => setSettings({ ...settings, overlayOpacity: v })} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, display: 'block' }}>ESCALA ({Math.round((settings.overlayScale ?? 0.6) * 100)}%)</Typography>
                    <Slider value={settings.overlayScale ?? 0.6} min={0.1} max={2.0} step={0.1} onChange={(e, v) => setSettings({ ...settings, overlayScale: v })} />
                  </Grid>
                </Grid>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  label="LOGO DE OVERLAY (STREAM OUTPUT)"
                  value={settings.logoPath}
                  onChange={(e) => setSettings({ ...settings, logoPath: e.target.value })}
                  InputProps={{ sx: { bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3 } }}
                  helperText="Padrão: /assets/protected/Cloud_Onepa_Playout_Infinity_Logo_remodelado.png"
                />
                <Button
                  size="small"
                  onClick={() => setSettings({ ...settings, logoPath: '/assets/protected/Cloud_Onepa_Playout_Infinity_Logo_remodelado.png' })}
                  sx={{ mt: 1, fontSize: '0.7rem' }}
                >
                  USAR PADRÃO
                </Button>
                <Button variant="contained" component="label" startIcon={<AddIcon />} sx={{ height: 56, borderRadius: 3, minWidth: 140, fontWeight: 800 }}>UPLOAD</Button>
                <IconButton onClick={() => setConverterOpen(true)} sx={{ width: 56, height: 56, bgcolor: 'rgba(0,229,255,0.1)', color: 'primary.main', borderRadius: 3 }}><MagicIcon /></IconButton>
              </Box>
            </Paper>

            <Paper className="glass-panel" sx={{ p: 4 }}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>PRESETS DE QUALIDADE</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>CONFIGURAÇÕES RÁPIDAS DE PERFORMANCE</Typography>
              </Box>
              <Grid container spacing={3}>
                {[
                  { id: '720p', title: '720p STREAMING', desc: '1280x720 @ 25fps • 2500k' },
                  { id: '1080p', title: '1080p HD PRO', desc: '1920x1080 @ 25fps • 5000k' },
                  { id: '4k', title: '4K ULTRA HD', desc: '3840x2160 @ 30fps • 15000k' }
                ].map(p => (
                  <Grid item xs={12} md={4} key={p.id}>
                    <Box
                      onClick={() => applyPreset(p.id)}
                      sx={{
                        p: 3, borderRadius: 4, cursor: 'pointer',
                        bgcolor: activePreset === p.id ? 'rgba(0,229,255,0.1)' : 'rgba(255,255,255,0.02)',
                        border: '1px solid', borderColor: activePreset === p.id ? 'primary.main' : 'rgba(255,255,255,0.05)',
                        transition: '0.3s', '&:hover': { transform: 'translateY(-4px)', bgcolor: 'rgba(255,255,255,0.05)' }
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: activePreset === p.id ? 'primary.main' : 'text.primary' }}>{p.title}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{p.desc}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </TabPanel>

          {/* CATEGORY 3: UTILIZADORES & PERFIS */}
          <TabPanel value={tabValue} index={3}>
            <Paper className="glass-panel" sx={{ p: 4 }}>
              <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>GESTÃO DE ACESSOS</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>UTILIZADORES E PERFIS DE ACESSO</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(e, newMode) => newMode && setViewMode(newMode)}
                    size="small"
                    sx={{ height: 36 }}
                  >
                    <ToggleButton value="users" sx={{ fontWeight: 800 }}>UTILIZADORES</ToggleButton>
                    <ToggleButton value="profiles" sx={{ fontWeight: 800 }}>PERFIS</ToggleButton>
                  </ToggleButtonGroup>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      if (viewMode === 'users') setUserDialogOpen(true);
                      else {
                        setCurrentProfile({ name: '', permissions: [] });
                        setProfileDialogOpen(true);
                      }
                    }}
                    sx={{ borderRadius: 3, fontWeight: 800, px: 3 }}
                  >
                    {viewMode === 'users' ? 'ADICIONAR USER' : 'CRIAR PERFIL'}
                  </Button>
                </Box>
              </Box>

              {viewMode === 'users' ? (
                <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {Array.isArray(users) && users.map((user) => (
                    <ListItem
                      key={user.id}
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.02)',
                        borderRadius: 4,
                        border: '1px solid rgba(255,255,255,0.05)',
                        p: 2,
                        transition: '0.3s',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }
                      }}
                    >
                      <ListItemIcon sx={{ color: 'primary.main', minWidth: 50 }}>
                        <UserIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={user.username.toUpperCase()}
                        secondary={
                          <Box component="span">
                            PERFIL: {
                              user.profile_name
                                ? user.profile_name.toUpperCase()
                                : (profiles.find(p => p.id === user.profile_id)?.name?.toUpperCase() || (user.role || '').toUpperCase())
                            } | PERMISSÕES: {user.permissions?.join(', ').toUpperCase() || 'N/A'}
                          </Box>
                        }
                        primaryTypographyProps={{ sx: { fontWeight: 800, letterSpacing: 1 } }}
                        secondaryTypographyProps={{ sx: { fontWeight: 600, fontSize: '0.65rem', opacity: 0.6 }, component: 'div' }}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleOpenPasswordDialog(user)}
                          sx={{ borderRadius: 2, fontWeight: 800, fontSize: '0.7rem' }}
                        >
                          REPOR PASSWORD
                        </Button>
                        {user.username !== 'admin' && (
                          <IconButton onClick={() => handleDeleteUser(user.id)} color="error" sx={{ bgcolor: 'rgba(244,67,54,0.1)', borderRadius: 2 }}>
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {Array.isArray(profiles) && profiles.map((profile) => (
                    <ListItem
                      key={profile.id}
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.02)',
                        borderRadius: 4,
                        border: '1px solid rgba(255,255,255,0.05)',
                        p: 2
                      }}
                    >
                      <ListItemIcon sx={{ color: 'secondary.main', minWidth: 50 }}>
                        <SettingsIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {profile.name.toUpperCase()}
                          {profile.is_system && <Chip label="SISTEMA" size="small" color="info" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 800 }} />}
                        </Box>}
                        secondary={`PERMISSÕES: ${(profile.permissions || []).join(', ').toUpperCase()}`}
                        primaryTypographyProps={{ sx: { fontWeight: 800, letterSpacing: 1 } }}
                        secondaryTypographyProps={{ sx: { fontWeight: 600, fontSize: '0.65rem', opacity: 0.6 } }}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setCurrentProfile(profile);
                            setProfileDialogOpen(true);
                          }}
                          sx={{ borderRadius: 2, fontWeight: 800, fontSize: '0.7rem' }}
                        >
                          EDITAR
                        </Button>
                        {!profile.is_system && (
                          <IconButton onClick={() => handleDeleteProfile(profile.id)} color="error" sx={{ bgcolor: 'rgba(244,67,54,0.1)', borderRadius: 2 }}>
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </TabPanel>

          {/* CATEGORY 4: SOBRE O SISTEMA */}
          <TabPanel value={tabValue} index={4}>
            <Paper className="glass-panel" sx={{ p: 4, mb: 4 }}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>INFORMAÇÃO DO SISTEMA</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>DETALHES DO DEPLOYMENT E AMBIENTE</Typography>
              </Box>
              <Grid container spacing={3}>
                {[
                  { label: 'VERSÃO DO SISTEMA', value: settings.system_version || settings.version || 'v2.2.0-ALPHA.19-PRO', icon: <WizardIcon /> },
                  { label: 'ÚLTIMA ATUALIZAÇÃO', value: settings.release_date || settings.releaseDate || '2026-02-18', icon: <CheckIcon /> },
                  { label: 'DEPLOYMENT', value: 'Docker Container (Linux)', icon: <FolderIcon /> }
                ].map((item, id) => (
                  <Grid item xs={12} sm={6} md={4} key={id}>
                    <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'primary.main' }}>
                        {item.icon}
                        <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.6rem', opacity: 0.8 }}>{item.label}</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{item.value}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {/* ROADMAP & FUTURE section integrated here for visibility */}
              <Box sx={{ mt: 6, mb: 2 }}>
                <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 2 }}>DESTAQUES DO DESENVOLVIMENTO (FUTUROS)</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {[
                    { label: 'MULTI-IDIOMA', value: 'i18n Ready', icon: <LanguageIcon /> },
                    { label: 'MULTI-CANAL', value: 'Independent Core', icon: <PlatformIcon /> },
                    { label: 'LOW-LATENCY', value: 'Low-HLS / SRT', icon: <ScalabilityIcon /> }
                  ].map((item, id) => (
                    <Grid item xs={12} sm={4} key={id}>
                      <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'rgba(0,229,255,0.03)', borderRadius: 2, border: '1px solid rgba(0,229,255,0.08)' }}>
                        <Box sx={{ color: 'primary.main' }}>{item.icon}</Box>
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', fontSize: '0.6rem', opacity: 0.6 }}>{item.label}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.75rem' }}>{item.value}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    // Determine tag: if version starts with 'v', use it; else fallback to 'alpha'
                    const tag = settings.version && settings.version.startsWith('v') ? settings.version : 'alpha';
                    // If it's a dev version like v2.2.0-ALPHA.4, it might be a tag.
                    // The user requested: /tree/alpha specifically if it's alpha.
                    // Let's use logic: if it contains "ALPHA", link to alpha branch? 
                    // Or just default to the tag. 
                    // User said: "should analyze the version and use the tag in question, in this case, the alpha tag"
                    const targetRef = settings.version?.includes('ALPHA') ? 'alpha' : (settings.version || 'main');
                    window.open(`https://github.com/ideiasestrondosas-ctrl/cloud-onepa-playout/tree/${targetRef}`, '_blank');
                  }}
                  sx={{ borderRadius: 2, fontWeight: 800 }}
                >
                  GITHUB REPO
                </Button>
              </Box>
            </Paper>

            <Paper className="glass-panel" sx={{ p: 4 }}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>HISTÓRICO DE VERSÕES</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>NOTAS CRÍTICAS E EVOLUÇÃO DO PROJETO</Typography>
              </Box>
              <Box sx={{ maxHeight: '65vh', overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-track': { bgcolor: 'rgba(255,255,255,0.02)' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,229,255,0.3)', borderRadius: 3 } }}>
                <List sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {releaseHistory.length > 0 ? releaseHistory.map((release, idx) => (
                    <ListItem key={idx} sx={{ display: 'block', p: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>{release.version.startsWith('v') ? release.version : 'v' + release.version}</Typography>
                        <Divider sx={{ flexGrow: 1, opacity: 0.1 }} />
                        <Typography variant="caption" sx={{ opacity: 0.5 }}>{release.date}</Typography>
                      </Box>
                      <Box sx={{ pl: 4, borderLeft: '2px dashed rgba(0,229,255,0.2)' }}>
                        {release.changes.map((change, cIdx) => (
                          <Typography key={cIdx} variant="body2" sx={{ mb: 1, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 4, height: 4, bgcolor: 'primary.main', borderRadius: '50%' }} /> {change}
                          </Typography>
                        ))}
                      </Box>
                    </ListItem>
                  )) : (
                    <Typography variant="body2" sx={{ opacity: 0.5, textAlign: 'center', py: 4 }}>NENHUM HISTÓRICO DISPONÍVEL</Typography>
                  )}
                </List>
              </Box>
            </Paper>

            {/* ROADMAP & FUTURO Section — Added as per ALPHA-22 update */}
            <Paper className="glass-panel" sx={{ p: 4, mt: 4 }}>
              <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>ROADMAP & FUTURO</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>VISÃO ESTRATÉGICA E PRÓXIMAS FUNCIONALIDADES</Typography>
                </Box>
                <Chip
                  icon={<MagicIcon style={{ color: '#00e5ff' }} />}
                  label="ALPHA EVOLUTION"
                  sx={{ fontWeight: 900, fontSize: '0.7rem', bgcolor: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)', color: '#00e5ff' }}
                />
              </Box>

              <Grid container spacing={3}>
                {roadmapData.map((item, idx) => (
                  <Grid item xs={12} md={6} key={idx}>
                    <Box sx={{
                      p: 3,
                      height: '100%',
                      bgcolor: 'rgba(255,255,255,0.01)',
                      borderRadius: 4,
                      border: '1px solid',
                      borderColor: 'rgba(255,255,255,0.05)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.02)',
                        borderColor: item.color + '33',
                        transform: 'translateY(-4px)'
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box sx={{
                          width: 48, height: 48, borderRadius: 3,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          bgcolor: item.color + '1a',
                          color: item.color,
                          border: '1px solid',
                          borderColor: item.color + '33'
                        }}>
                          {item.icon}
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 900, color: item.color, letterSpacing: 1 }}>{item.phase}</Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{item.title}</Typography>
                        </Box>
                      </Box>

                      <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, opacity: 0.7, fontSize: '0.8rem' }}>
                        {item.focus}
                      </Typography>

                      <List dense sx={{ p: 0 }}>
                        {item.items.map((bullet, bIdx) => (
                          <ListItem key={bIdx} sx={{ p: 0, mb: 0.5, alignItems: 'flex-start' }}>
                            <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                              {bullet.done ? (
                                <CheckIcon sx={{ fontSize: 14, color: 'success.main', opacity: 0.8 }} />
                              ) : (
                                <PlayIcon sx={{ fontSize: 12, color: 'primary.main', opacity: 0.4, transform: 'rotate(-45deg)' }} />
                              )}
                            </ListItemIcon>
                            <ListItemText
                              primary={bullet.text}
                              primaryTypographyProps={{
                                sx: {
                                  fontSize: '0.75rem',
                                  fontWeight: bullet.done ? 600 : 500,
                                  opacity: bullet.done ? 1 : 0.6,
                                  color: bullet.done ? 'inherit' : 'rgba(255,255,255,0.7)'
                                }
                              }}
                            />
                            {bullet.done && <Chip label="OK" size="small" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 900, bgcolor: 'rgba(76,175,80,0.15)', color: '#4caf50', border: '1px solid rgba(76,175,80,0.2)', ml: 1 }} />}
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </TabPanel>

        </Grid>
      </Grid>

      {/* Add User Dialog */}
      {/* Add User Dialog */}
      <Dialog
        open={userDialogOpen}
        onClose={() => setUserDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ className: 'glass-panel', sx: { backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'primary.main' }}>ADICIONAR UTILIZADOR</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label="USERNAME"
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            sx={{ mt: 2 }}
            InputProps={{ sx: { borderRadius: 3 } }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth label="PASSWORD" type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            sx={{ mt: 3 }}
            InputProps={{ sx: { borderRadius: 3 } }}
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth sx={{ mt: 3 }}>
            <InputLabel shrink>PERFIL DE ACESSO</InputLabel>
            <Select
              value={newUser.profile_id}
              label="PERFIL DE ACESSO"
              onChange={(e) => setNewUser({ ...newUser, profile_id: e.target.value })}
              sx={{ borderRadius: 3 }}
              notched
            >
              {profiles.map(p => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name.toUpperCase()} {p.is_system && '(SISTEMA)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setUserDialogOpen(false)} sx={{ fontWeight: 800 }}>CANCELAR</Button>
          <Button variant="contained" onClick={handleAddUser} sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}>GUARDAR</Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ className: 'glass-panel', sx: { backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'primary.main' }}>REPOR PASSWORD: {selectedUser?.username?.toUpperCase()}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label="NOVA PASSWORD" type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mt: 2 }}
            InputProps={{ sx: { borderRadius: 3 } }}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setPasswordDialogOpen(false)} sx={{ fontWeight: 800 }}>CANCELAR</Button>
          <Button variant="contained" onClick={handleChangePassword} sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}>ATUALIZAR</Button>
        </DialogActions>
      </Dialog>

      {/* Release Notes Dialog */}
      <Dialog
        open={releaseNotesOpen}
        onClose={() => setReleaseNotesOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ className: 'glass-panel', sx: { backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WizardIcon /> NOTAS DE LANÇAMENTO
          </Box>
          <Typography variant="caption" sx={{ opacity: 0.5 }}>{settings.system_version || 'v2.2.0-ALPHA.19-PRO'}</Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <List sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {releaseHistory.map((release, index) => (
              <Box key={release.version}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    Versão {release.version}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.4 }}>{release.date}</Typography>
                </Box>
                <Box sx={{ pl: 3, borderLeft: '2px solid rgba(0,229,255,0.1)' }}>
                  {release.changes.map((change, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 1 }}>
                      <CheckIcon color="success" sx={{ fontSize: 14, mt: 0.5 }} />
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>{change}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" onClick={() => setReleaseNotesOpen(false)} sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}>ENTENDIDO</Button>
        </DialogActions>
      </Dialog>
      {/* Profile Dialog */}
      <Dialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ className: 'glass-panel', sx: { backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'primary.main' }}>
          {currentProfile.id ? 'EDITAR PERFIL' : 'NOVO PERFIL'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label="NOME DO PERFIL"
            value={currentProfile.name}
            onChange={(e) => setCurrentProfile({ ...currentProfile, name: e.target.value })}
            sx={{ mt: 2 }}
            InputProps={{ sx: { borderRadius: 3 }, readOnly: currentProfile.is_system }} // System profiles name read-only? Default Admin should be protected completely maybe.
            InputLabelProps={{ shrink: true }}
            helperText={currentProfile.is_system ? "Perfis de sistema não podem ser renomeados." : ""}
          />
          <FormControl fullWidth sx={{ mt: 3 }}>
            <InputLabel shrink>PERMISSÕES</InputLabel>
            <Select
              multiple
              value={currentProfile.permissions || []}
              label="PERMISSÕES"
              onChange={(e) => setCurrentProfile({ ...currentProfile, permissions: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
              sx={{ borderRadius: 3 }}
              notched
              renderValue={(selected) => selected.join(', ').toUpperCase()}
            >
              <MenuItem value="read">READ</MenuItem>
              <MenuItem value="write">WRITE</MenuItem>
              <MenuItem value="delete">DELETE</MenuItem>
              <MenuItem value="execute">EXECUTE</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setProfileDialogOpen(false)} sx={{ fontWeight: 800 }}>CANCELAR</Button>
          <Button variant="contained" onClick={handleSaveProfile} sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}>GUARDAR</Button>
        </DialogActions>
      </Dialog>

      {/* Auto-Config Dialog */}
      <Dialog
        open={autoConfigOpen}
        onClose={() => setAutoConfigOpen(false)}
        PaperProps={{ className: 'glass-panel', sx: { backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <MagicIcon /> Configuração Automática
        </DialogTitle>
        <DialogContent>
          <Typography>
            Esta ação irá configurar automaticamente as chaves de API recomendadas para:
          </Typography>
          <List dense>
            <ListItem><ListItemText primary="• CineOne Database (TMDB)" /></ListItem>
            <ListItem><ListItemText primary="• Open Movie Database (OMDB)" /></ListItem>
            <ListItem><ListItemText primary="• TVMaze Metadata" /></ListItem>
          </List>
          <Alert severity="warning" sx={{ mt: 1 }}>
            As suas chaves atuais serão substituídas. Deseja continuar?
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAutoConfigOpen(false)} sx={{ fontWeight: 800 }}>CANCELAR</Button>
          <Button variant="contained" onClick={confirmApplyDefaults} sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}>
            CONFIRMAR
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
      <OverlayConverterDialog
        open={converterOpen}
        onClose={() => setConverterOpen(false)}
        onSave={handleConverterSave}
      />
      <UdpVerificationDialog
        open={udpConfirmOpen}
        onClose={() => setUdpConfirmOpen(false)}
        onConfirm={() => {
          setSettings({ ...settings, udpEnabled: true });
          setUdpConfirmOpen(false);
          showSuccess("Protocolo UDP pronto para ativação ao salvar.");
        }}
      />

      {/* Quality Preset Confirmation Dialog */}
      <Dialog
        open={!!pendingPreset}
        onClose={() => setPendingPreset(null)}
        PaperProps={{ className: 'glass-panel', sx: { backgroundImage: 'none', border: '1px solid rgba(255, 152, 0, 0.3)' } }}
      >
        <DialogTitle sx={{ color: 'warning.main', display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800 }}>
          <WarningIcon /> ALTERAR PRESET DE QUALIDADE
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Vai aplicar o preset <strong style={{ color: '#00e5ff' }}>{pendingPreset?.title}</strong>:
          </Typography>
          <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 2, fontFamily: 'monospace', fontSize: '0.85rem', mb: 2 }}>
            <div>Resolução: <strong>{pendingPreset?.res}</strong></div>
            <div>Bitrate: <strong>{pendingPreset?.bitrate}k</strong></div>
            <div>FPS: <strong>{pendingPreset?.fps}</strong></div>
          </Box>
          <Alert severity="warning" sx={{ fontSize: '0.8rem' }}>
            Esta alteração requer reinício do motor de playout para ter efeito. Guarde as definições e reinicie o motor após confirmar.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPendingPreset(null)} sx={{ fontWeight: 800 }}>CANCELAR</Button>
          <Button variant="contained" color="warning" onClick={confirmApplyPreset} sx={{ fontWeight: 800, px: 4 }}>
            APLICAR PRESET
          </Button>
        </DialogActions>
      </Dialog>

      {/* Advanced Log Viewer Dialog */}
      <Dialog
        open={showLogsDialog}
        onClose={() => setShowLogsDialog(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{ className: 'glass-panel', sx: { backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.1)', height: '90vh' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'primary.main', pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon /> REGISTOS DO PLAYOUT
              {isRefreshingLogs && <CircularProgress size={14} sx={{ ml: 1 }} />}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Configuração de rotação de logs" arrow>
                <Button size="small" variant="outlined" startIcon={<SettingsIcon />} onClick={() => setShowLogRotationConfig(v => !v)} sx={{ fontWeight: 800, fontSize: '0.65rem' }}>ROTAÇÃO</Button>
              </Tooltip>
              <Tooltip title="Exportar logs visíveis como TXT" arrow>
                <Button size="small" variant="outlined" startIcon={<SaveIcon />} onClick={() => {
                  const filtered = logs.filter(l => logFilter === 'ALL' || l.includes(logFilter)).filter(l => !logSearch || l.toLowerCase().includes(logSearch.toLowerCase()));
                  const blob = new Blob([filtered.join('\n')], { type: 'text/plain' });
                  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `playout_logs_${new Date().toISOString().slice(0, 10)}.txt`; a.click();
                }} sx={{ fontWeight: 800, fontSize: '0.65rem' }}>EXPORTAR TXT</Button>
              </Tooltip>
              <Button size="small" onClick={fetchLogs} startIcon={<RefreshIcon />} sx={{ fontWeight: 800, fontSize: '0.65rem' }}>REFRESCAR</Button>
              <IconButton onClick={() => setShowLogsDialog(false)} size="small" sx={{ color: 'text.disabled' }}><AddIcon sx={{ transform: 'rotate(45deg)' }} /></IconButton>
            </Box>
          </Box>
          {/* Rotation Config Panel */}
          {showLogRotationConfig && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255,152,0,0.06)', borderRadius: 3, border: '1px solid rgba(255,152,0,0.15)' }}>
              <Typography variant="overline" sx={{ color: 'warning.main', fontWeight: 800, display: 'block', mb: 2 }}>CONFIGURAÇÃO DE ROTAÇÃO DE LOGS</Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={6} md={3}>
                  <TextField size="small" label="TAMANHO MÁX. (MB)" type="number" value={logRotationSettings.maxSizeMb} onChange={e => setLogRotationSettings(p => ({ ...p, maxSizeMb: parseInt(e.target.value) || 50 }))} InputProps={{ sx: { bgcolor: 'rgba(0,0,0,0.3)', fontFamily: 'monospace' } }} fullWidth />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField size="small" label="MÁXIMO DE FICHEIROS" type="number" value={logRotationSettings.maxFiles} onChange={e => setLogRotationSettings(p => ({ ...p, maxFiles: parseInt(e.target.value) || 5 }))} InputProps={{ sx: { bgcolor: 'rgba(0,0,0,0.3)', fontFamily: 'monospace' } }} fullWidth />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField size="small" label="RETENÇÃO (DIAS)" type="number" value={logRotationSettings.retentionDays} onChange={e => setLogRotationSettings(p => ({ ...p, retentionDays: parseInt(e.target.value) || 30 }))} InputProps={{ sx: { bgcolor: 'rgba(0,0,0,0.3)', fontFamily: 'monospace' } }} fullWidth />
                </Grid>
                <Grid item xs={6} md={3}>
                  <FormControlLabel control={<Switch checked={logRotationSettings.compressOld} onChange={e => setLogRotationSettings(p => ({ ...p, compressOld: e.target.checked }))} size="small" sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: 'warning.main' } }} />} label={<Typography variant="caption" sx={{ fontWeight: 800 }}>COMPRIMIR LOGS ANTIGOS</Typography>} />
                </Grid>
              </Grid>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button size="small" variant="contained" color="warning" onClick={async () => {
                  try {
                    await settingsAPI.update({ log_max_size_mb: logRotationSettings.maxSizeMb, log_max_files: logRotationSettings.maxFiles, log_compress_old: logRotationSettings.compressOld, log_retention_days: logRotationSettings.retentionDays });
                    showSuccess('Configuração de rotação guardada!');
                  } catch (e) { showError('Erro ao guardar configuração de rotação'); }
                }} sx={{ fontWeight: 800, fontSize: '0.65rem' }}>GUARDAR CONFIGURAÇÃO</Button>
                <Button size="small" variant="outlined" color="error" onClick={async () => {
                  if (!window.confirm('Forçar rotação agora? O log actual será arquivado.')) return;
                  try {
                    await fetch('/api/logs/rotate', { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
                    showSuccess('Rotação executada! Log reiniciado.'); fetchLogs();
                  } catch (e) { showError('Erro ao executar rotação'); }
                }} sx={{ fontWeight: 800, fontSize: '0.65rem' }}>FORÇAR ROTAÇÃO AGORA</Button>
              </Box>
            </Box>
          )}
          {/* Filter Toolbar */}
          <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <ToggleButtonGroup value={logFilter} exclusive onChange={(e, v) => v && setLogFilter(v)} size="small">
              {['ALL', 'INFO', 'WARN', 'ERROR'].map(f => (
                <ToggleButton key={f} value={f} sx={{ fontWeight: 800, fontSize: '0.65rem', color: f === 'ERROR' ? 'error.main' : f === 'WARN' ? 'warning.main' : f === 'INFO' ? 'success.main' : 'text.primary', '&.Mui-selected': { bgcolor: f === 'ERROR' ? 'rgba(244,67,54,0.15)' : f === 'WARN' ? 'rgba(255,152,0,0.15)' : f === 'INFO' ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.08)' } }}>
                  {f}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <TextField size="small" placeholder="Pesquisar nos logs..." value={logSearch} onChange={e => setLogSearch(e.target.value)} sx={{ flexGrow: 1 }} InputProps={{ sx: { bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 2, fontSize: '0.75rem', fontFamily: 'monospace' } }} />
            <Typography variant="caption" sx={{ opacity: 0.5, whiteSpace: 'nowrap' }}>
              {logs.filter(l => logFilter === 'ALL' || l.includes(logFilter)).filter(l => !logSearch || l.toLowerCase().includes(logSearch.toLowerCase())).length} linhas
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.05)', p: 0, flexGrow: 1, overflow: 'hidden' }}>
          <Box sx={{ p: 2, bgcolor: '#000', height: '100%', overflowY: 'auto', fontFamily: '"JetBrains Mono","Roboto Mono",monospace', fontSize: '0.75rem' }}>
            {(() => {
              const filtered = logs.filter(l => logFilter === 'ALL' || l.includes(logFilter)).filter(l => !logSearch || l.toLowerCase().includes(logSearch.toLowerCase()));
              return filtered.length > 0 ? filtered.map((log, idx) => (
                <Typography key={idx} component="div" sx={{
                  color: log.includes('ERROR') ? '#ff5252' : log.includes('WARN') ? '#ffd740' : log.includes('INFO') ? '#4caf50' : 'rgba(255,255,255,0.8)',
                  whiteSpace: 'pre-wrap', mb: 0.3, lineHeight: 1.5, fontFamily: 'inherit', fontSize: 'inherit',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 1 }
                }}>
                  {log}
                </Typography>
              )) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, opacity: 0.4 }}>
                  {logFilter !== 'ALL' || logSearch ? 'NENHUM RESULTADO PARA OS FILTROS APLICADOS' : 'A AGUARDAR REGISTOS...'}
                </Box>
              );
            })()}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ opacity: 0.4, fontFamily: 'monospace', fontSize: '0.65rem' }}>
            📂 {settings.logPath || '/var/log/onepa/playout.log'} · Rotação: {logRotationSettings.maxSizeMb}MB / {logRotationSettings.maxFiles} ficheiros · {logRotationSettings.compressOld ? '🗜 Compressão ON' : 'Compressão OFF'} · Retenção: {logRotationSettings.retentionDays} dias
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setShowLogsDialog(false)} sx={{ fontWeight: 800 }}>FECHAR</Button>
            <Button variant="outlined" color="warning" onClick={handleRetryPlayout} sx={{ fontWeight: 800 }}>REINICIAR MOTOR</Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* PROXY EXPLORER DIALOG */}
      <Dialog
        open={explorerOpen}
        onClose={() => setExplorerOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ className: "glass-panel", sx: { borderRadius: 4, minHeight: '600px' } }}
      >
        <DialogTitle sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>EXPLORADOR DE PROXIES WEB</Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>GESTÃO INDIVIDUAL DE FICHEIROS OPTIMIZADOS PARA PREVIEW</Typography>
          </Box>
          <IconButton onClick={() => setExplorerOpen(false)} sx={{ color: 'text.secondary' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.05)', p: 0 }}>
          <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              {selectedProxyIds.length} SELECIONADOS
              {selectedProxyIds.length > 0 && ` (${(proxiesList.filter(p => selectedProxyIds.includes(p.id)).reduce((acc, curr) => acc + curr.size_bytes, 0) / 1024 / 1024).toFixed(2)} MB A LIBERTAR)`}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                onClick={() => setSelectedProxyIds(selectedProxyIds.length === proxiesList.length ? [] : proxiesList.map(p => p.id))}
              >
                {selectedProxyIds.length === proxiesList.length ? 'DESELECIONAR TUDO' : 'SELECIONAR TUDO'}
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                disabled={selectedProxyIds.length === 0}
                onClick={() => setDeleteConfirmOpen(true)}
                startIcon={<DeleteIcon />}
              >
                APAGAR SELECIONADOS
              </Button>
            </Box>
          </Box>
          <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
            <List>
              {proxiesList.map((proxy) => (
                <ListItem
                  key={proxy.id}
                  sx={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    bgcolor: selectedProxyIds.includes(proxy.id) ? 'rgba(255, 82, 82, 0.05)' : 'transparent'
                  }}
                >
                  <Checkbox
                    checked={selectedProxyIds.includes(proxy.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedProxyIds([...selectedProxyIds, proxy.id]);
                      else setSelectedProxyIds(selectedProxyIds.filter(id => id !== proxy.id));
                    }}
                  />
                  <ListItemText
                    primary={proxy.filename}
                    primaryTypographyProps={{ fontWeight: 700, fontSize: '0.85rem' }}
                    secondary={`${(proxy.size_bytes / 1024 / 1024).toFixed(2)} MB • ${new Date(proxy.created_at).toLocaleString()}`}
                    secondaryTypographyProps={{ fontSize: '0.7rem' }}
                  />
                </ListItem>
              ))}
              {proxiesList.length === 0 && (
                <Box sx={{ p: 4, textAlign: 'center', opacity: 0.5 }}>
                  NENHUM PROXY ENCONTRADO NO DISCO
                </Box>
              )}
            </List>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setExplorerOpen(false)} sx={{ fontWeight: 800 }}>SAIR</Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{ className: "glass-panel", sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'error.main' }}>CONFIRMAR ELIMINAÇÃO</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Tem a certeza que deseja eliminar <strong>{selectedProxyIds.length}</strong> ficheiros de proxy?
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
            Total de espaço a libertar: <strong>{(proxiesList.filter(p => selectedProxyIds.includes(p.id)).reduce((acc, curr) => acc + curr.size_bytes, 0) / 1024 / 1024).toFixed(2)} MB</strong>
          </Typography>
          <Box sx={{ p: 1.5, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 2, maxHeight: '150px', overflowY: 'auto' }}>
            {proxiesList.filter(p => selectedProxyIds.includes(p.id)).map(p => (
              <Typography key={p.id} variant="caption" sx={{ display: 'block', opacity: 0.6 }}>• {p.filename}</Typography>
            ))}
          </Box>
          <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 2, fontWeight: 700 }}>
            ⚠️ ESTA OPERAÇÃO NÃO PODE SER DESFEITA. OS PREVIEWS NO PORTAL VOLTARÃO A SER LENTOS PARA ESTES VÍDEOS.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ fontWeight: 800 }}>CANCELAR</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteSelectedProxies}
            disabled={purgingProxies}
            sx={{ fontWeight: 800 }}
          >
            {purgingProxies ? <CircularProgress size={20} color="inherit" /> : 'CONFIRMAR E APAGAR'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function SafeSettings() {
  return (
    <ErrorBoundary>
      <Settings />
    </ErrorBoundary>
  );
}

