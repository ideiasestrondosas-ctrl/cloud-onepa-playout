import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    MenuItem,
    Select,
    FormControl,
    Box,
    Typography
} from '@mui/material';

const SUPPORTED_LANGS = ['pt', 'en', 'es', 'fr'];

const languages = [
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export default function LanguageSelector({ sx }) {
    const { i18n } = useTranslation();

    // On mount — normalize any stale full locale tag (e.g. 'en-US') that may
    // have been stored by a previous LanguageDetector session.
    useEffect(() => {
        const stored = localStorage.getItem('i18nextLng');
        if (stored && !SUPPORTED_LANGS.includes(stored)) {
            const normalized = stored.split('-')[0];
            const lang = SUPPORTED_LANGS.includes(normalized) ? normalized : 'pt';
            localStorage.setItem('i18nextLng', lang);
            i18n.changeLanguage(lang);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleChange = (event) => {
        const newLang = event.target.value;
        if (!SUPPORTED_LANGS.includes(newLang)) return;
        i18n.changeLanguage(newLang);
        localStorage.setItem('i18nextLng', newLang);
    };

    // resolvedLanguage is always the short code (e.g. 'en'), whereas
    // i18n.language may be 'en-US' — this ensures the Select always matches.
    const currentLang = i18n.resolvedLanguage && SUPPORTED_LANGS.includes(i18n.resolvedLanguage)
        ? i18n.resolvedLanguage
        : (i18n.language?.split('-')[0] || 'pt');

    return (
        <FormControl size="small" sx={{ minWidth: 120, ...sx }}>
            <Select
                value={currentLang}
                onChange={handleChange}
                displayEmpty
                variant="outlined"
                sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.4)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00e5ff',
                    },
                    '& .MuiSvgIcon-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                    },
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 2,
                    fontSize: '0.8rem',
                    height: '32px'
                }}
                MenuProps={{
                    PaperProps: {
                        sx: {
                            bgcolor: '#121620',
                            color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            '& .MuiMenuItem-root:hover': {
                                bgcolor: 'rgba(0, 229, 255, 0.1)',
                            },
                            '& .Mui-selected': {
                                bgcolor: 'rgba(0, 229, 255, 0.2) !important',
                            }
                        }
                    }
                }}
            >
                {languages.map((lang) => (
                    <MenuItem key={lang.code} value={lang.code}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: '1.1rem' }}>{lang.flag}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{lang.name}</Typography>
                        </Box>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
