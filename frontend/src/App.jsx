import { lazy, Suspense, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { buildMuiTheme, ThemeContextProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import useAuthStore from './stores/authStore';
import { NotificationProvider } from './contexts/NotificationContext';
import { HelpProvider } from './context/HelpContext';
import HelpSystem from './components/HelpSystem';
import ConnectivityStatus from './components/ConnectivityStatus';

// ─── Lazy-loaded pages ─────────────────────────────────────────────────────
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MediaLibrary = lazy(() => import('./pages/MediaLibrary'));
const PlaylistEditor = lazy(() => import('./pages/PlaylistEditor'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Settings = lazy(() => import('./pages/Settings'));
const Templates = lazy(() => import('./pages/Templates'));
const Login = lazy(() => import('./pages/Login'));
const SetupWizard = lazy(() => import('./pages/Setup/Wizard'));
const EPGView = lazy(() => import('./pages/EPGView'));
const GraphicsEditor = lazy(() => import('./pages/GraphicsEditor'));
const PlayoutHealth = lazy(() => import('./pages/PlayoutHealth'));
const LiveInputs = lazy(() => import('./pages/LiveInputs'));
const MultiChannelPanel = lazy(() => import('./components/MultiChannelPanel'));

// ─── Shared loading fallback ───────────────────────────────────────────────
const PageLoader = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a1a' }}>
    <CircularProgress sx={{ color: '#00bcd4' }} />
  </Box>
);

// ─── Protected layout wrapper ──────────────────────────────────────────────
const ProtectedLayout = ({ children }) => (
  <ProtectedRoute>
    <Layout>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </Layout>
  </ProtectedRoute>
);

function App() {
  const { isAuthenticated } = useAuthStore();

  // Phase 2A: runtime-switchable MUI theme — ThemeContextProvider calls this
  // whenever the user changes their theme preference.
  const [muiTheme, setMuiTheme] = useState(() => buildMuiTheme());
  const handleThemeChange = useCallback((newTheme) => setMuiTheme(newTheme), []);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <NotificationProvider>
        <HelpProvider>
          <ThemeContextProvider onThemeChange={handleThemeChange}>
            <HelpSystem />
            <ConnectivityStatus />
            <Router>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route
                    path="/login"
                    element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
                  />
                  {!isAuthenticated && (
                    <Route path="*" element={<Navigate to="/login" replace />} />
                  )}
                  <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
                  <Route path="/media" element={<ProtectedLayout><MediaLibrary /></ProtectedLayout>} />
                  <Route path="/playlists" element={<ProtectedLayout><PlaylistEditor /></ProtectedLayout>} />
                  <Route path="/calendar" element={<ProtectedLayout><Calendar /></ProtectedLayout>} />
                  <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
                  <Route path="/epg" element={<ProtectedLayout><EPGView /></ProtectedLayout>} />
                  <Route path="/setup" element={<ProtectedLayout><SetupWizard /></ProtectedLayout>} />
                  <Route path="/graphics" element={<ProtectedLayout><GraphicsEditor /></ProtectedLayout>} />
                  <Route path="/templates" element={<ProtectedLayout><Templates /></ProtectedLayout>} />
                  <Route path="/health" element={<ProtectedLayout><PlayoutHealth /></ProtectedLayout>} />
                  <Route path="/live-inputs" element={<ProtectedLayout><LiveInputs /></ProtectedLayout>} />
                  <Route path="/multi-channel" element={<ProtectedLayout><MultiChannelPanel /></ProtectedLayout>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </Router>
          </ThemeContextProvider>
        </HelpProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
