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
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Extension as ExtensionIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { mediaAPI } from '../services/api';

export default function MediaLibrary() {
  const { showSuccess, showError, showWarning } = useNotification();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filters, setFilters] = useState({
    media_type: '',
    search: '',
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
  });
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    fetchMedia();
  }, [filters]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const response = await mediaAPI.list(filters);
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

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) {
      showWarning('Nenhum ficheiro selecionado');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    
    acceptedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      await mediaAPI.upload(formData);
      showSuccess(`${acceptedFiles.length} ficheiro(s) carregado(s) com sucesso!`);
      await fetchMedia(); // Refresh the list
    } catch (error) {
      console.error('Upload failed:', error);
      showError(error.response?.data?.error || 'Erro ao fazer upload dos ficheiros');
    } finally {
      setUploading(false);
    }
  }, [showSuccess, showError, showWarning]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mkv', '.avi', '.mov', '.webm'],
      'audio/*': ['.mp3', '.wav', '.aac', '.flac'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    },
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este ficheiro?')) return;

    try {
      await mediaAPI.delete(id);
      showSuccess('Ficheiro eliminado com sucesso!');
      await fetchMedia();
    } catch (error) {
      console.error('Delete failed:', error);
      showError('Erro ao eliminar ficheiro');
    }
  };

  const handlePreview = (item) => {
    setSelectedMedia(item);
    setPreviewOpen(true);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Media Library
      </Typography>

      {/* Upload Area */}
      <Card sx={{ mb: 3, p: 3, bgcolor: isDragActive ? 'action.hover' : 'background.paper' }}>
        <Box {...getRootProps()} sx={{ textAlign: 'center', cursor: 'pointer' }}>
          <input {...getInputProps()} />
          <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h6">
            {isDragActive ? 'Solte os ficheiros aqui' : 'Arraste ficheiros ou clique para fazer upload'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Suporta: MP4, MKV, AVI, MOV, MP3, WAV, JPG, PNG
          </Typography>
        </Box>
        {uploading && <LinearProgress sx={{ mt: 2 }} />}
      </Card>

      {/* Filters */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              placeholder="Pesquisar..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={filters.media_type}
                label="Tipo"
                onChange={(e) => setFilters({ ...filters, media_type: e.target.value, page: 1 })}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="video">Vídeo</MenuItem>
                <MenuItem value="audio">Áudio</MenuItem>
                <MenuItem value="image">Imagem</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Filler</InputLabel>
              <Select
                value={filters.is_filler === undefined ? "" : (filters.is_filler ? "true" : "false")}
                label="Filler"
                onChange={(e) => {
                  const val = e.target.value;
                  setFilters({ 
                    ...filters, 
                    is_filler: val === "" ? undefined : val === "true", 
                    page: 1 
                  });
                }}
              >
                <MenuItem value="">Ambos</MenuItem>
                <MenuItem value="true">Fillers</MenuItem>
                <MenuItem value="false">Normais</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Typography variant="body2" color="text.secondary">
              Total: {pagination.total} ficheiros
            </Typography>
          </Grid>
        </Grid>
      </Card>

      {/* Loading */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Media Grid */}
      <Grid container spacing={2}>
        {media.map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
            <Card sx={{ position: 'relative', border: item.is_filler ? '2px solid #ed6c02' : 'none' }}>
              {item.is_filler && (
                <Chip 
                  label="FILLER" 
                  size="small" 
                  color="warning" 
                  sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                />
              )}
              <CardMedia
                component="img"
                height="120"
                image={item.thumbnail_path ? `/api/media/${item.id}/thumbnail` : 
                  (item.media_type === 'video' ? 'https://via.placeholder.com/160x120?text=Video' : 
                   item.media_type === 'audio' ? 'https://via.placeholder.com/160x120?text=Audio' : 
                   item.media_type === 'image' ? `/api/media/${item.id}/stream` : 'https://via.placeholder.com/160x120?text=Media')}
                alt={item.filename}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent>
                <Typography variant="subtitle2" noWrap title={item.filename} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {item.is_filler && <ExtensionIcon sx={{ fontSize: 16, color: 'warning.main' }} />}
                  {item.filename}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 1, mb: 1 }}>
                  <Chip label={item.media_type} size="small" color="primary" />
                  {item.duration && (
                    <Chip label={formatDuration(item.duration)} size="small" />
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  {item.width && item.height && `${item.width}x${item.height}`}
                  {item.codec && ` • ${item.codec}`}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handlePreview(item)}
                    >
                      <PlayIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(item.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <Button
                    size="small"
                    variant={item.is_filler ? "contained" : "outlined"}
                    color="warning"
                    onClick={async () => {
                      try {
                        await mediaAPI.setFiller(item.id, !item.is_filler);
                        fetchMedia();
                        showSuccess(item.is_filler ? 'Marcado como normal' : 'Marcado como filler');
                      } catch (err) {
                        showError('Erro ao atualizar status de filler');
                      }
                    }}
                  >
                    {item.is_filler ? "Remover Filler" : "Marcar Filler"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {!loading && media.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Nenhum ficheiro encontrado. Faça upload para começar!
        </Alert>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 1 }}>
          <Button
            disabled={filters.page === 1}
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
          >
            Anterior
          </Button>
          <Typography sx={{ alignSelf: 'center', mx: 2 }}>
            Página {filters.page} de {pagination.pages}
          </Typography>
          <Button
            disabled={filters.page === pagination.pages}
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
          >
            Próxima
          </Button>
        </Box>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedMedia?.filename}</DialogTitle>
        <DialogContent>
          {selectedMedia?.media_type === 'video' && (
            <video 
              controls 
              style={{ width: '100%', maxHeight: '70vh' }}
              crossOrigin="anonymous"
              autoPlay
              muted={false}
            >
              <source src={`/api/media/${selectedMedia.id}/stream`} />
            </video>
          )}
          {selectedMedia?.media_type === 'audio' && (
            <audio controls style={{ width: '100%' }}>
              <source src={`/api/media/${selectedMedia.id}/stream`} />
            </audio>
          )}
          {selectedMedia?.media_type === 'image' && (
            <img src={`/api/media/${selectedMedia.id}/stream`} alt={selectedMedia.filename} style={{ width: '100%' }} />
          )}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Duração:</strong> {formatDuration(selectedMedia?.duration)}
            </Typography>
            <Typography variant="body2">
              <strong>Resolução:</strong> {selectedMedia?.width}x{selectedMedia?.height}
            </Typography>
            <Typography variant="body2">
              <strong>Codec:</strong> {selectedMedia?.codec}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
