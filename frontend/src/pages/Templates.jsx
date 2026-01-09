import { useState } from 'react';
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
  const [templates, setTemplates] = useState(PRESET_TEMPLATES);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleUseTemplate = (template) => {
    setSelectedTemplate(template);
    setDialogOpen(true);
  };

  const handleCreatePlaylist = () => {
    // TODO: Create playlist from template
    console.log('Creating playlist from template:', selectedTemplate);
    setDialogOpen(false);
    alert('Playlist criada a partir do template!');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Templates de Playlists
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Criar Template
        </Button>
      </Box>

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
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<PlayIcon />}
                  onClick={() => handleUseTemplate(template)}
                  sx={{ mt: 2 }}
                >
                  Usar Template
                </Button>
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
