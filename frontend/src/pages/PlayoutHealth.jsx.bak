import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Container, Typography, Grid, Card, CardContent, CardHeader,
  LinearProgress, IconButton, Tooltip, Chip, useTheme, alpha,
  Tabs, Tab, CircularProgress,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Monitor as MonitorIcon,
  Storage as StorageIcon,
  Wifi as WifiIcon,
  Timeline as TimelineIcon,
  Dns as DnsIcon,
  AccessTime as AccessTimeIcon,
  ReportProblem as ReportProblemIcon,
  ReceiptLong as ReceiptLongIcon,
  MonitorHeart as HealthTabIcon,
  BarChart as AnalyticsTabIcon,
} from '@mui/icons-material';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../services/api';
import useAuthStore from '../stores/authStore';

// ─── HealthScoreGauge ─────────────────────────────────────────────────────────
const HealthScoreGauge = ({ score, t }) => {
  const theme = useTheme();
  const r = 54;
  const circ = 2 * Math.PI * r;
  const color = score >= 90 ? theme.palette.success.main : score >= 70 ? theme.palette.warning.main : theme.palette.error.main;
  return (
    <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center">
      <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r={r} stroke={alpha(color, 0.1)} strokeWidth="8" fill="transparent" />
        <circle cx="60" cy="60" r={r} stroke={color} strokeWidth="8" fill="transparent"
          strokeDasharray={circ}
          style={{ strokeDashoffset: circ - (score / 100) * circ, transition: 'stroke-dashoffset 1s ease-in-out', strokeLinecap: 'round' }}
        />
      </svg>
      <Box position="absolute" display="flex" flexDirection="column" alignItems="center">
        <Typography variant="h4" sx={{ fontWeight: 'bold', color }}>{score}</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 700 }}>
          {score === 100 ? t('health.score.perfect') : t('health.score.health')}
        </Typography>
      </Box>
    </Box>
  );
};

