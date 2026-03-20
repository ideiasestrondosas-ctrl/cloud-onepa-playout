import React from 'react';
import {
  Box,
  Typography,
  Section,
  Step,
  Kv,
  Alert
} from './HelpSystem';
import { useTranslation } from 'react-i18next';

export default function HelpLiveInputs() {
  const { t } = useTranslation();
  return (
    <Box>
      {/* Introduction Section */}
      <Section title={t('help.liveInputs.title')}>
        <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary', display: 'block' }}>
          {t('help.liveInputs.intro')}
        </Typography>
      </Section>

      {/* Live Inputs Tab Section */}
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
        <Kv k={t('help.liveInputs.socialStreaming.management')} v={t('help.liveInputs.socialStreaming.management') ? '' : ''} />
      </Section>

      {/* Status Monitoring Section */}
      <Section title={t('help.liveInputs.statusMonitoring.title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.liveInputs.statusMonitoring.intro')}
        </Typography>
        <Kv k={t('help.liveInputs.statusMonitoring.active')} v={t('help.liveInputs.statusMonitoring.active')} />
        <Kv k={t('help.liveInputs.statusMonitoring.connecting')} v={t('help.liveInputs.statusMonitoring.connecting')} />
        <Kv k={t('help.liveInputs.statusMonitoring.error')} v={t('help.liveInputs.statusMonitoring.error')} />
        <Kv k={t('help.liveInputs.statusMonitoring.inactive')} v={t('help.liveInputs.statusMonitoring.inactive')} />
      </Section>

      {/* Preview Section */}
      <Section title={t('help.liveInputs.preview.title')}>
        <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
          {t('help.liveInputs.preview.intro')}
        </Typography>
        <Kv k={t('help.liveInputs.preview.hls')} v={t('help.liveInputs.preview.hls')} />
        <Kv k={t('help.liveInputs.preview.latency')} v={t('help.liveInputs.preview.latency')} />
        <Kv k={t('help.liveInputs.preview.local')} v={t('help.liveInputs.preview.local')} />
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
}
