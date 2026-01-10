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
import { authAPI } from '../services/api';
import useAuthStore from '../stores/authStore';

export default function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

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
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <img 
          src="/api/media/30172608-5714-4aa7-a5d6-a862d8a1d5aa/stream" 
          alt="Cloud Onepa Playout" 
          className="logo-animated"
          style={{ height: '120px', marginBottom: '8px', objectFit: 'contain' }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }} align="center">
          Cloud Onepa Playout
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Sistema de Automação de Playout 24/7
        </Typography>
        
        <Paper sx={{ p: 4, mt: 3, width: '100%' }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Login
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              margin="normal"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              disabled={loading}
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              margin="normal"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              disabled={loading}
              required
            />
            <Button
              fullWidth
              variant="contained"
              type="submit"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Login'}
            </Button>
          </form>
          
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Cloud Onepa Playout v1.8.0-PRO
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              © 2026 Onepa Technologies
            </Typography>
          </Box>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Default: admin / admin
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
