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
  Divider
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
  Close as CloseIcon
} from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  const { showSuccess, showError, showInfo } = useNotification();
  const [status, setStatus] = useState({
    status: 'stopped',
    current_clip: null,
    next_clips: [],
    uptime: 0,
    clips_played_today: 0,
    output_url: '',
    protocol: '',
    last_error: null,
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

  const setupAudioAnalysis = useCallback(() => {
    try {
      if (!playerRef.current) return;
      const internalPlayer = playerRef.current.getInternalPlayer();
      if (!internalPlayer || !(internalPlayer instanceof HTMLMediaElement)) return;

      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AudioContext();
        analyzerRef.current = audioCtxRef.current.createAnalyser();
        analyzerRef.current.fftSize = 256;
      }

      // Important for Chrome/Safari: AudioContext must be resumed after user interaction
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().then(() => {
            console.log('AudioContext resumed successfully');
        }).catch(e => console.error('Failed to resume AudioContext:', e));
      }

      if (!sourceNodeRef.current) {
        sourceNodeRef.current = audioCtxRef.current.createMediaElementSource(internalPlayer);
        sourceNodeRef.current.connect(analyzerRef.current);
        analyzerRef.current.connect(audioCtxRef.current.destination);
      }
      const bufferLength = analyzerRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const updateLevel = () => {
        if (!analyzerRef.current) return;
        analyzerRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i] * dataArray[i];
        const rms = Math.sqrt(sum / bufferLength);
        setAudioLevel(Math.min(100, (rms / 128) * 100));
        animationRef.current = requestAnimationFrame(updateLevel);
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
      fetchStatus();
    } catch (error) {
      console.error('Failed to stop:', error);
    }
  };

  const handleSkip = async () => {
    try {
      await playoutAPI.skip();
      showInfo('Pular clip solicitado');
      setTimeout(fetchStatus, 1200);
    } catch (error) {
      showError('Erro ao pular clip');
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
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {isPlaying && (
                <Chip 
                    label="ON AIR" 
                    color="error" 
                    sx={{ 
                        fontWeight: 'bold', 
                        animation: 'blink 1.5s infinite',
                        '@keyframes blink': {
                            '0%': { opacity: 1 },
                            '50%': { opacity: 0.4 },
                            '100%': { opacity: 1 }
                        }
                    }} 
                />
            )}
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                Monitorização e Controlo Playout
            </Typography>
            <Chip 
              label={settings?.system_version || 'v1.9.2-PRO'} 
              size="small" 
              variant="outlined" 
              sx={{ borderColor: 'primary.main', color: 'primary.main', fontWeight: 'bold', height: 20, fontSize: '0.65rem' }} 
            />
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Status</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                {isPlaying ? <Chip label="ON AIR" color="success" icon={<CheckIcon />} /> : <Chip label="OFFLINE" color="error" />}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card><CardContent><Typography color="text.secondary" gutterBottom>Uptime</Typography><Typography variant="h4" sx={{ mt: 2, fontFamily: 'monospace' }}>{formatTime(status.uptime)}</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card><CardContent><Typography color="text.secondary" gutterBottom>Clips Hoje</Typography><Typography variant="h4" sx={{ mt: 2 }}>{status.clips_played_today}</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card><CardContent>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button variant="contained" color="success" onClick={handleStart} disabled={isPlaying} size="small">Start</Button>
              <Button variant="contained" color="error" onClick={handleStop} disabled={!isPlaying} size="small">Stop</Button>
              <Button variant="outlined" onClick={handleSkip} disabled={!isPlaying} size="small" startIcon={<SkipIcon />}>Skip</Button>
              <Button variant="outlined" color="info" onClick={handleDiagnose} size="small">Diagnóstico</Button>
              <Button variant="contained" color="primary" onClick={handleLaunchVLC} size="small" fullWidth sx={{ mt: 1 }}>OPEN VLC</Button>
            </Box>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Paper sx={{ mt: 3, p: 0, height: 450, position: 'relative', bgcolor: '#000', borderRadius: 2, overflow: 'hidden', border: '2px solid', borderColor: isPlaying ? 'primary.main' : '#333' }}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, p: 2, display: 'flex', justifyContent: 'space-between', bgcolor: 'rgba(0,0,0,0.5)' }}>
            <Typography variant="subtitle2" sx={{ color: '#fff' }}>LIVE PREVIEW MONITOR</Typography>
            <Box display="flex" gap={1}>
                <IconButton size="small" color="inherit" onClick={() => setPreviewPaused(!previewPaused)} sx={{ color: '#fff' }}>
                    {previewPaused ? <PlayCircleOutlineIcon /> : <PauseCircleOutlineIcon />}
                </IconButton>
                <IconButton size="small" color="inherit" onClick={() => setPreviewMuted(!previewMuted)} sx={{ color: '#fff' }}>
                    {previewMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                </IconButton>
            </Box>
        </Box>

        {isPlaying ? (
          <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
            <ReactPlayer
              key={playerKey}
              ref={playerRef}
              url={`http://${window.location.hostname}:3000/hls/stream.m3u8`}
              playing={!previewPaused}
              muted={previewMuted}
              width="100%"
              height="100%"
              onPlay={setupAudioAnalysis}
              config={{ 
                file: { 
                    forceHLS: true, 
                    attributes: { crossOrigin: 'anonymous' },
                    hlsOptions: {
                        enableWorker: true,
                        lowLatencyMode: true,
                        backBufferLength: 90,
                        liveBackBufferLength: 0,
                        liveSyncDuration: 3,
                        liveMaxLatencyDuration: 10,
                        maxLiveSyncPlaybackRate: 2
                    }
                } 
              }}
            />
            <Box sx={{ position: 'absolute', right: 20, bottom: 20, height: 300, zIndex: 50 }}>
                <LufsMeter level={audioLevel} active={isPlaying && !previewPaused && !previewMuted} />
            </Box>
          </Box>
        ) : (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
            <TvIcon sx={{ fontSize: 100, opacity: 0.1 }} />
          </Box>
        )}
      </Paper>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">Logs de Inicialização / Ações</Typography>
              <Box sx={{ bgcolor: '#1a1a1a', p: 1.5, borderRadius: 1, minHeight: 120, maxHeight: 200, overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                {startSteps.length > 0 ? startSteps.map((s, i) => (
                    <Box key={i} sx={{ color: s.type === 'success' ? '#4caf50' : s.type === 'error' ? '#f44336' : '#bbb', mb: 0.5 }}>
                        [{s.time.toLocaleTimeString()}] {s.msg}
                    </Box>
                )) : <Typography variant="caption" color="text.secondary">Aguardando ações...</Typography>}
              </Box>
              <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 3 }}>Clip Atual</Typography>
              {status.current_clip ? (
                <Box>
                  <Typography variant="body1" fontWeight="bold">{status.current_clip.filename}</Typography>
                  <LinearProgress variant="determinate" value={(status.current_clip.position / status.current_clip.duration) * 100} sx={{ i: 1 }} />
                  <Typography variant="caption">{formatTime(status.current_clip.position)} / {formatTime(status.current_clip.duration)}</Typography>
                </Box>
              ) : <Typography color="text.secondary">Nenhum clip</Typography>}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">Próximos Clips</Typography>
              {status.next_clips?.map((c, i) => (
                <Typography key={i} variant="body2" sx={{ opacity: 0.8 - (i * 0.1) }}>{i+1}. {c.filename} ({formatTime(c.duration)})</Typography>
              ))}
              {!status.next_clips?.length && <Typography color="text.secondary">Lista vazia</Typography>}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={vlcDialogOpen} onClose={() => setVlcDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>VLC Smart Launcher</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ bgcolor: '#000', p: 1, color: '#0f0', mb: 2, fontFamily: 'monospace', fontSize: '0.8rem' }}>
            {vlcLogs.map((l, i) => <div key={i}>{l.msg}</div>)}
          </Box>
          <Typography variant="caption" color="text.secondary">Comando Manual:</Typography>
          <Paper sx={{ p: 1.5, bgcolor: '#222', color: '#fff', mt: 1, display: 'flex', alignItems: 'center', border: '1px solid #444' }}>
            <code style={{ flexGrow: 1, fontSize: '0.75rem', fontFamily: 'monospace' }}>{vlcCommand}</code>
            <IconButton size="small" onClick={() => { navigator.clipboard.writeText(vlcCommand); showSuccess('Copiado!'); }} sx={{ color: '#aaa' }}>
                <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Paper>
        </DialogContent>
        <DialogActions><Button onClick={() => setVlcDialogOpen(false)}>Fechar</Button></DialogActions>
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
    </Box>
  );
}
