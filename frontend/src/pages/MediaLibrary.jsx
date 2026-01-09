import { useState, useEffect, useCallback } from 'react';
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
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { mediaAPI } from '../services/api';

export default function MediaLibrary() {
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
      const params = new URLSearchParams();
      if (filters.media_type) params.append('media_type', filters.media_type);
      if (filters.search) params.append('search', filters.search);
      params.append('page', filters.page);
      params.append('limit', filters.limit);

      const response = await mediaAPI.list();
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
    setUploading(true);
    const formData = new FormData();
    
    acceptedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      await mediaAPI.upload(formData);
      fetchMedia();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  }, []);

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
      fetchMedia();
    } catch (error) {
      console.error('Delete failed:', error);
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
            <Card>
              <CardMedia
                component="img"
                height="180"
                image={item.thumbnail_path || '/placeholder.jpg'}
                alt={item.filename}
                sx={{ bgcolor: 'background.default', objectFit: 'cover' }}
              />
              <CardContent>
                <Typography variant="subtitle2" noWrap title={item.filename}>
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
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
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
            <video controls style={{ width: '100%' }}>
              <source src={selectedMedia.path} />
            </video>
          )}
          {selectedMedia?.media_type === 'audio' && (
            <audio controls style={{ width: '100%' }}>
              <source src={selectedMedia.path} />
            </audio>
          )}
          {selectedMedia?.media_type === 'image' && (
            <img src={selectedMedia.path} alt={selectedMedia.filename} style={{ width: '100%' }} />
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
