import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { authAPI, settingsAPI } from '../services/api';
import useAuthStore from '../stores/authStore';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';
import { useEffect } from 'react';

export default function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [version, setVersion] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { t } = useTranslation();

  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await settingsAPI.get();
        // Initialize branding_type if missing, similar to Settings.jsx
        if (!response.data.branding_type) {
          response.data.branding_type = 'video';
        }
        setSettings(response.data);
        setVersion(response.data.system_version);
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(credentials.username, credentials.password);
      const { token, user } = response.data;

      login(user, token);
      navigate('/');
    } catch (err) {
      const statusCode = err.response?.status || t('common.error');
      const errorMessage = err.response?.data?.error || t('login.messages.login_failed');
      setError(`[${statusCode}] ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100vw',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      bgcolor: '#000'
    }}>
      {/* Local CSS Background — no external dependencies, works fully offline */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        background: 'radial-gradient(ellipse at 20% 30%, rgba(0,229,255,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(100,0,255,0.06) 0%, transparent 60%), linear-gradient(160deg, #060810 0%, #0a0d18 40%, #080b14 100%)',
        overflow: 'hidden',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 80px, rgba(0,229,255,0.015) 80px, rgba(0,229,255,0.015) 81px), repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(0,229,255,0.015) 80px, rgba(0,229,255,0.015) 81px)',
          pointerEvents: 'none',
        }
      }}>
        {/* Neon glow orbs */}
        <Box sx={{ position: 'absolute', top: '15%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,255,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <Box sx={{ position: 'absolute', bottom: '10%', right: '5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(100,0,255,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <Box sx={{ position: 'absolute', top: '50%', right: '20%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,255,0.05) 0%, transparent 70%)', filter: 'blur(30px)' }} />
      </Box>

      {/* Login Content */}
      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 10 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box sx={{ alignSelf: 'flex-end', mb: 2 }}>
            <LanguageSelector />
          </Box>
          <Box sx={{ mb: 4, textAlign: 'center', position: 'relative' }}>
            {/* Environment Badge removed from top, consolidated at bottom */}

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {(!settings || settings.branding_type === 'video') ? (
                <video
                  src={settings?.logo_path || "/assets/protected/Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4"}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="logo-animated"
                  style={{ height: '140px', objectFit: 'contain', filter: 'drop-shadow(0 0 20px rgba(0, 229, 255, 0.5))' }}
                  onError={(e) => {
                    console.error('Video logo failed to load:', e);
                    e.target.src = "/assets/protected/Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4";
                  }}
                />
              ) : (
                <Box
                  component="img"
                  src={settings?.logo_path || "/assets/protected/Cloud_Onepa_Playout_Infinity_Logo_remodelado.png"}
                  className="logo-animated"
                  sx={{
                    height: '140px',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 0 20px rgba(0, 229, 255, 0.5))',
                    animation: 'float 6s ease-in-out infinite'
                  }}
                  onError={(e) => {
                    console.error('Image logo failed to load:', e);
                    e.target.style.display = 'none';
                  }}
                />
              )}
              <Typography variant="h3" className="neon-text" sx={{ fontWeight: 800, letterSpacing: '-0.05em', mt: -1 }}>
                ONEPA PLAYOUT
              </Typography>
            </Box>
          </Box>

          <Paper className="glass-panel" sx={{ p: 4, width: '100%', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, textAlign: 'center', letterSpacing: 1 }}>
              {t('login.restricted_area')}
            </Typography>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  bgcolor: 'rgba(244, 67, 54, 0.15)',
                  border: '2px solid rgba(244, 67, 54, 0.5)',
                  color: '#ff1744',
                  fontWeight: 700,
                  '& .MuiAlert-icon': {
                    color: '#ff1744'
                  }
                }}
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label={t('login.username')}
                variant="outlined"
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255, 255, 255, 0.03)' },
                  '& label': { fontWeight: 700, fontSize: '0.7rem' }
                }}
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                disabled={loading}
                required
              />
              <TextField
                fullWidth
                label={t('login.password')}
                type="password"
                variant="outlined"
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255, 255, 255, 0.03)' },
                  '& label': { fontWeight: 700, fontSize: '0.7rem' }
                }}
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                disabled={loading}
                required
              />
              <Button
                fullWidth
                variant="contained"
                type="submit"
                size="large"
                sx={{
                  mt: 4,
                  py: 1.5,
                  fontWeight: 800,
                  letterSpacing: 2,
                  boxShadow: '0 0 20px rgba(0, 229, 255, 0.2)',
                  '&:hover': {
                    boxShadow: '0 0 30px rgba(0, 229, 255, 0.4)',
                  }
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : t('login.submit')}
              </Button>
            </form>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Box sx={{
                display: 'inline-block',
                px: 2,
                py: 0.5,
                bgcolor: 'error.main',
                borderRadius: 1,
                boxShadow: '0 0 15px rgba(211, 47, 47, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <Typography variant="caption" sx={{ color: 'white', fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase', fontSize: '0.6rem' }}>
                  {t('login.test_mode')} - {version || 'v2.2.0-ALPHA.34-PRO'}
                </Typography>
              </Box>
            </Box>
            {/* Removed the environment badge from here */}
          </Paper>

          <Box sx={{ mt: 4, p: 1, px: 2, borderRadius: 10, bgcolor: 'rgba(50, 50, 60, 0.5)' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: '0.6rem' }}>
              VERSION: v2.2.0-ALPHA.34-PRO
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
