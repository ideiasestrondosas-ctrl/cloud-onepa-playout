/**
 * OutputTab.jsx - Configurações de Saída do Playout
 * Extraído do Settings.jsx principal para otimização de RAM e manutenibilidade.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    ToggleButtonGroup,
    ToggleButton,
    Chip,
    Checkbox,
    Divider,
    Tooltip,
    Stack,
    Switch,
    IconButton,
    Alert
} from '@mui/material';
import {
    Tv as TvIcon,
    SettingsInputComponent as PlatformIcon,
    Language as LanguageIcon,
    ContentCopy as ContentCopyIcon
} from '@mui/icons-material';

const OutputTab = ({ 
    settings, 
    setSettings, 
    handleOutputTypeChange, 
    handleResolutionChange, 
    handleBitrateChange,
    handleCopyToClipboard 
}) => {
    const { t } = useTranslation();

    return (
        <Box>
            {/* Protocolo Section */}
            <Paper className="glass-panel" sx={{ p: 2, mb: 2 }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800, fontSize: '1rem' }}>
                            {t('settings.output.header.title')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>
                            {t('settings.output.header.subtitle')}
                        </Typography>
                    </Box>
                    <Chip 
                        label={t('settings.output.header.status_ready')} 
                        color="success" 
                        sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }} 
                    />
                </Box>

                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800, letterSpacing: 1, fontSize: '0.75rem' }}>
                    {t('settings.output.main.title')}
                </Typography>
                
                <ToggleButtonGroup
                    value={settings.outputType}
                    exclusive
                    onChange={(e, val) => val && handleOutputTypeChange(val)}
                    fullWidth
                    sx={{ mb: 2, gap: 1 }}
                >
                    {['rtmp', 'srt', 'udp', 'hls', 'desktop'].map(type => (
                        <ToggleButton
                            key={type}
                            value={type}
                            sx={{
                                borderRadius: '8px !important',
                                py: 0.5,
                                border: '1px solid rgba(255,255,255,0.05) !important',
                                fontWeight: 800,
                                fontSize: '0.7rem',
                                '&.Mui-selected': { bgcolor: 'primary.main', color: '#000', '&:hover': { bgcolor: 'primary.light' } }
                            }}
                        >
                            {type.toUpperCase()}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>

                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label={t('settings.output.main.url_label')}
                            value={settings.outputUrl}
                            onChange={(e) => setSettings({ ...settings, outputUrl: e.target.value })}
                            InputProps={{ sx: { bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3, fontWeight: 700, fontFamily: 'monospace' } }}
                            helperText={
                                settings.outputType === 'udp'
                                    ? t('settings.output.main.udp_tip')
                                    : ""
                            }
                            FormHelperTextProps={{ sx: { color: 'warning.main', fontWeight: 'bold' } }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>{t('settings.output.main.resolution')}</InputLabel>
                            <Select 
                                value={settings.resolution} 
                                label={t('settings.output.main.resolution')} 
                                onChange={(e) => handleResolutionChange(e.target.value)} 
                                sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3 }}
                            >
                                <MenuItem value="3840x2160">{t('settings.output.main.resolutions.4k')}</MenuItem>
                                <MenuItem value="1920x1080">{t('settings.output.main.resolutions.1080p')}</MenuItem>
                                <MenuItem value="1280x720">{t('settings.output.main.resolutions.720p')}</MenuItem>
                                <MenuItem value="640x360">{t('settings.output.main.resolutions.360p')}</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label={t('settings.output.main.bitrate')}
                            value={settings.videoBitrate}
                            onChange={(e) => handleBitrateChange(e.target.value)}
                            InputProps={{ sx: { bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3 } }}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Secondary Protocols Section */}
            <Paper className="glass-panel" sx={{ p: 1.5, mb: 2 }}>
                <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800, fontSize: '0.9rem' }}>
                        {t('settings.output.multi.title')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>
                        {t('settings.output.multi.subtitle')}
                    </Typography>
                </Box>

                <Grid container spacing={1}>
                    {[
                        { id: 'rtmp', label: 'RTMP Server', icon: <PlatformIcon /> },
                        { id: 'srt', label: 'SRT (Caller/Listener)', icon: <PlatformIcon /> },
                        { id: 'udp', label: 'UDP Streaming', icon: <PlatformIcon /> },
                        { id: 'hls', label: 'HLS Distribution', icon: <TvIcon /> }
                    ].map(proto => (
                        <Grid item xs={12} md={3} sm={6} key={proto.id}>
                            <Box sx={{ p: 1, py: 0.5, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ p: 0.5, bgcolor: 'rgba(0,229,255,0.1)', borderRadius: 1.5, color: 'primary.main' }}>
                                        {React.cloneElement(proto.icon, { fontSize: 'small' })}
                                    </Box>
                                    <Typography variant="caption" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{proto.label}</Typography>
                                </Box>
                                <Checkbox
                                    size="small"
                                    checked={settings[`${proto.id}Enabled`]}
                                    onChange={(e) => setSettings({ ...settings, [`${proto.id}Enabled`]: e.target.checked })}
                                    sx={{ color: 'primary.main', p: 0.5, '&.Mui-checked': { color: 'primary.main' } }}
                                />
                            </Box>
                        </Grid>
                    ))}

                    <Grid item xs={12}>
                        <Divider sx={{ opacity: 0.08, my: 0.5 }}>
                            <Chip label={t('settings.output.multi.soon')} size="small" sx={{ height: 20, fontWeight: 800, fontSize: '0.55rem', color: 'warning.main', bgcolor: 'rgba(255,152,0,0.08)', borderColor: 'rgba(255,152,0,0.2)', border: '1px solid' }} />
                        </Divider>
                    </Grid>

                    {[
                        { id: 'dash', label: 'DASH', desc: t('settings.output.multi.dash_desc') },
                        { id: 'mss', label: 'MSS', desc: t('settings.output.multi.mss_desc') },
                        { id: 'rtsp', label: 'RTSP', desc: t('settings.output.multi.rtsp_desc') },
                        { id: 'webrtc', label: 'WebRTC', desc: t('settings.output.multi.webrtc_desc') }
                    ].map(proto => (
                        <Grid item xs={12} md={3} sm={6} key={proto.id}>
                            <Tooltip title={proto.desc} arrow>
                                <Box sx={{ p: 1, py: 0.5, bgcolor: 'rgba(255,255,255,0.01)', borderRadius: 2, border: '1px dashed rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.55 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ p: 0.5, bgcolor: 'rgba(255,152,0,0.07)', borderRadius: 1.5, color: 'warning.main' }}>
                                            <PlatformIcon fontSize="small" />
                                        </Box>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', whiteSpace: 'nowrap' }}>{proto.label}</Typography>
                                    </Box>
                                    <Switch
                                        size="small"
                                        checked={settings[`${proto.id}Enabled`] || false}
                                        onChange={(e) => setSettings({ ...settings, [`${proto.id}Enabled`]: e.target.checked })}
                                        sx={{ '& .MuiSwitch-root': { mr: -1 }, '& .MuiSwitch-switchBase.Mui-checked': { color: 'warning.main' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'warning.main' } }}
                                    />
                                </Box>
                            </Tooltip>
                        </Grid>
                    ))}
                </Grid>

                {/* Connection Links */}
                <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LanguageIcon fontSize="small" /> {t('settings.output.links.title')}
                    </Typography>
                    <Grid container spacing={1.5}>
                        {settings.rtmpEnabled && (
                            <Grid item xs={12}>
                                <TextField
                                    size="small"
                                    fullWidth
                                    label={t('settings.output.links.rtmp_label')}
                                    value={`rtmp://${window.location.hostname}:1935/stream`}
                                    InputProps={{
                                        readOnly: true,
                                        sx: { fontFamily: 'monospace', fontSize: '0.85rem', bgcolor: 'rgba(0,0,0,0.2)' },
                                        endAdornment: (
                                            <IconButton onClick={() => handleCopyToClipboard(`rtmp://${window.location.hostname}:1935/stream`, t('settings.output.links.rtmp_copied'))}>
                                                <ContentCopyIcon fontSize="small" />
                                            </IconButton>
                                        )
                                    }}
                                />
                            </Grid>
                        )}
                        {settings.srtEnabled && (
                            <Grid item xs={12}>
                                <TextField
                                    size="small"
                                    fullWidth
                                    label={t('settings.output.links.srt_label')}
                                    value={`srt://${window.location.hostname}:8890?streamid=read:stream_srt`}
                                    helperText={t('settings.output.links.srt_warning')}
                                    InputProps={{
                                        readOnly: true,
                                        sx: { fontFamily: 'monospace', fontSize: '0.85rem', bgcolor: 'rgba(0,0,0,0.2)' },
                                        endAdornment: (
                                            <IconButton onClick={() => handleCopyToClipboard(`srt://${window.location.hostname}:8890?streamid=read:stream_srt`, t('settings.output.links.srt_copied'))}>
                                                <ContentCopyIcon fontSize="small" />
                                            </IconButton>
                                        )
                                    }}
                                />
                            </Grid>
                        )}
                        {settings.udpEnabled && (
                            <Grid item xs={12}>
                                <TextField
                                    size="small"
                                    fullWidth
                                    label={t('settings.output.links.udp_label')}
                                    value="udp://@:1234"
                                    helperText={t('settings.output.links.udp_tip')}
                                    InputProps={{
                                        readOnly: true,
                                        sx: { fontFamily: 'monospace', fontSize: '0.85rem', bgcolor: 'rgba(0,0,0,0.2)' },
                                        endAdornment: (
                                            <IconButton onClick={() => handleCopyToClipboard("udp://@:1234", t('settings.output.links.udp_copied'))}>
                                                <ContentCopyIcon fontSize="small" />
                                            </IconButton>
                                        )
                                    }}
                                />
                            </Grid>
                        )}
                        {settings.hlsEnabled && (
                            <Grid item xs={12}>
                                <TextField
                                    size="small"
                                    fullWidth
                                    label={t('settings.output.links.hls_label')}
                                    value={`http://${window.location.hostname}:3011/hls/stream.m3u8`}
                                    InputProps={{
                                        readOnly: true,
                                        sx: { fontFamily: 'monospace', fontSize: '0.85rem', bgcolor: 'rgba(0,0,0,0.2)' },
                                        endAdornment: (
                                            <IconButton onClick={() => handleCopyToClipboard(`http://${window.location.hostname}:3011/hls/stream.m3u8`, t('settings.output.links.hls_copied'))}>
                                                <ContentCopyIcon fontSize="small" />
                                            </IconButton>
                                        )
                                    }}
                                />
                            </Grid>
                        )}
                        {!settings.rtmpEnabled && !settings.srtEnabled && !settings.hlsEnabled && (
                            <Grid item xs={12}>
                                <Alert severity="info" variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.1)', color: 'text.secondary' }}>
                                    {t('settings.output.links.no_protocols')}
                                </Alert>
                            </Grid>
                        )}
                    </Grid>
                </Box>
            </Paper>
        </Box>
    );
};

export default OutputTab;
