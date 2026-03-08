import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  LinearProgress,
  IconButton,
  Tooltip,
  Chip,
  Fade,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Monitor as MonitorIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Wifi as WifiIcon,
  Timeline as TimelineIcon,
  PowerSettingsNew as PowerIcon,
  Dns as DnsIcon,
  AccessTime as AccessTimeIcon,
  ReportProblem as ReportProblemIcon,
  ReceiptLong as ReceiptLongIcon,
} from '@mui/icons-material';
import api from '../services/api';

// ─── Sub-Components ─────────────────────────────────────────────────────────

const HealthScoreGauge = ({ score, t }) => {
  const theme = useTheme();
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 90) return theme.palette.success.main;
    if (score >= 70) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const color = getColor();

  return (
    <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center">
      <svg width="120" height="120" className="transform -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke={alpha(color, 0.1)}
          strokeWidth="8"
          fill="transparent"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          style={{
            strokeDashoffset,
            transition: 'stroke-dashoffset 1s ease-in-out',
            strokeLinecap: 'round'
          }}
        />
      </svg>
      <Box
        position="absolute"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
      >
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color }}>
          {score}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 700 }}>
          {score === 100 ? t('health.score.perfect') : t('health.score.health')}
        </Typography>
      </Box>
    </Box>
  );
};

