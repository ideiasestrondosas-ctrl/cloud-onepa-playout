import { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  DragIndicator as DragIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { playlistAPI, mediaAPI } from '../services/api';

function SortableClip({ clip, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: clip.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      secondaryAction={
        <IconButton edge="end" onClick={() => onRemove(clip.id)}>
          <DeleteIcon />
        </IconButton>
      }
      sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1 }}
    >
      <Box {...attributes} {...listeners} sx={{ cursor: 'grab', mr: 2 }}>
        <DragIcon />
      </Box>
      <ListItemText
        primary={clip.filename}
        secondary={`Duração: ${formatDuration(clip.duration)}`}
      />
    </ListItem>
  );
}

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function PlaylistEditor() {
  const { showSuccess, showError, showWarning } = useNotification();
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [clips, setClips] = useState([]);
  const [availableMedia, setAvailableMedia] = useState([]);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDate, setPlaylistDate] = useState('');
  const [validation, setValidation] = useState(null);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchPlaylists();
    fetchAvailableMedia();
  }, []);

  useEffect(() => {
    if (clips.length > 0) {
      validatePlaylist();
    }
  }, [clips]);

  const fetchPlaylists = async () => {
    try {
      const response = await playlistAPI.list();
      setPlaylists(response.data.playlists);
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
    }
  };

  const fetchAvailableMedia = async () => {
    try {
      const response = await mediaAPI.list();
      setAvailableMedia(response.data.media);
    } catch (error) {
      console.error('Failed to fetch media:', error);
    }
  };

  const validatePlaylist = async () => {
    const content = {
      channel: 'Cloud Onepa',
      date: playlistDate || new Date().toISOString().split('T')[0],
      program: clips.map((clip) => ({
        in: 0,
        out: clip.duration,
        duration: clip.duration,
        source: clip.path,
      })),
    };

    try {
      const response = await playlistAPI.validate({ content });
      setValidation(response.data);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setClips((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddClip = (media) => {
    setClips([...clips, media]);
    setMediaDialogOpen(false);
  };

  const handleRemoveClip = (id) => {
    setClips(clips.filter((clip) => clip.id !== id));
  };

  const handleSave = async () => {
    if (!playlistName.trim()) {
      showWarning('Por favor, insira um nome para a playlist');
      return;
    }

    setSaving(true);

    const content = {
      channel: 'Cloud Onepa',
      date: playlistDate || new Date().toISOString().split('T')[0],
      program: clips.map((clip) => ({
        in: 0,
        out: clip.duration,
        duration: clip.duration,
        source: clip.path,
      })),
    };

    try {
      if (selectedPlaylist) {
        await playlistAPI.update(selectedPlaylist.id, {
          name: playlistName,
          date: playlistDate,
          content,
        });
        showSuccess('Playlist atualizada com sucesso!');
      } else {
        await playlistAPI.create({
          name: playlistName,
          date: playlistDate,
          content,
        });
        showSuccess('Playlist criada com sucesso!');
      }
      await fetchPlaylists();
    } catch (error) {
      console.error('Failed to save playlist:', error);
      showError('Erro ao salvar playlist');
    } finally {
      setSaving(false);
    }
  };

  const handleLoadPlaylist = async (playlist) => {
    setSelectedPlaylist(playlist);
    setPlaylistName(playlist.name);
    setPlaylistDate(playlist.date || '');

    // Parse clips from content
    if (playlist.content && playlist.content.program) {
      const loadedClips = playlist.content.program.map((item, index) => ({
        id: `clip-${index}`,
        filename: item.source.split('/').pop(),
        path: item.source,
        duration: item.duration,
      }));
      setClips(loadedClips);
    }
  };

  const handleNewPlaylist = () => {
    setCreateDialogOpen(true);
  };

  const handleAutoFill = async () => {
    const totalSecs = clips.reduce((sum, clip) => sum + (clip.duration || 0), 0);
    const gap = 86400 - totalSecs;

    if (gap <= 0) {
      showWarning('A playlist já atingiu ou excedeu as 24 horas.');
      return;
    }

    try {
      const response = await mediaAPI.list({ is_filler: true, limit: 100 });
      const fillers = response.data.media;

      if (fillers.length === 0) {
        showError('Nenhum ficheiro marcado como filler disponível.');
        return;
      }

      let currentGap = gap;
      const addedFillers = [];
      
      // Simple greedy fill
      // We'll try to add fillers until we are close to 24h
      // To make it more "random", we can shuffle
      const shuffledFillers = [...fillers].sort(() => Math.random() - 0.5);
      
      let index = 0;
      while (currentGap > 10 && index < shuffledFillers.length * 2) { // Allow some reuse if needed
        const filler = shuffledFillers[index % shuffledFillers.length];
        if (filler.duration <= currentGap + 300) { // Allow slightly overshooting
          addedFillers.push({
            ...filler,
            id: `filler-${Date.now()}-${addedFillers.length}` // Unique ID for DnD
          });
          currentGap -= filler.duration;
        }
        index++;
        
        // Safety break to prevent infinite loop if fillers are too long
        if (index > 200) break;
      }

      if (addedFillers.length > 0) {
        setClips([...clips, ...addedFillers]);
        showSuccess(`${addedFillers.length} fillers adicionados para preencher o tempo.`);
      } else {
        showWarning('Não foi possível encontrar fillers adequados para o tempo restante.');
      }
    } catch (error) {
      console.error('Auto-fill failed:', error);
      showError('Erro ao carregar fillers');
    }
  };

  const handleCreateNewPlaylist = () => {
    if (!newPlaylistName.trim()) {
      showWarning('Por favor, insira um nome para a nova playlist');
      return;
    }
    setSelectedPlaylist(null);
    setPlaylistName(newPlaylistName);
    setPlaylistDate(new Date().toISOString().split('T')[0]);
    setClips([]);
    setValidation(null);
    setCreateDialogOpen(false);
    setNewPlaylistName('');
    showSuccess('Nova playlist criada! Adicione clips e salve.');
  };

  const totalDuration = clips.reduce((sum, clip) => sum + (clip.duration || 0), 0);
  const targetDuration = 24 * 3600; // 24 hours

  const formatTotalDuration = (seconds) => {
    if (!seconds) return '00:00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Playlist Editor
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" color="warning" onClick={handleAutoFill} disabled={clips.length === 0}>
            Auto-preencher Fillers
          </Button>
          <Button variant="outlined" onClick={handleNewPlaylist}>
            Nova Playlist
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving || clips.length === 0}
          >
            Salvar
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Saved Playlists */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Playlists Salvas
              </Typography>
              <List>
                {playlists.map((playlist) => (
                  <ListItem
                    key={playlist.id}
                    button
                    selected={selectedPlaylist?.id === playlist.id}
                    onClick={() => handleLoadPlaylist(playlist)}
                  >
                    <ListItemText
                      primary={playlist.name}
                      secondary={playlist.date}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Playlist Editor */}
        <Grid item xs={12} md={9}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nome da Playlist"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Data"
                    type="date"
                    value={playlistDate}
                    onChange={(e) => setPlaylistDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Validation Status */}
          <Alert
            severity={Math.abs(totalDuration - 86400) <= 86400 * 0.05 ? 'success' : 'warning'}
            icon={Math.abs(totalDuration - 86400) <= 86400 * 0.05 ? <CheckIcon /> : <WarningIcon />}
            sx={{ mb: 2 }}
          >
            <Typography variant="body2">
              <strong>Duração Total: {formatTotalDuration(totalDuration)} / 24:00:00</strong>
            </Typography>
            {Math.abs(totalDuration - 86400) <= 86400 * 0.05 ? (
              <Typography variant="body2">
                Playlist válida (~24h ±5%) - Pronta para agendar
              </Typography>
            ) : (
              <Typography variant="body2">
                {totalDuration < 86400 
                  ? `Faltam ${formatTotalDuration(86400 - totalDuration)} - Adicione mais clips. Dica: Use fillers para completar tempo restante.`
                  : `Excede em ${formatTotalDuration(totalDuration - 86400)} - Remova clips.`}
              </Typography>
            )}
          </Alert>

          {/* Clips List */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Clips ({clips.length})
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setMediaDialogOpen(true)}
                >
                  Adicionar Clip
                </Button>
              </Box>

              {clips.length === 0 ? (
                <Alert severity="info">
                  Nenhum clip adicionado. Clique em "Adicionar Clip" para começar.
                </Alert>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={clips.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <List>
                      {clips.map((clip) => (
                        <SortableClip
                          key={clip.id}
                          clip={clip}
                          onRemove={handleRemoveClip}
                        />
                      ))}
                    </List>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Media Selection Dialog */}
      <Dialog open={mediaDialogOpen} onClose={() => setMediaDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Selecionar Media</DialogTitle>
        <DialogContent>
          <List>
            {availableMedia.filter((m) => m.media_type === 'video' || m.media_type === 'audio').map((media) => (
              <ListItem
                key={media.id}
                button
                onClick={() => handleAddClip(media)}
              >
                <ListItemText
                  primary={media.filename}
                  secondary={`${media.media_type} • ${formatDuration(media.duration)}`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMediaDialogOpen(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* Create Playlist Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Playlist</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome da Playlist"
            fullWidth
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="ex: Playlist Segunda-feira"
            helperText="Insira um nome descritivo para a playlist"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleCreateNewPlaylist} variant="contained">Criar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
