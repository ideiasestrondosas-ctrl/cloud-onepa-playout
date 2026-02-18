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
  Replay as ResetIcon
} from '@mui/icons-material';
import { settingsAPI, playoutAPI } from '../services/api';
import graphicsService from '../services/graphicsLayersAPI';
import { useNotification } from '../contexts/NotificationContext';
import LayerManager from '../components/GraphicsLayers/LayerManager';
import LayerPreview from '../components/GraphicsLayers/LayerPreview';

export default function GraphicsEditor() {
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

  useEffect(() => {
    fetchSettings();
    fetchLayers();
  }, []);

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
      showError('Falha ao carregar as configurações de gráficos');
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
      showError('Falha ao carregar camadas de gráficos');
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
    const iv = setInterval(check, 5000);
    return () => clearInterval(iv);
  }, []);

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
      showSuccess('Gráficos atualizados com sucesso!');
    } catch (error) {
      showError('Erro ao guardar configurações de gráficos');
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
    const base = {
      position: 'absolute',
      width: 120 * logoScale,
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" className="neon-text" sx={{ fontWeight: 800 }}>GRAPHICS ENGINE</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 2 }}>WYSIWYG ON-AIR BRANDING EDITOR</Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Tooltip title="Restaurar definições guardadas" arrow>
            <Button
              variant="outlined"
              startIcon={<ResetIcon />}
              onClick={fetchSettings}
              disabled={saving}
              sx={{ borderRadius: 2, fontWeight: 800 }}
            >
              REPOR
            </Button>
          </Tooltip>
          <Tooltip title="Salvar definições de posicionamento e estilo" arrow>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
              sx={{ borderRadius: 2, fontWeight: 800, px: 4, minWidth: '220px' }}
            >
              {saving ? 'A GUARDAR...' : 'GUARDAR ALTERAÇÕES'}
            </Button>
          </Tooltip>
        </Stack>
      </Box>

      <Grid container spacing={3} sx={{ flexGrow: 1, minHeight: 0 }}>
        {/* Preview Area */}
        <Grid item xs={12} lg={8} sx={{ height: '100%' }}>
          <Paper className="glass-panel" sx={{
            p: 2,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.6, display: 'flex', alignItems: 'center', gap: 1 }}>
                <VisibilityIcon sx={{ fontSize: 16 }} /> PRÉ-VISUALIZAÇÃO EM TEMPO REAL (16:9)
              </Typography>
              <Chip
                label={isDragging ? "A POSICIONAR..." : "READY"}
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
                {/* Live HLS feed background — only when playout is active */}
                {isLivePlaying && (
                  <Box
                    component="video"
                    src="/hls/stream_low.m3u8"
                    autoPlay
                    muted
                    loop={false}
                    playsInline
                    sx={{
                      position: 'absolute', top: 0, left: 0,
                      width: '100%', height: '100%',
                      objectFit: 'cover',
                      zIndex: 0,
                      pointerEvents: 'none',
                      opacity: 0.75,
                    }}
                  />
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
                  bottom: 20,
                  left: 20,
                  p: 1.5,
                  bgcolor: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(10px)',
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
          <Paper className="glass-panel" sx={{ p: 4, height: '100%', overflowY: 'auto' }}>
            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 4, minHeight: 40 }}>
              <Tab label="POSIÇÃO" sx={{ fontWeight: 800, minHeight: 40 }} />
              <Tab label="ESTILO" sx={{ fontWeight: 800, minHeight: 40 }} />
              <Tab label="LAYER" sx={{ fontWeight: 800, minHeight: 40 }} />
            </Tabs>

            {activeTab === 0 && (
              <Stack spacing={4}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      PONTO DE ANCORAGEM
                    </Typography>
                    <Chip
                      label={selectedLayer ? `CAMADA: ${selectedLayer.name.toUpperCase()}` : "LOGO PRINCIPAL"}
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
                          <Tooltip title={`Ancorar ao canto ${pos.replace('-', ' ')}`} arrow>
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
                        OU SELECIONE UMA CAMADA ATIVA:
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
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3 }}>AJUSTE FINO (OFFSET)</Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, display: 'block' }}>
                      EIXO X ({selectedLayer ? selectedLayer.position_x : logoPos.x}px)
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
                      EIXO Y ({selectedLayer ? selectedLayer.position_y : logoPos.y}px)
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
                            const response = await graphicsLayersAPI.updatePosition(selectedLayerId, {
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
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>ESCALA & DIMENSÃO</Typography>
                    <Chip
                      label={selectedLayer ? `CAMADA: ${selectedLayer.name.toUpperCase()}` : "LOGO PRINCIPAL"}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 800, height: 20, fontSize: '0.6rem' }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, display: 'block' }}>
                    MAGNITUDE ({selectedLayer ? 'FIXED' : Math.round(logoScale * 100) + '%'})
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
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3 }}>OPACIDADE DA CAMADA</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, display: 'block' }}>
                    ALFA ({Math.round((selectedLayer ? selectedLayer.opacity : logoOpacity) * 100)}%)
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

            <Box sx={{ mt: 'auto', pt: 4 }}>
              <Paper sx={{ p: 2, bgcolor: 'rgba(0, 229, 255, 0.05)', borderRadius: 2, border: '1px solid rgba(0, 229, 255, 0.2)' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HelpIcon sx={{ fontSize: 16 }} /> DICA ALPHA
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7 }}>
                  {selectedLayer
                    ? `A editar camada "${selectedLayer.name}". Clique no fundo do preview para voltar ao Logo.`
                    : "Arraste o logo diretamente no preview para um posicionamento intuitivo. Utilize os sliders para precisão milimétrica."}
                </Typography>
              </Paper>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
