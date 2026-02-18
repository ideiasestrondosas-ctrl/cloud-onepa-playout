import React from 'react';
import { Box } from '@mui/material';

const ProtocolIcon = ({ protocol, size = 60, active = false }) => {
  const iconStyles = {
    width: size,
    height: size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    position: 'relative',
  };

  const getIconContent = () => {
    switch (protocol) {
      case 'MASTER':
        return (
          <Box sx={{
            ...iconStyles,
            background: active
              ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
              : 'linear-gradient(135deg, #555 0%, #333 100%)',
          }}>
            <Box sx={{
              width: size * 0.5,
              height: size * 0.5,
              background: 'white',
              borderRadius: '50%',
              boxShadow: active ? '0 0 0 4px rgba(255,255,255,0.3)' : 'none',
              opacity: active ? 1 : 0.5,
            }} />
          </Box>
        );

      case 'RTMP':
        return (
          <Box sx={{
            ...iconStyles,
            background: active
              ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
              : 'linear-gradient(135deg, #2a4a6e 0%, #1a3a4e 100%)',
          }}>
            <Box sx={{
              width: size * 0.625,
              height: size * 0.075,
              background: 'white',
              borderRadius: size * 0.0375,
              position: 'absolute',
              opacity: active ? 1 : 0.4,
            }} />
            <Box sx={{
              width: size * 0.075,
              height: size * 0.625,
              background: 'white',
              borderRadius: size * 0.0375,
              position: 'absolute',
              opacity: active ? 1 : 0.4,
            }} />
          </Box>
        );

      case 'HLS':
        return (
          <Box sx={{
            ...iconStyles,
            background: active
              ? 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
              : 'linear-gradient(135deg, #5a3040 0%, #4a3010 100%)',
            flexDirection: 'column',
            gap: size * 0.075,
          }}>
            <Box sx={{ width: size * 0.375, height: size * 0.1, background: 'white', borderRadius: size * 0.05, opacity: active ? 1 : 0.4 }} />
            <Box sx={{ width: size * 0.625, height: size * 0.1, background: 'white', borderRadius: size * 0.05, opacity: active ? 1 : 0.4 }} />
            <Box sx={{ width: size * 0.5, height: size * 0.1, background: 'white', borderRadius: size * 0.05, opacity: active ? 1 : 0.4 }} />
          </Box>
        );

      case 'SRT':
        return (
          <Box sx={{
            ...iconStyles,
            background: active
              ? 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
              : 'linear-gradient(135deg, #1a4040 0%, #1a0a30 100%)',
          }}>
            <Box sx={{
              width: size * 0.625,
              height: size * 0.6875,
              background: 'white',
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              opacity: active ? 1 : 0.35,
            }} />
          </Box>
        );

      case 'UDP':
        // Redesigned: Broadcast antenna with signal rings — visually distinct and meaningful
        return (
          <Box sx={{
            ...iconStyles,
            background: active
              ? 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)'
              : 'linear-gradient(135deg, #3a2a00 0%, #2a2000 100%)',
            overflow: 'hidden',
          }}>
            {/* Antenna pole */}
            <Box sx={{
              position: 'absolute',
              bottom: size * 0.12,
              left: '50%',
              transform: 'translateX(-50%)',
              width: size * 0.1,
              height: size * 0.45,
              background: 'white',
              borderRadius: size * 0.05,
              opacity: active ? 1 : 0.5,
            }} />
            {/* Signal rings (3 arcs) - drawn as partial borders */}
            {[0.28, 0.42, 0.56].map((radiusFactor, i) => (
              <Box key={i} sx={{
                position: 'absolute',
                bottom: size * 0.38,
                left: '50%',
                transform: 'translateX(-50%)',
                width: size * radiusFactor,
                height: size * radiusFactor * 0.55,
                border: `${size * 0.06}px solid white`,
                borderBottom: 'none',
                borderRadius: `${size * radiusFactor}px ${size * radiusFactor}px 0 0`,
                opacity: active ? (1 - i * 0.2) : (0.2 + i * 0.05),
                boxShadow: active ? `0 0 ${size * 0.1}px rgba(255,210,0,0.6)` : 'none',
              }} />
            ))}
            {/* Center dot at antenna top */}
            <Box sx={{
              position: 'absolute',
              bottom: size * 0.52,
              left: '50%',
              transform: 'translateX(-50%)',
              width: size * 0.13,
              height: size * 0.13,
              background: active ? '#fff' : 'rgba(255,255,255,0.3)',
              borderRadius: '50%',
              boxShadow: active ? `0 0 ${size * 0.15}px rgba(255,210,0,0.9)` : 'none',
            }} />
          </Box>
        );

      case 'DASH':
        return (
          <Box sx={{
            ...iconStyles,
            background: active
              ? 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
              : 'linear-gradient(135deg, #4a2020 0%, #3a1530 100%)',
            gap: size * 0.1,
          }}>
            <Box sx={{ width: size * 0.075, height: size * 0.5625, background: 'white', borderRadius: size * 0.0375, opacity: active ? 1 : 0.35 }} />
            <Box sx={{ width: size * 0.075, height: size * 0.6875, background: 'white', borderRadius: size * 0.0375, opacity: active ? 1 : 0.35 }} />
            <Box sx={{ width: size * 0.075, height: size * 0.4375, background: 'white', borderRadius: size * 0.0375, opacity: active ? 1 : 0.35 }} />
          </Box>
        );

      case 'MSS':
        return (
          <Box sx={{
            ...iconStyles,
            background: active
              ? 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
              : 'linear-gradient(135deg, #3a2510 0%, #2a1508 100%)',
          }}>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(3, ${size * 0.15}px)`,
              gap: size * 0.075,
            }}>
              {[...Array(9)].map((_, i) => (
                <Box key={i} sx={{
                  width: size * 0.15,
                  height: size * 0.15,
                  background: 'white',
                  borderRadius: size * 0.025,
                  opacity: active ? 1 : 0.35,
                }} />
              ))}
            </Box>
          </Box>
        );

      case 'RTSP':
        return (
          <Box sx={{
            ...iconStyles,
            background: active
              ? 'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)'
              : 'linear-gradient(135deg, #3a1a50 0%, #2a0a3a 100%)',
          }}>
            <Box sx={{
              width: 0,
              height: 0,
              borderLeft: `${size * 0.375}px solid white`,
              borderTop: `${size * 0.225}px solid transparent`,
              borderBottom: `${size * 0.225}px solid transparent`,
              marginLeft: size * 0.1,
              opacity: active ? 1 : 0.35,
            }} />
          </Box>
        );

      case 'WebRTC':
        return (
          <Box sx={{
            ...iconStyles,
            background: active
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #1a2050 0%, #1a0a30 100%)',
          }}>
            <Box sx={{
              width: size * 0.4375,
              height: size * 0.4375,
              border: `${size * 0.05}px solid white`,
              borderRadius: '50%',
              opacity: active ? 1 : 0.35,
              position: 'relative',
              '&::before, &::after': {
                content: '""',
                position: 'absolute',
                width: size * 0.1875,
                height: size * 0.1875,
                background: 'white',
                borderRadius: '50%',
                left: '50%',
                transform: 'translateX(-50%)',
              },
              '&::before': {
                top: -size * 0.3125,
              },
              '&::after': {
                bottom: -size * 0.3125,
              },
            }} />
          </Box>
        );

      default:
        return null;
    }
  };

  return getIconContent();
};

export default ProtocolIcon;
