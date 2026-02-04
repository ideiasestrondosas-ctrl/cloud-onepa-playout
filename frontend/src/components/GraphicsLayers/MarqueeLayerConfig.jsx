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

export default function MarqueeLayerConfig({ config, onSave }) {
    const [text, setText] = useState(config.text || '');
    const [fontFamily, setFontFamily] = useState(config.font_family || 'Inter');
    const [fontSize, setFontSize] = useState(config.font_size || 28);
    const [textColor, setTextColor] = useState(config.text_color || '#FFFFFF');
    const [backgroundColor, setBackgroundColor] = useState(config.background_color || 'rgba(211,47,47,0.9)');
    const [scrollSpeed, setScrollSpeed] = useState(config.scroll_speed || 50);
    const [direction, setDirection] = useState(config.direction || 'left_to_right');

    const handleSave = () => {
        onSave({
            text,
            font_family: fontFamily,
            font_size: fontSize,
            text_color: textColor,
            background_color: backgroundColor,
            scroll_speed: scrollSpeed,
            direction
        });
    };

    return (
        <Stack spacing={3}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                MARQUEE / CRAWLER CONFIGURATION
            </Typography>

            <TextField
                label="Marquee Text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                fullWidth
                required
                multiline
                rows={2}
                helperText={`${text.length} characters`}
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
                    <TextField
                        label="Font Size (px)"
                        type="number"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
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
                        placeholder="rgba(211,47,47,0.9)"
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel>Scroll Direction</InputLabel>
                        <Select value={direction} onChange={(e) => setDirection(e.target.value)} label="Scroll Direction">
                            <MenuItem value="left_to_right">Left to Right</MenuItem>
                            <MenuItem value="right_to_left">Right to Left</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Scroll Speed (px/s)"
                        type="number"
                        value={scrollSpeed}
                        onChange={(e) => setScrollSpeed(parseInt(e.target.value))}
                        fullWidth
                        helperText="Higher = faster scrolling"
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
                SAVE MARQUEE LAYER
            </Button>
        </Stack>
    );
}
