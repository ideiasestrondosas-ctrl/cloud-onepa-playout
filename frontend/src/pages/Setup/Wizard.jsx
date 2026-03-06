import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  TextField,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  ListItemButton,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  CloudUpload as UploadIcon,
  Settings as SettingsIcon,
  Tv as TvIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Link as LinkIcon,
  Movie as MovieIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { settingsAPI, mediaAPI, playlistAPI, scheduleAPI, playoutAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

export default function SetupWizard() {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const steps = [
    t('wizard.steps.welcome'),
    t('wizard.steps.identity'),
    t('wizard.steps.media'),
    t('wizard.steps.transmission'),
    t('wizard.steps.summary'),
    t('wizard.steps.finish')
  ];

  const [setupData, setSetupData] = useState({
    channelName: t('wizard.identity.channel_name_default', 'Meu Canal Onepa'),
    logoFile: null,
    outputType: 'hls',
    outputUrl: '/hls/stream.m3u8',
    playlistItems: [],
    isDefaultVideoAdded: false,
  });

  React.useEffect(() => {
    const checkDefaultMedia = async () => {
      try {
        const res = await mediaAPI.list({ limit: 50 }); // Fetch first 50 items
        const mediaItems = res.data.media || [];
        const item = mediaItems.find(f => f.filename.includes('big_buck_bunny'));

        if (item && setupData.playlistItems.length === 0) {
          const defaultItem = {
            type: 'library',
            id: item.id,
            path: item.path,
            source: item.path,
            duration: item.duration || 596,
            title: item.filename
          };
          setSetupData(prev => ({
            ...prev,
            playlistItems: [defaultItem],
            isDefaultVideoAdded: true
          }));
        }
      } catch (e) {
        console.warn("Failed to fetch default media for wizard pre-fill", e);
      }
    };
    checkDefaultMedia();
  }, []);

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [externalOpen, setExternalOpen] = useState(false);
  const [libraryItems, setLibraryItems] = useState([]);
  const [selectedLibraryItems, setSelectedLibraryItems] = useState([]);
  const [externalUrl, setExternalUrl] = useState('');
  const [externalDuration, setExternalDuration] = useState(3600); // 1 hour default

  const fetchLibrary = async () => {
    try {
      const res = await mediaAPI.list({ limit: 500 }); // Increase limit to see all media
      setLibraryItems(res.data.media || []);
      setLibraryOpen(true);
    } catch (error) {
      showError(t('wizard.media.error_library'));
    }
  };

  const toggleLibrarySelection = (item) => {
    setSelectedLibraryItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const addSelectedLibraryItems = () => {
    const newItems = selectedLibraryItems.map(item => ({
      type: 'library',
      id: item.id || item.filename,
      path: item.path,
      source: item.path,
      duration: item.duration || 10,
      title: item.filename
    }));

    setSetupData(prev => ({
      ...prev,
      playlistItems: [...prev.playlistItems, ...newItems]
    }));

    setSelectedLibraryItems([]);
    setLibraryOpen(false);
  };

  const addExternalItem = () => {
    if (!externalUrl) return;
    setSetupData(prev => ({
      ...prev,
      playlistItems: [...prev.playlistItems, {
        type: 'stream',
        source: externalUrl,
        duration: parseFloat(externalDuration),
        title: t('wizard.media.type_stream')
      }]
    }));
    setExternalOpen(false);
    setExternalUrl('');
  };

  const removePlaylistItem = (index) => {
    setSetupData(prev => ({
      ...prev,
      playlistItems: prev.playlistItems.filter((_, i) => i !== index)
    }));
  };



  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const handleCancel = () => {
    setCancelConfirmOpen(true);
  };

  const confirmCancel = () => {
    setCancelConfirmOpen(false);
    navigate('/');
  };

  const handleNext = async () => {
    // Save settings based on CURRENT step before moving forward
    if (activeStep === 1) {
      setLoading(true);
      try {
        await settingsAPI.update({
          channel_name: setupData.channelName,
          logo_enabled: true,
        });
        showSuccess(t('wizard.identity.success_msg'));
      } catch (e) {
        showError(t('wizard.identity.error_save'));
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    if (activeStep === 2) {
      // Just validate playlist presence, don't create yet
      if (setupData.playlistItems.length === 0) {
        showError(t('wizard.media.error_playlist_empty'));
        return;
      }
    }

    if (activeStep === 3) {
      setLoading(true);
      try {
        await settingsAPI.update({
          output_type: setupData.outputType,
          output_url: setupData.outputUrl,
        });
        showSuccess(t('wizard.transmission.success_msg'));
      } catch (e) {
        showError(t('wizard.transmission.error_save'));
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    if (activeStep === steps.length - 1) {
      // FINALIZATION STEP
      setLoading(true);
      try {
        // Create Playlist and Schedule NOW
        let finalItems = [...setupData.playlistItems];

        if (finalItems.length > 0) {
          // 24h Logic: Fill at least 24 hours (86400 seconds)
          const totalDuration = finalItems.reduce((acc, item) => acc + (parseFloat(item.duration) || 0), 0);
          const TARGET_DURATION = 86400; // 24 hours

          if (totalDuration > 0 && totalDuration < TARGET_DURATION) {
            console.log(`[Wizard] Playlist duration (${totalDuration}s) < 24h. Looping content...`);
            const originalItems = [...finalItems];
            let currentDuration = totalDuration;

            while (currentDuration < TARGET_DURATION) {
              // Clone items with new IDs to avoid duplicates having same ID
              const cloneSet = originalItems.map(item => ({
                ...item,
                id: item.id ? `${item.id}_${Math.random().toString(36).substr(2, 9)}` : Math.random().toString(36).substr(2, 9)
              }));
              finalItems = [...finalItems, ...cloneSet];
              currentDuration += totalDuration;
            }
            console.log(`[Wizard] Playlist expanded to ${finalItems.length} items (${currentDuration}s)`);
          }

          // FIXED: Use 'content' key instead of 'items' to match Backend API
          const playlistRes = await playlistAPI.create({
            name: `Setup Playlist - ${new Date().toLocaleDateString()}`,
            content: {
              program: finalItems
            }
          });

          // Correctly extract ID from Axios response
          const playlistId = playlistRes?.data?.id || playlistRes?.id;

          if (playlistId) {
            try {
              // FIXED: Ensure date format YYYY-MM-DD
              const today = new Date().toISOString().split('T')[0];

              await scheduleAPI.create({
                playlist_id: playlistId,
                date: today,
                start_time: '00:00:00',
                repeat_pattern: 'daily', // Default to daily repeat
              });
            } catch (schedErr) {
              console.error('Schedule creation error:', schedErr);
            }
          }
        }

        // START PLAYOUT ENGINE
        try {
          await playoutAPI.start();
          showSuccess(t('wizard.final.success_start'));
        } catch (startErr) {
          console.error('Failed to start engine:', startErr);
          showError(t('wizard.final.error_start'));
        }

        showSuccess(t('wizard.final.success_setup'));
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } catch (e) {
        console.error(e);
        showError(`${t('wizard.final.error_finish', 'Erro na finalização')}: ` + (e.response?.data?.error || e.message));
      } finally {
        setLoading(false);
      }
      return;
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const renderStepContent = (step) => {
    if (!setupData) return <Typography>Error: Dados de setup não inicializados.</Typography>;
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <TvIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>{t('wizard.welcome.title')}</Typography>
            <Typography variant="body1" color="text.secondary">
              {t('wizard.welcome.description')}
            </Typography>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>{t('wizard.identity.title')}</Typography>
            <TextField
              fullWidth
              label={t('wizard.identity.label_name')}
              value={setupData.channelName}
              onChange={(e) => setSetupData({ ...setupData, channelName: e.target.value })}
              sx={{ mb: 3 }}
            />
            <Typography variant="subtitle2" gutterBottom>{t('wizard.identity.label_logo')}</Typography>
            <Box sx={{ border: '1px dashed #ccc', p: 3, textAlign: 'center', borderRadius: 1 }}>
              <input
                type="file"
                id="wizard-logo"
                hidden
                onChange={(e) => setSetupData({ ...setupData, logoFile: e.target.files[0] })}
              />
              <label htmlFor="wizard-logo">
                <Button variant="outlined" component="span" startIcon={<UploadIcon />}>
                  {t('wizard.identity.select_logo_btn')}
                </Button>
              </label>
              {setupData.logoFile && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {t('wizard.identity.file_label', { name: setupData.logoFile.name })}
                </Typography>
              )}
            </Box>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>{t('wizard.media.title')}</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              {t('wizard.media.alert_info')}
            </Alert>

            <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
              <Button variant="outlined" startIcon={<MovieIcon />} onClick={fetchLibrary}>
                {t('wizard.media.add_library_btn')}
              </Button>
              <Button variant="outlined" startIcon={<LinkIcon />} onClick={() => setExternalOpen(true)}>
                {t('wizard.media.add_external_btn')}
              </Button>
            </Box>

            {setupData.playlistItems.length === 0 ? (
              <Box sx={{ p: 4, bgcolor: '#f9f9f9', border: '1px dashed #ddd', textAlign: 'center' }}>
                <UploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2">{t('wizard.media.empty_msg')}</Typography>
              </Box>
            ) : (
              <List dense sx={{ bgcolor: 'background.paper', border: '1px solid #eee', borderRadius: 1, maxHeight: 300, overflow: 'auto' }}>
                {setupData.playlistItems.map((item, index) => {
                  const h = Math.floor(item.duration / 3600);
                  const m = Math.floor((item.duration % 3600) / 60);
                  const s = Math.floor(item.duration % 60);
                  const durationFormatted = [h, m, s]
                    .map(v => v < 10 ? "0" + v : v)
                    .filter((v, i) => v !== "00" || i > 0)
                    .join(":");

                  return (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={item.filename || item.title || item.source}
                        secondary={t('wizard.media.duration_label', { duration: durationFormatted, type: item.type === 'stream' ? t('wizard.media.type_stream') : t('wizard.media.type_file') })}
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => removePlaylistItem(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
              </List>
            )}

            {/* Library Dialog */}
            <Dialog open={libraryOpen} onClose={() => { setLibraryOpen(false); setSelectedLibraryItems([]); }} maxWidth="md" fullWidth>
              <DialogTitle>{t('wizard.media.dialog_library.title')}</DialogTitle>
              <DialogContent dividers>
                {selectedLibraryItems.length > 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {t('wizard.media.dialog_library.files_selected', { count: selectedLibraryItems.length })}
                  </Alert>
                )}
                <List>
                  {Array.isArray(libraryItems) && libraryItems.length > 0 ? (
                    libraryItems.map((item, idx) => {
                      const isSelected = selectedLibraryItems.some(i => i.id === item.id);

                      // FORMATTING HELPERS
                      const formatSize = (bytes) => {
                        if (!bytes || bytes === 0) return '';
                        const k = 1024;
                        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                        const i = Math.floor(Math.log(bytes) / Math.log(k));
                        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                      };

                      const formatDuration = (seconds) => {
                        if (!seconds || seconds <= 0) return 'N/A';
                        const h = Math.floor(seconds / 3600);
                        const m = Math.floor((seconds % 3600) / 60);
                        const s = Math.floor(seconds % 60);
                        return [h, m, s]
                          .map(v => v < 10 ? "0" + v : v)
                          .filter((v, i) => v !== "00" || i > 0)
                          .join(":");
                      };

                      const sizeFormatted = formatSize(item.size);
                      const durationFormatted = formatDuration(item.duration);

                      return (
                        <ListItemButton key={item.id || idx} onClick={() => toggleLibrarySelection(item)}>
                          <Checkbox checked={isSelected} />
                          <ListItemText
                            primary={item.filename}
                            secondary={
                              <>
                                {item.size > 0 && <span>{sizeFormatted} • </span>}
                                {durationFormatted}
                              </>
                            }
                          />
                        </ListItemButton>
                      );
                    })
                  ) : (
                    <Typography sx={{ p: 2, textAlign: 'center' }}>{t('wizard.media.dialog_library.no_media')}</Typography>
                  )}
                </List>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => { setLibraryOpen(false); setSelectedLibraryItems([]); }}>{t('common.cancel')}</Button>
                <Button
                  onClick={addSelectedLibraryItems}
                  variant="contained"
                  disabled={selectedLibraryItems.length === 0}
                >
                  {t('wizard.media.dialog_library.add_btn', { count: selectedLibraryItems.length })}
                </Button>
              </DialogActions>
            </Dialog>

            {/* External Stream Dialog */}
            <Dialog open={externalOpen} onClose={() => setExternalOpen(false)}>
              <DialogTitle>{t('wizard.media.dialog_external.title')}</DialogTitle>
              <DialogContent>
                <TextField
                  autoFocus
                  margin="dense"
                  label={t('wizard.media.dialog_external.label_url')}
                  fullWidth
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                />
                <TextField
                  margin="dense"
                  label={t('wizard.media.dialog_external.label_duration')}
                  type="number"
                  fullWidth
                  value={externalDuration}
                  onChange={(e) => setExternalDuration(e.target.value)}
                  helperText={t('wizard.media.dialog_external.helper_duration')}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setExternalOpen(false)}>{t('common.cancel')}</Button>
                <Button onClick={addExternalItem} variant="contained">{t('common.confirm')}</Button>
              </DialogActions>
            </Dialog>
          </Box>
        );
      case 3:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>{t('wizard.transmission.title')}</Typography>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>{t('wizard.transmission.label_output_type')}</InputLabel>
              <Select
                value={setupData.outputType}
                label={t('wizard.transmission.label_output_type')}
                onChange={(e) => {
                  const newType = e.target.value;
                  const newUrl = newType === 'rtmp'
                    ? 'rtmp://localhost:1935/stream'
                    : '/hls/stream.m3u8';

                  setSetupData({
                    ...setupData,
                    outputType: newType,
                    outputUrl: newUrl
                  });
                }}
              >
                <MenuItem value="hls">{t('wizard.transmission.item_hls')}</MenuItem>
                <MenuItem value="rtmp">{t('wizard.transmission.item_rtmp')}</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label={t('wizard.transmission.label_url')}
              value={setupData.outputUrl}
              onChange={(e) => setSetupData({ ...setupData, outputUrl: e.target.value })}
            />
          </Box>
        );

      case 4: // SUMMARY STEP
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>{t('wizard.summary.title')}</Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              {t('wizard.summary.alert_info')}
            </Alert>

            <List disablePadding>
              <ListItem divider>
                <ListItemText primary={t('wizard.summary.field_name')} secondary={setupData.channelName} />
              </ListItem>
              <ListItem divider>
                <ListItemText primary={t('wizard.summary.field_output')} secondary={`${setupData.outputType.toUpperCase()} - ${setupData.outputUrl}`} />
              </ListItem>
              <ListItem divider>
                <ListItemText primary={t('wizard.summary.field_playlist')} secondary={t('wizard.summary.playlist_desc', { count: setupData.playlistItems.length })} />
              </ListItem>
            </List>
          </Box>
        );
      case 5: // FINAL STEP
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h5" gutterBottom>{t('wizard.final.title')}</Typography>
            <Typography variant="body1">
              {t('wizard.final.description')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('wizard.final.hint')}
            </Typography>
          </Box>
        );
      default:
        return t('wizard.error_unknown_step', 'Passo desconhecido');
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Card raised className="glass-panel">
        <CardContent sx={{ p: 4, bgcolor: 'transparent' }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {renderStepContent(activeStep)}
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              color="error"
              onClick={handleCancel}
              sx={{ mr: 1 }}
            >
              {t('wizard.controls.cancel')}
            </Button>
            <Box>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                {t('wizard.controls.back')}
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
                endIcon={activeStep === steps.length - 1 ? <CheckCircleIcon /> : null}
              >
                {activeStep === steps.length - 1 ? t('wizard.controls.confirm_finish') : t('wizard.controls.next')}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        PaperProps={{ className: 'glass-panel', sx: { backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ color: 'warning.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon /> {t('wizard.dialog_cancel.title')}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {t('wizard.dialog_cancel.message')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCancelConfirmOpen(false)} sx={{ fontWeight: 800 }}>{t('wizard.dialog_cancel.btn_no')}</Button>
          <Button variant="contained" color="error" onClick={confirmCancel} sx={{ fontWeight: 800 }}>{t('wizard.dialog_cancel.btn_yes')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
