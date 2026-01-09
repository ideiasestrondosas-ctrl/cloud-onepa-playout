import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { scheduleAPI, playlistAPI } from '../services/api';

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState('');
  const [startTime, setStartTime] = useState('06:00');
  const [repeatPattern, setRepeatPattern] = useState('');

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
        date: schedule.date,
        backgroundColor: schedule.repeat_pattern ? '#1976d2' : '#dc004e',
        extendedProps: {
          playlistId: schedule.playlist_id,
          startTime: schedule.start_time,
          repeatPattern: schedule.repeat_pattern,
        },
      }));
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
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
    setSelectedDate(info.dateStr);
    setDialogOpen(true);
  };

  const handleEventClick = (info) => {
    if (window.confirm(`Remover agendamento de "${info.event.title}"?`)) {
      handleDeleteSchedule(info.event.id);
    }
  };

  const handleCreateSchedule = async () => {
    if (!selectedPlaylist) {
      alert('Selecione uma playlist');
      return;
    }

    try {
      await scheduleAPI.create({
        playlist_id: selectedPlaylist,
        date: selectedDate,
        start_time: startTime,
        repeat_pattern: repeatPattern || null,
      });
      fetchSchedule();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create schedule:', error);
      alert('Erro ao criar agendamento');
    }
  };

  const handleDeleteSchedule = async (id) => {
    try {
      await scheduleAPI.delete(id);
      fetchSchedule();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
    }
  };

  const resetForm = () => {
    setSelectedPlaylist('');
    setStartTime('06:00');
    setRepeatPattern('');
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Calendário de Agendamento
      </Typography>

      <Card sx={{ mb: 2, p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Legenda:</strong>
          <Box component="span" sx={{ ml: 2, color: '#dc004e' }}>■ Agendamento único</Box>
          <Box component="span" sx={{ ml: 2, color: '#1976d2' }}>■ Repetição (daily/weekly)</Box>
        </Typography>
      </Card>

      <Card>
        <CardContent>
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            height="auto"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek',
            }}
          />
        </CardContent>
      </Card>

      {/* Schedule Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agendar Playlist para {selectedDate}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Playlist</InputLabel>
            <Select
              value={selectedPlaylist}
              label="Playlist"
              onChange={(e) => setSelectedPlaylist(e.target.value)}
            >
              {playlists.map((playlist) => (
                <MenuItem key={playlist.id} value={playlist.id}>
                  {playlist.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Horário de Início"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }}
          />

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Repetição</InputLabel>
            <Select
              value={repeatPattern}
              label="Repetição"
              onChange={(e) => setRepeatPattern(e.target.value)}
            >
              <MenuItem value="">Sem repetição</MenuItem>
              <MenuItem value="daily">Diária</MenuItem>
              <MenuItem value="weekly">Semanal</MenuItem>
              <MenuItem value="monthly">Mensal</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateSchedule}>
            Agendar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
