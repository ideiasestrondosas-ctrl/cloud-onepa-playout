import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Typography, Fade, Chip, CircularProgress } from '@mui/material';
import Hls from 'hls.js';
import LufsMeter from './LufsMeter';
import SensorsIcon from '@mui/icons-material/Sensors';
import SignalCellularConnectedNoInternet0BarIcon from '@mui/icons-material/SignalCellularConnectedNoInternet0Bar';
import WifiTetheringIcon from '@mui/icons-material/WifiTethering';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

/**
 * Professional Video Preview Component
 * Handles HLS playback with low-latency optimizations, live overlays, and signals.
 */
const VideoPreview = React.forwardRef(({
  src,
  muted = true,
  playing = true,
  onReady,
  onPlay,
  onError,
  audioLevel = 0,
  showMeter = true,
  status = 'playing'
}, ref) => {
  const localVideoRef = useRef(null);
  const videoRef = ref || localVideoRef;
  const hlsRef = useRef(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Initialize HLS
  useEffect(() => {
    if (!src || !videoRef.current) return;

    const video = videoRef.current;

    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        manifestLoadingMaxRetry: 10,
        levelLoadingMaxRetry: 10,
      });

      hls.loadSource(src);
      hls.attachMedia(video);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsReady(true);
        if (playing) video.play().catch(e => console.warn('[VideoPreview] Autoplay blocked:', e));
        if (onReady) onReady();
      });

      // Listen for play event on the video element itself even with HLS
      video.addEventListener('play', () => {
        if (onPlay) onPlay();
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('[VideoPreview] Fatal HLS error:', data.type);
          setHasError(true);
          if (onError) onError(data);
          hls.destroy();
        }
      });

      hls.on(Hls.Events.BUFFER_APPENDING, () => setIsBuffering(true));
      hls.on(Hls.Events.BUFFER_APPENDED, () => setIsBuffering(false));

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        setIsReady(true);
        if (playing) video.play();
        if (onReady) onReady();
      });
      video.addEventListener('error', (e) => {
        setHasError(true);
        if (onError) onError(e);
      });

      video.addEventListener('play', () => {
        if (onPlay) onPlay();
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, onReady, onError]);

  // Handle playing/muted props
  useEffect(() => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.play().catch(() => { });
    } else {
      videoRef.current.pause();
    }
    videoRef.current.muted = muted;
  }, [playing, muted]);

  const isStreamActive = status === 'playing' && isReady && !hasError;

  return (
    <Box sx={{
      position: 'relative',
      width: '100%',
      aspectRatio: '16/9',
      bgcolor: '#000',
      borderRadius: 2,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.05)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      '& video': {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        filter: isStreamActive ? 'none' : 'grayscale(100%) brightness(0.5)'
      }
    }}>
      <video ref={videoRef} playsInline crossOrigin="anonymous" />

      {/* Professional Overlays */}
      <Fade in={isStreamActive}>
        <Box sx={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <Chip
            icon={<SensorsIcon sx={{ fontSize: '1rem !important', animation: 'pulse 1.5s infinite' }} />}
            label="LIVE"
            size="small"
            sx={{
              bgcolor: 'rgba(244, 67, 54, 0.9)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.7rem',
              height: 24,
              '& .MuiChip-icon': { color: 'inherit' },
              boxShadow: '0 0 10px rgba(244, 67, 54, 0.5)'
            }}
          />
        </Box>
      </Fade>

      {/* Signal Lost Overlay */}
      {!isStreamActive && (
        <Box sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          zIndex: 5,
          background: 'radial-gradient(circle, rgba(20,20,25,0.8) 0%, rgba(5,6,8,0.95) 100%)',
          backdropFilter: 'blur(4px)'
        }}>
          <SignalCellularConnectedNoInternet0BarIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.2)' }} />
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em' }}>
            SIGNAL LOST
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.2)' }}>
            {status !== 'playing' ? 'STREAM STOPPED' : 'CONNECTING TO SOURCE...'}
          </Typography>
        </Box>
      )}

      {/* Enhanced Status Indicators */}

      {/* Connecting Status */}
      {status === 'playing' && !isReady && !hasError && (
        <Box sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          px: 1.5,
          py: 0.75,
          borderRadius: 1.5,
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <WifiTetheringIcon sx={{ fontSize: 16, color: '#ff9800', animation: 'pulse 1.5s infinite' }} />
          <Typography variant="caption" sx={{ color: '#ff9800', fontWeight: 600, fontSize: '0.7rem' }}>
            Connecting...
          </Typography>
        </Box>
      )}

      {/* Buffering Status */}
      {isStreamActive && isBuffering && (
        <Box sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          zIndex: 6,
          background: 'rgba(0,0,0,0.3)'
        }}>
          <CircularProgress size={40} thickness={2} sx={{ color: 'primary.main' }} />
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.1em' }}>
            BUFFERING...
          </Typography>
        </Box>
      )}

      {/* Error Status */}
      {hasError && (
        <Box sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: 'rgba(244, 67, 54, 0.2)',
          backdropFilter: 'blur(8px)',
          px: 1.5,
          py: 0.75,
          borderRadius: 1.5,
          border: '1px solid rgba(244, 67, 54, 0.4)'
        }}>
          <ErrorOutlineIcon sx={{ fontSize: 16, color: '#f44336' }} />
          <Typography variant="caption" sx={{ color: '#f44336', fontWeight: 600, fontSize: '0.7rem' }}>
            Error
          </Typography>
        </Box>
      )}

      {/* Stream Offline Status */}
      {status !== 'playing' && !hasError && (
        <Box sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          px: 1.5,
          py: 0.75,
          borderRadius: 1.5,
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <CloudOffIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} />
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: '0.7rem' }}>
            Offline
          </Typography>
        </Box>
      )}

      {/* Audio Meter Integration */}
      {showMeter && (
        <Box sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          height: '60%',
          zIndex: 10,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)',
          borderRadius: 1.5,
          padding: 1,
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <LufsMeter level={audioLevel} active={isStreamActive} />
        </Box>
      )}

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </Box>
  );
});

export default VideoPreview;
