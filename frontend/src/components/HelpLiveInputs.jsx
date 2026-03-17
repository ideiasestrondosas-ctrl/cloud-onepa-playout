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
      <Section title={t('help.liveInputs.title')}>
        <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary', display: 'block' }}>
          {t('help.liveInputs.intro')}
        </Typography>
      </Section>

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

      <Section title={t('help.liveInputs.tips.title')}>
        <Typography variant="caption" sx={{ mb: 0.5, display: 'block', whiteSpace: 'pre-line' }}>
          {t('help.liveInputs.tips.content')}
        </Typography>
      </Section>
    </Box>
  );
}
