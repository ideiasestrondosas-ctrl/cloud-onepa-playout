import { useState, useEffect } from 'react';
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
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  SkipNext as SkipIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { playoutAPI } from '../services/api';

export default function Dashboard() {
  const [status, setStatus] = useState({
    status: 'stopped',
    current_clip: null,
    next_clips: [],
    uptime: 0,
    clips_played_today: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
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
      await playoutAPI.start();
      fetchStatus();
    } catch (error) {
      console.error('Failed to start playout:', error);
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

  const isPlaying = status.status === 'playing';

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

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
                {isPlaying ? (
                  <>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<StopIcon />}
                      onClick={handleStop}
                      size="small"
                    >
                      Stop
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<SkipIcon />}
                      onClick={handleSkip}
                      size="small"
                    >
                      Skip
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<PlayIcon />}
                    onClick={handleStart}
                    size="small"
                  >
                    Start
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

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

        {/* Preview Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Preview
              </Typography>
              <Box
                sx={{
                  width: '100%',
                  height: 400,
                  bgcolor: 'background.default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 1,
                }}
              >
                <Typography color="text.secondary">
                  Preview em tempo real - Em desenvolvimento
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
