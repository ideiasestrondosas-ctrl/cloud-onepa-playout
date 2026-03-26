import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Tabs,
  Tab,
  Chip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  PlayArrow as PlayIcon,
  Dashboard as DashboardIcon,
  LibraryMusic as LibraryIcon,
  QueueMusic as PlaylistIcon,
  CalendarMonth as CalendarIcon,
  Brush as GraphicsIcon,
  Settings as SettingsIcon,
  Tv as TvIcon,
  LiveTv as LiveTvIcon,
  BugReport as BugReport,
  Description as DescriptionIcon,
  Favorite as FavoriteIcon,
  TableChart as TableChartIcon
} from '@mui/icons-material';
import { useHelp } from '../context/HelpContext';
import { useTranslation } from 'react-i18next';

const Section = ({ title, children, severity = null }) => (
  <Box sx={{ mb: 1.5 }}>
    {severity ? (
      <Alert severity={severity} sx={{ mb: 0.75, py: 0.3, '& .MuiAlert-message': { py: 0 } }}><strong>{title}</strong></Alert>
    ) : (
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.5, borderBottom: '1px solid rgba(0,229,255,0.15)', pb: 0.3, fontSize: '0.8rem' }}>{title}</Typography>
    )}
    {children}
  </Box>
);

const Step = ({ n, text }) => (
  <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
    <Box sx={{ minWidth: 20, height: 20, borderRadius: '50%', bgcolor: 'primary.main', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.6rem', flexShrink: 0 }}>{n}</Box>
    <Typography variant="caption" sx={{ pt: 0.2, lineHeight: 1.5 }}>{text}</Typography>
  </Box>
);

const Kv = ({ k, v }) => (
  <Box sx={{ display: 'flex', gap: 1, mb: 0.4 }}>
    <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', minWidth: 130, flexShrink: 0, fontSize: '0.65rem' }}>{k}</Typography>
    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>{v}</Typography>
  </Box>
);

// ─── TAB CONTENT ──────────────────────────────────────────────────────────────

const HelpDashboard = () => {
  const { t } = useTranslation();
  return (
    <Box>
      <Section title={t('help.dashboard.title')}>
        <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary', display: 'block' }}>
          {t('help.dashboard.intro')}
        </Typography>
      </Section>

      <Section title={t('help.dashboard.status_indicator.title')}>
        <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
          {t('help.dashboard.status_indicator.prefix')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 0.5 }}>
          <Chip label="● ON AIR" sx={{ bgcolor: 'rgba(211,47,47,0.15)', color: '#f44336', fontWeight: 800, fontFamily: 'monospace' }} size="small" />
          <Typography variant="caption" sx={{ pt: 0.5, color: 'text.secondary' }}>{t('help.dashboard.status_indicator.on_air')}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
          <Chip label="◯ OFF AIR" sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: '#555', fontWeight: 800, fontFamily: 'monospace' }} size="small" />
          <Typography variant="caption" sx={{ pt: 0.5, color: 'text.secondary' }}>{t('help.dashboard.status_indicator.off_air')}</Typography>
        </Box>
      </Section>

      <Section title={t('help.dashboard.controls.title')}>
        <Step n="1" text={t('help.dashboard.controls.step1')} />
        <Step n="2" text={t('help.dashboard.controls.step2')} />
        <Step n="3" text={t('help.dashboard.controls.step3')} />
        <Step n="4" text={t('help.dashboard.controls.step4')} />
        <Step n="5" text={t('help.dashboard.controls.step5')} />
        <Alert severity="warning" sx={{ mt: 0.75, py: 0.3, '& .MuiAlert-message': { py: 0 } }}>
          <Typography variant="caption">{t('help.dashboard.controls.warning')}</Typography>
        </Alert>
      </Section>

      <Section title={t('help.dashboard.protocols.title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.dashboard.protocols.intro')}
        </Typography>
        <Kv k="MASTER / HLS" v={t('help.dashboard.protocols.master')} />
        <Kv k="RTMP" v={t('help.dashboard.protocols.rtmp')} />
        <Kv k="SRT" v={t('help.dashboard.protocols.srt')} />
        <Kv k="UDP" v={t('help.dashboard.protocols.udp')} />
        <Kv k="DASH / MSS / RTSP / WebRTC" v={t('help.dashboard.protocols.others')} />
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>{t('help.dashboard.protocols.legend')}</Typography>
      </Section>

      <Section title={t('help.dashboard.clips.title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.dashboard.clips.intro')}
        </Typography>
        <Kv k={t('dashboard.playing')} v={t('help.dashboard.clips.playing')} />
        <Kv k={t('help.dashboard.clips.title')} v={t('help.dashboard.clips.next')} />
        <Kv k="SKIP" v={t('help.dashboard.clips.skip')} />
      </Section>

      <Section title={t('help.dashboard.logs.title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.dashboard.logs.intro')}
        </Typography>
        <Kv k="Motor FFmpeg" v={t('help.dashboard.logs.engine')} />
        <Kv k="Tempo de Emissão" v={t('help.dashboard.logs.uptime')} />
        <Kv k="Agendamento / Playlist" v={t('help.dashboard.logs.schedule_validity')} />
        <Kv k="Protocolos Activos" v={t('help.dashboard.logs.active_protocols')} />
        <Kv k="Últimas Entradas de Log" v={t('help.dashboard.logs.last_logs')} />
      </Section>
      
      <Section title={t('help.dashboard.active_channel.title')} severity={t('help.dashboard.active_channel.severity')}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('help.dashboard.active_channel.desc')}
        </Typography>
      </Section>
    </Box>
  );
};

