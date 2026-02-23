import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  CircularProgress
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
import { mediaAPI } from '../services/api';

export default function MediaLibrary() {
  const { showSuccess, showError, showWarning, showInfo } = useNotification();
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

  // Auditing States
  const [auditDialog, setAuditDialog] = useState({ open: false, data: null, loading: false });

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        folder_id: currentFolder?.id || 'root'
      };
      const res = await mediaAPI.list(params);
      setMedia(res.data.media);
      setPagination({ total: res.data.total, pages: res.data.pages });
    } catch (error) {
      showError('Erro ao carregar ficheiros');
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
        showSuccess(`Sincronização concluída: ${res.data.added} novos ficheiros identificados.`);
      } else {
        showSuccess(`Sincronização parcial: ${res.data.added} adicionados, ${res.data.errors} erros.`);
      }
      fetchMedia();
    } catch (err) {
      showError('Erro ao sincronizar ficheiros do disco');
      console.error(err);
    } finally {
      setSyncing(false);
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
  }, [filters, currentFolder]);

  // Polling for active tasks
  useEffect(() => {
    if (media.length === 0) return;

    const pollTasks = async () => {
      const mediaWithPossibleTasks = media.filter(m => m.media_type === 'video');
      if (mediaWithPossibleTasks.length === 0) return;

      const updatedTasks = {};
      const justFinished = [];
      const prevIds = Object.keys(activeTasks);

      for (const item of mediaWithPossibleTasks) {
        try {
          const response = await mediaAPI.getMediaTasks(item.id);
          const tasks = response.data;

          // Filter active and recently failed tasks (keep failed for 2 min for UI feedback)
          const activeOrFailed = tasks.filter(t =>
            t.status === 'pending' ||
            t.status === 'processing' ||
            (t.status === 'failed' && (new Date() - new Date(t.created_at)) < 120000)
          );

          // Notify user about newly-failed tasks
          const failedTasks = activeOrFailed.filter(t => t.status === 'failed');
          const existingFailed = (activeTasks[item.id] || []).filter(t => t.status === 'failed');
          for (const ft of failedTasks) {
            if (!existingFailed.some(e => e.id === ft.id)) {
              showError(`Erro ao processar "${item.filename}": ${ft.error_message || ft.task_type}`);
            }
          }

          if (activeOrFailed.length > 0) {
            updatedTasks[item.id] = activeOrFailed;
          }
        } catch (error) {
          console.error(`Failed to fetch tasks for ${item.id}:`, error);
        }
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
      showSuccess('Pasta criada');
      setNewFolderName('');
      setNewFolderOpen(false);
      fetchFolders();
    } catch (error) {
      showError('Erro ao criar pasta');
    }
  };

  const handleDeleteFolder = async (id, name) => {
    if (window.confirm(`Tem a certeza que deseja eliminar a pasta "${name}" e todos os ficheiros dentro dela?`)) {
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
      showSuccess('Ficheiro movido');
      setMoveOpen(false);
      fetchMedia();
    } catch (error) {
      showError('Erro ao mover ficheiro');
    }
  };

  const handleCopyMedia = async (targetFolderId) => {
    try {
      await mediaAPI.copyMedia(mediaToMove.id, targetFolderId);
      showSuccess('Ficheiro copiado');
      setMoveOpen(false);
      fetchMedia();
    } catch (error) {
      showError('Erro ao copiar ficheiro');
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
      showSuccess('Metadados atualizados');
      setMetadataOpen(false);
      setIsReviewMode(false);
      fetchMedia();
    } catch (error) {
      showError('Erro ao atualizar metadados');
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
      showSuccess(`Metadados encontrados. Por favor, revise e salve.`);
    } catch (error) {
      showError('Falha ao buscar metadados: ' + (error.response?.data?.error || error.message));
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
      showSuccess('Ficheiro eliminado');
      setDeleteDialog({ open: false, media: null, usage: null, simpleDelete: false });
      fetchMedia();
    } catch (error) {
      showError('Erro ao eliminar: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleReplaceAndDelete = async () => {
    try {
      // First replace with filler
      const replaceRes = await mediaAPI.replaceWithFiller(deleteDialog.media.id);
      showInfo(`Substituído por: ${replaceRes.data.filler_used}`);

      // Then delete
      await mediaAPI.delete(deleteDialog.media.id);
      showSuccess('Ficheiro substituído e eliminado');
      setDeleteDialog({ open: false, media: null, usage: null });
      fetchMedia();
    } catch (error) {
      showError('Erro: ' + (error.response?.data?.error || error.message));
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
      destination: currentFolder?.name || 'Raiz'
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

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
        ? { ...f, status: 'error', error: 'Cancelado' }
        : f
    ));
    showInfo('Todos os carregamentos cancelados');
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
      showInfo(`Adicionando ${auditDialog.data.missing_ids.length} ficheiros à fila de proxies...`);
      await mediaAPI.batchProxy(auditDialog.data.missing_ids);
      showSuccess('Ficheiros adicionados à fila de proxies com sucesso!');
      setTimeout(() => fetchMedia(), 1000);
    } catch (e) {
      showError('Erro ao iniciar proxies em massa.');
    } finally {
      setPerformingBulkAction(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  // Preload video headers on hover to speed up playback start
  const handlePreload = (item) => {
    if (item.media_type === 'video') {
      const url = `/api/media/${item.id}/stream`;
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
      showInfo(`Adicionando ${selectedItemIds.length} ficheiros à fila de proxies...`);
      await mediaAPI.batchProxy(selectedItemIds);
      showSuccess('Ficheiros adicionados à fila com sucesso!');
      setSelectedItemIds([]);
      setSelectionMode(false);
      // Wait a moment before fetching to let tasks register
      setTimeout(() => fetchMedia(), 1000);
    } catch (error) {
      showError('Erro ao iniciar batch proxy: ' + (error.response?.data?.error || error.message));
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
          <Typography variant="h4" className="neon-text" sx={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.8rem' }}>Media Library</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>
            Gestão Inteligente de Conteúdo
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Chip
            label={`${pagination.total} Ficheiros`}
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
            {syncing ? 'SINCRONIZANDO...' : 'SINCRONIZAR'}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<AnalyticsIcon />}
            onClick={handleOpenAudit}
            sx={{ fontWeight: 800, border: '1px solid rgba(156, 39, 176, 0.3)' }}
          >
            AUDITORIA
          </Button>
          <Button
            variant="outlined"
            onClick={() => { setSelectionMode(!selectionMode); setSelectedItemIds([]); }}
            sx={{ fontWeight: 800, border: '1px solid rgba(255,255,255,0.1)', color: selectionMode ? 'primary.main' : 'text.secondary' }}
          >
            {selectionMode ? 'Cancelar Seleção' : 'Seleção Múltipla'}
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
            Nova Pasta
          </Button>
        </Stack>
      </Box>

      {
        selectionMode && (
          <Paper className="glass-panel" sx={{ mb: 3, p: 2, bgcolor: 'rgba(0, 229, 255, 0.1)', border: '1px solid rgba(0, 229, 255, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{selectedItemIds.length} selecionados</Typography>
              <Button size="small" onClick={handleSelectAllInView}>Selecionar Todos</Button>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                size="small"
                color="primary"
                disabled={performingBulkAction || selectedItemIds.length === 0}
                onClick={() => handleBulkSetFiller(true)}
              >
                Marcar como Filler
              </Button>
              <Button
                variant="outlined"
                size="small"
                sx={{ color: 'text.secondary' }}
                disabled={performingBulkAction || selectedItemIds.length === 0}
                onClick={() => handleBulkSetFiller(false)}
              >
                Marcar como Prog
              </Button>
            </Stack>
          </Paper>
        )
      }

      <Grid container spacing={2}>
        {/* Sidebar Folders */}
        <Grid item xs={12} md={3} sx={{ position: 'relative', zIndex: 1 }}>
          <Paper className="glass-panel" sx={{ p: 1.5, height: '100%', minHeight: '60vh', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1, letterSpacing: 1, fontSize: '0.65rem' }}>
              <FolderIcon sx={{ fontSize: 18 }} /> ESTRUTURA
            </Typography>
            <List size="small" sx={{ flexGrow: 1 }}>
              <ListItemButton
                selected={currentFolder === null}
                onClick={() => setCurrentFolder(null)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&.Mui-selected': { bgcolor: 'rgba(0, 229, 255, 0.1)', color: 'primary.main' }
                }}
              >
                <ListItemIcon><FolderIcon sx={{ color: currentFolder === null ? "primary.main" : "text.disabled" }} /></ListItemIcon>
                <ListItemText primary="Raiz (Root)" primaryTypographyProps={{ fontWeight: 700, fontSize: '0.85rem' }} />
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

            <Box sx={{ mt: 'auto', p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
              <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, display: 'block', mb: 1 }}>DICA</Typography>
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>
                Arraste ficheiros diretamente para as pastas para organizar a sua biblioteca.
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
            <Box {...getRootProps()} sx={{ textAlign: 'center', cursor: 'pointer' }}>
              <input {...getInputProps()} />
              <UploadIcon className={isDragActive ? "neon-text" : ""} sx={{ fontSize: 48, color: isDragActive ? 'primary.main' : 'rgba(255, 255, 255, 0.2)', mb: 2 }} />
              <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5 }}>
                {isDragActive ? 'SOLTE PARA ENVIAR' : 'UPLOAD DE MEDIA'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {`Arraste ficheiros ou clique para explorar (Destino: ${currentFolder?.name || 'Raiz'})`}
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
                  placeholder="Pesquisar na biblioteca..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'primary.main' }} />,
                    sx: { bgcolor: 'rgba(0, 0, 0, 0.2)', borderRadius: 2 }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={filters.media_type}
                    label="Tipo"
                    onChange={e => setFilters({ ...filters, media_type: e.target.value, page: 1 })}
                    sx={{ bgcolor: 'rgba(0, 0, 0, 0.2)', borderRadius: 2 }}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="video">Vídeo</MenuItem>
                    <MenuItem value="image">Imagem</MenuItem>
                    <MenuItem value="audio">Áudio</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    value={filters.is_filler === undefined ? "" : filters.is_filler}
                    label="Categoria"
                    onChange={e => setFilters({ ...filters, is_filler: e.target.value === "" ? undefined : e.target.value, page: 1 })}
                    sx={{ bgcolor: 'rgba(0, 0, 0, 0.2)', borderRadius: 2 }}
                  >
                    <MenuItem value="">Ambos</MenuItem>
                    <MenuItem value="true">Fillers (Geral)</MenuItem>
                    <MenuItem value="false">Programação</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {/* Media Grid */}
          <Grid container spacing={1.5}>
            {media.map(item => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
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
                      image={item.media_type === 'video' ? `/api/media/${item.id}/thumbnail` : (item.media_type === 'image' ? `/api/media/${item.id}/stream` : 'https://via.placeholder.com/300x140?text=ÁUDIO')}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/300x140?text=Sem+Preview';
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
                        <Tooltip title="Preview">
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
                          <Tooltip title={item.is_optimized ? "Vídeo Otimizado para Streaming" : "Otimizar para Streaming"}>
                            <IconButton
                              size="small"
                              sx={{
                                color: item.is_optimized ? 'success.light' : 'success.main',
                                bgcolor: item.is_optimized ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
                                border: item.is_optimized ? '1px solid rgba(76, 175, 80, 0.4)' : 'none'
                              }}
                              onClick={async () => {
                                try {
                                  // Optimistic state: show spinner immediately without waiting for poll
                                  setActiveTasks(prev => ({
                                    ...prev,
                                    [item.id]: [...(prev[item.id] || []), { id: `opt-local-${item.id}`, task_type: 'optimize', status: 'pending', created_at: new Date().toISOString() }]
                                  }));
                                  const response = await mediaAPI.optimizeForStreaming(item.id);
                                  if (response?.data?.status === 'instant' || response?.status === 200) {
                                    // Fast-track: completed instantly, refresh immediately
                                    await fetchMedia();
                                    setActiveTasks(prev => { const n = { ...prev }; delete n[item.id]; return n; });
                                  } else {
                                    showInfo(`Otimização de "${item.filename}" iniciada em background.`);
                                  }
                                } catch (err) {
                                  setActiveTasks(prev => { const n = { ...prev }; delete n[item.id]?.filter(t => t.id !== `opt-local-${item.id}`); return n; });
                                  showError(`Erro ao optimizar: ${err.response?.data?.error || err.message}`);
                                }
                              }}
                              disabled={item.is_optimized || activeTasks[item.id]?.some(t => t.task_type === 'optimize' && (t.status === 'pending' || t.status === 'processing'))}
                            >
                              {activeTasks[item.id]?.find(t => t.task_type === 'optimize' && t.status === 'failed') ? (
                                <Tooltip title={`Erro: ${activeTasks[item.id]?.find(t => t.task_type === 'optimize' && t.status === 'failed')?.error_message || 'Desconhecido'}`}>
                                  <ErrorIcon fontSize="small" color="error" />
                                </Tooltip>
                              ) : activeTasks[item.id]?.some(t => t.task_type === 'optimize') ? (
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
                          <Tooltip title={item.has_proxy ? "Proxy Web Disponível" : "Gerar Proxy Web (Latência Zero)"}>
                            <IconButton
                              size="small"
                              sx={{
                                color: item.has_proxy ? 'secondary.light' : 'warning.main',
                                bgcolor: item.has_proxy ? 'rgba(156, 39, 176, 0.2)' : 'rgba(255, 152, 0, 0.1)',
                                border: item.has_proxy ? '1px solid rgba(156, 39, 176, 0.4)' : 'none'
                              }}
                              onClick={async () => {
                                try {
                                  // Optimistic state: show spinner before next poll cycle
                                  setActiveTasks(prev => ({
                                    ...prev,
                                    [item.id]: [...(prev[item.id] || []), { id: `proxy-local-${item.id}`, task_type: 'proxy', status: 'pending', created_at: new Date().toISOString() }]
                                  }));
                                  const response = await mediaAPI.generateProxy(item.id);
                                  if (response?.data?.instant || response?.data?.status === 'instant') {
                                    // Hard-link / zero-byte — completed instantly, no background task
                                    await fetchMedia();
                                    setActiveTasks(prev => { const n = { ...prev }; delete n[item.id]; return n; });
                                  } else {
                                    showInfo(`Geração de proxy para "${item.filename}" iniciada em background.`);
                                  }
                                } catch (err) {
                                  setActiveTasks(prev => { const n = { ...prev }; delete n[item.id]; return n; });
                                  showError(`Erro ao iniciar geração de proxy: ${err.response?.data?.error || err.message}`);
                                }
                              }}
                              disabled={item.has_proxy || activeTasks[item.id]?.some(t => t.task_type === 'proxy' && (t.status === 'pending' || t.status === 'processing'))}
                            >
                              {activeTasks[item.id]?.find(t => t.task_type === 'proxy' && t.status === 'failed') ? (
                                <Tooltip title={`Erro: ${activeTasks[item.id]?.find(t => t.task_type === 'proxy' && t.status === 'failed')?.error_message || 'Desconhecido'}`}>
                                  <ErrorIcon fontSize="small" color="error" />
                                </Tooltip>
                              ) : activeTasks[item.id]?.some(t => t.task_type === 'proxy') ? (
                                <CircularProgress key={`proxy-${item.id}`} size={16} color="warning" />
                              ) : item.has_proxy ? (
                                <CheckCircleIcon fontSize="small" />
                              ) : (
                                <BoltIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Assistente de Metadados">
                          <IconButton size="small" sx={{ color: 'secondary.main', bgcolor: 'rgba(156, 39, 176, 0.1)' }} onClick={() => handleFetchMetadata(item)}><WizardIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton size="small" sx={{ color: 'text.secondary', bgcolor: 'rgba(255, 255, 255, 0.05)' }} onClick={() => handleEditMetadata(item)}><EditIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Ficheiro">
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
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button disabled={filters.page === 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Anterior</Button>
              <Typography sx={{ alignSelf: 'center' }}>{filters.page} / {pagination.pages}</Typography>
              <Button disabled={filters.page === pagination.pages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Próxima</Button>
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
      < Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, media: null, usage: null, simpleDelete: false })} maxWidth="sm" fullWidth >
        <DialogTitle sx={{ color: deleteDialog.simpleDelete ? 'error.main' : 'warning.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          {deleteDialog.simpleDelete ? '🗑️ Confirmar Eliminação' : '⚠️ Ficheiro em Uso no Calendário'}
        </DialogTitle>
        <DialogContent>
          {deleteDialog.simpleDelete ? (
            <>
              <Typography variant="body1" gutterBottom>
                Tem a certeza que deseja eliminar "{deleteDialog.media?.filename}"?
              </Typography>
              <Alert severity="info" sx={{ mt: 2 }}>
                Esta ação não pode ser desfeita.
              </Alert>
            </>
          ) : (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                "{deleteDialog.media?.filename}" está agendado em {deleteDialog.usage?.scheduled_count} evento(s).
              </Alert>

              <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
                Escolha uma opção:
              </Typography>

              <Stack spacing={2}>
                <Paper
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'error.main',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'error.light', color: 'error.contrastText' }
                  }}
                  onClick={handleForceDelete}
                >
                  <Typography variant="subtitle1" fontWeight="bold">Eliminar Mesmo Assim</Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                    ⚠️ Os agendamentos ficarão inválidos e podem causar erros no playout
                  </Typography>
                </Paper>

                <Paper
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'primary.main',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' }
                  }}
                  onClick={handleReplaceAndDelete}
                >
                  <Typography variant="subtitle1" fontWeight="bold">Substituir por Filler e Eliminar</Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                    ✓ Seguro - Substitui automaticamente nos agendamentos antes de eliminar
                  </Typography>
                </Paper>
              </Stack>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, media: null, usage: null, simpleDelete: false })}>
            Cancelar
          </Button>
          {deleteDialog.simpleDelete && (
            <Button variant="contained" color="error" onClick={handleForceDelete}>
              Eliminar
            </Button>
          )}
        </DialogActions>
      </Dialog >

      {/* Move/Copy Media Dialog */}
      < Dialog open={moveOpen} onClose={() => setMoveOpen(false)} maxWidth="xs" fullWidth >
        <DialogTitle>Organizar "{mediaToMove?.filename}"</DialogTitle>
        <DialogContent dividers>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>Escolha a pasta de destino:</Typography>
          <List>
            <ListItemButton onClick={() => handleMoveMedia(null)}>
              <ListItemIcon><FolderIcon color="primary" /></ListItemIcon>
              <ListItemText primary="Mover para Raiz" />
            </ListItemButton>
            {folders.map(f => (
              <ListItemButton key={f.id} onClick={() => handleMoveMedia(f.id)}>
                <ListItemIcon><FolderIcon /></ListItemIcon>
                <ListItemText primary={`Mover para "${f.name}"`} />
              </ListItemButton>
            ))}
            <Divider sx={{ my: 1 }} />
            <ListItemButton onClick={() => handleCopyMedia(null)}>
              <ListItemIcon><FolderIcon color="secondary" /></ListItemIcon>
              <ListItemText primary="Copiar para Raiz" secondary="Cria duplicado" />
            </ListItemButton>
            {folders.map(f => (
              <ListItemButton key={`copy-${f.id}`} onClick={() => handleCopyMedia(f.id)}>
                <ListItemIcon><FolderIcon color="secondary" /></ListItemIcon>
                <ListItemText primary={`Copiar para "${f.name}"`} secondary="Cria duplicado" />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
        <DialogActions><Button onClick={() => setMoveOpen(false)}>Cancelar</Button></DialogActions>
      </Dialog >

      {/* Metadata Editor Dialog */}
      < Dialog open={metadataOpen} onClose={() => { setMetadataOpen(false); setIsReviewMode(false); }} maxWidth="md" fullWidth >
        <DialogTitle sx={{ bgcolor: isReviewMode ? 'secondary.main' : 'primary.main', color: 'white' }}>
          {isReviewMode ? '🪄 Revisar Metadados Automáticos' : 'Editar Metadados EPG'}: {editingMedia?.filename}
        </DialogTitle>
        <DialogContent dividers>
          {(isReviewMode || editingMedia?.metadata?.source_service) && (
            <Alert severity="secondary" sx={{ mb: 2, border: '1px solid', borderColor: 'secondary.main', bgcolor: 'rgba(156, 39, 176, 0.02)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <WizardIcon fontSize="small" color="secondary" />
                <Typography variant="body2">
                  Informação recuperada de: <strong>{isReviewMode ? metadataSource?.service : (editingMedia?.metadata?.source_service || 'API Automática')}</strong>
                </Typography>
              </Box>
              {(isReviewMode ? metadataSource?.url : editingMedia?.metadata?.source_url) && (
                <Link href={isReviewMode ? metadataSource?.url : editingMedia?.metadata?.source_url} target="_blank" variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  🔗 Ver fonte original no {isReviewMode ? metadataSource?.service : (editingMedia?.metadata?.source_service || 'API')} ↗
                </Link>
              )}
            </Alert>
          )}
          {isReviewMode && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Estes dados foram encontrados automaticamente. Pode editá-los abaixo antes de confirmar o salvamento.
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Título (EPG)"
              fullWidth
              value={metadataForm.title}
              onChange={e => setMetadataForm({ ...metadataForm, title: e.target.value })}
              placeholder={editingMedia?.filename}
              helperText="Deixe vazio para usar o nome do ficheiro"
              sx={{ bgcolor: isReviewMode && metadataForm.title ? 'rgba(76, 175, 80, 0.05)' : 'inherit' }}
            />
            <TextField
              label="Descrição / Sinopse"
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
                label="Género"
                fullWidth
                value={metadataForm.genre}
                onChange={e => setMetadataForm({ ...metadataForm, genre: e.target.value })}
              >
                <MenuItem value="">Nenhum</MenuItem>
                <MenuItem value="Comedy">Comédia</MenuItem>
                <MenuItem value="Drama">Drama</MenuItem>
                <MenuItem value="News">Notícias</MenuItem>
                <MenuItem value="Sports">Desporto</MenuItem>
                <MenuItem value="Documentary">Documentário</MenuItem>
                <MenuItem value="Action">Ação</MenuItem>
                <MenuItem value="Animation">Animação</MenuItem>
                <MenuItem value="Music">Música</MenuItem>
                <MenuItem value="Other">Outro</MenuItem>
              </TextField>
              <TextField
                select
                label="Classificação Etária"
                fullWidth
                value={metadataForm.rating}
                onChange={e => setMetadataForm({ ...metadataForm, rating: e.target.value })}
              >
                <MenuItem value="">Nenhuma</MenuItem>
                <MenuItem value="General">Livre</MenuItem>
                <MenuItem value="10">10 anos</MenuItem>
                <MenuItem value="12">12 anos</MenuItem>
                <MenuItem value="14">14 anos</MenuItem>
                <MenuItem value="16">16 anos</MenuItem>
                <MenuItem value="18">18 anos</MenuItem>
              </TextField>
            </Stack>
            <TextField
              label="Palavras-chave / Tags"
              fullWidth
              value={metadataForm.keywords}
              onChange={e => setMetadataForm({ ...metadataForm, keywords: e.target.value })}
              placeholder="ficção científica, comédia romântica"
              helperText="Separadas por vírgula"
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Temporada"
                fullWidth
                value={metadataForm.season}
                onChange={e => setMetadataForm({ ...metadataForm, season: e.target.value })}
              />
              <TextField
                label="Episódio"
                fullWidth
                value={metadataForm.episode}
                onChange={e => setMetadataForm({ ...metadataForm, episode: e.target.value })}
              />
            </Stack>
            <TextField
              label="Elenco / Atores Principais"
              fullWidth
              value={metadataForm.cast}
              onChange={e => setMetadataForm({ ...metadataForm, cast: e.target.value })}
              placeholder="Nome1, Nome2, Nome3"
              helperText="Separados por vírgula"
            />
            <TextField
              label="Realizador / Diretor"
              fullWidth
              value={metadataForm.director}
              onChange={e => setMetadataForm({ ...metadataForm, director: e.target.value })}
            />
            <TextField
              label="Escritor / Roteirista (Writer)"
              fullWidth
              value={metadataForm.writer}
              onChange={e => setMetadataForm({ ...metadataForm, writer: e.target.value })}
            />
            <Divider><Chip label="Dados Técnicos" size="small" /></Divider>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Resolução"
                fullWidth
                value={metadataForm.resolution}
                onChange={e => setMetadataForm({ ...metadataForm, resolution: e.target.value })}
                placeholder="1920x1080"
                helperText="Detetado automaticamente"
              />
              <TextField
                label="FPS"
                fullWidth
                value={metadataForm.fps}
                onChange={e => setMetadataForm({ ...metadataForm, fps: e.target.value })}
                placeholder="25, 30, 60"
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Codec Vídeo"
                fullWidth
                value={metadataForm.videoCodec}
                onChange={e => setMetadataForm({ ...metadataForm, videoCodec: e.target.value })}
                placeholder="h264, h265, vp9"
              />
              <TextField
                label="Codec Áudio"
                fullWidth
                value={metadataForm.audioCodec}
                onChange={e => setMetadataForm({ ...metadataForm, audioCodec: e.target.value })}
                placeholder="aac, mp3, opus"
              />
            </Stack>
            <TextField
              label="Póster URL"
              fullWidth
              value={metadataForm.poster_url || ''}
              onChange={e => setMetadataForm({ ...metadataForm, poster_url: e.target.value })}
              placeholder="https://image.tmdb.org/..."
              helperText="Caminho para a imagem de capa (carregada do Wizard)"
              sx={{ bgcolor: isReviewMode && metadataForm.poster_url ? 'rgba(76, 175, 80, 0.05)' : 'inherit' }}
            />
            <TextField
              label="Legendas / Idiomas"
              fullWidth
              value={metadataForm.subtitles}
              onChange={e => setMetadataForm({ ...metadataForm, subtitles: e.target.value })}
              placeholder="PT, EN, ES"
              helperText="Idiomas disponíveis separados por vírgula"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMetadataOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveMetadata}>Guardar</Button>
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
        <DialogActions><Button onClick={() => setPreviewOpen(false)}>Fechar</Button></DialogActions>
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
                      {uf.status === 'pending' ? 'PENDENTE' : uf.status === 'uploading' ? 'ENVIANDO' : uf.status === 'success' ? 'CONCLUÍDO' : (uf.error || 'ERRO')}
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
              Todos os carregamentos foram processados. Esta janela fechará em breve.
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
            CANCELAR TODOS
          </Button>
          <Button
            variant="contained"
            disabled={uploadFiles.some(f => f.status === 'uploading' || f.status === 'pending')}
            onClick={() => setUploadProgressOpen(false)}
            sx={{ fontWeight: 800 }}
          >
            Fechar Janela
          </Button>
        </DialogActions>
      </Dialog>
      {/* Audit Proxies Dialog */}
      <Dialog open={auditDialog.open} onClose={() => setAuditDialog({ open: false, data: null, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'secondary.main' }}>
          <AnalyticsIcon /> Auditoria de Web Proxies
        </DialogTitle>
        <DialogContent dividers>
          {auditDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress color="secondary" /></Box>
          ) : auditDialog.data ? (
            <Box>
              {auditDialog.data.missing_count === 0 ? (
                <Alert severity="success" variant="outlined" sx={{ borderRadius: 3 }}>
                  Todos os vídeos da biblioteca contêm Web Proxies gerados! O sistema está otimizado.
                </Alert>
              ) : (
                <Box>
                  <Alert severity="warning" variant="outlined" sx={{ mb: 3, borderRadius: 3 }}>
                    Foram detectados <b>{auditDialog.data.missing_count} vídeos</b> sem versão Proxy Web.
                    Isto requer processamento extra do servidor durante o streaming e navegação.
                  </Alert>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderColor: 'rgba(255,255,255,0.1)' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>VÍDEOS SEM PROXY</Typography>
                        <Typography variant="h4" color="warning.main" sx={{ fontWeight: 900 }}>{auditDialog.data.missing_count}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderColor: 'rgba(255,255,255,0.1)' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>ESPAÇO ESTIMADO</Typography>
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
          <Button onClick={() => setAuditDialog({ open: false, data: null, loading: false })}>Concluir</Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<BoltIcon />}
            disabled={auditDialog.loading || !auditDialog.data || auditDialog.data.missing_count === 0 || performingBulkAction}
            onClick={handleAuditActionAll}
          >
            Gerar em Lote ({auditDialog.data?.missing_count || 0})
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
