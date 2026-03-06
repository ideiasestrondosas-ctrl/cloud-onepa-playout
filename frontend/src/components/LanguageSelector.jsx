import { useTranslation } from 'react-i18next';
import {
    MenuItem,
    Select,
    FormControl,
    Box,
    Typography
} from '@mui/material';

const languages = [
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export default function LanguageSelector({ sx }) {
    const { i18n } = useTranslation();

    const handleChange = (event) => {
        i18n.changeLanguage(event.target.value);
    };

    return (
        <FormControl size="small" sx={{ minWidth: 120, ...sx }}>
            <Select
                value={i18n.language || 'pt'}
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
