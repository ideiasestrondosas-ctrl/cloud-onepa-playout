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
import { scheduleAPI, playlistAPI } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

export default function Calendar() {
  const { showSuccess, showError, showInfo } = useNotification();
  const [events, setEvents] = useState([]);
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
  }, []);

  const fetchSchedule = async () => {
    try {
      const response = await scheduleAPI.list();
      const calendarEvents = response.data.schedules.map((schedule) => ({
        id: schedule.id,
        title: schedule.playlist_name || 'Playlist',
        start: schedule.date + (schedule.start_time ? `T${schedule.start_time}` : ''),
        backgroundColor: schedule.repeat_pattern ? '#1976d2' : '#dc004e',
        extendedProps: {
          playlistId: schedule.playlist_id,
          startTime: schedule.start_time,
          repeatPattern: schedule.repeat_pattern,
        },
      }));
      setEvents(calendarEvents);
      console.log('Schedule fetched:', calendarEvents.length, 'items');
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

  const handleDeleteSchedule = async (id) => {
    if (!id) {
      showError('Erro: ID do agendamento não encontrado');
      return;
    }
    try {
      await scheduleAPI.delete(id);
      showSuccess('Agendamento removido com sucesso');
      await fetchSchedule();
    } catch (error) {
      console.error('Delete error:', error);
      const errorMsg = error.response?.data?.error || error.message;
      showError('Erro ao eliminar agendamento: ' + errorMsg);
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
    return (
      <Tooltip title={
        <Box sx={{ p: 0.5, textAlign: 'center' }}>
          <Typography variant="subtitle2">{eventInfo.event.title}</Typography>
          <Typography variant="caption" display="block">Hora: {eventInfo.timeText}</Typography>
          {eventInfo.event.extendedProps.repeatPattern && (
            <Typography variant="caption" sx={{ color: '#90caf9' }} display="block">
                Recorrente ({eventInfo.event.extendedProps.repeatPattern === 'daily' ? 'Diário' : 
                             eventInfo.event.extendedProps.repeatPattern === 'weekly' ? 'Semanal' : 
                             eventInfo.event.extendedProps.repeatPattern === 'monthly' ? 'Mensal' : ''})
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
        fontSize: '0.75rem',
        p: 0.5,
        color: 'white',
        bgcolor: eventInfo.backgroundColor,
        borderRadius: 1,
        borderLeft: eventInfo.event.extendedProps.repeatPattern ? '3px solid #64b5f6' : '3px solid #ff8a80',
        cursor: 'pointer',
        transition: 'transform 0.1s',
        '&:hover': { transform: 'scale(1.02)', opacity: 0.9 }
      }}>
        <Typography variant="caption" noWrap sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          {eventInfo.timeText} {eventInfo.event.title}
        </Typography>
        {eventInfo.event.extendedProps.repeatPattern && <HistoryIcon sx={{ fontSize: 12, ml: 0.5, opacity: 0.8 }} />}
      </Box>
      </Tooltip>
    );
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Calendário de Agendamento
        </Typography>
        <Stack direction="row" spacing={2}>
            <Button 
                variant="outlined" 
                color="error" 
                startIcon={<BulkDeleteIcon />} 
                onClick={() => setBulkDialogOpen(true)}
            >
                Limpeza em Massa
            </Button>
        </Stack>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={9}>
            <Card sx={{ p: 2 }}>
                <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    events={events}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                    eventContent={renderEventContent}
                    height="70vh"
                    locale="pt"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,dayGridWeek',
                    }}
                />
            </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
            <Stack spacing={2}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom color="primary">Atalhos de Limpeza</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Stack spacing={1}>
                            <Button fullWidth variant="outlined" color="error" size="small" onClick={() => quickBulkDelete('today')}>Limpar Hoje</Button>
                            <Button fullWidth variant="outlined" color="error" size="small" onClick={() => quickBulkDelete('week')}>Limpar Esta Semana</Button>
                            <Button fullWidth variant="outlined" color="error" size="small" onClick={() => quickBulkDelete('month')}>Limpar Este Mês</Button>
                            <Button fullWidth variant="outlined" color="error" size="small" onClick={() => quickBulkDelete('year')}>Limpar Este Ano</Button>
                        </Stack>
                    </CardContent>
                </Card>
                
                <Paper sx={{ p: 2, bgcolor: 'action.hover' }}>
                    <Typography variant="subtitle2" gutterBottom>Legenda</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ width: 12, height: 12, bgcolor: '#dc004e', mr: 1, borderRadius: '50%' }} />
                        <Typography variant="caption">Agendamento Único</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: 12, height: 12, bgcolor: '#1976d2', mr: 1, borderRadius: '50%' }} />
                        <Typography variant="caption">Repetição</Typography>
                    </Box>
                </Paper>
            </Stack>
        </Grid>
      </Grid>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>Gerir Agendamento</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
            <Typography variant="h6" color="primary">{selectedEvent?.title}</Typography>
            <Typography variant="body2" color="text.secondary">Data: {selectedEvent?.startStr.split('T')[0]}</Typography>
            {selectedEvent?.extendedProps.repeatPattern && (
                <Alert severity="info" sx={{ mt: 2 }} size="small">Este é um evento recorrente ({selectedEvent.extendedProps.repeatPattern})</Alert>
            )}
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'column', gap: 1, p: 2 }}>
            <Button variant="contained" fullWidth startIcon={<PlayIcon />} onClick={() => { handleEditSchedule(selectedEvent); setActionDialogOpen(false); }}>
                Editar
            </Button>
            <Button variant="outlined" color="error" fullWidth startIcon={<DeleteIcon />} onClick={() => { 
                if (window.confirm(`Remover definitivamente "${selectedEvent?.title}"?`)) { 
                    handleDeleteSchedule(selectedEvent.id); 
                } 
                setActionDialogOpen(false); 
            }}>
                Eliminar
            </Button>
            <Button onClick={() => setActionDialogOpen(false)} fullWidth>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); resetForm(); }} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? 'Editar Agendamento' : `Agendar para ${selectedDate}`}</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Playlist</InputLabel>
            <Select value={selectedPlaylist} label="Playlist" onChange={(e) => setSelectedPlaylist(e.target.value)}>
              {playlists.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField fullWidth label="Horário" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} sx={{ mt: 2 }} InputLabelProps={{ shrink: true }} />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Repetição</InputLabel>
            <Select value={repeatPattern} label="Repetição" onChange={(e) => setRepeatPattern(e.target.value)}>
              <MenuItem value="">Sem repetição</MenuItem>
              <MenuItem value="daily">Diária</MenuItem>
              <MenuItem value="weekly">Semanal</MenuItem>
              <MenuItem value="monthly">Mensal</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveSchedule}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Limpeza Personalizada</DialogTitle>
        <DialogContent dividers>
            <Typography variant="body2" sx={{ mb: 2 }}>Escolha um período para remover toda a programação.</Typography>
            <TextField fullWidth label="Início" type="date" InputLabelProps={{ shrink: true }} sx={{ mb: 2 }} id="bulk-start" />
            <TextField fullWidth label="Fim" type="date" InputLabelProps={{ shrink: true }} id="bulk-end" />
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setBulkDialogOpen(false)}>Cancelar</Button>
            <Button color="error" variant="contained" onClick={() => {
                const s = document.getElementById('bulk-start').value;
                const e = document.getElementById('bulk-end').value;
                if (s && e) handleBulkDelete(s, e);
                else showError('Selecione as datas');
            }}>Eliminar Período</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
