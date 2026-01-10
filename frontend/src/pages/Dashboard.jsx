import { useState, useEffect } from 'react';
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
} from '@mui/material';
import { playoutAPI, settingsAPI } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

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
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds
    const clockInterval = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, []);

  const fetchStatus = async () => {
    try {
      // Fetch settings first
      const settingsRes = await settingsAPI.get();
      setSettings(settingsRes.data);
      if (settingsRes.data.channel_name) {
        // We can use this to set document title or local state
      }

      // Then fetch playout status
      const response = await playoutAPI.status();
      setStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch status or settings:', error);
      // Optionally, show an error notification if critical
      // showError('Erro ao carregar dados do dashboard.');
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

  const isPlaying = status.status === 'playing';

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 2 }}>
            <DashboardIcon fontSize="large" />
            {settings?.channel_name || 'Dashboard de Playout'}
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
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {status.protocol?.toUpperCase()}: {status.output_url}
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
              <Typography variant="h4" component="div" sx={{ mt: 2 }}>
                {Math.floor(status.uptime / 3600)}h {Math.floor((status.uptime % 3600) / 60)}m
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
          <Card>
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
                <TvIcon color={status?.status === 'playing' ? 'success' : 'disabled'} />
                Monitor de Saída
              </Typography>
              <Chip
                label={status?.status === 'playing' ? "NO AR" : "OFFLINE"}
                color={status?.status === 'playing' ? "success" : "default"}
                size="small"
                variant={status?.status === 'playing' ? "filled" : "outlined"}
              />
            </Box>
            <Box sx={{ p: '0 !important', position: 'relative', pt: '56.25%', flexGrow: 1 }}>
              <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                {isPlaying ? (
                  <ReactPlayer
                    url="/hls/preview.m3u8"
                    playing
                    muted
                    controls
                    width="100%"
                    height="100%"
                    config={{
                      file: {
                        forceHLS: true,
                        attributes: {
                          style: { objectFit: 'contain' }
                        }
                      }
                    }}
                    onError={(e) => console.log('Preview error:', e)}
                  />
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
              </Box>
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
                  <Typography variant="caption" sx={{ color: '#fff', display: 'flex', justifyContent: 'space-between' }}>
                    <span>REC: {status.current_clip.filename}</span>
                    <span>{Math.floor(status.current_clip.position || 0)}s / {status.current_clip.duration || 0}s</span>
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={status.current_clip.duration ? (status.current_clip.position / status.current_clip.duration) * 100 : 0} 
                    sx={{ mt: 0.5, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.1)' }}
                  />
                </Box>
              )}
            </Box>
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
                  <Typography variant="body1">
                    {status.current_clip.filename || 'Sem nome'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Duração: {status.current_clip.duration || 0}s
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
    </Box>
  );
}
