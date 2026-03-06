import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  Paper,
  Divider,
  Chip,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Edit as EditIcon,
  History as HistoryIcon,
} from '@mui/icons-material';

const getPresetTemplates = (t) => [
  {
    id: 'morning-show',
    name: t('templates.presets.morning_show.name'),
    description: t('templates.presets.morning_show.description'),
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
    name: t('templates.presets.full_day.name'),
    description: t('templates.presets.full_day.description'),
    duration: 86400,
    structure: [
      { type: 'content', duration: 82800 },
      { type: 'filler', duration: 3600 },
    ],
  },
  {
    id: 'loop-content',
    name: t('templates.presets.loop_content.name'),
    description: t('templates.presets.loop_content.description'),
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
  const { t } = useTranslation();
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
    const presets = getPresetTemplates(t);
    try {
      const response = await templateAPI.list();
      setTemplates([...presets, ...response.data]);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      setTemplates(presets); // Fallback to presets
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewTemplate = async () => {
    if (!newTemplate.name) {
      showError(t('templates.notifications.error_name_required'));
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
        showSuccess(t('templates.notifications.update_success'));
      } else {
        await templateAPI.create(templateToAdd);
        showSuccess(t('templates.notifications.create_success'));
      }

      setCreateDialogOpen(false);
      setNewTemplate({ name: '', description: '', duration: 3600, structure: [] });
      fetchTemplates();
    } catch (error) {
      console.error('Failed to save template:', error);
      showError(t('templates.notifications.error_save'));
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
    if (!window.confirm(t('templates.confirm_delete'))) return;

    try {
      await templateAPI.delete(id);
      showSuccess(t('templates.notifications.delete_success'));
      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      showError(t('templates.notifications.error_delete'));
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

      showSuccess(t('templates.notifications.playlist_success', { name: selectedTemplate.name }));
      setDialogOpen(false);
      navigate('/playlists');
    } catch (error) {
      console.error('Failed to create playlist:', error);
      showError(t('templates.notifications.error_playlist'));
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Box>
          <Typography variant="h5" className="neon-text" sx={{ fontWeight: 800 }}>{t('templates.header.title')}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1.5, fontSize: '0.65rem' }}>{t('templates.header.subtitle')}</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ borderRadius: 2, fontWeight: 800, px: 3 }}
        >
          {t('templates.controls.create_btn')}
        </Button>
      </Box>

      {/* Templates Grid */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '4px' } }}>
        <Grid container spacing={2}>
          {templates.map((template) => (
            <Grid item xs={12} md={6} lg={4} key={template.id}>
              <Paper className="glass-panel" sx={{
                p: 1.5,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: '0.3s',
                '&:hover': { transform: 'translateY(-2px)', border: '1px solid rgba(0,229,255,0.3)' }
              }}>
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: 0.5, color: 'primary.main', fontSize: '0.95rem' }}>
                    {(template.name || t('templates.grid.no_name')).toUpperCase()}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: 32, fontSize: '0.7rem' }}>
                    {template.description}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Chip
                    icon={<HistoryIcon sx={{ fontSize: '1rem !important' }} />}
                    label={`${Math.floor(template.duration / 3600)}H ${Math.floor((template.duration % 3600) / 60)}M`}
                    size="small"
                    sx={{ fontWeight: 800, borderRadius: 1.5, bgcolor: 'rgba(0,229,255,0.1)', color: 'primary.main', border: '1px solid rgba(0,229,255,0.2)' }}
                  />
                  <Chip
                    label={`${template.structure.length} ${t('templates.grid.blocks')}`}
                    size="small"
                    sx={{ fontWeight: 800, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </Box>

                <Divider sx={{ mb: 1.5, opacity: 0.1 }} />

                <Box sx={{ flexGrow: 1, mb: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.4, mb: 1, display: 'block', fontSize: '0.65rem' }}>{t('templates.grid.structure_title')}</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {template.structure.slice(0, 6).map((item, index) => (
                      <Tooltip key={index} title={`${item.type.toUpperCase()} (${Math.floor(item.duration / 60)} min)`}>
                        <Box sx={{
                          px: 1, py: 0.5,
                          borderRadius: 1,
                          bgcolor: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          opacity: 0.8
                        }}>
                          {item.type.toUpperCase()}
                        </Box>
                      </Tooltip>
                    ))}
                    {template.structure.length > 6 && (
                      <Box sx={{ px: 1, py: 0.5, fontSize: '0.65rem', fontWeight: 700, opacity: 0.4 }}>+{template.structure.length - 6}</Box>
                    )}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<PlayIcon />}
                    onClick={() => handleUseTemplate(template)}
                    sx={{ borderRadius: 2, fontWeight: 800 }}
                  >
                    {t('templates.grid.use_btn')}
                  </Button>
                  {!getPresetTemplates(t).find(p => p.id === template.id) && (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton onClick={() => handleEditTemplate(template)} sx={{ bgcolor: 'rgba(0,229,255,0.05)', borderRadius: 2, color: 'primary.main', '&:hover': { bgcolor: 'rgba(0,229,255,0.1)' } }}>
                        <EditIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteTemplate(template.id)} sx={{ bgcolor: 'rgba(244,67,54,0.05)', borderRadius: 2, color: 'error.main', '&:hover': { bgcolor: 'rgba(244,67,54,0.1)' } }}>
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Create New Template Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ className: 'glass-panel', sx: { backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'primary.main', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {newTemplate.id ? t('templates.dialog_edit.title_edit') : t('templates.dialog_edit.title_create')}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label={t('templates.dialog_edit.label_name')}
            variant="standard"
            sx={{ mt: 2 }}
            value={newTemplate.name}
            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
            InputLabelProps={{ shrink: true, sx: { fontWeight: 800 } }}
            inputProps={{ sx: { fontWeight: 800 } }}
          />
          <TextField
            fullWidth
            label={t('templates.dialog_edit.label_description')}
            variant="standard"
            sx={{ mt: 3 }}
            multiline
            rows={2}
            value={newTemplate.description}
            onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
            InputLabelProps={{ shrink: true, sx: { fontWeight: 800 } }}
            inputProps={{ sx: { fontWeight: 700, fontSize: '0.9rem' } }}
          />
          <TextField
            fullWidth
            label={t('templates.dialog_edit.label_duration')}
            variant="standard"
            type="number"
            sx={{ mt: 3 }}
            value={newTemplate.duration}
            onChange={(e) => setNewTemplate({ ...newTemplate, duration: parseInt(e.target.value) })}
            InputLabelProps={{ shrink: true, sx: { fontWeight: 800 } }}
            inputProps={{ sx: { fontWeight: 800 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setCreateDialogOpen(false)} sx={{ fontWeight: 800 }}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleSaveNewTemplate}
            sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}
          >
            {t('templates.dialog_edit.save_btn')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Use Template Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ className: 'glass-panel', sx: { backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'primary.main', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {t('templates.dialog_use.title')}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedTemplate && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.4 }}>{t('templates.dialog_use.selected_template')}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>{selectedTemplate.name.toUpperCase()}</Typography>
              </Box>

              <TextField
                fullWidth
                label={t('templates.dialog_use.label_playlist_name')}
                variant="standard"
                sx={{ mt: 2 }}
                placeholder={`Playlist ${selectedTemplate.name}`}
                InputLabelProps={{ shrink: true, sx: { fontWeight: 800 } }}
                inputProps={{ sx: { fontWeight: 800 } }}
              />
              <TextField
                fullWidth
                label={t('templates.dialog_use.label_emission_date')}
                type="date"
                variant="standard"
                sx={{ mt: 3 }}
                InputLabelProps={{ shrink: true, sx: { fontWeight: 800 } }}
                inputProps={{ sx: { fontWeight: 800 } }}
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ fontWeight: 800 }}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleCreatePlaylist}
            sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}
          >
            {t('templates.dialog_use.generate_now_btn')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
