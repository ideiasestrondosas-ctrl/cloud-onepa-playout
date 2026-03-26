import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip, IconButton,
  Tooltip, CircularProgress, Grid, Paper, Alert,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FiberManualRecord as RecordIcon,
  Videocam as VideocamIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { channelsAPI, channelPlayoutAPI } from '../services/api';
import { useChannel } from '../contexts/ChannelContext';
import { useTranslation } from 'react-i18next';

// ── Lightweight per-channel HLS player ────────────────────────────────────────
// Mirrors the approach in MultiChannelPanel but refined for the Mosaic view.
function ChannelHlsPreview({ slug }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const src = `/hls-live/${slug}/index.m3u8`;
    const video = videoRef.current;
    if (!video) return;

    let hls = null;
    const isNativeHls = video.canPlayType('application/vnd.apple.mpegurl') !== '';

    if (isNativeHls) {
      video.src = src;
      video.play().catch(() => {});
    } else {
      import('hls.js').then(({ default: Hls }) => {
        if (!Hls.isSupported()) {
          video.src = src;
          video.play().catch(() => {});
          return;
        }
        hls = new Hls({ lowLatencyMode: true, backBufferLength: 8, maxBufferLength: 15, liveSyncDurationCount: 2 });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      }).catch(() => {
        video.src = src;
        video.play().catch(() => {});
      });
    }

    return () => {
      if (hls) { hls.destroy(); }
      video.src = '';
    };
  }, [slug]);

  return (
    <video
      ref={videoRef}
      muted
      playsInline
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
    />
  );
}

