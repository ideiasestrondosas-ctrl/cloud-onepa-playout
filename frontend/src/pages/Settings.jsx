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
  Checkbox,
  Switch,
  Stack,
  Tooltip,
  CircularProgress,
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
} from '@mui/icons-material';

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
            • <strong>Unicast (Direto):</strong> Ideal para enviar para um IP específico (ex: <code>udp://192.168.1.100:1234</code>).<br/>
            • <strong>Multicast (Rede):</strong> Envia para um grupo (ex: <code>udp://239.0.0.1:1234</code>). Útil para vários receptores na mesma rede local.<br/>
          </Typography>
          
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>2. Como Aceder (VLC / Player Externo):</Typography>
          <Typography variant="body2" component="div">
            • <strong>Na mesma máquina:</strong> Abra o VLC e use <code>udp://@:1234</code>.<br/>
            • <strong>Outro computador (Rede Local):</strong> Use <code>udp://@[IP_DO_SERVIDOR]:1234</code>.<br/>
            • <strong>Acesso Externo:</strong> Requer <i>Port Forwarding</i> no router (Porta UDP 1234). Use o seu IP Público.<br/>
          </Typography>

          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>3. Requisitos de Rede:</Typography>
          <Typography variant="body2" component="div">
            • <strong>Multicast:</strong> Pode bloquear redes Wi-Fi se não houver "IGMP Snooping". Prefira rede gigabit cabeada.<br/>
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

  useEffect(() => {
    fetchSettings();
    fetchProtectedAssets();
    fetchUsers();
    fetchReleaseHistory();
    
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
        epgUrl: data.epg_url || '',
        dayStart: data.day_start || '06:00',
        defaultImagePath: data.default_image_path || '',
        defaultVideoPath: data.default_video_path || '',
        version: data.system_version || '2.2.0-ALPHA.1', 
        releaseDate: data.release_date || '2026-01-26',
        overlay_enabled: data.overlay_enabled ?? true,
        channelName: data.channel_name || 'Cloud Onepa',
        branding_type: isVideoBranding ? 'video' : 'static',
        overlayOpacity: data.overlay_opacity ?? 1.0,
        overlayScale: data.overlay_scale ?? 1.0,
        srtMode: data.srt_mode || 'caller',
        protectedPath: data.protected_path || '/var/lib/onepa-playout/assets/protected',
        docsPath: data.docs_path || '/app/docs',
        system_version: data.system_version || '2.2.0-ALPHA.1',
        release_date: data.release_date || '2026-01-26',
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

  const fetchReleaseHistory = async () => {
    try {
      const response = await settingsAPI.getReleaseHistory();
      setReleaseHistory(response.data || []);
    } catch (error) {
      console.error('Failed to fetch release history:', error);
    }
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
        };
      } else if (tabValue === 2) { // Playout Tab
        payload = {
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
    if (!window.confirm('Isto irá substituir as suas chaves API atuais pelas recomendadas. Continuar?')) return;
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
        <Box>
            <Typography variant="h4" className="neon-text" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>Definições</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>
                Painel de Controlo do Sistema • v2.2.0-ALPHA.1
            </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
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
                                <Select value={settings.resolution} label="RESOLUÇÃO" onChange={(e) => setSettings({ ...settings, resolution: e.target.value })} sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3 }}>
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
                                onChange={(e) => setSettings({ ...settings, videoBitrate: e.target.value })}
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
                            { label: 'FILLERS & LOOPS', value: settings.fillersPath, key: 'fillersPath', helper: 'Conteúdos de preenchimento automático' }
                        ].map(field => (
                            <Grid item xs={12} key={field.key}>
                                <TextField
                                    fullWidth
                                    label={field.label}
                                    value={field.value}
                                    onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                                    helperText={field.helper}
                                    InputProps={{ sx: { bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3 } }}
                                />
                            </Grid>
                        ))}
                    </Grid>
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
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>BRANDING & ASSETS PROTEGIDOS</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>IDENTIDADE VISUAL E FALLBACKS</Typography>
                    </Box>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ p: 3, bgcolor: 'rgba(0,0,0,0.4)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, mb: 2, display: 'block' }}>PREVIEW LOGO/VIDEO</Typography>
                                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
                                    {(settings.branding_type === 'video') ? (
                                        <video src="/assets/protected/Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4" autoPlay loop muted style={{ maxWidth: '100%', maxHeight: '100%' }} />
                                    ) : (
                                        <img src={`/api/settings/app-logo?t=${Date.now()}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                    )}
                                </Box>
                                <ToggleButtonGroup
                                    value={settings.branding_type || 'static'}
                                    exclusive
                                    onChange={(e, v) => v && setSettings({...settings, branding_type: v})}
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
                                   <input type="file" hidden accept="image/*" onChange={(e) => {/* handle upload */}} />
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
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, display: 'block' }}>OPACIDADE ({Math.round(settings.overlayOpacity * 100)}%)</Typography>
                                <Slider value={settings.overlayOpacity || 1.0} min={0} max={1} step={0.1} onChange={(e, v) => setSettings({...settings, overlayOpacity: v})} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, display: 'block' }}>ESCALA ({settings.overlayScale}x)</Typography>
                                <Slider value={settings.overlayScale || 1.0} min={0.1} max={2.0} step={0.1} onChange={(e, v) => setSettings({...settings, overlayScale: v})} />
                            </Grid>
                        </Grid>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <TextField 
                            fullWidth 
                            label="CAMINHO DO LOGO" 
                            value={settings.logoPath} 
                            onChange={(e) => setSettings({...settings, logoPath: e.target.value})}
                            InputProps={{ sx: { bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3 } }}
                        />
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

            {/* CATEGORY 3: UTILIZADORES */}
            <TabPanel value={tabValue} index={3}>
                <Paper className="glass-panel" sx={{ p: 4 }}>
                    <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>GESTÃO DE ACESSOS</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>UTILIZADORES COM ACESSO AO PAINEL</Typography>
                        </Box>
                        <Button 
                            variant="contained" 
                            startIcon={<AddIcon />} 
                            onClick={() => setUserDialogOpen(true)}
                            sx={{ borderRadius: 3, fontWeight: 800, px: 3 }}
                        >
                            ADICIONAR USER
                        </Button>
                    </Box>

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
                                    secondary={`NÍVEL DE ACESSO: ${user.role.toUpperCase()}`}
                                    primaryTypographyProps={{ sx: { fontWeight: 800, letterSpacing: 1 } }}
                                    secondaryTypographyProps={{ sx: { fontWeight: 600, fontSize: '0.65rem', opacity: 0.6 } }}
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
                            { label: 'VERSÃO DO SISTEMA', value: settings.version || 'v2.2.0-ALPHA.1', icon: <WizardIcon /> },
                            { label: 'ÚLTIMA ATUALIZAÇÃO', value: settings.releaseDate || '2026-01-26', icon: <CheckIcon /> },
                            { label: 'AMBIENTE DE HOST', value: 'MacBook Pro M4 / Proxmox', icon: <PlatformIcon /> },
                            { label: 'DEPLOYMENT', value: 'Docker Container (Linux)', icon: <FolderIcon /> }
                        ].map((item, id) => (
                            <Grid item xs={12} sm={6} md={3} key={id}>
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
                    <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                        <Button variant="outlined" onClick={() => window.open('https://github.com/onepa/cloud-onepa-playout/blob/master/RELEASE_NOTES.md', '_blank')} sx={{ borderRadius: 2, fontWeight: 800 }}>NOTAS DE LANÇAMENTO</Button>
                        <Button variant="outlined" onClick={() => window.open('https://github.com/onepa/cloud-onepa-playout', '_blank')} sx={{ borderRadius: 2, fontWeight: 800 }}>GITHUB REPO</Button>
                    </Box>
                </Paper>

                <Paper className="glass-panel" sx={{ p: 4 }}>
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>HISTÓRICO DE VERSÕES</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>NOTAS CRÍTICAS E EVOLUÇÃO DO PROJETO</Typography>
                    </Box>
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
            <InputLabel shrink>NÍVEL DE ACESSO</InputLabel>
            <Select
              value={newUser.role}
              label="NÍVEL DE ACESSO"
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              sx={{ borderRadius: 3 }}
              notched
            >
              <MenuItem value="admin">ADMINISTRADOR</MenuItem>
              <MenuItem value="operator">OPERADOR</MenuItem>
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
            <Typography variant="caption" sx={{ opacity: 0.5 }}>v2.2.0-ALPHA.1</Typography>
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
          setSettings({...settings, udpEnabled: true});
          setUdpConfirmOpen(false);
          showSuccess("Protocolo UDP pronto para ativação ao salvar.");
        }}
      />
    </Box>
  );
}
