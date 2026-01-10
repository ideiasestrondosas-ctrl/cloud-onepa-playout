import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { playlistAPI, templateAPI } from '../services/api';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

const PRESET_TEMPLATES = [
  {
    id: 'morning-show',
    name: 'Morning Show',
    description: 'Template para programa matinal (06:00 - 12:00)',
    duration: 21600, // 6 hours
    structure: [
      { type: 'intro', duration: 30 },
      { type: 'content', duration: 3600 },
      { type: 'commercial', duration: 180 },
      { type: 'content', duration: 3600 },
      { type: 'outro', duration: 30 },
    ],
  },
  {
    id: 'full-day',
    name: 'Full Day 24h',
    description: 'Playlist completa de 24 horas',
    duration: 86400,
    structure: [
      { type: 'content', duration: 82800 },
      { type: 'filler', duration: 3600 },
    ],
  },
  {
    id: 'loop-content',
    name: 'Loop Content',
    description: 'Loop de conteúdo com intervalos comerciais',
    duration: 86400,
    structure: [
      { type: 'content', duration: 3600 },
      { type: 'commercial', duration: 300 },
    ],
  },
];

export default function Templates() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '', duration: 3600, structure: [] });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await templateAPI.list();
      // Combine preset templates with user templates if desired, or just show database templates
      // For now, let's include both
      setTemplates([...PRESET_TEMPLATES, ...response.data]);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      setTemplates(PRESET_TEMPLATES); // Fallback to presets
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewTemplate = async () => {
    if (!newTemplate.name) {
      showError('Nome é obrigatório');
      return;
    }
    
    try {
        const templateToAdd = {
          name: newTemplate.name,
          description: newTemplate.description,
          duration: newTemplate.duration,
          structure: newTemplate.structure.length > 0 ? newTemplate.structure : [
            { type: 'content', duration: newTemplate.duration }
          ]
        };
        
        if (newTemplate.id) {
          await templateAPI.update(newTemplate.id, templateToAdd);
          showSuccess('Template atualizado com sucesso!');
        } else {
          await templateAPI.create(templateToAdd);
          showSuccess('Template criado com sucesso!');
        }
        
        setCreateDialogOpen(false);
        setNewTemplate({ name: '', description: '', duration: 3600, structure: [] });
        fetchTemplates();
    } catch (error) {
        console.error('Failed to save template:', error);
        showError('Erro ao guardar template');
    }
  };

  const handleEditTemplate = (template) => {
    setNewTemplate({
      id: template.id,
      name: template.name,
      description: template.description,
      duration: template.duration,
      structure: template.structure
    });
    setCreateDialogOpen(true);
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Tem a certeza que deseja eliminar este template?')) return;
    
    try {
      await templateAPI.delete(id);
      showSuccess('Template eliminado!');
      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      showError('Erro ao eliminar template');
    }
  };

  const handleUseTemplate = (template) => {
    setSelectedTemplate(template);
    setDialogOpen(true);
  };

  const handleCreatePlaylist = async () => {
    try {
      // Create playlist structure based on template
      const content = {
        channel: 'Cloud Onepa',
        date: new Date().toISOString().split('T')[0],
        program: selectedTemplate.structure.map(item => ({
          in: 0,
          out: item.duration,
          duration: item.duration,
          source: `placeholder://${item.type}`, // Placeholder source
          type: item.type
        }))
      };

      await playlistAPI.create({
        name: `Playlist ${selectedTemplate.name} - ${new Date().toLocaleDateString()}`,
        date: new Date().toISOString().split('T')[0],
        content
      });

      showSuccess(`Playlist criada a partir do template "${selectedTemplate.name}"!`);
      setDialogOpen(false);
      navigate('/playlists');
    } catch (error) {
      console.error('Failed to create playlist:', error);
      showError('Erro ao criar playlist a partir do template');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Templates de Playlists
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)}>
          Criar Template
        </Button>
      </Box>

      {/* Create New Template Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Criar Novo Template</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nome do Template"
            sx={{ mt: 2 }}
            value={newTemplate.name}
            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
          />
          <TextField
            fullWidth
            label="Descrição"
            sx={{ mt: 2 }}
            multiline
            rows={3}
            value={newTemplate.description}
            onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
          />
          <TextField
            fullWidth
            label="Duração Total (segundos)"
            type="number"
            sx={{ mt: 2 }}
            value={newTemplate.duration}
            onChange={(e) => setNewTemplate({ ...newTemplate, duration: parseInt(e.target.value) })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveNewTemplate}>Salvar Template</Button>
        </DialogActions>
      </Dialog>


      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {template.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {template.description}
                </Typography>
                <Chip
                  label={`${Math.floor(template.duration / 3600)}h`}
                  size="small"
                  sx={{ mb: 2 }}
                />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Estrutura:
                  </Typography>
                  <List dense>
                    {template.structure.map((item, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={item.type}
                          secondary={`${Math.floor(item.duration / 60)} min`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<PlayIcon />}
                    onClick={() => handleUseTemplate(template)}
                  >
                    Usar
                  </Button>
                  {!PRESET_TEMPLATES.find(p => p.id === template.id) && (
                    <>
                      <IconButton onClick={() => handleEditTemplate(template)} color="primary" size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteTemplate(template.id)} color="error" size="small">
                        <DeleteIcon />
                      </IconButton>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Template Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Criar Playlist a partir de Template</DialogTitle>
        <DialogContent>
          {selectedTemplate && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Template: <strong>{selectedTemplate.name}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {selectedTemplate.description}
              </Typography>
              <TextField
                fullWidth
                label="Nome da Playlist"
                sx={{ mt: 2 }}
                placeholder={`Playlist ${selectedTemplate.name}`}
              />
              <TextField
                fullWidth
                label="Data"
                type="date"
                sx={{ mt: 2 }}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreatePlaylist}>
            Criar Playlist
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
