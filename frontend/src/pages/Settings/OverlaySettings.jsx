/**
 * OverlaySettings.jsx - Overlay Tab Component
 * Extraído do Settings.jsx principal para melhorar manutenibilidade
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    TextField,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Slider,
    Switch,
    FormControlLabel,
    Card,
    CardContent,
} from '@mui/material';

const OverlaySettings = ({ settings, setSettings }) => {
    const { t } = useTranslation();

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t('settings.overlay.title', 'Overlay Configuration')}
            </Typography>

            <Grid container spacing={3}>
                {/* Overlay Enabled */}
                <Grid item xs={12}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.overlayEnabled || false}
                                onChange={(e) => setSettings({ ...settings, overlayEnabled: e.target.checked })}
                            />
                        }
                        label={t('settings.overlay.enabled', 'Enable Overlay')}
                    />
                </Grid>

                {/* Logo Path */}
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label={t('settings.overlay.logo_path', 'Logo Path')}
                        value={settings.logoPath || ''}
                        onChange={(e) => setSettings({ ...settings, logoPath: e.target.value })}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                </Grid>

                {/* Logo Position */}
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>{t('settings.overlay.position', 'Logo Position')}</InputLabel>
                        <Select
                            value={settings.logoPosition || 'top-right'}
                            label={t('settings.overlay.position', 'Logo Position')}
                            onChange={(e) => setSettings({ ...settings, logoPosition: e.target.value })}
                            sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3 }}
                        >
                            <MenuItem value="top-left">Top Left</MenuItem>
                            <MenuItem value="top-right">Top Right</MenuItem>
                            <MenuItem value="bottom-left">Bottom Left</MenuItem>
                            <MenuItem value="bottom-right">Bottom Right</MenuItem>
                            <MenuItem value="center">Center</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                {/* Overlay Opacity */}
                <Grid item xs={12} md={6}>
                    <Typography gutterBottom>
                        {t('settings.overlay.opacity', 'Overlay Opacity')}: {settings.overlayOpacity ?? 0.6}
                    </Typography>
                    <Slider
                        size="small"
                        value={settings.overlayOpacity ?? 0.6}
                        min={0}
                        max={1}
                        step={0.1}
                        onChange={(e, v) => setSettings({ ...settings, overlayOpacity: v })}
                    />
                </Grid>

                {/* Overlay Scale */}
                <Grid item xs={12} md={6}>
                    <Typography gutterBottom>
                        {t('settings.overlay.scale', 'Overlay Scale')}: {settings.overlayScale ?? 0.6}
                    </Typography>
                    <Slider
                        size="small"
                        value={settings.overlayScale ?? 0.6}
                        min={0.1}
                        max={2.0}
                        step={0.1}
                        onChange={(e, v) => setSettings({ ...settings, overlayScale: v })}
                    />
                </Grid>

                {/* Overlay Position X */}
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        type="number"
                        label={t('settings.overlay.x', 'Position X')}
                        value={settings.overlayX ?? 35}
                        onChange={(e) => setSettings({ ...settings, overlayX: parseInt(e.target.value) || 0 })}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                </Grid>

                {/* Overlay Position Y */}
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        type="number"
                        label={t('settings.overlay.y', 'Position Y')}
                        value={settings.overlayY ?? 18}
                        onChange={(e) => setSettings({ ...settings, overlayY: parseInt(e.target.value) || 0 })}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                </Grid>

                {/* Branding Type */}
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>{t('settings.overlay.branding_type', 'Branding Type')}</InputLabel>
                        <Select
                            value={settings.branding_type || 'static'}
                            label={t('settings.overlay.branding_type', 'Branding Type')}
                            onChange={(e) => setSettings({ ...settings, branding_type: e.target.value })}
                            sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3 }}
                        >
                            <MenuItem value="static">Static</MenuItem>
                            <MenuItem value="video">Video</MenuItem>
                            <MenuItem value="animated">Animated</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            {/* Preview Card */}
            <Card sx={{ mt: 4, bgcolor: 'rgba(0,0,0,0.3)' }}>
                <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        {t('settings.overlay.preview', 'Preview')}
                    </Typography>
                    <Box
                        sx={{
                            position: 'relative',
                            width: '100%',
                            height: 200,
                            bgcolor: '#1a1a1a',
                            borderRadius: 2,
                            overflow: 'hidden',
                        }}
                    >
                        {/* Placeholder for preview */}
                        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                            {t('settings.overlay.preview_hint', 'Overlay preview will appear here')}
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default OverlaySettings;
