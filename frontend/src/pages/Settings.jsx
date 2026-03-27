import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactPlayer from 'react-player';
import axios from 'axios';
import { useNotification } from '../contexts/NotificationContext';
import { authAPI, settingsAPI, protectedAPI, playoutAPI, mediaAPI, channelSettingsAPI, userChannelAPI, channelsAPI } from '../services/api';
import { useChannel } from '../contexts/ChannelContext';
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
  Edit as EditIcon,
  Layers as LayersIcon
} from '@mui/icons-material';

// --- Lazy Loaded Tabs for RAM Optimization ---
const OutputTab = lazy(() => import('./Settings/OutputTab'));
const PathsTab = lazy(() => import('./Settings/PathsTab'));
const PlayoutTab = lazy(() => import('./Settings/PlayoutTab'));
const UsersTab = lazy(() => import('./Settings/UsersTab'));
const AboutTab = lazy(() => import('./Settings/AboutTab'));

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
  const { activeChannelId, channels } = useChannel();
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
  // Phase 2 — user-channel access
  const [channelAccessOpen, setChannelAccessOpen] = useState(false);
  const [channelAccessUser, setChannelAccessUser] = useState(null);
  const [channelAccessIds, setChannelAccessIds] = useState([]); // selected channel IDs for dialog
  const [allChannels, setAllChannels] = useState([]);
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

      // Phase 4: Merge channel-specific overrides if activeChannelId exists
      if (activeChannelId) {
        try {
          const overridesRes = await channelSettingsAPI.get(activeChannelId);
          console.log('[Settings] Loaded channel overrides:', overridesRes.data);
          Object.assign(data, overridesRes.data);
        } catch (err) {
          console.warn('[Settings] Failed to fetch channel overrides:', err);
        }
      }

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
        version: data.system_version || APP_VERSION_FALLBACK,
        releaseDate: data.release_date || APP_RELEASE_DATE_FALLBACK,
        overlay_enabled: data.overlay_enabled ?? true,
        channelName: data.channel_name || 'Cloud Onepa',
        branding_type: brandingType,
        overlayOpacity: data.overlay_opacity ?? 1.0,
        overlayScale: data.overlay_scale ?? 1.0,
        srtMode: data.srt_mode || 'caller',
        protectedPath: data.protected_path || '/var/lib/onepa-playout/assets/protected',
        docsPath: data.docs_path || '/app/docs',
        system_version: data.system_version || APP_VERSION_FALLBACK,
        release_date: data.release_date || APP_RELEASE_DATE_FALLBACK,
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
  }, [showError, activeChannelId]);

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
      version: 'v2.3.0-ALPHA.39',
      title: 'ENTERPRISE FOUNDATION',
      focus: 'Arquitetura multi-canal, Redis e WebSocket em tempo real',
      icon: <EnterpriseIcon />,
      color: '#4caf50',
      done: true,
      items: [
        { text: 'Multi-Canal Core: Tabela channels com isolamento multi-tenant por canal', done: true },
        { text: 'Redis Event Bus: Sistema de pub/sub para eventos de playout em tempo real', done: true },
        { text: 'WebSocket Events: Endpoint /api/v2/events com stream de dados ao vivo', done: true },
        { text: 'Audit Logs: Registo completo de ações de utilizadores com IP e recurso', done: true },
        { text: 'As-Run Logs: Logs de exibição automatizados (Proof-of-Play) por canal', done: true },
        { text: 'Schema SCTE-35: Suporte para marcadores de inserção de anúncios no DB', done: true }
      ]
    },
    {
      phase: 'Phase 26',
      version: 'v2.3.0-ALPHA.40/41',
      title: 'FRONTEND TRANSFORMATION',
      focus: 'Dashboard responsivo, temas dinâmicos e editor de gráficos',
      icon: <GraphicsIcon />,
      color: '#e91e63',
      done: true,
      items: [
        { text: 'Theme Engine: Motor de temas por utilizador com CSS variables dinâmicas', done: true },
        { text: 'Mobile Responsive Layout: MUI Drawer adaptativo para mobile e desktop', done: true },
        { text: 'Analytics em Tempo Real: Dashboard WebSocket com gráficos Recharts', done: true },
        { text: 'Drag-and-Drop Editor: Editor WYSIWYG para templates HTML5 de gráficos', done: true },
        { text: 'Consolidação UI: Analytics integrado na Saúde, Templates nos Gráficos', done: true }
      ]
    },
    {
      phase: 'Phase 27',
      version: 'v2.4.0-ALPHA.42',
      title: 'MICROSERVICES ARCHITECTURE',
      focus: 'Serviços independentes para analytics, gráficos e IA',
      icon: <SensorsIcon />,
      color: '#00e5ff',
      done: true,
      items: [
        { text: 'service-analytics: Worker para as-run e audit logs via Redis pub/sub', done: true },
        { text: 'service-graphics: Compositor HTML5 com Puppeteer/Chromium headless', done: true },
        { text: 'service-ai: Worker Python com Whisper para legendagem automática (ASR)', done: true },
        { text: 'MediaMTX Integrado: Multi-protocolo RTMP, SRT, LL-HLS, WebRTC unificado', done: true }
      ]
    },
    {
      phase: 'Phase 28',
      version: 'v2.4.0-ALPHA.43',
      title: 'SCTE-35 + LOW-LATENCY HLS',
      focus: 'Conformidade broadcast e streaming de ultra-baixa latência',
      icon: <RocketIcon />,
      color: '#ff9800',
      done: true,
      items: [
        { text: 'API SCTE-35: CRUD completo de marcadores de inserção de anúncios', done: true },
        { text: 'Injeção FFmpeg: build_scte35_args() para marcadores nos clips de playout', done: true },
        { text: 'PlaylistEditor Ad Cue: Botão e dialog de gestão SCTE-35 por item', done: true },
        { text: 'Low-Latency HLS: hlsVariant lowLatency, segmentos 1s, partes 100ms', done: true }
      ]
    },
    {
      phase: 'Phase 29',
      version: 'v2.5.0-ALPHA.44',
      title: 'KUBERNETES + MINIO + CI/CD',
      focus: 'Infraestrutura cloud-native e pipeline de entrega contínua',
      icon: <ScalabilityIcon />,
      color: '#9c27b0',
      done: true,
      items: [
        { text: 'Helm Charts: 11 templates Kubernetes para todos os serviços da plataforma', done: true },
        { text: 'MinIO S3: Armazenamento de objetos compatível com S3 (9000/9001)', done: true },
        { text: 'Storage Service: Trait Rust Storage para backend local ou S3 por env var', done: true },
        { text: 'GitHub Actions CI/CD: Build + push Docker para GHCR em PRs e main', done: true }
      ]
    },
    {
      phase: 'Phase 30',
      version: 'v2.6.0-ALPHA.45',
      title: 'LIVE INPUTS & MULTI-CHANNEL UI',
      focus: 'Expansão para live switching e gestão visual de múltiplos canais',
      icon: <MagicIcon />,
      color: '#00bcd4',
      done: true,
      items: [
        { text: 'Live Input Service: WebRTC, NDI, SDI, RTMP, SRT com FFmpeg pipelines', done: true },
        { text: 'Live Switching Engine: Cut/fade transitions, audio mixing, graphics overlay', done: true },
        { text: 'Social Streaming: YouTube Live e Facebook Live nativos com reconnection', done: true },
        { text: 'Multi-Channel UI: Grid dashboard com live previews e status indicators', done: true }
      ]
    },
    {
      phase: 'Phase 32',
      version: 'v2.7.0-ALPHA.47-PRO',
      title: 'MULTI-CHANNEL CONTROL & SCALE',
      focus: 'Gestão de múltiplos canais simultâneos e preview unificado',
      icon: <LayersIcon />,
      color: '#ff5722',
      done: true,
      items: [
        { text: 'Dynamic Channel Grids: Layout adaptativo para monitorização de múltiplos canais', done: true },
        { text: 'Independent Playouts: Cada canal com o seu próprio loop e estado de playout', done: true },
        { text: 'Global State Management: Sincronização de playout via Redis e Socket.io', done: true },
        { text: 'Performance Optimization: Redução de carga no backend e frontend para escala', done: true }
      ]
    },
    {
      phase: 'Phase 32',
      version: 'v2.7.x',
      title: 'CATEGORY FOLDERS & BATCH PLAYLIST',
      focus: 'Organização de media por categoria com drag-and-drop batch para playlists',
      icon: <MagicIcon />,
      color: '#e91e63',
      done: false,
      items: [
        { text: 'Category System: Tabela media_categories com CRUD completo e categorias default (Rock, Salsa, Merengue, Jazz, Pop, Reggaeton, Classical, News, Movies, Sports, Filler)', done: false },
        { text: 'Custom Categories: Possibilidade de criar categorias personalizadas com nome, cor e ícone', done: false },
        { text: 'Categories View: Grid visual de categorias na Media Library com contagem de ficheiros', done: false },
        { text: 'Drag Category → Playlist: Arrastar pasta inteira para o PlaylistEditor adiciona todos os ficheiros de uma vez', done: false },
        { text: 'i18n: Tradução completa da UI de categorias em EN, PT, ES, FR', done: false }
      ]
    },
    {
      phase: 'Phase 33',
      version: 'v2.8.x',
      title: 'LIVE SOURCE SWITCHING & NDI',
      focus: 'Comutação entre fontes ao vivo e integração profissional NDI',
      icon: <SensorsIcon />,
      color: '#00bcd4',
      done: false,
      items: [
        { text: 'NDI Input/Output: Integração FFmpeg com NDI SDK para redes profissionais de ultra-baixa latência', done: false },
        { text: 'Live Switcher UI: Componente A/B para alternar entre fontes (ficheiro, RTMP, NDI, SRT) em tempo real', done: false },
        { text: 'Multi-Source PIP: Picture-in-Picture para linguagem gestual, inserts e breaking news', done: false }
      ]
    },
    {
      phase: 'Phase 34',
      version: 'v2.9.x',
      title: 'AUDIO COMPLIANCE & MULTI-TRACK',
      focus: 'Normalização de áudio broadcast EBU R128 e faixas de áudio independentes',
      icon: <GraphicsIcon />,
      color: '#ff5722',
      done: false,
      items: [
        { text: 'EBU R128 Loudness: Filtro FFmpeg loudnorm integrado por canal, compatível com normas satellite/cable', done: false },
        { text: 'Multi-Audio Track: Faixas independentes (Original + Audiodescrição + Multilíngue) com switching em runtime', done: false },
        { text: 'Audio Metering UI: VU Meters e LUFS em tempo real no Dashboard via WebSocket', done: false }
      ]
    },
    {
      phase: 'Phase 35',
      version: 'v3.0.x',
      title: 'AUTOMATED QC & INGEST VALIDATION',
      focus: 'Controlo de qualidade automático no ingest para prevenir erros em direto',
      icon: <RocketIcon />,
      color: '#9c27b0',
      done: false,
      items: [
        { text: 'Quality Control Nativo: Validação automática (black frames, freeze, silêncio, codec incompatível) com alerta ou rejeição', done: false },
        { text: 'Smart Thumbnails: Extração inteligente de frames representativos (não o primeiro frame)', done: false },
        { text: 'Auto Proxy Generation: Criação automática de proxies leves para preview na biblioteca', done: false }
      ]
    },
    {
      phase: 'Phase 36',
      version: 'v3.1.x',
      title: 'FAST CHANNELS & MONETISATION',
      focus: 'Canais FAST e inserção dinâmica de publicidade para monetização',
      icon: <ScalabilityIcon />,
      color: '#ff9800',
      done: false,
      items: [
        { text: 'FAST Channel Delivery: Packaging para Pluto TV, Samsung TV Plus e plataformas FAST', done: false },
        { text: 'Dynamic Ad Insertion (DAI): Expansão SCTE-35 para inserção dinâmica em LL-HLS', done: false },
        { text: 'Viewer Analytics: Estimativa de audiência, engagement metrics e distribuição geográfica por canal', done: false }
      ]
    },
    {
      phase: 'Phase 37',
      version: 'v3.2.x',
      title: 'ENTERPRISE HARDENING',
      focus: 'Alta disponibilidade, conformidade BXF e controlo de acesso granular',
      icon: <EnterpriseIcon />,
      color: '#607d8b',
      done: false,
      items: [
        { text: 'Active-Active Redundancy: Heartbeat entre instâncias com failover automático em caso de falha', done: false },
        { text: 'BXF/Traffic Integration: Import/export em Broadcast eXchange Format para integração com sistemas de tráfego', done: false },
        { text: 'Granular RBAC: Permissões por canal e por funcionalidade com herança de perfis', done: false },
        { text: 'Remote Monitoring Dashboard: Interface web read-only para monitorização remota de todos os canais', done: false }
      ]
    },
    {
      phase: 'Phase 38',
      version: 'v3.3.0',
      title: 'REDESIGN UI/UX (BROADCAST GRADE)',
      focus: 'Nova interface profissional e estética de controlo mestre',
      icon: <GraphicsIcon />,
      color: '#00e5ff',
      done: false,
      items: [
        { text: "Design Tokens: Paleta néon e modo escuro 'Deep Night' para operações 24/7", done: false },
        { text: 'Modularização: Componentes leves para carregamento instantâneo', done: false },
        { text: 'Acessibilidade: Contraste auditado e suporte a navegação por teclado', done: false }
      ]
    },
    {
      phase: 'Phase 39',
      version: 'v3.4.0',
      title: 'PERFORMANCE HARDENING & VM STABILITY',
      focus: 'Otimização para hardware limitado e estabilidade extrema',
      icon: <AiIcon />,
      color: '#4caf50',
      done: false,
      items: [
        { text: 'Memory Management: PWA Caching e purga ativa de memória em componentes virtuais', done: false },
        { text: 'Database Otimization: Redução do pool de conexão e queries instantâneas', done: false },
        { text: 'System Guard: Monitorização ativa de recursos e limites de kernel ajustados', done: false }
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

        // 1. BRAND ASSETS: ALWAYS GLOBAL
        const brandPayload = {
          logo_path: settings.logoPath,
          branding_type: settings.branding_type,
          default_image_path: settings.defaultImagePath,
          default_video_path: settings.defaultVideoPath,
        };

        // 2. PATHS: CHANNEL-SPECIFIC IF ACTIVE
        const pathPayload = {
          media_path: settings.mediaPath,
          thumbnails_path: settings.thumbnailsPath,
          playlists_path: settings.playlistsPath,
          fillers_path: settings.fillersPath,
          epg_url: settings.epgUrl,
          epg_days: settings.epgDays,
          tmdb_api_key: settings.tmdbApiKey,
          omdb_api_key: cleanOmdbKey,
          tvmaze_api_key: settings.tvmazeApiKey,
          log_path: settings.logPath,
        };

        // Save brand assets globally
        await settingsAPI.update(brandPayload);

        // Save paths (and other settings) correctly
        if (activeChannelId) {
          await channelSettingsAPI.put(activeChannelId, pathPayload);
          console.log(`[Settings] Saved Tab 1 path overrides to channel:`, activeChannelId);
        } else {
          await settingsAPI.update(pathPayload);
        }
        
        // Skip further common payload logic for this tab since we handled it here
        await fetchSettings();
        showSuccess(t('settings.notifications.save_success', { tab: t('settings.navigation.tabs.paths') }));
        setSaving(false);
        return;
      } else if (tabValue === 2) { // Playout Tab
        // 1. Validate Channel Name Uniqueness
        const normalizedName = (settings.channelName || "").trim().toLowerCase();
        if (normalizedName) {
           const duplicate = (channels || []).find(c => 
             c.id !== activeChannelId && 
             c.name.toLowerCase().trim() === normalizedName
           );
           if (duplicate) {
             showError(t('settings.notifications.channel_name_exists') || "Este nome de canal já está em uso!");
             setSaving(false);
             return;
           }
        }

        // 2. Persist to Global Channel Object if it changed
        const activeChannel = (channels || []).find(c => c.id === activeChannelId);
        if (activeChannel && activeChannel.name !== settings.channelName) {
           try {
             await channelsAPI.update(activeChannelId, { name: settings.channelName });
             console.log(`[Settings] Updated global channel name to: ${settings.channelName}`);
           } catch (err) {
             console.error("Failed to update global channel name:", err);
           }
        }

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

      // Save to channel_settings overrides if channel is active and editing Output/Playout
      if (activeChannelId && (tabValue === 0 || tabValue === 2)) {
        await channelSettingsAPI.put(activeChannelId, payload);
        console.log(`[Settings] Saved Tab ${tabValue} overrides to channel:`, activeChannelId);
      } else {
        await settingsAPI.update(payload);
      }
      await fetchSettings(); // Re-sync state from DB to prevent stale overwrites
      const tabNames = [t('settings.navigation.tabs.output'), t('settings.navigation.tabs.paths'), t('settings.navigation.tabs.playout')];
      showSuccess(t('settings.notifications.save_success', { tab: tabNames[tabValue] || '' }));

      // Auto-restart engine with new settings if in Output tab
      if (tabValue === 0) {
        try {
          if (activeChannelId) {
            await channelPlayoutAPI.start(activeChannelId);
          } else {
            await playoutAPI.start();
          }
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
            <Suspense fallback={
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 10, gap: 2 }}>
                <CircularProgress size={40} thickness={4} sx={{ color: "primary.main" }} />
                <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary" }}>{t("common.loading")}</Typography>
              </Box>
            }>
              <OutputTab 
                settings={settings}
                setSettings={setSettings}
                handleOutputTypeChange={handleOutputTypeChange}
                handleResolutionChange={handleResolutionChange}
                handleBitrateChange={handleBitrateChange}
                handleCopyToClipboard={handleCopyToClipboard}
              />
            </Suspense>
          </TabPanel>

          {/* CATEGORY 1: CAMINHOS & MEDIA (Combined Old 1 & 3) */}
          <TabPanel value={tabValue} index={1}>
            <Suspense fallback={<Box sx={{ py: 10, textAlign: "center" }}><CircularProgress /></Box>}>
              <PathsTab 
                settings={settings}
                setSettings={setSettings}
                setShowLogsDialog={setShowLogsDialog}
                fetchSettings={fetchSettings}
                showSuccess={showSuccess}
                showError={showError}
                setMediaTypeSelector={setMediaTypeSelector}
                setMediaSelectorOpen={setMediaSelectorOpen}
                fetchProtectedAssets={fetchProtectedAssets}
              />
            </Suspense>
          </TabPanel>

          {/* CATEGORY 2: PLAYOUT & PRESETS */}
          <TabPanel value={tabValue} index={2}>
            <Suspense fallback={<Box sx={{ py: 10, textAlign: "center" }}><CircularProgress /></Box>}>
              <PlayoutTab 
                settings={settings}
                setSettings={setSettings}
                navigate={navigate}
                setResetConfirmOpen={setResetConfirmOpen}
                handleCopyToClipboard={handleCopyToClipboard}
                activePreset={activePreset}
                applyPreset={applyPreset}
                setMediaTypeSelector={setMediaTypeSelector}
                setMediaSelectorOpen={setMediaSelectorOpen}
                setConverterOpen={setConverterOpen}
              />
            </Suspense>
          </TabPanel>

          {/* CATEGORY 3: UTILIZADORES & PERFIS */}
          <TabPanel value={tabValue} index={3}>
            <Suspense fallback={<Box sx={{ py: 10, textAlign: "center" }}><CircularProgress /></Box>}>
              <UsersTab 
                viewMode={viewMode}
                setViewMode={setViewMode}
                users={users}
                profiles={profiles}
                setUserDialogOpen={setUserDialogOpen}
                setProfileDialogOpen={setProfileDialogOpen}
                setCurrentProfile={setCurrentProfile}
                handleOpenPasswordDialog={handleOpenPasswordDialog}
                setChannelAccessUser={setChannelAccessUser}
                setAllChannels={setAllChannels}
                setChannelAccessIds={setChannelAccessIds}
                setChannelAccessOpen={setChannelAccessOpen}
                handleDeleteUser={handleDeleteUser}
                handleDeleteProfile={handleDeleteProfile}
                channelsAPI={channelsAPI}
                userChannelAPI={userChannelAPI}
              />
            </Suspense>
          </TabPanel>

          {/* ─── Channel Access Dialog ───────────────────────────────── */}
          <Dialog open={channelAccessOpen} onClose={() => setChannelAccessOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { bgcolor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4 } }}>
            <DialogTitle sx={{ fontWeight: 900, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 1 }}>
              <TvIcon sx={{ color: 'info.main', fontSize: 20 }} />
              Channel Access — {channelAccessUser?.username}
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2, display: 'block' }}>
                Select which channels this user can access. Leave all unchecked to grant access to all channels.
              </Typography>
              {allChannels.length === 0 ? (
                <Typography variant="body2" sx={{ opacity: 0.5, textAlign: 'center', py: 2 }}>No channels found</Typography>
              ) : (
                allChannels.map((ch) => (
                  <FormControlLabel
                    key={ch.id}
                    control={
                      <Checkbox
                        size="small"
                        checked={channelAccessIds.includes(ch.id)}
                        onChange={(e) => {
                          if (e.target.checked) setChannelAccessIds((prev) => [...prev, ch.id]);
                          else setChannelAccessIds((prev) => prev.filter((id) => id !== ch.id));
                        }}
                        sx={{ color: 'primary.main' }}
                      />
                    }
                    label={<Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{ch.name}</Typography>}
                    sx={{ display: 'flex', mb: 0.5 }}
                  />
                ))
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
              <Button onClick={() => setChannelAccessOpen(false)} sx={{ fontWeight: 800, color: 'text.secondary' }}>Cancel</Button>
              <Button
                variant="contained"
                onClick={async () => {
                  try {
                    await userChannelAPI.setChannels(channelAccessUser.id, channelAccessIds);
                    showSuccess('Channel access updated');
                    setChannelAccessOpen(false);
                  } catch (err) {
                    showError('Failed to save channel access: ' + (err?.message || err));
                  }
                }}
                sx={{ fontWeight: 800, borderRadius: 2 }}
              >
                Save
              </Button>
            </DialogActions>
          </Dialog>

          {/* CATEGORY 4: SOBRE O SISTEMA */}
          <TabPanel value={tabValue} index={4}>
            <Suspense fallback={<Box sx={{ py: 10, textAlign: "center" }}><CircularProgress /></Box>}>
              <AboutTab 
                settings={settings}
                APP_VERSION_FALLBACK={APP_VERSION_FALLBACK}
                APP_RELEASE_DATE_FALLBACK={APP_RELEASE_DATE_FALLBACK}
                releaseHistory={releaseHistory}
                roadmapData={roadmapData}
                navigate={navigate}
              />
            </Suspense>
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
          <Typography variant="caption" sx={{ opacity: 0.5 }}>{settings.system_version || APP_VERSION_FALLBACK}</Typography>
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