const StatusCard = ({ title, status, message, icon: Icon }) => {
  const theme = useTheme();

  const getStatusConfig = () => {
    switch (status) {
      case 'ok':
        return {
          color: theme.palette.success.main,
          icon: <CheckCircleIcon fontSize="small" />,
          bgcolor: alpha(theme.palette.success.main, 0.05),
          border: alpha(theme.palette.success.main, 0.2),
        };
      case 'warning':
        return {
          color: theme.palette.warning.main,
          icon: <WarningIcon fontSize="small" />,
          bgcolor: alpha(theme.palette.warning.main, 0.05),
          border: alpha(theme.palette.warning.main, 0.2),
        };
      case 'critical':
      case 'error':
        return {
          color: theme.palette.error.main,
          icon: <ErrorIcon fontSize="small" />,
          bgcolor: alpha(theme.palette.error.main, 0.05),
          border: alpha(theme.palette.error.main, 0.2),
        };
      default:
        return {
          color: theme.palette.text.secondary,
          icon: <TimelineIcon fontSize="small" />,
          bgcolor: alpha(theme.palette.text.secondary, 0.05),
          border: alpha(theme.palette.text.secondary, 0.2),
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Card
      variant="outlined"
      sx={{
        bgcolor: config.bgcolor,
        borderColor: config.border,
        height: '100%',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 4px 12px ${alpha(config.color, 0.1)}`
        }
      }}
    >
      <CardContent sx={{ p: '16px !important' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Icon sx={{ color: config.color, opacity: 0.8 }} fontSize="small" />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{title}</Typography>
          </Box>
          <Box sx={{ color: config.color }}>{config.icon}</Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
          {message}
        </Typography>
      </CardContent>
    </Card>
  );
};

const KPICard = ({ label, value, icon: Icon, color }) => {
  const theme = useTheme();
  return (
    <Card variant="outlined" sx={{ height: '100%', border: 'none', bgcolor: 'background.paper', overflow: 'hidden' }}>
      <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {label}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            p: 1.5,
            borderRadius: '12px',
            bgcolor: alpha(color, 0.1),
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon />
        </Box>
      </CardContent>
    </Card>
  );
};

export default function PlayoutHealth() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [liveLogs, setLiveLogs] = useState([]);

  const fetchData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const res = await api.get('/api/settings/diagnostics');
      setData(res.data);
      setLastUpdated(new Date());

      // Simulate/Update live logs
      const newLog = {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        level: res.data.score === 100 ? 'info' : 'warn',
        msg: `Periodic health check performed. System Score: ${res.data.score}%`
      };
      setLiveLogs(prev => [newLog, ...prev].slice(0, 50));
    } catch (err) {
      console.error('Failed to fetch diagnostics', err);
      const errorLog = {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        level: 'error',
        msg: `FAILED to connect to diagnostic service: ${err.message}`
      };
      setLiveLogs(prev => [errorLog, ...prev].slice(0, 50));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(false), 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading && !data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Box textAlign="center">
          <LinearProgress sx={{ width: 240, mb: 2, borderRadius: 2 }} />
          <Typography variant="body2" color="text.secondary">{t('health.initializingDiagnostics')}</Typography>
        </Box>
      </Box>
    );
  }

  const score = data?.score || 0;
  const checks = data?.checks || {};
  const stats = data?.stats || {};

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            {t('health.title', 'Playout Health')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('health.lastUpdate', 'Last update')}: {lastUpdated?.toLocaleTimeString()}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title={t('health.manualRefresh', 'Force Update')}>
            <IconButton
              onClick={() => fetchData(true)}
              disabled={refreshing}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
              }}
            >
              <RefreshIcon className={refreshing ? 'animate-spin' : ''} color="primary" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* KPI Strip */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            label={t('health.kpis.deviceName', 'Playout Host')}
            value={stats.hostname || 'Playout-01'}
            icon={MonitorIcon}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            label={t('health.kpis.clipsPlayed', 'Clips Today')}
            value={stats.clips_played_today || 0}
            icon={ReceiptLongIcon}
            color={theme.palette.info.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            label={t('health.kpis.activeStreams', 'Active Streams')}
            value={stats.active_streams || 1}
            icon={TimelineIcon}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            label={t('health.kpis.lastError', 'Last Error')}
            value={stats.last_error || 'Clean'}
            icon={ReportProblemIcon}
            color={stats.last_error ? theme.palette.error.main : theme.palette.text.disabled}
          />
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Left Column: Health Score & Core Components */}
        <Grid item xs={12} lg={4}>
          <Box display="flex" flexDirection="column" gap={4}>
            {/* Score Card */}
            <Card variant="outlined" sx={{ borderRadius: 3, textAlign: 'center' }}>
              <CardHeader
                title={t('health.systemScore', 'System Score')}
                subheader={t('health.integrityIndex')}
                titleTypographyProps={{ variant: 'subtitle1', sx: { fontWeight: 700 } }}
              />
              <CardContent sx={{ pb: 4 }}>
                <HealthScoreGauge score={score} t={t} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, px: 2 }}>
                  {t('health.scoreDescription')}
                </Typography>
              </CardContent>
            </Card>

            {/* Core Checks */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, px: 1, textTransform: 'uppercase', letterSpacing: '1px' }}>
                {t('health.coreComponents', 'Core Components')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <StatusCard
                    title={t('health.checks.casparEngine')}
                    status={checks.engine_connection?.status || 'warning'}
                    message={checks.engine_connection?.details || t('health.checks.initializingComm')}
                    icon={DnsIcon}
                  />
                </Grid>
                <Grid item xs={12}>
                  <StatusCard
                    title={t('health.checks.database')}
                    status={checks.database?.status || 'ok'}
                    message={checks.database?.details || t('health.checks.awaitingMetrics')}
                    icon={StorageIcon}
                  />
                </Grid>
                <Grid item xs={12}>
                  <StatusCard
                    title={t('health.checks.mediaStorage')}
                    status={checks.media_storage?.status || 'ok'}
                    message={checks.media_storage?.details || t('health.checks.calculatingSpace')}
                    icon={StorageIcon}
                  />
                </Grid>
                <Grid item xs={12}>
                  <StatusCard
                    title={t('health.checks.watchfolder')}
                    status={checks.watchfolder?.status || 'ok'}
                    message={checks.watchfolder?.details || t('health.checks.monitoringWatchfolders')}
                    icon={WifiIcon}
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Grid>

        {/* Right Column: Live Logs & secondary checks */}
        <Grid item xs={12} lg={8}>
          <Box display="flex" flexDirection="column" gap={4}>
            {/* Logs Console */}
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                height: 480,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: alpha('#000', 0.2),
                backdropFilter: 'blur(10px)',
                border: theme => `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              <Box p={2} borderBottom={`1px solid ${alpha(theme.palette.divider, 0.1)}`} display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center" gap={1}>
                  <TimelineIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {t('health.liveDiagnosticsStream')}
                  </Typography>
                </Box>
                <Chip
                  label="LIVE"
                  size="small"
                  color="success"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    fontWeight: 900,
                    animation: 'pulse 2s infinite',
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
              </Box>
              <Box flex={1} overflow="auto" p={2} sx={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { bgcolor: alpha('#fff', 0.1), borderRadius: 2 } }}>
                <Box sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {liveLogs.map((log) => (
                    <Box key={log.id} mb={1} display="flex" gap={2} sx={{ borderBottom: `1px solid ${alpha('#fff', 0.03)}`, pb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.disabled', opacity: 0.5, minWidth: 70 }}>
                        [{log.time}]
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          minWidth: 45,
                          color: log.level === 'error' ? 'error.main' : log.level === 'warn' ? 'warning.main' : 'info.main'
                        }}
                      >
                        {log.level.toUpperCase()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.primary', opacity: 0.9 }}>
                        {log.msg}
                      </Typography>
                    </Box>
                  ))}
                  {liveLogs.length === 0 && (
                    <Box textAlign="center" py={4} sx={{ opacity: 0.3 }}>
                      {t('health.waitingTelemetry')}
                    </Box>
                  )}
                </Box>
              </Box>
            </Card>

            {/* Secondary Checks */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardHeader
                    avatar={<ReportProblemIcon sx={{ color: 'warning.main' }} />}
                    title={t('health.checks.contentAvailability')}
                    titleTypographyProps={{ variant: 'subtitle2', fontWeight: 700 }}
                    sx={{ pb: 1 }}
                  />
                  <CardContent sx={{ pt: 0 }}>
                    <Typography variant="body2" color="text.secondary">
                      {checks.missing_media?.details || t('health.checks.allMediaVerified')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardHeader
                    avatar={<AccessTimeIcon sx={{ color: 'info.main' }} />}
                    title={t('health.checks.timeSync')}
                    titleTypographyProps={{ variant: 'subtitle2', fontWeight: 700 }}
                    sx={{ pb: 1 }}
                  />
                  <CardContent sx={{ pt: 0 }}>
                    <Typography variant="body2" color="text.secondary">
                      {checks.time_sync?.details || t('health.checks.ntpSync')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
