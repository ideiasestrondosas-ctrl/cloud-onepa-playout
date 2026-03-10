import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';
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
  Tabs,
  Tab,
  Divider,
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
  Folder as FolderIcon,
  Tv as AdCueIcon,
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

function SortableClip({ clip, onRemove, isSelected, onToggleSelection, onAdCue }) {
  const { t } = useTranslation();
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
              {t('playlist.sidebar.duration', { duration: formatShortDuration(clip.duration) })}
            </Typography>
            {clip.is_filler && (
              <Chip label={t('media.filler').toUpperCase()} size="small" variant="outlined" color="warning" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 800 }} />
            )}
          </Stack>
        </Box>

        <Tooltip title="Ad Cue (SCTE-35)" placement="top">
          <IconButton
            size="small"
            onClick={() => onAdCue && onAdCue(clip)}
            sx={{
              color: 'warning.main',
              bgcolor: 'rgba(255,193,7,0.05)',
              '&:hover': { bgcolor: 'rgba(255,193,7,0.15)' }
            }}
          >
            <AdCueIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>

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
  const { t } = useTranslation();
  const { showSuccess, showError, showWarning } = useNotification();
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [scte35Dialog, setScte35Dialog] = useState({ open: false, clip: null, markers: [], pts_offset: 0, duration_frames: '', auto_return: true });
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

  const handleOpenAdCue = async (clip) => {
    try {
      const res = await fetch(`/api/v2/scte35?playlist_item_id=${clip.id}`);
      const markers = res.ok ? await res.json() : [];
      setScte35Dialog({ open: true, clip, markers, pts_offset: 0, duration_frames: '', auto_return: true });
    } catch {
      setScte35Dialog({ open: true, clip, markers: [], pts_offset: 0, duration_frames: '', auto_return: true });
    }
  };

  const handleAddScte35 = async () => {
    const { clip, pts_offset, duration_frames, auto_return } = scte35Dialog;
    try {
      const res = await fetch('/api/v2/scte35', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlist_item_id: clip.id,
          playlist_id: selectedPlaylist?.id || null,
          pts_offset: Number(pts_offset) || 0,
          duration_frames: duration_frames !== '' ? Number(duration_frames) : null,
          auto_return,
        }),
      });
      if (res.ok) {
        const marker = await res.json();
        setScte35Dialog(d => ({ ...d, markers: [...d.markers, marker] }));
        showSuccess('Ad cue marker added');
      } else {
        showError('Failed to add Ad cue marker');
      }
    } catch {
      showError('Failed to add Ad cue marker');
    }
  };

  const handleDeleteScte35 = async (markerId) => {
    try {
      const res = await fetch(`/api/v2/scte35/${markerId}`, { method: 'DELETE' });
      if (res.ok) {
        setScte35Dialog(d => ({ ...d, markers: d.markers.filter(m => m.id !== markerId) }));
      }
    } catch {
      showError('Failed to delete Ad cue marker');
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevClips = history[historyIndex - 1];
      setClipsState(prevClips);
      setHistoryIndex(historyIndex - 1);
      showSuccess(t('playlist.editor.undo'));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextClips = history[historyIndex + 1];
      setClipsState(nextClips);
      setHistoryIndex(historyIndex + 1);
      showSuccess(t('playlist.editor.redo'));
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
    if (!Array.isArray(clipsList)) return []; // Critical Safety Guard
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
  const [currentFolderInPicker, setCurrentFolderInPicker] = useState('root');
  const [fillerFilter, setFillerFilter] = useState('all'); // all, only, exclude
  const [sidebarTab, setSidebarTab] = useState('media'); // playlists, media
  const [availableMedia, setAvailableMedia] = useState([]); // Fixed initialization

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
      setPlaylists(response.data?.playlists || []);
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
      setPlaylists([]);
    }
  };

  const fetchAvailableMedia = async () => {
    try {
      const response = await mediaAPI.list();
      setAvailableMedia(response.data?.media || []);
    } catch (error) {
      console.error('Failed to fetch media:', error);
      setAvailableMedia([]);
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

  const handleSelectAllMedia = (checked) => {
    if (checked) {
      const allFilteredIds = availableMedia
        .filter((m) => m.media_type === 'video' || m.media_type === 'audio')
        .map(m => m.id);
      setSelectedMediaIds(allFilteredIds);
    } else {
      setSelectedMediaIds([]);
    }
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
    if (window.confirm(t('playlist.notifications.bulk_delete_confirm', { count: selectedClipIds.length }))) {
      setClips(clips.filter(c => !selectedClipIds.includes(c.id)));
      setSelectedClipIds([]);
      showSuccess(t('playlist.notifications.removed_count', { count: selectedClipIds.length }));
    }
  };

  const handleAddAllFromFolder = () => {
    const filteredSource = availableMedia.filter(m => {
      const inFolder = currentFolderInPicker === 'root' || m.folder_id === currentFolderInPicker;
      const isMedia = m.media_type === 'video' || m.media_type === 'audio';
      const matchesFiller =
        fillerFilter === 'all' ? true :
          fillerFilter === 'only' ? m.is_filler :
            !m.is_filler;
      return inFolder && isMedia && matchesFiller;
    });

    if (filteredSource.length === 0) {
      showWarning(t('playlist.notifications.no_files_found'));
      return;
    }

    const newClips = filteredSource.map(media => ({
      ...media,
      id: `${media.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      media_id: media.id,
    }));

    setClips([...clips, ...newClips]);
    showSuccess(t('playlist.notifications.added_count', { count: newClips.length }));
  };

  const handleSave = async () => {
    if (!playlistName.trim()) {
      showWarning(t('playlist.notifications.enter_name'));
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
        showSuccess(t('playlist.notifications.update_success'));
      } else {
        const response = await playlistAPI.create({
          name: playlistName,
          date: playlistDate,
          content,
        });
        setSelectedPlaylist(response.data);
        showSuccess(t('playlist.notifications.create_success'));
      }
      await fetchPlaylists();
      // Skip history during save to avoid duplicate state
      setClips(clips, true);
    } catch (error) {
      console.error('Failed to save playlist:', error);
      showError(t('playlist.notifications.save_error'));
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
      showWarning(t('playlist.notifications.automation_fail_time'));
      setAutomationDialogOpen(false);
      return;
    }

    try {
      setSaving(true);
      let candidates = [];

      if (automationType === 'loop') {
        if (clips.length === 0) {
          showError(t('playlist.notifications.automation_no_clips_loop'));
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
          showError(t('playlist.notifications.automation_no_files_folder', { filler: useFillersOnly ? t('playlist.notifications.filler_flag') : '' }));
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
        const typeMap = {
          random: t('playlist.dialogs.automation.mode_random'),
          sequential: t('playlist.dialogs.automation.mode_sequential'),
          loop: t('playlist.dialogs.automation.mode_loop')
        };
        showSuccess(t('playlist.notifications.automation_success', { count: addedClips.length, type: typeMap[automationType] }));
      } else {
        showWarning(t('playlist.notifications.automation_no_suitable'));
      }
    } catch (error) {
      console.error('Automation failed:', error);
      showError(t('playlist.notifications.automation_error'));
    } finally {
      setSaving(false);
      setAutomationDialogOpen(false);
    }
  };

  const handleCreateNewPlaylist = async () => {
    if (!newPlaylistName.trim()) {
      showWarning(t('playlist.notifications.enter_name'));
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
      showSuccess(t('playlist.notifications.create_success'));
    } catch (error) {
      console.error('Failed to create playlist:', error);
      showError(t('playlist.notifications.save_error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlaylist = async (playlist) => {
    if (window.confirm(t('playlist.notifications.delete_confirm', { name: playlist.name }))) {
      try {
        await playlistAPI.delete(playlist.id);
        showSuccess(t('playlist.notifications.delete_success'));
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
          showError(t('playlist.notifications.delete_conflict'));
        } else {
          showError(t('playlist.notifications.delete_error'));
        }
      }
    }
  };

  const totalDuration = (clips || []).reduce((sum, clip) => sum + (clip.duration || 0), 0);
  const targetDuration = 24 * 3600; // 24 hours


  if (!Array.isArray(clips)) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading clips...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 1. PREMIUM HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" className="neon-text" sx={{ fontWeight: 800 }}>{t('playlist.title')}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 2 }}>{t('playlist.subtitle')}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {selectedClipIds.length > 0 && (
            <Tooltip title={t('playlist.notifications.bulk_delete_confirm', { count: selectedClipIds.length })} arrow>
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleBulkDelete}
                sx={{ borderRadius: 2, fontWeight: 800, px: 3 }}
              >
                {t('playlist.delete_selected', { count: selectedClipIds.length })}
              </Button>
            </Tooltip>
          )}
          <Tooltip title={t('playlist.automation')} arrow>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<AutoFixIcon />}
              onClick={() => setAutomationDialogOpen(true)}
              sx={{ borderRadius: 2, fontWeight: 800, px: 3 }}
            >
              {t('playlist.automation')}
            </Button>
          </Tooltip>
          <Tooltip title={t('playlist.new_playlist')} arrow>
            <Button
              variant="outlined"
              onClick={handleNewPlaylist}
              sx={{ borderRadius: 2, fontWeight: 800, px: 3 }}
            >
              {t('playlist.new_playlist')}
            </Button>
          </Tooltip>
          <Tooltip title={t('playlist.save')} arrow>
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
                minWidth: '140px',
                '&:hover': {
                  bgcolor: 'primary.main',
                  color: '#000', // Dark text on highlight as requested
                  filter: 'drop-shadow(0 0 15px rgba(0,229,255,0.5))'
                }
              }}
            >
              {saving ? t('playlist.saving') : t('playlist.save')}
            </Button>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <Grid item xs={12} md={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Paper className="glass-panel" sx={{ p: 0, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ p: 1, borderBottom: '1px solid rgba(255,255,255,0.05)', bgcolor: 'rgba(255,255,255,0.02)' }}>
              <Tabs
                value={sidebarTab}
                onChange={(e, v) => setSidebarTab(v)}
                variant="fullWidth"
                sx={{
                  minHeight: 36,
                  '& .MuiTab-root': { minHeight: 36, fontSize: '0.65rem', fontWeight: 800, color: 'text.secondary' },
                  '& .Mui-selected': { color: 'primary.main' }
                }}
              >
                <Tab value="media" label={t('playlist.tabs.media')} />
                <Tab value="playlists" label={t('playlist.tabs.playlists')} />
              </Tabs>
            </Box>

            {sidebarTab === 'playlists' ? (
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
                    <Tooltip title={t('common.delete')} arrow>
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
                    </Tooltip>
                  </ListItemButton>
                ))}
              </List>
            ) : (
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Folder Shortcuts */}
                <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <FormControl fullWidth variant="standard">
                    <Select
                      value={currentFolderInPicker}
                      onChange={(e) => setCurrentFolderInPicker(e.target.value)}
                      sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                      size="small"
                    >
                      <MenuItem value="root">{t('playlist.sidebar.root_all')}</MenuItem>
                      {folders.map(f => (
                        <MenuItem key={f.id} value={f.id}>{f.name.toUpperCase()}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Stack direction="row" spacing={0.5} sx={{ mt: 1.5 }}>
                    <Chip
                      label={t('playlist.sidebar.filter_all')} size="small"
                      onClick={() => setFillerFilter('all')}
                      variant={fillerFilter === 'all' ? 'filled' : 'outlined'}
                      sx={{ height: 20, fontSize: '0.6rem', fontWeight: 800 }}
                    />
                    <Chip
                      label={t('playlist.sidebar.filter_filler')} size="small" color="warning"
                      onClick={() => setFillerFilter('only')}
                      variant={fillerFilter === 'only' ? 'filled' : 'outlined'}
                      sx={{ height: 20, fontSize: '0.6rem', fontWeight: 800 }}
                    />
                    <Chip
                      label={t('playlist.sidebar.filter_no_filler')} size="small"
                      onClick={() => setFillerFilter('exclude')}
                      variant={fillerFilter === 'exclude' ? 'filled' : 'outlined'}
                      sx={{ height: 20, fontSize: '0.6rem', fontWeight: 800 }}
                    />
                    <Box sx={{ flexGrow: 1 }} />
                    <Tooltip title={t('playlist.sidebar.add_all_folder')}>
                      <IconButton size="small" color="primary" onClick={handleAddAllFromFolder}>
                        <DoneAllIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>

                {/* Quick Add List */}
                <List sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
                  {availableMedia
                    .filter((m) => {
                      const isMedia = m.media_type === 'video' || m.media_type === 'audio';
                      const inFolder = currentFolderInPicker === 'root' || m.folder_id === currentFolderInPicker;
                      const matchesFiller =
                        fillerFilter === 'all' ? true :
                          fillerFilter === 'only' ? m.is_filler :
                            !m.is_filler;
                      return isMedia && inFolder && matchesFiller;
                    })
                    .map((m) => (
                      <ListItemButton
                        key={m.id}
                        onClick={() => handleAddClip(m)}
                        sx={{
                          borderRadius: 2,
                          mb: 0.5,
                          p: 1,
                          '&:hover': { bgcolor: 'rgba(0,229,255,0.05)' }
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 32, color: 'primary.main' }}>
                          <MovieIcon sx={{ fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={m.filename.toUpperCase()}
                          primaryTypographyProps={{ sx: { fontWeight: 800, fontSize: '0.65rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }}
                          secondary={formatShortDuration(m.duration)}
                          secondaryTypographyProps={{ sx: { fontSize: '0.6rem', opacity: 0.5 } }}
                        />
                        <IconButton size="small" sx={{ color: 'primary.main', opacity: 0, '.MuiListItemButton-root:hover &': { opacity: 1 } }}>
                          <AddIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </ListItemButton>
                    ))
                  }
                </List>
              </Box>
            )}
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
                    fullWidth label={t('playlist.editor.name_label')}
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    variant="standard"
                    InputLabelProps={{ shrink: true, sx: { fontWeight: 800, fontSize: '0.7rem' } }}
                    inputProps={{ sx: { fontWeight: 800, fontSize: '0.9rem' } }}
                  />
                  <TextField
                    fullWidth label={t('playlist.editor.date_label')} type="date"
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
                      <TimerIcon sx={{ fontSize: 16 }} /> {t('playlist.editor.total_duration', { duration: formatDuration(totalDuration) })}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.5 }}>{t('playlist.editor.target_meta')}</Typography>
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
                      {t('playlist.editor.missing_time', { duration: formatDuration(86400 - totalDuration) })}
                    </Typography>
                  )}
                  {totalDuration >= 86400 && (
                    <Typography variant="caption" sx={{ color: 'success.main', fontSize: '0.65rem', mt: 1, display: 'block', fontWeight: 600 }}>
                      {t('playlist.editor.ready_msg')}
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
                <Typography variant="overline" sx={{ fontWeight: 800, color: 'primary.main' }}>{t('playlist.editor.sequence_grid', { count: clips.length })}</Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setMediaDialogOpen(true)}
                sx={{ borderRadius: 2, fontWeight: 800, fontSize: '0.7rem' }}
              >
                {t('playlist.editor.add_clip')}
              </Button>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
              {clips.length === 0 ? (
                <Box sx={{ height: '100%', display: 'flex', flexFlow: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                  <MovieIcon sx={{ fontSize: 60, mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>{t('playlist.editor.empty_title')}</Typography>
                  <Typography variant="body2">{t('playlist.editor.empty_msg')}</Typography>
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
                          onAdCue={handleOpenAdCue}
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
        maxWidth="lg"
        fullWidth
        PaperProps={{ className: 'glass-panel', sx: { backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'primary.main', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {t('playlist.dialogs.media_selector.title')}
            <Stack direction="row" spacing={1}>
              <Chip
                label={t('playlist.dialogs.media_selector.filter_all')} size="small"
                onClick={() => setFillerFilter('all')}
                variant={fillerFilter === 'all' ? 'filled' : 'outlined'}
                sx={{ height: 24, fontSize: '0.65rem', fontWeight: 800 }}
              />
              <Chip
                label={t('playlist.dialogs.media_selector.filter_filler')} size="small" color="warning"
                onClick={() => setFillerFilter('only')}
                variant={fillerFilter === 'only' ? 'filled' : 'outlined'}
                sx={{ height: 24, fontSize: '0.65rem', fontWeight: 800 }}
              />
              <Chip
                label={t('playlist.dialogs.media_selector.filter_no_filler')} size="small"
                onClick={() => setFillerFilter('exclude')}
                variant={fillerFilter === 'exclude' ? 'filled' : 'outlined'}
                sx={{ height: 24, fontSize: '0.65rem', fontWeight: 800 }}
              />
            </Stack>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              size="small" variant="outlined" color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddAllFromFolder}
              sx={{ height: 32, borderRadius: 2, fontWeight: 800, fontSize: '0.7rem' }}
            >
              {t('playlist.dialogs.media_selector.add_all')}
            </Button>
            <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 20 }} />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  onChange={(e) => handleSelectAllMedia(e.target.checked)}
                />
              }
              label={<Typography variant="caption" sx={{ fontWeight: 800 }}>{t('playlist.dialogs.media_selector.select_all')}</Typography>}
            />
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Grid container sx={{ minHeight: '60vh' }}>
            {/* Sidebar: Folders */}
            <Grid item xs={12} md={3} sx={{ borderRight: '1px solid rgba(255,255,255,0.05)', bgcolor: 'rgba(255,255,255,0.01)' }}>
              <List dense>
                <ListItemButton
                  selected={currentFolderInPicker === 'root'}
                  onClick={() => setCurrentFolderInPicker('root')}
                  sx={{ borderRadius: 0, '&.Mui-selected': { bgcolor: 'rgba(0,229,255,0.1)' } }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}><FolderIcon sx={{ fontSize: 18 }} /></ListItemIcon>
                  <ListItemText primary={t('playlist.dialogs.media_selector.all_folders')} primaryTypographyProps={{ sx: { fontWeight: 800, fontSize: '0.7rem' } }} />
                </ListItemButton>
                <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.05)' }} />
                {folders.map(f => (
                  <ListItemButton
                    key={f.id}
                    selected={currentFolderInPicker === f.id}
                    onClick={() => setCurrentFolderInPicker(f.id)}
                    sx={{ borderRadius: 0, '&.Mui-selected': { bgcolor: 'rgba(0,229,255,0.1)' } }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}><FolderIcon sx={{ fontSize: 18 }} /></ListItemIcon>
                    <ListItemText primary={f.name.toUpperCase()} primaryTypographyProps={{ sx: { fontWeight: 800, fontSize: '0.7rem' } }} />
                  </ListItemButton>
                ))}
              </List>
            </Grid>

            {/* Media List */}
            <Grid item xs={12} md={9}>
              {selectedMediaIds.length > 0 && (
                <Alert severity="info" sx={{ m: 2, borderRadius: 2, bgcolor: 'rgba(0,229,255,0.05)', color: 'primary.main', border: '1px solid rgba(0,229,255,0.1)' }}>
                  {t('playlist.dialogs.media_selector.selected_count', { count: selectedMediaIds.length })}
                </Alert>
              )}
              <List sx={{ px: 2, maxHeight: '60vh', overflowY: 'auto' }}>
                {availableMedia
                  .filter((m) => {
                    const isVideoAudio = m.media_type === 'video' || m.media_type === 'audio';
                    const inFolder = currentFolderInPicker === 'root' || m.folder_id === currentFolderInPicker;
                    const matchesFiller =
                      fillerFilter === 'all' ? true :
                        fillerFilter === 'only' ? m.is_filler :
                          !m.is_filler;
                    return isVideoAudio && inFolder && matchesFiller;
                  })
                  .map((media) => {
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
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Button onClick={() => { setMediaDialogOpen(false); setSelectedMediaIds([]); }} sx={{ fontWeight: 800 }}>{t('common.cancel')}</Button>
          <Button
            onClick={handleAddSelectedClips}
            variant="contained"
            disabled={selectedMediaIds.length === 0}
            sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}
          >
            {t('playlist.dialogs.media_selector.add_selected', { count: selectedMediaIds.length })}
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
        <DialogTitle sx={{ fontWeight: 800, color: 'primary.main' }}>{t('playlist.dialogs.create.title')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('playlist.dialogs.create.name_label')}
            fullWidth
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true, sx: { fontWeight: 800 } }}
            InputProps={{ sx: { borderRadius: 3, fontWeight: 800 } }}
            placeholder={t('playlist.dialogs.create.placeholder')}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setCreateDialogOpen(false)} sx={{ fontWeight: 800 }}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleCreateNewPlaylist} sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}>{t('playlist.dialogs.create.btn_create')}</Button>
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
          <AutoFixIcon /> {t('playlist.dialogs.automation.title')}
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <Typography variant="caption" sx={{ opacity: 0.6, fontWeight: 600, mb: 3, display: 'block' }}>
            {t('playlist.dialogs.automation.msg')}
          </Typography>

          <FormControl component="fieldset" sx={{ width: '100%' }}>
            <RadioGroup value={automationType} onChange={(e) => setAutomationType(e.target.value)}>
              {[
                { value: 'random', label: t('playlist.dialogs.automation.mode_random'), desc: t('playlist.dialogs.automation.mode_random_desc'), icon: <ShuffleIcon /> },
                { value: 'sequential', label: t('playlist.dialogs.automation.mode_sequential'), desc: t('playlist.dialogs.automation.mode_sequential_desc'), icon: <SequentialIcon /> },
                { value: 'loop', label: t('playlist.dialogs.automation.mode_loop'), desc: t('playlist.dialogs.automation.mode_loop_desc'), icon: <LoopIcon /> }
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
                <InputLabel shrink sx={{ fontWeight: 800, fontSize: '0.7rem' }}>{t('playlist.dialogs.automation.source_folder')}</InputLabel>
                <Select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  sx={{ fontWeight: 800, fontSize: '0.8rem' }}
                >
                  <MenuItem value="root">{t('playlist.sidebar.root_all')}</MenuItem>
                  {folders.map(f => (
                    <MenuItem key={f.id} value={f.id}>{f.name.toUpperCase()}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControlLabel
                control={<Checkbox checked={useFillersOnly} onChange={(e) => setUseFillersOnly(e.target.checked)} size="small" />}
                label={<Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.8 }}>{t('playlist.dialogs.automation.fillers_only')}</Typography>}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setAutomationDialogOpen(false)} sx={{ fontWeight: 800 }}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleRunAutomation}
            disabled={saving}
            sx={{ borderRadius: 2, fontWeight: 800, px: 4, bgcolor: 'warning.main', color: 'black' }}
          >
            {t('playlist.dialogs.automation.run_now')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SCTE-35 Ad Cue Dialog */}
      <Dialog
        open={scte35Dialog.open}
        onClose={() => setScte35Dialog(d => ({ ...d, open: false }))}
        maxWidth="sm"
        fullWidth
        PaperProps={{ className: 'glass-panel', sx: { backgroundImage: 'none', border: '1px solid rgba(255,193,7,0.25)' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'warning.main', display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <AdCueIcon /> AD CUE — {scte35Dialog.clip?.filename?.toUpperCase()}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="caption" sx={{ opacity: 0.5, fontWeight: 600, display: 'block', mb: 2 }}>
            SCTE-35 splice_insert markers are injected into the broadcast stream at the defined PTS offset.
          </Typography>

          {/* Existing markers */}
          {scte35Dialog.markers.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.7, letterSpacing: 1 }}>ACTIVE MARKERS</Typography>
              {scte35Dialog.markers.map(m => (
                <Box key={m.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, p: 1, borderRadius: 1, bgcolor: 'rgba(255,193,7,0.05)', border: '1px solid rgba(255,193,7,0.15)' }}>
                  <AdCueIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                  <Typography variant="caption" sx={{ flexGrow: 1, fontWeight: 700, fontFamily: 'monospace' }}>
                    {m.splice_insert_type} | PTS+{m.pts_offset} {m.duration_frames ? `| ${m.duration_frames}f` : ''} {m.auto_return ? '| AUTO' : ''}
                  </Typography>
                  <IconButton size="small" onClick={() => handleDeleteScte35(m.id)} sx={{ color: 'error.main', p: 0.3 }}>
                    <DeleteIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}

          {/* Add new marker form */}
          <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.7, letterSpacing: 1 }}>ADD MARKER</Typography>
          <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
            <TextField
              label="PTS Offset (90kHz ticks)"
              type="number"
              size="small"
              value={scte35Dialog.pts_offset}
              onChange={e => setScte35Dialog(d => ({ ...d, pts_offset: e.target.value }))}
              sx={{ flex: 1 }}
              InputLabelProps={{ shrink: true, sx: { fontWeight: 700 } }}
              placeholder="0"
            />
            <TextField
              label="Duration (frames)"
              type="number"
              size="small"
              value={scte35Dialog.duration_frames}
              onChange={e => setScte35Dialog(d => ({ ...d, duration_frames: e.target.value }))}
              sx={{ flex: 1 }}
              InputLabelProps={{ shrink: true, sx: { fontWeight: 700 } }}
              placeholder="e.g. 750 = 30s@25fps"
            />
          </Stack>
          <FormControlLabel
            sx={{ mt: 1 }}
            control={
              <Checkbox
                size="small"
                checked={scte35Dialog.auto_return}
                onChange={e => setScte35Dialog(d => ({ ...d, auto_return: e.target.checked }))}
              />
            }
            label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Auto-return after duration</Typography>}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setScte35Dialog(d => ({ ...d, open: false }))} sx={{ fontWeight: 800 }}>CLOSE</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleAddScte35}
            startIcon={<AdCueIcon />}
            sx={{ borderRadius: 2, fontWeight: 800, color: 'black' }}
          >
            ADD CUE
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
