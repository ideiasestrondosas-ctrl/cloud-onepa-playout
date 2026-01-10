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
import { 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  Grid 
} from '@mui/material';
import { settingsAPI, mediaAPI, playlistAPI, scheduleAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const steps = ['Boas-vindas', 'Identidade', 'Média', 'Transmissão', 'Finalizar'];

export default function SetupWizard() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const [setupData, setSetupData] = useState({
    channelName: 'Meu Canal Onepa',
    logoFile: null,
    outputType: 'hls',
    outputUrl: '/hls/stream.m3u8',
    playlistItems: [],
  });

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [externalOpen, setExternalOpen] = useState(false);
  const [libraryItems, setLibraryItems] = useState([]);
  const [externalUrl, setExternalUrl] = useState('');
  const [externalDuration, setExternalDuration] = useState(3600); // 1 hour default

  const fetchLibrary = async () => {
    try {
      const res = await mediaAPI.list();
      setLibraryItems(res.data || []);
      setLibraryOpen(true);
    } catch (error) {
      showError('Erro ao carregar Media Library');
    }
  };

  const addLibraryItem = (item) => {
    setSetupData(prev => ({
        ...prev,
        playlistItems: [...prev.playlistItems, {
            type: 'library',
            id: item.id || item.filename,
            path: item.path, // Assuming API returns path
            source: item.path,
            duration: item.duration || 10,
            title: item.filename
        }]
    }));
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
            title: 'Stream Externo'
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

  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      navigate('/');
      return;
    }

    if (activeStep === 1) {
        // Save identity settings
        setLoading(true);
        try {
            await settingsAPI.update({
                logo_enabled: true,
                // In a real app we'd update channel name here too if it existed in settings
            });
            showSuccess('Identidade configurada!');
        } catch (e) {
            showError('Erro ao salvar identidade');
        } finally {
            setLoading(false);
        }
    }

    if (activeStep === 2) {
        if (setupData.playlistItems.length > 0) {
            setLoading(true);
            try {
                const playlistRes = await playlistAPI.create({
                    name: `Setup Playlist - ${new Date().toLocaleDateString()}`,
                    items: setupData.playlistItems
                });
                
                if (playlistRes.data && playlistRes.data.id) {
                     showSuccess('Playlist criada com sucesso!');
                }
            } catch (e) {
                console.error(e);
                showError('Erro ao criar playlist.');
            } finally {
                setLoading(false);
            }
        }
    }

    if (activeStep === 3) {
        // Save output settings
        setLoading(true);
        try {
            await settingsAPI.update({
                output_type: setupData.outputType,
                output_url: setupData.outputUrl,
            });
            showSuccess('Configuração de saída salva!');
        } catch (e) {
            showError('Erro ao salvar saída');
        } finally {
            setLoading(false);
        }
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <TvIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>Bem-vindo ao Cloud Onepa Playout</Typography>
            <Typography variant="body1" color="text.secondary">
              Vamos configurar o seu canal de TV profissional em apenas alguns passos.
            </Typography>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>Identidade do Canal</Typography>
            <TextField
              fullWidth
              label="Nome do Canal"
              value={setupData.channelName}
              onChange={(e) => setSetupData({ ...setupData, channelName: e.target.value })}
              sx={{ mb: 3 }}
            />
            <Typography variant="subtitle2" gutterBottom>Logo da Estação</Typography>
            <Box sx={{ border: '1px dashed #ccc', p: 3, textAlign: 'center', borderRadius: 1 }}>
              <input
                type="file"
                id="wizard-logo"
                hidden
                onChange={(e) => setSetupData({ ...setupData, logoFile: e.target.files[0] })}
              />
              <label htmlFor="wizard-logo">
                <Button variant="outlined" component="span" startIcon={<UploadIcon />}>
                  Selecionar Logo
                </Button>
              </label>
              {setupData.logoFile && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Arquivo: {setupData.logoFile.name}
                </Typography>
              )}
            </Box>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>Conteúdo Inicial</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Pode carregar os seus primeiros vídeos agora para começar rapidamente.
            </Alert>
            <Typography variant="h6" gutterBottom>Conteúdo Inicial</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Adicione vídeos da sua biblioteca ou streams externos (RTMP/HLS) para a sua playlist inicial.
            </Alert>
            
            <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                <Button variant="outlined" startIcon={<MovieIcon />} onClick={fetchLibrary}>
                    Adicionar da Biblioteca
                </Button>
                <Button variant="outlined" startIcon={<LinkIcon />} onClick={() => setExternalOpen(true)}>
                    Adicionar Stream/URL
                </Button>
            </Box>

            {setupData.playlistItems.length === 0 ? (
                <Box sx={{ p: 4, bgcolor: '#f9f9f9', border: '1px dashed #ddd', textAlign: 'center' }}>
                <UploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2">A playlist está vazia. Adicione conteúdo acima.</Typography>
                </Box>
            ) : (
                <List dense sx={{ bgcolor: 'background.paper', border: '1px solid #eee', borderRadius: 1, maxHeight: 300, overflow: 'auto' }}>
                    {setupData.playlistItems.map((item, index) => (
                        <ListItem key={index} divider>
                            <ListItemText 
                                primary={item.title || item.source} 
                                secondary={`Duração: ${item.duration}s | Tipo: ${item.type === 'stream' ? 'Stream' : 'Arquivo'}`} 
                            />
                            <ListItemSecondaryAction>
                                <IconButton edge="end" onClick={() => removePlaylistItem(index)}>
                                    <DeleteIcon />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            )}

            {/* Library Dialog */}
            <Dialog open={libraryOpen} onClose={() => setLibraryOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Selecionar Mídia</DialogTitle>
                <DialogContent dividers>
                    <List>
                        {libraryItems.map((item) => (
                            <ListItem button key={item.path} onClick={() => addLibraryItem(item)}>
                                <ListItemText primary={item.filename} secondary={`${(item.size / 1024 / 1024).toFixed(2)} MB`} />
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLibraryOpen(false)}>Cancelar</Button>
                </DialogActions>
            </Dialog>

             {/* External Stream Dialog */}
             <Dialog open={externalOpen} onClose={() => setExternalOpen(false)}>
                <DialogTitle>Adicionar Stream Externo</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="URL do Stream (RTMP/HLS/HTTP)"
                        fullWidth
                        value={externalUrl}
                        onChange={(e) => setExternalUrl(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="Duração Estimada (segundos)"
                        type="number"
                        fullWidth
                        value={externalDuration}
                        onChange={(e) => setExternalDuration(e.target.value)}
                        helperText="Para streams 24/7, coloque um valor alto (ex: 86400)"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setExternalOpen(false)}>Cancelar</Button>
                    <Button onClick={addExternalItem} variant="contained">Adicionar</Button>
                </DialogActions>
            </Dialog>
          </Box>
        );
      case 3:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>Configuração de Transmissão</Typography>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Tipo de Saída</InputLabel>
              <Select
                value={setupData.outputType}
                label="Tipo de Saída"
                onChange={(e) => setSetupData({ ...setupData, outputType: e.target.value })}
              >
                <MenuItem value="hls">HLS (Web/Mobile)</MenuItem>
                <MenuItem value="rtmp">RTMP (Social Media/Youtube)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="URL / Stream Key"
              value={setupData.outputUrl}
              onChange={(e) => setSetupData({ ...setupData, outputUrl: e.target.value })}
            />
          </Box>
        );
      case 4:
        return (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>Tudo Pronto!</Typography>
            <Typography variant="body1">
              O seu canal está configurado e pronto para emitir.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Clique em finalizar para ir ao Dashboard e clicar em <b>START</b>.
            </Typography>
          </Box>
        );
      default:
        return 'Passo desconhecido';
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Card raised>
        <CardContent sx={{ p: 4 }}>
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
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Anterior
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
              endIcon={activeStep === steps.length - 1 ? <CheckCircleIcon /> : null}
            >
              {activeStep === steps.length - 1 ? 'Finalizar' : 'Próximo'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
