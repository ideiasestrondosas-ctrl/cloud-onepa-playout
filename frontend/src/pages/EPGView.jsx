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
  Button
} from '@mui/material';
import {
  NavigateBefore,
  NavigateNext,
  Today,
  Info as InfoIcon,
  LiveTv
} from '@mui/icons-material';
import { playlistAPI } from '../services/api';
import { format, parseISO, addDays, isSameDay, differenceInSeconds } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export default function EPGView() {
  const theme = useTheme();
  const [playlists, setPlaylists] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
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

  const renderTimeRuler = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return (
      <Box sx={{ display: 'flex', height: 40, borderBottom: `1px solid ${theme.palette.divider}`, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 10, minWidth: DAY_WIDTH }}>
        {hours.map(hour => (
          <Box key={hour} sx={{ width: HOUR_WIDTH, borderLeft: `1px solid ${theme.palette.divider}`, pl: 0.5, fontSize: 12, color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
            {hour}:00
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
            width: 2,
            bgcolor: 'error.main',
            zIndex: 20,
            pointerEvents: 'none',
            '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: -4,
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: 'error.main'
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
                        <Box>
                            <Typography variant="subtitle2">{item.filename}</Typography>
                            <Typography variant="caption">{item.start_time} - {item.end_time}</Typography>
                            {item.metadata?.description && <Typography variant="body2" sx={{mt:1}}>{item.metadata.description}</Typography>}
                        </Box>
                    }>
                        <Paper 
                            sx={{
                                position: 'absolute',
                                left: left,
                                width: Math.max(width - 1, 2), // 1px margin
                                height: 80,
                                top: 10,
                                bgcolor: item.is_filler ? 'background.default' : 'primary.main', // lighter for filler?
                                color: item.is_filler ? 'text.secondary' : 'primary.contrastText',
                                overflow: 'hidden',
                                p: 1,
                                cursor: 'pointer',
                                '&:hover': {
                                    filter: 'brightness(1.1)',
                                    zIndex: 5
                                },
                                opacity: item.is_filler ? 0.7 : 1,
                                border: item.is_filler ? '1px dashed grey' : 'none'
                             }}
                             elevation={item.is_filler ? 0 : 3}
                        >
                            <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', lineHeight: 1 }}>
                                {item.metadata?.title || item.filename}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.8 }}>
                                {item.start_time && item.start_time.substring(0, 5)}
                            </Typography>
                        </Paper>
                    </Tooltip>
                );
            })}
        </Box>
    );
  };

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
        {/* Header Controls */}
        <Paper square sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 20 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LiveTv color="primary" /> Guia de Programação (EPG)
                </Typography>
                <Chip 
                    icon={<Today />} 
                    label={format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })} 
                    variant="outlined" 
                    onClick={scrollToNow}
                    clickable
                />
            </Box>
            <Stack direction="row" spacing={1}>
                <Button startIcon={<NavigateBefore />} onClick={() => setSelectedDate(d => addDays(d, -1))}>Anterior</Button>
                <Button onClick={() => setSelectedDate(new Date())}>Hoje</Button>
                <Button endIcon={<NavigateNext />} onClick={() => setSelectedDate(d => addDays(d, 1))}>Próximo</Button>
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
                            <Box sx={{ 
                                position: 'sticky', 
                                left: 0, 
                                zIndex: 15, 
                                bgcolor: 'background.paper', 
                                p: 1, 
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                borderRight: `1px solid ${theme.palette.divider}`,
                                width: 200,
                                display: 'inline-block',
                                verticalAlign: 'top',
                                height: 100
                            }}>
                                <Typography variant="subtitle1" noWrap>{playlist.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {playlist.total_duration ? `${(playlist.total_duration/3600).toFixed(1)}h` : ''}
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
    </Box>
  );
}