// ── Channel Brick ─────────────────────────────────────────────────────────────
function ChannelBrick({ channel, status, onActivate, isActive }) {
  const { t } = useTranslation();
  const isLive = status === 'playing';

  return (
    <Card
      onClick={onActivate}
      sx={{
        cursor: 'pointer',
        position: 'relative',
        border: isActive ? '3px solid' : (isLive ? '2px solid' : '1px solid'),
        borderColor: isActive ? 'primary.main' : (isLive ? 'success.main' : 'rgba(255,255,255,0.08)'),
        boxShadow: isActive ? '0 0 25px rgba(0,229,255,0.4)' : 'none',
        animation: isActive ? 'brickPulse 2s infinite' : 'none',
        transition: 'all 0.25s ease',
        background: '#000',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: isActive ? '0 0 35px rgba(0,229,255,0.6)' : (isLive ? '0 0 24px rgba(76, 175, 80, 0.3)' : '0 0 16px rgba(0,229,255,0.2)'),
          borderColor: isActive ? 'primary.light' : (isLive ? 'success.main' : 'primary.main'),
        },
        '@keyframes brickPulse': {
          '0%, 100%': { boxShadow: '0 0 15px rgba(0,229,255,0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(0,229,255,0.6)' },
        },
      }}
    >
      {/* Video or Offline placeholder */}
      <Paper
        sx={{
          position: 'relative',
          paddingTop: '56.25%',
          bgcolor: '#0a0b10',
          overflow: 'hidden',
          borderRadius: 0,
        }}
      >
        {isLive ? (
          <ChannelHlsPreview slug={channel.slug} />
        ) : (
          <Box
            sx={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
            }}
          >
            <VideocamIcon sx={{ fontSize: 36, color: 'rgba(255,255,255,0.15)' }} />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: 1 }}>
              {t('dashboard.offline', 'OFFLINE')}
            </Typography>
          </Box>
        )}

        {/* LIVE badge */}
        {isLive && (
          <Box
            sx={{
              position: 'absolute', top: 8, left: 8, zIndex: 2,
              display: 'flex', alignItems: 'center', gap: 0.5,
              bgcolor: 'error.main', color: '#fff',
              px: 1, py: 0.3, borderRadius: 1,
              animation: 'mosaicPulse 2s infinite',
              '@keyframes mosaicPulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.65 },
              },
            }}
          >
            <RecordIcon sx={{ fontSize: 10 }} />
            <Typography variant="caption" sx={{ fontWeight: 900, fontSize: '0.65rem', letterSpacing: 1 }}>{t('masterDashboard.live', 'LIVE')}</Typography>
          </Box>
        )}

        {/* Open-in-full icon */}
        <Box sx={{ position: 'absolute', top: 6, right: 6, zIndex: 2, opacity: 0.45, '&:hover': { opacity: 1 } }}>
          <OpenInNewIcon sx={{ fontSize: 16, color: '#fff' }} />
        </Box>
      </Paper>

      {/* Info bar */}
      <CardContent sx={{ p: '10px 12px !important', background: 'rgba(10,11,16,0.95)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 0.5, color: isLive ? 'success.light' : 'text.secondary', fontSize: '0.72rem' }} noWrap>
            {channel.name}
          </Typography>
          <Chip
            size="small"
            label={isLive ? t('dashboard.on_air', 'LIVE') : t('dashboard.offline', 'OFF')}
            color={isLive ? 'success' : 'default'}
            sx={{ height: 16, fontSize: '0.6rem', fontWeight: 900, letterSpacing: 0.5, '& .MuiChip-label': { px: 0.8 } }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MasterDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setActiveChannelId } = useChannel();

  const [channels, setChannels] = useState([]);
  const [playoutStatus, setPlayoutStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (manual = false) => {
    try {
      if (manual) setRefreshing(true);
      const channelsRes = await channelsAPI.list();
      let list = channelsRes.data || [];

      const defaultId = '00000000-0000-0000-0000-000000000001';
      if (!list.find(c => c.id === defaultId)) {
        try {
          const def = await channelsAPI.get(defaultId);
          list = [...list, def.data];
        } catch { /* ignore */ }
      }
      setChannels(list);

      const statuses = await Promise.all(
        list.map(async (ch) => {
          try {
            const res = await channelPlayoutAPI.status(ch.id);
            return { [ch.id]: res.data.status };
          } catch {
            return { [ch.id]: 'stopped' };
          }
        })
      );
      setPlayoutStatus(statuses.reduce((acc, cur) => ({ ...acc, ...cur }), {}));
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleActivate = (channelId) => {
    setActiveChannelId(channelId);
    navigate('/');
  };

  // Grid columns: 1 for <=1, 2 for <=4, 3 for <=9, 4 for >9
  const getGridCols = (count) => {
    if (count <= 1) return 12;
    if (count <= 4) return 6;
    if (count <= 9) return 4;
    return 3;
  };
  const colSize = getGridCols(channels.length);
  const liveCount = Object.values(playoutStatus).filter(s => s === 'playing').length;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.8rem' }} className="neon-text">
            {t('masterDashboard.title', 'Master Dashboard')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>
            {t('masterDashboard.subtitle', 'Multi-Channel Mosaic Monitor')}
            {lastUpdated && (
              <> · {t('health.lastUpdate', 'Last update')}: {lastUpdated.toLocaleTimeString()}</>
            )}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip
            label={`${liveCount} / ${channels.length} ${t('masterDashboard.live', 'LIVE')}`}
            color={liveCount > 0 ? 'success' : 'default'}
            sx={{ fontWeight: 800, letterSpacing: 0.5 }}
          />
          <Tooltip title={t('common.refresh', 'Refresh')}>
            <IconButton onClick={() => fetchData(true)} disabled={refreshing} size="small"
              sx={{ bgcolor: 'rgba(0,229,255,0.08)', '&:hover': { bgcolor: 'rgba(0,229,255,0.16)' } }}>
              {refreshing ? <CircularProgress size={18} /> : <RefreshIcon sx={{ color: 'primary.main' }} />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      {/* Mosaic Grid */}
      {channels.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <VideocamIcon sx={{ fontSize: 64, color: 'grey.600', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {t('multiChannel.noChannels', 'No channels yet')}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {channels.map((channel) => (
            <Grid item xs={12} sm={colSize} key={channel.id}>
              <ChannelBrick
                channel={channel}
                status={playoutStatus[channel.id] || 'stopped'}
                onActivate={() => handleActivate(channel.id)}
                isActive={channel.id === useChannel().activeChannelId}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <Typography variant="caption" sx={{ display: 'block', mt: 3, color: 'text.disabled', textAlign: 'center' }}>
        {t('masterDashboard.hint', 'Click on a channel to switch context and open the main Dashboard.')}
      </Typography>
    </Box>
  );
}
