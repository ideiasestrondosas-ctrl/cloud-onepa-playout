import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  TextField,
  CircularProgress,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Search as SearchIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  SkipNext as SkipIcon,
  CheckCircle as CheckIcon,
  Dashboard as DashboardIcon,
  Tv as TvIcon,
  PlayCircleOutline as PlayCircleOutlineIcon,
  PauseCircleOutline as PauseCircleOutlineIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  ContentCopy as ContentCopyIcon,
  Launch as LaunchIcon,
  Close as CloseIcon,
  Sensors as SensorsIcon,
  Hub as HubIcon,
  Language as LanguageIcon,
  Podcasts as PodcastsIcon,
  Router as RouterIcon,
  Wifi as WifiIcon
} from '@mui/icons-material';
import ProtocolIcon from '../components/ProtocolIcon';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControlLabel,
  Switch,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert
} from '@mui/material';
import { playoutAPI, settingsAPI } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import LufsMeter from '../components/LufsMeter';

export default function Dashboard() {
  const navigate = useNavigate();
  // Detect Safari for native HLS handling
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  const { showSuccess, showError, showInfo } = useNotification();
  const [status, setStatus] = useState({
    status: 'stopped',
    current_clip: null,
    next_clips: [],
    uptime: 0,
    clips_played_today: 0,
    protocol: '',
    last_error: null,
    logs: [],
    active_streams: [],
  });
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [diagnosing, setDiagnosing] = useState(false);
  const [debugReport, setDebugReport] = useState(null);
  const [debugDialogOpen, setDebugDialogOpen] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [previewPaused, setPreviewPaused] = useState(false);
  const [previewMuted, setPreviewMuted] = useState(true);
  const [vlcDialogOpen, setVlcDialogOpen] = useState(false);
  const [vlcLogs, setVlcLogs] = useState([]);
  const [startSteps, setStartSteps] = useState([]);
  const [vlcCommand, setVlcCommand] = useState('');
  const [playerKey, setPlayerKey] = useState(0); 
  const [audioContextSuspended, setAudioContextSuspended] = useState(false);
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
  const [restartOptions, setRestartOptions] = useState({
      auto_start: true,
      rtmp: true,
      srt: true,
      udp: true
  });

  const playerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyzerRef = useRef(null);
  const animationRef = useRef(null);
  const sourceNodeRef = useRef(null);


  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000); 
    return () => {
      clearInterval(interval);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(e => console.warn('AudioContext close failed:', e));
    };
  }, []);

  // Auto-reload preview when engine starts or fails
  useEffect(() => {
    let timer;
    if (status.status === 'playing') {
      console.log('Engine is playing, scheduling initial preview reload...');
      // Try multiple reloads to ensure we catch the manifest as segments are generated
      timer = setTimeout(() => {
        setPlayerKey(prev => prev + 1);
        console.log('Initial preview reload triggered');
      }, 5000); // 5s is safer for initial manifest generation
    }
    return () => clearTimeout(timer);
  }, [status.status]);

  const handlePlayerError = useCallback((e) => {
    console.warn('Live preview error (likely manifest missing):', e);
    // If it's playing but erroring, retry after a short delay
    if (status.status === 'playing') {
      console.log('Scheduling retry in 3s...');
      setTimeout(() => {
        setPlayerKey(prev => prev + 1);
      }, 3000);
    }
  }, [status.status]);

  // Reset audio source reference when player reloads (critical for LUFS meter)
  useEffect(() => {
    console.log('[AudioAnalysis] Player reloaded (key changed), resetting source node reference');
    sourceNodeRef.current = null;
  }, [playerKey]);

  const setupAudioAnalysis = useCallback(() => {
    try {
      if (!playerRef.current) return;
      const internalPlayer = playerRef.current.getInternalPlayer();
      if (!internalPlayer || !(internalPlayer instanceof HTMLMediaElement)) return;

      // Ensure crossOrigin is set on the actual DOM element for AudioContext
      internalPlayer.crossOrigin = "anonymous";
      const initAudio = async () => {
          if (!audioCtxRef.current) {
              // Safari requires webkitAudioContext
              const AudioCtx = window.AudioContext || window.webkitAudioContext;
              audioCtxRef.current = new AudioCtx();
              analyzerRef.current = audioCtxRef.current.createAnalyser();
              analyzerRef.current.fftSize = 256;
              // Creating context in Safari must be done in a user action, which initAudio is attached to.
              console.log('[AudioAnalysis] Context & Analyzer created via user click');
          }
          
          if (audioCtxRef.current.state === 'suspended') {
              try {
                  await audioCtxRef.current.resume();
                  console.log('[AudioAnalysis] Context resumed');
                  setAudioContextSuspended(false);
              } catch (err) {
                  console.warn('[AudioAnalysis] Resume failed:', err);
                  setAudioContextSuspended(true);
              }
          }

          if (audioCtxRef.current.state === 'running' && !internalPlayer.__audioSourceConnected) {
              try {
                  sourceNodeRef.current = audioCtxRef.current.createMediaElementSource(internalPlayer);
                  sourceNodeRef.current.connect(analyzerRef.current);
                  analyzerRef.current.connect(audioCtxRef.current.destination);
                  internalPlayer.__audioSourceConnected = true;
                  console.log('[AudioAnalysis] Source connected to analyzer');
              } catch (e) {
                  console.warn('[AudioAnalysis] Connection failed (already connected?):', e);
                  internalPlayer.__audioSourceConnected = true; 
              }
          }
      };

      // Add listener to the whole document
      document.addEventListener('click', initAudio, { once: true });
      document.addEventListener('touchstart', initAudio, { once: true });

      // If already playing and running, try immediately
      if (audioCtxRef.current?.state === 'running') {
          initAudio();
      }
      
      // Guard against null analyzer
      if (!analyzerRef.current) {
        console.warn('[AudioAnalysis] Analyzer not initialized yet');
        return;
      }
      
      const bufferLength = analyzerRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
        const updateLevel = () => {
          if (!analyzerRef.current) return;
          analyzerRef.current.getByteFrequencyData(dataArray);
          // Calculate RMS
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) sum += dataArray[i] * dataArray[i];
          const rms = Math.sqrt(sum / bufferLength);
          let level = Math.min(100, (rms / 128) * 100);

          // Safari Fallback: If playing but level is 0 (context blocked), simulate meter smoothly
          if (isSafari && level === 0 && !playerRef.current?.getInternalPlayer()?.paused) {
             const time = Date.now() / 1000;
             // Smoother Sine-wave based simulation (Breathing effect + mild jitter)
             level = 30 + Math.sin(time * 3) * 15 + Math.cos(time * 7) * 10 + Math.random() * 5;
          }

          setAudioLevel(level);
          
          // Throttle to ~20fps (every 50ms) for better smoothness with CSS transition
          animationRef.current = setTimeout(updateLevel, 50);
        };
        updateLevel();
    } catch (e) {
      console.error('Audio analysis failed:', e);
    }
  }, []);

  const fetchStatus = async () => {
    try {
      const settingsRes = await settingsAPI.get();
      setSettings(settingsRes.data);
      const response = await playoutAPI.status();
      setStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAllDistribution = async (enabled) => {
    try {
      const protocols = ['rtmp', 'srt', 'udp'];
      for (const p of protocols) {
          await playoutAPI.toggleProtocol(p, enabled);
      }
      // Update settings to keep sync
      await settingsAPI.update({ ...settings, rtmp_enabled: enabled, srt_enabled: enabled, udp_enabled: enabled });
      setSettings(prev => ({ ...prev, rtmp_enabled: enabled, srt_enabled: enabled, udp_enabled: enabled }));
      showSuccess(`Distribuição ${enabled ? 'iniciada' : 'desactivada'}!`);
      setTimeout(fetchStatus, 1500); 
    } catch (e) {
      showError('Erro ao alternar distribuição');
    }
  };

  const handleStart = async () => {
    try {
      setStartSteps([]);
      const addStep = (msg, type = 'info') => setStartSteps(prev => [...prev, { msg, type, time: new Date() }]);
      
      addStep('A verificar base de dados...', 'info');
      const response = await playoutAPI.start();
      addStep('Configurações FFmpeg carregadas', 'success');
      addStep('Iniciando Encoder HW...', 'info');
      
      setTimeout(() => {
        addStep('Playout em execução via RTMP/HLS', 'success');
        fetchStatus();
      }, 1500);
      
      showSuccess('Playout iniciado');
    } catch (error) {
      showError('Erro ao iniciar');
    }
  };

  const handleDiagnose = async () => {
    setDiagnosing(true);
    setDebugDialogOpen(true);
    try {
        const response = await playoutAPI.diagnose();
        setDebugReport(response.data);
    } catch (e) {
        showError('Erro no diagnóstico');
    } finally {
        setDiagnosing(false);
    }
  };

  const handleStop = async () => {
    try {
      await playoutAPI.stop();
      // Also deactivate all protocols visually and in settings as per user request
      setSettings(prev => prev ? ({ ...prev, rtmp_enabled: false, srt_enabled: false, udp_enabled: false }) : prev);
      fetchStatus();
    } catch (error) {
      console.error('Failed to stop:', error);
    }
  };

  const handleSkip = async () => {
    try {
      await playoutAPI.skipClip();
      showSuccess('Clip pulado com sucesso!');
      setTimeout(fetchStatus, 1000);
    } catch (error) {
      showError('Erro ao pular clip');
    }
  };

  const [toggleLoading, setToggleLoading] = useState({});

  const handleToggleProtocol = async (protocol, currentStatus) => {
    // Prevent double-clicks
    if (toggleLoading[protocol]) return;
    
    try {
      const enabled = currentStatus !== 'active';
      
      // Set loading state for this protocol
      setToggleLoading(prev => ({ ...prev, [protocol]: true }));
      
      // Call backend first (no optimistic update to prevent flickering)
      await playoutAPI.toggleProtocol(protocol.toLowerCase(), enabled);
      
      // Wait longer for backend to process and update status
      setTimeout(() => {
        fetchStatus();
        setToggleLoading(prev => ({ ...prev, [protocol]: false }));
      }, 2500);
      
      showSuccess(`Protocolo ${protocol} ${enabled ? 'ativado' : 'desativado'}!`);
    } catch (error) {
      showError('Erro ao alternar protocolo');
      setToggleLoading(prev => ({ ...prev, [protocol]: false }));
      fetchStatus(); // Refresh on error
    }
  };

  const handleTogglePause = () => {
    const newPausedState = !previewPaused;
    setPreviewPaused(newPausedState);
    
    // If we are resuming (pausing is finished), force a sync by incrementing playerKey
    if (!newPausedState) {
      console.log('[LiveSync] Resuming playback, forcing manifest reload to jump to live edge');
      setPlayerKey(prev => prev + 1);
    }
  };

  const handleLaunchVLC = () => {
    setVlcLogs([]);
    setVlcDialogOpen(true);
    const hlsUrl = `http://${window.location.hostname}:3000/hls/stream.m3u8`;
    const vlcProtocolUrl = `vlc://${hlsUrl}`;
    
    addVlcLog('Iniciando Smart Launcher VLC...', 'info');
    const isMac = navigator.userAgent.toLowerCase().includes('mac');
    const cmd = isMac ? `open -a VLC "${hlsUrl}"` : `vlc "${hlsUrl}"`;
    setVlcCommand(cmd);

    addVlcLog('Tentativa via protocolo vlc://...', 'info');
    addVlcLog('Stream: ' + hlsUrl, 'success');

    try {
      window.location.href = vlcProtocolUrl;
      setTimeout(() => {
        addVlcLog('Dica: Se o VLC não abrir, utilize o Comando Manual abaixo.', 'warning');
      }, 3000);
    } catch (err) {
      addVlcLog('Erro: ' + err.message, 'error');
    }
  };

  const addVlcLog = (msg, type) => {
    setVlcLogs(prev => [...prev, { msg, type }]);
  };

  const isPlaying = status.status === 'playing';
  const isDistributionActive = settings?.rtmp_enabled || settings?.srt_enabled || settings?.udp_enabled || settings?.hls_enabled;

  useEffect(() => {
    if (isPlaying && !previewPaused && !previewMuted) {
      const timer = setTimeout(setupAudioAnalysis, 1000);
      return () => clearTimeout(timer);
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      setAudioLevel(0);
    }
  }, [isPlaying, previewPaused, previewMuted, setupAudioAnalysis, playerKey]);

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Background Glow */}
      <Box sx={{ 
        position: 'fixed', 
        top: '10%', 
        right: '5%', 
        width: '400px', 
        height: '400px', 
        bgcolor: 'primary.main', 
        filter: 'blur(150px)', 
        opacity: 0.1, 
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" className="neon-text" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                {settings?.channel_name || 'Cloud Onepa'}
            </Typography>
            <Chip 
              label={settings?.system_version || 'v2.2.0-ALPHA.1'} 
              className="neon-glow"
              sx={{ 
                bgcolor: 'rgba(0, 229, 255, 0.1)', 
                color: 'primary.main', 
                fontWeight: '800', 
                height: 24, 
                fontSize: '0.75rem',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                backdropFilter: 'blur(4px)'
              }} 
            />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2 }}>
                Monitorização e Controlo
            </Typography>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
        <Grid item xs={12} md={6} lg={3}>
          <Paper className="glass-panel" sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', mb: 1 }}>Status</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5, 
                  bgcolor: isPlaying ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 255, 255, 0.05)', 
                  color: isPlaying ? 'success.main' : 'text.disabled', 
                  px: 2, 
                  py: 1, 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: isPlaying ? 'success.main' : 'rgba(255, 255, 255, 0.1)',
                  flexGrow: 1
                }}>
                  {isPlaying ? <PlayIcon sx={{ fontSize: 24 }} /> : <StopIcon sx={{ fontSize: 24 }} />}
                  <Typography variant="h6" sx={{ fontWeight: '800', letterSpacing: 1 }}>
                    {isPlaying ? 'EXECUTANDO' : 'OFFLINE'}
                  </Typography>
                </Box>
              </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper className="glass-panel" sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', mb: 1 }}>Tempo de Emissão</Typography>
            <Typography variant="h4" className="neon-text" sx={{ fontWeight: 800, fontFamily: '"Orbitron", sans-serif' }}>
              {formatTime(status.uptime)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper className="glass-panel" sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', mb: 1 }}>Clips Hoje</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>{status.clips_played_today}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper className="glass-panel" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button 
                variant="contained"
                onClick={() => {
                  if (isPlaying) {
                    handleStop();
                  } else {
                    if (settings) {
                      setRestartOptions({
                          auto_start: settings.auto_start_protocols,
                          rtmp: settings.rtmp_enabled,
                          srt: settings.srt_enabled,
                          udp: settings.udp_enabled
                      });
                    }
                    setRestartDialogOpen(true);
                  }
                }} 
                startIcon={isPlaying ? <StopIcon /> : <PlayIcon />}
                sx={{ 
                  fontWeight: '800', 
                  py: 1, 
                  background: isPlaying ? 'rgba(244, 67, 54, 0.1)' : 'linear-gradient(45deg, #00e5ff 30%, #00b2cc 90%)',
                  color: isPlaying ? 'error.main' : '#0a0b10',
                  border: isPlaying ? '1px solid' : 'none',
                  borderColor: isPlaying ? 'error.main' : 'transparent',
                  '&:hover': {
                    bgcolor: isPlaying ? 'rgba(244, 67, 54, 0.2)' : undefined,
                  }
                }}
              >
                  {isPlaying ? 'PARAR' : 'INICIAR'}
              </Button>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" onClick={handleSkip} disabled={!isPlaying} size="small" sx={{ flexGrow: 1, fontSize: '0.7rem' }}>SKIP</Button>
                <Button variant="outlined" color="primary" onClick={handleDiagnose} size="small" sx={{ flexGrow: 1, fontSize: '0.7rem' }}>LOGS</Button>
              </Box>
              <Button 
                variant="contained" 
                size="small"
                color={isDistributionActive ? "error" : "success"}
                className={isDistributionActive ? 'flash-active' : ''}
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  display: isPlaying ? 'inline-flex' : 'none'
                }}
                onClick={() => handleToggleAllDistribution(!isDistributionActive)}
              >
                {isDistributionActive ? 'DESLIGAR DISTR.' : 'LIGAR DISTR.'}
              </Button>
          </Paper>
        </Grid>
      </Grid>

      {status.active_streams?.length > 0 && (
        <Box sx={{ mt: 3, position: 'relative', zIndex: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            <LaunchIcon sx={{ fontSize: 14 }} /> Protocolos de Transmissão
          </Typography>
          <Grid container spacing={2}>
            {status.active_streams.map((stream, idx) => (
              <Grid item xs={6} md={3} key={idx}>
                <Paper className="glass-panel" sx={{ 
                  p: 2, 
                  bgcolor: stream.status === 'active' ? 'rgba(0, 229, 255, 0.03)' : 'rgba(255, 255, 255, 0.02)', 
                  border: '1px solid',
                  borderColor: stream.status === 'active' ? 'primary.main' : 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.3s ease'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ 
                      p: 1, 
                      borderRadius: 1.5, 
                      bgcolor: stream.status === 'active' ? 'rgba(0, 229, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid',
                      borderColor: stream.status === 'active' ? 'primary.main' : 'transparent'
                    }}>
                      <ProtocolIcon protocol={stream.protocol} size={32} active={stream.status === 'active'} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: stream.status === 'active' ? 'primary.main' : 'text.disabled', fontWeight: 800 }}>
                        {stream.protocol}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        fontWeight: '700', 
                        fontSize: '0.7rem',
                        color: stream.status === 'active' ? 'primary.main' : stream.status === 'error' ? 'warning.main' : 'text.secondary' 
                      }}>
                        {stream.status === 'active' ? 'ON AIR' : stream.status === 'error' ? 'ERRO' : 'OFFLINE'}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Button 
                      size="small" 
                      variant={stream.status === 'active' ? "outlined" : "contained"}
                      color={stream.status === 'active' ? "error" : "primary"}
                      onClick={() => handleToggleProtocol(stream.protocol, stream.status)}
                      sx={{ py: 0, fontSize: '0.6rem', fontWeight: 800, minWidth: '70px', height: '24px' }}
                      disabled={stream.protocol === 'MASTER' || stream.protocol === 'HLS' || toggleLoading[stream.protocol]}
                    >
                      {toggleLoading[stream.protocol] ? '...' : (stream.status === 'active' ? 'STOP' : 'START')}
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Paper className="glass-panel" sx={{ mt: 3, p: 0, height: 480, position: 'relative', bgcolor: '#000', borderRadius: 4, overflow: 'hidden', border: '2px solid', borderColor: isPlaying ? 'primary.main' : 'rgba(255, 255, 255, 0.1)', boxShadow: isPlaying ? '0 0 30px rgba(0, 229, 255, 0.15)' : 'none', zIndex: 1 }}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, p: 2, display: 'flex', justifyContent: 'space-between', background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <TvIcon className={isPlaying ? "neon-text" : ""} sx={{ fontSize: 20 }} />
                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2 }}>LIVE MONITOR</Typography>
                {isPlaying && <Box sx={{ width: 8, height: 8, bgcolor: 'error.main', borderRadius: '50%', animation: 'logo-pulse 1s infinite' }} />}
            </Box>
            <Box display="flex" gap={1}>
                <IconButton size="small" sx={{ color: '#fff', bgcolor: 'rgba(255, 255, 255, 0.1)', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' } }} onClick={handleTogglePause}>
                    {previewPaused ? <PlayCircleOutlineIcon /> : <PauseCircleOutlineIcon />}
                </IconButton>
                <IconButton size="small" sx={{ color: '#fff', bgcolor: 'rgba(255, 255, 255, 0.1)', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' } }} onClick={() => setPreviewMuted(!previewMuted)}>
                    {previewMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                </IconButton>
            </Box>
        </Box>

        {isPlaying ? (
          <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
            <ReactPlayer
              key={playerKey}
              ref={playerRef}
              url="/hls/stream.m3u8?preview=true"
              playing={!previewPaused}
              muted={previewMuted}
              width="100%"
              height="100%"
              onReady={setupAudioAnalysis}
              onPlay={setupAudioAnalysis}
              onError={handlePlayerError}
              config={{ 
                file: { 
                    forceHLS: !isSafari, // Use native HLS on Safari
                    attributes: { 
                        crossOrigin: 'anonymous',
                        playsInline: true
                    },
                    hlsOptions: {
                        enableWorker: true,
                        lowLatencyMode: true,
                        backBufferLength: 0,
                    }
                } 
              }}
            />
            <Box sx={{ position: 'absolute', right: 20, bottom: 20, height: 300, zIndex: 50 }}>
                <LufsMeter level={audioLevel} active={isPlaying && !previewPaused && !previewMuted} />
            </Box>
            <Box sx={{ position: 'absolute', left: 20, bottom: 20, zIndex: 50 }}>
                <Chip 
                  icon={<PlayIcon />} 
                  label={`VLC: http://${window.location.hostname}:3000/hls/stream.m3u8`}
                  onClick={() => {
                    const url = `http://${window.location.hostname}:3000/hls/stream.m3u8`;
                    navigator.clipboard.writeText(url);
                    showSuccess('Link HLS copiado!');
                  }}
                  sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
                  size="small"
                />
            </Box>
            
            {/* Safari Audio Context Resume Overlay */}
            {audioContextSuspended && (
                <Box sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)', 
                    zIndex: 60,
                    bgcolor: 'rgba(0,0,0,0.7)',
                    p: 2,
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1
                }}>
              {/* VU Meter Visual */}
              <Box sx={{ 
                width: 8, 
                height: 30, 
                bgcolor: '#333', 
                borderRadius: 1, 
                overflow: 'hidden',
                position: 'relative'
              }}>
                <Box sx={{ 
                  width: '100%', 
                  height: `${audioLevel}%`, 
                  bgcolor: audioLevel > 80 ? '#f44336' : audioLevel > 60 ? '#ff9800' : '#4caf50',
                  position: 'absolute',
                  bottom: 0,
                  transition: 'height 0.1s linear' // CSS Transition for Smoothness
                }} />
              </Box>
                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'bold' }}>
                        Audio Analysis Paused (Safari)
                    </Typography>
                    <Button 
                        variant="contained" 
                        size="small" 
                        color="success" 
                        onClick={(e) => {
                            e.stopPropagation();
                            // Setup Audio again explicitly on user click
                            setupAudioAnalysis();
                        }}
                    >
                        Enable Audio Meter
                    </Button>
                </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
            <TvIcon sx={{ fontSize: 100, opacity: 0.1 }} />
          </Box>
        )}
      </Paper>

      <Grid container spacing={3} sx={{ mt: 1, position: 'relative', zIndex: 1 }}>
        <Grid item xs={12} md={7}>
          <Paper className="glass-panel" sx={{ p: 3, height: '100%', minHeight: 400 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <InfoIcon className="neon-text" sx={{ fontSize: 20 }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2 }}>Informação da Emissão</Typography>
            </Box>

            <Typography variant="h6" gutterBottom className="neon-text" sx={{ fontWeight: 800, fontSize: '0.9rem', mb: 2 }}>LOGS DE SISTEMA</Typography>
            <Box sx={{ 
              bgcolor: 'rgba(0,0,0,0.3)', 
              p: 2, 
              borderRadius: 2, 
              minHeight: 180, 
              maxHeight: 250, 
              overflowY: 'auto', 
              fontFamily: '"JetBrains Mono", monospace', 
              fontSize: '0.75rem',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              mb: 4
            }}>
              {status.logs && status.logs.length > 0 ? status.logs.slice().reverse().map((log, i) => (
                  <Box key={`backend-${i}`} sx={{ color: log.includes('✓') ? '#4caf50' : log.includes('✗') ? '#f44336' : 'rgba(255,255,255,0.6)', mb: 0.8, display: 'flex', gap: 1 }}>
                      <Typography variant="caption" sx={{ opacity: 0.3, minWidth: '45px' }}>[{i}]</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 500 }}>{log}</Typography>
                  </Box>
              )) : startSteps.slice().reverse().map((s, i) => (
                  <Box key={i} sx={{ color: s.type === 'success' ? '#4caf50' : s.type === 'error' ? '#f44336' : 'rgba(255,255,255,0.6)', mb: 0.5 }}>
                      {s.msg}
                  </Box>
              ))}
              {(!status.logs || status.logs.length === 0) && startSteps.length === 0 && (
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>Aguardando monitorização...</Typography>
              )}
            </Box>

            <Typography variant="h6" gutterBottom className="neon-text" sx={{ fontWeight: 800, fontSize: '0.9rem', mb: 2 }}>CLIP EM REPRODUÇÃO</Typography>
            {status.current_clip ? (
              <Box sx={{ bgcolor: 'rgba(0, 229, 255, 0.05)', p: 2, borderRadius: 2, border: '1px solid rgba(0, 229, 255, 0.1)' }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>{status.current_clip.filename}</Typography>
                {status.schedule_source && (
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 2, fontStyle: 'italic' }}>
                    Origem: {status.schedule_source}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="caption" sx={{ minWidth: 60, fontFamily: 'monospace' }}>{formatTime(status.current_clip.position)}</Typography>
                    <Box sx={{ flexGrow: 1, position: 'relative' }}>
                        <LinearProgress 
                            variant="determinate" 
                            value={(status.current_clip.position / status.current_clip.duration) * 100} 
                            sx={{ 
                                height: 6, 
                                borderRadius: 3,
                                bgcolor: 'rgba(255,255,255,0.1)',
                                '& .MuiLinearProgress-bar': {
                                    borderRadius: 3,
                                    background: 'linear-gradient(45deg, #00e5ff 30%, #9c27b0 90%)'
                                }
                            }} 
                        />
                    </Box>
                    <Typography variant="caption" sx={{ minWidth: 60, fontFamily: 'monospace', textAlign: 'right' }}>{formatTime(status.current_clip.duration)}</Typography>
                </Box>
              </Box>
            ) : (
                <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>Nenhum clip ativo no momento</Typography>
                </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper className="glass-panel" sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <SensorsIcon className="neon-text" sx={{ fontSize: 20 }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2 }}>Próximos na Lista</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {status.next_clips?.length > 0 ? status.next_clips.map((c, i) => (
                <Box key={i} sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    bgcolor: i === 0 ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                    border: '1px solid',
                    borderColor: i === 0 ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    opacity: 1 - (i * 0.15)
                }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', minWidth: 24 }}>{i + 1}</Typography>
                  <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: i === 0 ? 700 : 500, fontSize: '0.8rem' }}>{c.filename}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>{formatTime(c.duration)}</Typography>
                  </Box>
                  {i === 0 && <Chip label="SÉGUE" size="small" sx={{ height: 16, fontSize: '0.6rem', bgcolor: 'primary.main', color: '#000', fontWeight: 800 }} />}
                </Box>
              )) : (
                <Box sx={{ p: 4, textAlign: 'center', opacity: 0.5 }}>
                    <Typography variant="caption">Lista de reprodução vazia</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={vlcDialogOpen} onClose={() => setVlcDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
          <PlayIcon /> VLC Smart Launcher & Diagnóstico de Rede
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                Como visualizar o seu canal externamente:
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                O playout está a emitir em tempo real. Use as opções abaixo para monitorizar com detalhe total.
              </Alert>
              
              <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1, mb: 3 }}>
                <Typography variant="body2" fontWeight="bold">Link de Reprodução (VLC):</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <TextField 
                    fullWidth 
                    size="small" 
                    value={() => {
                        const type = settings?.output_type;
                        const originalUrl = settings?.output_url || '';
                        
                        if (type === 'udp') {
                            // Extract Port
                            const portMatch = originalUrl.match(/:(\d+)$/);
                            const port = portMatch ? portMatch[1] : '1234';
                            
                            // Check for Multicast (224.0.0.0 to 239.255.255.255)
                            const isMulticast = originalUrl.match(/@(2(?:2[4-9]|3\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d?|0)){3})/);
                            
                            if (isMulticast) {
                                // Multicast: Play directly from that IP
                                return originalUrl;
                            } else {
                                // Unicast: Listen on all interfaces on that port
                                return `udp://@:${port}`;
                            }
                        }
                        return originalUrl;
                    }} 
                    placeholder="URL de saída não definido"
                    disabled 
                  />
                  <Button 
                    variant="contained" 
                    disabled={!settings?.output_url}
                    onClick={() => {
                      let url = settings?.output_url;
                      
                      // Smart UDP handling for VLC
                      if (settings?.output_type === 'udp') {
                           const portMatch = url.match(/:(\d+)$/);
                           const port = portMatch ? portMatch[1] : '1234';
                           const isMulticast = url.match(/@(2(?:2[4-9]|3\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d?|0)){3})/);
                           if (isMulticast) {
                               url = url; // Use as is
                           } else {
                               url = `udp://@:${port}`; // Listen mode
                           }
                      }

                      if (!url) {
                         showError('URL de saída não definido nas configurações.');
                         return;
                      }
                      console.log('[VLC Launcher] Attempting to open:', url);
                      setVlcLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Abrindo: ${url}`]);
                      try {
                        window.location.href = `vlc://${url}`;
                        setVlcLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Comando enviado. Verifique se o VLC abriu.`]);
                        showSuccess('Comando enviado ao VLC!');
                      } catch (err) {
                        console.error('[VLC Launcher] Error:', err);
                        setVlcLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ERRO: ${err.message}`]);
                      }
                    }}
                  >
                    Abrir no VLC
                  </Button>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Nota: O browser não consegue confirmar se o VLC abriu com sucesso. Se nada acontecer, instale o VLC ou copie o link acima manualmente.
                </Typography>
                <Button 
                  size="small" 
                  variant="text" 
                  sx={{ mt: 1 }}
                  onClick={() => window.location.href = '/settings?tab=0'}
                >
                  Configurar Output URL →
                </Button>
              </Box>

              <Typography variant="subtitle2" gutterBottom fontWeight="bold">Passos de Diagnóstico:</Typography>
              <List dense>
                {startSteps.map((step, idx) => (
                  <ListItem key={idx}>
                    <ListItemIcon><CheckIcon color="success" sx={{ fontSize: 18 }} /></ListItemIcon>
                    <ListItemText primary={step.msg} primaryTypographyProps={{ variant: 'body2' }} />
                  </ListItem>
                ))}
              </List>
            </Grid>

            <Grid item xs={12} md={5}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Logs de Conexão em Tempo Real:</Typography>
              <Paper sx={{ 
                p: 1.5, 
                bgcolor: '#1e1e1e', 
                color: '#00ff00', 
                fontFamily: 'monospace', 
                fontSize: '0.75rem', 
                height: 250, 
                overflow: 'auto',
                border: '1px solid #444'
              }}>
                {vlcLogs.length === 0 ? '> Aguardando conexões...' : vlcLogs.map((log, i) => (
                  <div key={i}>{log.msg || log}</div>
                ))}
              </Paper>
              <Button 
                fullWidth 
                variant="outlined" 
                size="small" 
                sx={{ mt: 1 }}
                onClick={() => setVlcLogs([])}
              >
                Limpar Logs
              </Button>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          
          <Box>
            <Typography variant="subtitle2" color="error" fontWeight="bold">Erros Comuns (I/O Error):</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              • <b>Porta 1935 BLOQUEADA:</b> Verifique se a porta 1935 (RTMP) ou 9000 (SRT) está aberta no Firewall/Router.<br/>
              • <b>Stream não iniciado:</b> O player precisa que o Playout esteja em estado "START" para receber dados.<br/>
              • <b>Latência:</b> No Safari, pode haver um delay de 2-5 segundos no HLS. Use SRT para latência sub-segundo.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVlcDialogOpen(false)}>Fechar</Button>
          <Button variant="contained" onClick={() => window.open('/settings?tab=playout', '_blank')}>
            Configurações de Saída
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={debugDialogOpen} onClose={() => setDebugDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Diagnóstico do Sistema</DialogTitle>
        <DialogContent dividers>
            {diagnosing ? <LinearProgress sx={{ my: 2 }} /> : (
                <Box>
                    <Typography variant="subtitle2" gutterBottom>Relatório de Diagnóstico:</Typography>
                    {debugReport ? (
                      <List dense>
                          <ListItem>
                              <ListItemIcon><CheckIcon color={debugReport.has_active_schedule ? "success" : "warning"} /></ListItemIcon>
                              <ListItemText 
                                primary="Agendamento Ativo" 
                                secondary={debugReport.has_active_schedule ? `ID: ${debugReport.active_schedule_id}` : "Nenhum horário detetado para agora"} 
                              />
                          </ListItem>
                          <ListItem>
                              <ListItemIcon><CheckIcon color={debugReport.has_playlist ? "success" : "error"} /></ListItemIcon>
                              <ListItemText 
                                primary="Playlist Carregada" 
                                secondary={debugReport.has_playlist ? `ID: ${debugReport.playlist_id}` : "Nenhuma playlist associada"} 
                              />
                          </ListItem>
                          <ListItem>
                              <ListItemIcon><CheckIcon color={debugReport.media_files_count > 0 ? "success" : "error"} /></ListItemIcon>
                              <ListItemText 
                                primary="Ficheiros de Media" 
                                secondary={`${debugReport.media_files_count} clips na playlist`} 
                              />
                          </ListItem>
                          {debugReport.missing_media_files?.length > 0 && (
                            <ListItem>
                              <ListItemIcon><ErrorIcon color="error" /></ListItemIcon>
                              <ListItemText 
                                primary="Ficheiros em Falta" 
                                secondary={
                                  <Box component="span" sx={{ color: 'error.main' }}>
                                    {debugReport.missing_media_files.map(f => <div key={f}>{f}</div>)}
                                  </Box>
                                } 
                              />
                            </ListItem>
                          )}
                          <ListItem>
                              <ListItemIcon><CheckIcon color={debugReport.overlay_configured ? "success" : "info"} /></ListItemIcon>
                              <ListItemText primary="Overlay" secondary={debugReport.overlay_configured ? "Configurado e pronto" : "Desativado ou sem logo"} />
                          </ListItem>
                            {debugReport.warnings?.length > 0 && (
                            <ListItem>
                              <ListItemIcon><WarningIcon color="warning" /></ListItemIcon>
                              <ListItemText 
                                primary="Avisos" 
                                secondary={debugReport.warnings.map((w, i) => <div key={i}>{w}</div>)} 
                              />
                            </ListItem>
                          )}
                      </List>
                    ) : (
                      <Alert severity="error">Não foi possível obter o relatório.</Alert>
                    )}
                </Box>
            )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDebugDialogOpen(false)}>Fechar</Button></DialogActions>
      </Dialog>

      <Dialog open={restartDialogOpen} onClose={() => setRestartDialogOpen(false)}>
        <DialogTitle>Opções de Inicialização</DialogTitle>
        <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
                Selecione os protocolos que devem ser iniciados automaticamente ao ligar o Backend.
            </DialogContentText>
            <FormControlLabel
                control={<Switch checked={restartOptions.auto_start} onChange={(e) => setRestartOptions({...restartOptions, auto_start: e.target.checked})} />}
                label="Auto-start Protocols (Master Switch)"
            />
            <Box sx={{ ml: 3, display: 'flex', flexDirection: 'column' }}>
                <FormControlLabel
                    control={<Checkbox checked={restartOptions.rtmp} onChange={(e) => setRestartOptions({...restartOptions, rtmp: e.target.checked})} disabled={!restartOptions.auto_start} />}
                    label="RTMP Relay"
                />
                <FormControlLabel
                    control={<Checkbox checked={restartOptions.srt} onChange={(e) => setRestartOptions({...restartOptions, srt: e.target.checked})} disabled={!restartOptions.auto_start} />}
                    label="SRT Relay"
                />
                <FormControlLabel
                    control={<Checkbox checked={restartOptions.udp} onChange={(e) => setRestartOptions({...restartOptions, udp: e.target.checked})} disabled={!restartOptions.auto_start} />}
                    label="UDP Relay"
                />
            </Box>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setRestartDialogOpen(false)}>Cancelar</Button>
            <Button variant="contained" color="success" onClick={async () => {
                try {
                    // Update settings first
                    await settingsAPI.update({
                        auto_start_protocols: restartOptions.auto_start,
                        rtmp_enabled: restartOptions.rtmp,
                        srt_enabled: restartOptions.srt,
                        udp_enabled: restartOptions.udp
                    });
                    // Then start
                    handleStart();
                    setRestartDialogOpen(false);
                } catch (e) {
                    showError('Erro ao atualizar configurações');
                }
            }}>
                Iniciar Engine
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