const HelpLibrary = () => {
  const { t } = useTranslation();
  return (
    <Box>
      <Section title={t('help.library.title')}>
        <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary', display: 'block' }}>
          {t('help.library.intro')}
        </Typography>
      </Section>

      <Section title={t('help.library.upload.title')}>
        <Step n="1" text={t('help.library.upload.step1')} />
        <Step n="2" text={t('help.library.upload.step2')} />
        <Step n="3" text={t('help.library.upload.step3')} />
        <Step n="4" text={t('help.library.upload.step4')} />
        <Alert severity="info" sx={{ mt: 0.75, py: 0.3, '& .MuiAlert-message': { py: 0 } }}>
          <Typography variant="caption">{t('help.library.upload.nfs_hint')}</Typography>
        </Alert>
      </Section>

      <Section title={t('help.library.metadata.title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.library.metadata.intro')}
        </Typography>
        <Kv k={t('help.library.metadata.field_title')} v={t('help.library.metadata.field_title_desc')} />
        <Kv k={t('help.library.metadata.field_synopsis')} v={t('help.library.metadata.field_synopsis_desc')} />
        <Kv k={t('help.library.metadata.field_genre')} v={t('help.library.metadata.field_genre_desc')} />
        <Kv k={t('help.library.metadata.field_rating')} v={t('help.library.metadata.field_rating_desc')} />
        <Kv k={t('help.library.metadata.field_type')} v={t('help.library.metadata.field_type_desc')} />
      </Section>

      <Section title={t('help.library.metadata.auto_review_title') || "Revisão de Metadados"}>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          {t('help.library.metadata.auto_review')}
        </Typography>
      </Section>

      <Section title={t('help.library.fillers.title')}>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          {t('help.library.fillers.desc')}
        </Typography>
      </Section>

      <Section title={t('help.library.syncFolder.title')}>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          {t('help.library.syncFolder.desc')}
        </Typography>
      </Section>
    </Box>
  );
};

const HelpPlaylists = () => {
  const { t } = useTranslation();
  return (
    <Box>
      <Section title={t('help.playlists.title')}>
        <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary', display: 'block' }}>
          {t('help.playlists.intro')}
        </Typography>
      </Section>

      <Section title={t('help.playlists.create.title') || "Criar uma Playlist"}>
        <Step n="1" text={t('help.playlists.create.step1')} />
        <Step n="2" text={t('help.playlists.create.step2')} />
        <Step n="3" text={t('help.playlists.create.step3')} />
        <Step n="4" text={t('help.playlists.create.step4')} />
        <Step n="5" text={t('help.playlists.create.step5')} />
      </Section>

      <Section title={t('help.playlists.management.title') || "Gestão da Playlist"}>
        <Kv k={t('help.playlists.management.sorting')} v={t('help.playlists.management.sorting_desc')} />
        <Kv k={t('help.playlists.management.remove_clip')} v={t('help.playlists.management.remove_clip_desc')} />
        <Kv k={t('help.playlists.management.duplicate')} v={t('help.playlists.management.duplicate_desc')} />
        <Kv k={t('help.playlists.management.total_duration')} v={t('help.playlists.management.total_duration_desc')} />
        <Kv k={t('help.playlists.management.fillers')} v={t('help.playlists.management.fillers_desc')} />
      </Section>

      <Section title={t('help.playlists.best_practices.title') || "Boas Práticas"}>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', whiteSpace: 'pre-line' }}>
          {t('help.playlists.best_practices.bullets')}
        </Typography>
      </Section>
    </Box>
  );
};

