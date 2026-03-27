/**
 * AboutTab.jsx - Informações do Sistema, Roadmap e Histórico de Lançamentos
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
    Chip,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    AutoAwesome as WizardIcon,
    CheckCircle as CheckIcon,
    Folder as FolderIcon,
    Language as LanguageIcon,
    Dvr as PlatformIcon,
    Speed as ScalabilityIcon,
    AutoFixHigh as MagicIcon,
    PlayArrow as PlayIcon
} from '@mui/icons-material';

const AboutTab = ({
    settings,
    APP_VERSION_FALLBACK,
    APP_RELEASE_DATE_FALLBACK,
    releaseHistory,
    roadmapData
}) => {
    const { t } = useTranslation();

    return (
        <Box>
            {/* System Info Section */}
            <Paper className="glass-panel" sx={{ p: 2, mb: 2 }}>
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800, fontSize: '0.9rem' }}>{t('settings.about.header.title')}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>{t('settings.about.header.subtitle')}</Typography>
                </Box>
                <Grid container spacing={1.5}>
                    {[
                        { label: t('settings.about.fields.version'), value: settings.system_version || settings.version || APP_VERSION_FALLBACK, icon: <WizardIcon fontSize="small" /> },
                        { label: t('settings.about.fields.last_update'), value: settings.release_date || settings.releaseDate || APP_RELEASE_DATE_FALLBACK, icon: <CheckIcon fontSize="small" /> },
                        { label: t('settings.about.fields.deployment'), value: 'Docker Container (Linux)', icon: <FolderIcon fontSize="small" /> }
                    ].map((item, id) => (
                        <Grid item xs={12} sm={6} md={4} key={id}>
                            <Box sx={{ p: 1, py: 0.5, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{ color: 'primary.main', display: 'flex' }}>{item.icon}</Box>
                                <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.55rem', opacity: 0.8, display: 'block' }}>{item.label}</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.75rem', mt: -0.5 }}>{item.value}</Typography>
                                </Box>
                            </Box>
                        </Grid>
                    ))}
                </Grid>

                <Box sx={{ mt: 3, mb: 1 }}>
                    <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1, fontSize: '0.6rem' }}>{t('settings.about.roadmap.highlight_title')}</Typography>
                    <Grid container spacing={1} sx={{ mt: 0.5 }}>
                        {[
                            { label: t('settings.about.roadmap.idioma.title'), value: t('settings.about.roadmap.idioma.value'), icon: <LanguageIcon fontSize="small" /> },
                            { label: t('settings.about.roadmap.canal.title'), value: t('settings.about.roadmap.canal.value'), icon: <PlatformIcon fontSize="small" /> },
                            { label: t('settings.about.roadmap.latency.title'), value: t('settings.about.roadmap.latency.value'), icon: <ScalabilityIcon fontSize="small" /> }
                        ].map((item, id) => (
                            <Grid item xs={12} sm={4} key={id}>
                                <Box sx={{ p: 1, py: 0.5, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(0,229,255,0.03)', borderRadius: 2, border: '1px solid rgba(0,229,255,0.08)' }}>
                                    <Box sx={{ color: 'primary.main', display: 'flex' }}>{item.icon}</Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', fontSize: '0.55rem', opacity: 0.6 }}>{item.label}</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.7rem', mt: -0.5 }}>{item.value}</Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                            const targetRef = settings.version?.includes('ALPHA') ? 'alpha' : (settings.version || 'main');
                            window.open(`https://github.com/ideiasestrondosas-ctrl/cloud-onepa-playout/tree/${targetRef}`, '_blank');
                        }}
                        sx={{ borderRadius: 2, fontWeight: 800, py: 0.2 }}
                    >
                        {t('settings.about.roadmap.github_btn')}
                    </Button>
                </Box>
            </Paper>

            {/* Release History Section */}
            <Paper className="glass-panel" sx={{ p: 2, mb: 2 }}>
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800, fontSize: '0.9rem' }}>{t('settings.about.history.title')}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>{t('settings.about.history.subtitle')}</Typography>
                </Box>
                <Box sx={{ maxHeight: '40vh', overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-track': { bgcolor: 'rgba(255,255,255,0.02)' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,229,255,0.3)', borderRadius: 3 } }}>
                    <List sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {releaseHistory.length > 0 ? releaseHistory.map((release, idx) => (
                            <ListItem key={idx} sx={{ display: 'block', p: 0 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '0.8rem' }}>{release.version.startsWith('v') ? release.version : 'v' + release.version}</Typography>
                                    <Divider sx={{ flexGrow: 1, opacity: 0.1 }} />
                                    <Typography variant="caption" sx={{ opacity: 0.5, fontSize: '0.65rem' }}>{release.date}</Typography>
                                </Box>
                                <Box sx={{ pl: 2, borderLeft: '2px solid rgba(0,229,255,0.2)' }}>
                                    {release.changes.map((change, cIdx) => (
                                        <Typography key={cIdx} variant="caption" sx={{ mb: 0.2, opacity: 0.8, display: 'flex', alignItems: 'flex-start', gap: 1, fontSize: '0.7rem', lineHeight: 1.2 }}>
                                            <Box sx={{ width: 4, height: 4, bgcolor: 'primary.main', borderRadius: '50%', mt: 0.6, flexShrink: 0 }} /> {change}
                                        </Typography>
                                    ))}
                                </Box>
                            </ListItem>
                        )) : (
                            <Typography variant="body2" sx={{ opacity: 0.5, textAlign: 'center', py: 4 }}>{t('settings.about.history.empty')}</Typography>
                        )}
                    </List>
                </Box>
            </Paper>

            {/* Full Roadmap Section */}
            <Paper className="glass-panel" sx={{ p: 4 }}>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>{t('settings.about.roadmap.title')}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{t('settings.about.roadmap.subtitle')}</Typography>
                    </Box>
                    <Chip
                        icon={<MagicIcon style={{ color: '#00e5ff' }} />}
                        label="ALPHA EVOLUTION"
                        sx={{ fontWeight: 900, fontSize: '0.7rem', bgcolor: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)', color: '#00e5ff' }}
                    />
                </Box>
                <Grid container spacing={3}>
                    {roadmapData.map((item, idx) => (
                        <Grid item xs={12} md={6} key={idx}>
                            <Box sx={{
                                p: 3, height: '100%',
                                bgcolor: item.done ? 'rgba(76,175,80,0.04)' : 'rgba(255,255,255,0.01)',
                                borderRadius: 4, border: '1px solid',
                                borderColor: item.done ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.05)',
                                borderLeft: item.done ? '3px solid #4caf50' : '3px solid rgba(255,255,255,0.08)',
                                transition: 'all 0.3s ease', opacity: item.done ? 1 : 0.65,
                                '&:hover': { bgcolor: item.done ? 'rgba(76,175,80,0.07)' : 'rgba(255,255,255,0.02)', opacity: 1, transform: 'translateY(-2px)' }
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Box sx={{ width: 44, height: 44, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: item.color + '1a', color: item.color, border: '1px solid', borderColor: item.color + '33' }}>{item.icon}</Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 900, color: item.color, letterSpacing: 1 }}>{item.phase}</Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.disabled', fontSize: '0.6rem' }}>{item.version}</Typography>
                                        </Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2, fontSize: '0.82rem' }}>{item.title}</Typography>
                                    </Box>
                                    {item.done ? <Chip label="✓ COMPLETO" size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 900, bgcolor: 'rgba(76,175,80,0.2)', color: '#4caf50', border: '1px solid rgba(76,175,80,0.4)' }} /> : <Chip label="PENDENTE" size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 900, bgcolor: 'rgba(96,125,139,0.15)', color: '#90a4ae', border: '1px solid rgba(96,125,139,0.3)' }} />}
                                </Box>
                                <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, opacity: 0.7, fontSize: '0.77rem' }}>{item.focus}</Typography>
                                <List dense sx={{ p: 0 }}>
                                    {item.items.map((bullet, bIdx) => (
                                        <ListItem key={bIdx} sx={{ p: '3px 8px', mb: 0.5, alignItems: 'center', borderRadius: 1.5, bgcolor: bullet.done ? 'rgba(76,175,80,0.12)' : 'rgba(255,152,0,0.06)', border: '1px solid', borderColor: bullet.done ? 'rgba(76,175,80,0.2)' : 'rgba(255,152,0,0.15)' }}>
                                            <ListItemIcon sx={{ minWidth: 22 }}>{bullet.done ? <CheckIcon sx={{ fontSize: 13, color: '#4caf50' }} /> : <PlayIcon sx={{ fontSize: 11, color: '#ff9800', opacity: 0.7, transform: 'rotate(-45deg)' }} />}</ListItemIcon>
                                            <ListItemText primary={bullet.text} primaryTypographyProps={{ sx: { fontSize: '0.72rem', fontWeight: bullet.done ? 700 : 500, color: bullet.done ? '#fff' : 'rgba(255,152,0,0.85)' } }} />
                                            {bullet.done && <Chip label="OK" size="small" sx={{ height: 15, fontSize: '0.52rem', fontWeight: 900, bgcolor: 'rgba(76,175,80,0.25)', color: '#4caf50', border: '1px solid rgba(76,175,80,0.45)', ml: 0.5 }} />}
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Paper>
        </Box>
    );
};

export default AboutTab;
