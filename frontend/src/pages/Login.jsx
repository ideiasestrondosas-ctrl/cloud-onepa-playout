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
import { useEffect } from 'react';

export default function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [version, setVersion] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await settingsAPI.get();
        setVersion(response.data.system_version);
      } catch (err) {
        console.error('Failed to fetch version:', err);
      }
    };
    fetchVersion();
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
      const statusCode = err.response?.status || 'Network Error';
      const errorMessage = err.response?.data?.error || 'Login failed. Please try again.';
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
      {/* Dynamic Background */}
      <Box sx={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: 0,
        '&:after': {
          content: '""',
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(10, 11, 16, 0.4) 0%, rgba(10, 11, 16, 0.9) 100%)',
          zIndex: 1
        }
      }}>
        <Box sx={{ 
          width: '100%', 
          height: '100%', 
          backgroundImage: 'url("https://images.unsplash.com/photo-1593642532400-2e9124a350eb?q=80&w=2070&auto=format&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(10px) brightness(0.5)',
          transform: 'scale(1.1)'
        }} />
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
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <video 
              src="/assets/protected/Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4" 
              autoPlay 
              loop 
              muted 
              playsInline
              className="logo-animated"
              style={{ height: '160px', objectFit: 'contain', filter: 'drop-shadow(0 0 20px rgba(0, 229, 255, 0.5))' }}
            />
            <Typography variant="h3" className="neon-text" sx={{ fontWeight: 800, letterSpacing: '-0.05em', mt: -2 }}>
              ONEPA PLAYOUT
            </Typography>

          </Box>
          
          <Paper className="glass-panel" sx={{ p: 4, width: '100%', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, textAlign: 'center', letterSpacing: 1 }}>
              ÁREA RESTRITA
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
                label="UTILIZADOR"
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
                label="PASSWORD"
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
                {loading ? <CircularProgress size={24} color="inherit" /> : 'ENTRAR'}
              </Button>
            </form>
            
            <Box sx={{ mt: 4, textAlign: 'center', opacity: 0.6 }}>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                ONEPA TECHNOLOGIES • {version || 'v2.2.0-ALPHA.1'}
              </Typography>
            </Box>
          </Paper>

          <Box sx={{ mt: 4, p: 1, px: 2, borderRadius: 10, bgcolor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(4px)' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 600, fontSize: '0.65rem' }}>
              REDE PROTEGIDA • ACESSO MONITORIZADO
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