const HelpCalendar = () => {
  const { t } = useTranslation();
  return (
    <Box>
      <Section title={t('help.calendar.title')}>
        <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary', display: 'block' }}>
          {t('help.calendar.intro')}
        </Typography>
      </Section>

      <Section title={t('help.calendar.schedule.title') || "Agendar uma Playlist"}>
        <Step n="1" text={t('help.calendar.schedule.step1') || "Clique num dia no calendário para abrir o diálogo de agendamento."} />
        <Step n="2" text={t('help.calendar.schedule.step2') || "Seleccione a playlist pretendida."} />
        <Step n="3" text={t('help.calendar.schedule.step3') || "Defina o horário de início (ex: 06:00)."} />
        <Step n="4" text={t('help.calendar.schedule.step4') || "Escolha o padrão de repetição: Nenhum, Diário, Semanal ou Mensal."} />
        <Step n="5" text={t('help.calendar.schedule.step5') || "Clique em GUARDAR. O evento aparece no calendário com a cor correspondente."} />
      </Section>
    </Box>
  );
};

const HelpGraphics = () => {
  const { t } = useTranslation();
  return (
    <Box>
      <Section title={t('help.graphics.title')}>
        <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary', display: 'block' }}>
          {t('help.graphics.intro')}
        </Typography>
      </Section>

      <Section title={t('help.graphics.features_title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.graphics.features_intro')}
        </Typography>
        <Kv k="1. " v={t('help.graphics.feature1')} />
        <Kv k="2. " v={t('help.graphics.feature2')} />
        <Kv k="3. " v={t('help.graphics.feature3')} />
        <Kv k="4. " v={t('help.graphics.feature4')} />
        <Kv k="5. " v={t('help.graphics.feature5')} />
        <Kv k="6. " v={t('help.graphics.feature6')} />
      </Section>

      <Section title={t('help.graphics.position_tab_title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.graphics.position_tab_intro')}
        </Typography>
        <Kv k={t('help.graphics.anchor_point')} v={t('help.graphics.anchor_point_desc')} />
        <Kv k={t('help.graphics.offset_x')} v={t('help.graphics.offset_x_desc')} />
        <Kv k={t('help.graphics.offset_y')} v={t('help.graphics.offset_y_desc')} />
        <Kv k={t('help.graphics.drag_drop')} v={t('help.graphics.drag_drop_desc')} />
      </Section>

      <Section title={t('help.graphics.style_tab_title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.graphics.style_tab_intro')}
        </Typography>
        <Kv k={t('help.graphics.scale')} v={t('help.graphics.scale_desc')} />
        <Kv k={t('help.graphics.opacity')} v={t('help.graphics.opacity_desc')} />
      </Section>

      <Section title={t('help.graphics.layer_tab_title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.graphics.layer_tab_intro')}
        </Typography>
        <Kv k={t('help.graphics.layer_clock')} v={t('help.graphics.layer_clock_desc')} />
        <Kv k={t('help.graphics.layer_lower_third')} v={t('help.graphics.layer_lower_third_desc')} />
        <Kv k={t('help.graphics.layer_marquee')} v={t('help.graphics.layer_marquee_desc')} />
      </Section>

      <Section title={t('help.graphics.clock_config_title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.graphics.clock_config_intro')}
        </Typography>
        <Kv k={t('help.graphics.clock_format')} v={t('help.graphics.clock_format_desc')} />
        <Kv k={t('help.graphics.clock_timezone')} v={t('help.graphics.clock_timezone_desc')} />
        <Kv k={t('help.graphics.clock_font')} v={t('help.graphics.clock_font_desc')} />
        <Kv k={t('help.graphics.clock_size')} v={t('help.graphics.clock_size_desc')} />
        <Kv k={t('help.graphics.clock_color')} v={t('help.graphics.clock_color_desc')} />
        <Kv k={t('help.graphics.clock_bg')} v={t('help.graphics.clock_bg_desc')} />
      </Section>

      <Section title={t('help.graphics.lower_third_config_title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.graphics.lower_third_config_intro')}
        </Typography>
        <Kv k={t('help.graphics.lt_primary')} v={t('help.graphics.lt_primary_desc')} />
        <Kv k={t('help.graphics.lt_secondary')} v={t('help.graphics.lt_secondary_desc')} />
        <Kv k={t('help.graphics.lt_animation')} v={t('help.graphics.lt_animation_desc')} />
        <Kv k={t('help.graphics.lt_duration')} v={t('help.graphics.lt_duration_desc')} />
      </Section>

      <Section title={t('help.graphics.marquee_config_title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.graphics.marquee_config_intro')}
        </Typography>
        <Kv k={t('help.graphics.marquee_text')} v={t('help.graphics.marquee_text_desc')} />
        <Kv k={t('help.graphics.marquee_speed')} v={t('help.graphics.marquee_speed_desc')} />
        <Kv k={t('help.graphics.marquee_direction')} v={t('help.graphics.marquee_direction_desc')} />
      </Section>

      <Section title={t('help.graphics.templates_tab_title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.graphics.templates_tab_intro')}
        </Typography>
      </Section>

      <Section title={t('help.graphics.how_to_title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.graphics.how_to_intro')}
        </Typography>
        <Step n="1" text={t('help.graphics.step1')} />
        <Step n="2" text={t('help.graphics.step2')} />
        <Step n="3" text={t('help.graphics.step3')} />
        <Step n="4" text={t('help.graphics.step4')} />
        <Step n="5" text={t('help.graphics.step5')} />
        <Step n="6" text={t('help.graphics.step6')} />
        <Step n="7" text={t('help.graphics.step7')} />
        <Step n="8" text={t('help.graphics.step8')} />
      </Section>

      <Section title={t('help.graphics.tips_title')}>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', whiteSpace: 'pre-line' }}>
          {t('help.graphics.tips_content')}
        </Typography>
      </Section>
    </Box>
  );
};

