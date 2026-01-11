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

// Real-time LUFS Meter Component (driven by audio analyzer)


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
  const [now, setNow] = useState(new Date());
  const [previewPaused, setPreviewPaused] = useState(false);
  const [previewMuted, setPreviewMuted] = useState(true);
  
  // Audio Analysis Refs
  const playerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyzerRef = useRef(null);
  const animationRef = useRef(null);
  const sourceNodeRef = useRef(null);


  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds
    const clockInterval = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(e => console.warn('AudioContext close failed:', e));
      }
    };
  }, []);

  // Setup Audio Analysis
  const setupAudioAnalysis = useCallback(() => {
    try {
      if (!playerRef.current) {
        console.warn('PlayerRef not ready');
        return;
      }
      
      const internalPlayer = playerRef.current.getInternalPlayer();
      if (!internalPlayer || !(internalPlayer instanceof HTMLMediaElement)) {
        console.warn('ReactPlayer internal element not ready');
        return;
      }

      // Initialize AudioContext once
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AudioContext();
        analyzerRef.current = audioCtxRef.current.createAnalyser();
        analyzerRef.current.fftSize = 256;
        analyzerRef.current.smoothingTimeConstant = 0.8;
      }

      // Resume if suspended (requires user gesture)
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      // Create source node only once to avoid "already connected" error
      if (!sourceNodeRef.current) {
        sourceNodeRef.current = audioCtxRef.current.createMediaElementSource(internalPlayer);
        sourceNodeRef.current.connect(analyzerRef.current);
        analyzerRef.current.connect(audioCtxRef.current.destination);
      }

      // Start analysis loop
      const bufferLength = analyzerRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        if (!analyzerRef.current) return;
        
        analyzerRef.current.getByteFrequencyData(dataArray);
        
        // Calculate RMS (Root Mean Square) for more accurate level
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / bufferLength);
        
        // Map to 0-100 scale with sensitivity adjustment
        const normalized = Math.min(100, (rms / 128) * 100);
        setAudioLevel(normalized);
        
        animationRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (e) {
      console.error('Audio analysis setup failed:', e);
      setAudioLevel(0);
    }
  }, []);





  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const fetchStatus = async () => {
    try {
      // Fetch settings first
      const settingsRes = await settingsAPI.get();
      setSettings(settingsRes.data);

      // Then fetch playout status
      const response = await playoutAPI.status();
      setStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch status or settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      showInfo('A iniciar playout...');
      await playoutAPI.start();
      setTimeout(fetchStatus, 2000);
      showSuccess('Comando de início enviado com sucesso');
    } catch (error) {
      console.error('Failed to start playout:', error);
      showError('Erro ao iniciar playout');
    }
  };

  const handleStop = async () => {
    try {
      await playoutAPI.stop();
      fetchStatus();
    } catch (error) {
      console.error('Failed to stop playout:', error);
    }
  };

  const handleSkip = async () => {
    try {
      await playoutAPI.skip();
      fetchStatus();
    } catch (error) {
      console.error('Failed to skip clip:', error);
    }
  };

  const handleDiagnose = async () => {
    setDiagnosing(true);
    try {
      const response = await playoutAPI.diagnose();
      setDebugReport(response.data);
      setDebugDialogOpen(true);
    } catch (error) {
      console.error('Failed to diagnose playout:', error);
      showError('Erro ao obter relatório de diagnóstico');
    } finally {
      setDiagnosing(false);
    }
  };
  
  const togglePreviewPause = () => {
    setPreviewPaused(!previewPaused);
  };
  
  const handleCopyVLC = () => {
    // Generate absolute URL using origin
    const hlsUrl = `${window.location.origin}/hls/stream.m3u8`;
    navigator.clipboard.writeText(hlsUrl);
    setSnackbar({ open: true, message: `Link de saída (HLS) copiado: ${hlsUrl}` });
  };

  const handleLaunchVLC = () => {
    const hlsUrl = `${window.location.origin}/hls/stream.m3u8`;
    
    console.log('--- VLC LAUNCH DIAGNOSTICS ---');
    console.log('HLS Source:', hlsUrl);
    console.log('Platform:', navigator.platform.toLowerCase());
    console.log('User Agent:', navigator.userAgent);
    console.log('Launch Method: Direct HTTP URL (VLC will handle .m3u8)');
    
    const os = navigator.platform.toLowerCase();
    const isMac = os.includes('mac');
    const isWin = os.includes('win');
    
    let osMsg = 'Detectado: ';
    if (isMac) osMsg += 'macOS';
    else if (isWin) osMsg += 'Windows';
    else osMsg += 'Sistema';

    // Use direct HTTP URL - modern VLC handles .m3u8 files correctly
    try {
      // 1. Try direct navigation (works if VLC is default handler for .m3u8)
      window.location.href = hlsUrl;
      
      // 2. Fallback: hidden anchor click
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = hlsUrl;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, 500);

      setSnackbar({ open: true, message: `${osMsg} - A abrir stream no VLC... (Verifique se o VLC está instalado)` });
    } catch (err) {
      console.error('Launch failed:', err);
      setSnackbar({ open: true, message: 'Falha ao lançar. Copie o link e abra manualmente no VLC.' });
    }
  };

  const isPlaying = status.status === 'playing';

  // Trigger audio analysis when playing and unmuted
  useEffect(() => {
    if (isPlaying && !previewPaused && !previewMuted) {
      // Small delay to ensure player is fully loaded
      const timer = setTimeout(() => {
        setupAudioAnalysis();
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setAudioLevel(0);
    }
  }, [isPlaying, previewPaused, previewMuted, setupAudioAnalysis]);

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return '00:00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 2 }}>
            <DashboardIcon fontSize="large" />
            {settings?.channel_name || 'Cloud Onepa'}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Visão geral do estado do sistema e monitorização em tempo real.
          </Typography>
        </Box>
        <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', px: 2, py: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {now.toLocaleTimeString()}
          </Typography>
          <Typography variant="caption">
            {now.toLocaleDateString()}
          </Typography>
        </Card>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3}>
        {/* Status Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Status do Playout
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                {isPlaying ? (
                  <>
                    <CheckIcon color="success" />
                    <Chip label="ON AIR" color="success" />
                  </>
                ) : (
                  <>
                    <ErrorIcon color="error" />
                    <Chip label="STOPPED" color="error" />
                  </>
                )}
              </Box>
              {isPlaying && status.output_url && (
                <Box sx={{ mt: 2, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    LINK DE SAÍDA ({status.protocol?.toUpperCase()}):
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '0.8rem' }}>
                    {status.output_url}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Uptime Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Uptime
              </Typography>
              <Typography variant="h4" component="div" sx={{ mt: 2, fontFamily: 'monospace', fontWeight: 'bold' }}>
                {formatTime(status.uptime)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Clips Played Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Clips Reproduzidos Hoje
              </Typography>
              <Typography variant="h4" component="div" sx={{ mt: 2 }}>
                {status.clips_played_today}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Controls Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Controlos
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PlayIcon />}
                  onClick={handleStart}
                  size="small"
                  disabled={isPlaying}
                  data-help="Inicia a emissão TV. Resume o playout se estiver parado."
                >
                  Start
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<StopIcon />}
                  onClick={handleStop}
                  size="small"
                  disabled={!isPlaying}
                  data-help="Para a emissão imediatamente. A tela ficará preta ou com falha."
                >
                  Stop
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SkipIcon />}
                  onClick={handleSkip}
                  size="small"
                  disabled={!isPlaying}
                  data-help="Pula o video atual e inicia o próximo da lista imediatamente."
                >
                  Skip
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<SearchIcon />}
                  onClick={handleDiagnose}
                  size="small"
                  disabled={diagnosing}
                  data-help="Verifica se está tudo pronto para a emissão (horários, playlists, ficheiros)."
                >
                  Diagnosticar
                </Button>
                
                <Divider sx={{ width: '100%', my: 1 }} />
                
                <Typography variant="caption" color="text.secondary" sx={{ width: '100%', mb: 0.5 }}>
                  AÇÕES VLC / LINK:
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<LaunchIcon />}
                    onClick={handleLaunchVLC}
                    size="small"
                    fullWidth
                    sx={{ textTransform: 'none' }}
                  >
                    Open VLC
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<ContentCopyIcon />}
                    onClick={handleCopyVLC}
                    size="small"
                    fullWidth
                    sx={{ textTransform: 'none' }}
                  >
                    Copy Link
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Diagnostic Logs / Errors */}
      {status.last_error && (
        <Card sx={{ mb: 3, border: '1px solid', borderColor: 'error.light', bgcolor: 'error.main', color: 'error.contrastText' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ErrorIcon />
              <Typography variant="h6">Estado do Sistema - Erro Detectado</Typography>
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              {status.last_error}
            </Typography>
            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 1 }}>
              <Typography variant="body2">
                <b>Sugestões para resolver:</b><br />
                • Verifique se existe uma playlist agendada para este horário no Calendário.<br />
                • Verifique se a playlist contém ficheiros de vídeo válidos na Media Library.<br />
                • Se o erro persistir, tente clicar em STOP e depois START novamente para reiniciar o processo.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Live Preview Section */}
      <Grid container spacing={3} sx={{ mt: 0.5, mb: 3 }}>
        {/* Live Preview - Always visible (either player or placeholder) */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 0,
              height: 400,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative',
              borderRadius: 2,
              boxShadow: isPlaying ? '0 0 20px rgba(76, 175, 80, 0.3)' : 3,
              bgcolor: '#000',
              border: '2px solid',
              borderColor: isPlaying ? 'success.main' : 'rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease'
            }}
          >
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" display="flex" alignItems="center" gap={1}>
                <TvIcon color={isPlaying ? 'success' : 'disabled'} />
                <VolumeUpIcon sx={{ ml: 1, fontSize: 20, color: isPlaying ? 'primary.main' : 'disabled' }} />
                Monitor de Saída
              </Typography>
              
              {/* Toolbar Actions */}
              <Box display="flex" gap={2} alignItems="center">
                 {/* Pause Overlay Control */}
                 <Tooltip title="Local Pause (Visualização apenas)">
                    <IconButton size="small" onClick={togglePreviewPause} color="inherit" disabled={!isPlaying}>
                        {previewPaused ? <PlayCircleOutlineIcon color="warning" /> : <PauseCircleOutlineIcon />}
                    </IconButton>
                 </Tooltip>
                 
                 <Chip
                    label={status?.status === 'playing' ? "NO AR" : "OFFLINE"}
                    color={status?.status === 'playing' ? "success" : "default"}
                    size="small"
                    variant={status?.status === 'playing' ? "filled" : "outlined"}
                  />
              </Box>
            </Box>
            
            {/* Monitor Area */}
            <Box sx={{ p: '0 !important', position: 'relative', flexGrow: 1, display: 'flex' }}>
              
              {/* Main Video Area */}
              <Box sx={{ position: 'relative', flexGrow: 1, bgcolor: '#000' }}>
                {isPlaying ? (
                  <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                      <ReactPlayer
                        ref={playerRef}
                        url={`${window.location.origin}/hls/stream.m3u8`}
                        playing={!previewPaused}
                        muted={previewMuted}
                        controls={false}
                        width="100%"
                        height="100%"
                        style={{ position: 'absolute', top: 0, left: 0, objectFit: 'contain' }}
                        config={{
                          file: {
                            forceHLS: true,
                            attributes: {
                              crossOrigin: 'anonymous',
                              style: { 
                                objectFit: 'contain',
                                width: '100%',
                                height: '100%'
                              }
                            }
                          }
                        }}
                        onError={(e) => console.log('Preview error:', e)}
                      />
                      
                      {/* Audio Toggle Control */}
                      <Box sx={{ position: 'absolute', left: 10, bottom: 10, zIndex: 25 }}>
                         <Tooltip title={previewMuted ? "Ativar Áudio (Unmute)" : "Mudar Áudio (Mute)"}>
                            <IconButton 
                               onClick={() => setPreviewMuted(!previewMuted)}
                               sx={{ 
                                  bgcolor: 'rgba(0,0,0,0.5)', 
                                  color: '#fff',
                                  '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                               }}
                            >
                               {previewMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                            </IconButton>
                         </Tooltip>
                      </Box>
                      
                      {/* LUFS Meter Overlay (Transparent) */}
                      <Box sx={{ 
                          position: 'absolute', 
                          right: 15, 
                          bottom: 20, 
                          height: 'calc(100% - 40px)', 
                          maxHeight: 300,
                          zIndex: 100, // HIGH zIndex to stay on top
                          bgcolor: 'rgba(0,0,0,0.6)', 
                          p: 1.5, 
                          borderRadius: 2,
                          border: '1px solid rgba(255,255,255,0.2)',
                          backdropFilter: 'blur(10px)',
                          display: 'flex',
                          alignItems: 'center'
                      }}>
                          <LufsMeter level={audioLevel} active={isPlaying && !previewPaused && !previewMuted} />
                      </Box>
                      
                      {/* Paused Overlay */}
                      {previewPaused && (
                         <Box sx={{
                             position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                             bgcolor: 'rgba(0,0,0,0.5)',
                             display: 'flex', alignItems: 'center', justifyContent: 'center',
                             zIndex: 20
                         }}>
                              <PlayCircleOutlineIcon sx={{ fontSize: 100, color: 'rgba(255,255,255,0.8)' }} />
                         </Box>
                      )}
                  </Box>
                ) : (
                  <Box sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#1a1a1a',
                    backgroundImage: 'linear-gradient(45deg, #1a1a1a 25%, #222 25%, #222 50%, #1a1a1a 50%, #1a1a1a 75%, #222 75%, #222 100%)',
                    backgroundSize: '40px 40px',
                    color: 'rgba(255,255,255,0.3)'
                  }}>
                    <PlayIcon sx={{ fontSize: 80, mb: 2, opacity: 0.2 }} />
                    <Typography variant="h6" sx={{ opacity: 0.5 }}>AGUARDANDO EMISSÃO</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.4 }}>O playout está parado ou em standby</Typography>
                  </Box>
                )}
                
                {/* Uptime / REC Status Overlay (Only show if playing and not paused, or custom logic) */}
                <Box sx={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    bgcolor: isPlaying ? 'rgba(76, 175, 80, 0.8)' : 'rgba(0,0,0,0.6)',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    zIndex: 10,
                    backdropFilter: 'blur(4px)'
                  }}>
                    <Box sx={{
                      width: 8,
                      height: 8,
                      bgcolor: isPlaying ? '#fff' : '#f44336',
                      borderRadius: '50%',
                      animation: isPlaying ? 'pulse 1.5s infinite' : 'none'
                    }} />
                    <Typography variant="caption" sx={{ color: '#fff', fontWeight: 'bold' }}>
                      {isPlaying ? 'LIVE PREVIEW' : 'OFFLINE'}
                    </Typography>
                </Box>
              </Box>
              
            </Box> {/* End Monitor Area */}

            {/* Bottom Info Bar */}
            {isPlaying && status.current_clip && (
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  right: 0, 
                  bgcolor: 'rgba(0,0,0,0.7)', 
                  p: 1,
                  backdropFilter: 'blur(4px)',
                  borderTop: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <Typography variant="caption" sx={{ color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%', fontWeight: 'bold' }}>
                      REC: {status.current_clip.filename}
                    </Box>
                    <span style={{ fontFamily: 'monospace' }}>{formatTime(status.current_clip.position)} / {formatTime(status.current_clip.duration)}</span>
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={status.current_clip.duration ? (status.current_clip.position / status.current_clip.duration) * 100 : 0} 
                    sx={{ mt: 0.5, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.1)' }}
                  />
                </Box>
              )}
            </Paper>
          </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Current Clip Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Clip Atual
              </Typography>
              {status.current_clip ? (
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {status.current_clip.filename || 'Sem nome'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Duração: {formatTime(status.current_clip.duration)}
                  </Typography>
                </Box>
              ) : (
                <Typography color="text.secondary">
                  Nenhum clip em reprodução
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Next Clips Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Próximos Clips
              </Typography>
              {status.next_clips && status.next_clips.length > 0 ? (
                <Box>
                  {status.next_clips.slice(0, 5).map((clip, index) => (
                    <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                      {index + 1}. {clip.filename || 'Sem nome'}
                    </Typography>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">
                  Nenhum clip agendado
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* Diagnostic Dialog */}
      <Dialog open={debugDialogOpen} onClose={() => setDebugDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SearchIcon color="primary" /> Assistente de Diagnóstico e Configuração
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Siga os passos abaixo para garantir que o seu canal está pronto para transmitir:
          </Typography>
          {debugReport && (
            <List>
              {/* Passo 0: Estado do Motor */}
              <ListItem>
                <ListItemIcon>
                  {isPlaying ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
                </ListItemIcon>
                <ListItemText 
                  primary="1. Estado do Sistema" 
                  secondary={isPlaying ? 'Motor de playout está em execução' : 'O sistema está parado ou em standby'} 
                />
                {!isPlaying && (
                  <Button variant="contained" size="small" color="success" onClick={handleStart}>Ligar</Button>
                )}
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  {debugReport.has_active_schedule ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
                </ListItemIcon>
                <ListItemText 
                  primary="2. Horário Agendado" 
                  secondary={debugReport.has_active_schedule ? `Ok: Existe um evento agendado para agora` : 'Erro: Não existe nada agendado para este momento'} 
                />
                {!debugReport.has_active_schedule && (
                  <Button variant="outlined" size="small" onClick={() => navigate('/calendar')}>Agendar</Button>
                )}
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  {debugReport.has_playlist ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
                </ListItemIcon>
                <ListItemText 
                  primary="3. Playlist Válida" 
                  secondary={debugReport.has_playlist ? `Ok: Playlist carregada com ${debugReport.media_files_count} clips` : 'Erro: A playlist associada está vazia ou não existe'} 
                />
                {!debugReport.has_playlist && (
                  <Button variant="outlined" size="small" onClick={() => navigate('/playlists')}>Ver Playlists</Button>
                )}
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  {debugReport.missing_media_files.length === 0 ? <CheckIcon color="success" /> : <WarningIcon color="warning" />}
                </ListItemIcon>
                <ListItemText 
                  primary="4. Integridade dos Ficheiros" 
                  secondary={debugReport.missing_media_files.length === 0 ? 'Ok: Todos os vídeos foram localizados no disco' : `Aviso: Faltam ${debugReport.missing_media_files.length} ficheiros físicos`} 
                />
                {debugReport.missing_media_files.length > 0 && (
                  <Button variant="outlined" size="small" onClick={() => navigate('/media')}>Ver Media</Button>
                )}
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  {debugReport.overlay_configured ? <CheckIcon color="success" /> : <InfoIcon color="info" />}
                </ListItemIcon>
                <ListItemText 
                  primary="5. Marca D'água (Overlay)" 
                  secondary={debugReport.overlay_configured ? 'Ok: Logotipo configurado corretamente' : 'Info: Nenhum logotipo de canal ativo (opcional)'} 
                />
                {!debugReport.overlay_configured && (
                  <Button variant="outlined" size="small" onClick={() => navigate('/settings?tab=playout&focus=overlay')}>Configurar</Button>
                )}
              </ListItem>

              {debugReport.warnings.length > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1, borderLeft: '4px solid orange' }}>
                  <Typography variant="subtitle2" gutterBottom><b>Recomendações:</b></Typography>
                  {debugReport.warnings.map((w, i) => (
                    <Typography key={i} variant="caption" display="block">• {w}</Typography>
                  ))}
                </Box>
              )}
              
              {debugReport.missing_media_files.length > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom><b>Ficheiros em Falta (Ação necessária):</b></Typography>
                  <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Os seguintes ficheiros foram removidos ou movidos do servidor:</Typography>
                  {debugReport.missing_media_files.map((f, i) => (
                    <Typography key={i} variant="caption" display="block" sx={{ fontStyle: 'italic' }}>• {f.split('/').pop()}</Typography>
                  ))}
                </Box>
              )}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDebugDialogOpen(false)}>Fechar</Button>
          {!isPlaying && debugReport?.has_active_schedule && debugReport?.has_playlist && (
            <Button variant="contained" color="success" onClick={() => { setDebugDialogOpen(false); handleStart(); }}>
              FORÇAR INÍCIO DE CANAL
            </Button>
          )}
        </DialogActions>
      </Dialog>
      {/* Copy Feedback Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
