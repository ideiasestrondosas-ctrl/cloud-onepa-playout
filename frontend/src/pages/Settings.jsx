import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Settings() {
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState({
    // Output settings
    outputType: 'rtmp',
    outputUrl: 'rtmp://localhost:1935/live/stream',
    resolution: '1920x1080',
    fps: '25',
    videoBitrate: '5000k',
    audioBitrate: '192k',
    
    // Paths
    mediaPath: '/var/lib/onepa-playout/media',
    thumbnailsPath: '/var/lib/onepa-playout/thumbnails',
    playlistsPath: '/var/lib/onepa-playout/playlists',
    fillersPath: '/var/lib/onepa-playout/fillers',
    
    // Playout
    dayStart: '06:00',
    enableLoudnessNorm: true,
    logoPath: '',
    logoPosition: 'top-right',
  });

  const [users, setUsers] = useState([
    { id: 1, username: 'admin', role: 'admin' },
  ]);

  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'operator' });
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = async () => {
    setSaving(true);
    // TODO: Save to backend
    console.log('Saving settings:', settings);
    setTimeout(() => {
      setSaving(false);
      alert('Configurações salvas com sucesso!');
    }, 1000);
  };

  const handleAddUser = () => {
    if (!newUser.username || !newUser.password) {
      alert('Preencha todos os campos');
      return;
    }
    
    // TODO: Create user via API
    setUsers([...users, { id: Date.now(), ...newUser }]);
    setUserDialogOpen(false);
    setNewUser({ username: '', password: '', role: 'operator' });
  };

  const handleDeleteUser = (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este utilizador?')) return;
    setUsers(users.filter(u => u.id !== id));
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Configurações
      </Typography>

      <Card>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Output" />
          <Tab label="Caminhos" />
          <Tab label="Playout" />
          <Tab label="Utilizadores" />
          <Tab label="Presets" />
        </Tabs>

        {/* Output Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Configuração de Output
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Output</InputLabel>
                <Select
                  value={settings.outputType}
                  label="Tipo de Output"
                  onChange={(e) => setSettings({ ...settings, outputType: e.target.value })}
                >
                  <MenuItem value="rtmp">RTMP Stream</MenuItem>
                  <MenuItem value="hls">HLS</MenuItem>
                  <MenuItem value="srt">SRT</MenuItem>
                  <MenuItem value="udp">UDP</MenuItem>
                  <MenuItem value="desktop">Desktop (Preview)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="URL de Output"
                value={settings.outputUrl}
                onChange={(e) => setSettings({ ...settings, outputUrl: e.target.value })}
                placeholder="rtmp://localhost:1935/live/stream"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Qualidade de Vídeo
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Resolução</InputLabel>
                <Select
                  value={settings.resolution}
                  label="Resolução"
                  onChange={(e) => setSettings({ ...settings, resolution: e.target.value })}
                >
                  <MenuItem value="1280x720">720p (1280x720)</MenuItem>
                  <MenuItem value="1920x1080">1080p (1920x1080)</MenuItem>
                  <MenuItem value="3840x2160">4K (3840x2160)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>FPS</InputLabel>
                <Select
                  value={settings.fps}
                  label="FPS"
                  onChange={(e) => setSettings({ ...settings, fps: e.target.value })}
                >
                  <MenuItem value="24">24 fps</MenuItem>
                  <MenuItem value="25">25 fps</MenuItem>
                  <MenuItem value="30">30 fps</MenuItem>
                  <MenuItem value="60">60 fps</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Bitrate de Vídeo"
                value={settings.videoBitrate}
                onChange={(e) => setSettings({ ...settings, videoBitrate: e.target.value })}
                placeholder="5000k"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Bitrate de Áudio"
                value={settings.audioBitrate}
                onChange={(e) => setSettings({ ...settings, audioBitrate: e.target.value })}
                placeholder="192k"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Paths Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Caminhos de Armazenamento
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Certifique-se de que os diretórios existem e têm permissões adequadas.
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Caminho de Media"
                value={settings.mediaPath}
                onChange={(e) => setSettings({ ...settings, mediaPath: e.target.value })}
                helperText="Diretório onde os ficheiros de vídeo/áudio são armazenados"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Caminho de Thumbnails"
                value={settings.thumbnailsPath}
                onChange={(e) => setSettings({ ...settings, thumbnailsPath: e.target.value })}
                helperText="Diretório para thumbnails gerados automaticamente"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Caminho de Playlists"
                value={settings.playlistsPath}
                onChange={(e) => setSettings({ ...settings, playlistsPath: e.target.value })}
                helperText="Diretório para ficheiros JSON de playlists"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Caminho de Fillers"
                value={settings.fillersPath}
                onChange={(e) => setSettings({ ...settings, fillersPath: e.target.value })}
                helperText="Diretório com vídeos para preencher espaços vazios"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Playout Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Configurações de Playout
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Início do Dia"
                type="time"
                value={settings.dayStart}
                onChange={(e) => setSettings({ ...settings, dayStart: e.target.value })}
                InputLabelProps={{ shrink: true }}
                helperText="Horário de início do dia de programação (ex: 06:00)"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Overlay e Logo
              </Typography>
            </Grid>

            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Caminho do Logo"
                value={settings.logoPath}
                onChange={(e) => setSettings({ ...settings, logoPath: e.target.value })}
                placeholder="/path/to/logo.png"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Posição do Logo</InputLabel>
                <Select
                  value={settings.logoPosition}
                  label="Posição do Logo"
                  onChange={(e) => setSettings({ ...settings, logoPosition: e.target.value })}
                >
                  <MenuItem value="top-left">Superior Esquerdo</MenuItem>
                  <MenuItem value="top-right">Superior Direito</MenuItem>
                  <MenuItem value="bottom-left">Inferior Esquerdo</MenuItem>
                  <MenuItem value="bottom-right">Inferior Direito</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Users Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Utilizadores
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setUserDialogOpen(true)}
            >
              Adicionar Utilizador
            </Button>
          </Box>

          <List>
            {users.map((user) => (
              <ListItem
                key={user.id}
                secondaryAction={
                  user.username !== 'admin' && (
                    <IconButton edge="end" onClick={() => handleDeleteUser(user.id)}>
                      <DeleteIcon />
                    </IconButton>
                  )
                }
                sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1 }}
              >
                <ListItemText
                  primary={user.username}
                  secondary={`Role: ${user.role}`}
                />
              </ListItem>
            ))}
          </List>
        </TabPanel>

        {/* Presets Tab */}
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>
            Presets de Configuração
          </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            Clique num preset para aplicar configurações pré-definidas
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined" sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    720p Streaming
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    1280x720 @ 25fps<br />
                    Bitrate: 2500k<br />
                    Ideal para streaming básico
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined" sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    1080p HD
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    1920x1080 @ 25fps<br />
                    Bitrate: 5000k<br />
                    Qualidade profissional
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined" sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    4K Ultra HD
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    3840x2160 @ 30fps<br />
                    Bitrate: 15000k<br />
                    Máxima qualidade
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderTop: 1, borderColor: 'divider' }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? 'A Guardar...' : 'Guardar Configurações'}
          </Button>
        </Box>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Utilizador</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Username"
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            sx={{ mt: 2 }}
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={newUser.role}
              label="Role"
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="operator">Operator</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleAddUser}>
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