const HelpSettings = () => {
  const { t } = useTranslation();
  return (
    <Box>
      <Section title={t('help.settings.title')}>
        <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary', display: 'block' }}>
          {t('help.settings.intro')}
        </Typography>
      </Section>

      <Section title={t('help.settings.features_title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.settings.features_intro')}
        </Typography>
        <Kv k="1. " v={t('help.settings.feature1')} />
        <Kv k="2. " v={t('help.settings.feature2')} />
        <Kv k="3. " v={t('help.settings.feature3')} />
        <Kv k="4. " v={t('help.settings.feature4')} />
        <Kv k="5. " v={t('help.settings.feature5')} />
      </Section>

      <Section title={t('help.settings.output_tab_title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.settings.output_tab_intro')}
        </Typography>
        <Kv k={t('help.settings.primary_protocol')} v={t('help.settings.primary_protocol_desc')} />
        <Kv k={t('help.settings.resolution')} v={t('help.settings.resolution_desc')} />
        <Kv k={t('help.settings.bitrate')} v={t('help.settings.bitrate_desc')} />
        <Kv k={t('help.settings.multi_streaming')} v={t('help.settings.multi_streaming_desc')} />
        <Kv k={t('help.settings.connection_links')} v={t('help.settings.connection_links_desc')} />
      </Section>

      <Section title={t('help.settings.paths_tab_title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.settings.paths_tab_intro')}
        </Typography>
        <Kv k={t('help.settings.storage_paths')} v={t('help.settings.storage_paths_desc')} />
        <Kv k={t('help.settings.space_management')} v={t('help.settings.space_management_desc')} />
        <Kv k={t('help.settings.metadata_apis')} v={t('help.settings.metadata_apis_desc')} />
        <Kv k={t('help.settings.branding_assets')} v={t('help.settings.branding_assets_desc')} />
      </Section>

      <Section title={t('help.settings.playout_tab_title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.settings.playout_tab_intro')}
        </Typography>
        <Kv k={t('help.settings.basic_config')} v={t('help.settings.basic_config_desc')} />
        <Kv k={t('help.settings.epg_config')} v={t('help.settings.epg_config_desc')} />
        <Kv k={t('help.settings.overlay_config')} v={t('help.settings.overlay_config_desc')} />
        <Kv k={t('help.settings.quality_presets')} v={t('help.settings.quality_presets_desc')} />
      </Section>

      <Section title={t('help.settings.users_tab_title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.settings.users_tab_intro')}
        </Typography>
        <Kv k={t('help.settings.user_management')} v={t('help.settings.user_management_desc')} />
        <Kv k={t('help.settings.profile_management')} v={t('help.settings.profile_management_desc')} />
      </Section>

      <Section title={t('help.settings.about_tab_title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.settings.about_tab_intro')}
        </Typography>
        <Kv k={t('help.settings.system_info')} v={t('help.settings.system_info_desc')} />
        <Kv k={t('help.settings.version_history')} v={t('help.settings.version_history_desc')} />
        <Kv k={t('help.settings.product_roadmap')} v={t('help.settings.product_roadmap_desc')} />
      </Section>

      <Section title={t('help.settings.how_to_title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.settings.how_to_intro')}
        </Typography>
        <Step n="1" text={t('help.settings.step1')} />
        <Step n="2" text={t('help.settings.step2')} />
        <Step n="3" text={t('help.settings.step3')} />
        <Step n="4" text={t('help.settings.step4')} />
        <Step n="5" text={t('help.settings.step5')} />
        <Step n="6" text={t('help.settings.step6')} />
        <Step n="7" text={t('help.settings.step7')} />
      </Section>

      <Section title={t('help.settings.tips_title')}>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', whiteSpace: 'pre-line' }}>
          {t('help.settings.tips_content')}
        </Typography>
      </Section>
    </Box>
  );
};

const HelpTroubleshooting = () => {
  const { t } = useTranslation();
  return (
    <Box>
      <Section title={t('help.troubleshooting.title')} severity="warning">
        <Typography variant="caption">{t('help.troubleshooting.intro')}</Typography>
      </Section>
    </Box>
  );
};

