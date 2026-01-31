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
  Restore as ResetIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  DragIndicator as DragIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { settingsAPI } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

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

  useEffect(() => {
    fetchSettings();
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
                
                <Box 
                    ref={containerRef}
                    sx={{ 
                        flexGrow: 1, 
                        bgcolor: '#000', 
                        borderRadius: 3, 
                        overflow: 'hidden', 
                        position: 'relative',
                        backgroundImage: 'url("https://images.unsplash.com/photo-1492691523567-61709dcf9801?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80")', // Stock background for context
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8)',
                        userSelect: 'none'
                    }}
                >
                    {settings?.logo_path ? (
                        <Box 
                            ref={logoRef}
                            component="img"
                            src={settings.logo_path}
                            onMouseDown={handleMouseDown}
                            sx={getLogoStyle()}
                        />
                    ) : (
                        <Box 
                            ref={logoRef}
                            onMouseDown={handleMouseDown}
                            sx={{ 
                                ...getLogoStyle(),
                                bgcolor: 'rgba(0, 229, 255, 0.2)',
                                border: '2px dashed #00e5ff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                p: 1,
                                width: 120 * logoScale,
                                height: 60 * logoScale,
                            }}
                        >
                            <Typography sx={{ color: '#00e5ff', fontWeight: 800, fontSize: '0.6rem' }}>LOGO PLACEHOLDER</Typography>
                        </Box>
                    )}
                    
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
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>PONTO DE ANCORAGEM</Typography>
                            <Grid container spacing={1}>
                                {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(pos => (
                                    <Grid item xs={6} key={pos}>
                                        <Tooltip title={`Ancorar ao canto ${pos.replace('-', ' ')}`} arrow>
                                            <Button 
                                                fullWidth 
                                                variant={anchor === pos ? "contained" : "outlined"}
                                                onClick={() => setAnchor(pos)}
                                                sx={{ borderRadius: 2, fontWeight: 800, fontSize: '0.7rem' }}
                                            >
                                                {pos.replace('-', ' ').toUpperCase()}
                                            </Button>
                                        </Tooltip>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>

                        <Divider sx={{ opacity: 0.1 }} />

                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3 }}>AJUSTE FINO (OFFSET)</Typography>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, display: 'block' }}>EIXO X ({logoPos.x}px)</Typography>
                                <Slider 
                                    value={logoPos.x} 
                                    min={0} 
                                    max={1000} 
                                    onChange={(e, v) => setLogoPos({...logoPos, x: v})} 
                                />
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, display: 'block' }}>EIXO Y ({logoPos.y}px)</Typography>
                                <Slider 
                                    value={logoPos.y} 
                                    min={0} 
                                    max={1000} 
                                    onChange={(e, v) => setLogoPos({...logoPos, y: v})} 
                                />
                            </Box>
                        </Box>
                    </Stack>
                )}

                {activeTab === 1 && (
                    <Stack spacing={4}>
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3 }}>ESCALA & DIMENSÃO</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, display: 'block' }}>MAGNITUDE ({Math.round(logoScale * 100)}%)</Typography>
                            <Tooltip title="Aumentar ou diminuir o tamanho do logo" arrow placement="left">
                                <Slider 
                                    value={logoScale} 
                                    min={0.1} 
                                    max={3.0} 
                                    step={0.05}
                                    onChange={(e, v) => setLogoScale(v)} 
                                />
                            </Tooltip>
                        </Box>

                        <Divider sx={{ opacity: 0.1 }} />

                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3 }}>OPACIDADE DA CAMADA</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, display: 'block' }}>ALFA ({Math.round(logoOpacity * 100)}%)</Typography>
                            <Tooltip title="Ajustar a transparência da camada" arrow placement="left">
                                <Slider 
                                    value={logoOpacity} 
                                    min={0.1} 
                                    max={1.0} 
                                    step={0.05}
                                    onChange={(e, v) => setLogoOpacity(v)} 
                                />
                            </Tooltip>
                        </Box>
                    </Stack>
                )}

                {activeTab === 2 && (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                        <BrushIcon sx={{ fontSize: 48, opacity: 0.1, mb: 2 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, opacity: 0.4 }}>EM BREVE: MULTI-LAYER GRÁFICOS</Typography>
                        <Typography variant="caption" color="text.secondary">Adicione Relógios, Lower Thirds e Marquees de texto dinâmico.</Typography>
                    </Box>
                )}
                
                <Box sx={{ mt: 'auto', pt: 4 }}>
                    <Paper sx={{ p: 2, bgcolor: 'rgba(0, 229, 255, 0.05)', borderRadius: 2, border: '1px solid rgba(0, 229, 255, 0.2)' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <HelpIcon sx={{ fontSize: 16 }} /> DICA ALPHA
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7 }}>
                            Arraste o logo diretamente no preview para um posicionamento intuitivo. Utilize os sliders para precisão milimétrica.
                        </Typography>
                    </Paper>
                </Box>
            </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
