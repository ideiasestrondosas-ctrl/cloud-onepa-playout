import { useState, useEffect } from 'react';
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

export default function ClockLayerConfig({ config, onSave }) {
    const [format, setFormat] = useState(config.format || 'HH:mm:ss');
    const [timezone, setTimezone] = useState(config.timezone || 'UTC');
    const [fontFamily, setFontFamily] = useState(config.font_family || 'Roboto Mono');
    const [fontSize, setFontSize] = useState(config.font_size || 48);
    const [fontColor, setFontColor] = useState(config.font_color || '#FFFFFF');
    const [backgroundColor, setBackgroundColor] = useState(config.background_color || 'rgba(0,0,0,0.7)');
    const [showDate, setShowDate] = useState(config.show_date || false);

    const handleSave = () => {
        onSave({
            format,
            timezone,
            font_family: fontFamily,
            font_size: fontSize,
            font_color: fontColor,
            background_color: backgroundColor,
            show_date: showDate
        });
    };

    return (
        <Stack spacing={3}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                CLOCK CONFIGURATION
            </Typography>

            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel>Time Format</InputLabel>
                        <Select value={format} onChange={(e) => setFormat(e.target.value)} label="Time Format">
                            <MenuItem value="HH:mm:ss">24-Hour (HH:mm:ss)</MenuItem>
                            <MenuItem value="hh:mm:ss A">12-Hour (hh:mm:ss AM/PM)</MenuItem>
                            <MenuItem value="HH:mm">24-Hour Short (HH:mm)</MenuItem>
                            <MenuItem value="hh:mm A">12-Hour Short (hh:mm AM/PM)</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel>Timezone</InputLabel>
                        <Select value={timezone} onChange={(e) => setTimezone(e.target.value)} label="Timezone">
                            <MenuItem value="UTC">UTC (Coordinated Universal Time)</MenuItem>

                            {/* Americas - North */}
                            <MenuItem disabled sx={{ fontWeight: 700, color: 'primary.main' }}>── NORTH AMERICA ──</MenuItem>
                            <MenuItem value="America/New_York">Eastern Time (New York)</MenuItem>
                            <MenuItem value="America/Chicago">Central Time (Chicago)</MenuItem>
                            <MenuItem value="America/Denver">Mountain Time (Denver)</MenuItem>
                            <MenuItem value="America/Phoenix">Arizona (Phoenix)</MenuItem>
                            <MenuItem value="America/Los_Angeles">Pacific Time (Los Angeles)</MenuItem>
                            <MenuItem value="America/Anchorage">Alaska Time</MenuItem>
                            <MenuItem value="America/Honolulu">Hawaii Time</MenuItem>
                            <MenuItem value="America/Toronto">Canada Eastern (Toronto)</MenuItem>
                            <MenuItem value="America/Winnipeg">Canada Central (Winnipeg)</MenuItem>
                            <MenuItem value="America/Edmonton">Canada Mountain (Edmonton)</MenuItem>
                            <MenuItem value="America/Vancouver">Canada Pacific (Vancouver)</MenuItem>
                            <MenuItem value="America/Halifax">Canada Atlantic (Halifax)</MenuItem>
                            <MenuItem value="America/St_Johns">Newfoundland (St. John's)</MenuItem>

                            {/* Americas - Central & Caribbean */}
                            <MenuItem disabled sx={{ fontWeight: 700, color: 'primary.main' }}>── CENTRAL AMERICA & CARIBBEAN ──</MenuItem>
                            <MenuItem value="America/Mexico_City">Mexico City</MenuItem>
                            <MenuItem value="America/Cancun">Cancún (Mexico)</MenuItem>
                            <MenuItem value="America/Guatemala">Guatemala City</MenuItem>
                            <MenuItem value="America/Tegucigalpa">Tegucigalpa (Honduras)</MenuItem>
                            <MenuItem value="America/San_Jose">San José (Costa Rica)</MenuItem>
                            <MenuItem value="America/Panama">Panama City</MenuItem>
                            <MenuItem value="America/Havana">Havana (Cuba)</MenuItem>
                            <MenuItem value="America/Jamaica">Kingston (Jamaica)</MenuItem>
                            <MenuItem value="America/Santo_Domingo">Santo Domingo (Dominican Republic)</MenuItem>
                            <MenuItem value="America/Puerto_Rico">San Juan (Puerto Rico)</MenuItem>

                            {/* Americas - South */}
                            <MenuItem disabled sx={{ fontWeight: 700, color: 'primary.main' }}>── SOUTH AMERICA ──</MenuItem>
                            <MenuItem value="America/Caracas">Caracas (Venezuela)</MenuItem>
                            <MenuItem value="America/Bogota">Bogotá (Colombia)</MenuItem>
                            <MenuItem value="America/Lima">Lima (Peru)</MenuItem>
                            <MenuItem value="America/Guayaquil">Guayaquil (Ecuador)</MenuItem>
                            <MenuItem value="America/La_Paz">La Paz (Bolivia)</MenuItem>
                            <MenuItem value="America/Santiago">Santiago (Chile)</MenuItem>
                            <MenuItem value="America/Asuncion">Asunción (Paraguay)</MenuItem>
                            <MenuItem value="America/Montevideo">Montevideo (Uruguay)</MenuItem>
                            <MenuItem value="America/Buenos_Aires">Buenos Aires (Argentina)</MenuItem>
                            <MenuItem value="America/Sao_Paulo">São Paulo (Brazil)</MenuItem>
                            <MenuItem value="America/Rio_Branco">Rio Branco (Brazil - Acre)</MenuItem>
                            <MenuItem value="America/Manaus">Manaus (Brazil - Amazonas)</MenuItem>

                            {/* Europe - West */}
                            <MenuItem disabled sx={{ fontWeight: 700, color: 'primary.main' }}>── WESTERN EUROPE ──</MenuItem>
                            <MenuItem value="Europe/London">London (UK)</MenuItem>
                            <MenuItem value="Europe/Dublin">Dublin (Ireland)</MenuItem>
                            <MenuItem value="Europe/Lisbon">Lisbon (Portugal)</MenuItem>
                            <MenuItem value="Europe/Paris">Paris (France)</MenuItem>
                            <MenuItem value="Europe/Brussels">Brussels (Belgium)</MenuItem>
                            <MenuItem value="Europe/Amsterdam">Amsterdam (Netherlands)</MenuItem>
                            <MenuItem value="Europe/Luxembourg">Luxembourg</MenuItem>
                            <MenuItem value="Europe/Madrid">Madrid (Spain)</MenuItem>
                            <MenuItem value="Europe/Andorra">Andorra</MenuItem>
                            <MenuItem value="Europe/Monaco">Monaco</MenuItem>

                            {/* Europe - Central */}
                            <MenuItem disabled sx={{ fontWeight: 700, color: 'primary.main' }}>── CENTRAL EUROPE ──</MenuItem>
                            <MenuItem value="Europe/Berlin">Berlin (Germany)</MenuItem>
                            <MenuItem value="Europe/Rome">Rome (Italy)</MenuItem>
                            <MenuItem value="Europe/Vienna">Vienna (Austria)</MenuItem>
                            <MenuItem value="Europe/Zurich">Zurich (Switzerland)</MenuItem>
                            <MenuItem value="Europe/Prague">Prague (Czech Republic)</MenuItem>
                            <MenuItem value="Europe/Budapest">Budapest (Hungary)</MenuItem>
                            <MenuItem value="Europe/Warsaw">Warsaw (Poland)</MenuItem>
                            <MenuItem value="Europe/Copenhagen">Copenhagen (Denmark)</MenuItem>
                            <MenuItem value="Europe/Stockholm">Stockholm (Sweden)</MenuItem>
                            <MenuItem value="Europe/Oslo">Oslo (Norway)</MenuItem>

                            {/* Europe - East */}
                            <MenuItem disabled sx={{ fontWeight: 700, color: 'primary.main' }}>── EASTERN EUROPE ──</MenuItem>
                            <MenuItem value="Europe/Athens">Athens (Greece)</MenuItem>
                            <MenuItem value="Europe/Bucharest">Bucharest (Romania)</MenuItem>
                            <MenuItem value="Europe/Sofia">Sofia (Bulgaria)</MenuItem>
                            <MenuItem value="Europe/Helsinki">Helsinki (Finland)</MenuItem>
                            <MenuItem value="Europe/Tallinn">Tallinn (Estonia)</MenuItem>
                            <MenuItem value="Europe/Riga">Riga (Latvia)</MenuItem>
                            <MenuItem value="Europe/Vilnius">Vilnius (Lithuania)</MenuItem>
                            <MenuItem value="Europe/Kiev">Kyiv (Ukraine)</MenuItem>
                            <MenuItem value="Europe/Moscow">Moscow (Russia)</MenuItem>
                            <MenuItem value="Europe/Istanbul">Istanbul (Turkey)</MenuItem>

                            {/* Asia - Middle East */}
                            <MenuItem disabled sx={{ fontWeight: 700, color: 'primary.main' }}>── MIDDLE EAST ──</MenuItem>
                            <MenuItem value="Asia/Jerusalem">Jerusalem (Israel)</MenuItem>
                            <MenuItem value="Asia/Beirut">Beirut (Lebanon)</MenuItem>
                            <MenuItem value="Asia/Damascus">Damascus (Syria)</MenuItem>
                            <MenuItem value="Asia/Amman">Amman (Jordan)</MenuItem>
                            <MenuItem value="Asia/Baghdad">Baghdad (Iraq)</MenuItem>
                            <MenuItem value="Asia/Kuwait">Kuwait City</MenuItem>
                            <MenuItem value="Asia/Riyadh">Riyadh (Saudi Arabia)</MenuItem>
                            <MenuItem value="Asia/Qatar">Doha (Qatar)</MenuItem>
                            <MenuItem value="Asia/Bahrain">Manama (Bahrain)</MenuItem>
                            <MenuItem value="Asia/Dubai">Dubai (UAE)</MenuItem>
                            <MenuItem value="Asia/Muscat">Muscat (Oman)</MenuItem>
                            <MenuItem value="Asia/Tehran">Tehran (Iran)</MenuItem>

                            {/* Asia - South */}
                            <MenuItem disabled sx={{ fontWeight: 700, color: 'primary.main' }}>── SOUTH ASIA ──</MenuItem>
                            <MenuItem value="Asia/Kabul">Kabul (Afghanistan)</MenuItem>
                            <MenuItem value="Asia/Karachi">Karachi (Pakistan)</MenuItem>
                            <MenuItem value="Asia/Kolkata">Kolkata (India)</MenuItem>
                            <MenuItem value="Asia/Colombo">Colombo (Sri Lanka)</MenuItem>
                            <MenuItem value="Asia/Kathmandu">Kathmandu (Nepal)</MenuItem>
                            <MenuItem value="Asia/Dhaka">Dhaka (Bangladesh)</MenuItem>

                            {/* Asia - Southeast */}
                            <MenuItem disabled sx={{ fontWeight: 700, color: 'primary.main' }}>── SOUTHEAST ASIA ──</MenuItem>
                            <MenuItem value="Asia/Yangon">Yangon (Myanmar)</MenuItem>
                            <MenuItem value="Asia/Bangkok">Bangkok (Thailand)</MenuItem>
                            <MenuItem value="Asia/Ho_Chi_Minh">Ho Chi Minh City (Vietnam)</MenuItem>
                            <MenuItem value="Asia/Phnom_Penh">Phnom Penh (Cambodia)</MenuItem>
                            <MenuItem value="Asia/Vientiane">Vientiane (Laos)</MenuItem>
                            <MenuItem value="Asia/Kuala_Lumpur">Kuala Lumpur (Malaysia)</MenuItem>
                            <MenuItem value="Asia/Singapore">Singapore</MenuItem>
                            <MenuItem value="Asia/Jakarta">Jakarta (Indonesia)</MenuItem>
                            <MenuItem value="Asia/Makassar">Makassar (Indonesia)</MenuItem>
                            <MenuItem value="Asia/Manila">Manila (Philippines)</MenuItem>
                            <MenuItem value="Asia/Brunei">Bandar Seri Begawan (Brunei)</MenuItem>
                            <MenuItem value="Asia/Dili">Dili (Timor-Leste)</MenuItem>

                            {/* Asia - East */}
                            <MenuItem disabled sx={{ fontWeight: 700, color: 'primary.main' }}>── EAST ASIA ──</MenuItem>
                            <MenuItem value="Asia/Hong_Kong">Hong Kong</MenuItem>
                            <MenuItem value="Asia/Macau">Macau</MenuItem>
                            <MenuItem value="Asia/Shanghai">Shanghai (China)</MenuItem>
                            <MenuItem value="Asia/Taipei">Taipei (Taiwan)</MenuItem>
                            <MenuItem value="Asia/Tokyo">Tokyo (Japan)</MenuItem>
                            <MenuItem value="Asia/Seoul">Seoul (South Korea)</MenuItem>
                            <MenuItem value="Asia/Pyongyang">Pyongyang (North Korea)</MenuItem>
                            <MenuItem value="Asia/Ulaanbaatar">Ulaanbaatar (Mongolia)</MenuItem>

                            {/* Africa - North */}
                            <MenuItem disabled sx={{ fontWeight: 700, color: 'primary.main' }}>── NORTH AFRICA ──</MenuItem>
                            <MenuItem value="Africa/Cairo">Cairo (Egypt)</MenuItem>
                            <MenuItem value="Africa/Tripoli">Tripoli (Libya)</MenuItem>
                            <MenuItem value="Africa/Tunis">Tunis (Tunisia)</MenuItem>
                            <MenuItem value="Africa/Algiers">Algiers (Algeria)</MenuItem>
                            <MenuItem value="Africa/Casablanca">Casablanca (Morocco)</MenuItem>

                            {/* Africa - West */}
                            <MenuItem disabled sx={{ fontWeight: 700, color: 'primary.main' }}>── WEST AFRICA ──</MenuItem>
                            <MenuItem value="Africa/Lagos">Lagos (Nigeria)</MenuItem>
                            <MenuItem value="Africa/Accra">Accra (Ghana)</MenuItem>
                            <MenuItem value="Africa/Abidjan">Abidjan (Ivory Coast)</MenuItem>
                            <MenuItem value="Africa/Dakar">Dakar (Senegal)</MenuItem>
                            <MenuItem value="Africa/Bamako">Bamako (Mali)</MenuItem>

                            {/* Africa - East */}
                            <MenuItem disabled sx={{ fontWeight: 700, color: 'primary.main' }}>── EAST AFRICA ──</MenuItem>
                            <MenuItem value="Africa/Nairobi">Nairobi (Kenya)</MenuItem>
                            <MenuItem value="Africa/Dar_es_Salaam">Dar es Salaam (Tanzania)</MenuItem>
                            <MenuItem value="Africa/Kampala">Kampala (Uganda)</MenuItem>
                            <MenuItem value="Africa/Addis_Ababa">Addis Ababa (Ethiopia)</MenuItem>
                            <MenuItem value="Africa/Mogadishu">Mogadishu (Somalia)</MenuItem>

                            {/* Africa - South */}
                            <MenuItem disabled sx={{ fontWeight: 700, color: 'primary.main' }}>── SOUTHERN AFRICA ──</MenuItem>
                            <MenuItem value="Africa/Johannesburg">Johannesburg (South Africa)</MenuItem>
                            <MenuItem value="Africa/Harare">Harare (Zimbabwe)</MenuItem>
                            <MenuItem value="Africa/Lusaka">Lusaka (Zambia)</MenuItem>
                            <MenuItem value="Africa/Maputo">Maputo (Mozambique)</MenuItem>
                            <MenuItem value="Africa/Windhoek">Windhoek (Namibia)</MenuItem>

                            {/* Oceania */}
                            <MenuItem disabled sx={{ fontWeight: 700, color: 'primary.main' }}>── OCEANIA ──</MenuItem>
                            <MenuItem value="Australia/Sydney">Sydney (Australia)</MenuItem>
                            <MenuItem value="Australia/Melbourne">Melbourne (Australia)</MenuItem>
                            <MenuItem value="Australia/Brisbane">Brisbane (Australia)</MenuItem>
                            <MenuItem value="Australia/Perth">Perth (Australia)</MenuItem>
                            <MenuItem value="Australia/Adelaide">Adelaide (Australia)</MenuItem>
                            <MenuItem value="Australia/Darwin">Darwin (Australia)</MenuItem>
                            <MenuItem value="Pacific/Auckland">Auckland (New Zealand)</MenuItem>
                            <MenuItem value="Pacific/Fiji">Suva (Fiji)</MenuItem>
                            <MenuItem value="Pacific/Port_Moresby">Port Moresby (Papua New Guinea)</MenuItem>
                            <MenuItem value="Pacific/Guam">Hagåtña (Guam)</MenuItem>
                            <MenuItem value="Pacific/Honolulu">Honolulu (Hawaii)</MenuItem>
                            <MenuItem value="Pacific/Tahiti">Papeete (Tahiti)</MenuItem>
                            <MenuItem value="Pacific/Samoa">Apia (Samoa)</MenuItem>
                            <MenuItem value="Pacific/Tongatapu">Nuku'alofa (Tonga)</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel>Font Family</InputLabel>
                        <Select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} label="Font Family">
                            <MenuItem value="Roboto Mono">Roboto Mono</MenuItem>
                            <MenuItem value="Inter">Inter</MenuItem>
                            <MenuItem value="Courier New">Courier New</MenuItem>
                            <MenuItem value="Arial">Arial</MenuItem>
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
                        label="Font Color"
                        type="color"
                        value={fontColor}
                        onChange={(e) => setFontColor(e.target.value)}
                        fullWidth
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Background Color (RGBA)"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        fullWidth
                        placeholder="rgba(0,0,0,0.7)"
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
                SAVE CLOCK LAYER
            </Button>
        </Stack>
    );
}