const HelpTemplates = () => {
  const { t } = useTranslation();
  return (
    <Box>
      <Section title={t('help.templates.title')}>
        <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary', display: 'block' }}>
          {t('help.templates.intro')}
        </Typography>
      </Section>

      <Section title={t('help.templates.features_title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.templates.features_intro')}
        </Typography>
        <Kv k="1. " v={t('help.templates.feature1')} />
        <Kv k="2. " v={t('help.templates.feature2')} />
        <Kv k="3. " v={t('help.templates.feature3')} />
        <Kv k="4. " v={t('help.templates.feature4')} />
      </Section>

      <Section title={t('help.templates.presets_title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.templates.presets_intro')}
        </Typography>
        <Kv k={t('help.templates.preset_morning')} v={t('help.templates.preset_morning_desc')} />
        <Kv k={t('help.templates.preset_full_day')} v={t('help.templates.preset_full_day_desc')} />
        <Kv k={t('help.templates.preset_loop')} v={t('help.templates.preset_loop_desc')} />
      </Section>

      <Section title={t('help.templates.structure_title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.templates.structure_intro')}
        </Typography>
        <Kv k={t('help.templates.block_intro')} v={t('help.templates.block_intro_desc')} />
        <Kv k={t('help.templates.block_content')} v={t('help.templates.block_content_desc')} />
        <Kv k={t('help.templates.block_commercial')} v={t('help.templates.block_commercial_desc')} />
        <Kv k={t('help.templates.block_outro')} v={t('help.templates.block_outro_desc')} />
        <Kv k={t('help.templates.block_filler')} v={t('help.templates.block_filler_desc')} />
      </Section>

      <Section title={t('help.templates.create_title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.templates.create_intro')}
        </Typography>
        <Kv k={t('help.templates.create_name')} v={t('help.templates.create_name_desc')} />
        <Kv k={t('help.templates.create_description')} v={t('help.templates.create_description_desc')} />
        <Kv k={t('help.templates.create_duration')} v={t('help.templates.create_duration_desc')} />
      </Section>

      <Section title={t('help.templates.use_title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.templates.use_intro')}
        </Typography>
        <Kv k={t('help.templates.use_select')} v={t('help.templates.use_select_desc')} />
        <Kv k={t('help.templates.use_name')} v={t('help.templates.use_name_desc')} />
        <Kv k={t('help.templates.use_date')} v={t('help.templates.use_date_desc')} />
      </Section>

      <Section title={t('help.templates.how_to_title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.templates.how_to_intro')}
        </Typography>
        <Step n="1" text={t('help.templates.step1')} />
        <Step n="2" text={t('help.templates.step2')} />
        <Step n="3" text={t('help.templates.step3')} />
        <Step n="4" text={t('help.templates.step4')} />
        <Step n="5" text={t('help.templates.step5')} />
        <Step n="6" text={t('help.templates.step6')} />
      </Section>

      <Section title={t('help.templates.tips_title')}>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', whiteSpace: 'pre-line' }}>
          {t('help.templates.tips_content')}
        </Typography>
      </Section>
    </Box>
  );
};

