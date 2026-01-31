import React from 'react';
import { Box, Typography } from '@mui/material';

function LufsMeter({ level = 0, active }) {
  // Normalize level (0-100)
  const displayLevel = active ? Math.min(100, Math.max(0, level)) : 0;
  
  // Color based on level
  let barColor = 'linear-gradient(to top, #4158D0, #C850C0, #FFCC70)'; // Professional Gradient
  if (displayLevel > 90) barColor = 'linear-gradient(to top, #4caf50 60%, #ffeb3b 80%, #f44336)'; // Clipping
  
  // Target Level Marker (-23 LUFS target for EBU R128 is approx 62% height)
  const targetPos = 62;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: 32, gap: 0.5, alignItems: 'center' }}>
      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#fff', fontWeight: 'bold', textShadow: '1px 1px 2px #000' }}>0dB</Typography>
      <Box sx={{ flexGrow: 1, width: 12, bgcolor: 'transparent', borderRadius: 1, position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
        {/* Target Marker Link */}
        <Box sx={{ 
            position: 'absolute', bottom: `${targetPos}%`, left: -2, right: -2, 
            height: 2, bgcolor: '#00e5ff', zIndex: 10,
            boxShadow: '0 0 5px #00e5ff',
            '&::after': { content: '"-23"', position: 'absolute', right: -18, top: -5, fontSize: '0.5rem', color: '#00e5ff' }
        }} />

        {/* Real-time Level Bar */}
        <Box sx={{
           position: 'absolute', bottom: 0, left: 0, right: 0, 
           height: `${displayLevel}%`, 
           background: barColor,
           transition: 'height 0.05s ease-out',
           opacity: active ? 1 : 0.3
        }} />
        
        {/* Scale Ticks */}
        {[20, 40, 60, 80].map(tick => (
            <Box key={tick} sx={{ position: 'absolute', bottom: `${tick}%`, left: 0, right: 0, height: 1, bgcolor: 'rgba(255,255,255,0.1)' }} />
        ))}
      </Box>
      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#fff', textShadow: '1px 1px 2px #000' }}>-60</Typography>
      <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'primary.main', textShadow: '1px 1px 2px #000' }}>LUFS</Typography>
      <style>{`
        @keyframes meter-peak-flash { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
      `}</style>
    </Box>
  );
}

export default LufsMeter;
