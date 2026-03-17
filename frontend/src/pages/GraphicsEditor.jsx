import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Slider,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Stack,
  Chip,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import {
  LogoDev as LogoIcon,
  Brush as BrushIcon,
  Save as SaveIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  DragIndicator as DragIcon,
  Help as HelpIcon,
  Replay as ResetIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ViewModule as TemplatesIcon
} from '@mui/icons-material';
import { settingsAPI, playoutAPI, templateAPI } from '../services/api';
import graphicsService from '../services/graphicsLayersAPI';
import { useNotification } from '../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';
import LayerManager from '../components/GraphicsLayers/LayerManager';
import LayerPreview from '../components/GraphicsLayers/LayerPreview';
import Hls from 'hls.js';

export default function GraphicsEditor() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotification();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Local state for WYSIWYG
  const [logoPos, setLogoPos] = useState({ x: 50, y: 50 });
  const [logoScale, setLogoScale] = useState(1.0);
  const [logoOpacity, setLogoOpacity] = useState(1.0);
  const [anchor, setAnchor] = useState('top-right');

  const containerRef = useRef(null);
  const logoRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [graphicsLayers, setGraphicsLayers] = useState([]);
  const [layerToEdit, setLayerToEdit] = useState(null);
  const [selectedLayerId, setSelectedLayerId] = useState(null);

  const selectedLayer = graphicsLayers.find(l => l.id === selectedLayerId);

  // Templates tab state
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const res = await templateAPI.list();
      setTemplates(res.data || []);
    } catch (_) {
      showError('Failed to load templates');
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    try {
      await templateAPI.delete(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      showSuccess('Template deleted');
    } catch (_) {
      showError('Failed to delete template');
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchLayers();
  }, []);

  useEffect(() => {
    if (activeTab === 3) fetchTemplates();
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.get();
      const data = response.data;
      setSettings(data);
      setLogoPos({ x: data.overlay_x || 50, y: data.overlay_y || 50 });
      setLogoScale(data.overlay_scale || 1.0);
      setLogoOpacity(data.overlay_opacity || 1.0);
      setAnchor(data.overlay_anchor || 'top-right');
    } catch (error) {
      showError(t('graphics.messages.load_settings_error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchLayers = async () => {
    try {
      const response = await graphicsService.list();
      setGraphicsLayers(response.data);
    } catch (error) {
      console.error('Failed to load graphics layers:', error);
      showError(t('graphics.messages.load_layers_error'));
    }
  };

  // Live feed for preview background
  const [isLivePlaying, setIsLivePlaying] = useState(false);
  useEffect(() => {
    const check = async () => {
      try {
        const res = await playoutAPI.status();
        setIsLivePlaying(res.data?.status === 'playing');
      } catch (_) { }
    };
    check();
    // Poll at 2s instead of 5s for faster initial player startup
    const iv = setInterval(check, 2000);
    return () => clearInterval(iv);
  }, []);

  // hls.js player for the clean preview in GraphicsEditor
  // Uses /hls-live/default_clean/ — the RAW feed BEFORE any graphics are applied
  const cleanVideoRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    const video = cleanVideoRef.current;
    if (!video) return;

    // Tear down any previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (!isLivePlaying) return;

    const src = '/hls-live/default_clean/index.m3u8';

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        // Let hls.js handle retries internally — no need to destroy the player
        manifestLoadingMaxRetry: 10,
        levelLoadingMaxRetry: 10,
        fragLoadingMaxRetry: 6,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => console.warn('[GraphicsEditor] Autoplay blocked:', e));
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error('[GraphicsEditor] Fatal HLS error:', data.type);
          // hls.js will attempt recovery on its own via recoverMediaError / startLoad
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          }
        }
      });
      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari)
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(e => console.warn('[GraphicsEditor] Autoplay blocked:', e));
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isLivePlaying]);

  // Cache-bust key for the logo preview image
  const [logoCacheBust, setLogoCacheBust] = useState(Date.now());

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsAPI.update({
        overlay_x: logoPos.x,
        overlay_y: logoPos.y,
        overlay_scale: logoScale,
        overlay_opacity: logoOpacity,
        overlay_anchor: anchor
      });
      // Refresh settings from server so logo_path is up-to-date
      await fetchSettings();
      // Force logo image to reload by busting the cache
      setLogoCacheBust(Date.now());
      showSuccess(t('graphics.messages.save_success'));
    } catch (error) {
      showError(t('graphics.messages.save_error'));
    } finally {
      setSaving(false);
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate relative coordinates based on anchor
    let relativeX = 0;
    let relativeY = 0;

    const w = rect.width;
    const h = rect.height;

    if (anchor === 'top-left') {
      relativeX = x;
      relativeY = y;
    } else if (anchor === 'top-right') {
      relativeX = w - x;
      relativeY = y;
    } else if (anchor === 'bottom-left') {
      relativeX = x;
      relativeY = h - y;
    } else if (anchor === 'bottom-right') {
      relativeX = w - x;
      relativeY = h - y;
    }

    // Keep within bounds (rough estimation for now)
    setLogoPos({
      x: Math.round(Math.max(0, relativeX)),
      y: Math.round(Math.max(0, relativeY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const getLogoStyle = () => {
    // Match FFmpeg: scale logo as a PERCENTAGE of the output frame width (W*scale).
    // containerRef tracks the actual rendered width of the 16:9 preview canvas.
    const containerWidth = containerRef.current?.offsetWidth || 1920;
    // logoScale of 0.15 → 15% of output width, just as FFmpeg does with W*0.15
    const logoWidth = Math.round(containerWidth * logoScale);

    const base = {
      position: 'absolute',
      width: logoWidth,
      height: 'auto',
      opacity: logoOpacity,
      cursor: isDragging ? 'grabbing' : 'grab',
      transition: isDragging ? 'none' : 'all 0.1s ease',
      zIndex: 10,
      filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))',
      pointerEvents: 'auto'
    };

    if (anchor === 'top-left') {
      return { ...base, top: logoPos.y, left: logoPos.x };
    } else if (anchor === 'top-right') {
      return { ...base, top: logoPos.y, right: logoPos.x };
    } else if (anchor === 'bottom-left') {
      return { ...base, bottom: logoPos.y, left: logoPos.x };
    } else if (anchor === 'bottom-right') {
      return { ...base, bottom: logoPos.y, right: logoPos.x };
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box>
          <Typography variant="h5" className="neon-text" sx={{ fontWeight: 800 }}>{t('graphics.header.title')}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1.2, fontSize: '0.65rem' }}>{t('graphics.header.subtitle')}</Typography>
        </Box>
        {activeTab !== 3 && (
          <Stack direction="row" spacing={2}>
            <Tooltip title={t('graphics.tooltips.reset')} arrow>
              <Button variant="outlined" startIcon={<ResetIcon />} onClick={fetchSettings} disabled={saving} sx={{ borderRadius: 2, fontWeight: 800 }}>
                {t('graphics.buttons.reset')}
              </Button>
            </Tooltip>
            <Tooltip title={t('graphics.tooltips.save')} arrow>
              <Button variant="contained" startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />} onClick={handleSave} disabled={saving} sx={{ borderRadius: 2, fontWeight: 800, px: 4, minWidth: '220px' }}>
                {saving ? t('common.saving') : t('graphics.buttons.save')}
              </Button>
            </Tooltip>
          </Stack>
        )}
      </Box>

      {/* Page-level tabs — always visible */}
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 1.5, borderBottom: 1, borderColor: 'divider', minHeight: 38 }}>
        <Tab label={t('graphics.tabs.position')} sx={{ fontWeight: 800, minHeight: 38, fontSize: '0.75rem', textTransform: 'none' }} />
        <Tab label={t('graphics.tabs.style')} sx={{ fontWeight: 800, minHeight: 38, fontSize: '0.75rem', textTransform: 'none' }} />
        <Tab label={t('graphics.tabs.layer')} sx={{ fontWeight: 800, minHeight: 38, fontSize: '0.75rem', textTransform: 'none' }} />
        <Tab label={t('graphics.tabs.templates', 'Templates')} sx={{ fontWeight: 800, minHeight: 38, fontSize: '0.75rem', textTransform: 'none' }} />
      </Tabs>

      {/* Preview + Controls grid — all tabs */}
      {<Grid container spacing={2} sx={{ flexGrow: 1, minHeight: 0 }}>
        {/* Preview Area */}
        <Grid item xs={12} lg={8} sx={{ height: '100%' }}>
          <Paper className="glass-panel" sx={{
            p: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.6, display: 'flex', alignItems: 'center', gap: 1 }}>
                <VisibilityIcon sx={{ fontSize: 16 }} /> {t('graphics.preview.title')}
              </Typography>
              <Chip
                label={isDragging ? t('graphics.preview.positioning') : t('graphics.preview.ready')}
                size="small"
                color={isDragging ? "primary" : "default"}
                sx={{ fontWeight: 800, height: 20, fontSize: '0.6rem' }}
              />
            </Box>

            {/* 16:9 wrapper — ensures proportional canvas regardless of container height */}
            <Box sx={{ width: '100%', aspectRatio: '16/9', position: 'relative', flexShrink: 0 }}>
              <Box
                ref={containerRef}
                sx={{
                  position: 'absolute', inset: 0,
                  bgcolor: '#0a0a0a',
                  borderRadius: 3,
                  overflow: 'hidden',
                  // Video-like dark background with subtle colour gradient — no external URL
                  background: isLivePlaying
                    ? '#000'
                    : 'linear-gradient(160deg, #0d1117 0%, #111827 50%, #0a0a10 100%)',
                  boxShadow: 'inset 0 0 80px rgba(0,0,0,0.7)',
                  userSelect: 'none'
                }}
              >
                {/* Subtle scanline overlay for realistic video feel */}
                {!isLivePlaying && (
                  <Box sx={{
                    position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)',
                  }} />
                )}
                {/* EBU colour bars strip at bottom — classic test pattern */}
                {!isLivePlaying && (
                  <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '8%', display: 'flex', zIndex: 1 }}>
                    {['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'].map((c, i) => (
                      <Box key={i} sx={{ flex: 1, bgcolor: c, opacity: 0.5 }} />
                    ))}
                  </Box>
                )}
                {/* Live HLS feed background — clean stream (no logo overlay) — hls.js direct */}
                {isLivePlaying && (
                  <Box
                    sx={{
                      position: 'absolute', top: 0, left: 0,
                      width: '100%', height: '100%',
                      zIndex: 0,
                      pointerEvents: 'none',
                      bgcolor: '#000',
                    }}
                  >
                    <video
                      ref={cleanVideoRef}
                      muted
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </Box>
                )}

                <Box
                  ref={logoRef}
                  component="img"
                  src={`${settings?.logo_path || "/api/settings/logo"}?v=${logoCacheBust}`}
                  onMouseDown={handleMouseDown}
                  sx={{
                    ...getLogoStyle(),
                    // Add a subtle border if it's the default logo to indicate it can be moved
                    border: !settings?.logoPath ? '1px dashed rgba(0, 229, 255, 0.3)' : 'none',
                  }}
                  onError={(e) => {
                    e.target.src = "/assets/protected/Cloud_Onepa_Playout_Infinity_Logo_remodelado.png";
                    e.target.onerror = null; // Prevent infinite loop
                  }}
                />

                {/* Position Information Overlay */}
                <Box sx={{
                  position: 'absolute',
                  bottom: 10,
                  left: 10,
                  p: 1,
                  bgcolor: 'rgba(0,0,0,0.8)',
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.1)',
                  zIndex: 20
                }}>
                  <Typography sx={{ color: '#fff', fontSize: '0.7rem', fontWeight: 800, fontFamily: 'monospace' }}>
                    X: {logoPos.x} PX | Y: {logoPos.y} PX | ANCHOR: {anchor.toUpperCase()}
                  </Typography>
                </Box>

                {/* Graphics Layers Preview */}
                <LayerPreview
                  layers={graphicsLayers}
                  selectedLayerId={selectedLayerId}
                  onLayerSelect={(id) => {
                    setSelectedLayerId(id);
                  }}
                  onLayerDoubleClick={(layer) => {
                    setLayerToEdit(layer);
                    setActiveTab(2); // Switch to LAYER tab
                  }}
                  onLayerMove={async (id, x, y, isFinished) => {
                    // Update local state for real-time preview
                    setGraphicsLayers(prev => prev.map(l =>
                      l.id === id ? { ...l, position_x: x, position_y: y } : l
                    ));

                    // Update backend on drag end
                    if (isFinished) {
                      try {
                        await graphicsService.updatePosition(id, { position_x: x, position_y: y });
                        showSuccess('Layer position updated');
                      } catch (error) {
                        const msg = error.response?.data?.error || error.message;
                        showError(`Failed to save layer position: ${msg}`);
                      }
                    }
                  }}
                />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Controls Area */}
        <Grid item xs={12} lg={4} sx={{ height: '100%' }}>
          <Paper className="glass-panel" sx={{ p: 1.5, height: '100%', overflowY: 'auto' }}>
            {activeTab === 0 && (
              <Stack spacing={2}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {t('graphics.position.anchor_title')}
                    </Typography>
                    <Chip
                      label={selectedLayer ? `${t('graphics.position.layer_prefix')}${selectedLayer.name.toUpperCase()}` : t('graphics.position.main_logo')}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 800, height: 20, fontSize: '0.6rem' }}
                      onDelete={selectedLayer ? () => setSelectedLayerId(null) : undefined}
                      deleteIcon={selectedLayer ? <ResetIcon sx={{ fontSize: '10px !important' }} /> : undefined}
                    />
                  </Box>
                  <Grid container spacing={1}>
                    {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(pos => {
                      const isCurrent = (selectedLayer ? selectedLayer.anchor : anchor) === pos;
                      return (
                        <Grid item xs={6} key={pos}>
                          <Tooltip title={t('graphics.tooltips.anchor', { pos: pos.replace('-', ' ') })} arrow>
                            <Button
                              fullWidth
                              variant={isCurrent ? "contained" : "outlined"}
                              onClick={async () => {
                                if (selectedLayer) {
                                  try {
                                    const response = await graphicsService.update(selectedLayerId, { anchor: pos });
                                    const updatedLayer = response.data;
                                    setGraphicsLayers(prev => prev.map(l =>
                                      l.id === updatedLayer.id ? updatedLayer : l
                                    ));
                                    showSuccess('Layer anchor updated');
                                  } catch (error) {
                                    showError('Failed to update anchor');
                                  }
                                } else {
                                  setAnchor(pos);
                                }
                              }}
                              sx={{ borderRadius: 2, fontWeight: 800, fontSize: '0.7rem' }}
                            >
                              {pos.replace('-', ' ').toUpperCase()}
                            </Button>
                          </Tooltip>
                        </Grid>
                      );
                    })}
                  </Grid>

                  {!selectedLayer && graphicsLayers.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.6, mb: 1, display: 'block' }}>
                        {t('graphics.position.select_active_layer')}:
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                        {graphicsLayers.filter(l => l.enabled).map(layer => (
                          <Chip
                            key={layer.id}
                            label={layer.name}
                            size="small"
                            onClick={() => setSelectedLayerId(layer.id)}
                            sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>

                <Divider sx={{ opacity: 0.1 }} />

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, fontSize: '0.8rem' }}>{t('graphics.position.offset_title')}</Typography>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, display: 'block' }}>
                      {t('graphics.position.axis_x')} ({selectedLayer ? selectedLayer.position_x : logoPos.x}px)
                    </Typography>
                    <Slider
                      value={selectedLayer ? selectedLayer.position_x : logoPos.x}
                      min={0}
                      max={1920}
                      onChange={(e, v) => {
                        if (selectedLayer) {
                          setGraphicsLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, position_x: v } : l));
                        } else {
                          setLogoPos({ ...logoPos, x: v });
                        }
                      }}
                      onChangeCommitted={async (e, v) => {
                        if (selectedLayer) {
                          try {
                            const response = await graphicsService.updatePosition(selectedLayerId, {
                              position_x: v,
                              position_y: selectedLayer.position_y
                            });
                            // Use server response to ensure sync
                            const updatedLayer = response.data;
                            setGraphicsLayers(prev => prev.map(l => l.id === updatedLayer.id ? updatedLayer : l));
                          } catch (err) {
                            showError('Failed to sync position');
                          }
                        }
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, display: 'block' }}>
                      {t('graphics.position.axis_y')} ({selectedLayer ? selectedLayer.position_y : logoPos.y}px)
                    </Typography>
                    <Slider
                      value={selectedLayer ? selectedLayer.position_y : logoPos.y}
                      min={0}
                      max={1080}
                      onChange={(e, v) => {
                        if (selectedLayer) {
                          setGraphicsLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, position_y: v } : l));
                        } else {
                          setLogoPos({ ...logoPos, y: v });
                        }
                      }}
                      onChangeCommitted={async (e, v) => {
                        if (selectedLayer) {
                          try {
                            const response = await graphicsService.updatePosition(selectedLayerId, {
                              position_x: selectedLayer.position_x,
                              position_y: v
                            });
                            // Use server response to ensure sync
                            const updatedLayer = response.data;
                            setGraphicsLayers(prev => prev.map(l => l.id === updatedLayer.id ? updatedLayer : l));
                          } catch (err) {
                            showError('Failed to sync position');
                          }
                        }
                      }}
                    />
                  </Box>
                </Box>
              </Stack>
            )}

            {activeTab === 1 && (
              <Stack spacing={4}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{t('graphics.style.scale_title')}</Typography>
                    <Chip
                      label={selectedLayer ? `${t('graphics.position.layer_prefix')}${selectedLayer.name.toUpperCase()}` : t('graphics.position.main_logo')}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 800, height: 20, fontSize: '0.6rem' }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, display: 'block' }}>
                    {t('graphics.style.magnitude')} ({selectedLayer ? 'FIXED' : Math.round(logoScale * 100) + '%'})
                  </Typography>
                  <Tooltip title={selectedLayer ? "Tamanho gerido nas definições da camada" : "Aumentar ou diminuir o tamanho do logo"} arrow placement="left">
                    <span>
                      <Slider
                        value={selectedLayer ? 1.0 : logoScale}
                        min={0.1}
                        max={3.0}
                        step={0.05}
                        disabled={!!selectedLayer}
                        onChange={(e, v) => setLogoScale(v)}
                      />
                    </span>
                  </Tooltip>
                </Box>

                <Divider sx={{ opacity: 0.1 }} />

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3 }}>{t('graphics.style.opacity_title')}</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, display: 'block' }}>
                    {t('graphics.style.alpha')} ({Math.round((selectedLayer ? selectedLayer.opacity : logoOpacity) * 100)}%)
                  </Typography>
                  <Tooltip title="Ajustar a transparência" arrow placement="left">
                    <Slider
                      value={selectedLayer ? selectedLayer.opacity : logoOpacity}
                      min={0.1}
                      max={1.0}
                      step={0.05}
                      onChange={(e, v) => {
                        if (selectedLayer) {
                          setGraphicsLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, opacity: v } : l));
                        } else {
                          setLogoOpacity(v);
                        }
                      }}
                      onChangeCommitted={async (e, v) => {
                        if (selectedLayer) {
                          try {
                            await graphicsLayersAPI.update(selectedLayerId, { opacity: v });
                          } catch (err) {
                            showError('Failed to sync opacity');
                          }
                        }
                      }}
                    />
                  </Tooltip>
                </Box>
              </Stack>
            )}

            {activeTab === 2 && (
              <LayerManager
                layers={graphicsLayers}
                onLayersChange={setGraphicsLayers}
                onRefresh={fetchLayers}
                initialEditLayer={layerToEdit}
                onEditClose={() => setLayerToEdit(null)}
              />
            )}

            {activeTab === 3 && (
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TemplatesIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {t('graphics.tabs.templates', 'Templates')}
                    </Typography>
                    <Chip label={templates.length} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800 }} />
                  </Box>
                  <Tooltip title="Refresh list" arrow>
                    <IconButton size="small" onClick={fetchTemplates} disabled={templatesLoading}>
                      {templatesLoading ? <CircularProgress size={14} /> : <RefreshIcon sx={{ fontSize: 16 }} />}
                    </IconButton>
                  </Tooltip>
                </Box>

                <Divider sx={{ opacity: 0.1 }} />

                {templates.length === 0 && !templatesLoading && (
                  <Box sx={{ py: 4, textAlign: 'center', opacity: 0.4 }}>
                    <TemplatesIcon sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                      No saved templates yet.
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      Create templates in the full editor.
                    </Typography>
                  </Box>
                )}

                {templates.map(tpl => (
                  <Paper key={tpl.id} sx={{
                    p: 1.5, borderRadius: 2,
                    bgcolor: 'rgba(0,229,255,0.04)',
                    border: '1px solid rgba(0,229,255,0.1)',
                    '&:hover': { borderColor: 'rgba(0,229,255,0.25)' },
                    transition: 'border-color 0.2s'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TemplatesIcon sx={{ fontSize: 16, color: 'primary.main', flexShrink: 0 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tpl.name}
                        </Typography>
                        {tpl.description && (
                          <Typography variant="caption" sx={{ opacity: 0.5, fontSize: '0.65rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tpl.description}
                          </Typography>
                        )}
                      </Box>
                      <Tooltip title="Delete template" arrow>
                        <IconButton size="small" color="error" onClick={() => handleDeleteTemplate(tpl.id)}
                          sx={{ flexShrink: 0, '&:hover': { bgcolor: 'rgba(244,67,54,0.1)' } }}>
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            )}

            {activeTab !== 3 && (
              <Box sx={{ mt: 'auto', pt: 4 }}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(0, 229, 255, 0.05)', borderRadius: 2, border: '1px solid rgba(0, 229, 255, 0.2)' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HelpIcon sx={{ fontSize: 16 }} /> {t('graphics.hint.title')}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7 }}>
                    {selectedLayer
                      ? t('graphics.hint.layer_desc', { name: selectedLayer.name })
                      : t('graphics.hint.logo_desc')}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>}
    </Box>
  );
}

