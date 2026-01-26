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
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormControl,
  Paper,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  DragIndicator as DragIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  AutoFixHigh as AutoFixIcon,
  Layers as LoopIcon,
  Shuffle as ShuffleIcon,
  FormatListNumbered as SequentialIcon,
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

function SortableClip({ clip, onRemove, isSelected, onToggleSelection }) {
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
      <Checkbox 
        checked={isSelected} 
        onChange={() => onToggleSelection(clip.id)}
        size="small"
        sx={{ mr: 1 }}
      />
      <Box {...attributes} {...listeners} sx={{ cursor: 'grab', mr: 2 }}>
        <DragIcon />
      </Box>
      <ListItemText
        primary={clip.filename}
        secondary={
          <Box component="span" sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip 
              icon={<Box sx={{ width: 8, height: 8, bgcolor: 'primary.main', borderRadius: '50%' }} />}
              label={clip.start_time || '00:00:00'} 
              size="small" 
              variant="outlined" 
            />
            <Typography variant="caption" color="text.secondary">
              Duração: {formatShortDuration(clip.duration)}
            </Typography>
          </Box>
        }
      />
    </ListItem>
  );
}

function formatDuration(seconds) {
  if (!seconds) return '00:00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatShortDuration(seconds) {
  if (!seconds) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function PlaylistEditor() {
  const { showSuccess, showError, showWarning } = useNotification();
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [clips, setClipsState] = useState([]);
  
  const setClips = (newClips) => {
    if (typeof newClips === 'function') {
      setClipsState(prev => calculateTimings(newClips(prev)));
    } else {
      setClipsState(calculateTimings(newClips));
    }
  };

  const calculateTimings = (clipsList) => {
    let offset = 0;
    return clipsList.map(clip => {
      const duration = Number(clip.duration) || 0;
      const start = offset;
      const end = offset + duration;
      offset = end;
      return {
        ...clip,
        duration: duration,
        start_time: formatDuration(start),
        end_time: formatDuration(end)
      };
    });
  };
  const [availableMedia, setAvailableMedia] = useState([]);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDate, setPlaylistDate] = useState('');
  const [validation, setValidation] = useState(null);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [selectedMediaIds, setSelectedMediaIds] = useState([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedClipIds, setSelectedClipIds] = useState([]);
  const [automationDialogOpen, setAutomationDialogOpen] = useState(false);
  const [automationType, setAutomationType] = useState('random'); // random, sequential, loop
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('root');
  const [useFillersOnly, setUseFillersOnly] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchPlaylists();
    fetchAvailableMedia();
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const response = await mediaAPI.listFolders();
      setFolders(response.data || []);
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  };

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
    // Create unique instance with UUID to allow same file multiple times
    const uniqueClip = {
      ...media,
      id: `${media.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique instance ID
      media_id: media.id, // Original media ID for reference
    };
    setClips([...clips, uniqueClip]);
    setMediaDialogOpen(false);
    setSelectedMediaIds([]);
  };

  const handleAddSelectedClips = () => {
    const selectedMedia = availableMedia.filter(m => selectedMediaIds.includes(m.id));
    const newClips = selectedMedia.map(media => ({
      ...media,
      id: `${media.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      media_id: media.id,
    }));
    setClips([...clips, ...newClips]);
    setMediaDialogOpen(false);
    setSelectedMediaIds([]);
  };

  const toggleMediaSelection = (mediaId) => {
    setSelectedMediaIds(prev => 
      prev.includes(mediaId) ? prev.filter(id => id !== mediaId) : [...prev, mediaId]
    );
  };

  const handleRemoveClip = (id) => {
    setClips(clips.filter((clip) => clip.id !== id));
    setSelectedClipIds(prev => prev.filter(i => i !== id));
  };

  const toggleSelection = (id) => {
    setSelectedClipIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedClipIds.length === 0) return;
    if (window.confirm(`Tem a certeza que deseja eliminar os ${selectedClipIds.length} clips selecionados?`)) {
      setClips(clips.filter(c => !selectedClipIds.includes(c.id)));
      setSelectedClipIds([]);
      showSuccess(`${selectedClipIds.length} clips removidos`);
    }
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
        filename: clip.filename,
        media_id: clip.media_id,
        metadata: clip.metadata || null,
        is_filler: clip.is_filler || false,
        start_time: clip.start_time,
        end_time: clip.end_time,
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
        const response = await playlistAPI.create({
          name: playlistName,
          date: playlistDate,
          content,
        });
        setSelectedPlaylist(response.data);
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
    // Reset state first to ensure clean switch
    setClips([]);
    setSelectedClipIds([]);
    setValidation(null);
    
    setSelectedPlaylist(playlist);
    setPlaylistName(playlist.name);
    setPlaylistDate(playlist.date || '');

    // Parse clips from content
    if (playlist.content && playlist.content.program) {
      const loadedClips = playlist.content.program.map((item, index) => {
        // Try to find the media in availableMedia to get the real filename
        const media = availableMedia.find(m => m.path === item.source);
        return {
          id: `clip-${index}`,
          filename: item.filename || (media ? media.filename : item.source.split('/').pop()),
          path: item.source,
          duration: item.duration,
          start_time: item.start_time,
          end_time: item.end_time,
          metadata: item.metadata || null,
          is_filler: item.is_filler || false,
          media_type: item.media_type || (media ? media.media_type : 'video'),
        };
      });
      setClips(loadedClips);
    } else {
      setClips([]);
    }
  };

  const handleNewPlaylist = () => {
    setCreateDialogOpen(true);
  };

  const handleRunAutomation = async () => {
    const totalSecs = clips.reduce((sum, clip) => sum + (clip.duration || 0), 0);
    const gap = targetDuration - totalSecs;

    if (gap <= 0) {
      showWarning('A playlist já atingiu ou excedeu as 24 horas.');
      setAutomationDialogOpen(false);
      return;
    }

    try {
      setSaving(true);
      let candidates = [];
      
      if (automationType === 'loop') {
          if (clips.length === 0) {
              showError('Adicione pelo menos um clip como base para o loop.');
              setSaving(false);
              return;
          }
          candidates = [...clips];
      } else {
          const params = {
              folder_id: selectedFolder,
              limit: 500
          };
          if (useFillersOnly) params.is_filler = true;
          
          const response = await mediaAPI.list(params);
          candidates = response.data.media || [];
          
          if (candidates.length === 0) {
              showError(`Nenhum ficheiro encontrado na pasta selecionada${useFillersOnly ? ' com flag de filler' : ''}.`);
              setSaving(false);
              return;
          }
      }

      let currentGap = gap;
      const addedClips = [];
      
      if (automationType === 'random') {
          candidates = [...candidates].sort(() => Math.random() - 0.5);
      }
      
      let index = 0;
      // We loop until gap is filled or we tried many times
      while (currentGap > 10 && index < 200) {
          const item = candidates[index % candidates.length];
          if (item.duration <= currentGap + 3600) { // Allow slight overshoot for final item
             addedClips.push({
                 ...item,
                 id: `auto-${Date.now()}-${addedClips.length}`
             });
             currentGap -= item.duration;
          }
          index++;
          
          // Safety break if we are looping and items are too small
          if (index > 1000) break;
      }

      if (addedClips.length > 0) {
        setClips([...clips, ...addedClips]);
        showSuccess(`${addedClips.length} clips adicionados via automação (${automationType === 'random' ? 'Aleatório' : automationType === 'sequential' ? 'Sequencial' : 'Loop Content'}).`);
      } else {
        showWarning('Não foi possível encontrar ficheiros adequados para preencher o tempo.');
      }
    } catch (error) {
      console.error('Automation failed:', error);
      showError('Erro ao executar automação');
    } finally {
      setSaving(false);
      setAutomationDialogOpen(false);
    }
  };

  const handleCreateNewPlaylist = async () => {
    if (!newPlaylistName.trim()) {
      showWarning('Por favor, insira um nome para a nova playlist');
      return;
    }
    
    try {
      setSaving(true);
      const content = {
        channel: 'Cloud Onepa',
        date: new Date().toISOString().split('T')[0],
        program: [],
      };
      
      const response = await playlistAPI.create({
        name: newPlaylistName,
        date: content.date,
        content,
      });
      
      await fetchPlaylists();
      // Auto-load and select the newly created playlist
      handleLoadPlaylist(response.data);
      
      setCreateDialogOpen(false);
      setNewPlaylistName('');
      showSuccess('Playlist criada com sucesso! Adicione clips e salve as alterações.');
    } catch (error) {
      console.error('Failed to create playlist:', error);
      showError('Erro ao criar playlist');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlaylist = async (playlist) => {
    if (window.confirm(`Tem a certeza que deseja eliminar a playlist "${playlist.name}"?`)) {
      try {
        await playlistAPI.delete(playlist.id);
        showSuccess('Playlist eliminada com sucesso');
        await fetchPlaylists();
        // If we deleted the currently selected playlist, reset
        if (selectedPlaylist?.id === playlist.id) {
          setSelectedPlaylist(null);
          setPlaylistName('');
          setPlaylistDate('');
          setClips([]);
        }
      } catch (error) {
        if (error.response?.status === 409) {
          showError('Esta playlist está a ser usada no calendário e não pode ser eliminada.');
        } else {
          showError('Erro ao eliminar playlist');
        }
      }
    }
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
          {selectedClipIds.length > 0 && (
            <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleBulkDelete}>
              Eliminar ({selectedClipIds.length})
            </Button>
          )}
          <Button variant="outlined" color="warning" startIcon={<AutoFixIcon />} onClick={() => setAutomationDialogOpen(true)}>
            Automação
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
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlaylist(playlist);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
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
              <strong>Duração Total: {formatDuration(totalDuration)} / 24:00:00</strong>
            </Typography>
            {Math.abs(totalDuration - 86400) <= 86400 * 0.05 ? (
              <Typography variant="body2">
                Playlist válida (~24h ±5%) - Pronta para agendar
              </Typography>
            ) : (
              <Typography variant="body2">
                {totalDuration < 86400 
                  ? `Faltam ${formatDuration(86400 - totalDuration)} - Adicione mais clips. Dica: Use fillers para completar tempo restante.`
                  : `Excede em ${formatDuration(totalDuration - 86400)} - Remova clips.`}
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
                          isSelected={selectedClipIds.includes(clip.id)}
                          onToggleSelection={toggleSelection}
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
      <Dialog open={mediaDialogOpen} onClose={() => { setMediaDialogOpen(false); setSelectedMediaIds([]); }} maxWidth="md" fullWidth>
        <DialogTitle>Selecionar Media (Multi-seleção)</DialogTitle>
        <DialogContent>
          {selectedMediaIds.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {selectedMediaIds.length} ficheiro(s) selecionado(s)
            </Alert>
          )}
          <List>
            {availableMedia.filter((m) => m.media_type === 'video' || m.media_type === 'audio').map((media) => {
              const isSelected = selectedMediaIds.includes(media.id);
              return (
                <ListItem
                  key={media.id}
                  button
                  onClick={() => toggleMediaSelection(media.id)}
                >
                  <Checkbox checked={isSelected} sx={{ mr: 1 }} />
                  <ListItemText
                    primary={media.filename}
                    secondary={`${media.media_type} • ${formatDuration(media.duration)}`}
                  />
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setMediaDialogOpen(false); setSelectedMediaIds([]); }}>Cancelar</Button>
          <Button 
            onClick={handleAddSelectedClips} 
            variant="contained"
            disabled={selectedMediaIds.length === 0}
          >
            Adicionar ({selectedMediaIds.length})
          </Button>
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
      {/* Automation / Fill Dialog */}
      <Dialog open={automationDialogOpen} onClose={() => setAutomationDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoFixIcon color="warning" /> Automação de Preenchimento
        </DialogTitle>
        <DialogContent dividers>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                Escolha como deseja preencher o tempo restante da sua playlist (até 24h).
            </Typography>
            
            <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }}>
                <RadioGroup value={automationType} onChange={(e) => setAutomationType(e.target.value)}>
                    <Paper variant="outlined" sx={{ p: 2, mb: 1, border: automationType === 'random' ? '2px solid' : '1px solid', borderColor: automationType === 'random' ? 'primary.main' : 'divider' }}>
                        <FormControlLabel value="random" control={<Radio />} label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ShuffleIcon /> 
                                <Box>
                                    <Typography variant="subtitle2">Aleatório da Pasta</Typography>
                                    <Typography variant="caption" color="text.secondary">Escolhe ficheiros aleatórios da pasta selecionada</Typography>
                                </Box>
                            </Box>
                        } />
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 2, mb: 1, border: automationType === 'sequential' ? '2px solid' : '1px solid', borderColor: automationType === 'sequential' ? 'primary.main' : 'divider' }}>
                        <FormControlLabel value="sequential" control={<Radio />} label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <SequentialIcon />
                                <Box>
                                    <Typography variant="subtitle2">Sequencial da Pasta</Typography>
                                    <Typography variant="caption" color="text.secondary">Segue a ordem dos ficheiros na pasta selecionada</Typography>
                                </Box>
                            </Box>
                        } />
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 2, mb: 1, border: automationType === 'loop' ? '2px solid' : '1px solid', borderColor: automationType === 'loop' ? 'primary.main' : 'divider' }}>
                        <FormControlLabel value="loop" control={<Radio />} label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LoopIcon />
                                <Box>
                                    <Typography variant="subtitle2">Loop da Seleção Atual</Typography>
                                    <Typography variant="caption" color="text.secondary">Repete os vídeos que já estão na playlist</Typography>
                                </Box>
                            </Box>
                        } />
                    </Paper>
                </RadioGroup>
            </FormControl>

            {automationType !== 'loop' && (
                <Box sx={{ mt: 2 }}>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Pasta de Origem</InputLabel>
                        <Select 
                            value={selectedFolder} 
                            label="Pasta de Origem"
                            onChange={(e) => setSelectedFolder(e.target.value)}
                        >
                            <MenuItem value="root">Raiz (Todas as pastas)</MenuItem>
                            {folders.map(f => (
                                <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControlLabel 
                        control={<Checkbox checked={useFillersOnly} onChange={(e) => setUseFillersOnly(e.target.checked)} />} 
                        label="Usar apenas ficheiros marcados como Filler"
                    />
                </Box>
            )}
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setAutomationDialogOpen(false)}>Cancelar</Button>
            <Button variant="contained" color="warning" onClick={handleRunAutomation} disabled={saving}>
                Executar Automação
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
