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
import { playoutAPI } from '../services/api';
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
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
        <Grid item xs={12}>
          <Card sx={{ bgcolor: '#000', border: '1px solid rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
            <CardContent sx={{ p: '0 !important', position: 'relative', pt: '50%' }}>
              <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
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
                    }
                  }}
                  onError={(e) => console.log('Preview error:', e)}
                />
              </Box>
              <Box sx={{ 
                position: 'absolute', 
                top: 16, 
                left: 16, 
                bgcolor: 'rgba(0,0,0,0.6)', 
                px: 1.5, 
                py: 0.5, 
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                zIndex: 10
              }}>
                <Box sx={{ width: 8, height: 8, bgcolor: isPlaying ? '#4caf50' : '#f44336', borderRadius: '50%' }} />
                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 'bold' }}>
                  LIVE PREVIEW
                </Typography>
              </Box>
            </CardContent>
          </Card>
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
          <SearchIcon color="primary" /> Relatório de Diagnóstico de Arranque
        </DialogTitle>
        <DialogContent dividers>
          {debugReport && (
            <List>
              <ListItem>
                <ListItemIcon>
                  {debugReport.has_active_schedule ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
                </ListItemIcon>
                <ListItemText 
                  primary="Horário Ativo" 
                  secondary={debugReport.has_active_schedule ? `Encontrado: ${debugReport.active_schedule_id}` : 'Nenhum horário ativo configurado para este momento'} 
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
                  primary="Playlist Associada" 
                  secondary={debugReport.has_playlist ? `Encontrada: ${debugReport.playlist_id} (${debugReport.media_files_count} clips)` : 'Não existe playlist válida no horário atual'} 
                />
                {!debugReport.has_playlist && (
                  <Button variant="outlined" size="small" onClick={() => navigate('/playlists')}>Criar</Button>
                )}
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  {debugReport.missing_media_files.length === 0 ? <CheckIcon color="success" /> : <WarningIcon color="warning" />}
                </ListItemIcon>
                <ListItemText 
                  primary="Ficheiros Media" 
                  secondary={debugReport.missing_media_files.length === 0 ? 'Todos os ficheiros estão acessíveis' : `Faltam ${debugReport.missing_media_files.length} ficheiros no disco`} 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  {debugReport.overlay_configured ? <CheckIcon color="success" /> : <InfoIcon color="info" />}
                </ListItemIcon>
                <ListItemText 
                  primary="Configuração de Overlay" 
                  secondary={debugReport.overlay_configured ? 'Logo configurado e ativo' : 'Nenhum logo configurado'} 
                />
                {!debugReport.overlay_configured && (
                  <Button variant="outlined" size="small" onClick={() => navigate('/settings?tab=playout&focus=overlay')}>Ativar</Button>
                )}
              </ListItem>

              {debugReport.warnings.length > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom><b>Alertas:</b></Typography>
                  {debugReport.warnings.map((w, i) => (
                    <Typography key={i} variant="caption" display="block">• {w}</Typography>
                  ))}
                </Box>
              )}
              
              {debugReport.missing_media_files.length > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom><b>Ficheiros Faltantes:</b></Typography>
                  {debugReport.missing_media_files.map((f, i) => (
                    <Typography key={i} variant="caption" display="block">• {f.split('/').pop()}</Typography>
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
              Iniciar Agora
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
