import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { settingsAPI } from '../services/api';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  VideoLibrary as VideoLibraryIcon,
  PlaylistPlay as PlaylistPlayIcon,
  CalendarMonth as CalendarIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ViewModule as TemplatesIcon,
  Help as HelpIcon,
  LiveTv as LiveTvIcon,
  Brush as GraphicsIcon,
} from '@mui/icons-material';
import { useHelp } from '../context/HelpContext';
import ConnectivityStatus from './ConnectivityStatus';

const AppLogo = ({ version }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', px: 2, py: 2 }}>
    <Box sx={{ 
      width: '100%', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <video 
        src="/assets/protected/Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4" 
        autoPlay 
        loop 
        muted 
        playsInline
        style={{ width: '100%', height: 'auto', maxHeight: '80px', objectFit: 'contain' }}
      />
    </Box>
    <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, fontSize: '0.75rem', fontWeight: 'bold', textAlign: 'center' }}>
    </Typography>
  </Box>
);

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Media Library', icon: <VideoLibraryIcon />, path: '/media' },
  { text: 'Playlists', icon: <PlaylistPlayIcon />, path: '/playlists' },
  { text: 'Calendário', icon: <CalendarIcon />, path: '/calendar' },
  { text: 'EPG', icon: <LiveTvIcon />, path: '/epg' },
  { text: 'Graphics', icon: <GraphicsIcon />, path: '/graphics' },
  { text: 'Templates', icon: <TemplatesIcon />, path: '/templates' },
  { text: 'Configurações', icon: <SettingsIcon />, path: '/settings' },
];

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [version, setVersion] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const { showHelp } = useHelp();

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await settingsAPI.get();
        setVersion(response.data.system_version);
      } catch (err) {
        console.error('Failed to fetch system version:', err);
      }
    };
    fetchVersion();
  }, []);

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const clockInterval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('pt-PT', { 
        weekday: 'short', 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
    }).replace('.', '');
  };

  const drawer = (
    <div>
      <Toolbar sx={{ display: 'flex', justifyContent: 'center', py: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
        <AppLogo version={version} />
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <Tooltip title={item.text} placement="right" arrow>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <Tooltip title="Sair do sistema" placement="right" arrow>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
      <ConnectivityStatus />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'rgba(10, 11, 16, 0.5)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'none',
          color: 'text.primary'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
                    <Typography 
                        variant="h4" 
                        className="neon-text"
                        sx={{ 
                            fontFamily: '"Orbitron", "monospace"', 
                            fontWeight: '700', 
                            lineHeight: 1,
                            fontSize: { xs: '1.5rem', md: '2rem' }
                        }}
                    >
                        {now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </Typography>
                    <Typography 
                        variant="subtitle2" 
                        sx={{ 
                            color: 'text.secondary', 
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: 2,
                            fontSize: '0.7rem'
                        }}
                    >
                        {formatDate(now)}
                    </Typography>
                </Box>
            </Box>
            <Tooltip title="Ajuda & Documentação" arrow>
              <IconButton 
                color="inherit"
                onClick={() => showHelp()}
                sx={{ '&:hover': { color: 'primary.main' } }}
              >
                <HelpIcon />
              </IconButton>
            </Tooltip>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: 'rgba(10, 11, 16, 0.9)',
              backdropFilter: 'blur(20px)',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)'
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: 'rgba(10, 11, 16, 0.8)',
              backdropFilter: 'blur(12px)',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          background: 'transparent',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

