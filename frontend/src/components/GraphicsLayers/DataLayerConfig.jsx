import { useState } from 'react';
import {
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

export default function DataLayerConfig({ config, onSave }) {
    const [label, setLabel] = useState(config.label || '');
    const [value, setValue] = useState(config.value || '');
    const [fontFamily, setFontFamily] = useState(config.font_family || 'Inter');
    const [fontSize, setFontSize] = useState(config.font_size || 36);
    const [textColor, setTextColor] = useState(config.text_color || '#FFFFFF');
    const [labelColor, setLabelColor] = useState(config.label_color || '#00e5ff');
    const [backgroundColor, setBackgroundColor] = useState(config.background_color || 'rgba(0,0,0,0.75)');
    const [padding, setPadding] = useState(config.padding || 8);

    const handleSave = () => {
        onSave({
            label,
            value,
            font_family: fontFamily,
            font_size: fontSize,
            text_color: textColor,
            label_color: labelColor,
            background_color: backgroundColor,
            padding
        });
    };

    return (
        <Stack spacing={3}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                DATA PANEL CONFIGURATION
            </Typography>

            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Label / Etiqueta"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        fullWidth
                        placeholder="Ex: Temperatura, Score, Canal..."
                        helperText="Texto descritivo acima do valor"
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Value / Valor"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        fullWidth
                        required
                        placeholder="Ex: 28°C, 3-1, Direto..."
                        helperText="Conteúdo principal exibido"
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel>Font Family</InputLabel>
                        <Select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} label="Font Family">
                            <MenuItem value="Inter">Inter</MenuItem>
                            <MenuItem value="Roboto">Roboto</MenuItem>
                            <MenuItem value="Roboto Mono">Roboto Mono</MenuItem>
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
                        inputProps={{ min: 8, max: 200 }}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Text Color / Cor do Valor"
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        fullWidth
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Label Color / Cor da Etiqueta"
                        type="color"
                        value={labelColor}
                        onChange={(e) => setLabelColor(e.target.value)}
                        fullWidth
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Background Color (RGBA)"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        fullWidth
                        placeholder="rgba(0,0,0,0.75)"
                        helperText="Suporta rgba() para transparência"
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Padding Interno (px)"
                        type="number"
                        value={padding}
                        onChange={(e) => setPadding(parseInt(e.target.value))}
                        fullWidth
                        inputProps={{ min: 0, max: 64 }}
                        helperText="Espaçamento interno do painel"
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
                SAVE DATA LAYER
            </Button>
        </Stack>
    );
}
