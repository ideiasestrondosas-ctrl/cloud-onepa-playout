import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactPlayer from 'react-player';
import axios from 'axios';
import { useNotification } from '../contexts/NotificationContext';
import { authAPI, settingsAPI, protectedAPI, playoutAPI, mediaAPI } from '../services/api';
import {
  OUTPUT_PROTOCOLS,
  OUTPUT_DEFAULTS,
  PRESETS,
  UDP_DEFAULTS,
  APP_VERSION_FALLBACK,
  APP_RELEASE_DATE_FALLBACK
} from '../constants/settingsConfig';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Drawer,
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
  RestartAlt as RestartAltIcon,
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
  BugReport as BugIcon,
  VisibilityOff as ViewOffIcon,
  Science as TestIcon,
  ContentCopy as CopyIcon,
  NorthWest as NwIcon,
  NorthEast as NeIcon,
  SouthWest as SwIcon,
  SouthEast as SeIcon,
  RadioButtonChecked as TargetIcon,
  Edit as EditIcon
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
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main', fontWeight: 'bold' }}>
        <WarningIcon /> {t('settings.warnings.udp_config')}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
          {t('settings.dialogs.udp_verify.intro')}
        </Typography>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255, 152, 0, 0.1)', borderRadius: 2, borderLeft: '4px solid #ff9800' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{t('settings.dialogs.udp_verify.stability_title')}</Typography>
          <Typography variant="body2">
            {t('settings.dialogs.udp_verify.stability_desc')}
          </Typography>

          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2 }}>{t('settings.dialogs.udp_verify.network_title')}</Typography>
          <Typography variant="body2">
            • <strong>{t('settings.dialogs.udp_verify.network_external')}</strong> {t('settings.dialogs.udp_verify.network_desc')}<br />
          </Typography>

          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2 }}>{t('settings.dialogs.udp_verify.sync_title')}</Typography>
          <Typography variant="body2">
            • {t('settings.dialogs.udp_verify.sync_desc')}
          </Typography>
        </Box>

        <Typography variant="caption" display="block" sx={{ mt: 2, fontStyle: 'italic' }}>
          {t('settings.dialogs.udp_verify.firewall_warning')}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">{t('common.cancel')}</Button>
        <Button onClick={onConfirm} variant="contained" color="warning">{t('settings.dialogs.udp_verify.confirm_btn')}</Button>
      </DialogActions>
    </Dialog>
  );
}

