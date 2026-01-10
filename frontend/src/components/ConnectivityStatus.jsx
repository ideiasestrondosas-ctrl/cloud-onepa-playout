import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import axios from 'axios';

export default function ConnectivityStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await axios.get('/api/health');
        setIsOnline(true);
      } catch (error) {
        setIsOnline(false);
      }
    };

    const interval = setInterval(checkHealth, 10000);
    checkHealth(); // Initial check

    return () => clearInterval(interval);
  }, []);

  if (isOnline) return null;

  return (
    <Box sx={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      zIndex: 9999, 
      bgcolor: 'error.main', 
      color: 'white', 
      py: 0.5, 
      textAlign: 'center',
      boxShadow: 3
    }}>
      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
        ⚠️ BACKEND OFFLINE - Verifique a ligação ao servidor ou se o contentor ARRANCOU.
      </Typography>
    </Box>
  );
}
