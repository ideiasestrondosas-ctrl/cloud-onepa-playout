import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    CardHeader,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
    CircularProgress,
    Tooltip,
    LinearProgress,
    Divider,
    Tab,
    Tabs
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    PlayArrow as PlayIcon,
    Stop as StopIcon,
    Refresh as RefreshIcon,
    LiveTv as LiveTvIcon,
    CloudUpload as StreamIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Circle as CircleIcon
} from '@mui/icons-material';
import { liveInputsAPI, socialStreamsAPI } from '../services/api';
import { useTranslation } from 'react-i18next';

const protocolOptions = [
    { value: 'rtmp', label: 'RTMP' },
    { value: 'srt', label: 'SRT' },
    { value: 'webrtc', label: 'WebRTC' },
    { value: 'ndi', label: 'NDI' },
    { value: 'sdi', label: 'SDI' }
];

const platformOptions = [
    { value: 'youtube', label: 'YouTube Live' },
    { value: 'facebook', label: 'Facebook Live' }
];

const statusColors = {
    active: 'success',
    inactive: 'default',
    error: 'error',
    connecting: 'warning'
};

export default function LiveInputs() {
    const { t } = useTranslation();
    const [tabValue, setTabValue] = useState(0);
    const [liveInputs, setLiveInputs] = useState([]);
    const [socialStreams, setSocialStreams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Dialog states
    const [inputDialogOpen, setInputDialogOpen] = useState(false);
    const [streamDialogOpen, setStreamDialogOpen] = useState(false);
    const [editingInput, setEditingInput] = useState(null);
    const [editingStream, setEditingStream] = useState(null);

    // Form states
    const [inputForm, setInputForm] = useState({
        name: '',
        protocol: 'rtmp',
        url: '',
        port: '',
        preview_url: ''
    });

    const [streamForm, setStreamForm] = useState({
        name: '',
        platform: 'youtube',
        stream_key: '',
        stream_url: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [inputsRes, streamsRes] = await Promise.all([
                liveInputsAPI.list(),
                socialStreamsAPI.list()
            ]);
            setLiveInputs(inputsRes.data);
            setSocialStreams(streamsRes.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputSubmit = async () => {
        try {
            const data = {
                ...inputForm,
                port: inputForm.port ? parseInt(inputForm.port) : null
            };

            if (editingInput) {
                await liveInputsAPI.update(editingInput.id, data);
            } else {
                await liveInputsAPI.create(data);
            }

            setInputDialogOpen(false);
            setEditingInput(null);
            setInputForm({ name: '', protocol: 'rtmp', url: '', port: '', preview_url: '' });
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleStreamSubmit = async () => {
        try {
            if (editingStream) {
                await socialStreamsAPI.update(editingStream.id, streamForm);
            } else {
                await socialStreamsAPI.create(streamForm);
            }

            setStreamDialogOpen(false);
            setEditingStream(null);
            setStreamForm({ name: '', platform: 'youtube', stream_key: '', stream_url: '' });
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteInput = async (id) => {
        if (!window.confirm(t('liveInputs.confirmDelete'))) return;
        try {
            await liveInputsAPI.delete(id);
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteStream = async (id) => {
        if (!window.confirm(t('liveInputs.confirmDelete'))) return;
        try {
            await socialStreamsAPI.delete(id);
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleStartStream = async (id) => {
        try {
            await socialStreamsAPI.start(id);
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleStopStream = async (id) => {
        try {
            await socialStreamsAPI.stop(id);
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const openInputDialog = (input = null) => {
        if (input) {
            setEditingInput(input);
            setInputForm({
                name: input.name,
                protocol: input.protocol,
                url: input.url,
                port: input.port || '',
                preview_url: input.preview_url || ''
            });
        } else {
            setEditingInput(null);
            setInputForm({ name: '', protocol: 'rtmp', url: '', port: '', preview_url: '' });
        }
        setInputDialogOpen(true);
    };

    const openStreamDialog = (stream = null) => {
        if (stream) {
            setEditingStream(stream);
            setStreamForm({
                name: stream.name,
                platform: stream.platform,
                stream_key: stream.stream_key || '',
                stream_url: stream.stream_url || ''
            });
        } else {
            setEditingStream(null);
            setStreamForm({ name: '', platform: 'youtube', stream_key: '', stream_url: '' });
        }
        setStreamDialogOpen(true);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active':
                return <CheckCircleIcon color="success" />;
            case 'error':
                return <ErrorIcon color="error" />;
            case 'connecting':
                return <CircleIcon color="warning" className="pulse" />;
            default:
                return <CircleIcon color="disabled" />;
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    {t('liveInputs.title')}
                </Typography>
                <Button
                    variant="contained"
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

            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
                <Tab icon={<LiveTvIcon />} label={t('liveInputs.liveInputs')} />
                <Tab icon={<StreamIcon />} label={t('liveInputs.socialStreaming')} />
            </Tabs>

            {/* Live Inputs Tab */}
            {tabValue === 0 && (
                <>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => openInputDialog()}
                        >
                            {t('liveInputs.addInput')}
                        </Button>
                    </Box>

                    <Grid container spacing={3}>
                        {liveInputs.map((input) => (
                            <Grid item xs={12} md={6} lg={4} key={input.id}>
                                <Card>
                                    <CardHeader
                                        avatar={getStatusIcon(input.status)}
                                        title={input.name}
                                        subheader={input.protocol.toUpperCase()}
                                        action={
                                            <Box>
                                                <IconButton onClick={() => openInputDialog(input)}>
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton onClick={() => handleDeleteInput(input.id)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        }
                                    />
                                    <CardContent>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            {t('liveInputs.url')}: {input.url}
                                        </Typography>
                                        {input.port && (
                                            <Typography variant="body2" color="text.secondary">
                                                {t('liveInputs.port')}: {input.port}
                                            </Typography>
                                        )}
                                        <Box sx={{ mt: 2 }}>
                                            <Chip
                                                label={input.status}
                                                color={statusColors[input.status] || 'default'}
                                                size="small"
                                            />
                                        </Box>
                                        {input.preview_url && (
                                            <Box sx={{ mt: 2, position: 'relative', paddingTop: '56.25%' }}>
                                                <iframe
                                                    src={input.preview_url}
                                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                                                    title={input.name}
                                                />
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {liveInputs.length === 0 && (
                        <Paper sx={{ p: 4, textAlign: 'center', mt: 4 }}>
                            <LiveTvIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                            <Typography color="text.secondary">
                                {t('liveInputs.noInputs')}
                            </Typography>
                        </Paper>
                    )}
                </>
            )}

            {/* Social Streaming Tab */}
            {tabValue === 1 && (
                <>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => openStreamDialog()}
                        >
                            {t('liveInputs.addStream')}
                        </Button>
                    </Box>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('liveInputs.status')}</TableCell>
                                    <TableCell>{t('liveInputs.name')}</TableCell>
                                    <TableCell>{t('liveInputs.platform')}</TableCell>
                                    <TableCell>{t('liveInputs.streamUrl')}</TableCell>
                                    <TableCell align="right">{t('liveInputs.actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {socialStreams.map((stream) => (
                                    <TableRow key={stream.id}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {getStatusIcon(stream.status)}
                                                <Chip
                                                    label={stream.status}
                                                    color={statusColors[stream.status] || 'default'}
                                                    size="small"
                                                />
                                            </Box>
                                        </TableCell>
                                        <TableCell>{stream.name}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={stream.platform === 'youtube' ? 'YouTube' : 'Facebook'}
                                                color={stream.platform === 'youtube' ? 'error' : 'primary'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{stream.stream_url || '-'}</TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                {stream.status === 'active' ? (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="error"
                                                        startIcon={<StopIcon />}
                                                        onClick={() => handleStopStream(stream.id)}
                                                    >
                                                        {t('liveInputs.stop')}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="success"
                                                        startIcon={<PlayIcon />}
                                                        onClick={() => handleStartStream(stream.id)}
                                                    >
                                                        {t('liveInputs.start')}
                                                    </Button>
                                                )}
                                                <IconButton size="small" onClick={() => openStreamDialog(stream)}>
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => handleDeleteStream(stream.id)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {socialStreams.length === 0 && (
                        <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
                            <StreamIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                            <Typography color="text.secondary">
                                {t('liveInputs.noStreams')}
                            </Typography>
                        </Paper>
                    )}
                </>
            )}

            {/* Add/Edit Live Input Dialog */}
            <Dialog open={inputDialogOpen} onClose={() => setInputDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingInput ? t('liveInputs.editInput') : t('liveInputs.addInput')}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label={t('liveInputs.inputName')}
                            value={inputForm.name}
                            onChange={(e) => setInputForm({ ...inputForm, name: e.target.value })}
                            fullWidth
                            required
                        />
                        <FormControl fullWidth>
                            <InputLabel>{t('liveInputs.protocol')}</InputLabel>
                            <Select
                                value={inputForm.protocol}
                                label={t('liveInputs.protocol')}
                                onChange={(e) => setInputForm({ ...inputForm, protocol: e.target.value })}
                            >
                                {protocolOptions.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label={t('liveInputs.url')}
                            value={inputForm.url}
                            onChange={(e) => setInputForm({ ...inputForm, url: e.target.value })}
                            fullWidth
                            required
                            placeholder="rtmp://localhost/live or srt://localhost:1234"
                        />
                        <TextField
                            label={t('liveInputs.port')}
                            type="number"
                            value={inputForm.port}
                            onChange={(e) => setInputForm({ ...inputForm, port: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label={t('liveInputs.previewUrl')}
                            value={inputForm.preview_url}
                            onChange={(e) => setInputForm({ ...inputForm, preview_url: e.target.value })}
                            fullWidth
                            placeholder="http://localhost:8080/hls/stream.m3u8"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setInputDialogOpen(false)}>{t('common.cancel')}</Button>
                    <Button onClick={handleInputSubmit} variant="contained">
                        {t('common.save')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add/Edit Social Stream Dialog */}
            <Dialog open={streamDialogOpen} onClose={() => setStreamDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingStream ? t('liveInputs.editStream') : t('liveInputs.addStream')}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label={t('liveInputs.streamName')}
                            value={streamForm.name}
                            onChange={(e) => setStreamForm({ ...streamForm, name: e.target.value })}
                            fullWidth
                            required
                        />
                        <FormControl fullWidth>
                            <InputLabel>{t('liveInputs.platform')}</InputLabel>
                            <Select
                                value={streamForm.platform}
                                label={t('liveInputs.platform')}
                                onChange={(e) => setStreamForm({ ...streamForm, platform: e.target.value })}
                            >
                                {platformOptions.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label={t('liveInputs.streamKey')}
                            value={streamForm.stream_key}
                            onChange={(e) => setStreamForm({ ...streamForm, stream_key: e.target.value })}
                            fullWidth
                            type="password"
                        />
                        <TextField
                            label={t('liveInputs.streamUrl')}
                            value={streamForm.stream_url}
                            onChange={(e) => setStreamForm({ ...streamForm, stream_url: e.target.value })}
                            fullWidth
                            placeholder="rtmp://a.rtmp.youtube.com/live2"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStreamDialogOpen(false)}>{t('common.cancel')}</Button>
                    <Button onClick={handleStreamSubmit} variant="contained">
                        {t('common.save')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
