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
import { settingsAPI, mediaAPI, playlistAPI, scheduleAPI, playoutAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const steps = ['Boas-vindas', 'Identidade', 'Média', 'Transmissão', 'Resumo', 'Finalizar'];

export default function SetupWizard() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const [setupData, setSetupData] = useState({
    channelName: 'Meu Canal Onepa',
    logoFile: null,
    outputType: 'hls',
    outputUrl: 'http://localhost:3000/hls/stream.m3u8',
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
      showError('Erro ao carregar Media Library');
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



  const handleCancel = () => {
    if (window.confirm('Deseja cancelar a configuração? Todas as alterações não guardadas serão perdidas.')) {
        navigate('/');
    }
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
            showSuccess('Identidade configurada!');
        } catch (e) {
            showError('Erro ao salvar identidade');
            setLoading(false);
            return;
        } finally {
            setLoading(false);
        }
    }

    if (activeStep === 2) {
        // Just validate playlist presence, don't create yet
        if (setupData.playlistItems.length === 0) {
            showError('Adicione pelo menos um item à playlist');
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
             showSuccess('Output configurado!');
         } catch (e) {
             showError('Erro ao salvar output');
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
                
                const playlistId = playlistRes?.id || playlistRes?.data?.id;

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
             showSuccess('Emissão iniciada com sucesso!');
           } catch (startErr) {
             console.error('Failed to start engine:', startErr);
             showError('O canal foi configurado mas a transmissão não pôde ser iniciada automaticamente. Verifique os ficheiros no Dashboard.');
           }

           showSuccess('Setup concluído! Redirecionando...');
           setTimeout(() => {
             navigate('/');
           }, 1500);
       } catch (e) {
           console.error(e);
           showError('Erro na finalização: ' + (e.response?.data?.error || e.message));
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
                                    secondary={`Duração: ${durationFormatted} | Tipo: ${item.type === 'stream' ? 'Stream' : 'Arquivo'}`} 
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
                <DialogTitle>Selecionar Mídia (Multi-seleção)</DialogTitle>
                <DialogContent dividers>
                    {selectedLibraryItems.length > 0 && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        {selectedLibraryItems.length} ficheiro(s) selecionado(s)
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
                            <Typography sx={{ p: 2, textAlign: 'center' }}>Nenhuma mídia encontrada na biblioteca.</Typography>
                        )}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setLibraryOpen(false); setSelectedLibraryItems([]); }}>Cancelar</Button>
                    <Button 
                      onClick={addSelectedLibraryItems} 
                      variant="contained" 
                      disabled={selectedLibraryItems.length === 0}
                    >
                      Adicionar ({selectedLibraryItems.length})
                    </Button>
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
                onChange={(e) => {
                  const newType = e.target.value;
                  const newUrl = newType === 'rtmp' 
                    ? 'rtmp://localhost:1935/live/stream' 
                    : 'http://localhost:3000/hls/stream.m3u8';
                  
                  setSetupData({ 
                    ...setupData, 
                    outputType: newType,
                    outputUrl: newUrl
                  });
                }}
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

       case 4: // SUMMARY STEP
         return (
           <Box sx={{ mt: 2 }}>
             <Typography variant="h6" gutterBottom>Resumo das Configurações</Typography>
             <Alert severity="info" sx={{ mb: 3 }}>
               Confirme os dados abaixo antes de finalizar a criação do seu canal.
             </Alert>
             
             <List disablePadding>
               <ListItem divider>
                 <ListItemText primary="Nome do Canal" secondary={setupData.channelName} />
               </ListItem>
               <ListItem divider>
                 <ListItemText primary="Saída de Vídeo" secondary={`${setupData.outputType.toUpperCase()} - ${setupData.outputUrl}`} />
               </ListItem>
               <ListItem divider>
                 <ListItemText primary="Playlist Inicial" secondary={`${setupData.playlistItems.length} itens agendados para 24/7`} />
               </ListItem>
             </List>
           </Box>
         );
       case 5: // FINAL STEP
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h5" gutterBottom>Tudo Pronto!</Typography>
            <Typography variant="body1">
              O seu canal está configurado e pronto para emitir.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Clique em FINALIZAR para aplicar todas as mudanças.
            </Typography>
          </Box>
        );
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
              color="error"
              onClick={handleCancel}
              sx={{ mr: 1 }}
            >
              Cancelar
            </Button>
            <Box>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Anterior
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
              endIcon={activeStep === steps.length - 1 ? <CheckCircleIcon /> : null}
            >
              {activeStep === steps.length - 1 ? 'Confirmar e Finalizar' : 'Próximo'}
            </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
