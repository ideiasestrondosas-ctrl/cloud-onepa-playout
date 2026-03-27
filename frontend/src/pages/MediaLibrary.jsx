import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
  Alert,
  Stack,
  Tooltip,
  Breadcrumbs,
  Link,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Checkbox,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Search as SearchIcon,
  AutoFixHigh as AutoFixIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  CreateNewFolder as NewFolderIcon,
  NavigateNext as NextIcon,
  DriveFileMove as MoveIcon,
  Extension as ExtensionIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  Info as InfoIcon,
  Edit as EditIcon,
  AutoFixHigh as WizardIcon,
  Speed as SpeedIcon,
  Bolt as BoltIcon,
  Refresh as SyncIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { mediaAPI, channelWatchfolderAPI } from '../services/api';
import { FixedSizeList as ListWindow } from 'react-window';

import { useTranslation } from 'react-i18next';
import { useChannel } from '../contexts/ChannelContext';

// --- Sub-componente MediaCard Memoizado para Performance ---
const MediaCard = React.memo(({ 
  item, 
  t, 
  selectionMode, 
  selectedItemIds, 
  toggleItemSelection, 
  formatDuration, 
  handlePreload, 
  setSelectedMedia, 
  setVideoLoading, 
  setPreviewOpen, 
  activeTasks, 
  handleOptimize, 
  handleGenerateProxy, 
  handleFetchMetadata, 
  handleEditMetadata, 
  checkingDelete, 
  handleSmartDelete, 
  setMedia, 
  fetchMedia 
}) => (
  <Paper className="glass-panel" sx={{
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    '&:hover': {
      transform: 'translateY(-4px)',
      borderColor: 'primary.main',
      boxShadow: '0 8px 24px rgba(0, 229, 255, 0.15)'
    }
  }}>
    <Box sx={{ position: 'relative', height: 140 }}>
      <CardMedia
        component="img"
        height="140"
        image={item.media_type === 'video' ? `/api/media/${item.id}/thumbnail` : (item.media_type === 'image' ? `/api/media/${item.id}/stream` : `https://via.placeholder.com/300x140?text=${t('media.placeholders.audio')}`)}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = `https://via.placeholder.com/300x140?text=${t('media.placeholders.no_preview')}`;
        }}
        sx={{ filter: 'brightness(0.8)' }}
      />
      <Box sx={{
        position: 'absolute',
        top: 8,
        right: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5
      }}>
        <Chip
          label={item.media_type.toUpperCase()}
          size="small"
          sx={{
            height: 18,
            fontSize: '0.6rem',
            fontWeight: 800,
            bgcolor: 'rgba(0,0,0,0.8)',
            color: 'primary.main',
          }}
        />
        {item.duration > 0 && (
          <Chip
            label={formatDuration(item.duration)}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.6rem',
              fontWeight: 800,
              bgcolor: 'rgba(0,0,0,0.8)',
              color: '#fff',
            }}
          />
        )}
      </Box>
      {item.is_filler && (
        <Box sx={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          bgcolor: 'primary.main',
          color: '#000',
          px: 1,
          borderRadius: 1,
          fontSize: '0.6rem',
          fontWeight: 800
        }}>
          FILLER
        </Box>
      )}
      {selectionMode && (
        <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
          <Checkbox
            checked={selectedItemIds.includes(item.id)}
            onChange={() => toggleItemSelection(item.id)}
            sx={{
              color: 'primary.main',
              bgcolor: 'rgba(0,0,0,0.4)',
              p: 0.5,
              '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
              '&.Mui-checked': { color: 'primary.main' }
            }}
          />
        </Box>
      )}
    </Box>

    <Box sx={{ p: 2, flexGrow: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', mb: 2 }} title={item.filename}>
        {item.filename}
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title={t('media.preview')}>
            <IconButton
              size="small"
              sx={{ color: 'primary.main', bgcolor: 'rgba(0, 229, 255, 0.1)' }}
              onMouseEnter={() => handlePreload(item)}
              onClick={() => { setSelectedMedia(item); setVideoLoading(item.media_type === 'video'); setPreviewOpen(true); }}
            >
              <PlayIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {item.media_type === 'video' && (
            <Tooltip title={item.is_optimized ? t('media.optimized_streaming') : t('media.optimize_streaming')}>
              <IconButton
                size="small"
                sx={{
                  color: item.is_optimized ? 'success.light' : 'success.main',
                  bgcolor: item.is_optimized ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
                  border: item.is_optimized ? '1px solid rgba(76, 175, 80, 0.4)' : 'none'
                }}
                onClick={() => handleOptimize(item.id)}
                disabled={item.is_optimized || activeTasks[item.id]?.some(task => task.task_type === 'optimize' && (task.status === 'pending' || task.status === 'processing'))}
              >
                {activeTasks[item.id]?.find(task => task.task_type === 'optimize' && task.status === 'failed') ? (
                  <Tooltip title={t('common.error_details', { error: activeTasks[item.id]?.find(task => task.task_type === 'optimize' && task.status === 'failed')?.error_message || t('common.unknown') })}>
                    <ErrorIcon fontSize="small" color="error" />
                  </Tooltip>
                ) : activeTasks[item.id]?.some(task => task.task_type === 'optimize') ? (
                  <CircularProgress key={`opt-${item.id}`} size={16} color="success" />
                ) : item.is_optimized ? (
                  <CheckCircleIcon fontSize="small" />
                ) : (
                  <SpeedIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          )}
          {item.media_type === 'video' && (
            <Tooltip title={item.has_proxy ? t('media.proxy_available') : t('media.generate_proxy')}>
              <IconButton
                size="small"
                sx={{
                  color: item.has_proxy ? 'secondary.light' : 'warning.main',
                  bgcolor: item.has_proxy ? 'rgba(156, 39, 176, 0.2)' : 'rgba(255, 152, 0, 0.1)',
                  border: item.has_proxy ? '1px solid rgba(156, 39, 176, 0.4)' : 'none'
                }}
                onClick={() => handleGenerateProxy(item.id)}
                disabled={item.has_proxy || activeTasks[item.id]?.some(task => task.task_type === 'proxy' && (task.status === 'pending' || task.status === 'processing'))}
              >
                {activeTasks[item.id]?.find(task => task.task_type === 'proxy' && task.status === 'failed') ? (
                  <Tooltip title={t('common.error_details', { error: activeTasks[item.id]?.find(task => task.task_type === 'proxy' && task.status === 'failed')?.error_message || t('common.unknown') })}>
                    <ErrorIcon fontSize="small" color="error" />
                  </Tooltip>
                ) : activeTasks[item.id]?.some(task => task.task_type === 'proxy') ? (
                  <CircularProgress key={`proxy-${item.id}`} size={16} color="warning" />
                ) : item.has_proxy ? (
                  <CheckCircleIcon fontSize="small" />
                ) : (
                  <BoltIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={t('media.metadata_wizard')}>
            <IconButton size="small" sx={{ color: 'secondary.main', bgcolor: 'rgba(156, 39, 176, 0.1)' }} onClick={() => handleFetchMetadata(item)}><WizardIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title={t('media.edit')}>
            <IconButton size="small" sx={{ color: 'text.secondary', bgcolor: 'rgba(255, 255, 255, 0.05)' }} onClick={() => handleEditMetadata(item)}><EditIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title={t('media.file')}>
            <IconButton
              size="small"
              color="error"
              sx={{ bgcolor: 'rgba(244, 67, 54, 0.1)' }}
              disabled={checkingDelete === item.id}
              onClick={(e) => handleSmartDelete(e, item)}
            >
              {checkingDelete === item.id ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Stack>
        <Button
          size="small"
          className={item.is_filler ? 'neon-glow' : ''}
          sx={{
            fontSize: '0.65rem',
            fontWeight: 800,
            minWidth: 60,
            height: 24,
            bgcolor: item.is_filler ? 'primary.main' : 'rgba(255, 255, 255, 0.05)',
            color: item.is_filler ? '#000' : 'text.secondary'
          }}
          onClick={async () => { await mediaAPI.setFiller(item.id, !item.is_filler); fetchMedia(); }}
        >
          {item.is_filler ? 'FILLER' : 'PROG'}
        </Button>
      </Box>
    </Box>
  </Paper>
));

export default function MediaLibrary() {
  const { t } = useTranslation();
  const { showSuccess, showError, showWarning, showInfo } = useNotification();
  const { activeChannelId } = useChannel();
  const [media, setMedia] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState(null); // null = root
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    media_type: '',
    search: '',
    page: 1,
    limit: 20,
    is_filler: undefined,
  });
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false); // Loading state for video preview
  const [transparencyOpen, setTransparencyOpen] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [mediaToMove, setMediaToMove] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, media: null, usage: null });
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadProgressOpen, setUploadProgressOpen] = useState(false);
  const [checkingDelete, setCheckingDelete] = useState(null); // ID of media being checked
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [metadataForm, setMetadataForm] = useState({
    title: '',
    description: '',
    episode: '',
    season: '',
    genre: '',
    rating: '',
    director: '',
    writer: '',
    poster_url: '',
    keywords: '',
    resolution: '',
    fps: '',
    audioCodec: '',
    subtitles: '',
    year: ''
  });
  const [editingMedia, setEditingMedia] = useState(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [metadataSource, setMetadataSource] = useState(null);
  const [uploadControllers, setUploadControllers] = useState({}); // { fileId: AbortController }
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [performingBulkAction, setPerformingBulkAction] = useState(false);
  const [activeTasks, setActiveTasks] = useState({}); // { mediaId: [task1, task2] }
  const finishedIdsRef = React.useRef([]); // Track IDs that just finished for safe fetchMedia call
  const [syncing, setSyncing] = useState(false);
  const [syncingWatchfolder, setSyncingWatchfolder] = useState(false);

  // Auditing States
  const [auditDialog, setAuditDialog] = useState({ open: false, data: null, loading: false });

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        folder_id: currentFolder?.id || 'root',
        channel_id: activeChannelId
      };
      const res = await mediaAPI.list(params);
      setMedia(res.data.media);
      setPagination({ total: res.data.total, pages: res.data.pages });
    } catch (error) {
      showError(t('media.error_loading') || 'Erro ao carregar ficheiros');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncMedia = async () => {
    try {
      setSyncing(true);
      const res = await mediaAPI.sync();
      if (res.data.status === 'ok') {
        showSuccess(t('media.sync_success', { added: res.data.added }));
      } else {
        showSuccess(t('media.sync_partial', { added: res.data.added, errors: res.data.errors }));
      }
      fetchMedia();
    } catch (err) {
      showError(t('media.error_sync') || 'Erro ao sincronizar ficheiros do disco');
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncWatchfolder = async () => {
    if (!activeChannelId) return;
    try {
      setSyncingWatchfolder(true);
      const res = await channelWatchfolderAPI.sync(activeChannelId);
      const { ingested, skipped, errors } = res.data;
      if (errors && errors.length > 0) {
        showWarning(`Watchfolder sync: ${ingested} ingested, ${skipped} skipped, ${errors.length} errors`);
      } else {
        showSuccess(`Watchfolder sync: ${ingested} new files ingested, ${skipped} already existed`);
      }
      fetchMedia();
    } catch (err) {
      showError('Erro ao sincronizar watchfolder do canal');
      console.error(err);
    } finally {
      setSyncingWatchfolder(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchMedia();
    fetchFolders();
  }, [filters, currentFolder, activeChannelId]);


  // Polling for active tasks
  useEffect(() => {
    if (media.length === 0) return;

    const pollTasks = async () => {
      const mediaWithPossibleTasks = media.filter(m => m.media_type === 'video');
      if (mediaWithPossibleTasks.length === 0) return;

      const updatedTasks = {};
      const justFinished = [];
      const prevIds = Object.keys(activeTasks);
      const ids = mediaWithPossibleTasks.map(item => item.id);

      try {
        const response = await mediaAPI.getMediaTasksBatch(ids);
        const tasksById = response.data.tasks || {};

        for (const item of mediaWithPossibleTasks) {
          const tasks = tasksById[item.id] || [];

          // Filter active and recently failed tasks (keep failed for 2 min for UI feedback)
          const activeOrFailed = tasks.filter(task =>
            task.status === 'pending' ||
            task.status === 'processing' ||
            (task.status === 'failed' && (new Date() - new Date(task.created_at)) < 120000)
          );

          // Notify user about newly-failed tasks
          const failedTasks = activeOrFailed.filter(task => task.status === 'failed');
          const existingFailed = (activeTasks[item.id] || []).filter(task => task.status === 'failed');
          for (const ft of failedTasks) {
            if (!existingFailed.some(task => task.id === ft.id)) {
              showError(`Erro ao processar "${item.filename}": ${ft.error_message || ft.task_type}`);
            }
          }

          if (activeOrFailed.length > 0) {
            updatedTasks[item.id] = activeOrFailed;
          }
        }
      } catch (error) {
        console.error('Failed to fetch tasks batch:', error);
      }

      // Detect tasks that just finished: were in prev, not in new
      for (const id of prevIds) {
        if (!updatedTasks[id]) {
          justFinished.push(id);
        }
      }

      // Store finished IDs so the side-effect below can safely call fetchMedia
      if (justFinished.length > 0) {
        finishedIdsRef.current = justFinished;
      }

      setActiveTasks(prev => {
        if (JSON.stringify(prev) === JSON.stringify(updatedTasks)) return prev;
        return updatedTasks;
      });
    };

    const interval = setInterval(pollTasks, 4000);
    return () => clearInterval(interval);
  }, [media.length, filters.page, filters.search, activeTasks]); // eslint-disable-line react-hooks/exhaustive-deps

  // Safe side-effect: call fetchMedia when tasks finish (outside of state updater)
  useEffect(() => {
    if (finishedIdsRef.current.length > 0) {
      finishedIdsRef.current = [];
      fetchMedia();
    }
  }, [activeTasks]); // eslint-disable-line react-hooks/exhaustive-deps


  const fetchFolders = async () => {
    try {
      const response = await mediaAPI.listFolders();
      setFolders(response.data);
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName) return;
    try {
      await mediaAPI.createFolder({ name: newFolderName, parent_id: currentFolder?.id });
      showSuccess(t('media.folder_created'));
      setNewFolderName('');
      setNewFolderOpen(false);
      fetchFolders();
    } catch (error) {
      showError(t('common.error'));
    }
  };

  const handleDeleteFolder = async (id, name) => {
    if (window.confirm(t('media.delete_folder_confirm', { name }))) {
      try {
        showInfo(`Eliminando pasta "${name}"...`);
        const response = await mediaAPI.deleteFolder(id);
        showSuccess(response.data.message || 'Pasta eliminada');

        if (currentFolder?.id === id) {
          setCurrentFolder(null);
        } else {
          // Even if we are not in the folder, refresh both to be sure
          await fetchFolders();
          await fetchMedia();
        }
      } catch (error) {
        showError('Erro ao eliminar pasta');
        console.error('Delete folder error:', error);
      }
    }
  };

  const handleMoveMedia = async (targetFolderId) => {
    try {
      await mediaAPI.moveMedia(mediaToMove.id, targetFolderId);
      showSuccess(t('media.bulk_success'));
      setMoveOpen(false);
      fetchMedia();
    } catch (error) {
      showError(t('common.error'));
    }
  };

  const handleCopyMedia = async (targetFolderId) => {
    try {
      await mediaAPI.copyMedia(mediaToMove.id, targetFolderId);
      showSuccess(t('media.bulk_success'));
      setMoveOpen(false);
      fetchMedia();
    } catch (error) {
      showError(t('common.error'));
    }
  };

  const handleEditMetadata = (item) => {
    setEditingMedia(item);
    setMetadataForm({
      title: item.metadata?.title || '',
      description: item.metadata?.description || '',
      episode: item.metadata?.episode || '',
      season: item.metadata?.season || '',
      genre: Array.isArray(item.metadata?.genre) ? item.metadata?.genre.join(', ') : (item.metadata?.genre || ''),
      keywords: item.metadata?.keywords || '',
      rating: item.metadata?.rating || '',
      cast: Array.isArray(item.metadata?.cast) ? item.metadata?.cast.join(', ') : (item.metadata?.cast || ''),
      director: item.metadata?.director || '',
      writer: item.metadata?.writer || '',
      poster_url: item.metadata?.poster_url || item.metadata?.poster || '',
      resolution: item.metadata?.resolution || `${item.width || 0}x${item.height || 0}`,
      fps: item.metadata?.fps || '',
      videoCodec: item.metadata?.videoCodec || item.codec || '',
      audioCodec: item.metadata?.audioCodec || '',
      subtitles: item.metadata?.subtitles || '',
      year: item.metadata?.year || '',
    });
    setMetadataOpen(true);
  };

  const handleSaveMetadata = async () => {
    try {
      await mediaAPI.update(editingMedia.id, {
        metadata: {
          ...metadataForm,
          // Ensure source info is persisted even if not editing it right now
          source_service: metadataSource?.service || editingMedia.metadata?.source_service,
          source_url: metadataSource?.url || editingMedia.metadata?.source_url
        }
      });
      showSuccess(t('common.success'));
      setMetadataOpen(false);
      setIsReviewMode(false);
      fetchMedia();
    } catch (error) {
      showError(t('common.error'));
    }
  };

  const handleFetchMetadata = async (item) => {
    try {
      showInfo(`Buscando metadados para "${item.filename}"...`);
      const response = await mediaAPI.fetchMetadata(item.id);
      const data = response.data.data;

      setEditingMedia(item);
      setMetadataForm({
        title: data.title || '',
        description: data.description || '',
        episode: data.episode || '',
        season: data.season || '',
        genre: Array.isArray(data.tags) ? data.tags.join(', ') : (data.genre || ''),
        keywords: item.metadata?.keywords || '', // Keep existing keywords
        rating: data.rating || '',
        cast: Array.isArray(data.cast) ? data.cast.join(', ') : (data.cast || ''),
        director: data.director || '',
        poster_url: data.poster_url || '',
        // Keep technical specs from existing
        resolution: item.metadata?.resolution || `${item.width || 0}x${item.height || 0}`,
        fps: item.metadata?.fps || '',
        videoCodec: item.metadata?.videoCodec || item.codec || '',
        audioCodec: item.metadata?.audioCodec || '',
        year: data.year || '',
      });

      setMetadataSource({
        service: data.source_service || 'API Automática',
        url: data.source_url || null
      });

      setIsReviewMode(true);
      setMetadataOpen(true);
      showSuccess(t('media.bulk_success'));
    } catch (error) {
      showError(t('common.error') + ': ' + (error.response?.data?.error || error.message));
      // Even if it fails, open the manual editor so user can fill it
      handleEditMetadata(item);
    }
  };

  // Sequential Upload Logic
  useEffect(() => {
    if (uploadProgressOpen && uploadFiles.length > 0) {
      const hasActiveUploads = uploadFiles.some(f => f.status === 'uploading');
      const pendingFiles = uploadFiles.filter(f => f.status === 'pending');
      const allCompleted = uploadFiles.length > 0 && uploadFiles.every(f => f.status === 'success' || f.status === 'error');

      // If all finished, close and refresh after a small delay
      if (allCompleted && !uploading) {
        const finalizeUploads = async () => {
          try {
            await fetchMedia();
            // Small delay to let user see the "Success" status
            setTimeout(() => {
              setUploadProgressOpen(false);
              setUploadFiles([]);
            }, 1500);
          } catch (e) {
            console.error("Post-upload fetch failed", e);
            setUploadProgressOpen(false);
          }
        };
        finalizeUploads();
        return;
      }

      // Start next file if nothing is uploading
      if (!hasActiveUploads && pendingFiles.length > 0 && !uploading) {
        const nextFile = pendingFiles[0];
        const processUpload = async () => {
          setUploading(true);
          // Mark as uploading immediately to prevent double processing
          setUploadFiles(prev => prev.map(f => f.id === nextFile.id ? { ...f, status: 'uploading' } : f));

          const controller = new AbortController();
          setUploadControllers(prev => ({ ...prev, [nextFile.id]: controller }));

          const formData = new FormData();
          if (currentFolder) formData.append('folder_id', currentFolder.id);
          if (activeChannelId) formData.append('channel_id', activeChannelId);
          formData.append('files', nextFile.file);


          try {
            await mediaAPI.upload(formData, (progressEvent) => {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadFiles(prev => prev.map(f => f.id === nextFile.id ? {
                ...f,
                progress,
                loaded: progressEvent.loaded,
                total: progressEvent.total
              } : f));
            }, controller.signal);
            setUploadFiles(prev => prev.map(f => f.id === nextFile.id ? { ...f, status: 'success', progress: 100 } : f));
          } catch (error) {
            if (axios.isCancel(error)) {
              console.log('Upload cancelled');
            } else {
              console.error('Individual upload error:', error);
              setUploadFiles(prev => prev.map(f => f.id === nextFile.id ? { ...f, status: 'error' } : f));
            }
          } finally {
            setUploadControllers(prev => {
              const next = { ...prev };
              delete next[nextFile.id];
              return next;
            });
            setUploading(false);
          }
        };
        processUpload();
      }
    }
  }, [uploadProgressOpen, uploadFiles, currentFolder, uploading]);

  // Smart deletion with usage checking
  const handleSmartDelete = async (event, item) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    setCheckingDelete(item.id);
    try {
      // Check if media is used in playlists/schedule
      const usageRes = await mediaAPI.checkUsage(item.id);
      const usage = usageRes.data;

      if (!usage.in_use) {
        // Simple delete - not in use - show confirmation dialog
        setDeleteDialog({
          open: true,
          media: item,
          usage: { in_use: false, playlists: [], schedule_items: [] },
          simpleDelete: true
        });
        setCheckingDelete(null);
        return;
      }

      // Show smart dialog for files in use
      setDeleteDialog({
        open: true,
        media: item,
        usage: usage,
        simpleDelete: false
      });
    } catch (error) {
      showError('Erro ao verificar uso do ficheiro');
      console.error('Usage check error:', error);
    } finally {
      setCheckingDelete(null);
    }
  };

  const handleForceDelete = async () => {
    try {
      await mediaAPI.delete(deleteDialog.media.id);
      showSuccess(t('media.bulk_success'));
      setDeleteDialog({ open: false, media: null, usage: null, simpleDelete: false });
      fetchMedia();
    } catch (error) {
      showError(t('common.error'));
    }
  };

  const handleReplaceAndDelete = async () => {
    try {
      // First replace with filler
      const replaceRes = await mediaAPI.replaceWithFiller(deleteDialog.media.id);
      showInfo(`Substituído por: ${replaceRes.data.filler_used}`);

      // Then delete
      await mediaAPI.delete(deleteDialog.media.id);
      showSuccess(t('media.bulk_success'));
      setDeleteDialog({ open: false, media: null, usage: null });
      fetchMedia();
    } catch (error) {
      showError(t('common.error'));
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      file,
      progress: 0,
      status: 'pending',
      destination: currentFolder?.name || t('media.root')
    }));

    setUploadFiles(newFiles);
    setUploadProgressOpen(true);
  }, [currentFolder]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.ts', '.webm'],
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac'],
      'image/*': ['.jpg', '.jpeg', '.png', '.webp']
    }
  });

  function formatDuration(seconds) {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  const handleCancelUpload = (id) => {
    if (uploadControllers[id]) {
      uploadControllers[id].abort();
      setUploadFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'error', progress: 0, error: 'Cancelado' } : f));
    } else {
      // Just remove from pending/queue
      setUploadFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'error', error: 'Cancelado' } : f));
    }
  };

  const handleCancelAllUploads = () => {
    Object.values(uploadControllers).forEach(c => c.abort());
    setUploadFiles(prev => prev.map(f =>
      (f.status === 'uploading' || f.status === 'pending')
        ? { ...f, status: 'error', error: t('common.cancel') }
        : f
    ));
    showInfo(t('media.upload_cancelled'));
  };

  const toggleItemSelection = (id) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllInView = () => {
    const allIds = media.map(m => m.id);
    setSelectedItemIds(allIds);
  };

  const handleOpenAudit = async () => {
    setAuditDialog({ open: true, data: null, loading: true });
    try {
      const res = await mediaAPI.auditProxies();
      setAuditDialog({ open: true, data: res.data, loading: false });
    } catch (error) {
      showError('Erro ao auditar proxies.');
      setAuditDialog({ open: false, data: null, loading: false });
    }
  };

  const handleAuditActionAll = async () => {
    if (!auditDialog.data || auditDialog.data.missing_ids.length === 0) return;
    setAuditDialog(prev => ({ ...prev, open: false }));
    setPerformingBulkAction(true);
    try {
      showInfo(t('media.syncing'));
      await mediaAPI.batchProxy(auditDialog.data.missing_ids);
      showSuccess(t('media.batch_proxy_success'));
      setTimeout(() => fetchMedia(), 1000);
    } catch (e) {
      showError(t('common.error'));
    } finally {
      setPerformingBulkAction(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Preload video headers on hover to speed up playback start
  const handlePreload = (item) => {
    if (item.media_type === 'video') {
      // Use proxy URL when available — smaller file, faster moov atom fetch
      const url = item.has_proxy
        ? `/api/media/${item.id}/stream?proxy=true`
        : `/api/media/${item.id}/stream`;
      // Fetching only the first few bytes is enough to warm up the connection
      // and potentially fetch the moov atom (faststart) into browser cache
      fetch(url, { headers: { 'Range': 'bytes=0-1024' } }).catch(() => { });
    }
  };

  const handleClearSelection = () => {
    setSelectedItemIds([]);
    setSelectionMode(false);
  };

  const handleBulkSetFiller = async (isFiller) => {
    if (selectedItemIds.length === 0) return;
    setPerformingBulkAction(true);
    try {
      showInfo(`Aplicando acção a ${selectedItemIds.length} ficheiros...`);
      // We do this in sequence or parallel depending on backend capability.
      // Assuming a loop for now if no bulk endpoint exists.
      await Promise.all(selectedItemIds.map(id => mediaAPI.setFiller(id, isFiller)));
      showSuccess('Acção concluída com sucesso');
      setSelectedItemIds([]);
      setSelectionMode(false);
      fetchMedia();
    } catch (error) {
      showError('Erro ao aplicar acção em massa');
    } finally {
      setPerformingBulkAction(false);
    }
  };

  const handleBatchProxy = async () => {
    if (selectedItemIds.length === 0) return;
    setPerformingBulkAction(true);
    try {
      showInfo(t('media.syncing'));
      await mediaAPI.batchProxy(selectedItemIds);
      showSuccess(t('media.batch_proxy_success'));
      setSelectedItemIds([]);
      setSelectionMode(false);
      // Wait a moment before fetching to let tasks register
      setTimeout(() => fetchMedia(), 1000);
    } catch (error) {
      showError(t('common.error'));
    } finally {
      setPerformingBulkAction(false);
    }
  };

  const handleBatchOptimize = async () => {
    if (selectedItemIds.length === 0) return;
    setPerformingBulkAction(true);
    try {
      showInfo(`Adicionando ${selectedItemIds.length} ficheiros à fila de otimização faststart...`);
      await mediaAPI.batchOptimize(selectedItemIds);
      showSuccess('Ficheiros adicionados à fila de otimização com sucesso!');
      setSelectedItemIds([]);
      setSelectionMode(false);
      // Wait a moment before fetching
      setTimeout(() => fetchMedia(), 1000);
    } catch (error) {
      showError('Erro ao iniciar batch optimize: ' + (error.response?.data?.error || error.message));
    } finally {
      setPerformingBulkAction(false);
    }
  };

  const handleFolderSelect = (folder) => {
    setCurrentFolder(folder);
    setFilters(prev => ({ ...prev, page: 1 })); // Reset page when changing folder
  };

  const handleOptimize = async (itemId) => {
    try {
      // Optimistic state: show spinner immediately without waiting for poll
      setActiveTasks(prev => ({
        ...prev,
        [itemId]: [...(prev[itemId] || []), { id: `opt-local-${itemId}`, task_type: 'optimize', status: 'pending', created_at: new Date().toISOString() }]
      }));
      const response = await mediaAPI.optimizeForStreaming(itemId);
      if (response?.data?.status === 'instant' || response?.status === 200) {
        // Fast-track: completed instantly, refresh immediately
        await fetchMedia();
        setActiveTasks(prev => { const n = { ...prev }; delete n[itemId]; return n; });
      } else {
        showInfo(t('media.messages.optimize_started', { filename: media.find(m => m.id === itemId)?.filename }));
      }
    } catch (err) {
      setActiveTasks(prev => {
        const n = { ...prev };
        if (n[itemId]) {
          n[itemId] = n[itemId].filter(task => task.id !== `opt-local-${itemId}`);
        }
        return n;
      });
      showError(`${t('media.errors.optimize_failed')}: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleGenerateProxy = async (itemId) => {
    try {
      // Optimistic state: show spinner before next poll cycle
      setActiveTasks(prev => ({
        ...prev,
        [itemId]: [...(prev[itemId] || []), { id: `proxy-local-${itemId}`, task_type: 'proxy', status: 'pending', created_at: new Date().toISOString() }]
      }));
      const response = await mediaAPI.generateProxy(itemId);
      if (response?.data?.instant || response?.data?.status === 'instant') {
        // Hard-link / zero-byte — completed instantly, no background task
        await fetchMedia();
        setActiveTasks(prev => { const n = { ...prev }; delete n[itemId]; return n; });
      } else {
        showInfo(t('media.messages.proxy_started', { filename: media.find(m => m.id === itemId)?.filename }));
      }
    } catch (err) {
      setActiveTasks(prev => {
        const n = { ...prev };
        if (n[itemId]) {
          n[itemId] = n[itemId].filter(task => task.id !== `proxy-local-${itemId}`);
        }
        return n;
      });
      showError(`${t('media.errors.proxy_failed')}: ${err.response?.data?.error || err.message}`);
    }
  };

  // --- Virtualization Logic for ALPHA VM Optimization ---
  // Final positioning to ensure ALL handlers and state variables (formatDuration, handlePreload, t, etc.) are fully initialized.
  const COLUMN_COUNT = 3; 
  const ROW_HEIGHT = 280; 

  const chunkedMedia = useMemo(() => {
    const chunks = [];
    if (!media) return chunks;
    for (let i = 0; i < media.length; i += COLUMN_COUNT) {
      chunks.push(media.slice(i, i + COLUMN_COUNT));
    }
    return chunks;
  }, [media]);

  const Row = useCallback(({ index, style }) => {
    const rowItems = chunkedMedia[index];
    if (!rowItems) return null;
    
    return (
      <div style={{ ...style, padding: '0 12px' }}>
        <Grid container spacing={1.5}>
          {rowItems.map(item => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <MediaCard 
                item={item}
                t={t}
                selectionMode={selectionMode}
                selectedItemIds={selectedItemIds}
                toggleItemSelection={toggleItemSelection}
                formatDuration={formatDuration}
                handlePreload={handlePreload}
                setSelectedMedia={setSelectedMedia}
                setVideoLoading={setVideoLoading}
                setPreviewOpen={setPreviewOpen}
                activeTasks={activeTasks}
                handleOptimize={handleOptimize}
                handleGenerateProxy={handleGenerateProxy}
                handleFetchMetadata={handleFetchMetadata}
                handleEditMetadata={handleEditMetadata}
                checkingDelete={checkingDelete}
                handleSmartDelete={handleSmartDelete}
                setMedia={setMedia}
                fetchMedia={fetchMedia}
              />
            </Grid>
          ))}
        </Grid>
      </div>
    );
  }, [chunkedMedia, t, selectionMode, selectedItemIds, toggleItemSelection, formatDuration, handlePreload, setSelectedMedia, setVideoLoading, setPreviewOpen, activeTasks, handleOptimize, handleGenerateProxy, handleFetchMetadata, handleEditMetadata, checkingDelete, handleSmartDelete, setMedia, fetchMedia]);

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Background Glow */}
      <Box sx={{
        position: 'fixed',
        top: '20%',
        left: '10%',
        width: '500px',
        height: '500px',
        bgcolor: 'secondary.main',
        filter: 'blur(180px)',
        opacity: 0.08,
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <Box>
          <Typography variant="h4" className="neon-text" sx={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.8rem' }}>{t('media.title')}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>
            {t('media.subtitle')}
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Chip
            label={`${pagination.total} ${t('media.files') || 'Ficheiros'}`}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              color: 'primary.main',
              fontWeight: 800,
              border: '1px solid rgba(0, 229, 255, 0.2)'
            }}
          />
          <Button
            variant="outlined"
            color="primary"
            startIcon={syncing ? <CircularProgress size={18} /> : <SyncIcon />}
            onClick={handleSyncMedia}
            disabled={syncing}
            sx={{ fontWeight: 800, border: '1px solid rgba(0, 229, 255, 0.3)' }}
          >
            {syncing ? t('media.syncing') : t('media.sync')}
          </Button>
          {activeChannelId && (
            <Tooltip title="Scan the channel watchfolder directory and ingest new video files">
              <Button
                variant="outlined"
                color="success"
                startIcon={syncingWatchfolder ? <CircularProgress size={18} /> : <FolderOpenIcon />}
                onClick={handleSyncWatchfolder}
                disabled={syncingWatchfolder}
                sx={{ fontWeight: 800, border: '1px solid rgba(76, 175, 80, 0.35)' }}
              >
                {syncingWatchfolder ? t('media.syncing_watchfolder') : t('media.sync_watchfolder')}
              </Button>
            </Tooltip>
          )}
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<AnalyticsIcon />}
            onClick={handleOpenAudit}
            sx={{ fontWeight: 800, border: '1px solid rgba(156, 39, 176, 0.3)' }}
          >
            {t('media.audit')}
          </Button>
          <Button
            variant="outlined"
            onClick={() => { setSelectionMode(!selectionMode); setSelectedItemIds([]); }}
            sx={{ fontWeight: 800, border: '1px solid rgba(255,255,255,0.1)', color: selectionMode ? 'primary.main' : 'text.secondary' }}
          >
            {selectionMode ? t('media.cancel_selection') : t('media.bulk_select')}
          </Button>
          <Button
            variant="contained"
            startIcon={<NewFolderIcon />}
            onClick={() => setNewFolderOpen(true)}
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(45deg, #00e5ff 30%, #00b2cc 90%)',
              color: '#0a0b10'
            }}
          >
            {t('media.new_folder')}
          </Button>
        </Stack>
      </Box>

      {
        selectionMode && (
          <Paper className="glass-panel" sx={{ mb: 3, p: 2, bgcolor: 'rgba(0, 229, 255, 0.1)', border: '1px solid rgba(0, 229, 255, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{t('media.items_selected', { count: selectedItemIds.length })}</Typography>
              <Button size="small" onClick={handleSelectAllInView}>{t('media.select_all')}</Button>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                size="small"
                color="primary"
                disabled={performingBulkAction || selectedItemIds.length === 0}
                onClick={() => handleBulkSetFiller(true)}
              >
                {t('media.mark_filler')}
              </Button>
              <Button
                variant="outlined"
                size="small"
                sx={{ color: 'text.secondary' }}
                disabled={performingBulkAction || selectedItemIds.length === 0}
                onClick={() => handleBulkSetFiller(false)}
              >
                {t('media.mark_prog')}
              </Button>
            </Stack>
          </Paper>
        )
      }

      <Grid container spacing={2}>
        {/* Sidebar Folders */}
        <Grid item xs={12} md={3} sx={{ position: 'relative', zIndex: 1 }}>
          <Paper className="glass-panel" sx={{ p: 1.5, height: '100%', minHeight: '60vh', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="overline" sx={{ color: 'text.disabled', fontWeight: 900, mb: 1, display: 'block', letterSpacing: 2 }}>
              {t('media.structure')}
            </Typography>
            <List sx={{ p: 0 }}>
              <ListItemButton
                selected={!currentFolder}
                onClick={() => handleFolderSelect(null)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  py: 1,
                  '&.Mui-selected': { bgcolor: 'rgba(0, 229, 255, 0.1)', color: 'primary.main' }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}><FolderIcon sx={{ fontSize: 20 }} /></ListItemIcon>
                <ListItemText primary={t('media.root')} primaryTypographyProps={{ fontWeight: 700, fontSize: '0.85rem' }} />
              </ListItemButton>
              {folders.map(f => (
                <ListItem
                  key={f.id}
                  disablePadding
                  secondaryAction={
                    <IconButton edge="end" size="small" color="error" onClick={() => handleDeleteFolder(f.id, f.name)} sx={{ opacity: 0.4, '&:hover': { opacity: 1 } }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemButton
                    selected={currentFolder?.id === f.id}
                    onClick={() => setCurrentFolder(f)}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      '&.Mui-selected': { bgcolor: 'rgba(0, 229, 255, 0.1)', color: 'primary.main' }
                    }}
                  >
                    <ListItemIcon><FolderIcon sx={{ color: currentFolder?.id === f.id ? "primary.main" : "text.disabled" }} /></ListItemIcon>
                    <ListItemText primary={f.name} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.85rem' }} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>

            <Box sx={{ mt: 'auto', p: 2, borderRadius: 3, bgcolor: 'rgba(255, 255, 255, 0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <InfoIcon sx={{ fontSize: 14 }} /> {t('media.hint_title')}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.4, display: 'block' }}>
                {t('media.hint_msg')}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Media Content */}
        <Grid item xs={12} md={9}>
          {/* Breadcrumbs */}
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Breadcrumbs separator={<NextIcon sx={{ fontSize: 14, color: 'text.disabled' }} />}>
              <Link
                color="inherit"
                sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'text.secondary', '&:hover': { color: 'primary.main' }, textDecoration: 'none' }}
                onClick={() => setCurrentFolder(null)}
              >
                <FolderIcon sx={{ mr: 0.8, fontSize: 16 }} /> <Typography variant="caption" sx={{ fontWeight: 700 }}>MEDIA</Typography>
              </Link>
              {currentFolder && (
                <Typography color="primary.main" variant="caption" sx={{ display: 'flex', alignItems: 'center', fontWeight: 800 }}>
                  <FolderOpenIcon sx={{ mr: 0.8, fontSize: 16 }} /> {currentFolder.name.toUpperCase()}
                </Typography>
              )}
            </Breadcrumbs>
          </Box>

          {/* Upload Area */}
          <Paper
            className="glass-panel"
            sx={{
              mb: 2,
              p: 2,
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'rgba(255, 255, 255, 0.1)',
              bgcolor: isDragActive ? 'rgba(0, 229, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
              transition: 'all 0.3s ease',
              '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(0, 229, 255, 0.03)' }
            }}
          >
            <Box sx={{
              height: 120,
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'rgba(255,255,255,0.1)',
              borderRadius: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: isDragActive ? 'rgba(0, 229, 255, 0.05)' : 'rgba(255,255,255,0.02)',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              mb: 3,
              '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(0, 229, 255, 0.02)' }
            }}>
              <input {...getInputProps()} />
              <UploadIcon sx={{ fontSize: 32, color: isDragActive ? 'primary.main' : 'text.disabled', mb: 1 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDragActive ? 'primary.main' : 'text.primary' }}>
                {isDragActive ? t('media.drop_to_upload') : t('media.upload_media')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('media.upload_hint', { folder: currentFolder?.name || t('media.root') })}
              </Typography>
            </Box>
          </Paper>

          {/* Filters */}
          <Paper className="glass-panel" sx={{ mb: 2, p: 1.5, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  placeholder={t('media.search_placeholder')}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: 3,
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('media.type')}</InputLabel>
                  <Select
                    value={filters.media_type || 'all'}
                    label={t('media.type')}
                    onChange={(e) => setFilters(prev => ({ ...prev, media_type: e.target.value === 'all' ? '' : e.target.value, page: 1 }))}
                    sx={{ borderRadius: 3, bgcolor: 'rgba(255, 255, 255, 0.03)' }}
                  >
                    <MenuItem value="all">{t('media.all')}</MenuItem>
                    <MenuItem value="video">{t('media.video')}</MenuItem>
                    <MenuItem value="image">{t('media.image')}</MenuItem>
                    <MenuItem value="audio">{t('media.audio')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('media.category')}</InputLabel>
                  <Select
                    value={filters.is_filler === undefined ? 'all' : (filters.is_filler ? 'filler' : 'prog')}
                    label={t('media.category')}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFilters(prev => ({
                        ...prev,
                        is_filler: val === 'all' ? undefined : (val === 'filler'),
                        page: 1
                      }));
                    }}
                    sx={{ borderRadius: 3, bgcolor: 'rgba(255, 255, 255, 0.03)' }}
                  >
                    <MenuItem value="all">{t('media.both')}</MenuItem>
                    <MenuItem value="filler">{t('media.fillers_general')}</MenuItem>
                    <MenuItem value="prog">{t('media.programming')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {/* Virtualized Media List */}
          <Box sx={{ height: '70vh', width: '100%', mt: 1 }}>
            {media.length > 0 ? (
              <ListWindow
                height={600} // Approximate height of the viewport
                itemCount={chunkedMedia.length}
                itemSize={ROW_HEIGHT}
                width="100%"
              >
                {Row}
              </ListWindow>
            ) : (
              <Box sx={{ py: 10, textAlign: 'center', opacity: 0.5 }}>
                <Typography variant="h6">{t('media.empty_folder') || 'Pasta vazia'}</Typography>
              </Box>
            )}
          </Box>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button disabled={filters.page === 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>{t('common.previous')}</Button>
              <Typography sx={{ alignSelf: 'center' }}>{filters.page} / {pagination.pages}</Typography>
              <Button disabled={filters.page === pagination.pages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>{t('common.next')}</Button>
            </Box>
          )}
        </Grid>
      </Grid >

      {/* New Folder Dialog */}
      < Dialog open={newFolderOpen} onClose={() => setNewFolderOpen(false)
      }>
        <DialogTitle>Nova Pasta</DialogTitle>
        <DialogContent>
          <TextField fullWidth autoFocus label="Nome da Pasta" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewFolderOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateFolder}>Criar</Button>
        </DialogActions>
      </Dialog >

      {/* Smart Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, media: null, usage: null, simpleDelete: false })}>
        <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon /> {t('media.delete_confirm_title')}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ fontWeight: 700, mb: 1 }}>
            {t('media.delete_confirm_msg', { filename: deleteDialog.media?.filename })}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('media.delete_permanent_alert')}
          </Typography>

          {deleteDialog.usage && deleteDialog.usage.length > 0 && (
            <Alert severity="error" variant="filled" sx={{ borderRadius: 3, mb: 2, '& .MuiAlert-icon': { fontSize: 32 } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{t('media.delete_in_use_title')}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {t('media.delete_in_use_alert', { count: deleteDialog.usage.length, filename: deleteDialog.media?.filename })}
              </Typography>
            </Alert>
          )}

          {deleteDialog.usage && deleteDialog.usage.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.disabled' }}>
                {t('media.delete_choose_option')}
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  mt: 1, p: 1.5, cursor: 'pointer', borderRadius: 2,
                  '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.05)', borderColor: 'error.main' }
                }}
                onClick={handleForceDelete}
              >
                <Typography variant="subtitle2" color="error" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon fontSize="small" /> {t('media.delete_anyway')}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                  {t('media.delete_anyway_hint')}
                </Typography>
              </Paper>

              <Paper
                className="pulse-success-border"
                variant="outlined"
                sx={{
                  mt: 2, p: 1.5, cursor: 'pointer', borderRadius: 2,
                  bgcolor: 'rgba(76, 175, 80, 0.05)', borderColor: 'success.main'
                }}
                onClick={handleReplaceAndDelete}
              >
                <Typography variant="subtitle2" color="success.main" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon fontSize="small" /> {t('media.delete_replace_filler')}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                  {t('media.delete_replace_filler_hint')}
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, media: null, usage: null, simpleDelete: false })}>
            {t('common.cancel')}
          </Button>
          {deleteDialog.simpleDelete && (
            <Button variant="contained" color="error" onClick={handleForceDelete}>
              {t('common.delete')}
            </Button>
          )}
        </DialogActions>
      </Dialog >

      {/* Move/Copy Media Dialog */}
      <Dialog open={moveOpen} onClose={() => setMoveOpen(false)} maxWidth="xs" fullWidth >
        <DialogTitle>{t('media.move_title', { filename: mediaToMove?.filename })}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>{t('media.move_dest')}</Typography>
          <List>
            <ListItemButton onClick={() => handleMoveMedia(null)}>
              <ListItemIcon><FolderIcon color="primary" /></ListItemIcon>
              <ListItemText primary={t('media.move_to_root')} />
            </ListItemButton>
            {folders.map(f => (
              <ListItemButton key={f.id} onClick={() => handleMoveMedia(f.id)}>
                <ListItemIcon><FolderIcon /></ListItemIcon>
                <ListItemText primary={t('media.move_to_folder', { name: f.name })} />
              </ListItemButton>
            ))}
            <Divider sx={{ my: 1 }} />
            <ListItemButton onClick={() => handleCopyMedia(null)}>
              <ListItemIcon><FolderIcon color="secondary" /></ListItemIcon>
              <ListItemText primary={t('media.copy_to_root')} secondary={t('media.copy_hint')} />
            </ListItemButton>
            {folders.map(f => (
              <ListItemButton key={`copy-${f.id}`} onClick={() => handleCopyMedia(f.id)}>
                <ListItemIcon><FolderIcon color="secondary" /></ListItemIcon>
                <ListItemText primary={t('media.copy_to_folder', { name: f.name })} secondary={t('media.copy_hint')} />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
        <DialogActions><Button onClick={() => setMoveOpen(false)}>{t('common.cancel')}</Button></DialogActions>
      </Dialog >

      {/* Metadata Editor Dialog */}
      <Dialog open={metadataOpen} onClose={() => { setMetadataOpen(false); setIsReviewMode(false); }} maxWidth="md" fullWidth >
        <DialogTitle sx={{ bgcolor: isReviewMode ? 'secondary.main' : 'primary.main', color: 'white' }}>
          {isReviewMode ? t('media.metadata.review_title') : t('media.metadata.edit_title')}: {editingMedia?.filename}
        </DialogTitle>
        <DialogContent dividers>
          {(isReviewMode || editingMedia?.metadata?.source_service) && (
            <Alert severity="secondary" sx={{ mb: 2, border: '1px solid', borderColor: 'secondary.main', bgcolor: 'rgba(156, 39, 176, 0.02)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <WizardIcon fontSize="small" color="secondary" />
                <Typography variant="body2">
                  {t('media.metadata.info_from')} <strong>{isReviewMode ? metadataSource?.service : (editingMedia?.metadata?.source_service || 'API Automática')}</strong>
                </Typography>
              </Box>
              {(isReviewMode ? metadataSource?.url : editingMedia?.metadata?.source_url) && (
                <Link href={isReviewMode ? metadataSource?.url : editingMedia?.metadata?.source_url} target="_blank" variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {t('media.metadata.view_source', { service: isReviewMode ? metadataSource?.service : (editingMedia?.metadata?.source_service || 'API') })}
                </Link>
              )}
            </Alert>
          )}
          {isReviewMode && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {t('media.metadata.review_alert')}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t('media.metadata.label_title')}
              fullWidth
              value={metadataForm.title}
              onChange={e => setMetadataForm({ ...metadataForm, title: e.target.value })}
              placeholder={editingMedia?.filename}
              helperText={t('media.metadata.help_title')}
              sx={{ bgcolor: isReviewMode && metadataForm.title ? 'rgba(76, 175, 80, 0.05)' : 'inherit' }}
            />
            <TextField
              label={t('media.metadata.label_description')}
              fullWidth
              multiline
              rows={3}
              value={metadataForm.description}
              onChange={e => setMetadataForm({ ...metadataForm, description: e.target.value })}
              sx={{ bgcolor: isReviewMode && metadataForm.description ? 'rgba(76, 175, 80, 0.05)' : 'inherit' }}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                select
                label={t('media.metadata.label_genre')}
                fullWidth
                value={metadataForm.genre}
                onChange={e => setMetadataForm({ ...metadataForm, genre: e.target.value })}
              >
                <MenuItem value="">{t('media.metadata.genre_none')}</MenuItem>
                <MenuItem value="Comedy">{t('media.metadata.genre_comedy')}</MenuItem>
                <MenuItem value="Drama">{t('media.metadata.genre_drama')}</MenuItem>
                <MenuItem value="News">{t('media.metadata.genre_news')}</MenuItem>
                <MenuItem value="Sports">{t('media.metadata.genre_sports')}</MenuItem>
                <MenuItem value="Documentary">{t('media.metadata.genre_documentary')}</MenuItem>
                <MenuItem value="Action">{t('media.metadata.genre_action')}</MenuItem>
                <MenuItem value="Animation">{t('media.metadata.genre_animation')}</MenuItem>
                <MenuItem value="Music">{t('media.metadata.genre_music')}</MenuItem>
                <MenuItem value="Other">{t('media.metadata.genre_other')}</MenuItem>
              </TextField>
              <TextField
                select
                label={t('media.metadata.label_rating')}
                fullWidth
                value={metadataForm.rating}
                onChange={e => setMetadataForm({ ...metadataForm, rating: e.target.value })}
              >
                <MenuItem value="">{t('media.metadata.rating_none')}</MenuItem>
                <MenuItem value="General">{t('media.metadata.rating_general')}</MenuItem>
                <MenuItem value="10">10 anos</MenuItem>
                <MenuItem value="12">12 anos</MenuItem>
                <MenuItem value="14">14 anos</MenuItem>
                <MenuItem value="16">16 anos</MenuItem>
                <MenuItem value="18">18 anos</MenuItem>
              </TextField>
            </Stack>
            <TextField
              label={t('media.metadata.label_keywords')}
              fullWidth
              value={metadataForm.keywords}
              onChange={e => setMetadataForm({ ...metadataForm, keywords: e.target.value })}
              placeholder={t('media.metadata.keywords_placeholder')}
              helperText={t('media.metadata.help_keywords')}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label={t('media.metadata.label_season')}
                fullWidth
                value={metadataForm.season}
                onChange={e => setMetadataForm({ ...metadataForm, season: e.target.value })}
              />
              <TextField
                label={t('media.metadata.label_episode')}
                fullWidth
                value={metadataForm.episode}
                onChange={e => setMetadataForm({ ...metadataForm, episode: e.target.value })}
              />
            </Stack>
            <TextField
              label={t('media.metadata.label_cast')}
              fullWidth
              value={metadataForm.cast}
              onChange={e => setMetadataForm({ ...metadataForm, cast: e.target.value })}
              placeholder="Nome1, Nome2, Nome3"
              helperText={t('common.separate_by_comma') || 'Separados por vírgula'}
            />
            <TextField
              label={t('media.metadata.label_director')}
              fullWidth
              value={metadataForm.director}
              onChange={e => setMetadataForm({ ...metadataForm, director: e.target.value })}
            />
            <TextField
              label={t('media.metadata.label_writer')}
              fullWidth
              value={metadataForm.writer}
              onChange={e => setMetadataForm({ ...metadataForm, writer: e.target.value })}
            />
            <Divider><Chip label={t('media.metadata.technical_data')} size="small" /></Divider>
            <Stack direction="row" spacing={2}>
              <TextField
                label={t('media.metadata.label_resolution')}
                fullWidth
                value={metadataForm.resolution}
                onChange={e => setMetadataForm({ ...metadataForm, resolution: e.target.value })}
                placeholder="1920x1080"
                helperText={t('media.metadata.help_resolution')}
              />
              <TextField
                label={t('media.metadata.label_fps')}
                fullWidth
                value={metadataForm.fps}
                onChange={e => setMetadataForm({ ...metadataForm, fps: e.target.value })}
                placeholder="25, 30, 60"
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label={t('media.metadata.label_vcodec')}
                fullWidth
                value={metadataForm.videoCodec}
                onChange={e => setMetadataForm({ ...metadataForm, videoCodec: e.target.value })}
                placeholder="h264, h265, vp9"
              />
              <TextField
                label={t('media.metadata.label_acodec')}
                fullWidth
                value={metadataForm.audioCodec}
                onChange={e => setMetadataForm({ ...metadataForm, audioCodec: e.target.value })}
                placeholder="aac, mp3, opus"
              />
            </Stack>
            <TextField
              label={t('media.metadata.label_poster')}
              fullWidth
              value={metadataForm.poster_url || ''}
              onChange={e => setMetadataForm({ ...metadataForm, poster_url: e.target.value })}
              placeholder="https://image.tmdb.org/..."
              helperText={t('media.metadata.help_poster')}
              sx={{ bgcolor: isReviewMode && metadataForm.poster_url ? 'rgba(76, 175, 80, 0.05)' : 'inherit' }}
            />
            <TextField
              label={t('media.metadata.label_subtitles')}
              fullWidth
              value={metadataForm.subtitles}
              onChange={e => setMetadataForm({ ...metadataForm, subtitles: e.target.value })}
              placeholder="PT, EN, ES"
              helperText={t('media.metadata.help_subtitles')}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMetadataOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSaveMetadata}>{t('common.save')}</Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.dark', color: '#fff' }}>Preview: {selectedMedia?.filename}</DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          {selectedMedia?.media_type === 'video' && (
            <Box sx={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
              {videoLoading && (
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10
                }}>
                  <CircularProgress size={60} thickness={4} />
                </Box>
              )}
              <video
                controls
                autoPlay
                preload="metadata"
                poster={`/api/media/${selectedMedia.id}/thumbnail`}
                style={{ maxWidth: '100%', maxHeight: '70vh' }}
                src={selectedMedia.has_proxy ? `/api/media/${selectedMedia.id}/stream?proxy=true` : `/api/media/${selectedMedia.id}/stream`}
                onLoadedData={() => setVideoLoading(false)}
                onCanPlay={() => setVideoLoading(false)}
                onWaiting={() => setVideoLoading(true)}
                onPlaying={() => setVideoLoading(false)}
                onError={() => setVideoLoading(false)}
              >
                <source src={selectedMedia.has_proxy ? `/api/media/${selectedMedia.id}/stream?proxy=true` : `/api/media/${selectedMedia.id}/stream`} type="video/mp4" />
                O seu navegador não suporta o elemento de vídeo.
              </video>
            </Box>
          )}
          {selectedMedia?.media_type === 'image' && <img alt="preview" style={{ maxWidth: '100%', maxHeight: '70vh' }} src={`/api/media/${selectedMedia.id}/stream`} />}
          {selectedMedia?.media_type === 'audio' && <Box sx={{ p: 4 }}><audio controls preload="metadata" src={`/api/media/${selectedMedia.id}/stream`} /></Box>}
        </DialogContent>
        <DialogActions><Button onClick={() => setPreviewOpen(false)}>{t('common.close')}</Button></DialogActions>
      </Dialog>
      {/* Multi-file Upload Progress Dialog */}
      <Dialog open={uploadProgressOpen} onClose={() => {
        // Only allow closing if all finished
        if (uploadFiles.every(f => f.status === 'success' || f.status === 'error')) {
          setUploadProgressOpen(false);
        }
      }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UploadIcon color="primary" /> Gestor de Uploads
        </DialogTitle>
        <DialogContent dividers>
          <List>
            {uploadFiles.map((uf) => (
              <ListItem key={uf.id} sx={{ px: 0, flexDirection: 'column', alignItems: 'stretch' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: uf.status === 'uploading' ? 'bold' : 'normal', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {uf.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {uf.status === 'pending' && (
                      <IconButton size="small" onClick={() => handleCancelUpload(uf.id)} color="warning">
                        <DeleteIcon fontSize="inherit" />
                      </IconButton>
                    )}
                    {uf.status === 'uploading' && (
                      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                        <CircularProgress size={16} />
                        <IconButton size="small" onClick={() => handleCancelUpload(uf.id)} color="error" sx={{ position: 'absolute', top: -10, right: -10 }}>
                          <DeleteIcon sx={{ fontSize: 10 }} />
                        </IconButton>
                      </Box>
                    )}
                    {uf.status === 'success' && <CheckCircleIcon fontSize="small" color="success" />}
                    {uf.status === 'error' && <ErrorIcon fontSize="small" color="error" />}
                    <Typography variant="caption" color={uf.status === 'error' ? 'error' : 'text.secondary'} sx={{ fontWeight: 800 }}>
                      {uf.status === 'pending' ? t('media.uploads_manager.status_pending') : uf.status === 'uploading' ? t('media.uploads_manager.status_uploading') : uf.status === 'success' ? t('media.uploads_manager.status_completed') : (uf.error || t('common.error'))}
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={uf.progress}
                  color={uf.status === 'error' ? 'error' : (uf.status === 'success' ? 'success' : 'primary')}
                  sx={{ height: 6, borderRadius: 3, mb: 1, '& .MuiLinearProgress-bar': { transition: 'transform 0.2s ease-linear' } }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.disabled', display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
                    <FolderIcon sx={{ fontSize: 12 }} /> {uf.destination.toUpperCase()}
                  </Typography>
                  <Box sx={{ textAlign: 'right' }}>
                    {uf.status === 'uploading' && uf.loaded && uf.total && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '10px', fontWeight: 700 }}>
                        {formatBytes(uf.loaded)} / {formatBytes(uf.total)}
                      </Typography>
                    )}
                    <Typography variant="caption" color="primary.main" sx={{ fontWeight: 900 }}>
                      {uf.progress}%
                    </Typography>
                  </Box>
                </Box>

              </ListItem>
            ))}
          </List>
          {uploadFiles.every(f => f.status === 'success' || f.status === 'error') && (
            <Alert severity="success" sx={{ mt: 2 }} icon={<CheckCircleIcon />}>
              {t('media.uploads_manager.all_processed')}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
          <Button
            size="small"
            color="error"
            startIcon={<ErrorIcon />}
            onClick={handleCancelAllUploads}
            disabled={!uploadFiles.some(f => f.status === 'uploading' || f.status === 'pending')}
          >
            {t('media.uploads_manager.cancel_all')}
          </Button>
          <Button
            variant="contained"
            disabled={uploadFiles.some(f => f.status === 'uploading' || f.status === 'pending')}
            onClick={() => setUploadProgressOpen(false)}
            sx={{ fontWeight: 800 }}
          >
            {t('media.uploads_manager.close_window')}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Audit Proxies Dialog */}
      <Dialog open={auditDialog.open} onClose={() => setAuditDialog({ open: false, data: null, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'secondary.main' }}>
          <AnalyticsIcon /> {t('media.audit_dialog.title')}
        </DialogTitle>
        <DialogContent dividers>
          {auditDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress color="secondary" /></Box>
          ) : auditDialog.data ? (
            <Box>
              {auditDialog.data.missing_count === 0 ? (
                <Alert severity="success" variant="outlined" sx={{ borderRadius: 3 }}>
                  {t('media.audit_dialog.optimized')}
                </Alert>
              ) : (
                <Box>
                  <Alert severity="warning" variant="outlined" sx={{ mb: 3, borderRadius: 3 }}>
                    <span dangerouslySetInnerHTML={{ __html: t('media.audit_dialog.missing_alert', { count: auditDialog.data.missing_count }) }} />
                  </Alert>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderColor: 'rgba(255,255,255,0.1)' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>{t('media.audit_dialog.videos_no_proxy')}</Typography>
                        <Typography variant="h4" color="warning.main" sx={{ fontWeight: 900 }}>{auditDialog.data.missing_count}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderColor: 'rgba(255,255,255,0.1)' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>{t('media.audit_dialog.estimated_space')}</Typography>
                        <Typography variant="h4" color="secondary.main" sx={{ fontWeight: 900 }}>~{auditDialog.data.estimated_space_mb.toFixed(0)} MB</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          ) : <Typography>Erro ao carregar auditoria.</Typography>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 2, justifyContent: 'space-between' }}>
          <Button onClick={() => setAuditDialog({ open: false, data: null, loading: false })}>{t('common.close')}</Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<BoltIcon />}
            disabled={auditDialog.loading || !auditDialog.data || auditDialog.data.missing_count === 0 || performingBulkAction}
            onClick={handleAuditActionAll}
          >
            {t('media.audit_dialog.batch_generate', { count: auditDialog.data?.missing_count || 0 })}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
