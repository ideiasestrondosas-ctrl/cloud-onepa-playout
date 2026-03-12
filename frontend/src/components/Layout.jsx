import { useState, useEffect, memo } from 'react';
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
  CircularProgress,
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
  MonitorHeart as HealthIcon,
  Input as InputIcon,
  GridView as GridViewIcon,
} from '@mui/icons-material';
import { useHelp } from '../context/HelpContext';
import { useTranslation } from 'react-i18next';
import ConnectivityStatus from './ConnectivityStatus';
import LanguageSelector from './LanguageSelector';

// === PERFORMANCE: Isolated clock component — only this re-renders every second ===
const AppClock = memo(() => {
  const [now, setNow] = useState(new Date());
  const { i18n } = useTranslation();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const formatDate = (date) =>
    date.toLocaleDateString(i18n.language === 'pt' ? 'pt-PT' : i18n.language, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).replace('.', '');

  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
      <Typography
        variant="h4"
        className="neon-text"
        sx={{
          fontFamily: '"Orbitron", "monospace"',
          fontWeight: '700',
          lineHeight: 1,
          fontSize: { xs: '1.5rem', md: '2rem' },
        }}
      >
        {now.toLocaleTimeString(i18n.language === 'pt' ? 'pt-PT' : i18n.language, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </Typography>
      <Typography
        variant="subtitle2"
        sx={{
          color: 'text.secondary',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 2,
          fontSize: '0.7rem',
        }}
      >
        {formatDate(now)}
      </Typography>
    </Box>
  );
});
AppClock.displayName = 'AppClock';

const AppLogo = ({ version, settings, loading }) => {
  const location = useLocation();

  if (loading || !settings) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2.5, minHeight: '120px' }}>
        <CircularProgress size={24} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', px: 2, py: 2.5 }}>
      <Box sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80px',
      }}>
        {settings.branding_type !== 'static' ? (
          <video
            src={settings.logo_path || "/assets/protected/Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4"}
            autoPlay
            loop
            muted
            playsInline
            style={{ width: '100%', height: 'auto', maxHeight: '80px', objectFit: 'contain' }}
            onError={(e) => {
              e.target.src = "/assets/protected/Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4";
            }}
          />
        ) : (
          <Box
            component="img"
            src={settings.logo_path || "/assets/protected/Cloud_Onepa_Playout_Infinity_Logo_remodelado.png"}
            sx={{ width: '100%', height: 'auto', maxHeight: '80px', objectFit: 'contain' }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}
      </Box>

      {/* ONEPA PLAYOUT Text */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="subtitle2" className="neon-text" sx={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: 1.5, mb: 0.5 }}>
          ONEPA PLAYOUT
        </Typography>
      </Box>
    </Box>
  );
};

const drawerWidth = 240;

const menuItems = [
  { key: 'navigation.dashboard', icon: <DashboardIcon />, path: '/' },
  { key: 'navigation.media', icon: <VideoLibraryIcon />, path: '/media' },
  { key: 'navigation.playlists', icon: <PlaylistPlayIcon />, path: '/playlists' },
  { key: 'navigation.calendar', icon: <CalendarIcon />, path: '/calendar' },
  { key: 'navigation.graphics', icon: <GraphicsIcon />, path: '/graphics' },
  { key: 'epg.title', icon: <LiveTvIcon />, path: '/epg' },
  { key: 'navigation.liveInputs', icon: <InputIcon />, path: '/live-inputs' },
  { key: 'navigation.multiChannel', icon: <GridViewIcon />, path: '/multi-channel' },
  { key: 'navigation.templates', icon: <TemplatesIcon />, path: '/templates' },
  { key: 'navigation.health', icon: <HealthIcon />, path: '/health' },
  { key: 'navigation.settings', icon: <SettingsIcon />, path: '/settings' },
];

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [version, setVersion] = useState('');
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const { showHelp } = useHelp();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoadingSettings(true);
        const response = await settingsAPI.get();
         setVersion(response.data.system_version || 'v2.6.0-ALPHA.47-PRO');
        const data = response.data;
        if (!data.branding_type) {
          data.branding_type = 'video';
          data.logo_path = data.logo_path || '/assets/protected/Video_Cloud_Onepa_Playout_Infinity_Logo_remodelado.mp4';
        }
        setSettings(data);
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AppLogo version={version} settings={settings} loading={loadingSettings} />
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mb: 1 }} />
      <List sx={{ pt: 1, flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.key} disablePadding>
            <Tooltip title={t(item.key)} placement="right" arrow>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={t(item.key)} />
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
      <ConnectivityStatus />
      {/* PERFORMANCE: backdrop-filter:blur removed — use solid opaque bg instead */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'rgba(10, 11, 16, 0.97)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
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
              {/* PERFORMANCE: AppClock is isolated — re-renders every 1s without causing Layout re-render */}
              <AppClock />

              {version && version.includes('ALPHA') && (
                <Box sx={{
                  display: 'inline-block',
                  px: 1.5,
                  py: 0.4,
                  bgcolor: '#cc0000',
                  borderRadius: 1,
                  border: '1px solid #ff2222',
                  ml: 1,
                  animation: 'alphaBlink 1.2s ease-in-out infinite',
                  '@keyframes alphaBlink': {
                    '0%, 100%': { bgcolor: '#cc0000', boxShadow: '0 0 6px rgba(255,0,0,0.6)' },
                    '50%': { bgcolor: '#ff0000', boxShadow: '0 0 14px rgba(255,0,0,0.9)' },
                  },
                }}>
                  <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 900, fontSize: '0.75rem', letterSpacing: 1.5, textShadow: '0px 1px 2px rgba(0,0,0,0.8)' }}>
                    {version}
                  </Typography>
                </Box>
              )}
            </Box>

            <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.1)', height: 25, mx: 1 }} />
          </Box>

          <Box sx={{ mr: 2 }}>
            <LanguageSelector />
          </Box>

          <Tooltip title={t('navigation.help')} arrow>
            <IconButton
              color="inherit"
              onClick={() => showHelp()}
              sx={{ '&:hover': { color: 'primary.main' } }}
            >
              <HelpIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('navigation.logout')} arrow>
            <IconButton
              onClick={handleLogout}
              sx={{
                color: '#cc0000',
                ml: 0.5,
                '&:hover': { color: '#ff2222', bgcolor: 'rgba(204,0,0,0.1)' },
              }}
            >
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* PERFORMANCE: backdrop-filter:blur removed from both Drawers */}
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
              backgroundColor: 'rgba(10, 11, 16, 0.98)',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)'
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
              backgroundColor: 'rgba(10, 11, 16, 0.98)',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)'
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
