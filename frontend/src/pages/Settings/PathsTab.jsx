/**
 * PathsTab.jsx - Configurações de Caminhos, Armazenamento e API
 * Extraído do Settings.jsx principal para otimização de RAM.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    IconButton,
    Tooltip,
    Divider,
    Chip,
    Button,
    Stack,
    LinearProgress,
    CircularProgress,
    Alert,
    ToggleButtonGroup,
    ToggleButton
} from '@mui/material';
import {
    Folder as FolderIcon,
    History as HistoryIcon,
    Warning as WarningIcon,
    Refresh as RefreshIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    VisibilityOff as ViewOffIcon,
    AutoFixHigh as WizardIcon,
    PlaylistAddCheck as TestIcon,
    Save as SaveIcon,
    RestartAlt as RestartAltIcon,
    Movie as MovieIcon,
    Image as ImageIcon,
    Language as LanguageIcon
} from '@mui/icons-material';

const PathsTab = ({
    settings,
    setSettings,
    proxyStats,
    syncing,
    purgingProxies,
    handleSyncMedia,
    handlePurgeProxies,
    handleTestApi,
    handleSaveSettings,
    handleApplyDefaults,
    setExplorerOpen,
    fetchProxiesList,
    setShowLogsDialog,
    setMediaSelectorOpen,
    setMediaTypeSelector,
    fetchProtectedAssets,
    showSuccess,
    showError,
    settingsAPI
}) => {
    const { t } = useTranslation();

    return (
        <Box>
            {/* Paths Section */}
            <Paper className="glass-panel" sx={{ p: 1.5, mb: 1.5 }}>
                <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800, fontSize: '0.9rem' }}>
                        {t('settings.paths.header.title')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>
                        {t('settings.paths.header.subtitle')}
                    </Typography>
                </Box>

                <Grid container spacing={1.5}>
                    {[
                        { label: t('settings.paths.fields.media'), value: settings.mediaPath, key: 'mediaPath', helper: t('settings.paths.helpers.media') },
                        { label: t('settings.paths.fields.thumbnails'), value: settings.thumbnailsPath, key: 'thumbnailsPath', helper: t('settings.paths.helpers.thumbnails') },
                        { label: t('settings.paths.fields.playlists'), value: settings.playlistsPath, key: 'playlistsPath', helper: t('settings.paths.helpers.playlists') },
                        { label: t('settings.paths.fields.fillers'), value: settings.fillersPath, key: 'fillersPath', helper: t('settings.paths.helpers.fillers') },
                        {
                            label: t('settings.paths.fields.logs'),
                            value: settings.logPath,
                            key: 'logPath',
                            helper: t('settings.paths.helpers.logs'),
                            endAdornment: (
                                <IconButton onClick={() => setShowLogsDialog(true)} color="primary" sx={{ bgcolor: 'rgba(0,229,255,0.05)', borderRadius: 2 }}>
                                    <HistoryIcon />
                                </IconButton>
                            )
                        },
                        { label: t('settings.paths.fields.protected'), value: settings.protectedPath, key: 'protectedPath', helper: t('settings.paths.helpers.protected') }
                    ].map(field => (
                        <Grid item xs={12} md={6} key={field.key}>
                            <TextField
                                size="small"
                                fullWidth
                                label={field.label}
                                value={field.value}
                                onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                                helperText={field.helper}
                                InputProps={{
                                    sx: { bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, fontSize: '0.85rem' },
                                    endAdornment: field.endAdornment
                                }}
                            />
                        </Grid>
                    ))}
                </Grid>
            </Paper>

            {/* Storage Management Section */}
            <Paper className="glass-panel" sx={{ p: 1.5, mb: 2, borderLeft: '4px solid #9c27b0' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ flex: 1, minWidth: '300px' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'secondary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                            {t('settings.storage.header.title')}
                            {proxyStats?.sync_needed && (
                                <Tooltip title={t('settings.storage.header.sync_needed_tooltip', { count: proxyStats.new_files_count || '!' })}>
                                    <Chip size="small" color="warning" icon={<WarningIcon sx={{ fontSize: 14 }} />} label={`${proxyStats.new_files_count || ''} ${t('settings.storage.header.sync_needed_label')}`} sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }} />
                                </Tooltip>
                            )}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                            {t('settings.storage.header.subtitle')}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2 }}>
                        <Tooltip title={t('settings.storage.stats.db')}><Chip size="small" label={`DB: ${proxyStats?.db_media_count || 0}`} sx={{ bgcolor: 'rgba(255,255,255,0.05)', fontWeight: 600 }} /></Tooltip>
                        <Tooltip title={t('settings.storage.stats.physical')}><Chip size="small" label={`DISCO: ${proxyStats?.physical_media_count || 0}`} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)', color: 'primary.main', fontWeight: 600 }} /></Tooltip>
                        <Tooltip title={t('settings.storage.stats.proxies')}><Chip size="small" label={`PROXIES: ${proxyStats?.proxy_count || 0} (${((proxyStats?.total_bytes || 0) / 1024 / 1024).toFixed(1)}MB)`} sx={{ bgcolor: 'rgba(156, 39, 176, 0.1)', color: 'secondary.main', fontWeight: 600 }} /></Tooltip>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip title={t('settings.storage.toolbar.explore')}>
                            <IconButton onClick={() => { fetchProxiesList(); setExplorerOpen(true); }} disabled={proxyStats?.proxy_count === 0 && !syncing} color="secondary" sx={{ bgcolor: 'rgba(156, 39, 176, 0.05)' }}>
                                <ViewIcon />
                            </IconButton>
                        </Tooltip>
                        <Divider orientation="vertical" variant="middle" flexItem sx={{ mx: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                        <Tooltip title={t('settings.storage.toolbar.sync')}>
                            <span>
                                <IconButton onClick={handleSyncMedia} disabled={syncing} color={proxyStats?.sync_needed ? "warning" : "primary"} sx={{ bgcolor: proxyStats?.sync_needed ? 'rgba(255, 152, 0, 0.1)' : 'rgba(0, 229, 255, 0.05)' }}>
                                    {syncing ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title={t('settings.storage.toolbar.purge')}>
                            <span>
                                <IconButton onClick={handlePurgeProxies} disabled={purgingProxies || proxyStats?.proxy_count === 0} color="error" sx={{ bgcolor: 'rgba(244, 67, 54, 0.05)' }}>
                                    {purgingProxies ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                </Box>
                {(syncing || purgingProxies) && <LinearProgress color={syncing ? 'primary' : 'error'} sx={{ mt: 2, borderRadius: 2 }} />}
            </Paper>

            {/* API Section */}
            <Paper className="glass-panel" sx={{ p: 2, mb: 2 }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800, fontSize: '1rem' }}>{t('settings.api.header.title')}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>{t('settings.api.header.subtitle')}</Typography>
                    </Box>
                    <Button variant="outlined" size="small" startIcon={<WizardIcon />} onClick={handleApplyDefaults} sx={{ fontWeight: 800, borderRadius: 2 }}>
                        {t('settings.api.header.auto_config_btn')}
                    </Button>
                </Box>

                <Grid container spacing={2}>
                    {[
                        { id: 'tmdb', label: 'TMDB API', key: 'tmdbApiKey' },
                        { id: 'omdb', label: 'OMDB API', key: 'omdbApiKey' },
                        { id: 'tvmaze', label: 'TVMAZE', key: 'tvmazeApiKey' }
                    ].map(api => (
                        <Grid item xs={12} key={api.id}>
                            <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                                <Typography variant="caption" sx={{ fontWeight: 900, minWidth: 100, color: 'primary.main' }}>{api.label}</Typography>
                                <TextField size="small" placeholder={t('settings.api.fields.key_placeholder')} value={settings[api.key] || ''} type={settings[`show_${api.id}`] ? "text" : "password"} onChange={(e) => setSettings({ ...settings, [api.key]: e.target.value })} sx={{ flexGrow: 1 }} InputProps={{ sx: { height: 36, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 2, fontSize: '0.75rem' }, endAdornment: (
                                    <IconButton size="small" onClick={() => setSettings(s => ({ ...s, [`show_${api.id}`]: !s[`show_${api.id}`] }))} sx={{ opacity: 0.7 }}>
                                        {settings[`show_${api.id}`] ? <ViewOffIcon sx={{ fontSize: 16 }} /> : <ViewIcon sx={{ fontSize: 16 }} />}
                                    </IconButton>
                                ) }} />
                                <Stack direction="row" spacing={1}>
                                    <Tooltip title={t('settings.api.toolbar.test')}><IconButton size="small" color="primary" onClick={() => handleTestApi(api.id)} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)', border: '1px solid rgba(0, 229, 255, 0.2)' }}><TestIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                                    <Tooltip title={t('settings.api.toolbar.save')}><IconButton size="small" color="success" onClick={handleSaveSettings} sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.2)' }}><SaveIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                                </Stack>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Paper>

            {/* Branding Section */}
            <Paper className="glass-panel" sx={{ p: 2, mb: 2 }}>
                <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                    <Box><Typography variant="h6" className="neon-text" sx={{ fontWeight: 800, fontSize: '1rem' }}>{t('settings.branding.assets.title')}</Typography><Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem', display: 'block', mt: -0.5 }}>{t('settings.branding.assets.subtitle')}</Typography></Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="outlined" color="warning" size="small" startIcon={<RestartAltIcon />} onClick={async () => {
                            const defaults = { branding_type: 'video', logo_path: '', overlay_enabled: true, overlay_opacity: 1.0, overlay_scale: 0.3, overlay_x: 30, overlay_y: 20, overlay_anchor: 'top-right' };
                            try {
                                await settingsAPI.update(defaults);
                                setSettings(prev => ({ ...prev, branding_type: 'video', logoPath: defaults.logo_path, overlayOpacity: 1.0, overlay_anchor: 'top-right' }));
                                showSuccess(t('settings.branding.assets.reset_success'));
                             } catch (e) { showError(t('settings.branding.assets.reset_error')); }
                        }} sx={{ fontWeight: 800, borderRadius: 2, fontSize: '0.7rem' }}>{t('settings.branding.assets.reset_btn')}</Button>
                        <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={async () => {
                            const defaults = { branding_type: 'video', logo_path: '/assets/protected/Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4', default_image_path: '/assets/protected/Cloud_Onepa_Playout_Infinity_Logo_remodelado.png', default_video_path: '/assets/protected/Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4' };
                            try {
                                await settingsAPI.update(defaults);
                                setSettings(prev => ({ ...prev, branding_type: 'video', logoPath: defaults.logo_path, defaultImagePath: defaults.default_image_path, defaultVideoPath: defaults.default_video_path }));
                                await fetchProtectedAssets();
                                showSuccess(t('settings.branding.assets.restore_success'));
                            } catch (e) { showError(t('settings.branding.assets.restore_error')); }
                        }} sx={{ fontWeight: 800, borderRadius: 2, fontSize: '0.7rem' }}>{t('settings.branding.assets.restore_defaults_btn')}</Button>
                    </Box>
                </Box>

                <Grid container spacing={2}>
                    {[
                        { id: 'logo', label: t('settings.branding.assets.logo_label'), path: settings.logoPath, type: settings.branding_type, onSelect: () => { setMediaTypeSelector(settings.branding_type === 'video' ? 'video' : 'image'); setMediaSelectorOpen(true); } },
                        { id: 'image_fb', label: t('settings.branding.assets.image_fallback_label'), path: settings.defaultImagePath, type: 'static', onSelect: () => { setMediaTypeSelector('image'); setMediaSelectorOpen(true); } },
                        { id: 'video_fb', label: t('settings.branding.overlay.fallback_label'), path: settings.defaultVideoPath, type: 'video', onSelect: () => { setMediaTypeSelector('video'); setMediaSelectorOpen(true); } }
                    ].map(asset => (
                        <Grid item xs={12} md={4} key={asset.id}>
                            <Paper sx={{ p: 2, height: '100%', borderRadius: 4, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="overline" sx={{ fontWeight: 900, color: 'text.secondary' }}>{asset.label}</Typography><Chip label={asset.path ? t('settings.branding.assets.defined') : t('settings.branding.assets.missing')} size="small" color={asset.path ? 'success' : 'warning'} sx={{ height: 16, fontSize: '0.6rem' }} /></Box>
                                <Box sx={{ height: 100, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {asset.path ? (asset.type === 'video' ? <video src={asset.path} style={{ width: '100%', height: '100%', objectFit: 'contain' }} muted loop onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} /> : <img src={asset.path} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />) : <Box sx={{ opacity: 0.2 }}>{asset.type === 'video' ? <MovieIcon sx={{ fontSize: 40 }} /> : <ImageIcon sx={{ fontSize: 40 }} />}</Box>}
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                                    <Button size="small" variant="contained" onClick={() => { setMediaTypeSelector(asset.id === 'logo' ? (settings.branding_type === 'video' ? 'video' : 'image') : (asset.id === 'video_fb' ? 'video' : 'image')); setMediaSelectorOpen(true); }} sx={{ fontWeight: 900, borderRadius: 2 }}>{t('settings.branding.assets.change_btn')}</Button>
                                    {asset.id === 'logo' && <ToggleButtonGroup size="small" value={settings.branding_type || 'static'} exclusive onChange={(e, v) => v && setSettings({ ...settings, branding_type: v })} sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}><ToggleButton value="static" sx={{ fontSize: '0.6rem' }}>IMG</ToggleButton><ToggleButton value="video" sx={{ fontSize: '0.6rem' }}>VID</ToggleButton></ToggleButtonGroup>}
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Paper>
        </Box>
    );
};

export default PathsTab;