const HelpLiveInputs = () => {
  const { t } = useTranslation();
  return (
    <Box>
      {/* Introduction Section */}
      <Section title={t('help.liveInputs.title')}>
        <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary', display: 'block' }}>
          {t('help.liveInputs.intro')}
        </Typography>
      </Section>

      {/* How to Use Section */}
      <Section title={t('help.liveInputs.howToUse.title')}>
        <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
          {t('help.liveInputs.howToUse.intro')}
        </Typography>
        <Step n="1" text={t('help.liveInputs.howToUse.step1')} />
        <Step n="2" text={t('help.liveInputs.howToUse.step2')} />
        <Step n="3" text={t('help.liveInputs.howToUse.step3')} />
        <Step n="4" text={t('help.liveInputs.howToUse.step4')} />
        <Step n="5" text={t('help.liveInputs.howToUse.step5')} />
        <Step n="6" text={t('help.liveInputs.howToUse.step6')} />
      </Section>

      {/* Protocols Section */}
      <Section title={t('help.liveInputs.protocols.title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.liveInputs.protocols.intro')}
        </Typography>
        <Kv k="RTMP" v={t('help.liveInputs.protocols.rtmp')} />
        <Kv k="SRT" v={t('help.liveInputs.protocols.srt')} />
        <Kv k="UDP" v={t('help.liveInputs.protocols.udp')} />
        <Kv k="WebRTC" v={t('help.liveInputs.protocols.webrtc')} />
        <Kv k="NDI" v={t('help.liveInputs.protocols.ndi')} />
        <Kv k="SDI" v={t('help.liveInputs.protocols.sdi')} />
      </Section>

      {/* Social Streaming Section */}
      <Section title={t('help.liveInputs.socialStreaming.title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.liveInputs.socialStreaming.intro')}
        </Typography>
        <Kv k="YouTube Live" v={t('help.liveInputs.socialStreaming.youtube')} />
        <Kv k="Facebook Live" v={t('help.liveInputs.socialStreaming.facebook')} />
      </Section>

      {/* Status Monitoring Section */}
      <Section title={t('help.liveInputs.statusMonitoring.title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.liveInputs.statusMonitoring.intro')}
        </Typography>
        <Kv k={t('help.liveInputs.statusMonitoring.active')} v="" />
        <Kv k={t('help.liveInputs.statusMonitoring.connecting')} v="" />
        <Kv k={t('help.liveInputs.statusMonitoring.error')} v="" />
        <Kv k={t('help.liveInputs.statusMonitoring.inactive')} v="" />
      </Section>

      {/* Preview Section */}
      <Section title={t('help.liveInputs.preview.title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.liveInputs.preview.intro')}
        </Typography>
        <Kv k={t('help.liveInputs.preview.hls')} v="" />
        <Kv k={t('help.liveInputs.preview.latency')} v="" />
        <Kv k={t('help.liveInputs.preview.local')} v="" />
      </Section>

      {/* Tips Section */}
      <Section title={t('help.liveInputs.tips.title')}>
        <Typography variant="caption" sx={{ mb: 0.5, display: 'block', whiteSpace: 'pre-line' }}>
          {t('help.liveInputs.tips.content')}
        </Typography>
      </Section>

      {/* Troubleshooting Section */}
      <Section title={t('help.liveInputs.troubleshooting.title')} severity="warning">
        <Typography variant="caption" sx={{ whiteSpace: 'pre-line' }}>
          {t('help.liveInputs.troubleshooting.items') ? t('help.liveInputs.troubleshooting.items').split('\n').map((item, i) => `${i + 1}. ${item}`).join('\n') : ''}
        </Typography>
      </Section>
    </Box>
  );
};

const HelpHealth = () => {
  const { t } = useTranslation();
  return (
    <Box>
      {/* Introduction Section */}
      <Section title={t('help.health.title')}>
        <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary', display: 'block' }}>
          {t('help.health.intro')}
        </Typography>
      </Section>

      {/* Health Tab Section */}
      <Section title={t('help.health.healthTab.title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.health.healthTab.intro')}
        </Typography>

        <Section title={t('help.health.kpis.title')}>
          <Kv k={t('help.health.kpis.deviceName')} v={t('help.health.kpis.deviceName_desc')} />
          <Kv k={t('help.health.kpis.clipsPlayed')} v={t('help.health.kpis.clipsPlayed_desc')} />
          <Kv k={t('help.health.kpis.activeStreams')} v={t('help.health.kpis.activeStreams_desc')} />
          <Kv k={t('help.health.kpis.lastError')} v={t('help.health.kpis.lastError_desc')} />
        </Section>

        <Section title={t('help.health.systemScore.title')}>
          <Typography variant="caption" sx={{ mb: 0.5, color: 'text.secondary', display: 'block' }}>
            {t('help.health.systemScore.intro')}
          </Typography>
          <Kv k={t('help.health.systemScore.perfect')} v={t('help.health.systemScore.perfect_desc')} />
          <Kv k={t('help.health.systemScore.healthy')} v={t('help.health.systemScore.healthy_desc')} />
          <Kv k={t('help.health.systemScore.critical')} v={t('help.health.systemScore.critical_desc')} />
        </Section>

        <Section title={t('help.health.components.title')}>
          <Typography variant="caption" sx={{ mb: 0.5, color: 'text.secondary', display: 'block' }}>
            {t('help.health.components.intro')}
          </Typography>
          <Kv k={t('help.health.components.engine')} v={t('help.health.components.engine_desc')} />
          <Kv k={t('help.health.components.database')} v={t('help.health.components.database_desc')} />
          <Kv k={t('help.health.components.mediaStorage')} v={t('help.health.components.mediaStorage_desc')} />
          <Kv k={t('help.health.components.watchfolder')} v={t('help.health.components.watchfolder_desc')} />
        </Section>

        <Section title={t('help.health.checks.title')}>
          <Kv k={t('help.health.checks.content')} v={t('help.health.checks.content_desc')} />
          <Kv k={t('help.health.checks.timeSync')} v={t('help.health.checks.timeSync_desc')} />
        </Section>
      </Section>

      {/* Analytics Tab Section */}
      <Section title={t('help.health.analyticsTab.title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.health.analyticsTab.intro')}
        </Typography>

        <Section title={t('help.health.charts.title')}>
          <Kv k={t('help.health.charts.bitrate')} v={t('help.health.charts.bitrate_desc')} />
          <Kv k={t('help.health.charts.clipsDay')} v={t('help.health.charts.clipsDay_desc')} />
        </Section>

        <Section title={t('help.health.websocket.title')}>
          <Kv k={t('help.health.websocket.connected')} v={t('help.health.websocket.connected_desc')} />
          <Kv k={t('help.health.websocket.disconnected')} v={t('help.health.websocket.disconnected_desc')} />
        </Section>
      </Section>

      {/* Status Indicators */}
      <Section title={t('help.health.status.title')}>
        <Typography variant="caption" sx={{ mb: 0.5, color: 'text.secondary', display: 'block' }}>
          {t('help.health.status.intro')}
        </Typography>
        <Kv k={t('help.health.status.ok')} v={t('help.health.status.ok_desc')} />
        <Kv k={t('help.health.status.warning')} v={t('help.health.status.warning_desc')} />
        <Kv k={t('help.health.status.error')} v={t('help.health.status.error_desc')} />
      </Section>

      {/* Tips Section */}
      <Section title={t('help.health.tips.title')}>
        <Typography variant="caption" sx={{ mb: 0.5, display: 'block', whiteSpace: 'pre-line' }}>
          {t('help.health.tips.content')}
        </Typography>
      </Section>

      {/* Troubleshooting Section */}
      <Section title={t('help.health.troubleshooting.title')} severity="warning">
        <Typography variant="caption">{t('help.health.troubleshooting.content')}</Typography>
      </Section>
    </Box>
  );
};

