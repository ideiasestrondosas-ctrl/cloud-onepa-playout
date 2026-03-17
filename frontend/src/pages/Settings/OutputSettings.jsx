/**
 * OutputSettings.jsx - Output/Settings Tab Component
 * Extraído do Settings.jsx principal para melhorar manutenibilidade
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    Card,
    CardContent,
} from '@mui/material';

const OutputSettings = ({ settings, setSettings, presets, handleResolutionChange }) => {
    const { t } = useTranslation();

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t('settings.output.title', 'Output Configuration')}
            </Typography>

            <Grid container spacing={3}>
                {/* Output Type */}
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>{t('settings.output.main.protocol', 'Output Protocol')}</InputLabel>
                        <Select
                            value={settings.outputType}
                            label={t('settings.output.main.protocol', 'Output Protocol')}
                            onChange={(e) => setSettings({ ...settings, outputType: e.target.value })}
                            sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3 }}
                        >
                            <MenuItem value="rtmp">RTMP</MenuItem>
                            <MenuItem value="hls">HLS</MenuItem>
                            <MenuItem value="srt">SRT</MenuItem>
                            <MenuItem value="udp">UDP</MenuItem>
                            <MenuItem value="webrtc">WebRTC</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                {/* Output URL */}
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label={t('settings.output.main.url', 'Output URL')}
                        value={settings.outputUrl}
                        onChange={(e) => setSettings({ ...settings, outputUrl: e.target.value })}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                </Grid>

                {/* Resolution */}
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>{t('settings.output.main.resolution', 'Resolution')}</InputLabel>
                        <Select
                            value={settings.resolution}
                            label={t('settings.output.main.resolution', 'Resolution')}
                            onChange={(e) => handleResolutionChange(e.target.value)}
                            sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3 }}
                        >
                            <MenuItem value="1920x1080">1920x1080 (Full HD)</MenuItem>
                            <MenuItem value="1280x720">1280x720 (HD)</MenuItem>
                            <MenuItem value="854x480">854x480 (SD)</MenuItem>
                            <MenuItem value="640x360">640x360</MenuItem>
                            <MenuItem value="custom">Custom</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                {/* Video Bitrate */}
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label={t('settings.output.main.bitrate', 'Video Bitrate')}
                        value={settings.videoBitrate}
                        onChange={(e) => setSettings({ ...settings, videoBitrate: e.target.value })}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                </Grid>

                {/* FPS */}
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>{t('settings.output.main.fps', 'FPS')}</InputLabel>
                        <Select
                            value={settings.fps || 25}
                            label={t('settings.output.main.fps', 'FPS')}
                            onChange={(e) => setSettings({ ...settings, fps: e.target.value })}
                            sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3 }}
                        >
                            <MenuItem value={60}>60 fps</MenuItem>
                            <MenuItem value={50}>50 fps</MenuItem>
                            <MenuItem value={30}>30 fps</MenuItem>
                            <MenuItem value={25}>25 fps</MenuItem>
                            <MenuItem value={24}>24 fps</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                {/* Audio Bitrate */}
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label={t('settings.output.main.audio_bitrate', 'Audio Bitrate')}
                        value={settings.audioBitrate}
                        onChange={(e) => setSettings({ ...settings, audioBitrate: e.target.value })}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                </Grid>
            </Grid>

            {/* Presets Section */}
            {presets && presets.length > 0 && (
                <>
                    <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
                        {t('settings.output.presets.title', 'Presets')}
                    </Typography>

                    <Grid container spacing={2}>
                        {presets.map((preset) => (
                            <Grid item xs={12} sm={6} md={3} key={preset.id}>
                                <Card
                                    sx={{
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        '&:hover': { transform: 'scale(1.02)', boxShadow: 6 }
                                    }}
                                    onClick={() => {
                                        if (preset.settings) {
                                            setSettings({ ...settings, ...preset.settings });
                                        }
                                    }}
                                >
                                    <CardContent>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {preset.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {preset.description}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </>
            )}
        </Box>
    );
};

export default OutputSettings;
