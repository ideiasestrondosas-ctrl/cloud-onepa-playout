import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import MediaLibrary from './pages/MediaLibrary';
import PlaylistEditor from './pages/PlaylistEditor';
import Calendar from './pages/Calendar';
import Settings from './pages/Settings';
import Templates from './pages/Templates';
import Login from './pages/Login';
import useAuthStore from './stores/authStore';
import SetupWizard from './pages/Setup/Wizard';
import EPGView from './pages/EPGView';
import { NotificationProvider } from './contexts/NotificationContext';
import { HelpProvider } from './context/HelpContext';
import HelpSystem from './components/HelpSystem';
import ConnectivityStatus from './components/ConnectivityStatus';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
      <HelpProvider>
        <HelpSystem />
        <ConnectivityStatus />
        <Router>
        <Routes>
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
          />
          {/* Default redirect for unauthenticated root access */}
          {!isAuthenticated && (
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/media"
            element={
              <ProtectedRoute>
                <Layout>
                  <MediaLibrary />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/playlists"
            element={
              <ProtectedRoute>
                <Layout>
                  <PlaylistEditor />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <Layout>
                  <Calendar />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/epg"
            element={
              <ProtectedRoute>
                <Layout>
                  <EPGView />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/setup"
            element={
              <ProtectedRoute>
                <Layout>
                  <SetupWizard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/templates"
            element={
              <ProtectedRoute>
                <Layout>
                  <Templates />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* Fallback for any unknown route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </HelpProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
