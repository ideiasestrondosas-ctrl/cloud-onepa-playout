import { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    CardHeader,
    Typography,
    Chip,
    IconButton,
    Button,
    Paper,
    LinearProgress,
    Tooltip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
    Divider,
    Avatar,
    Badge
} from '@mui/material';
import {
    PlayArrow as PlayIcon,
    Stop as StopIcon,
    SkipNext as SkipIcon,
    LiveTv as LiveTvIcon,
    Videocam as VideocamIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Refresh as RefreshIcon,
    Settings as SettingsIcon,
    FiberManualRecord as RecordIcon
} from '@mui/icons-material';
import { channelsAPI, playoutAPI } from '../services/api';
import { useTranslation } from 'react-i18next';

const statusConfig = {
    playing: { color: 'success', icon: <LiveTvIcon />, label: 'ON AIR' },
    paused: { color: 'warning', icon: <PauseIcon />, label: 'PAUSED' },
    stopped: { color: 'default', icon: <StopIcon />, label: 'STOPPED' },
    error: { color: 'error', icon: <ErrorIcon />, label: 'ERROR' }
};

function PauseIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
        </svg>
    );
}

export default function MultiChannelPanel() {
    const { t } = useTranslation();
    const [channels, setChannels] = useState([]);
    const [playoutStatus, setPlayoutStatus] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const channelsRes = await channelsAPI.list();
            setChannels(channelsRes.data || []);

            // Get playout status for each channel
            const statusPromises = channelsRes.data.map(async (channel) => {
                try {
                    const statusRes = await playoutAPI.status(channel.id);
                    return { [channel.id]: statusRes.data };
                } catch {
                    return { [channel.id]: { status: 'stopped' } };
                }
            });

            const statuses = await Promise.all(statusPromises);
            const mergedStatus = statuses.reduce((acc, curr) => ({ ...acc, ...curr }), {});
            setPlayoutStatus(mergedStatus);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStartChannel = async (channelId) => {
        try {
            await playoutAPI.start(channelId);
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleStopChannel = async (channelId) => {
        try {
            await playoutAPI.stop(channelId);
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSkipChannel = async (channelId) => {
        try {
            await playoutAPI.skip(channelId);
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const getChannelStatus = (channelId) => {
        const status = playoutStatus[channelId];
        return status?.status || 'stopped';
    };

    const getStatusChip = (channelId) => {
        const status = getChannelStatus(channelId);
        const config = statusConfig[status] || statusConfig.stopped;

        return (
            <Chip
                icon={config.icon}
                label={config.label}
                color={config.color}
                size="small"
                sx={{
                    fontWeight: 'bold',
                    '& .MuiChip-icon': { color: 'inherit' }
                }}
            />
        );
    };

    // Helper function to safely extract clip name from various data types
    const getClipName = (clip) => {
        if (!clip) return '-';
        if (typeof clip === 'string') return clip.substring(0, 20);
        if (typeof clip === 'object') return clip.title?.substring(0, 20) || clip.name?.substring(0, 20) || JSON.stringify(clip).substring(0, 20);
        return String(clip).substring(0, 20);
    };

    if (loading) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>{t('common.loading')}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    {t('multiChannel.title')}
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchData}
                >
                    {t('common.refresh')}
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {channels.map((channel) => {
                    const status = getChannelStatus(channel.id);
                    const isLive = status === 'playing';

                    return (
                        <Grid item xs={12} md={6} lg={4} key={channel.id}>
                            <Card
                                sx={{
                                    position: 'relative',
                                    border: isLive ? '2px solid' : '1px solid',
                                    borderColor: isLive ? 'success.main' : 'divider',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        boxShadow: 6,
                                        transform: 'translateY(-2px)'
                                    }
                                }}
                            >
                                {isLive && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            zIndex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            bgcolor: 'error.main',
                                            color: 'white',
                                            px: 1,
                                            py: 0.5,
                                            borderRadius: 1,
                                            animation: 'pulse 2s infinite',
                                            '@keyframes pulse': {
                                                '0%': { opacity: 1 },
                                                '50%': { opacity: 0.7 },
                                                '100%': { opacity: 1 }
                                            }
                                        }}
                                    >
                                        <RecordIcon sx={{ fontSize: 12, animation: 'blink 1s infinite' }} />
                                        <Typography variant="caption" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>
                                            LIVE
                                        </Typography>
                                    </Box>
                                )}

                                <CardHeader
                                    avatar={
                                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                                            {channel.name?.charAt(0) || 'C'}
                                        </Avatar>
                                    }
                                    title={
                                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                            {channel.name}
                                        </Typography>
                                    }
                                    subheader={
                                        <Typography variant="caption" color="text.secondary">
                                            {channel.description || t('multiChannel.noDescription')}
                                        </Typography>
                                    }
                                    action={getStatusChip(channel.id)}
                                />

                                <CardContent>
                                    {/* Preview Area */}
                                    <Paper
                                        sx={{
                                            position: 'relative',
                                            paddingTop: '56.25%', // 16:9 aspect ratio
                                            bgcolor: 'grey.900',
                                            mb: 2,
                                            borderRadius: 1,
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {channel.preview_url ? (
                                            <iframe
                                                src={channel.preview_url}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    border: 'none'
                                                }}
                                                title={`${channel.name} preview`}
                                            />
                                        ) : (
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexDirection: 'column',
                                                    gap: 1
                                                }}
                                            >
                                                <VideocamIcon sx={{ fontSize: 48, color: 'grey.700' }} />
                                                <Typography variant="caption" color="text.secondary">
                                                    {t('multiChannel.noPreview')}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Paper>

                                    {/* Status Info */}
                                    <Box sx={{ mb: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {t('multiChannel.currentClip')}
                                            </Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                                {getClipName(playoutStatus[channel.id]?.current_clip)}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {t('multiChannel.nextUp')}
                                            </Typography>
                                            <Typography variant="caption">
                                                {getClipName(playoutStatus[channel.id]?.next_clip)}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {t('multiChannel.bitrate')}
                                            </Typography>
                                            <Typography variant="caption">
                                                {playoutStatus[channel.id]?.bitrate || '0'} kbps
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Divider sx={{ mb: 2 }} />

                                    {/* Controls */}
                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                        {status === 'playing' ? (
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="error"
                                                startIcon={<StopIcon />}
                                                onClick={() => handleStopChannel(channel.id)}
                                            >
                                                {t('multiChannel.stop')}
                                            </Button>
                                        ) : (
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="success"
                                                startIcon={<PlayIcon />}
                                                onClick={() => handleStartChannel(channel.id)}
                                            >
                                                {t('multiChannel.play')}
                                            </Button>
                                        )}
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            startIcon={<SkipIcon />}
                                            onClick={() => handleSkipChannel(channel.id)}
                                            disabled={status !== 'playing'}
                                        >
                                            {t('multiChannel.skip')}
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {channels.length === 0 && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <LiveTvIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        {t('multiChannel.noChannels')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t('multiChannel.noChannelsHint')}
                    </Typography>
                </Paper>
            )}
        </Box>
    );
}
