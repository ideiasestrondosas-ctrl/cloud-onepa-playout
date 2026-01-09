import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Container,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';

const steps = [
  'Bem-vindo',
  'Configuração de Output',
  'Resolução e Bitrate',
  'Diretório de Media',
  'Configurações de Filler',
  'Finalização',
];

export default function Wizard() {
  const [activeStep, setActiveStep] = useState(0);
  const [config, setConfig] = useState({
    outputType: 'rtmp',
    outputUrl: '',
    resolution: '1920x1080',
    fps: '25',
    bitrate: '5000k',
    audioBitrate: '192k',
    mediaPath: '/var/lib/onepa-playout/media',
    fillerPath: '/var/lib/onepa-playout/fillers',
  });
  const navigate = useNavigate();

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleFinish = () => {
    // TODO: Save configuration to backend
    console.log('Configuration:', config);
    navigate('/');
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Bem-vindo ao Cloud Onepa Playout
            </Typography>
            <Typography variant="body1" paragraph>
              Este assistente irá guiá-lo através da configuração inicial do sistema.
            </Typography>
            <Alert severity="info">
              A configuração pode ser alterada posteriormente nas Configurações.
            </Alert>
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configuração de Output
            </Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Tipo de Output</InputLabel>
              <Select
                value={config.outputType}
                label="Tipo de Output"
                onChange={(e) => setConfig({ ...config, outputType: e.target.value })}
              >
                <MenuItem value="rtmp">RTMP Stream</MenuItem>
                <MenuItem value="hls">HLS</MenuItem>
                <MenuItem value="srt">SRT</MenuItem>
                <MenuItem value="udp">UDP</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="URL de Output"
              value={config.outputUrl}
              onChange={(e) => setConfig({ ...config, outputUrl: e.target.value })}
              sx={{ mt: 2 }}
              placeholder="rtmp://localhost:1935/live/stream"
            />
          </Box>
        );
      
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Resolução e Bitrate
            </Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Resolução</InputLabel>
              <Select
                value={config.resolution}
                label="Resolução"
                onChange={(e) => setConfig({ ...config, resolution: e.target.value })}
              >
                <MenuItem value="1280x720">720p (1280x720)</MenuItem>
                <MenuItem value="1920x1080">1080p (1920x1080)</MenuItem>
                <MenuItem value="3840x2160">4K (3840x2160)</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>FPS</InputLabel>
              <Select
                value={config.fps}
                label="FPS"
                onChange={(e) => setConfig({ ...config, fps: e.target.value })}
              >
                <MenuItem value="24">24 fps</MenuItem>
                <MenuItem value="25">25 fps</MenuItem>
                <MenuItem value="30">30 fps</MenuItem>
                <MenuItem value="60">60 fps</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Bitrate de Vídeo"
              value={config.bitrate}
              onChange={(e) => setConfig({ ...config, bitrate: e.target.value })}
              sx={{ mt: 2 }}
              placeholder="5000k"
            />
            <TextField
              fullWidth
              label="Bitrate de Áudio"
              value={config.audioBitrate}
              onChange={(e) => setConfig({ ...config, audioBitrate: e.target.value })}
              sx={{ mt: 2 }}
              placeholder="192k"
            />
          </Box>
        );
      
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Diretório de Media
            </Typography>
            <TextField
              fullWidth
              label="Caminho para Media"
              value={config.mediaPath}
              onChange={(e) => setConfig({ ...config, mediaPath: e.target.value })}
              sx={{ mt: 2 }}
              helperText="Diretório onde os ficheiros de vídeo/áudio serão armazenados"
            />
          </Box>
        );
      
      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configurações de Filler
            </Typography>
            <TextField
              fullWidth
              label="Caminho para Fillers"
              value={config.fillerPath}
              onChange={(e) => setConfig({ ...config, fillerPath: e.target.value })}
              sx={{ mt: 2 }}
              helperText="Diretório com vídeos para preencher espaços vazios na playlist"
            />
            <Alert severity="info" sx={{ mt: 2 }}>
              Fillers são usados automaticamente quando a playlist não completa 24 horas.
            </Alert>
          </Box>
        );
      
      case 5:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configuração Concluída!
            </Typography>
            <Typography variant="body1" paragraph>
              Reveja as suas configurações:
            </Typography>
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="body2">Output: {config.outputType.toUpperCase()}</Typography>
              <Typography variant="body2">URL: {config.outputUrl || 'Não configurado'}</Typography>
              <Typography variant="body2">Resolução: {config.resolution}</Typography>
              <Typography variant="body2">FPS: {config.fps}</Typography>
              <Typography variant="body2">Bitrate: {config.bitrate}</Typography>
              <Typography variant="body2">Media Path: {config.mediaPath}</Typography>
            </Paper>
          </Box>
        );
      
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Configuração Inicial
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mt: 4, mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Paper sx={{ p: 4, mt: 3 }}>
          {getStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Voltar
            </Button>
            <Button
              variant="contained"
              onClick={activeStep === steps.length - 1 ? handleFinish : handleNext}
            >
              {activeStep === steps.length - 1 ? 'Finalizar' : 'Próximo'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
