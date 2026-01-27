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
  LinearProgress,
  Tooltip,
  Stack,
  ListItemButton,
  ListItemIcon,
  CircularProgress,
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
  Timer as TimerIcon,
  DoneAll as DoneAllIcon,
  MoreVert as MoreIcon,
  Movie as MovieIcon,
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
    isDragging
  } = useSortable({ id: clip.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      disablePadding
      sx={{ mb: 1 }}
    >
      <Paper 
        className="glass-panel"
        sx={{ 
          width: '100%',
          p: 1.5,
          display: 'flex', 
          alignItems: 'center',
          gap: 2,
          transition: '0.2s',
          border: isSelected ? '1px solid rgba(0,229,255,0.3)' : '1px solid rgba(255,255,255,0.05)',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }
        }}
      >
        <Checkbox 
          checked={isSelected} 
          onChange={() => onToggleSelection(clip.id)}
          size="small"
          sx={{ color: 'rgba(255,255,255,0.3)' }}
        />
        
        <Box 
          {...attributes} 
          {...listeners} 
          sx={{ 
            cursor: 'grab', 
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            opacity: 0.5,
            '&:hover': { opacity: 1, filter: 'drop-shadow(0 0 5px #00e5ff)' }
          }}
        >
          <DragIcon />
        </Box>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 800, letterSpacing: 0.5, mb: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {clip.filename.toUpperCase()}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip 
              label={clip.start_time} 
              size="small" 
              sx={{ 
                height: 18, 
                fontSize: '0.6rem', 
                fontWeight: 800, 
                bgcolor: 'rgba(0,229,255,0.1)', 
                color: 'primary.main',
                borderRadius: 1
              }} 
            />
            <Typography variant="caption" sx={{ opacity: 0.5, fontWeight: 600 }}>
              DURAÇÃO: {formatShortDuration(clip.duration)}
            </Typography>
            {clip.is_filler && (
              <Chip label="FILLER" size="small" variant="outlined" color="warning" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 800 }} />
            )}
          </Stack>
        </Box>

        <IconButton 
          size="small"
          onClick={() => onRemove(clip.id)}
          sx={{ 
            color: 'error.main', 
            bgcolor: 'rgba(244,67,54,0.05)',
            '&:hover': { bgcolor: 'rgba(244,67,54,0.15)' }
          }}
        >
          <DeleteIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Paper>
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
  
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const setClips = (newClips, skipHistory = false) => {
    let finalClips;
    if (typeof newClips === 'function') {
      finalClips = calculateTimings(newClips(clips));
    } else {
      finalClips = calculateTimings(newClips);
    }
    
    setClipsState(finalClips);
    
    if (!skipHistory) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(finalClips);
      if (newHistory.length > 50) newHistory.shift();
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevClips = history[historyIndex - 1];
      setClipsState(prevClips);
      setHistoryIndex(historyIndex - 1);
      showSuccess('Desfazer (Undo)');
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextClips = history[historyIndex + 1];
      setClipsState(nextClips);
      setHistoryIndex(historyIndex + 1);
      showSuccess('Refazer (Redo)');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

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
      // Skip history during save to avoid duplicate state
      setClips(clips, true);
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
      setClips(loadedClips, true);
      // Reset history for the newly loaded playlist
      setHistory([loadedClips]);
      setHistoryIndex(0);
    } else {
      setClips([], true);
      setHistory([[]]);
      setHistoryIndex(0);
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
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 1. PREMIUM HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" className="neon-text" sx={{ fontWeight: 800 }}>PLAYLIST EDITOR</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 2 }}>GERADOR DE EMISSÃO AUTOMATICA & PROGRAMADA</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {selectedClipIds.length > 0 && (
            <Tooltip title="Eliminar clips selecionados" arrow>
              <Button 
                  variant="contained" 
                  color="error" 
                  startIcon={<DeleteIcon />} 
                  onClick={handleBulkDelete}
                  sx={{ borderRadius: 2, fontWeight: 800, px: 3 }}
              >
                ELIMINAR ({selectedClipIds.length})
              </Button>
            </Tooltip>
          )}
          <Tooltip title="Gerar playlist automaticamente" arrow>
            <Button 
              variant="outlined" 
              color="warning" 
              startIcon={<AutoFixIcon />} 
              onClick={() => setAutomationDialogOpen(true)}
              sx={{ borderRadius: 2, fontWeight: 800, px: 3 }}
            >
              AUTOMAÇÃO
            </Button>
          </Tooltip>
          <Tooltip title="Criar uma nova playlist vazia" arrow>
            <Button 
              variant="outlined" 
              onClick={handleNewPlaylist}
              sx={{ borderRadius: 2, fontWeight: 800, px: 3 }}
            >
              NOVA PLAYLIST
            </Button>
          </Tooltip>
          <Tooltip title="Guardar todas as alterações" arrow>
            <Button
              variant="contained"
              color="primary"
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving || clips.length === 0}
              sx={{ 
                borderRadius: 2, 
                fontWeight: 800, 
                px: 4, 
                filter: 'drop-shadow(0 0 10px rgba(0,229,255,0.3))',
                minWidth: '140px'
              }}
            >
              {saving ? 'A GUARDAR...' : 'SALVAR'}
            </Button>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {/* 2. SIDEBAR: LIBRARY */}
        <Grid item xs={12} md={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Paper className="glass-panel" sx={{ p: 0, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', bgcolor: 'rgba(255,255,255,0.02)' }}>
              <Typography variant="overline" sx={{ fontWeight: 800, color: 'primary.main' }}>BIBLIOTECA DE PLAYLISTS</Typography>
            </Box>
            <List sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
              {playlists.map((playlist) => (
                <ListItemButton
                  key={playlist.id}
                  selected={selectedPlaylist?.id === playlist.id}
                  onClick={() => handleLoadPlaylist(playlist)}
                  sx={{ 
                    borderRadius: 3, 
                    mb: 1,
                    transition: '0.3s',
                    '&.Mui-selected': { bgcolor: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)' },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                  }}
                >
                  <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}>
                    <LoopIcon sx={{ fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={playlist.name.toUpperCase()}
                    secondary={playlist.date}
                    primaryTypographyProps={{ sx: { fontWeight: 800, fontSize: '0.75rem', letterSpacing: 0.5 } }}
                    secondaryTypographyProps={{ sx: { fontSize: '0.65rem', opacity: 0.6 } }}
                  />
                  <IconButton 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePlaylist(playlist);
                    }}
                    sx={{ color: 'error.main', opacity: 0, '.MuiListItemButton-root:hover &': { opacity: 1 } }}
                  >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </ListItemButton>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* 3. MAIN EDITOR AREA */}
        <Grid item xs={12} md={9} sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* DEFINITIONS & VALIDATION */}
          <Paper className="glass-panel" sx={{ p: 3, mb: 2 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={2}>
                    <TextField
                        fullWidth label="NOME DA PLAYLIST"
                        value={playlistName}
                        onChange={(e) => setPlaylistName(e.target.value)}
                        variant="standard"
                        InputLabelProps={{ shrink: true, sx: { fontWeight: 800, fontSize: '0.7rem' } }}
                        inputProps={{ sx: { fontWeight: 800, fontSize: '0.9rem' } }}
                    />
                    <TextField
                        fullWidth label="DATA DE EMISSÃO" type="date"
                        value={playlistDate}
                        onChange={(e) => setPlaylistDate(e.target.value)}
                        variant="standard"
                        InputLabelProps={{ shrink: true, sx: { fontWeight: 800, fontSize: '0.7rem' } }}
                        inputProps={{ sx: { fontWeight: 800, fontSize: '0.9rem' } }}
                    />
                </Stack>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: totalDuration >= 86000 ? 'success.main' : 'warning.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TimerIcon sx={{ fontSize: 16 }} /> DURAÇÃO TOTAL: {formatDuration(totalDuration)}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.5 }}>META: 24:00:00</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min((totalDuration / 86400) * 100, 100)} 
                    sx={{ 
                        height: 6, 
                        borderRadius: 3, 
                        bgcolor: 'rgba(255,255,255,0.05)',
                        '& .MuiLinearProgress-bar': {
                            bgcolor: totalDuration >= 86000 ? 'success.main' : 'primary.main',
                            boxShadow: totalDuration >= 86000 ? '0 0 10px #4caf50' : '0 0 10px #00e5ff'
                        }
                    }}
                  />
                  {totalDuration < 86300 && totalDuration > 0 && (
                      <Typography variant="caption" sx={{ color: 'warning.main', fontSize: '0.65rem', mt: 1, display: 'block', fontWeight: 600 }}>
                          ⚠️ FALTAM {formatDuration(86400 - totalDuration)} PARA COMPLETAR AS 24H
                      </Typography>
                  )}
                  {totalDuration >= 86400 && (
                      <Typography variant="caption" sx={{ color: 'success.main', fontSize: '0.65rem', mt: 1, display: 'block', fontWeight: 600 }}>
                          ✅ PLAYLIST PRONTA PARA EMISSÃO (24H COMPLETAS)
                      </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* CLIPS GRID */}
          <Paper className="glass-panel" sx={{ flexGrow: 1, p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.01)' }}>
              <Box>
                <Typography variant="overline" sx={{ fontWeight: 800, color: 'primary.main' }}>GRID DE SEQUÊNCIA ({clips.length} CLIPS)</Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setMediaDialogOpen(true)}
                sx={{ borderRadius: 2, fontWeight: 800, fontSize: '0.7rem' }}
              >
                ADICIONAR CLIP
              </Button>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
              {clips.length === 0 ? (
                <Box sx={{ height: '100%', display: 'flex', flexFlow: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                  <MovieIcon sx={{ fontSize: 60, mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>PLAYLIST VAZIA</Typography>
                  <Typography variant="body2">ADICIONE MEDIA DA BIBLIOTECA PARA COMEÇAR</Typography>
                </Box>
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
                    <List disablePadding>
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
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Media Selection Dialog */}
      <Dialog 
        open={mediaDialogOpen} 
        onClose={() => { setMediaDialogOpen(false); setSelectedMediaIds([]); }} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ className: 'glass-panel', sx: { backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'primary.main', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            SELECIONAR MEDIA ({availableMedia.filter(m => m.media_type === 'video' || m.media_type === 'audio').length} DISPONÍVEIS)
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {selectedMediaIds.length > 0 && (
            <Alert severity="info" sx={{ m: 2, borderRadius: 2, bgcolor: 'rgba(0,229,255,0.05)', color: 'primary.main', border: '1px solid rgba(0,229,255,0.1)' }}>
              {selectedMediaIds.length} FICHEIRO(S) SELECIONADO(S) PRONTOS PARA ADICIONAR
            </Alert>
          )}
          <List sx={{ px: 2 }}>
            {availableMedia.filter((m) => m.media_type === 'video' || m.media_type === 'audio').map((media) => {
              const isSelected = selectedMediaIds.includes(media.id);
              return (
                <ListItemButton
                  key={media.id}
                  onClick={() => toggleMediaSelection(media.id)}
                  sx={{ 
                    borderRadius: 3, 
                    mb: 1, 
                    bgcolor: isSelected ? 'rgba(0,229,255,0.05)' : 'transparent',
                    border: isSelected ? '1px solid rgba(0,229,255,0.2)' : '1px solid transparent'
                  }}
                >
                  <Checkbox checked={isSelected} sx={{ color: isSelected ? 'primary.main' : 'rgba(255,255,255,0.2)' }} />
                  <ListItemText
                    primary={media.filename.toUpperCase()}
                    secondary={`${media.media_type.toUpperCase()} • ${formatDuration(media.duration)}`}
                    primaryTypographyProps={{ sx: { fontWeight: 800, fontSize: '0.8rem' } }}
                    secondaryTypographyProps={{ sx: { fontSize: '0.65rem', opacity: 0.6 } }}
                  />
                  {media.is_filler && <Chip label="FILLER" size="small" variant="outlined" color="warning" sx={{ height: 16, fontSize: '0.55rem' }} />}
                </ListItemButton>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Button onClick={() => { setMediaDialogOpen(false); setSelectedMediaIds([]); }} sx={{ fontWeight: 800 }}>CANCELAR</Button>
          <Button 
            onClick={handleAddSelectedClips} 
            variant="contained"
            disabled={selectedMediaIds.length === 0}
            sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}
          >
            ADICIONAR ({selectedMediaIds.length})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Playlist Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ className: 'glass-panel', sx: { backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'primary.main' }}>NOVA PLAYLIST</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="NOME DA PLAYLIST"
            fullWidth
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true, sx: { fontWeight: 800 } }}
            InputProps={{ sx: { borderRadius: 3, fontWeight: 800 } }}
            placeholder="ex: PLAYLIST SEGUNDA-FEIRA"
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setCreateDialogOpen(false)} sx={{ fontWeight: 800 }}>CANCELAR</Button>
          <Button variant="contained" onClick={handleCreateNewPlaylist} sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}>CRIAR</Button>
        </DialogActions>
      </Dialog>
      {/* Automation / Fill Dialog */}
      <Dialog 
        open={automationDialogOpen} 
        onClose={() => setAutomationDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ className: 'glass-panel', sx: { backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoFixIcon /> AUTOMAÇÃO DE PREENCHIMENTO
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <Typography variant="caption" sx={{ opacity: 0.6, fontWeight: 600, mb: 3, display: 'block' }}>
                ESCOLHA O MÉTODO DE PREENCHIMENTO PARA ATINGIR A META DE 24H.
            </Typography>
            
            <FormControl component="fieldset" sx={{ width: '100%' }}>
                <RadioGroup value={automationType} onChange={(e) => setAutomationType(e.target.value)}>
                    {[
                        { value: 'random', label: 'ALEATÓRIO DA PASTA', desc: 'Escolhe média aleatória da origem selecionada.', icon: <ShuffleIcon /> },
                        { value: 'sequential', label: 'SEQUENCIAL DA PASTA', desc: 'Segue a ordem alfabética dos ficheiros.', icon: <SequentialIcon /> },
                        { value: 'loop', label: 'LOOP DA SELEÇÃO ATUAL', desc: 'Repete os clips já presentes no grid.', icon: <LoopIcon /> }
                    ].map((mode) => (
                        <Paper 
                            key={mode.value}
                            variant="outlined" 
                            sx={{ 
                                p: 1, mb: 1.5, borderRadius: 3, transition: '0.2s',
                                bgcolor: automationType === mode.value ? 'rgba(0,229,255,0.05)' : 'transparent',
                                border: automationType === mode.value ? '1px solid rgba(0,229,255,0.3)' : '1px solid rgba(255,255,255,0.05)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' }
                            }}
                        >
                            <FormControlLabel 
                                value={mode.value} 
                                control={<Radio size="small" />} 
                                sx={{ width: '100%', m: 0, px: 1 }}
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 1 }}>
                                        <Box sx={{ color: automationType === mode.value ? 'primary.main' : 'inherit', opacity: automationType === mode.value ? 1 : 0.5 }}>
                                            {mode.icon}
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.75rem' }}>{mode.label}</Typography>
                                            <Typography variant="caption" sx={{ opacity: 0.5, display: 'block', fontSize: '0.65rem' }}>{mode.desc}</Typography>
                                        </Box>
                                    </Box>
                                } 
                            />
                        </Paper>
                    ))}
                </RadioGroup>
            </FormControl>

            {automationType !== 'loop' && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <FormControl fullWidth variant="standard" sx={{ mb: 2 }}>
                        <InputLabel shrink sx={{ fontWeight: 800, fontSize: '0.7rem' }}>PASTA DE ORIGEM</InputLabel>
                        <Select 
                            value={selectedFolder} 
                            onChange={(e) => setSelectedFolder(e.target.value)}
                            sx={{ fontWeight: 800, fontSize: '0.8rem' }}
                        >
                            <MenuItem value="root">RAIZ (TODAS AS PASTAS)</MenuItem>
                            {folders.map(f => (
                                <MenuItem key={f.id} value={f.id}>{f.name.toUpperCase()}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControlLabel 
                        control={<Checkbox checked={useFillersOnly} onChange={(e) => setUseFillersOnly(e.target.checked)} size="small" />} 
                        label={<Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.8 }}>USAR APENAS FICHEIROS MARCADOS COMO FILLER</Typography>}
                    />
                </Box>
            )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setAutomationDialogOpen(false)} sx={{ fontWeight: 800 }}>CANCELAR</Button>
            <Button 
                variant="contained" 
                color="warning" 
                onClick={handleRunAutomation} 
                disabled={saving}
                sx={{ borderRadius: 2, fontWeight: 800, px: 4, bgcolor: 'warning.main', color: 'black' }}
            >
                EXECUTAR AGORA
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
