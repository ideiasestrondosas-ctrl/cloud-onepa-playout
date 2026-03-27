/**
 * PlayoutTab.jsx - Configurações de Playout, EPG e Overlay
 * Extraído do Settings.jsx principal para otimização de RAM.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Button,
    TextField,
    Tooltip,
    Select,
    MenuItem,
    Chip,
    IconButton,
    Switch,
    Slider,
    ToggleButtonGroup,
    ToggleButton,
    FormControlLabel
} from '@mui/material';
import {
    AutoAwesome as WizardIcon,
    Delete as DeleteIcon,
    ContentCopy as CopyIcon,
    Image as ImageIcon,
    NorthWest as NwIcon,
    NorthEast as NeIcon,
    SouthWest as SwIcon,
    SouthEast as SeIcon,
    RadioButtonChecked as TargetIcon,
    AutoFixHigh as MagicIcon
} from '@mui/icons-material';

const PlayoutTab = ({
    settings,
    setSettings,
    navigate,
    setResetConfirmOpen,
    handleCopyToClipboard,
    setMediaTypeSelector,
    setMediaSelectorOpen,
    setConverterOpen,
    activePreset,
    applyPreset
}) => {
    const { t } = useTranslation();

    return (
        <Box>
            <Paper className="glass-panel" sx={{ p: 2, mb: 2 }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800, fontSize: '1rem' }}>
                            {t('settings.playout.header.title')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>
                            {t('settings.playout.header.subtitle')}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="outlined" startIcon={<WizardIcon />} onClick={() => navigate('/setup')} sx={{ borderRadius: 2, fontWeight: 800 }}>
                            {t('settings.playout.header.wizard_btn')}
                        </Button>
                        <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setResetConfirmOpen(true)} sx={{ borderRadius: 2, fontWeight: 800 }}>
                            {t('settings.playout.header.reset_btn')}
                        </Button>
                    </Box>
                </Box>

                <Grid container spacing={2}>
                    {[
                        { label: t('settings.playout.fields.day_start'), value: settings.dayStart, type: 'time', key: 'dayStart', tooltip: t('settings.playout.tooltips.day_start') },
                        { label: t('settings.playout.fields.channel_name'), value: settings.channelName, type: 'text', key: 'channelName', tooltip: t('settings.playout.tooltips.channel_name') },
                        { label: t('settings.playout.fields.fps'), value: settings.fps, type: 'number', key: 'fps', tooltip: t('settings.playout.tooltips.fps') },
                        { label: t('settings.playout.fields.encoding_preset'), value: settings.encodingPreset || 'medium', type: 'select', key: 'encodingPreset', options: ['ultrafast', 'veryfast', 'medium', 'slow'], tooltip: t('settings.playout.tooltips.encoding_preset') }
                    ].map(item => (
                        <Grid item xs={12} md={6} key={item.key}>
                            <Tooltip title={item.tooltip} arrow placement="top">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(0,0,0,0.2)', p: 1.5, borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 900, minWidth: 100, color: 'text.secondary' }}>{item.label}</Typography>
                                    {item.type === 'select' ? (
                                        <Select
                                            size="small"
                                            fullWidth
                                            value={item.value}
                                            onChange={(e) => setSettings({ ...settings, [item.key]: e.target.value })}
                                            sx={{ borderRadius: 2, fontSize: '0.75rem', fontWeight: 800 }}
                                        >
                                            {item.options.map(opt => <MenuItem key={opt} value={opt}>{opt.toUpperCase()}</MenuItem>)}
                                        </Select>
                                    ) : (
                                        <TextField
                                            size="small"
                                            fullWidth
                                            type={item.type}
                                            value={item.value}
                                            onChange={(e) => setSettings({ ...settings, [item.key]: e.target.value })}
                                            sx={{ '& .MuiInputBase-root': { borderRadius: 2, fontSize: '0.75rem', fontWeight: 800 } }}
                                        />
                                    )}
                                </Box>
                            </Tooltip>
                        </Grid>
                    ))}
                </Grid>
            </Paper>

            {/* EPG Section */}
            <Paper className="glass-panel" sx={{ p: 4, mb: 4 }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>{t('settings.playout.epg.title')}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{t('settings.playout.epg.subtitle')}</Typography>
                </Box>
                <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3 }}>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="overline" sx={{ fontWeight: 900, color: 'primary.main', display: 'block', lineHeight: 1 }}>{t('settings.playout.epg.url_label')}</Typography>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', opacity: 0.7, wordBreak: 'break-all' }}>
                            {`${window.location.protocol}//${window.location.host}/api/playlists/epg.xml`}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={t('settings.playout.epg.status_live')} size="small" color="success" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 900 }} />
                        <Tooltip title={t('settings.playout.epg.copy_tooltip')}>
                            <IconButton
                                size="small"
                                onClick={() => handleCopyToClipboard(`${window.location.protocol}//${window.location.host}/api/playlists/epg.xml`, t('settings.playout.epg.copied'))}
                                sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}
                            >
                                <CopyIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Paper>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={9}>
                        <TextField fullWidth size="small" label={t('settings.playout.epg.refresh_label')} value={settings.epgUrl || t('settings.playout.epg.system_generated')} disabled InputProps={{ sx: { borderRadius: 2, fontSize: '0.75rem', opacity: 0.6 } }} />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField fullWidth size="small" label={t('settings.playout.epg.days_label')} type="number" value={settings.epgDays} onChange={(e) => setSettings({ ...settings, epgDays: parseInt(e.target.value) || 7 })} InputProps={{ sx: { borderRadius: 2, fontSize: '0.75rem' } }} />
                    </Grid>
                </Grid>
            </Paper>

            {/* Overlay Section */}
            <Paper className="glass-panel" sx={{ p: 4, mb: 4 }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>{t('settings.playout.overlay.title')}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{t('settings.playout.overlay.subtitle')}</Typography>
                </Box>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ height: 180, bgcolor: 'rgba(0,0,0,0.4)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="overline" sx={{ position: 'absolute', top: 8, left: 12, opacity: 0.3, fontWeight: 900 }}>{t('settings.playout.overlay.preview')}</Typography>
                            <Box sx={{ width: '80%', height: '80%', border: '1px dashed rgba(255,255,255,0.1)', position: 'relative' }}>
                                {settings.overlay_enabled && (
                                    <Box sx={{
                                        position: 'absolute',
                                        width: 30, height: 30,
                                        top: (settings.logoPosition || '').includes('top') ? '5%' : 'auto',
                                        bottom: (settings.logoPosition || '').includes('bottom') ? '5%' : 'auto',
                                        left: (settings.logoPosition || '').includes('left') ? '5%' : 'auto',
                                        right: (settings.logoPosition || '').includes('right') ? '5%' : 'auto',
                                        bgcolor: 'primary.main', borderRadius: '50%', boxShadow: '0 0 15px rgba(0, 229, 255, 0.5)',
                                        opacity: settings.overlayOpacity || 1, transform: `scale(${settings.overlayScale || 1})`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}><ImageIcon sx={{ fontSize: 14, color: '#000' }} /></Box>
                                )}
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.02)', p: 2, borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main' }}>{t('settings.playout.overlay.dpad_label')}</Typography>
                                <Switch size="small" checked={settings.overlay_enabled} onChange={(e) => setSettings({ ...settings, overlay_enabled: e.target.checked })} />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.5, bgcolor: 'rgba(0,0,0,0.2)', p: 1, borderRadius: 2 }}>
                                    {[
                                        { pos: 'top-left', icon: <NwIcon fontSize="small" /> }, { pos: 'spacer', icon: null }, { pos: 'top-right', icon: <NeIcon fontSize="small" /> },
                                        { pos: 'spacer2', icon: <TargetIcon sx={{ fontSize: 10, opacity: 0.2 }} /> }, { pos: 'center', icon: <TargetIcon sx={{ fontSize: 14, color: 'primary.main', opacity: 0.5 }} /> }, { pos: 'spacer3', icon: <TargetIcon sx={{ fontSize: 10, opacity: 0.2 }} /> },
                                        { pos: 'bottom-left', icon: <SwIcon fontSize="small" /> }, { pos: 'spacer4', icon: null }, { pos: 'bottom-right', icon: <SeIcon fontSize="small" /> }
                                    ].map((btn, idx) => (
                                        btn.pos.startsWith('spacer') ? <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{btn.icon}</Box> :
                                        <IconButton size="small" key={btn.pos} onClick={() => setSettings({ ...settings, logoPosition: btn.pos })} sx={{ bgcolor: settings.logoPosition === btn.pos ? 'primary.main' : 'rgba(255,255,255,0.05)', color: settings.logoPosition === btn.pos ? '#000' : 'inherit', '&:hover': { bgcolor: 'primary.dark' }, width: 32, height: 32 }}>{btn.icon || <TargetIcon sx={{ fontSize: 14 }} />}</IconButton>
                                    ))}
                                </Box>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Box sx={{ mb: 1 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.6rem', display: 'flex', justifyContent: 'space-between' }}>{t('settings.playout.overlay.opacity')} <span>{Math.round((settings.overlayOpacity ?? 0.6) * 100)}%</span></Typography>
                                        <Slider size="small" value={settings.overlayOpacity ?? 0.6} min={0} max={1} step={0.1} onChange={(e, v) => setSettings({ ...settings, overlayOpacity: v })} />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.6rem', display: 'flex', justifyContent: 'space-between' }}>{t('settings.playout.overlay.scale')} <span>{Math.round((settings.overlayScale ?? 0.6) * 100)}%</span></Typography>
                                        <Slider size="small" value={settings.overlayScale ?? 0.6} min={0.1} max={2.0} step={0.1} onChange={(e, v) => setSettings({ ...settings, overlayScale: v })} />
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 3 }}>
                    <TextField fullWidth size="small" label={t('settings.playout.overlay.path_label')} value={settings.logoPath} onChange={(e) => setSettings({ ...settings, logoPath: e.target.value })} InputProps={{ sx: { bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, fontSize: '0.75rem' } }} />
                    <Button size="small" variant="contained" onClick={() => { setMediaTypeSelector('image'); setMediaSelectorOpen(true); }} sx={{ minWidth: 100, fontWeight: 800 }}>{t('settings.playout.overlay.change_btn')}</Button>
                    <Tooltip title={t('settings.playout.overlay.magic_tooltip')}><IconButton onClick={() => setConverterOpen(true)} sx={{ bgcolor: 'rgba(0,229,255,0.1)', color: 'primary.main', borderRadius: 2 }}><MagicIcon /></IconButton></Tooltip>
                </Box>
            </Paper>

            {/* Presets Section */}
            <Paper className="glass-panel" sx={{ p: 4 }}>
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box><Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>{t('settings.playout.presets.title')}</Typography><Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{t('settings.playout.presets.subtitle')}</Typography></Box>
                    <FormControlLabel control={<Switch size="small" checked={!!settings.advanced_quality} onChange={(e) => setSettings({ ...settings, advanced_quality: e.target.checked })} />} label={<Typography variant="caption" sx={{ fontWeight: 800 }}>{t('settings.playout.presets.advanced_mode')}</Typography>} />
                </Box>
                <ToggleButtonGroup fullWidth value={activePreset} exclusive onChange={(e, v) => v && applyPreset(v)} sx={{ bgcolor: 'rgba(0,0,0,0.2)', p: 0.5, borderRadius: 3, mb: 2 }}>
                    {[
                        { id: '720p', label: '720p HD', desc: t('settings.playout.presets.list.720p.desc') },
                        { id: '1080p', label: '1080p PRO', desc: t('settings.playout.presets.list.1080p.desc') },
                        { id: '4k', label: '4K ULTRA', desc: t('settings.playout.presets.list.4k.desc') }
                    ].map(p => (
                        <ToggleButton key={p.id} value={p.id} sx={{ border: 'none', borderRadius: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{p.label}</Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.5 }}>{p.desc}</Typography>
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
                {settings.advanced_quality && (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}><TextField fullWidth size="small" label={t('settings.output.main.bitrate')} value={settings.videoBitrate} onChange={(e) => setSettings({ ...settings, videoBitrate: e.target.value })} InputProps={{ sx: { borderRadius: 2, fontSize: '0.75rem' } }} /></Grid>
                        <Grid item xs={6}><TextField fullWidth size="small" label={t('settings.output.main.resolution')} value={settings.resolution} onChange={(e) => setSettings({ ...settings, resolution: e.target.value })} InputProps={{ sx: { borderRadius: 2, fontSize: '0.75rem' } }} /></Grid>
                    </Grid>
                )}
            </Paper>
        </Box>
    );
};

export default PlayoutTab;
