import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { createTheme } from '@mui/material/styles';
import useAuthStore from '../stores/authStore';
import axios from 'axios';

// ─── Default theme config (matches existing neon dark aesthetic) ────────────
const DEFAULT_CONFIG = {
  primary: '#00e5ff',
  secondary: '#9c27b0',
  background: '#050608',
  surface: 'rgba(13, 15, 20, 0.7)',
};

// ─── Build a full MUI theme from a config object ────────────────────────────
export function buildMuiTheme(config = {}) {
  const c = { ...DEFAULT_CONFIG, ...config };
  return createTheme({
    palette: {
      mode: 'dark',
      primary: { main: c.primary },
      secondary: { main: c.secondary },
      background: {
        default: c.background,
        paper: c.surface,
      },
      text: {
        primary: '#ffffff',
        secondary: 'rgba(255, 255, 255, 0.6)',
      },
      divider: 'rgba(255, 255, 255, 0.05)',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 800, letterSpacing: '-0.02em' },
      h2: { fontWeight: 800, letterSpacing: '-0.01em' },
      h4: { fontWeight: 700, letterSpacing: '-0.01em' },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: '#2b2b2b #0a0b10',
            '&::-webkit-scrollbar, & *::-webkit-scrollbar': { backgroundColor: '#0a0b10', width: '8px' },
            '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': { borderRadius: 8, backgroundColor: '#2b2b2b', minHeight: 24, border: '2px solid #0a0b10' },
            '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': { backgroundColor: '#959595' },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none', backgroundColor: c.surface, backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 20 },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 8, transition: 'all 0.2s ease-in-out', '&:hover': { boxShadow: `0 0 15px ${c.primary}66` } },
          containedPrimary: { background: `linear-gradient(45deg, ${c.primary} 30%, ${c.primary}bb 90%)`, color: '#0a0b10' },
        },
      },
      MuiDialog: {
        styleOverrides: { paper: { backgroundColor: 'rgba(12, 13, 22, 0.98)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 20 } },
      },
      MuiCard: {
        styleOverrides: {
          root: { backgroundColor: 'rgba(14, 15, 25, 0.95)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 16, transition: 'transform 0.2s ease-in-out, border-color 0.2s ease-in-out', '&:hover': { borderColor: `${c.primary}4d`, transform: 'translateY(-4px)' } },
        },
      },
      MuiDrawer: {
        styleOverrides: { paper: { backgroundColor: 'rgba(10, 11, 18, 0.99)', borderRight: '1px solid rgba(255, 255, 255, 0.1)' } },
      },
      MuiAppBar: {
        styleOverrides: { root: { backgroundColor: 'rgba(5, 6, 8, 0.8)', backdropFilter: 'blur(12px)', boxShadow: 'none', borderBottom: '1px solid rgba(255, 255, 255, 0.03)' } },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8, margin: '4px 8px',
            '&.Mui-selected': { backgroundColor: `${c.primary}1a`, color: c.primary, '& .MuiListItemIcon-root': { color: c.primary }, '&:hover': { backgroundColor: `${c.primary}26` } },
          },
        },
      },
    },
  });
}

// ─── Apply CSS variables to :root for components that use them ───────────────
function applyCssVars(config) {
  const c = { ...DEFAULT_CONFIG, ...config };
  const root = document.documentElement;
  root.style.setProperty('--primary-color', c.primary);
  root.style.setProperty('--secondary-color', c.secondary);
  root.style.setProperty('--bg-color', c.background);
  root.style.setProperty('--surface-color', c.surface);
}

// ─── Context ─────────────────────────────────────────────────────────────────
const ThemeContext = createContext(null);

export function ThemeContextProvider({ children, onThemeChange }) {
  const { user, token } = useAuthStore();
  const [themeConfig, setThemeConfig] = useState(DEFAULT_CONFIG);
  const [availableThemes, setAvailableThemes] = useState([]);

  // Load user preferences from backend on login
  useEffect(() => {
    if (!user?.id || !token) return;

    const load = async () => {
      try {
        const [prefsRes, themesRes] = await Promise.all([
          axios.get(`/api/v2/analytics/preferences/${user.id}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/v2/analytics/themes', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        setAvailableThemes(themesRes.data || []);

        const prefs = prefsRes.data;
        if (prefs?.theme_id && themesRes.data) {
          const found = themesRes.data.find((t) => t.id === prefs.theme_id);
          if (found?.config) {
            const config = typeof found.config === 'string' ? JSON.parse(found.config) : found.config;
            setThemeConfig(config);
            applyCssVars(config);
            onThemeChange?.(buildMuiTheme(config));
          }
        }
      } catch {
        // Fail silently — default theme applies
      }
    };

    load();
  }, [user?.id, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyTheme = useCallback(async (config, themeId) => {
    setThemeConfig(config);
    applyCssVars(config);
    onThemeChange?.(buildMuiTheme(config));

    // Persist user preference
    if (user?.id && token) {
      try {
        await axios.put(
          `/api/v2/analytics/preferences/${user.id}`,
          { theme_id: themeId, config: {} },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } catch {
        // Non-fatal
      }
    }
  }, [user?.id, token, onThemeChange]);

  const value = useMemo(() => ({ themeConfig, availableThemes, applyTheme }), [themeConfig, availableThemes, applyTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used inside ThemeContextProvider');
  return ctx;
}
