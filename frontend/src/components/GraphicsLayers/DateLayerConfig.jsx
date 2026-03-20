import { useState } from 'react';
import {
    Box,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    TextField,
    Typography
} from '@mui/material';

const DATE_FORMATS = [
    { value: 'YYYY-MM-DD',    label: '2026-03-20 (ISO)' },
    { value: 'DD/MM/YYYY',    label: '20/03/2026' },
    { value: 'MM/DD/YYYY',    label: '03/20/2026' },
    { value: 'DD MMM YYYY',   label: '20 Mar 2026' },
    { value: 'MMMM DD, YYYY', label: 'March 20, 2026' },
    { value: 'ddd, DD MMM',   label: 'Thu, 20 Mar' },
];

const TIMEZONES = [
    'UTC', 'Europe/Lisbon', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney',
];

const FONT_FAMILIES = ['Inter', 'Roboto', 'Arial', 'Helvetica', 'Georgia', 'Courier New', 'Times New Roman'];

export default function DateLayerConfig({ config = {}, onSave }) {
    const [form, setForm] = useState({
        format:           config.format     || 'YYYY-MM-DD',
        timezone:         config.timezone   || 'UTC',
        font_size:        config.font_size  || 28,
        font_color:       config.font_color || '#FFFFFF',
        background_color: config.background_color || 'rgba(0,0,0,0.5)',
        font_family:      config.font_family || 'Inter',
        prefix:           config.prefix || '',
    });

    const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    return (
        <Stack spacing={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                DATE LAYER
            </Typography>

            <FormControl fullWidth size="small">
                <InputLabel>Date Format</InputLabel>
                <Select value={form.format} onChange={e => set('format', e.target.value)} label="Date Format">
                    {DATE_FORMATS.map(f => (
                        <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl fullWidth size="small">
                <InputLabel>Timezone</InputLabel>
                <Select value={form.timezone} onChange={e => set('timezone', e.target.value)} label="Timezone">
                    {TIMEZONES.map(tz => (
                        <MenuItem key={tz} value={tz}>{tz}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <TextField
                label="Prefix (optional)"
                value={form.prefix}
                onChange={e => set('prefix', e.target.value)}
                size="small"
                fullWidth
                placeholder="e.g. Today: "
                helperText="Text shown before the date"
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                    label="Font Size"
                    type="number"
                    value={form.font_size}
                    onChange={e => set('font_size', parseInt(e.target.value, 10) || 28)}
                    size="small"
                    sx={{ flex: 1 }}
                    inputProps={{ min: 12, max: 120 }}
                />
                <FormControl sx={{ flex: 1 }} size="small">
                    <InputLabel>Font Family</InputLabel>
                    <Select value={form.font_family} onChange={e => set('font_family', e.target.value)} label="Font Family">
                        {FONT_FAMILIES.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                    </Select>
                </FormControl>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">Text Color</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <input
                            type="color"
                            value={form.font_color.startsWith('rgba') ? '#ffffff' : form.font_color}
                            onChange={e => set('font_color', e.target.value)}
                            style={{ width: 40, height: 40, border: 'none', cursor: 'pointer', background: 'transparent' }}
                        />
                        <TextField
                            value={form.font_color}
                            onChange={e => set('font_color', e.target.value)}
                            size="small"
                            sx={{ flex: 1 }}
                        />
                    </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">Background Color</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <input
                            type="color"
                            value={form.background_color.startsWith('rgba') ? '#000000' : form.background_color}
                            onChange={e => set('background_color', e.target.value)}
                            style={{ width: 40, height: 40, border: 'none', cursor: 'pointer', background: 'transparent' }}
                        />
                        <TextField
                            value={form.background_color}
                            onChange={e => set('background_color', e.target.value)}
                            size="small"
                            sx={{ flex: 1 }}
                        />
                    </Box>
                </Box>
            </Box>

            <Button
                variant="contained"
                onClick={() => onSave(form)}
                fullWidth
                sx={{ fontWeight: 800, borderRadius: 2, mt: 1 }}
            >
                SAVE LAYER
            </Button>
        </Stack>
    );
}
