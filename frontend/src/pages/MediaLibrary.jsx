import { useState, useEffect, useCallback } from 'react';
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
  ListItemButton
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
} from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { mediaAPI } from '../services/api';

export default function MediaLibrary() {
  const { showSuccess, showError, showWarning, showInfo } = useNotification();
  const [media, setMedia] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState(null); // null = root
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
  const [transparencyOpen, setTransparencyOpen] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [mediaToMove, setMediaToMove] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, media: null, usage: null });
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadProgressOpen, setUploadProgressOpen] = useState(false);
  const [checkingDelete, setCheckingDelete] = useState(null); // ID of media being checked

  useEffect(() => {
    fetchMedia();
    fetchFolders();
  }, [filters, currentFolder]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const params = { 
        ...filters, 
        folder_id: currentFolder?.id || 'root' 
      };
      const response = await mediaAPI.list(params);
      setMedia(response.data.media);
      setPagination({
        total: response.data.total,
        pages: response.data.pages,
      });
    } catch (error) {
      console.error('Failed to fetch media:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // Sequential Upload Logic
  useEffect(() => {
    if (uploadProgressOpen && uploadFiles.some(f => f.status === 'pending' || f.status === 'uploading')) {
       const processUploads = async () => {
          // Check if we are already uploading someone
          if (uploadFiles.some(f => f.status === 'uploading')) return;

          const nextFile = uploadFiles.find(f => f.status === 'pending');
          if (!nextFile) {
             // All done? Check if we should close after delay
             const allFinished = uploadFiles.every(f => f.status === 'success' || f.status === 'error');
             if (allFinished) {
                // Refresh media list ONCE after all uploads complete
                fetchMedia();
                setTimeout(() => {
                   setUploadProgressOpen(false);
                   setUploadFiles([]); // Clear upload queue
                }, 3000);
             }
             return;
          }

          // Start uploading nextFile
          setUploadFiles(prev => prev.map(f => f.id === nextFile.id ? { ...f, status: 'uploading' } : f));
          
          const formData = new FormData();
          if (currentFolder) formData.append('folder_id', currentFolder.id);
          formData.append('files', nextFile.file);

          try {
            await mediaAPI.upload(formData, (progressEvent) => {
               const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
               setUploadFiles(prev => prev.map(f => f.id === nextFile.id ? { ...f, progress } : f));
            });
            
            setUploadFiles(prev => prev.map(f => f.id === nextFile.id ? { ...f, status: 'success', progress: 100 } : f));
            // DO NOT call fetchMedia here - it causes white screen and loop restart
          } catch (error) {
            console.error('Individual upload error:', error);
            setUploadFiles(prev => prev.map(f => f.id === nextFile.id ? { ...f, status: 'error' } : f));
          }
       };

       processUploads();
    }
  }, [uploadProgressOpen, uploadFiles, currentFolder]);

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
    accept: { 'video/*': [], 'audio/*': [], 'image/*': [] }
  });

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>Media Library</Typography>
        <Stack direction="row" spacing={1}>
            <Button variant="contained" startIcon={<NewFolderIcon />} onClick={() => setNewFolderOpen(true)}>Nova Pasta</Button>
            <Chip label={`${pagination.total} Ficheiros`} color="primary" variant="outlined" />
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Sidebar Folders */}
        <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, height: '100%', minHeight: '60vh' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FolderIcon color="primary" /> Pastas
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List size="small">
                    <ListItemButton selected={currentFolder === null} onClick={() => setCurrentFolder(null)}>
                        <ListItemIcon><FolderIcon color={currentFolder === null ? "primary" : "inherit"} /></ListItemIcon>
                        <ListItemText primary="Raiz (Root)" />
                    </ListItemButton>
                    {folders.map(f => (
                        <ListItem 
                            key={f.id} 
                            disablePadding
                            secondaryAction={
                                <IconButton edge="end" size="small" color="error" onClick={() => handleDeleteFolder(f.id, f.name)}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            }
                        >
                            <ListItemButton selected={currentFolder?.id === f.id} onClick={() => setCurrentFolder(f)}>
                                <ListItemIcon><FolderIcon /></ListItemIcon>
                                <ListItemText primary={f.name} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Paper>
        </Grid>

        {/* Media Content */}
        <Grid item xs={12} md={9}>
            {/* Breadcrumbs */}
            <Paper sx={{ p: 1, mb: 2, bgcolor: 'action.hover' }}>
                <Breadcrumbs separator={<NextIcon fontSize="small" />}>
                    <Link color="inherit" sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => setCurrentFolder(null)}>
                        <FolderIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Media
                    </Link>
                    {currentFolder && (
                        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
                            <FolderOpenIcon sx={{ mr: 0.5 }} fontSize="inherit" /> {currentFolder.name}
                        </Typography>
                    )}
                </Breadcrumbs>
            </Paper>

            {/* Upload Area */}
            <Card sx={{ mb: 3, p: 3, border: '2px dashed', borderColor: isDragActive ? 'primary.main' : 'divider', bgcolor: isDragActive ? 'action.hover' : 'background.paper' }}>
                <Box {...getRootProps()} sx={{ textAlign: 'center', cursor: 'pointer' }}>
                    <input {...getInputProps()} />
                    <UploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1, opacity: 0.6 }} />
                    <Typography variant="subtitle1">
                        {isDragActive ? 'Solte para Upload' : `Arraste ficheiros para ${currentFolder?.name || 'Raiz'}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Suporta múltiplos vídeos, áudios e imagens
                    </Typography>
                </Box>
            </Card>

            {/* Filters */}
            <Card sx={{ mb: 3, p: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth size="small" placeholder="Pesquisar..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value, page: 1})} InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Tipo</InputLabel>
                            <Select value={filters.media_type} label="Tipo" onChange={e => setFilters({...filters, media_type: e.target.value, page: 1})}>
                                <MenuItem value="">Todos</MenuItem>
                                <MenuItem value="video">Vídeo</MenuItem>
                                <MenuItem value="image">Imagem</MenuItem>
                                <MenuItem value="audio">Áudio</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Filler</InputLabel>
                            <Select value={filters.is_filler === undefined ? "" : filters.is_filler} label="Filler" onChange={e => setFilters({...filters, is_filler: e.target.value === "" ? undefined : e.target.value, page: 1})}>
                                <MenuItem value="">Ambos</MenuItem>
                                <MenuItem value="true">Fillers</MenuItem>
                                <MenuItem value="false">Normais</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Card>

            {loading && <LinearProgress sx={{ mb: 2 }} />}

            {/* Media Grid */}
            <Grid container spacing={2}>
                {media.map(item => (
                    <Grid item xs={12} sm={6} md={4} key={item.id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                            <CardMedia 
                              component="img" 
                              height="120" 
                              image={item.media_type === 'video' ? `/api/media/${item.id}/thumbnail` : (item.media_type === 'image' ? `/api/media/${item.id}/stream` : 'https://via.placeholder.com/300x120?text=Sem+Preview')} 
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/300x120?text=Sem+Preview';
                              }}
                            />
                            <CardContent sx={{ p: 1.5, flexGrow: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.filename}>{item.filename}</Typography>
                                <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                                    <Chip label={item.media_type} size="small" variant="outlined" color="primary" />
                                    {item.duration > 0 && <Chip label={formatDuration(item.duration)} size="small" variant="outlined" />}
                                </Stack>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                    <Stack direction="row" spacing={0.5}>
                                        <IconButton size="small" color="primary" onClick={() => { setSelectedMedia(item); setPreviewOpen(true); }}><PlayIcon /></IconButton>
                                        <IconButton size="small" color="info" onClick={() => { setMediaToMove(item); setMoveOpen(true); }}><MoveIcon /></IconButton>
                                        <IconButton 
                                            size="small" 
                                            color="error" 
                                            disabled={checkingDelete === item.id}
                                            onClick={(e) => handleSmartDelete(e, item)}
                                        >
                                            {checkingDelete === item.id ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
                                        </IconButton>
                                    </Stack>
                                    <Button size="small" color="warning" variant={item.is_filler ? "contained" : "outlined"} onClick={async () => { await mediaAPI.setFiller(item.id, !item.is_filler); fetchMedia(); }}>Filler</Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                    <Button disabled={filters.page === 1} onClick={() => setFilters({...filters, page: filters.page - 1})}>Anterior</Button>
                    <Typography sx={{ alignSelf: 'center' }}>{filters.page} / {pagination.pages}</Typography>
                    <Button disabled={filters.page === pagination.pages} onClick={() => setFilters({...filters, page: filters.page + 1})}>Próxima</Button>
                </Box>
            )}
        </Grid>
      </Grid>

      {/* New Folder Dialog */}
      <Dialog open={newFolderOpen} onClose={() => setNewFolderOpen(false)}>
        <DialogTitle>Nova Pasta</DialogTitle>
        <DialogContent>
            <TextField fullWidth autoFocus label="Nome da Pasta" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setNewFolderOpen(false)}>Cancelar</Button>
            <Button variant="contained" onClick={handleCreateFolder}>Criar</Button>
        </DialogActions>
      </Dialog>

      {/* Smart Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, media: null, usage: null, simpleDelete: false })} maxWidth="sm" fullWidth>
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
      </Dialog>

      {/* Move/Copy Media Dialog */}
      <Dialog open={moveOpen} onClose={() => setMoveOpen(false)} maxWidth="xs" fullWidth>
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
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.dark', color: '#fff' }}>Preview: {selectedMedia?.filename}</DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: '#000', display: 'flex', justifyContent: 'center' }}>
            {selectedMedia?.media_type === 'video' && <video controls autoPlay style={{ maxWidth: '100%', maxHeight: '70vh' }} src={`/api/media/${selectedMedia.id}/stream`} />}
            {selectedMedia?.media_type === 'image' && <img alt="preview" style={{ maxWidth: '100%', maxHeight: '70vh' }} src={`/api/media/${selectedMedia.id}/stream`} />}
            {selectedMedia?.media_type === 'audio' && <Box sx={{ p: 4 }}><audio controls src={`/api/media/${selectedMedia.id}/stream`} /></Box>}
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
                    {uf.status === 'pending' && <PendingIcon fontSize="small" color="action" />}
                    {uf.status === 'uploading' && <CircularProgress size={16} />}
                    {uf.status === 'success' && <SuccessIcon fontSize="small" color="success" />}
                    {uf.status === 'error' && <ErrorIcon fontSize="small" color="error" />}
                    <Typography variant="caption" color="text.secondary">
                        {uf.status === 'pending' ? 'Pendente' : uf.status === 'uploading' ? 'Enviando...' : uf.status === 'success' ? 'Concluído' : 'Erro'}
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress 
                    variant="determinate" 
                    value={uf.progress} 
                    color={uf.status === 'error' ? 'error' : 'primary'}
                    sx={{ height: 6, borderRadius: 3 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <FolderIcon sx={{ fontSize: 12 }} /> {uf.destination}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {uf.progress}%
                    </Typography>
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
        <DialogActions>
          <Button 
            disabled={uploadFiles.some(f => f.status === 'uploading' || f.status === 'pending')} 
            onClick={() => setUploadProgressOpen(false)}
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
