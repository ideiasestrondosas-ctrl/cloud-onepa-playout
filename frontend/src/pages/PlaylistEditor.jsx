import { useState, useEffect } from 'react';
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
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [clips, setClips] = useState([]);
  const [availableMedia, setAvailableMedia] = useState([]);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDate, setPlaylistDate] = useState('');
  const [validation, setValidation] = useState(null);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
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
    if (!playlistName) {
      alert('Por favor, insira um nome para a playlist');
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
      } else {
        await playlistAPI.create({
          name: playlistName,
          date: playlistDate,
          content,
        });
      }
      fetchPlaylists();
      alert('Playlist salva com sucesso!');
    } catch (error) {
      console.error('Failed to save playlist:', error);
      alert('Erro ao salvar playlist');
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
    setSelectedPlaylist(null);
    setPlaylistName('');
    setPlaylistDate('');
    setClips([]);
    setValidation(null);
  };

  const totalDuration = clips.reduce((sum, clip) => sum + (clip.duration || 0), 0);
  const targetDuration = 24 * 3600; // 24 hours

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Playlist Editor
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
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
          {validation && (
            <Alert
              severity={validation.valid ? 'success' : 'warning'}
              icon={validation.valid ? <CheckIcon /> : <WarningIcon />}
              sx={{ mb: 2 }}
            >
              <Typography variant="body2">
                <strong>Duração Total:</strong> {formatDuration(totalDuration)} / 24:00:00
              </Typography>
              {!validation.valid && (
                <Typography variant="body2">
                  {validation.needs_filler
                    ? `Faltam ${validation.difference_formatted} - Adicione mais clips ou fillers`
                    : `Excede em ${validation.difference_formatted} - Remova alguns clips`}
                </Typography>
              )}
            </Alert>
          )}

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
    </Box>
  );
}
