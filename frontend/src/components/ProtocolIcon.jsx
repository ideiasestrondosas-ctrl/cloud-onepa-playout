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
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          }}>
            <Box sx={{
              width: size * 0.5,
              height: size * 0.5,
              background: 'white',
              borderRadius: '50%',
              boxShadow: '0 0 0 4px rgba(255,255,255,0.3)',
            }} />
          </Box>
        );

      case 'RTMP':
        return (
          <Box sx={{
            ...iconStyles,
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          }}>
            <Box sx={{
              width: size * 0.625,
              height: size * 0.075,
              background: 'white',
              borderRadius: size * 0.0375,
              position: 'absolute',
            }} />
            <Box sx={{
              width: size * 0.075,
              height: size * 0.625,
              background: 'white',
              borderRadius: size * 0.0375,
              position: 'absolute',
            }} />
          </Box>
        );

      case 'HLS':
        return (
          <Box sx={{
            ...iconStyles,
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            flexDirection: 'column',
            gap: size * 0.075,
          }}>
            <Box sx={{ width: size * 0.375, height: size * 0.1, background: 'white', borderRadius: size * 0.05 }} />
            <Box sx={{ width: size * 0.625, height: size * 0.1, background: 'white', borderRadius: size * 0.05 }} />
            <Box sx={{ width: size * 0.5, height: size * 0.1, background: 'white', borderRadius: size * 0.05 }} />
          </Box>
        );

      case 'SRT':
        return (
          <Box sx={{
            ...iconStyles,
            background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
          }}>
            <Box sx={{
              width: size * 0.625,
              height: size * 0.6875,
              background: 'white',
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            }} />
          </Box>
        );

      case 'UDP':
        return (
          <Box sx={{
            ...iconStyles,
            background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            justifyContent: 'space-around',
            padding: size * 0.1875,
          }}>
            {[...Array(4)].map((_, i) => (
              <Box key={i} sx={{
                width: size * 0.15,
                height: size * 0.15,
                background: 'white',
                borderRadius: '50%',
              }} />
            ))}
          </Box>
        );

      case 'DASH':
        return (
          <Box sx={{
            ...iconStyles,
            background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
            gap: size * 0.1,
          }}>
            <Box sx={{ width: size * 0.075, height: size * 0.5625, background: 'white', borderRadius: size * 0.0375 }} />
            <Box sx={{ width: size * 0.075, height: size * 0.6875, background: 'white', borderRadius: size * 0.0375 }} />
            <Box sx={{ width: size * 0.075, height: size * 0.4375, background: 'white', borderRadius: size * 0.0375 }} />
          </Box>
        );

      case 'MSS':
        return (
          <Box sx={{
            ...iconStyles,
            background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
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
                }} />
              ))}
            </Box>
          </Box>
        );

      case 'RTSP':
        return (
          <Box sx={{
            ...iconStyles,
            background: 'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)',
          }}>
            <Box sx={{
              width: 0,
              height: 0,
              borderLeft: `${size * 0.375}px solid white`,
              borderTop: `${size * 0.225}px solid transparent`,
              borderBottom: `${size * 0.225}px solid transparent`,
              marginLeft: size * 0.1,
            }} />
          </Box>
        );

      case 'WebRTC':
        return (
          <Box sx={{
            ...iconStyles,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}>
            <Box sx={{
              width: size * 0.4375,
              height: size * 0.4375,
              border: `${size * 0.05}px solid white`,
              borderRadius: '50%',
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
