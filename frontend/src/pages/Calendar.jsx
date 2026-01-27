import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  IconButton,
  Grid,
  Stack,
  Divider,
  Alert,
  Tooltip,
  Paper
} from '@mui/material';
import { 
  PlayArrow as PlayIcon, 
  Delete as DeleteIcon,
  DeleteSweep as BulkDeleteIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { scheduleAPI, playlistAPI, playoutAPI } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

export default function Calendar() {
  const { showSuccess, showError, showInfo } = useNotification();
  const [events, setEvents] = useState([]);
  const [playoutStatus, setPlayoutStatus] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState('');
  const [startTime, setStartTime] = useState('06:00');
  const [repeatPattern, setRepeatPattern] = useState('');
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchSchedule();
    fetchPlaylists();
    fetchPlayoutStatus();
    // Poll status every 10 seconds to keep calendar synced with playout
    const interval = setInterval(fetchPlayoutStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchPlayoutStatus = async () => {
    try {
      const response = await playoutAPI.status();
      setPlayoutStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch playout status:', error);
    }
  };

  const fetchSchedule = async () => {
    try {
      const response = await scheduleAPI.list();
      const rawSchedules = response.data.schedules;
      const calendarEvents = [];
      
      const today = new Date();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      const nineMonthsAhead = new Date();
      nineMonthsAhead.setMonth(today.getMonth() + 9);

      rawSchedules.forEach((schedule) => {
        const originalDate = new Date(schedule.date + (schedule.start_time ? `T${schedule.start_time}` : ''));
        
        // Add the original event
        calendarEvents.push({
          id: schedule.id,
          title: schedule.playlist_name || 'Playlist',
          start: schedule.date + (schedule.start_time ? `T${schedule.start_time}` : ''),
          backgroundColor: schedule.repeat_pattern ? '#1976d2' : '#dc004e',
          extendedProps: {
            playlistId: schedule.playlist_id,
            startTime: schedule.start_time,
            repeatPattern: schedule.repeat_pattern,
            isOriginal: true,
            originalDate: schedule.date
          },
        });

        // Expand recurring events
        if (schedule.repeat_pattern) {
          let current = new Date(originalDate);
          
          while (current < nineMonthsAhead) {
            // Increment based on pattern
            if (schedule.repeat_pattern === 'daily') {
              current.setDate(current.getDate() + 1);
            } else if (schedule.repeat_pattern === 'weekly') {
              current.setDate(current.getDate() + 7);
            } else if (schedule.repeat_pattern === 'monthly') {
              current.setMonth(current.getMonth() + 1);
            } else {
              break; 
            }

            if (current > nineMonthsAhead) break;

            const dateStr = current.toISOString().split('T')[0];
            const timeStr = schedule.start_time || '00:00:00';

            calendarEvents.push({
              id: `${schedule.id}-${dateStr}`,
              title: schedule.playlist_name || 'Playlist',
              start: `${dateStr}T${timeStr}`,
              backgroundColor: '#1976d2', // Same color as original
              opacity: 0.6, // Will be used in renderEventContent
              extendedProps: {
                playlistId: schedule.playlist_id,
                startTime: schedule.start_time,
                repeatPattern: schedule.repeat_pattern,
                isOriginal: false,
                originalId: schedule.id,
                originalDate: schedule.date
              },
            });
          }
        }
      });

      setEvents(calendarEvents);
      console.log('Schedule fetched and expanded:', calendarEvents.length, 'items');
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
      showError('Erro ao carregar agenda');
    }
  };

  const fetchPlaylists = async () => {
    try {
      const response = await playlistAPI.list();
      setPlaylists(response.data.playlists);
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
    }
  };

  const handleDateClick = (info) => {
    resetForm();
    setSelectedDate(info.dateStr);
    setIsEditing(false);
    setEditId(null);
    setDialogOpen(true);
  };

  const handleSaveSchedule = async () => {
    if (!selectedPlaylist) {
      showError('Selecione uma playlist');
      return;
    }

    const payload = {
      playlist_id: selectedPlaylist,
      date: selectedDate,
      start_time: startTime,
      repeat_pattern: repeatPattern || null,
    };

    try {
      if (isEditing && editId) {
        await scheduleAPI.update(editId, payload);
        showSuccess('Agendamento atualizado');
      } else {
        await scheduleAPI.create(payload);
        showSuccess('Agendamento criado');
      }
      setDialogOpen(false);
      resetForm();
      await fetchSchedule();
    } catch (error) {
      showError('Erro ao guardar agendamento');
    }
  };

  const handleDeleteSchedule = async (idOrOccurrence) => {
    // Parse ID if it's an occurrence (UUID-YYYY-MM-DD)
    const id = idOrOccurrence.toString().split('-')[0];

    if (!id) {
      showError('Erro: ID do agendamento não encontrado');
      return;
    }
    try {
      await scheduleAPI.delete(id);
      showSuccess('Agendamento removido');
      await fetchSchedule();
    } catch (error) {
      showError('Erro ao eliminar agendamento');
    }
  };

  const handleDeleteOnlyToday = async (idOrOccurrence, date) => {
    const id = idOrOccurrence.toString().split('-')[0];
    if (!id || !date) {
        showError('Erro: Dados insuficientes para remover ocorrência');
        return;
    }

    try {
        await scheduleAPI.addException(id, date);
        showSuccess('Ocorrência de hoje removida');
        await fetchSchedule();
    } catch (error) {
        showError('Erro ao remover ocorrência');
    }
  };

  const handleBulkDelete = async (start, end) => {
    try {
      const response = await scheduleAPI.deleteBulk(start, end);
      showSuccess(response.data.message);
      await fetchSchedule();
      setBulkDialogOpen(false);
    } catch (error) {
      showError('Erro na limpeza em massa');
    }
  };

  const resetForm = () => {
    setSelectedPlaylist('');
    setStartTime('06:00');
    setRepeatPattern('');
    setIsEditing(false);
    setEditId(null);
  };

  const handleEditSchedule = (event) => {
    setIsEditing(true);
    setEditId(event.id);
    setSelectedPlaylist(event.extendedProps.playlistId);
    setStartTime(event.extendedProps.startTime || '00:00');
    setRepeatPattern(event.extendedProps.repeatPattern || '');
    setSelectedDate(event.startStr.split('T')[0]);
    setDialogOpen(true);
  };

  const handleEventClick = (info) => {
    setSelectedEvent(info.event);
    setActionDialogOpen(true);
  };

  const quickBulkDelete = (type) => {
    const now = new Date();
    let start, end;
    
    const formatDate = (d) => d.toISOString().split('T')[0];

    if (type === 'today') {
      const d = new Date();
      start = formatDate(d);
      end = start;
    } else if (type === 'week') {
      const curr = new Date();
      const first = curr.getDate() - curr.getDay();
      start = formatDate(new Date(curr.setDate(first)));
      end = formatDate(new Date(curr.setDate(first + 6)));
    } else if (type === 'month') {
      const d = new Date();
      start = formatDate(new Date(d.getFullYear(), d.getMonth(), 1));
      end = formatDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
    } else if (type === 'year') {
        const d = new Date();
        start = formatDate(new Date(d.getFullYear(), 0, 1));
        end = formatDate(new Date(d.getFullYear(), 11, 31));
    }

    if (window.confirm(`Tem a certeza que deseja eliminar toda a programação para o período: ${type}?`)) {
        handleBulkDelete(start, end);
    }
  };

  const renderEventContent = (eventInfo) => {
    const isOriginal = eventInfo.event.extendedProps.isOriginal;
    const isPlayingCurrent = playoutStatus?.current_playlist_id === eventInfo.event.extendedProps.playlistId;
    
    return (
      <Tooltip title={
        <Box sx={{ p: 0.5, textAlign: 'center' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{eventInfo.event.title.toUpperCase()}</Typography>
          <Typography variant="caption" display="block" sx={{ fontWeight: 600 }}>HORA: {eventInfo.timeText}</Typography>
          {isPlayingCurrent && (
            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 800, mt: 0.5 }} display="block">
                ● EM REPRODUÇÃO
            </Typography>
          )}
          {eventInfo.event.extendedProps.repeatPattern && (
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }} display="block">
                RECORRENTE ({eventInfo.event.extendedProps.repeatPattern.toUpperCase()})
                {!isOriginal && ' (OCORRÊNCIA)'}
            </Typography>
          )}
        </Box>
      } arrow placement="top">
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        width: '100%', 
        overflow: 'hidden',
        fontSize: '0.65rem',
        p: 0.5,
        color: 'white',
        bgcolor: eventInfo.backgroundColor,
        opacity: isOriginal ? 1 : 0.6,
        borderRadius: 1,
        borderLeft: isPlayingCurrent ? '4px solid #fff' : (eventInfo.event.extendedProps.repeatPattern ? '4px solid #00e5ff' : '4px solid #ff4081'),
        boxShadow: isPlayingCurrent ? '0 0 15px rgba(255,255,255,0.4)' : 'none',
        cursor: 'pointer',
        transition: '0.2s',
        '&:hover': { transform: 'translateX(2px)', filter: 'brightness(1.2)' }
      }}>
        <Typography variant="caption" noWrap sx={{ flexGrow: 1, fontWeight: 800, letterSpacing: 0.5 }}>
          {eventInfo.timeText} {eventInfo.event.title.toUpperCase()}
        </Typography>
        {eventInfo.event.extendedProps.repeatPattern && <HistoryIcon sx={{ fontSize: 10, ml: 0.5, opacity: 0.8 }} />}
      </Box>
      </Tooltip>
    );
  };

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
            <Typography variant="h4" className="neon-text" sx={{ fontWeight: 800 }}>CENTRAL DE AGENDAMENTO</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 2 }}>GESTOR DE PROGRAMAÇÃO & RECORRÊNCIA</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {playoutStatus?.current_playlist_id && (
                <Box className="glass-panel" sx={{ 
                    px: 3, 
                    py: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    borderRadius: 3,
                    border: '1px solid rgba(76, 175, 80, 0.3)',
                    bgcolor: 'rgba(76, 175, 80, 0.05)',
                    boxShadow: '0 0 15px rgba(76, 175, 80, 0.1)',
                }}>
                    <PlayIcon sx={{ mr: 1.5, fontSize: 20, color: 'success.main' }} />
                    <Box>
                        <Typography variant="caption" sx={{ opacity: 0.6, display: 'block', fontWeight: 800, fontSize: '0.55rem' }}>ON-AIR NOW</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'success.main', fontSize: '0.85rem' }}>{playoutStatus.current_playlist_name?.toUpperCase() || 'PLAYLIST ATIVA'}</Typography>
                    </Box>
                </Box>
            )}

            <Button 
                variant="outlined" 
                color="error" 
                startIcon={<BulkDeleteIcon />} 
                onClick={() => setBulkDialogOpen(true)}
                sx={{ borderRadius: 2, fontWeight: 800 }}
            >
                LIMPEZA EM MASSA
            </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <Grid item xs={12} md={9} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Paper className="glass-panel" sx={{ p: 2, flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <style>{`
                    .fc { --fc-border-color: rgba(255,255,255,0.05); font-family: 'Inter', sans-serif; }
                    .fc .fc-toolbar-title { font-weight: 800; text-transform: uppercase; letter-spacing: 1px; font-size: 1.1rem; color: #00e5ff; }
                    .fc .fc-button { background: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.1) !important; font-weight: 800 !important; text-transform: uppercase !important; font-size: 0.7rem !important; transition: 0.3s !important; }
                    .fc .fc-button:hover { background: rgba(0,229,255,0.1) !important; border-color: rgba(0,229,255,0.4) !important; }
                    .fc .fc-button-active { background: #00e5ff !important; color: #000 !important; }
                    .fc-theme-standard td, .fc-theme-standard th { border: 1px solid rgba(255,255,255,0.05) !important; }
                    .fc-day-today { background: rgba(0,229,255,0.03) !important; }
                    .fc-col-header-cell { background: rgba(255,255,255,0.02); padding: 10px 0 !important; }
                    .fc-col-header-cell-cushion { font-size: 0.7rem; font-weight: 800; color: rgba(255,255,255,0.5); }
                `}</style>
                <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    events={events}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                    eventContent={renderEventContent}
                    height="100%"
                    locale="pt"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,dayGridWeek',
                    }}
                />
            </Paper>
        </Grid>
        
        <Grid item xs={12} md={3} sx={{ height: '100%' }}>
            <Stack spacing={2} sx={{ height: '100%' }}>
                <Paper className="glass-panel" sx={{ p: 2, flexGrow: 1 }}>
                    <Typography variant="overline" sx={{ fontWeight: 800, color: 'primary.main', display: 'block', mb: 2 }}>ATALHOS DE LIMPEZA</Typography>
                    <Stack spacing={1.5}>
                        {[
                            { label: 'LIMPAR HOJE', type: 'today' },
                            { label: 'ESTA SEMANA', type: 'week' },
                            { label: 'ESTE MÊS', type: 'month' },
                            { label: 'ESTE ANO', type: 'year' }
                        ].map((btn) => (
                            <Button 
                                key={btn.type}
                                fullWidth 
                                variant="outlined" 
                                color="error" 
                                size="small" 
                                onClick={() => quickBulkDelete(btn.type)}
                                sx={{ borderRadius: 2, fontWeight: 800, py: 1, borderColor: 'rgba(244,67,54,0.3)', '&:hover': { bgcolor: 'rgba(244,67,54,0.05)' } }}
                            >
                                {btn.label}
                            </Button>
                        ))}
                    </Stack>

                    <Box sx={{ mt: 4 }}>
                        <Typography variant="overline" sx={{ fontWeight: 800, color: 'primary.main', display: 'block', mb: 2 }}>LEGENDA</Typography>
                        <Stack spacing={1.5}>
                            <Box sx={{ display: 'flex', alignItems: 'center', p: 1, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)' }}>
                                <Box sx={{ width: 8, height: 8, bgcolor: '#ff4081', mr: 2, borderRadius: '50%', boxShadow: '0 0 10px #ff4081' }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.8 }}>AGENDAMENTO ÚNICO</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', p: 1, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)' }}>
                                <Box sx={{ width: 8, height: 8, bgcolor: '#00e5ff', mr: 2, borderRadius: '50%', boxShadow: '0 0 10px #00e5ff' }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.8 }}>SÉRIE DE REPETIÇÃO</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', p: 1, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)' }}>
                                <Box sx={{ width: 8, height: 8, bgcolor: '#fff', mr: 2, borderRadius: '50%', boxShadow: '0 0 10px #fff' }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.8 }}>EM REPRODUÇÃO AGORA</Typography>
                            </Box>
                        </Stack>
                    </Box>
                </Paper>
            </Stack>
        </Grid>
      </Grid>

      {/* Action Dialog */}
      <Dialog 
        open={actionDialogOpen} 
        onClose={() => setActionDialogOpen(false)} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{ className: 'glass-panel', sx: { backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 800, color: 'primary.main' }}>
            GERIR AGENDAMENTO
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>{selectedEvent?.title?.toUpperCase()}</Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.6 }}>DATA: {selectedEvent?.startStr.split('T')[0]}</Typography>
            {selectedEvent?.extendedProps.repeatPattern && (
                <Alert severity="info" sx={{ mt: 2, borderRadius: 2, bgcolor: 'rgba(0,229,255,0.05)', color: 'primary.main', border: '1px solid rgba(0,229,255,0.1)' }}>
                    ESTE É UM EVENTO RECORRENTE ({selectedEvent.extendedProps.repeatPattern.toUpperCase()})
                </Alert>
            )}
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'column', gap: 1.5, p: 3 }}>
            <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                startIcon={<PlayIcon />} 
                onClick={() => { handleEditSchedule(selectedEvent); setActionDialogOpen(false); }}
                sx={{ borderRadius: 2, fontWeight: 800, py: 1.2 }}
            >
                EDITAR SÉRIE / EVENTO
            </Button>

            {selectedEvent?.extendedProps.repeatPattern && (
                <Button 
                    variant="outlined" 
                    color="warning" 
                    fullWidth 
                    startIcon={<DeleteIcon />} 
                    onClick={() => { 
                        if (window.confirm(`Remover apenas a ocorrência de ${selectedEvent.startStr.split('T')[0]}?`)) { 
                            handleDeleteOnlyToday(selectedEvent.id, selectedEvent.startStr.split('T')[0]); 
                        } 
                        setActionDialogOpen(false); 
                    }}
                    sx={{ borderRadius: 2, fontWeight: 800, py: 1 }}
                >
                    IGNORAR APENAS HOJE
                </Button>
            )}

            <Button 
                variant="outlined" 
                color="error" 
                fullWidth 
                startIcon={<DeleteIcon />} 
                onClick={() => { 
                    const msg = selectedEvent?.extendedProps.repeatPattern 
                        ? `Deseja parar toda a série de "${selectedEvent?.title}" definitivamente?`
                        : `Remover definitivamente "${selectedEvent?.title}"?`;
                    if (window.confirm(msg)) { handleDeleteSchedule(selectedEvent.id); } 
                    setActionDialogOpen(false); 
                }}
                sx={{ borderRadius: 2, fontWeight: 800, py: 1 }}
            >
                {selectedEvent?.extendedProps.repeatPattern ? 'PARAR SÉRIE DE REPETIÇÃO' : 'ELIMINAR AGENDAMENTO'}
            </Button>
            
            <Button onClick={() => setActionDialogOpen(false)} sx={{ fontWeight: 800, opacity: 0.5 }}>FECHAR</Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Create/Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => { setDialogOpen(false); resetForm(); }} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ className: 'glass-panel', sx: { backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'primary.main', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {isEditing ? 'EDITAR AGENDAMENTO' : `AGENDAR PARA ${selectedDate}`}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <FormControl fullWidth variant="standard" sx={{ mt: 1 }}>
            <InputLabel shrink sx={{ fontWeight: 800 }}>PLAYLIST</InputLabel>
            <Select 
                value={selectedPlaylist} 
                onChange={(e) => setSelectedPlaylist(e.target.value)}
                sx={{ fontWeight: 800 }}
            >
              {playlists.map((p) => <MenuItem key={p.id} value={p.id} sx={{ fontWeight: 700 }}>{p.name.toUpperCase()}</MenuItem>)}
            </Select>
          </FormControl>
          
          <TextField 
            fullWidth 
            label="HORÁRIO" 
            type="time" 
            value={startTime} 
            onChange={(e) => setStartTime(e.target.value)} 
            sx={{ mt: 3 }} 
            variant="standard"
            InputLabelProps={{ shrink: true, sx: { fontWeight: 800 } }}
            inputProps={{ sx: { fontWeight: 800 } }}
          />
          
          <FormControl fullWidth variant="standard" sx={{ mt: 3 }}>
            <InputLabel shrink sx={{ fontWeight: 800 }}>PADRÃO DE REPETIÇÃO</InputLabel>
            <Select 
                value={repeatPattern} 
                onChange={(e) => setRepeatPattern(e.target.value)}
                sx={{ fontWeight: 800 }}
            >
              <MenuItem value="" sx={{ fontWeight: 700, opacity: 0.5 }}>SEM REPETIÇÃO</MenuItem>
              <MenuItem value="daily" sx={{ fontWeight: 700 }}>DIÁRIA</MenuItem>
              <MenuItem value="weekly" sx={{ fontWeight: 700 }}>SEMANAL</MenuItem>
              <MenuItem value="monthly" sx={{ fontWeight: 700 }}>MENSAL</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => { setDialogOpen(false); resetForm(); }} sx={{ fontWeight: 800 }}>CANCELAR</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveSchedule}
            sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}
          >
            GUARDAR
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog 
        open={bulkDialogOpen} 
        onClose={() => setBulkDialogOpen(false)} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{ className: 'glass-panel', sx: { backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'error.main' }}>LIMPEZA PERSONALIZADA</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 3, fontWeight: 600, opacity: 0.6 }}>ESCOLHA UM PERÍODO PARA REMOVER TODA A PROGRAMAÇÃO.</Typography>
            <TextField fullWidth label="INÍCIO" type="date" InputLabelProps={{ shrink: true, sx: { fontWeight: 800 } }} variant="standard" sx={{ mb: 3 }} id="bulk-start" inputProps={{ sx: { fontWeight: 800 } }} />
            <TextField fullWidth label="FIM" type="date" InputLabelProps={{ shrink: true, sx: { fontWeight: 800 } }} variant="standard" id="bulk-end" inputProps={{ sx: { fontWeight: 800 } }} />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setBulkDialogOpen(false)} sx={{ fontWeight: 800 }}>CANCELAR</Button>
            <Button 
                color="error" 
                variant="contained" 
                onClick={() => {
                    const s = document.getElementById('bulk-start').value;
                    const e = document.getElementById('bulk-end').value;
                    if (s && e) handleBulkDelete(s, e);
                    else showError('Selecione as datas');
                }}
                sx={{ borderRadius: 2, fontWeight: 800, px: 3 }}
            >
                ELIMINAR PERÍODO
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
