import React from 'react';
import { Box, Typography } from '@mui/material';

function LufsMeter({ level = 0, active }) {
  // Normalize level (0-100)
  const displayLevel = active ? Math.min(100, Math.max(0, level)) : 0;
  
  // Color based on level
  let barColor = 'linear-gradient(to top, #4caf50, #8bc34a)'; // Normal
  if (displayLevel > 85) barColor = 'linear-gradient(to top, #4caf50 60%, #ffeb3b 80%, #f44336)'; // Hot
  else if (displayLevel > 70) barColor = 'linear-gradient(to top, #4caf50 70%, #ffeb3b)'; // Warning

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: 20, gap: 0.5, alignItems: 'center' }}>
      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#fff', fontWeight: 'bold', textShadow: '1px 1px 2px #000' }}>0</Typography>
      <Box sx={{ flexGrow: 1, width: 8, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1, position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
        {/* Real-time Level Bar */}
        <Box sx={{
           position: 'absolute', bottom: 0, left: 0, right: 0, 
           height: `${displayLevel}%`, 
           background: barColor,
           transition: 'height 0.1s ease-out'
        }} />
        
        {/* Peak Indicator */}
        {active && displayLevel > 80 && (
           <Box sx={{
              position: 'absolute', top: 5, left: 0, right: 0, 
              height: 2, 
              bgcolor: '#f44336',
              boxShadow: '0 0 5px #f44336',
              animation: 'meter-peak-flash 0.5s infinite'
           }} />
        )}
      </Box>
      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#fff', textShadow: '1px 1px 2px #000' }}>-60</Typography>
      <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'primary.main', textShadow: '1px 1px 2px #000', mt: 0.5 }}>LUFS</Typography>
      <style>{`
        @keyframes meter-peak-flash { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
      `}</style>
    </Box>
  );
}

export default LufsMeter;
