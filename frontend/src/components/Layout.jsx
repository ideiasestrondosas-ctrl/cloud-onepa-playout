import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
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
} from '@mui/icons-material';
import { useHelp } from '../context/HelpContext';
import ConnectivityStatus from './ConnectivityStatus';

const AppLogo = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', px: 2, py: 1 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ 
        width: 32, 
        height: 32, 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <img 
          src={`/api/settings/app-logo?t=${Date.now()}`} 
          alt="Logo" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          onError={(e) => { e.target.src = 'https://via.placeholder.com/32?text=C'; }}
        />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.1rem' }}>
        Cloud Onepa Playout v1.8.0-PRO
      </Typography>
    </Box>
    <Typography variant="caption" sx={{ color: 'text.secondary', ml: 5, mt: -0.5, fontSize: '0.7rem' }}>
      v1.8.0-PRO
    </Typography>
  </Box>
);

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Media Library', icon: <VideoLibraryIcon />, path: '/media' },
  { text: 'Playlists', icon: <PlaylistPlayIcon />, path: '/playlists' },
  { text: 'Calendário', icon: <CalendarIcon />, path: '/calendar' },
  { text: 'Templates', icon: <TemplatesIcon />, path: '/templates' },
  { text: 'Configurações', icon: <SettingsIcon />, path: '/settings' },
];

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const { showHelp } = useHelp();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawer = (
    <div>
      <Toolbar sx={{ display: 'flex', justifyContent: 'center', py: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
        <AppLogo />
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <ConnectivityStatus />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
              <Typography variant="h6" noWrap component="div">
                ONEPA PRO PLAYOUT
              </Typography>
            </Box>
            <IconButton 
              color="inherit"
              onClick={() => showHelp()}
              title="Ajuda"
            >
              <HelpIcon />
            </IconButton>
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
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
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
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