const HelpMultiChannel = () => {
  const { t } = useTranslation();
  return (
    <Box>
      {/* Introduction Section */}
      <Section title={t('help.multi_channel.title')}>
        <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary', display: 'block' }}>
          {t('help.multi_channel.intro')}
        </Typography>
      </Section>

      {/* Channel Management Section */}
      <Section title={t('help.multi_channel.management.title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.multi_channel.management.intro')}
        </Typography>
        <Kv k={t('help.multi_channel.management.create')} v={t('help.multi_channel.management.create_desc')} />
        <Kv k={t('help.multi_channel.management.delete')} v={t('help.multi_channel.management.delete_desc')} />
        <Kv k={t('help.multi_channel.management.default')} v={t('help.multi_channel.management.default_desc')} />
      </Section>

      {/* Channel Status Section */}
      <Section title={t('help.multi_channel.status.title')}>
        <Typography variant="caption" sx={{ mb: 0.5, color: 'text.secondary', display: 'block' }}>
          {t('help.multi_channel.status.intro')}
        </Typography>
        <Kv k={t('help.multi_channel.status.playing')} v={t('help.multi_channel.status.playing_desc')} />
        <Kv k={t('help.multi_channel.status.paused')} v={t('help.multi_channel.status.paused_desc')} />
        <Kv k={t('help.multi_channel.status.stopped')} v={t('help.multi_channel.status.stopped_desc')} />
        <Kv k={t('help.multi_channel.status.error')} v={t('help.multi_channel.status.error_desc')} />
      </Section>

      {/* Preview Section */}
      <Section title={t('help.multi_channel.preview.title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.multi_channel.preview.intro')}
        </Typography>
        <Kv k={t('help.multi_channel.preview.hls')} v={t('help.multi_channel.preview.hls_desc')} />
        <Kv k={t('help.multi_channel.preview.safari')} v={t('help.multi_channel.preview.safari_desc')} />
        <Kv k={t('help.multi_channel.preview.chrome')} v={t('help.multi_channel.preview.chrome_desc')} />
      </Section>

      {/* Channel Info Section */}
      <Section title={t('help.multi_channel.info.title')}>
        <Typography variant="caption" sx={{ mb: 0.5, color: 'text.secondary', display: 'block' }}>
          {t('help.multi_channel.info.intro')}
        </Typography>
        <Kv k={t('help.multi_channel.info.currentClip')} v={t('help.multi_channel.info.currentClip_desc')} />
        <Kv k={t('help.multi_channel.info.nextUp')} v={t('help.multi_channel.info.nextUp_desc')} />
        <Kv k={t('help.multi_channel.info.uptime')} v={t('help.multi_channel.info.uptime_desc')} />
        <Kv k={t('help.multi_channel.info.bitrate')} v={t('help.multi_channel.info.bitrate_desc')} />
      </Section>

      {/* Controls Section */}
      <Section title={t('help.multi_channel.controls.title')}>
        <Typography variant="caption" sx={{ mb: 0.5, color: 'text.secondary', display: 'block' }}>
          {t('help.multi_channel.controls.intro')}
        </Typography>
        <Kv k={t('help.multi_channel.controls.play')} v={t('help.multi_channel.controls.play_desc')} />
        <Kv k={t('help.multi_channel.controls.stop')} v={t('help.multi_channel.controls.stop_desc')} />
        <Kv k={t('help.multi_channel.controls.skip')} v={t('help.multi_channel.controls.skip_desc')} />
      </Section>

      {/* Tips Section */}
      <Section title={t('help.multi_channel.tips.title')}>
        <Typography variant="caption" sx={{ mb: 0.5, display: 'block', whiteSpace: 'pre-line' }}>
          {t('help.multi_channel.tips.content')}
        </Typography>
      </Section>
    </Box>
  );
};

