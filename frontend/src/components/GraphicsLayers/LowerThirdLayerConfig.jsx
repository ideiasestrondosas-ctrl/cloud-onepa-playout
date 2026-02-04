import { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    Stack,
    Grid
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

export default function LowerThirdLayerConfig({ config, onSave }) {
    const [primaryText, setPrimaryText] = useState(config.primary_text || '');
    const [secondaryText, setSecondaryText] = useState(config.secondary_text || '');
    const [fontFamily, setFontFamily] = useState(config.font_family || 'Inter');
    const [primaryFontSize, setPrimaryFontSize] = useState(config.primary_font_size || 32);
    const [secondaryFontSize, setSecondaryFontSize] = useState(config.secondary_font_size || 24);
    const [textColor, setTextColor] = useState(config.text_color || '#FFFFFF');
    const [backgroundColor, setBackgroundColor] = useState(config.background_color || 'rgba(0,229,255,0.9)');
    const [animation, setAnimation] = useState(config.animation || 'slide_in_left');
    const [duration, setDuration] = useState(config.duration || 5000);

    const handleSave = () => {
        onSave({
            primary_text: primaryText,
            secondary_text: secondaryText,
            font_family: fontFamily,
            primary_font_size: primaryFontSize,
            secondary_font_size: secondaryFontSize,
            text_color: textColor,
            background_color: backgroundColor,
            animation,
            duration
        });
    };

    return (
        <Stack spacing={3}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                LOWER THIRD CONFIGURATION
            </Typography>

            <TextField
                label="Primary Text (Name/Title)"
                value={primaryText}
                onChange={(e) => setPrimaryText(e.target.value)}
                fullWidth
                required
            />

            <TextField
                label="Secondary Text (Subtitle/Description)"
                value={secondaryText}
                onChange={(e) => setSecondaryText(e.target.value)}
                fullWidth
            />

            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel>Font Family</InputLabel>
                        <Select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} label="Font Family">
                            <MenuItem value="Inter">Inter</MenuItem>
                            <MenuItem value="Roboto">Roboto</MenuItem>
                            <MenuItem value="Arial">Arial</MenuItem>
                            <MenuItem value="Helvetica">Helvetica</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel>Animation</InputLabel>
                        <Select value={animation} onChange={(e) => setAnimation(e.target.value)} label="Animation">
                            <MenuItem value="slide_in_left">Slide In Left</MenuItem>
                            <MenuItem value="slide_in_right">Slide In Right</MenuItem>
                            <MenuItem value="fade_in">Fade In</MenuItem>
                            <MenuItem value="none">None</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Primary Font Size (px)"
                        type="number"
                        value={primaryFontSize}
                        onChange={(e) => setPrimaryFontSize(parseInt(e.target.value))}
                        fullWidth
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Secondary Font Size (px)"
                        type="number"
                        value={secondaryFontSize}
                        onChange={(e) => setSecondaryFontSize(parseInt(e.target.value))}
                        fullWidth
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Text Color"
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        fullWidth
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Background Color (RGBA)"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        fullWidth
                        placeholder="rgba(0,229,255,0.9)"
                    />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        label="Display Duration (ms)"
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value))}
                        fullWidth
                        helperText="How long the lower third stays visible (milliseconds)"
                    />
                </Grid>
            </Grid>

            <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                fullWidth
                sx={{ mt: 2, fontWeight: 800 }}
            >
                SAVE LOWER THIRD LAYER
            </Button>
        </Stack>
    );
}