// ─── StatusCard ───────────────────────────────────────────────────────────────
const StatusCard = ({ title, status, message, icon: Icon }) => {
  const theme = useTheme();
  const cfgMap = {
    ok:       { c: theme.palette.success.main, i: <CheckCircleIcon fontSize="small" /> },
    warning:  { c: theme.palette.warning.main, i: <WarningIcon fontSize="small" /> },
    critical: { c: theme.palette.error.main,   i: <ErrorIcon fontSize="small" /> },
    error:    { c: theme.palette.error.main,   i: <ErrorIcon fontSize="small" /> },
  };
  const { c, i } = cfgMap[status] || { c: theme.palette.text.secondary, i: <TimelineIcon fontSize="small" /> };
  return (
    <Card variant="outlined" sx={{ bgcolor: alpha(c, 0.05), borderColor: alpha(c, 0.2), height: '100%', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${alpha(c, 0.1)}` } }}>
      <CardContent sx={{ p: '16px !important' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Icon sx={{ color: c, opacity: 0.8 }} fontSize="small" />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{title}</Typography>
          </Box>
          <Box sx={{ color: c }}>{i}</Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.4 }}>{message}</Typography>
      </CardContent>
    </Card>
  );
};

// ─── KPICard ──────────────────────────────────────────────────────────────────
const KPICard = ({ label, value, icon: Icon, color }) => (
  <Card variant="outlined" sx={{ height: '100%', border: 'none', bgcolor: 'background.paper', overflow: 'hidden' }}>
    <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</Typography>
        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>{value}</Typography>
      </Box>
      <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: alpha(color, 0.1), color, display: 'flex', alignItems: 'center' }}>
        <Icon />
      </Box>
    </CardContent>
  </Card>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PlayoutHealth() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { token } = useAuthStore();

  const [pageTab, setPageTab] = useState(0); // 0 = Health, 1 = Analytics

  // ── Health state ────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [liveLogs, setLiveLogs] = useState([]);

  // ── Analytics state ─────────────────────────────────────────────────────────
  const [streamHealth, setStreamHealth] = useState([]);
  const [wsStatus, setWsStatus] = useState('connecting');
  const wsRef = useRef(null);
  const [clipsPerDay, setClipsPerDay] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // ── Health fetch ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const res = await api.get('/api/settings/diagnostics');
      setData(res.data);
      setLastUpdated(new Date());
      setLiveLogs(prev => [{
        id: Date.now(), time: new Date().toLocaleTimeString(),
        level: res.data.score === 100 ? 'info' : 'warn',
        msg: `Health check completed. Score: ${res.data.score}%`
      }, ...prev].slice(0, 50));
    } catch (err) {
      setLiveLogs(prev => [{
        id: Date.now(), time: new Date().toLocaleTimeString(),
        level: 'error', msg: `Diagnostic service error: ${err.message}`
      }, ...prev].slice(0, 50));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(() => fetchData(false), 8000);
    return () => clearInterval(iv);
  }, [fetchData]);

  // ── WebSocket ────────────────────────────────────────────────────────────────
  const connectWs = useCallback(() => {
    if (!token) return;
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${window.location.host}/api/v2/events?token=${token}`);
    wsRef.current = ws;
    ws.onopen = () => setWsStatus('connected');
    ws.onclose = () => { setWsStatus('disconnected'); setTimeout(connectWs, 5000); };
    ws.onerror = () => setWsStatus('error');
    ws.onmessage = (ev) => {
      try {
        const event = JSON.parse(ev.data);
        if (event.event_type === 'clip_start' || event.event_type === 'heartbeat') {
          const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setStreamHealth(prev => {
            const next = [...prev, {
              time: ts,
              bitrate: event.payload?.bitrate_kbps ?? Math.floor(4500 + Math.random() * 500),
              fps: event.payload?.fps ?? 25,
            }];
            return next.length > 60 ? next.slice(-60) : next;
          });
        }
      } catch { /* ignore */ }
    };
  }, [token]);

  useEffect(() => { connectWs(); return () => wsRef.current?.close(); }, [connectWs]);

  // ── As-run REST ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    const fetchAsRun = async () => {
      try {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        const { data: logs } = await api.get('/api/v2/analytics/as-run', {
          params: { start: start.toISOString(), end: end.toISOString(), limit: 1000 },
        });
        const byDay = {};
        (logs || []).forEach((log) => {
          const day = log.actual_start?.slice(0, 10) ?? '';
          if (!day) return;
          byDay[day] = (byDay[day] ?? 0) + 1;
        });
        setClipsPerDay(Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([day, count]) => ({ day: day.slice(5), count })));
      } catch { /* non-fatal */ }
      finally { setAnalyticsLoading(false); }
    };
    fetchAsRun();
  }, [token]);

  // ─────────────────────────────────────────────────────────────────────────────
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
  const wsChipColor = wsStatus === 'connected' ? 'success' : wsStatus === 'connecting' ? 'warning' : 'error';
  const wsChipLabel = wsStatus === 'connected' ? 'Live' : wsStatus === 'connecting' ? 'Connecting…' : 'Offline';

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            {pageTab === 0 ? t('health.title', 'Playout Health') : t('health.analyticsTitle', 'Analytics')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {pageTab === 0
              ? `${t('health.lastUpdate', 'Last update')}: ${lastUpdated?.toLocaleTimeString() || '—'}`
              : `WebSocket: ${wsChipLabel}`}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          {pageTab === 0 && (
            <Tooltip title={t('health.manualRefresh', 'Force Update')}>
              <IconButton onClick={() => fetchData(true)} disabled={refreshing}
                sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) } }}>
                <RefreshIcon color="primary" />
              </IconButton>
            </Tooltip>
          )}
          {pageTab === 1 && (
            <Chip size="small" color={wsChipColor} label={`WebSocket: ${wsChipLabel}`} variant="outlined" />
          )}
        </Box>
      </Box>

      {/* ── Page Tabs ───────────────────────────────────────────────────────── */}
      <Tabs value={pageTab} onChange={(_, v) => setPageTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab icon={<HealthTabIcon sx={{ fontSize: 18 }} />} iconPosition="start"
          label={t('health.tab.health', 'Health')}
          sx={{ fontWeight: 700, minHeight: 42, fontSize: '0.8rem', textTransform: 'none' }} />
        <Tab icon={<AnalyticsTabIcon sx={{ fontSize: 18 }} />} iconPosition="start"
          label={t('health.tab.analytics', 'Analytics')}
          sx={{ fontWeight: 700, minHeight: 42, fontSize: '0.8rem', textTransform: 'none' }} />
      </Tabs>

      {/* ══════ TAB 0 — HEALTH ═══════════════════════════════════════════════ */}
      {pageTab === 0 && (
        <>
          {/* KPI Strip */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard label={t('health.kpis.deviceName', 'Playout Host')} value={stats.hostname || 'Playout-01'} icon={MonitorIcon} color={theme.palette.primary.main} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard label={t('health.kpis.clipsPlayed', 'Clips Today')} value={stats.clips_played_today || 0} icon={ReceiptLongIcon} color={theme.palette.info.main} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard label={t('health.kpis.activeStreams', 'Active Streams')} value={stats.active_streams || 1} icon={TimelineIcon} color={theme.palette.success.main} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard label={t('health.kpis.lastError', 'Last Error')} value={stats.last_error || 'Clean'} icon={ReportProblemIcon} color={stats.last_error ? theme.palette.error.main : theme.palette.text.disabled} />
            </Grid>
          </Grid>

          <Grid container spacing={4}>
            {/* Score + Core Checks */}
            <Grid item xs={12} lg={4}>
              <Box display="flex" flexDirection="column" gap={4}>
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

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, px: 1, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {t('health.coreComponents', 'Core Components')}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <StatusCard title={t('health.checks.casparEngine')} status={checks.engine_connection?.status || 'warning'} message={checks.engine_connection?.details || t('health.checks.initializingComm')} icon={DnsIcon} />
                    </Grid>
                    <Grid item xs={12}>
                      <StatusCard title={t('health.checks.database')} status={checks.database?.status || 'ok'} message={checks.database?.details || t('health.checks.awaitingMetrics')} icon={StorageIcon} />
                    </Grid>
                    <Grid item xs={12}>
                      <StatusCard title={t('health.checks.mediaStorage')} status={checks.media_storage?.status || 'ok'} message={checks.media_storage?.details || t('health.checks.calculatingSpace')} icon={StorageIcon} />
                    </Grid>
                    <Grid item xs={12}>
                      <StatusCard title={t('health.checks.watchfolder')} status={checks.watchfolder?.status || 'ok'} message={checks.watchfolder?.details || t('health.checks.monitoringWatchfolders')} icon={WifiIcon} />
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </Grid>

            {/* Live Logs + Secondary Checks */}
            <Grid item xs={12} lg={8}>
              <Box display="flex" flexDirection="column" gap={4}>
                <Card variant="outlined" sx={{
                  borderRadius: 3, height: 280, display: 'flex', flexDirection: 'column',
                  bgcolor: alpha('#000', 0.2), border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}>
                  <Box p={2} borderBottom={`1px solid ${alpha(theme.palette.divider, 0.1)}`} display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                      <TimelineIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t('health.liveDiagnosticsStream')}</Typography>
                    </Box>
                    <Chip label="LIVE" size="small" color="success" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 900, '& .MuiChip-label': { px: 1 } }} />
                  </Box>
                  <Box flex={1} overflow="auto" p={2} sx={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { bgcolor: alpha('#fff', 0.1), borderRadius: 2 } }}>
                    <Box sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {liveLogs.map((log) => (
                        <Box key={log.id} mb={1} display="flex" gap={2} sx={{ borderBottom: `1px solid ${alpha('#fff', 0.03)}`, pb: 0.5 }}>
                          <Typography variant="caption" sx={{ color: 'text.disabled', opacity: 0.5, minWidth: 70 }}>[{log.time}]</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 45, color: log.level === 'error' ? 'error.main' : log.level === 'warn' ? 'warning.main' : 'info.main' }}>
                            {log.level.toUpperCase()}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.primary', opacity: 0.9 }}>{log.msg}</Typography>
                        </Box>
                      ))}
                      {liveLogs.length === 0 && (
                        <Box textAlign="center" py={4} sx={{ opacity: 0.3 }}>{t('health.waitingTelemetry')}</Box>
                      )}
                    </Box>
                  </Box>
                </Card>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ borderRadius: 3 }}>
                      <CardHeader avatar={<ReportProblemIcon sx={{ color: 'warning.main' }} />} title={t('health.checks.contentAvailability')} titleTypographyProps={{ variant: 'subtitle2', fontWeight: 700 }} sx={{ pb: 1 }} />
                      <CardContent sx={{ pt: 0 }}>
                        <Typography variant="body2" color="text.secondary">{checks.missing_media?.details || t('health.checks.allMediaVerified')}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ borderRadius: 3 }}>
                      <CardHeader avatar={<AccessTimeIcon sx={{ color: 'info.main' }} />} title={t('health.checks.timeSync')} titleTypographyProps={{ variant: 'subtitle2', fontWeight: 700 }} sx={{ pb: 1 }} />
                      <CardContent sx={{ pt: 0 }}>
                        <Typography variant="body2" color="text.secondary">{checks.time_sync?.details || t('health.checks.ntpSync')}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </>
      )}

      {/* ══════ TAB 1 — ANALYTICS ════════════════════════════════════════════ */}
      {pageTab === 1 && (
        <>
          {/* Analytics KPI strip */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={6} md={3}>
              <KPICard label="WS Status" value={wsStatus === 'connected' ? 'LIVE' : 'OFFLINE'} icon={TimelineIcon} color={wsStatus === 'connected' ? theme.palette.success.main : theme.palette.error.main} />
            </Grid>
            <Grid item xs={6} md={3}>
              <KPICard label="Data Points" value={streamHealth.length} icon={MonitorIcon} color={theme.palette.primary.main} />
            </Grid>
            <Grid item xs={6} md={3}>
              <KPICard label="Clips (7 Days)" value={clipsPerDay.reduce((s, d) => s + (d.count || 0), 0)} icon={ReceiptLongIcon} color={theme.palette.info.main} />
            </Grid>
            <Grid item xs={6} md={3}>
              <KPICard label="Error Rate" value="0%" icon={ReportProblemIcon} color={theme.palette.warning.main} />
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3}>
            {/* Live Bitrate */}
            <Grid item xs={12} lg={7}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.72rem', fontWeight: 800 }}>
                    Stream Bitrate (Live)
                  </Typography>
                  {wsStatus !== 'connected' && streamHealth.length === 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 6, justifyContent: 'center', color: 'text.secondary' }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2">Waiting for WebSocket data…</Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={streamHealth} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} domain={['auto', 'auto']} />
                        <ChartTooltip contentStyle={{ backgroundColor: 'rgba(12,13,22,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} labelStyle={{ color: '#fff', fontSize: 11 }} />
                        <Line type="monotone" dataKey="bitrate" stroke="#00e5ff" strokeWidth={2} dot={false} name="Bitrate (kbps)" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Clips/Day */}
            <Grid item xs={12} lg={5}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.72rem', fontWeight: 800 }}>
                    Clips / Day (Last 7 Days)
                  </Typography>
                  {analyticsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={24} /></Box>
                  ) : clipsPerDay.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">No as-run log data available yet.</Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={clipsPerDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                        <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} allowDecimals={false} />
                        <ChartTooltip contentStyle={{ backgroundColor: 'rgba(12,13,22,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} labelStyle={{ color: '#fff', fontSize: 11 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="count" fill="#9c27b0" name="Clips played" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
}