const HelpMasterDashboard = () => {
  const { t } = useTranslation();
  return (
    <Box>
      <Section title={t('help.masterDashboard.title')}>
        <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary', display: 'block' }}>
          {t('help.masterDashboard.intro')}
        </Typography>
      </Section>

      <Section title={t('help.masterDashboard.mosaic.title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.masterDashboard.mosaic.desc')}
        </Typography>
      </Section>

      <Section title={t('help.masterDashboard.context.title')}>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          {t('help.masterDashboard.context.desc')}
        </Typography>
      </Section>
    </Box>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'dashboard', icon: <DashboardIcon sx={{ fontSize: 14 }} />, content: <HelpDashboard /> },
  { id: 'media', icon: <LibraryIcon sx={{ fontSize: 14 }} />, content: <HelpLibrary /> },
  { id: 'playlists', icon: <PlaylistIcon sx={{ fontSize: 14 }} />, content: <HelpPlaylists /> },
  { id: 'calendar', icon: <CalendarIcon sx={{ fontSize: 14 }} />, content: <HelpCalendar /> },
  { id: 'graphics', icon: <GraphicsIcon sx={{ fontSize: 14 }} />, content: <HelpGraphics /> },
  { id: 'settings', icon: <SettingsIcon sx={{ fontSize: 14 }} />, content: <HelpSettings /> },
  { id: 'templates', icon: <DescriptionIcon sx={{ fontSize: 14 }} />, content: <HelpTemplates /> },
  { id: 'live-inputs', icon: <LiveTvIcon sx={{ fontSize: 14 }} />, content: <HelpLiveInputs /> },
  { id: 'master-dashboard', icon: <TableChartIcon sx={{ fontSize: 14 }} />, content: <HelpMasterDashboard /> },
  { id: 'health', icon: <FavoriteIcon sx={{ fontSize: 14 }} />, content: <HelpHealth /> },
  { id: 'multi-channel', icon: <TableChartIcon sx={{ fontSize: 14 }} />, content: <HelpMultiChannel /> },
];


export default function HelpSystem() {
  const { t } = useTranslation();
  const { helpMode, helpContent, closeHelp, toggleHelpMode } = useHelp();
  const [tabIndex, setTabIndex] = React.useState(0);

  return (
    <Dialog
      open={!!helpContent}
      onClose={closeHelp}
      maxWidth="md"
      fullWidth
      PaperProps={{
        className: 'glass-panel',
        sx: { backgroundImage: 'none', border: '1px solid rgba(0,229,255,0.15)', maxHeight: '80vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', py: 0.75, px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TvIcon color="primary" sx={{ fontSize: 20 }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1, fontSize: '1rem' }}>
              {helpContent?.title || t('help.title')}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 0.5, fontSize: '0.6rem' }}>
              {t('help.subtitle')}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={closeHelp} size="small">
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Tabs
          value={tabIndex}
          onChange={(e, v) => setTabIndex(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': { minHeight: 36, fontSize: '0.65rem', fontWeight: 700, py: 0.5, px: 1.5 },
            '& .Mui-selected': { color: 'primary.main !important' }
          }}
        >
          {TABS.map((tab, i) => (
            <Tab key={i} label={t(`help.tabs.${tab.id}`)} icon={tab.icon} iconPosition="start" sx={{ gap: 0.4 }} />
          ))}
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 2, overflowY: 'auto', minHeight: '60vh' }}>
        {TABS[tabIndex]?.content ? (
          TABS[tabIndex].content
        ) : (
          helpContent?.content ? (
            <Typography variant="caption">{helpContent.content}</Typography>
          ) : (
            <Typography variant="caption">Conteúdo de ajuda não disponível</Typography>
          )
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', px: 2, py: 0.75 }}>
        {helpMode && toggleHelpMode && (
          <Button variant="outlined" color="warning" size="small" onClick={() => { toggleHelpMode(); closeHelp(); }}>
            {t('help.deactivate_btn')}
          </Button>
        )}
        <Button onClick={closeHelp} variant="contained" size="small" sx={{ ml: 'auto' }}>{t('help.close_btn')}</Button>
      </DialogActions>
    </Dialog>
  );
}
