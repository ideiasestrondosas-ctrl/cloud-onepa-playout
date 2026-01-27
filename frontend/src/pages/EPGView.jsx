import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  LinearProgress,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Link
} from '@mui/material';
import {
  NavigateBefore,
  NavigateNext,
  Today,
  Info as InfoIcon,
  LiveTv,
  Close as CloseIcon,
  Description,
  Timer,
  Movie,
  FolderOpen,
  Tag
} from '@mui/icons-material';
import { playlistAPI, mediaAPI } from '../services/api';
import { format, parseISO, addDays, isSameDay, differenceInSeconds } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export default function EPGView() {
  const theme = useTheme();
  const [playlists, setPlaylists] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [liveMetadata, setLiveMetadata] = useState(null);
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const scrollRef = useRef(null);

  // Constants for timeline sizing
  const PIXELS_PER_MINUTE = 4;
  const HOUR_WIDTH = 60 * PIXELS_PER_MINUTE;
  const DAY_WIDTH = 24 * HOUR_WIDTH;

  useEffect(() => {
    fetchPlaylists();
  }, [selectedDate]);

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await playlistAPI.list({ date: dateStr });
      console.log('[EPG] Fetched playlists for', dateStr, ':', response.data.playlists);
      response.data.playlists.forEach(p => {
        console.log(`[EPG] Playlist "${p.name}":`, p.content?.program?.length || 0, 'clips');
      });
      setPlaylists(response.data.playlists);
    } catch (error) {
      console.error("Failed to fetch EPG:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToNow = () => {
    if (scrollRef.current) {
        const now = new Date();
        const minutes = now.getHours() * 60 + now.getMinutes();
        const position = minutes * PIXELS_PER_MINUTE;
        scrollRef.current.scrollLeft = position - (window.innerWidth / 2) + 200; // Center
    }
  };

  useEffect(() => {
    // Initial scroll to now if viewing today
    if (isSameDay(selectedDate, new Date())) {
        setTimeout(scrollToNow, 500);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (dialogOpen && selectedItem?.media_id) {
        fetchLiveMetadata(selectedItem.media_id);
    } else {
        setLiveMetadata(null);
    }
  }, [dialogOpen, selectedItem]);

  const formatShortDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchLiveMetadata = async (mediaId) => {
    try {
        setIsFetchingLive(true);
        const response = await mediaAPI.get(mediaId); 
        if (response.data) {
            // Include basic media info in the live object if not in metadata field
            const combined = {
                ...response.data.metadata,
                media_type: response.data.media_type,
                path: response.data.path,
                filename: response.data.filename,
                duration: response.data.duration
            };
            setLiveMetadata(combined);
        }
    } catch (error) {
        console.error("Failed to fetch live metadata:", error);
    } finally {
        setIsFetchingLive(false);
    }
  };

  const renderTimeRuler = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return (
      <Box sx={{ 
        display: 'flex', 
        height: 50, 
        borderBottom: `1px solid rgba(255, 255, 255, 0.05)`, 
        position: 'sticky', 
        top: 0, 
        bgcolor: 'rgba(10, 11, 16, 0.8)', 
        backdropFilter: 'blur(10px)',
        zIndex: 10, 
        minWidth: DAY_WIDTH 
      }}>
        {hours.map(hour => (
          <Box key={hour} sx={{ 
            width: HOUR_WIDTH, 
            borderLeft: `1px solid rgba(255, 255, 255, 0.05)`, 
            pl: 1, 
            fontSize: 10, 
            fontWeight: 800,
            color: 'rgba(255, 255, 255, 0.3)', 
            display: 'flex', 
            alignItems: 'center',
            textTransform: 'uppercase'
          }}>
            {hour.toString().padStart(2, '0')}:00
          </Box>
        ))}
      </Box>
    );
  };

  const renderCurrentTimeLine = () => {
    if (!isSameDay(selectedDate, new Date())) return null;
    
    // Calculate current position
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const left = minutes * PIXELS_PER_MINUTE;

    return (
        <Box sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: left,
            width: 3,
            bgcolor: 'primary.main',
            zIndex: 20,
            pointerEvents: 'none',
            boxShadow: '0 0 15px rgba(0, 229, 255, 0.5)',
            '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: -6,
                width: 15,
                height: 15,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                boxShadow: '0 0 20px rgba(0, 229, 255, 0.8)',
                border: '3px solid rgba(0, 0, 0, 0.5)'
            }
        }} />
    );
  };

  const renderPlaylistRow = (playlist) => {
    if (!playlist.content?.program) return null;

    let currentTime = 0; // seconds from start of playlist (00:00:00)

    return (
        <Box sx={{ position: 'relative', height: 100, borderBottom: `1px solid ${theme.palette.divider}`, minWidth: DAY_WIDTH }}>
            {playlist.content.program.map((item, index) => {
                // Calculate width based on duration
                const duration = item.duration || 0;
                const width = (duration / 60) * PIXELS_PER_MINUTE;
                const startParams = item.start_time ? item.start_time.split(':').map(Number) : [0,0,0];
                const startSeconds = startParams[0] * 3600 + startParams[1] * 60 + startParams[2];
                const left = (startSeconds / 60) * PIXELS_PER_MINUTE;

                return (
                    <Tooltip key={`${playlist.id}-${index}`} title={
                        <Box sx={{ p: 1, minWidth: 250 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                {item.metadata?.title || item.filename}
                            </Typography>
                            
                            <Divider sx={{ my: 1, opacity: 0.2 }} />
                            
                            <Grid container spacing={1}>
                                <Grid item xs={12}>
                                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        🕒 {item.start_time} - {item.end_time} ({item.duration ? formatShortDuration(item.duration) : 'N/A'})
                                    </Typography>
                                </Grid>
                            </Grid>

                            {(item.metadata?.description || item.metadata?.director || item.metadata?.rating || item.metadata?.genre || item.metadata?.tags) && (
                                <Box sx={{ mt: 1.5, p: 1, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                                    {(item.metadata?.rating || item.metadata?.genre || item.metadata?.tags) && (
                                        <Box sx={{ mb: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {item.metadata?.rating && (
                                                <Chip label={item.metadata.rating} size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem' }} />
                                            )}
                                            {(item.metadata?.genre || item.metadata?.tags) && (
                                                <Chip 
                                                    label={Array.isArray(item.metadata?.genre || item.metadata?.tags) ? (item.metadata?.genre || item.metadata?.tags)[0] : (item.metadata?.genre || item.metadata?.tags)} 
                                                    size="small" 
                                                    variant="outlined" 
                                                    sx={{ height: 18, fontSize: '0.65rem' }} 
                                                />
                                            )}
                                        </Box>
                                    )}
                                    {item.metadata?.description && (
                                        <Typography variant="caption" display="block" sx={{ 
                                            fontStyle: 'italic', 
                                            display: '-webkit-box', 
                                            WebkitLineClamp: 3, 
                                            WebkitBoxOrient: 'vertical', 
                                            overflow: 'hidden',
                                            lineHeight: 1.2,
                                            mb: 0.5
                                        }}>
                                            {item.metadata?.description}
                                        </Typography>
                                    )}
                                    {item.metadata?.director && (
                                        <Typography variant="caption" sx={{ fontWeight: 'bold', opacity: 0.8, display: 'block' }}>
                                            🎬 Dir: {item.metadata?.director}
                                        </Typography>
                                    )}
                                    {(item.metadata?.source_service) && (
                                        <Typography variant="caption" sx={{ mt: 0.5, display: 'block', opacity: 0.5, fontSize: '0.6rem' }}>
                                            Fonte: {item.metadata?.source_service}
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'primary.main', fontWeight: 'bold', textAlign: 'center' }}>
                                🖱️ Clique para ver tudo
                            </Typography>
                        </Box>
                    }>
                        <Paper 
                            onClick={() => {
                                setSelectedItem(item);
                                setDialogOpen(true);
                            }}
                            className={item.is_filler ? "" : "neon-glow"}
                            sx={{
                                position: 'absolute',
                                left: left,
                                width: Math.max(width - 2, 4), // 2px margin
                                height: 70,
                                top: 15,
                                background: item.is_filler ? 'rgba(255, 255, 255, 0.03)' : 'linear-gradient(135deg, rgba(0, 229, 255, 0.15) 0%, rgba(0, 229, 255, 0.05) 100%)',
                                color: item.is_filler ? 'rgba(255, 255, 255, 0.3)' : '#fff',
                                overflow: 'hidden',
                                p: 1.5,
                                cursor: 'pointer',
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: item.is_filler ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 229, 255, 0.3)',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    transform: 'scale(1.02)',
                                    borderColor: 'primary.main',
                                    zIndex: 5,
                                    background: item.is_filler ? 'rgba(255, 255, 255, 0.08)' : 'linear-gradient(135deg, rgba(0, 229, 255, 0.3) 0%, rgba(0, 229, 255, 0.1) 100%)',
                                },
                             }}
                        >
                            <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', lineHeight: 1.2, mb: 0.5, fontSize: '0.75rem' }}>
                                {(item.metadata?.title || item.filename || 'Sem Nome').toUpperCase()}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.6, letterSpacing: 1 }}>
                                {item.start_time && item.start_time.substring(0, 5)} - {item.end_time && item.end_time.substring(0, 5)}
                            </Typography>
                        </Paper>
                    </Tooltip>
                );
            })}
        </Box>
    );
  };

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Background Glow */}
        <Box sx={{ 
            position: 'absolute', 
            top: '20%', 
            right: '10%', 
            width: '400px', 
            height: '400px', 
            bgcolor: 'primary.main', 
            filter: 'blur(150px)', 
            opacity: 0.05, 
            pointerEvents: 'none',
            zIndex: 0
        }} />

        {/* Header Controls */}
        <Paper className="glass-panel" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 20, borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box>
                    <Typography variant="h5" className="neon-text" sx={{ fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1 }}>
                        TV GUIDE
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', fontSize: '0.6rem' }}>
                        ONEPA PLAYOUT • ALPHA INTELLIGENCE
                    </Typography>
                </Box>
                <Chip 
                    icon={<Today sx={{ color: 'primary.main !important' }} />} 
                    label={format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR }).toUpperCase()} 
                    className="glass-panel"
                    sx={{ 
                        bgcolor: 'rgba(255, 255, 255, 0.05)', 
                        color: 'primary.main', 
                        fontWeight: 800,
                        border: '1px solid rgba(0, 229, 255, 0.2)',
                        height: 32,
                        fontSize: '0.7rem'
                    }} 
                    onClick={scrollToNow}
                    clickable
                />
            </Box>
            <Stack direction="row" spacing={1}>
                <Button size="small" variant="text" sx={{ fontWeight: 800, color: 'text.secondary' }} startIcon={<NavigateBefore />} onClick={() => setSelectedDate(d => addDays(d, -1))}>ANTERIOR</Button>
                <Button size="small" sx={{ fontWeight: 800, bgcolor: 'rgba(255, 255, 255, 0.05)' }} onClick={() => setSelectedDate(new Date())}>HOJE</Button>
                <Button size="small" variant="text" sx={{ fontWeight: 800, color: 'text.secondary' }} endIcon={<NavigateNext />} onClick={() => setSelectedDate(d => addDays(d, 1))}>PRÓXIMO</Button>
            </Stack>
        </Paper>

        {loading && <LinearProgress />}

        {/* Timeline Area */}
        <Box 
            ref={scrollRef}
            sx={{ 
                flexGrow: 1, 
                overflowX: 'auto', 
                overflowY: 'hidden', 
                position: 'relative',
                bgcolor: 'background.default',
                cursor: 'grab',
                '&:active': { cursor: 'grabbing' }
            }}
            onMouseDown={(e) => {
                // Simple drag to scroll implementation
                const ele = scrollRef.current;
                if(!ele) return;
                const startX = e.pageX - ele.offsetLeft;
                const scrollLeft = ele.scrollLeft;
                
                const onMouseMove = (e) => {
                    const x = e.pageX - ele.offsetLeft;
                    const walk = (x - startX) * 2; // scroll-fast
                    ele.scrollLeft = scrollLeft - walk;
                };
                const onMouseUp = () => {
                   document.removeEventListener('mousemove', onMouseMove);
                   document.removeEventListener('mouseup', onMouseUp);
                };
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            }}
        >
            {renderTimeRuler()}
            {renderCurrentTimeLine()}
            
            <Box sx={{ position: 'relative', minWidth: DAY_WIDTH, minHeight: '100%' }}>
                {playlists.length > 0 ? (
                    playlists.map(playlist => (
                        <Box key={playlist.id}>
                            {/* Playlist Label Sticky Left */}
                            <Box className="glass-panel" sx={{ 
                                position: 'sticky', 
                                left: 0, 
                                zIndex: 15, 
                                bgcolor: 'rgba(10, 11, 16, 0.95)', 
                                backdropFilter: 'blur(10px)',
                                p: 2, 
                                borderBottom: `1px solid rgba(255, 255, 255, 0.05)`,
                                borderRight: `1px solid rgba(0, 229, 255, 0.2)`,
                                borderTop: 'none', borderLeft: 'none',
                                width: 200,
                                display: 'inline-block',
                                verticalAlign: 'top',
                                height: 100,
                                borderRadius: 0
                            }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.5 }} noWrap>{playlist.name}</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.65rem' }}>
                                    {playlist.total_duration ? `DURAÇÃO: ${(playlist.total_duration/3600).toFixed(1)}H` : 'PLAYLIST VAZIA'}
                                </Typography>
                            </Box>
                            
                            {/* Timeline Content */}
                            <Box sx={{ display: 'inline-block', verticalAlign: 'top', width: `calc(100% - 200px)` }}>
                                {renderPlaylistRow(playlist)}
                            </Box>
                        </Box>
                    ))
                ) : (
                   <Box sx={{ p: 4, textAlign: 'center', width: '100vw', position: 'sticky', left: 0 }}>
                       <Typography color="text.secondary">Nenhuma programação encontrada para este dia.</Typography>
                   </Box> 
                )}
            </Box>
        </Box>
        
        {/* Metadata Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth className="glass-dialog">
            {selectedItem && (
                <>
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 2 }}>
                        <Box>
                            <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                                PROGRAMAÇÃO DETALHADA
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', fontSize: '0.6rem' }}>
                                ONEPA PLAYOUT • ALPHA INTELLIGENCE
                            </Typography>
                        </Box>
                        <IconButton onClick={() => setDialogOpen(false)} size="small" sx={{ color: 'rgba(255, 255, 255, 0.3)', '&:hover': { color: 'primary.main' } }}>
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ p: 4, pt: 0 }}>
                        {isFetchingLive && <LinearProgress sx={{ my: 2, borderRadius: 1 }} />}
                        
                        <Box sx={{ mb: 4, display: 'flex', gap: 3 }}>
                            <Box sx={{ width: 140, flexShrink: 0 }}>
                                {(liveMetadata?.poster_url || liveMetadata?.poster || selectedItem.metadata?.poster_url || selectedItem.metadata?.poster) ? (
                                    <Box 
                                        component="img" 
                                        src={liveMetadata?.poster_url || liveMetadata?.poster || selectedItem.metadata?.poster_url || selectedItem.metadata?.poster} 
                                        sx={{ width: '100%', borderRadius: 2, boxShadow: '0 0 20px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                ) : (
                                    <Box sx={{ width: 140, height: 200, bgcolor: 'rgba(255, 255, 255, 0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                                        <Movie sx={{ fontSize: 40, opacity: 0.1 }} />
                                    </Box>
                                )}
                            </Box>
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                                    {liveMetadata?.title || selectedItem.metadata?.title || selectedItem.filename}
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                    {(liveMetadata?.rating || selectedItem.metadata?.rating) && (
                                        <Chip label={liveMetadata?.rating || selectedItem.metadata.rating} size="small" sx={{ fontWeight: 800, bgcolor: 'primary.main', color: '#000', height: 20, fontSize: '0.65rem' }} />
                                    )}
                                    <Chip label={liveMetadata?.media_type?.toUpperCase() || selectedItem.media_type?.toUpperCase() || 'VÍDEO'} size="small" sx={{ fontWeight: 800, bgcolor: 'rgba(255, 255, 255, 0.05)', height: 20, fontSize: '0.65rem' }} />
                                    {(liveMetadata?.year || selectedItem.metadata?.year) && (
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{liveMetadata?.year || selectedItem.metadata.year}</Typography>
                                    )}
                                </Stack>
                                <Box sx={{ p: 1.5, bgcolor: 'rgba(0, 229, 255, 0.05)', borderRadius: 2, border: '1px solid rgba(0, 229, 255, 0.1)' }}>
                                    <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800, display: 'block', mb: 0.5, letterSpacing: 1 }}>HORÁRIO DE EMISSÃO</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                                        {selectedItem.start_time} — {selectedItem.end_time}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        <Stack spacing={4}>
                            <Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                    <Description fontSize="inherit" /> SINOPSE / DESCRIÇÃO
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.6 }}>
                                    {liveMetadata?.description || selectedItem.metadata?.description || 'Este conteúdo não possui uma sinopse detalhada registada no sistema.'}
                                </Typography>
                            </Box>

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, mb: 0.5, display: 'block' }}>REALIZAÇÃO</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{liveMetadata?.director || selectedItem.metadata?.director || 'Desconhecido'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, mb: 0.5, display: 'block' }}>CATEGORIA / GÉNERO</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        {Array.isArray(liveMetadata?.genre || liveMetadata?.tags || selectedItem.metadata?.genre || selectedItem.metadata?.tags) ? (liveMetadata?.genre || liveMetadata?.tags || selectedItem.metadata?.genre || selectedItem.metadata?.tags).join(', ') : (liveMetadata?.genre || liveMetadata?.tags || selectedItem.metadata?.genre || selectedItem.metadata?.tags) || 'Geral'}
                                    </Typography>
                                </Grid>
                            </Grid>

                            {(liveMetadata?.source_service || selectedItem.metadata?.source_service) && (
                                <Box sx={{ p: 2, bgcolor: 'rgba(0,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, display: 'block' }}>FONTE DE DADOS</Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>{liveMetadata?.source_service || selectedItem.metadata.source_service}</Typography>
                                    </Box>
                                    {(liveMetadata?.source_url || selectedItem.metadata?.source_url) && (
                                        <Button size="small" href={liveMetadata?.source_url || selectedItem.metadata.source_url} target="_blank" endIcon={<NavigateNext />} sx={{ fontWeight: 800, fontSize: '0.65rem' }}>VISITAR FONTE</Button>
                                    )}
                                </Box>
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, pt: 0 }}>
                        <Button fullWidth onClick={() => setDialogOpen(false)} variant="contained" sx={{ fontWeight: 800, py: 1.5 }}>FECHAR DETALHES</Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    </Box>
  );
}