function OverlayConverterDialog({ open, onClose, onSave }) {
  const { t } = useTranslation();
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
      <DialogTitle>{t('settings.dialogs.overlay_optimizer.title')}</DialogTitle>
      <DialogContent onDragOver={handleDragOver} onDrop={handleDrop}>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {!file ? (
            <Button variant="outlined" component="label" startIcon={<UploadIcon />} sx={{ height: 150, borderStyle: 'dashed' }}>
              {t('settings.dialogs.overlay_optimizer.select_btn')}
              <input type="file" hidden accept="image/*" onChange={handleFileSelect} />
            </Button>
          ) : (
            <>
              <Box sx={{ textAlign: 'center', bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }} />
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth label={t('settings.dialogs.overlay_optimizer.width_label')} type="number" value={dimensions.width} onChange={(e) => handleWidthChange(e.target.value)} size="small" />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label={t('settings.dialogs.overlay_optimizer.height_label')} type="number" value={dimensions.height} onChange={(e) => handleHeightChange(e.target.value)} size="small" />
                </Grid>
              </Grid>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControlLabel control={<Radio checked={maintainAspect} onClick={() => setMaintainAspect(!maintainAspect)} />} label={t('settings.dialogs.overlay_optimizer.aspect_label')} />
                <FormControlLabel control={<Radio checked={autoTrim} onClick={() => setAutoTrim(!autoTrim)} />} label={t('settings.dialogs.overlay_optimizer.trim_label')} />
              </Box>
              <Button variant="outlined" component="label" size="small">{t('settings.dialogs.overlay_optimizer.change_btn')}<input type="file" hidden accept="image/*" onChange={handleFileSelect} /></Button>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={processAndSave} variant="contained" disabled={!file || processing} startIcon={processing ? <RefreshIcon className="spin" /> : <MagicIcon />}>
          {processing ? t('settings.dialogs.overlay_optimizer.processing') : t('settings.dialogs.overlay_optimizer.apply_btn')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Settings() {
  const { t } = useTranslation();
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
  const [vmLogSections, setVmLogSections] = useState([]);
  const [vmLogMessage, setVmLogMessage] = useState('');
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [logTab, setLogTab] = useState(0); // 0: Playout, 1: VM/System
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
  const [proxyStats, setProxyStats] = useState({
    total_bytes: 0,
    proxy_count: 0,
    physical_media_count: 0,
    db_media_count: 0,
    sync_needed: false
  });
  const [syncing, setSyncing] = useState(false);
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
      // Fetch both Playout and VM logs
      const [playoutRes, vmRes] = await Promise.all([
        settingsAPI.getSystemLogs(),
        settingsAPI.getVMLogs()
      ]);

      setLogs(playoutRes.data.logs || []);
      setVmLogSections(vmRes.data.sections || []);
      setVmLogMessage(vmRes.data.message || '');
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsRefreshingLogs(false);
    }
  };

  const handleRetryPlayout = async () => {
    try {
      showWarning(t('settings.playout.restart_warning') || 'Reiniciando transmissão...');
      await playoutAPI.stop();
      await new Promise(r => setTimeout(r, 1000));
      await playoutAPI.start();
      showSuccess(t('settings.playout.restart_success'));
      if (showLogsDialog) fetchLogs();
    } catch (error) {
      showError(t('settings.playout.restart_error') || 'Erro ao reiniciar!');
    }
  };

  // Helper for clipboard copy with fallback for non-secure contexts (HTTP IP access)
  const handleCopyToClipboard = (text, successMsg = t('settings.output.links.copied') || 'Copiado para o clipboard!') => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => showSuccess(successMsg))
        .catch(() => fallbackCopy(text, successMsg));
    } else {
      fallbackCopy(text, successMsg);
    }
  };

  const fallbackCopy = (text, successMsg) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showSuccess(successMsg);
    } catch (err) {
      console.error('Fallback copy failed', err);
      showError(t('common.error') || 'Erro ao copiar');
    }
    document.body.removeChild(textArea);
  };

  const fetchSettings = useCallback(async () => {
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
        version: data.system_version || 'v2.2.0-ALPHA.35-PRO',
        releaseDate: data.release_date || '2026-03-08',
        overlay_enabled: data.overlay_enabled ?? true,
        channelName: data.channel_name || 'Cloud Onepa',
        branding_type: brandingType,
        overlayOpacity: data.overlay_opacity ?? 1.0,
        overlayScale: data.overlay_scale ?? 1.0,
        srtMode: data.srt_mode || 'caller',
        protectedPath: data.protected_path || '/var/lib/onepa-playout/assets/protected',
        docsPath: data.docs_path || '/app/docs',
        system_version: data.system_version || 'v2.2.0-ALPHA.35-PRO',
        release_date: data.release_date || '2026-03-08',
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
      setLogRotationSettings({
        maxSizeMb: data.log_max_size_mb || 50,
        maxFiles: data.log_max_files || 5,
        compressOld: data.log_compress_old ?? true,
        retentionDays: data.log_retention_days || 30
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      showError(t('settings.playout.save_error'));
    } finally {
      setLoading(false);
    }
  }, [showError]);

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
      showSuccess(t('settings.branding.upload_success'));
    } catch (error) {
      console.error('Failed to set default media:', error);
      showError(t('settings.branding.upload_error'));
    } finally {
      setSaving(false);
    }
  };

  // OUTPUT_DEFAULTS and PRESETS are now stable module-level constants
  // (imported from constants/settingsConfig.js) — no longer re-created on every render.
  // UDP defaults are also imported: UDP_DEFAULTS.multicast / UDP_DEFAULTS.unicast

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
    showSuccess(`${t('common.success')}: ${type.toUpperCase()}`);
  };

  // PRESET LOGIC: Sync Resolution -> Preset Cards -> Bitrate Limits
  // (PRESETS constant is now imported from constants/settingsConfig.js)

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
      showSuccess(t('settings.playout.save_success', { tab: 'Playout' }));
    } catch (e) {
      showError(t('settings.playout.save_error'));
    }
    setPendingPreset(null);
  };

  const handleUdpModeChange = useCallback((mode) => {
    const newUrl = mode === 'multicast' ? UDP_DEFAULTS.multicast : UDP_DEFAULTS.unicast;
    setSettings(prev => ({
      ...prev,
      outputUrl: newUrl,
      udpOutputUrl: newUrl,
      udpMode: mode
    }));
  }, []);

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

  const handleSyncMedia = async () => {
    try {
      setSyncing(true);
      const res = await mediaAPI.sync();
      if (res.data.status === 'ok') {
        const addedFiles = res.data.added_files ? res.data.added_files.length : res.data.added;
        showSuccess(`Sincronização concluída: ${addedFiles} novos ficheiros identificados.`);
      } else {
        showSuccess(`Sincronização parcial: ${res.data.added} adicionados, ${res.data.errors} erros.`);
      }
      await fetchProxyStats();
      if (explorerOpen) await fetchProxiesList();
    } catch (err) {
      showError('Erro ao sincronizar ficheiros do disco');
      console.error(err);
    } finally {
      setSyncing(false);
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
      phase: 'Phase 25',
      title: 'CONECTIVIDADE & LIVE INPUTS',
      focus: 'Distribuição Inteligente e Redundância SRT',
      icon: <SensorsIcon />,
      color: '#00e5ff',
      items: [
        { text: 'Suporte SRT: Implementação (Caller & Listener) - ESTÁVEL', done: true },
        { text: 'Dynamic Bitrate: Ajuste em tempo real baseado em rede', done: true },
        { text: 'Smart Folder Playback: Auto-sync de novos conteúdos', done: true }
      ]
    },
    {
      phase: 'Phase 26',
      title: 'ELITE USER EXPERIENCE',
      focus: 'Nova Consola de Comando e Gestão de Média',
      icon: <RocketIcon />,
      color: '#ce93d8',
      items: [
        { text: 'Gestor de Espaço: Auditoria física vs DB em tempo real', done: true },
        { text: 'Branding Unificado: Sincronização inteligente de assets', done: true },
        { text: 'RBAC: Perfis de sistema com permissões granulares', done: true },
        { text: 'Fix Estrutural: Motor React optimizado para estabilidade', done: true }
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
    // Read from i18n translation files — supports PT, EN, ES, FR automatically
    const releases = t('settings.about.history.releases', { returnObjects: true });
    setReleaseHistory(Array.isArray(releases) ? releases : []);
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
      const tabNames = [t('settings.navigation.tabs.output'), t('settings.navigation.tabs.paths'), t('settings.navigation.tabs.playout')];
      showSuccess(t('settings.notifications.save_success', { tab: tabNames[tabValue] || '' }));

      // Auto-restart engine with new settings if in Output tab
      if (tabValue === 0) {
        try {
          await playoutAPI.start();
          showSuccess(t('settings.notifications.restart_success'));
        } catch (startErr) {
          console.warn('Auto-start failed/already running:', startErr);
        }
      }

    } catch (error) {
      console.error('Failed to save settings:', error);
      showError(t('settings.notifications.save_error'));
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
        showSuccess(t('settings.api.notifications.apply_defaults_success'));
        fetchSettings(); // Refresh UI
      } else {
        showError(`${t('settings.api.notifications.apply_defaults_error')}: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Apply Defaults Error:', error);
      showError(`${t('settings.api.notifications.apply_defaults_fail')}: ${error.response?.data?.error || error.message}`);
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
      showWarning(t('settings.api.notifications.test_key_missing', { service: service.toUpperCase() }));
      return;
    }

    try {
      const response = await settingsAPI.testApi(service, key);
      if (response.data.success) {
        showSuccess(t('settings.api.notifications.test_success', { service: service.toUpperCase() }));
      } else {
        showError(`${t('settings.api.notifications.test_error', { service: service.toUpperCase() })}: ${response.data.error}`);
      }
    } catch (error) {
      console.error('API Test Error:', error);
      showError(`${t('settings.api.notifications.test_fail', { service: service.toUpperCase() })}: ${error.response?.data?.error || error.message}`);
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
    if (!window.confirm(t('settings.users.dialogs.delete_confirm'))) return;
    try {
      await authAPI.deleteUser(id);
      showSuccess(t('settings.users.messages.delete_success'));
      fetchUsers();
    } catch (error) {
      showError(t('settings.users.messages.delete_error'));
    }
  };

  const handleSaveProfile = async () => {
    if (!currentProfile.name) {
      showWarning(t('settings.users.messages.profile_name_required'));
      return;
    }
    try {
      if (currentProfile.id) {
        await authAPI.updateProfile(currentProfile.id, currentProfile.permissions);
        showSuccess(t('settings.users.messages.profile_updated'));
      } else {
        await authAPI.createProfile(currentProfile.name, currentProfile.permissions);
        showSuccess(t('settings.users.messages.profile_created'));
      }
      setProfileDialogOpen(false);
      fetchProfiles();
    } catch (error) {
      showError(error.response?.data?.error || t('settings.users.messages.save_profile_error'));
    }
  };

  const handleDeleteProfile = async (id) => {
    if (!window.confirm(t('settings.users.dialogs.profile_delete_warning'))) return; // Use custom dialog ideally
    try {
      await authAPI.deleteProfile(id);
      showSuccess(t('settings.users.messages.profile_deleted'));
      fetchProfiles();
    } catch (error) {
      showError(error.response?.data?.error || t('settings.users.messages.delete_profile_error'));
    }
  };

  const handleOpenPasswordDialog = (user) => {
    setSelectedUser(user);
    setPasswordDialogOpen(true);
    setNewPassword('');
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      showWarning(t('settings.users.messages.password_min_length'));
      return;
    }

    try {
      await authAPI.changePassword(selectedUser.id, newPassword);
      showSuccess(t('settings.users.messages.password_changed'));
      setPasswordDialogOpen(false);
      setNewPassword('');
      setSelectedUser(null);
    } catch (error) {
      showError(t('settings.users.messages.password_change_error'));
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
            <Typography variant="h4" className="neon-text" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>{t('settings.header.title')}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>
              {t('settings.header.subtitle')}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title={t('settings.header.refresh_tooltip')} arrow>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchSettings}
              sx={{ fontWeight: 800, borderColor: 'rgba(255,255,255,0.1)' }}
            >
              {t('settings.header.refresh_btn')}
            </Button>
          </Tooltip>
          <Tooltip title={t('settings.header.history_tooltip')} arrow>
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => setReleaseNotesOpen(true)}
              sx={{ fontWeight: 800, borderColor: 'rgba(255,255,255,0.1)' }}
            >
              {t('settings.header.history_btn')}
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
            {saving ? t('settings.header.save_btn_loading') : t('settings.header.save_btn')}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={4} sx={{ position: 'relative', zIndex: 1, flexGrow: 1, px: 2, pb: 4 }}>
        {/* Navigation Sidebar */}
        <Grid item xs={12} md={2.5}>
          <Paper className="glass-panel" sx={{ p: 1.5, position: 'sticky', top: 16 }}>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, mb: 1, px: 2, display: 'block', letterSpacing: 2 }}>
              {t('settings.navigation.title')}
            </Typography>
            <List size="small">
              {[
                { icon: <TvIcon />, label: t('settings.navigation.output') },
                { icon: <FolderIcon />, label: t('settings.navigation.paths') },
                { icon: <PlatformIcon />, label: t('settings.navigation.playout') },
                { icon: <UserIcon />, label: t('settings.navigation.users') },
                { icon: <ViewIcon />, label: t('settings.navigation.about') }
              ].map((item, idx) => (
                <Tooltip key={idx} title={item.label} placement="right" arrow>
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
                <ListItemText primary={t('settings.navigation.monitor')} primaryTypographyProps={{ fontWeight: 800, fontSize: '0.75rem', letterSpacing: 1 }} />
              </ListItemButton>
            </List>

            <Box sx={{ mt: 4, p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 4, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800, display: 'block' }}>{t('settings.navigation.support')}</Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>Cloud Onepa Intelligence</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Content Area */}
        <Grid item xs={12} md={9.5}>
          <TabPanel value={tabValue} index={0}>
            {/* Protocolo Section */}
            <Paper className="glass-panel" sx={{ p: 2, mb: 2 }}>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800, fontSize: '1rem' }}>{t('settings.output.header.title')}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>{t('settings.output.header.subtitle')}</Typography>
                </Box>
                <Chip label={t('settings.output.header.status_ready')} color="success" sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }} />
              </Box>

              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800, letterSpacing: 1, fontSize: '0.75rem' }}>{t('settings.output.main.title')}</Typography>
              <ToggleButtonGroup
                value={settings.outputType}
                exclusive
                onChange={(e, val) => val && handleOutputTypeChange(val)}
                fullWidth
                sx={{ mb: 2, gap: 1 }}
              >
                {['rtmp', 'srt', 'udp', 'hls', 'desktop'].map(type => (
                  <ToggleButton
                    key={type}
                    value={type}
                    sx={{
                      borderRadius: '8px !important',
                      py: 0.5,
                      border: '1px solid rgba(255,255,255,0.05) !important',
                      fontWeight: 800,
                      fontSize: '0.7rem',
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
                    label={t('settings.output.main.url_label')}
                    value={settings.outputUrl}
                    onChange={(e) => setSettings({ ...settings, outputUrl: e.target.value })}
                    InputProps={{ sx: { bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3, fontWeight: 700, fontFamily: 'monospace' } }}
                    helperText={
                      settings.outputType === 'udp'
                        ? t('settings.output.main.udp_tip')
                        : ""
                    }
                    FormHelperTextProps={{ sx: { color: 'warning.main', fontWeight: 'bold' } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t('settings.output.main.resolution')}</InputLabel>
                    <Select value={settings.resolution} label={t('settings.output.main.resolution')} onChange={(e) => handleResolutionChange(e.target.value)} sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3 }}>
                      <MenuItem value="3840x2160">{t('settings.output.main.resolutions.4k')}</MenuItem>
                      <MenuItem value="1920x1080">{t('settings.output.main.resolutions.1080p')}</MenuItem>
                      <MenuItem value="1280x720">{t('settings.output.main.resolutions.720p')}</MenuItem>
                      <MenuItem value="640x360">{t('settings.output.main.resolutions.360p')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('settings.output.main.bitrate')}
                    value={settings.videoBitrate}
                    onChange={(e) => handleBitrateChange(e.target.value)}
                    InputProps={{ sx: { bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3 } }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Secondary Protocols Section */}
            <Paper className="glass-panel" sx={{ p: 1.5, mb: 2 }}>
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800, fontSize: '0.9rem' }}>{t('settings.output.multi.title')}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>{t('settings.output.multi.subtitle')}</Typography>
              </Box>

              {/* Active protocols */}
              <Grid container spacing={1}>
                {[
                  { id: 'rtmp', label: 'RTMP Server', icon: <PlatformIcon /> },
                  { id: 'srt', label: 'SRT (Caller/Listener)', icon: <PlatformIcon /> },
                  { id: 'udp', label: 'UDP Streaming', icon: <PlatformIcon /> },
                  { id: 'hls', label: 'HLS Distribution', icon: <TvIcon /> }
                ].map(proto => (
                  <Grid item xs={12} md={3} sm={6} key={proto.id}>
                    <Box sx={{ p: 1, py: 0.5, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ p: 0.5, bgcolor: 'rgba(0,229,255,0.1)', borderRadius: 1.5, color: 'primary.main' }}>
                          {React.cloneElement(proto.icon, { fontSize: 'small' })}
                        </Box>
                        <Typography variant="caption" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{proto.label}</Typography>
                      </Box>
                      <Checkbox
                        size="small"
                        checked={settings[`${proto.id}Enabled`]}
                        onChange={(e) => setSettings({ ...settings, [`${proto.id}Enabled`]: e.target.checked })}
                        sx={{ color: 'primary.main', p: 0.5, '&.Mui-checked': { color: 'primary.main' } }}
                      />
                    </Box>
                  </Grid>
                ))}

                {/* Divider */}
                <Grid item xs={12}>
                  <Divider sx={{ opacity: 0.08, my: 0.5 }}>
                    <Chip label={t('settings.output.multi.soon')} size="small" sx={{ height: 20, fontWeight: 800, fontSize: '0.55rem', color: 'warning.main', bgcolor: 'rgba(255,152,0,0.08)', borderColor: 'rgba(255,152,0,0.2)', border: '1px solid' }} />
                  </Divider>
                </Grid>

                {/* Future protocols - disabled, not shown on dashboard */}
                {[
                  { id: 'dash', label: 'DASH', desc: t('settings.output.multi.dash_desc') },
                  { id: 'mss', label: 'MSS', desc: t('settings.output.multi.mss_desc') },
                  { id: 'rtsp', label: 'RTSP', desc: t('settings.output.multi.rtsp_desc') },
                  { id: 'webrtc', label: 'WebRTC', desc: t('settings.output.multi.webrtc_desc') }
                ].map(proto => (
                  <Grid item xs={12} md={3} sm={6} key={proto.id}>
                    <Tooltip title={proto.desc} arrow>
                      <Box sx={{ p: 1, py: 0.5, bgcolor: 'rgba(255,255,255,0.01)', borderRadius: 2, border: '1px dashed rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.55 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ p: 0.5, bgcolor: 'rgba(255,152,0,0.07)', borderRadius: 1.5, color: 'warning.main' }}>
                            <PlatformIcon fontSize="small" />
                          </Box>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', whiteSpace: 'nowrap' }}>{proto.label}</Typography>
                        </Box>
                        <Switch
                          size="small"
                          checked={settings[`${proto.id}Enabled`] || false}
                          onChange={(e) => setSettings({ ...settings, [`${proto.id}Enabled`]: e.target.checked })}
                          sx={{ '& .MuiSwitch-root': { mr: -1 }, '& .MuiSwitch-switchBase.Mui-checked': { color: 'warning.main' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'warning.main' } }}
                        />
                      </Box>
                    </Tooltip>
                  </Grid>
                ))}
              </Grid>

              {/* Conection Links */}
              <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LanguageIcon fontSize="small" /> {t('settings.output.links.title')}
                </Typography>
                <Grid container spacing={1.5}>
                  {settings.rtmpEnabled && (
                    <Grid item xs={12}>
                      <TextField
                        size="small"
                        fullWidth
                        label={t('settings.output.links.rtmp_label')}
                        value={`rtmp://${window.location.hostname}:1935/stream`}
                        InputProps={{
                          readOnly: true,
                          sx: { fontFamily: 'monospace', fontSize: '0.85rem', bgcolor: 'rgba(0,0,0,0.2)' },
                          endAdornment: (
                            <IconButton onClick={() => handleCopyToClipboard(`rtmp://${window.location.hostname}:1935/stream`, t('settings.output.links.rtmp_copied'))}>
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>
                  )}
                  {settings.srtEnabled && (
                    <Grid item xs={12}>
                      <TextField
                        size="small"
                        fullWidth
                        label={t('settings.output.links.srt_label')}
                        value={`srt://${window.location.hostname}:8890?streamid=read:stream_srt`}
                        helperText={t('settings.output.links.srt_warning')}
                        InputProps={{
                          readOnly: true,
                          sx: { fontFamily: 'monospace', fontSize: '0.85rem', bgcolor: 'rgba(0,0,0,0.2)' },
                          endAdornment: (
                            <IconButton onClick={() => handleCopyToClipboard(`srt://${window.location.hostname}:8890?streamid=read:stream_srt`, t('settings.output.links.srt_copied'))}>
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>
                  )}
                  {settings.udpEnabled && (
                    <Grid item xs={12}>
                      <TextField
                        size="small"
                        fullWidth
                        label={t('settings.output.links.udp_label')}
                        value="udp://@:1234"
                        helperText={t('settings.output.links.udp_tip')}
                        InputProps={{
                          readOnly: true,
                          sx: { fontFamily: 'monospace', fontSize: '0.85rem', bgcolor: 'rgba(0,0,0,0.2)' },
                          endAdornment: (
                            <IconButton onClick={() => handleCopyToClipboard("udp://@:1234", t('settings.output.links.udp_copied'))}>
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>
                  )}
                  {settings.hlsEnabled && (
                    <Grid item xs={12}>
                      <TextField
                        size="small"
                        fullWidth
                        label={t('settings.output.links.hls_label')}
                        value={`http://${window.location.hostname}:3011/hls/stream.m3u8`}
                        InputProps={{
                          readOnly: true,
                          sx: { fontFamily: 'monospace', fontSize: '0.85rem', bgcolor: 'rgba(0,0,0,0.2)' },
                          endAdornment: (
                            <IconButton onClick={() => handleCopyToClipboard(`http://${window.location.hostname}:3011/hls/stream.m3u8`, t('settings.output.links.hls_copied'))}>
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>
                  )}
                  {!settings.rtmpEnabled && !settings.srtEnabled && !settings.hlsEnabled && (
                    <Grid item xs={12}>
                      <Alert severity="info" variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.1)', color: 'text.secondary' }}>
                        {t('settings.output.links.no_protocols')}
                      </Alert>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Paper>
          </TabPanel>

          {/* CATEGORY 1: CAMINHOS & MEDIA (Combined Old 1 & 3) */}
          <TabPanel value={tabValue} index={1}>
            <Paper className="glass-panel" sx={{ p: 1.5, mb: 1.5 }}>
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800, fontSize: '0.9rem' }}>{t('settings.paths.header.title')}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>{t('settings.paths.header.subtitle')}</Typography>
              </Box>

              <Grid container spacing={1.5}>
                {[
                  { label: t('settings.paths.fields.media'), value: settings.mediaPath, key: 'mediaPath', helper: t('settings.paths.helpers.media') },
                  { label: t('settings.paths.fields.thumbnails'), value: settings.thumbnailsPath, key: 'thumbnailsPath', helper: t('settings.paths.helpers.thumbnails') },
                  { label: t('settings.paths.fields.playlists'), value: settings.playlistsPath, key: 'playlistsPath', helper: t('settings.paths.helpers.playlists') },
                  { label: t('settings.paths.fields.fillers'), value: settings.fillersPath, key: 'fillersPath', helper: t('settings.paths.helpers.fillers') },
                  {
                    label: t('settings.paths.fields.logs'),
                    value: settings.logPath,
                    key: 'logPath',
                    helper: t('settings.paths.helpers.logs'),
                    endAdornment: (
                      <IconButton onClick={() => setShowLogsDialog(true)} color="primary" sx={{ bgcolor: 'rgba(0,229,255,0.05)', borderRadius: 2 }}>
                        <HistoryIcon />
                      </IconButton>
                    )
                  },
                  { label: t('settings.paths.fields.protected'), value: settings.protectedPath, key: 'protectedPath', helper: t('settings.paths.helpers.protected') }
                ].map(field => (
                  <Grid item xs={12} md={6} key={field.key}>
                    <TextField
                      size="small"
                      fullWidth
                      label={field.label}
                      value={field.value}
                      onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                      helperText={field.helper}
                      InputProps={{
                        sx: { bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, fontSize: '0.85rem' },
                        endAdornment: field.endAdornment
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* COMPACT STORAGE MGMT SECTION */}
            <Paper className="glass-panel" sx={{ p: 1.5, mb: 2, borderLeft: '4px solid #9c27b0' }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>

                {/* Left Side: Title & Description */}
                <Box sx={{ flex: 1, minWidth: '300px' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'secondary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    {t('settings.storage.header.title')}
                    {proxyStats?.sync_needed && (
                      <Tooltip title={t('settings.storage.header.sync_needed_tooltip', { count: proxyStats.new_files_count || '!' })}>
                        <Chip size="small" color="warning" icon={<WarningIcon sx={{ fontSize: 14 }} />} label={`${proxyStats.new_files_count || ''} ${t('settings.storage.header.sync_needed_label')}`} sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }} />
                      </Tooltip>
                    )}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    {t('settings.storage.header.subtitle')}
                  </Typography>
                </Box>

                {/* Middle: Compact Stats Chips */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2 }}>
                  <Tooltip title={t('settings.storage.stats.db')}>
                    <Chip size="small" label={`DB: ${proxyStats?.db_media_count || 0}`} sx={{ bgcolor: 'rgba(255,255,255,0.05)', fontWeight: 600 }} />
                  </Tooltip>
                  <Tooltip title={t('settings.storage.stats.physical')}>
                    <Chip size="small" label={`DISCO: ${proxyStats?.physical_media_count || 0}`} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)', color: 'primary.main', fontWeight: 600 }} />
                  </Tooltip>
                  <Tooltip title={t('settings.storage.stats.proxies')}>
                    <Chip size="small" label={`PROXIES: ${proxyStats?.proxy_count || 0} (${((proxyStats?.total_bytes || 0) / 1024 / 1024).toFixed(1)}MB)`} sx={{ bgcolor: 'rgba(156, 39, 176, 0.1)', color: 'secondary.main', fontWeight: 600 }} />
                  </Tooltip>
                </Box>

                {/* Right Side: Toolbar Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Tooltip title={t('settings.storage.toolbar.explore')}>
                    <IconButton onClick={() => { fetchProxiesList(); setExplorerOpen(true); }} disabled={proxyStats?.proxy_count === 0 && !syncing} color="secondary" sx={{ bgcolor: 'rgba(156, 39, 176, 0.05)' }}>
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>

                  <Divider orientation="vertical" variant="middle" flexItem sx={{ mx: 1, borderColor: 'rgba(255,255,255,0.1)' }} />

                  <Tooltip title={t('settings.storage.toolbar.sync')}>
                    <span>
                      <IconButton onClick={handleSyncMedia} disabled={syncing} color={proxyStats?.sync_needed ? "warning" : "primary"} sx={{ bgcolor: proxyStats?.sync_needed ? 'rgba(255, 152, 0, 0.1)' : 'rgba(0, 229, 255, 0.05)' }}>
                        {syncing ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
                      </IconButton>
                    </span>
                  </Tooltip>

                  <Tooltip title={t('settings.storage.toolbar.purge')}>
                    <span>
                      <IconButton onClick={handlePurgeProxies} disabled={purgingProxies || proxyStats?.proxy_count === 0} color="error" sx={{ bgcolor: 'rgba(244, 67, 54, 0.05)' }}>
                        {purgingProxies ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>

              </Box>

              {/* Progress Bar (Only visible when doing operations) */}
              {(syncing || purgingProxies) && (
                <LinearProgress color={syncing ? 'primary' : 'error'} sx={{ mt: 2, borderRadius: 2 }} />
              )}
            </Paper>

            <Paper className="glass-panel" sx={{ p: 2, mb: 2 }}>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800, fontSize: '1rem' }}>{t('settings.api.header.title')}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>{t('settings.api.header.subtitle')}</Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<WizardIcon />}
                  onClick={handleApplyDefaults}
                  sx={{ fontWeight: 800, borderRadius: 2 }}
                >
                  {t('settings.api.header.auto_config_btn')}
                </Button>
              </Box>

              <Grid container spacing={2}>
                {[
                  { id: 'tmdb', label: 'TMDB API', key: 'tmdbApiKey' },
                  { id: 'omdb', label: 'OMDB API', key: 'omdbApiKey' },
                  { id: 'tvmaze', label: 'TVMAZE', key: 'tvmazeApiKey' }
                ].map(api => (
                  <Grid item xs={12} key={api.id}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        bgcolor: 'rgba(255,255,255,0.02)',
                        borderColor: 'rgba(255,255,255,0.05)',
                        borderRadius: 3
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 900, minWidth: 100, color: 'primary.main' }}>
                        {api.label}
                      </Typography>

                      <TextField
                        size="small"
                        placeholder={t('settings.api.fields.key_placeholder')}
                        value={settings[api.key] || ''}
                        type={settings[`show_${api.id}`] ? "text" : "password"}
                        onChange={(e) => setSettings({ ...settings, [api.key]: e.target.value })}
                        sx={{ flexGrow: 1 }}
                        InputProps={{
                          sx: { height: 36, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 2, fontSize: '0.75rem' },
                          endAdornment: (
                            <IconButton
                              size="small"
                              onClick={() => setSettings(s => ({ ...s, [`show_${api.id}`]: !s[`show_${api.id}`] }))}
                              sx={{ opacity: 0.7 }}
                            >
                              {settings[`show_${api.id}`] ? <ViewOffIcon sx={{ fontSize: 16 }} /> : <ViewIcon sx={{ fontSize: 16 }} />}
                            </IconButton>
                          )
                        }}
                      />

                      <Stack direction="row" spacing={1}>
                        <Tooltip title={t('settings.api.toolbar.test')}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleTestApi(api.id)}
                            sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)', border: '1px solid rgba(0, 229, 255, 0.2)' }}
                          >
                            <TestIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('settings.api.toolbar.save')}>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={handleSaveSettings}
                            sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.2)' }}
                          >
                            <SaveIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            <Paper className="glass-panel" sx={{ p: 2, mb: 2 }}>
              <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800, fontSize: '1rem' }}>{t('settings.branding.assets.title')}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem', display: 'block', mt: -0.5 }}>{t('settings.branding.assets.subtitle')}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    color="warning"
                    size="small"
                    startIcon={<RestartAltIcon />}
                    onClick={async () => {
                      const defaults = {
                        branding_type: 'video',
                        logo_path: '',
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
                        showSuccess(t('settings.branding.assets.reset_success'));
                        fetchSettings();
                      } catch (e) {
                        showError(t('settings.branding.assets.reset_error'));
                      }
                    }}
                    sx={{ fontWeight: 800, borderRadius: 2, fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                  >
                    {t('settings.branding.assets.reset_btn')}
                  </Button>
                  <Tooltip title={t('settings.branding.assets.restore_defaults_tooltip')} arrow>
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
                          showSuccess(t('settings.branding.assets.restore_success'));
                        } catch (e) { showError(t('settings.branding.assets.restore_error')); }
                      }}
                      sx={{ fontWeight: 800, borderRadius: 2, fontSize: '0.7rem', borderColor: 'rgba(0,229,255,0.2)', color: 'primary.main', whiteSpace: 'nowrap' }}
                    >
                      {t('settings.branding.assets.restore_defaults_btn')}
                    </Button>
                  </Tooltip>
                </Box>
              </Box>

              <Grid container spacing={2}>
                {[
                  {
                    id: 'logo',
                    label: t('settings.branding.assets.logo_label'),
                    path: settings.logoPath,
                    type: settings.branding_type,
                    onSelect: () => { setMediaTypeSelector(settings.branding_type === 'video' ? 'video' : 'image'); setMediaSelectorOpen(true); }
                  },
                  {
                    id: 'image_fb',
                    label: t('settings.branding.assets.image_fallback_label'),
                    path: settings.defaultImagePath,
                    type: 'static',
                    onSelect: () => { setMediaTypeSelector('image'); setMediaSelectorOpen(true); }
                  },
                  {
                    id: 'video_fb',
                    label: t('settings.branding.overlay.fallback_label'),
                    path: settings.defaultVideoPath,
                    type: 'video',
                    onSelect: () => { setMediaTypeSelector('video'); setMediaSelectorOpen(true); }
                  }
                ].map(asset => (
                  <Grid item xs={12} md={4} key={asset.id}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        height: '100%',
                        borderRadius: 4,
                        bgcolor: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.04)', borderColor: 'primary.main' }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="overline" sx={{ fontWeight: 900, color: 'text.secondary', lineHeight: 1.2 }}>
                          {asset.label}
                        </Typography>
                        <Chip
                          label={asset.path ? t('settings.branding.assets.defined') : t('settings.branding.assets.missing')}
                          size="small"
                          color={asset.path ? 'success' : 'warning'}
                          sx={{ height: 16, fontSize: '0.6rem', fontWeight: 900 }}
                        />
                      </Box>

                      <Box
                        sx={{
                          height: 100,
                          bgcolor: 'rgba(0,0,0,0.3)',
                          borderRadius: 2,
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px dashed rgba(255,255,255,0.1)'
                        }}
                      >
                        {asset.path ? (
                          asset.type === 'video' ? (
                            <video src={asset.path} style={{ width: '100%', height: '100%', objectFit: 'contain' }} muted loop onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} />
                          ) : (
                            <img src={asset.path} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          )
                        ) : (
                          <Box sx={{ opacity: 0.2, textAlign: 'center' }}>
                            {asset.type === 'video' ? <MovieIcon sx={{ fontSize: 40 }} /> : <ImageIcon sx={{ fontSize: 40 }} />}
                          </Box>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => {
                            setMediaTypeSelector(asset.id === 'logo' ? (settings.branding_type === 'video' ? 'video' : 'image') : (asset.id === 'video_fb' ? 'video' : 'image'));
                            setMediaSelectorOpen(true);
                          }}
                          sx={{
                            fontWeight: 900,
                            borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.05)',
                            '&:hover': { bgcolor: 'primary.main' }
                          }}
                        >
                          {t('settings.branding.assets.change_btn')}
                        </Button>
                        {asset.id === 'logo' && (
                          <ToggleButtonGroup
                            size="small"
                            value={settings.branding_type || 'static'}
                            exclusive
                            onChange={(e, v) => v && setSettings({ ...settings, branding_type: v })}
                            sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2 }}
                          >
                            <ToggleButton value="static" sx={{ px: 1, py: 0, fontSize: '0.6rem', fontWeight: 800 }}>{t('settings.branding.assets.type_img', 'IMG')}</ToggleButton>
                            <ToggleButton value="video" sx={{ px: 1, py: 0, fontSize: '0.6rem', fontWeight: 800 }}>{t('settings.branding.assets.type_vid', 'VID')}</ToggleButton>
                          </ToggleButtonGroup>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </TabPanel>

          {/* CATEGORY 2: PLAYOUT & PRESETS */}
          <TabPanel value={tabValue} index={2}>
            <Paper className="glass-panel" sx={{ p: 2, mb: 2 }}>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800, fontSize: '1rem' }}>{t('settings.playout.header.title')}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>{t('settings.playout.header.subtitle')}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" startIcon={<WizardIcon />} onClick={() => navigate('/setup')} sx={{ borderRadius: 2, fontWeight: 800 }}>{t('settings.playout.header.wizard_btn')}</Button>
                  <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setResetConfirmOpen(true)} sx={{ borderRadius: 2, fontWeight: 800 }}>{t('settings.playout.header.reset_btn')}</Button>
                </Box>
              </Box>

              <Grid container spacing={2}>
                {[
                  { label: t('settings.playout.fields.day_start'), value: settings.dayStart, type: 'time', key: 'dayStart', tooltip: t('settings.playout.tooltips.day_start') },
                  { label: t('settings.playout.fields.channel_name'), value: settings.channelName, type: 'text', key: 'channelName', tooltip: t('settings.playout.tooltips.channel_name') },
                  { label: t('settings.playout.fields.fps'), value: settings.fps, type: 'number', key: 'fps', tooltip: t('settings.playout.tooltips.fps') },
                  { label: t('settings.playout.fields.encoding_preset'), value: settings.encodingPreset || 'medium', type: 'select', key: 'encodingPreset', options: ['ultrafast', 'veryfast', 'medium', 'slow'], tooltip: t('settings.playout.tooltips.encoding_preset') }
                ].map(item => (
                  <Grid item xs={12} md={6} key={item.key}>
                    <Tooltip title={item.tooltip} arrow placement="top">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(0,0,0,0.2)', p: 1.5, borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
                        <Typography variant="caption" sx={{ fontWeight: 900, minWidth: 100, color: 'text.secondary' }}>{item.label}</Typography>
                        {item.type === 'select' ? (
                          <Select
                            size="small"
                            fullWidth
                            value={item.value}
                            onChange={(e) => setSettings({ ...settings, [item.key]: e.target.value })}
                            sx={{ borderRadius: 2, fontSize: '0.75rem', fontWeight: 800 }}
                          >
                            {item.options.map(opt => <MenuItem key={opt} value={opt}>{opt.toUpperCase()}</MenuItem>)}
                          </Select>
                        ) : (
                          <TextField
                            size="small"
                            fullWidth
                            type={item.type}
                            value={item.value}
                            onChange={(e) => setSettings({ ...settings, [item.key]: e.target.value })}
                            sx={{ '& .MuiInputBase-root': { borderRadius: 2, fontSize: '0.75rem', fontWeight: 800 } }}
                          />
                        )}
                      </Box>
                    </Tooltip>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* EPG CONFIGURATION SECTION */}
            <Paper className="glass-panel" sx={{ p: 4, mb: 4 }}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>{t('settings.playout.epg.title')}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{t('settings.playout.epg.subtitle')}</Typography>
              </Box>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  bgcolor: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 3
                }}
              >
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="overline" sx={{ fontWeight: 900, color: 'primary.main', display: 'block', lineHeight: 1 }}>{t('settings.playout.epg.url_label')}</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', opacity: 0.7, wordBreak: 'break-all' }}>
                    {`${window.location.protocol}//${window.location.host}/api/playlists/epg.xml`}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={t('settings.playout.epg.status_live')} size="small" color="success" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 900 }} />
                  <Tooltip title={t('settings.playout.epg.copy_tooltip')}>
                    <IconButton
                      size="small"
                      onClick={() => handleCopyToClipboard(`${window.location.protocol}//${window.location.host}/api/playlists/epg.xml`, t('settings.playout.epg.copied'))}
                      sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}
                    >
                      <CopyIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={9}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t('settings.playout.epg.refresh_label')}
                    value={settings.epgUrl || t('settings.playout.epg.system_generated')}
                    disabled
                    InputProps={{ sx: { borderRadius: 2, fontSize: '0.75rem', opacity: 0.6 } }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t('settings.playout.epg.days_label')}
                    type="number"
                    value={settings.epgDays}
                    onChange={(e) => setSettings({ ...settings, epgDays: parseInt(e.target.value) || 7 })}
                    InputProps={{ sx: { borderRadius: 2, fontSize: '0.75rem' } }}
                  />
                </Grid>
              </Grid>
            </Paper>

            <Paper className="glass-panel" sx={{ p: 4, mb: 4 }}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>{t('settings.playout.overlay.title')}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{t('settings.playout.overlay.subtitle')}</Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{
                    height: 180,
                    bgcolor: 'rgba(0,0,0,0.4)',
                    borderRadius: 3,
                    border: '1px solid rgba(255,255,255,0.05)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="overline" sx={{ position: 'absolute', top: 8, left: 12, opacity: 0.3, fontWeight: 900 }}>{t('settings.playout.overlay.preview')}</Typography>

                    {/* Simulated Viewport for Watermark placement */}
                    <Box sx={{ width: '80%', height: '80%', border: '1px dashed rgba(255,255,255,0.1)', position: 'relative' }}>
                      {settings.overlay_enabled && (
                        <Box sx={{
                          position: 'absolute',
                          width: 30, height: 30,
                          top: (settings.logoPosition || '').includes('top') ? '5%' : 'auto',
                          bottom: (settings.logoPosition || '').includes('bottom') ? '5%' : 'auto',
                          left: (settings.logoPosition || '').includes('left') ? '5%' : 'auto',
                          right: (settings.logoPosition || '').includes('right') ? '5%' : 'auto',
                          bgcolor: 'primary.main',
                          borderRadius: '50%',
                          boxShadow: '0 0 15px rgba(0, 229, 255, 0.5)',
                          opacity: settings.overlayOpacity || 1,
                          transform: `scale(${settings.overlayScale || 1})`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <ImageIcon sx={{ fontSize: 14, color: '#000' }} />
                        </Box>
                      )}
                      {!settings.overlay_enabled && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800 }}>{t('settings.playout.overlay.disabled')}</Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={8}>
                  <Box sx={{ bgcolor: 'rgba(255,255,255,0.02)', p: 2, borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main' }}>{t('settings.playout.overlay.dpad_label')}</Typography>
                      <Switch
                        size="small"
                        checked={settings.overlay_enabled}
                        onChange={(e) => setSettings({ ...settings, overlay_enabled: e.target.checked })}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {/* D-PAD Grid */}
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.5, bgcolor: 'rgba(0,0,0,0.2)', p: 1, borderRadius: 2 }}>
                        {[
                          { pos: 'top-left', icon: <NwIcon fontSize="small" /> },
                          { pos: 'spacer', icon: null },
                          { pos: 'top-right', icon: <NeIcon fontSize="small" /> },
                          { pos: 'spacer2', icon: <TargetIcon sx={{ fontSize: 10, opacity: 0.2 }} /> },
                          { pos: 'center', icon: <TargetIcon sx={{ fontSize: 14, color: 'primary.main', opacity: 0.5 }} /> },
                          { pos: 'spacer3', icon: <TargetIcon sx={{ fontSize: 10, opacity: 0.2 }} /> },
                          { pos: 'bottom-left', icon: <SwIcon fontSize="small" /> },
                          { pos: 'spacer4', icon: null },
                          { pos: 'bottom-right', icon: <SeIcon fontSize="small" /> }
                        ].map((btn, idx) => (
                          btn.pos.startsWith('spacer') ? (
                            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{btn.icon}</Box>
                          ) : (
                            <IconButton
                              size="small"
                              key={btn.pos}
                              onClick={() => setSettings({ ...settings, logoPosition: btn.pos })}
                              sx={{
                                bgcolor: settings.logoPosition === btn.pos ? 'primary.main' : 'rgba(255,255,255,0.05)',
                                color: settings.logoPosition === btn.pos ? '#000' : 'inherit',
                                '&:hover': { bgcolor: 'primary.dark' },
                                width: 32, height: 32
                              }}
                            >
                              {btn.icon || <TargetIcon sx={{ fontSize: 14 }} />}
                            </IconButton>
                          )
                        ))}
                      </Box>

                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.6rem', display: 'flex', justifyContent: 'space-between' }}>
                            {t('settings.playout.overlay.opacity')} <span>{Math.round((settings.overlayOpacity ?? 0.6) * 100)}%</span>
                          </Typography>
                          <Slider size="small" value={settings.overlayOpacity ?? 0.6} min={0} max={1} step={0.1} onChange={(e, v) => setSettings({ ...settings, overlayOpacity: v })} />
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.6rem', display: 'flex', justifyContent: 'space-between' }}>
                            {t('settings.playout.overlay.scale')} <span>{Math.round((settings.overlayScale ?? 0.6) * 100)}%</span>
                          </Typography>
                          <Slider size="small" value={settings.overlayScale ?? 0.6} min={0.1} max={2.0} step={0.1} onChange={(e, v) => setSettings({ ...settings, overlayScale: v })} />
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('settings.playout.overlay.path_label')}
                  value={settings.logoPath}
                  onChange={(e) => setSettings({ ...settings, logoPath: e.target.value })}
                  InputProps={{ sx: { bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, fontSize: '0.75rem' } }}
                />
                <Button size="small" variant="contained" onClick={() => { setMediaTypeSelector('image'); setMediaSelectorOpen(true); }} sx={{ minWidth: 100, fontWeight: 800 }}>{t('settings.playout.overlay.change_btn')}</Button>
                <Tooltip title={t('settings.playout.overlay.magic_tooltip')}>
                  <IconButton onClick={() => setConverterOpen(true)} sx={{ bgcolor: 'rgba(0,229,255,0.1)', color: 'primary.main', borderRadius: 2 }}><MagicIcon /></IconButton>
                </Tooltip>
              </Box>
            </Paper>

            <Paper className="glass-panel" sx={{ p: 4 }}>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>{t('settings.playout.presets.title')}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{t('settings.playout.presets.subtitle')}</Typography>
                </Box>
                <FormControlLabel
                  control={<Switch size="small" checked={!!settings.advanced_quality} onChange={(e) => setSettings({ ...settings, advanced_quality: e.target.checked })} />}
                  label={<Typography variant="caption" sx={{ fontWeight: 800 }}>{t('settings.playout.presets.advanced_mode')}</Typography>}
                />
              </Box>

              <ToggleButtonGroup
                fullWidth
                value={activePreset}
                exclusive
                onChange={(e, v) => v && applyPreset(v)}
                sx={{ bgcolor: 'rgba(0,0,0,0.2)', p: 0.5, borderRadius: 3, mb: 2 }}
              >
                {[
                  { id: '720p', label: '720p HD', desc: t('settings.playout.presets.list.720p.desc') },
                  { id: '1080p', label: '1080p PRO', desc: t('settings.playout.presets.list.1080p.desc') },
                  { id: '4k', label: '4K ULTRA', desc: t('settings.playout.presets.list.4k.desc') }
                ].map(p => (
                  <ToggleButton key={p.id} value={p.id} sx={{ border: 'none', borderRadius: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{p.label}</Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.5 }}>{p.desc}</Typography>
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>

              {settings.advanced_quality && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <TextField fullWidth size="small" label={t('settings.output.main.bitrate')} value={settings.videoBitrate} onChange={(e) => setSettings({ ...settings, videoBitrate: e.target.value })} InputProps={{ sx: { borderRadius: 2, fontSize: '0.75rem' } }} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth size="small" label={t('settings.output.main.resolution')} value={settings.resolution} onChange={(e) => setSettings({ ...settings, resolution: e.target.value })} InputProps={{ sx: { borderRadius: 2, fontSize: '0.75rem' } }} />
                  </Grid>
                </Grid>
              )}
            </Paper>
          </TabPanel>

          {/* CATEGORY 3: UTILIZADORES & PERFIS */}
          <TabPanel value={tabValue} index={3}>
            <Paper className="glass-panel" sx={{ p: 4 }}>
              <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>{t('settings.users.header.title')}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{t('settings.users.header.subtitle')}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(e, newMode) => newMode && setViewMode(newMode)}
                    size="small"
                    sx={{ height: 36 }}
                  >
                    <ToggleButton value="users" sx={{ fontWeight: 800 }}>{t('settings.users.tabs.users')}</ToggleButton>
                    <ToggleButton value="profiles" sx={{ fontWeight: 800 }}>{t('settings.users.tabs.profiles')}</ToggleButton>
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
                    {viewMode === 'users' ? t('settings.users.header.add_user_btn') : t('settings.users.header.add_profile_btn')}
                  </Button>
                </Box>
              </Box>

              <TableContainer sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                      <TableCell sx={{ fontWeight: 900, color: 'primary.main', fontSize: '0.7rem' }}>{t('settings.users.table.username')}</TableCell>
                      <TableCell sx={{ fontWeight: 900, color: 'primary.main', fontSize: '0.7rem' }}>
                        {viewMode === 'users' ? t('settings.users.table.profile') : t('settings.users.table.description')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 900, color: 'primary.main', fontSize: '0.7rem' }}>{t('settings.users.table.status')}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 900, color: 'primary.main', fontSize: '0.7rem' }}>{t('settings.users.table.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewMode === 'users' ? (
                      Array.isArray(users) && users.map((user) => (
                        <TableRow key={user.id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem', bgcolor: 'primary.main', fontWeight: 800 }}>
                                {user.username[0].toUpperCase()}
                              </Avatar>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.85rem' }}>{user.username.toUpperCase()}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={user.profile_name?.toUpperCase() || profiles.find(p => p.id === user.profile_id)?.name?.toUpperCase() || (user.role || 'USER').toUpperCase()}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, borderColor: 'rgba(255,255,255,0.2)' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Switch checked size="small" disabled sx={{ opacity: 0.5 }} />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Tooltip title={t('settings.users.tooltips.change_password')}>
                                <IconButton size="small" onClick={() => handleOpenPasswordDialog(user)} sx={{ color: 'primary.main' }}>
                                  <MagicIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                              {user.username !== 'admin' && (
                                <Tooltip title={t('settings.users.tooltips.delete_user')}>
                                  <IconButton size="small" onClick={() => handleDeleteUser(user.id)} color="error">
                                    <DeleteIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      Array.isArray(profiles) && profiles.map((profile) => (
                        <TableRow key={profile.id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.main' }}>
                                <SettingsIcon sx={{ fontSize: 16 }} />
                              </Avatar>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.85rem' }}>{profile.name.toUpperCase()}</Typography>
                              {profile.is_system && <Chip label={t('settings.users.table.system_badge')} color="info" size="small" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 900 }} />}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.65rem', fontWeight: 600 }}>
                              {t('settings.users.table.permissions')}: {(profile.permissions || []).join(', ').toUpperCase()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={t('settings.users.table.active')} size="small" color="success" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 900, bgcolor: 'rgba(76,175,80,0.1)' }} />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Tooltip title={t('settings.users.tooltips.edit_profile')}>
                                <IconButton size="small" onClick={() => { setCurrentProfile(profile); setProfileDialogOpen(true); }}>
                                  <EditIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                              {!profile.is_system && (
                                <Tooltip title={t('settings.users.tooltips.delete_profile')}>
                                  <IconButton size="small" onClick={() => handleDeleteProfile(profile.id)} color="error">
                                    <DeleteIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </TabPanel>

          {/* CATEGORY 4: SOBRE O SISTEMA */}
          <TabPanel value={tabValue} index={4}>
            <Paper className="glass-panel" sx={{ p: 2, mb: 2 }}>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800, fontSize: '0.9rem' }}>{t('settings.about.header.title')}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>{t('settings.about.header.subtitle')}</Typography>
              </Box>
              <Grid container spacing={1.5}>
                {[
                  { label: t('settings.about.fields.version'), value: settings.system_version || settings.version || APP_VERSION_FALLBACK, icon: <WizardIcon fontSize="small" /> },
                  { label: t('settings.about.fields.last_update'), value: settings.release_date || settings.releaseDate || APP_RELEASE_DATE_FALLBACK, icon: <CheckIcon fontSize="small" /> },
                  { label: t('settings.about.fields.deployment'), value: 'Docker Container (Linux)', icon: <FolderIcon fontSize="small" /> }
                ].map((item, id) => (
                  <Grid item xs={12} sm={6} md={4} key={id}>
                    <Box sx={{ p: 1, py: 0.5, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ color: 'primary.main', display: 'flex' }}>
                        {item.icon}
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.55rem', opacity: 0.8, display: 'block' }}>{item.label}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.75rem', mt: -0.5 }}>{item.value}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {/* ROADMAP & FUTURE section integrated here for visibility */}
              <Box sx={{ mt: 3, mb: 1 }}>
                <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1, fontSize: '0.6rem' }}>{t('settings.about.roadmap.highlight_title')}</Typography>
                <Grid container spacing={1} sx={{ mt: 0.5 }}>
                  {[
                    { label: t('settings.about.roadmap.idioma.title'), value: t('settings.about.roadmap.idioma.value'), icon: <LanguageIcon fontSize="small" /> },
                    { label: t('settings.about.roadmap.canal.title'), value: t('settings.about.roadmap.canal.value'), icon: <PlatformIcon fontSize="small" /> },
                    { label: t('settings.about.roadmap.latency.title'), value: t('settings.about.roadmap.latency.value'), icon: <ScalabilityIcon fontSize="small" /> }
                  ].map((item, id) => (
                    <Grid item xs={12} sm={4} key={id}>
                      <Box sx={{ p: 1, py: 0.5, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(0,229,255,0.03)', borderRadius: 2, border: '1px solid rgba(0,229,255,0.08)' }}>
                        <Box sx={{ color: 'primary.main', display: 'flex' }}>{item.icon}</Box>
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', fontSize: '0.55rem', opacity: 0.6 }}>{item.label}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.7rem', mt: -0.5 }}>{item.value}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    const targetRef = settings.version?.includes('ALPHA') ? 'alpha' : (settings.version || 'main');
                    window.open(`https://github.com/ideiasestrondosas-ctrl/cloud-onepa-playout/tree/${targetRef}`, '_blank');
                  }}
                  sx={{ borderRadius: 2, fontWeight: 800, py: 0.2 }}
                >
                  {t('settings.about.roadmap.github_btn')}
                </Button>
              </Box>
            </Paper>

            <Paper className="glass-panel" sx={{ p: 2 }}>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800, fontSize: '0.9rem' }}>{t('settings.about.history.title')}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>{t('settings.about.history.subtitle')}</Typography>
              </Box>
              <Box sx={{ maxHeight: '65vh', overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-track': { bgcolor: 'rgba(255,255,255,0.02)' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,229,255,0.3)', borderRadius: 3 } }}>
                <List sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {releaseHistory.length > 0 ? releaseHistory.map((release, idx) => (
                    <ListItem key={idx} sx={{ display: 'block', p: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '0.8rem' }}>{release.version.startsWith('v') ? release.version : 'v' + release.version}</Typography>
                        <Divider sx={{ flexGrow: 1, opacity: 0.1 }} />
                        <Typography variant="caption" sx={{ opacity: 0.5, fontSize: '0.65rem' }}>{release.date}</Typography>
                      </Box>
                      <Box sx={{ pl: 2, borderLeft: '2px solid rgba(0,229,255,0.2)' }}>
                        {release.changes.map((change, cIdx) => (
                          <Typography key={cIdx} variant="caption" sx={{ mb: 0.2, opacity: 0.8, display: 'flex', alignItems: 'flex-start', gap: 1, fontSize: '0.7rem', lineHeight: 1.2 }}>
                            <Box sx={{ width: 4, height: 4, bgcolor: 'primary.main', borderRadius: '50%', mt: 0.6, flexShrink: 0 }} /> {change}
                          </Typography>
                        ))}
                      </Box>
                    </ListItem>
                  )) : (
                    <Typography variant="body2" sx={{ opacity: 0.5, textAlign: 'center', py: 4 }}>{t('settings.about.history.empty')}</Typography>
                  )}
                </List>
              </Box>
            </Paper>

            {/* ROADMAP & FUTURO Section — Added as per ALPHA-22 update */}
            <Paper className="glass-panel" sx={{ p: 4, mt: 4 }}>
              <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>{t('settings.about.roadmap.title')}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{t('settings.about.roadmap.subtitle')}</Typography>
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
                                  color: bullet.done ? 'inherit' : 'rgba(255,255,255,0.7)',
                                },
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
      <Drawer
        anchor="right"
        open={userDialogOpen}
        onClose={() => setUserDialogOpen(false)}
        PaperProps={{
          sx: {
            width: 400,
            bgcolor: 'rgba(10, 15, 20, 0.95)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(255,255,255,0.1)',
            backgroundImage: 'none',
            p: 4
          }
        }}
      >
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>{t('settings.users.dialogs.add_user.title')}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{t('settings.users.dialogs.add_user.subtitle')}</Typography>
          </Box>
          <IconButton onClick={() => setUserDialogOpen(false)} size="small" sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Stack spacing={3}>
          <TextField
            fullWidth label={t('settings.users.dialogs.add_user.username_label')}
            value={newUser.username}
            placeholder="ex: operador_01"
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            InputProps={{ sx: { borderRadius: 3, bgcolor: 'rgba(0,0,0,0.2)' } }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth label={t('settings.users.dialogs.add_user.password_label')} type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            InputProps={{ sx: { borderRadius: 3, bgcolor: 'rgba(0,0,0,0.2)' } }}
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth>
            <InputLabel shrink sx={{ color: 'primary.main', fontWeight: 800 }}>{t('settings.users.dialogs.add_user.profile_label')}</InputLabel>
            <Select
              value={newUser.profile_id}
              onChange={(e) => setNewUser({ ...newUser, profile_id: e.target.value })}
              sx={{ borderRadius: 3, bgcolor: 'rgba(0,0,0,0.2)' }}
              notched
            >
              {profiles.map(p => (
                <MenuItem key={p.id} value={p.id} sx={{ py: 1.5 }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{p.name.toUpperCase()}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.5 }}>{p.permissions?.join(', ')}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Box sx={{ mt: 'auto', pt: 4, display: 'flex', gap: 2 }}>
          <Button fullWidth onClick={() => setUserDialogOpen(false)} sx={{ fontWeight: 800 }}>{t('common.cancel')}</Button>
          <Button fullWidth variant="contained" onClick={handleAddUser} sx={{ borderRadius: 3, fontWeight: 900, py: 1.5 }}>{t('common.save')}</Button>
        </Box>
      </Drawer>

      {/* Change Password Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ className: 'glass-panel', sx: { backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'primary.main' }}>{t('settings.users.dialogs.change_password.title', { username: selectedUser?.username?.toUpperCase() })}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label={t('settings.users.dialogs.change_password.new_password_label')} type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mt: 2 }}
            InputProps={{ sx: { borderRadius: 3 } }}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setPasswordDialogOpen(false)} sx={{ fontWeight: 800 }}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleChangePassword} sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}>{t('settings.users.dialogs.change_password.update_btn')}</Button>
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
            <WizardIcon /> {t('settings.about.history.dialog_title')}
          </Box>
          <Typography variant="caption" sx={{ opacity: 0.5 }}>{settings.system_version || 'v2.2.0-ALPHA.35-PRO'}</Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <List sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {releaseHistory.map((release, index) => (
              <Box key={release.version}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    {t('settings.about.history.version_label')} {release.version}
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
          <Button variant="contained" onClick={() => setReleaseNotesOpen(false)} sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}>{t('settings.about.history.close_btn')}</Button>
        </DialogActions>
      </Dialog>
      {/* Profile Dialog */}
      <Drawer
        anchor="right"
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        PaperProps={{
          sx: {
            width: 400,
            bgcolor: 'rgba(10, 15, 20, 0.95)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(255,255,255,0.1)',
            backgroundImage: 'none',
            p: 4
          }
        }}
      >
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>
              {currentProfile.id ? t('settings.users.dialogs.profile.edit_title') : t('settings.users.dialogs.profile.new_title')}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{t('settings.users.dialogs.profile.subtitle')}</Typography>
          </Box>
          <IconButton onClick={() => setProfileDialogOpen(false)} size="small" sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Stack spacing={3}>
          <TextField
            fullWidth label={t('settings.users.dialogs.profile.name_label')}
            value={currentProfile.name}
            onChange={(e) => setCurrentProfile({ ...currentProfile, name: e.target.value })}
            InputProps={{ sx: { borderRadius: 3, bgcolor: 'rgba(0,0,0,0.2)' }, readOnly: currentProfile.is_system }}
            InputLabelProps={{ shrink: true }}
            helperText={currentProfile.is_system ? t('settings.users.dialogs.profile.system_rename_warning') : ""}
          />

          <FormControl fullWidth>
            <InputLabel shrink sx={{ color: 'secondary.main', fontWeight: 800 }}>{t('settings.users.dialogs.profile.permissions_label')}</InputLabel>
            <Select
              multiple
              value={currentProfile.permissions || []}
              onChange={(e) => setCurrentProfile({ ...currentProfile, permissions: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
              sx={{ borderRadius: 3, bgcolor: 'rgba(0,0,0,0.2)' }}
              notched
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value.toUpperCase()} size="small" sx={{ height: 20, fontWeight: 800, bgcolor: 'rgba(255,255,255,0.1)' }} />
                  ))}
                </Box>
              )}
            >
              {['read', 'write', 'delete', 'execute', 'admin'].map(perm => (
                <MenuItem key={perm} value={perm} sx={{ px: 2, py: 1 }}>
                  <Checkbox checked={(currentProfile.permissions || []).indexOf(perm) > -1} size="small" />
                  <ListItemText primary={perm.toUpperCase()} primaryTypographyProps={{ sx: { fontWeight: 700, fontSize: '0.8rem' } }} />
                </MenuItem>
              ))}
            </Select>
            <Typography variant="caption" sx={{ mt: 1, opacity: 0.5, px: 1 }}>
              {t('settings.users.dialogs.profile.permissions_help')}
            </Typography>
          </FormControl>
        </Stack>

        <Box sx={{ mt: 'auto', pt: 4, display: 'flex', gap: 2 }}>
          <Button fullWidth onClick={() => setProfileDialogOpen(false)} sx={{ fontWeight: 800 }}>{t('common.cancel')}</Button>
          <Button fullWidth variant="contained" color="secondary" onClick={handleSaveProfile} sx={{ borderRadius: 3, fontWeight: 900, py: 1.5 }}>
            {currentProfile.id ? t('settings.users.dialogs.profile.update_btn') : t('settings.users.dialogs.profile.create_btn')}
          </Button>
        </Box>
      </Drawer>

      {/* Auto-Config Dialog */}
      <Dialog
        open={autoConfigOpen}
        onClose={() => setAutoConfigOpen(false)}
        PaperProps={{ className: 'glass-panel', sx: { backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <MagicIcon /> {t('settings.api.dialogs.auto_config.title')}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {t('settings.api.dialogs.auto_config.desc')}
          </Typography>
          <List dense>
            <ListItem><ListItemText primary="• CineOne Database (TMDB)" /></ListItem>
            <ListItem><ListItemText primary="• Open Movie Database (OMDB)" /></ListItem>
            <ListItem><ListItemText primary="• TVMaze Metadata" /></ListItem>
          </List>
          <Alert severity="warning" sx={{ mt: 1 }}>
            {t('settings.api.dialogs.auto_config.warning')}
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAutoConfigOpen(false)} sx={{ fontWeight: 800 }}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={confirmApplyDefaults} sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}>
            {t('common.confirm')}
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
          <Button onClick={() => setPreviewOpen(false)} sx={{ color: '#fff' }}>{t('common.close')}</Button>
          {previewAsset && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setDefaultMedia(previewAsset.is_video ? 'video' : 'image', previewAsset.path);
                setPreviewOpen(false);
              }}
            >
              {t('settings.branding.dialogs.preview.set_default_btn')}
            </Button>
          )}
        </DialogActions>
      </Dialog>
      {/* Factory Reset Confirmation Dialog */}
      <Dialog open={resetConfirmOpen} onClose={() => setResetConfirmOpen(false)}>
        <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon /> {t('settings.playout.dialogs.reset.title')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            {t('settings.playout.dialogs.reset.warning1')}
          </Typography>
          <Typography variant="body2" color="error" sx={{ fontWeight: 'bold' }}>
            {t('settings.playout.dialogs.reset.warning2')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetConfirmOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            color="error"
            autoFocus
            onClick={async () => {
              try {
                setSaving(true);
                await settingsAPI.resetAll();
                showSuccess(t('settings.playout.dialogs.reset.success'));
                setResetConfirmOpen(false);
                fetchSettings(); // Refresh to see defaults
              } catch (error) {
                showError(t('settings.playout.dialogs.reset.error'));
              } finally {
                setSaving(false);
              }
            }}
          >
            {t('settings.playout.dialogs.reset.confirm_btn')}
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
          showSuccess(t('settings.notifications.udp_ready'));
        }}
      />

      {/* Quality Preset Confirmation Dialog */}
      <Dialog
        open={!!pendingPreset}
        onClose={() => setPendingPreset(null)}
        PaperProps={{ className: 'glass-panel', sx: { backgroundImage: 'none', border: '1px solid rgba(255, 152, 0, 0.3)' } }}
      >
        <DialogTitle sx={{ color: 'warning.main', display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800 }}>
          <WarningIcon /> {t('settings.playout.dialogs.presets.title')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {t('settings.playout.dialogs.presets.desc')} <strong style={{ color: '#00e5ff' }}>{pendingPreset?.title}</strong>:
          </Typography>
          <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 2, fontFamily: 'monospace', fontSize: '0.85rem', mb: 2 }}>
            <div>{t('settings.playout.dialogs.presets.resolution_label')}: <strong>{pendingPreset?.res}</strong></div>
            <div>{t('settings.playout.dialogs.presets.bitrate_label')}: <strong>{pendingPreset?.bitrate}k</strong></div>
            <div>{t('settings.playout.dialogs.presets.fps_label')}: <strong>{pendingPreset?.fps}</strong></div>
          </Box>
          <Alert severity="warning" sx={{ fontSize: '0.8rem' }}>
            {t('settings.playout.dialogs.presets.restart_warning')}
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPendingPreset(null)} sx={{ fontWeight: 800 }}>{t('common.cancel')}</Button>
          <Button variant="contained" color="warning" onClick={confirmApplyPreset} sx={{ fontWeight: 800, px: 4 }}>
            {t('settings.playout.dialogs.presets.apply_btn')}
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
        <DialogTitle sx={{ fontWeight: 800, color: 'primary.main', pb: 1, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon /> {t('settings.logs.dialog.title')}
              {isRefreshingLogs && <CircularProgress size={14} sx={{ ml: 1 }} />}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={t('settings.logs.rotation.tooltip')} arrow>
                <Button size="small" variant="outlined" startIcon={<SettingsIcon />} onClick={() => setShowLogRotationConfig(v => !v)} sx={{ fontWeight: 800, fontSize: '0.65rem' }}>{t('settings.logs.rotation.btn')}</Button>
              </Tooltip>
              <Tooltip title={t('settings.logs.export.tooltip')} arrow>
                <Button size="small" variant="outlined" startIcon={<SaveIcon />} onClick={() => {
                  const filtered = logs.filter(l => logFilter === 'ALL' || l.includes(logFilter)).filter(l => !logSearch || l.toLowerCase().includes(logSearch.toLowerCase()));
                  const blob = new Blob([filtered.join('\n')], { type: 'text/plain' });
                  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `playout_logs_${new Date().toISOString().slice(0, 10)}.txt`; a.click();
                }} sx={{ fontWeight: 800, fontSize: '0.65rem' }}>{t('settings.logs.export.btn')}</Button>
              </Tooltip>
              <Button size="small" onClick={fetchLogs} startIcon={<RefreshIcon />} sx={{ fontWeight: 800, fontSize: '0.65rem' }}>{t('common.refresh')}</Button>
              <IconButton onClick={() => setShowLogsDialog(false)} size="small" sx={{ color: 'text.disabled' }}><AddIcon sx={{ transform: 'rotate(45deg)' }} /></IconButton>
            </Box>
          </Box>

          <Tabs value={logTab} onChange={(e, v) => setLogTab(v)} sx={{ minHeight: 32, '& .MuiTab-root': { py: 0, minHeight: 32, fontSize: '0.7rem', fontWeight: 800 } }}>
            <Tab label={t('settings.logs.tabs.playout')} />
            <Tab label={`${t('settings.logs.tabs.system')} (${vmLogSections.length})`} />
          </Tabs>

          {showLogRotationConfig && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255,152,0,0.06)', borderRadius: 3, border: '1px solid rgba(255,152,0,0.15)' }}>
              <Typography variant="overline" sx={{ color: 'warning.main', fontWeight: 800, display: 'block', mb: 2 }}>{t('settings.logs.rotation.header')}</Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={6} md={3}>
                  <TextField size="small" label={t('settings.logs.rotation.fields.max_size')} type="number" value={logRotationSettings.maxSizeMb} onChange={e => setLogRotationSettings(p => ({ ...p, maxSizeMb: parseInt(e.target.value) || 50 }))} InputProps={{ sx: { bgcolor: 'rgba(0,0,0,0.3)', fontFamily: 'monospace' } }} fullWidth />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField size="small" label={t('settings.logs.rotation.fields.max_files')} type="number" value={logRotationSettings.maxFiles} onChange={e => setLogRotationSettings(p => ({ ...p, maxFiles: parseInt(e.target.value) || 5 }))} InputProps={{ sx: { bgcolor: 'rgba(0,0,0,0.3)', fontFamily: 'monospace' } }} fullWidth />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField size="small" label={t('settings.logs.rotation.fields.retention')} type="number" value={logRotationSettings.retentionDays} onChange={e => setLogRotationSettings(p => ({ ...p, retentionDays: parseInt(e.target.value) || 30 }))} InputProps={{ sx: { bgcolor: 'rgba(0,0,0,0.3)', fontFamily: 'monospace' } }} fullWidth />
                </Grid>
                <Grid item xs={6} md={3}>
                  <FormControlLabel control={<Switch checked={logRotationSettings.compressOld} onChange={e => setLogRotationSettings(p => ({ ...p, compressOld: e.target.checked }))} size="small" sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: 'warning.main' } }} />} label={<Typography variant="caption" sx={{ fontWeight: 800 }}>{t('settings.logs.rotation.fields.compress')}</Typography>} />
                </Grid>
              </Grid>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button size="small" variant="contained" color="warning" onClick={async () => {
                  try {
                    await settingsAPI.update({ log_max_size_mb: logRotationSettings.maxSizeMb, log_max_files: logRotationSettings.maxFiles, log_compress_old: logRotationSettings.compressOld, log_retention_days: logRotationSettings.retentionDays });
                    showSuccess(t('settings.logs.rotation.save_success'));
                  } catch (e) { showError(t('settings.logs.rotation.save_error')); }
                }} sx={{ fontWeight: 800, fontSize: '0.65rem' }}>{t('settings.logs.rotation.save_btn')}</Button>
                <Button size="small" variant="outlined" color="error" onClick={async () => {
                  if (!window.confirm(t('settings.logs.rotation.force_confirm'))) return;
                  try {
                    await fetch('/api/logs/rotate', { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
                    showSuccess(t('settings.logs.rotation.force_success')); fetchLogs();
                  } catch (e) { showError(t('settings.logs.rotation.force_error')); }
                }} sx={{ fontWeight: 800, fontSize: '0.65rem' }}>{t('settings.logs.rotation.force_btn')}</Button>
              </Box>
            </Box>
          )}

          <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <ToggleButtonGroup value={logFilter} exclusive onChange={(e, v) => v && setLogFilter(v)} size="small">
              {['ALL', 'INFO', 'WARN', 'ERROR'].map(f => (
                <ToggleButton key={f} value={f} sx={{ fontWeight: 800, fontSize: '0.65rem', color: f === 'ERROR' ? 'error.main' : f === 'WARN' ? 'warning.main' : f === 'INFO' ? 'success.main' : 'text.primary', '&.Mui-selected': { bgcolor: f === 'ERROR' ? 'rgba(244,67,54,0.15)' : f === 'WARN' ? 'rgba(255,152,0,0.15)' : f === 'INFO' ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.08)' } }}>
                  {f}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <TextField size="small" placeholder={t('settings.logs.search_placeholder')} value={logSearch} onChange={e => setLogSearch(e.target.value)} sx={{ flexGrow: 1 }} InputProps={{ sx: { bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 2, fontSize: '0.75rem', fontFamily: 'monospace' } }} />
            <Typography variant="caption" sx={{ opacity: 0.5, whiteSpace: 'nowrap' }}>
              {logs.filter(l => logFilter === 'ALL' || l.includes(logFilter)).filter(l => !logSearch || l.toLowerCase().includes(logSearch.toLowerCase())).length} {t('settings.logs.lines_count')}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.05)', p: 0, flexGrow: 1, overflow: 'hidden' }}>
          <Box sx={{ p: 0, bgcolor: '#000', height: '100%', overflowY: 'auto', fontFamily: '"JetBrains Mono","Roboto Mono",monospace', fontSize: '0.75rem' }}>
            {logTab === 0 ? (
              <Box sx={{ p: 2 }}>
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
                      {logFilter !== 'ALL' || logSearch ? t('settings.logs.empty_filters') : t('settings.logs.waiting')}
                    </Box>
                  );
                })()}
              </Box>
            ) : (
              <Box sx={{ p: 0 }}>
                {vmLogMessage && (
                  <Alert severity="info" variant="filled" sx={{ m: 2, borderRadius: 2, bgcolor: 'rgba(0,188,212,0.2)', border: '1px solid rgba(0,188,212,0.3)' }}>
                    <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700 }}>{vmLogMessage}</Typography>
                  </Alert>
                )}

                {vmLogSections.map((section, sidx) => (
                  <Box key={sidx} sx={{ mb: 4 }}>
                    <Box sx={{ p: 1, px: 2, bgcolor: 'rgba(25, 118, 210, 0.2)', borderBottom: '1px solid rgba(25, 118, 210, 0.3)', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BugIcon sx={{ fontSize: 16, color: 'primary.light' }} />
                      <Typography variant="overline" sx={{ fontWeight: 900, color: 'primary.light', letterSpacing: 1 }}>
                        {t('settings.logs.system.source_label')}: {section.source}
                      </Typography>
                    </Box>
                    <Box sx={{ p: 2 }}>
                      {section.lines.length > 0 ? section.lines.map((line, lidx) => (
                        <Typography key={lidx} component="div" sx={{
                          color: (line.toLowerCase().includes('err') || line.toLowerCase().includes('fail') || line.toLowerCase().includes('crit')) ? '#ff5252' :
                            (line.toLowerCase().includes('warn')) ? '#ffd740' : 'rgba(255,255,255,0.7)',
                          whiteSpace: 'pre-wrap', mb: 0.3, lineHeight: 1.4, fontSize: '0.7rem',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                        }}>
                          {line}
                        </Typography>
                      )) : (
                        <Typography variant="caption" sx={{ opacity: 0.3, fontStyle: 'italic', pl: 2 }}>{t('settings.logs.system.empty_source')}</Typography>
                      )}
                    </Box>
                  </Box>
                ))}

                {vmLogSections.length === 0 && !vmLogMessage && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, opacity: 0.3 }}>
                    {t('settings.logs.system.none_detected')}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ opacity: 0.4, fontFamily: 'monospace', fontSize: '0.65rem' }}>
            📂 {settings.logPath || '/var/log/onepa/playout.log'} · {t('settings.logs.rotation.btn')}: {logRotationSettings.maxSizeMb}MB / {logRotationSettings.maxFiles} {t('settings.logs.footer.files')} · {logRotationSettings.compressOld ? `🗜 ${t('settings.logs.footer.compress_on')}` : `🗜 ${t('settings.logs.footer.compress_off')}`} · {t('settings.logs.rotation.fields.retention').split(' (')[0]}: {logRotationSettings.retentionDays} {t('settings.logs.footer.days')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setShowLogsDialog(false)} sx={{ fontWeight: 800 }}>{t('common.close')}</Button>
            <Button variant="outlined" color="warning" onClick={handleRetryPlayout} sx={{ fontWeight: 800 }}>{t('settings.logs.footer.restart_btn')}</Button>
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
            <Typography variant="h6" sx={{ fontWeight: 800 }}>{t('settings.storage.explorer.title')}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>{t('settings.storage.explorer.subtitle')}</Typography>
          </Box>
          <IconButton onClick={() => setExplorerOpen(false)} sx={{ color: 'text.secondary' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.05)', p: 0 }}>
          <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              {selectedProxyIds.length} {t('settings.storage.explorer.selected_count')}
              {selectedProxyIds.length > 0 && ` (${(proxiesList.filter(p => selectedProxyIds.includes(p.id)).reduce((acc, curr) => acc + curr.size_bytes, 0) / 1024 / 1024).toFixed(2)} MB ${t('settings.storage.explorer.mb_to_free')})`}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                onClick={() => setSelectedProxyIds(selectedProxyIds.length === proxiesList.length ? [] : proxiesList.map(p => p.id))}
              >
                {selectedProxyIds.length === proxiesList.length ? t('common.deselect_all') : t('common.select_all')}
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                disabled={selectedProxyIds.length === 0}
                onClick={() => setDeleteConfirmOpen(true)}
                startIcon={<DeleteIcon />}
              >
                {t('settings.storage.explorer.delete_btn')}
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
                    primaryTypographyProps={{
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: proxy.exists ? 'inherit' : 'warning.main'
                    }}
                    secondary={proxy.exists ?
                      `${(proxy.size_bytes / 1024 / 1024).toFixed(2)} MB • ${new Date(proxy.created_at).toLocaleString()}` :
                      `⚠️ ${t('settings.storage.explorer.proxy_missing')}`
                    }
                    secondaryTypographyProps={{ fontSize: '0.7rem' }}
                  />
                  {!proxy.exists && proxy.media_id && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="warning"
                      sx={{ fontSize: '0.6rem', fontWeight: 900 }}
                      onClick={() => mediaAPI.generateProxy(proxy.media_id).then(() => {
                        showSuccess(t('settings.storage.explorer.generate_success'));
                        fetchProxiesList();
                      })}
                    >
                      {t('settings.storage.explorer.generate_btn')}
                    </Button>
                  )}
                </ListItem>
              ))}
              {proxiesList.length === 0 && (
                <Box sx={{ p: 4, textAlign: 'center', opacity: 0.5 }}>
                  {t('settings.storage.explorer.empty')}
                </Box>
              )}
            </List>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setExplorerOpen(false)} sx={{ fontWeight: 800 }}>{t('common.exit')}</Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{ className: "glass-panel", sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'error.main' }}>{t('settings.storage.dialogs.delete_proxies.title')}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {t('settings.storage.dialogs.delete_proxies.warning1', { count: selectedProxyIds.length })}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
            {t('settings.storage.dialogs.delete_proxies.space_label')} <strong>{(proxiesList.filter(p => selectedProxyIds.includes(p.id)).reduce((acc, curr) => acc + curr.size_bytes, 0) / 1024 / 1024).toFixed(2)} MB</strong>
          </Typography>
          <Box sx={{ p: 1.5, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 2, maxHeight: '150px', overflowY: 'auto' }}>
            {proxiesList.filter(p => selectedProxyIds.includes(p.id)).map(p => (
              <Typography key={p.id} variant="caption" sx={{ display: 'block', opacity: 0.6 }}>• {p.filename}</Typography>
            ))}
          </Box>
          <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 2, fontWeight: 700 }}>
            {t('settings.storage.dialogs.delete_proxies.warning2')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ fontWeight: 800 }}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteSelectedProxies}
            disabled={purgingProxies}
            sx={{ fontWeight: 800 }}
          >
            {purgingProxies ? <CircularProgress size={20} color="inherit" /> : t('settings.storage.dialogs.delete_proxies.confirm_btn')}
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

