/**
 * UsersTab.jsx - Gestão de Utilizadores, Perfis e Acesso a Canais
 * Extraído do Settings.jsx principal para otimização de RAM.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Paper,
    ToggleButtonGroup,
    ToggleButton,
    Button,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Avatar,
    Chip,
    Switch,
    Stack,
    Tooltip,
    IconButton
} from '@mui/material';
import {
    Add as AddIcon,
    Tv as TvIcon,
    Delete as DeleteIcon,
    AutoFixHigh as MagicIcon,
    Settings as SettingsIcon,
    Edit as EditIcon
} from '@mui/icons-material';

const UsersTab = ({
    viewMode,
    setViewMode,
    users,
    profiles,
    setUserDialogOpen,
    setProfileDialogOpen,
    setCurrentProfile,
    handleOpenPasswordDialog,
    setChannelAccessUser,
    setAllChannels,
    setChannelAccessIds,
    setChannelAccessOpen,
    handleDeleteUser,
    handleDeleteProfile,
    channelsAPI,
    userChannelAPI
}) => {
    const { t } = useTranslation();

    return (
        <Box>
            <Paper className="glass-panel" sx={{ p: 4 }}>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" className="neon-text" sx={{ fontWeight: 800 }}>
                            {t('settings.users.header.title')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            {t('settings.users.header.subtitle')}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <ToggleButtonGroup
                            value={viewMode}
                            exclusive
                            onChange={(e, newMode) => newMode && setViewMode(newMode)}
                            size="small"
                            sx={{ height: 36 }}
                        >
                            <ToggleButton value="users" sx={{ fontWeight: 800 }}>{t('settings.users.tabs.users')}</ToggleButton>
                            <ToggleButton value="profiles" sx={{ fontWeight: 800 }}>{t('settings.users.tabs.profiles')}</ToggleButton>
                        </ToggleButtonGroup>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => {
                                if (viewMode === 'users') setUserDialogOpen(true);
                                else {
                                    setCurrentProfile({ name: '', permissions: [] });
                                    setProfileDialogOpen(true);
                                }
                            }}
                            sx={{ borderRadius: 3, fontWeight: 800, px: 3 }}
                        >
                            {viewMode === 'users' ? t('settings.users.header.add_user_btn') : t('settings.users.header.add_profile_btn')}
                        </Button>
                    </Box>
                </Box>

                <TableContainer sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                                <TableCell sx={{ fontWeight: 900, color: 'primary.main', fontSize: '0.7rem' }}>{t('settings.users.table.username')}</TableCell>
                                <TableCell sx={{ fontWeight: 900, color: 'primary.main', fontSize: '0.7rem' }}>
                                    {viewMode === 'users' ? t('settings.users.table.profile') : t('settings.users.table.description')}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 900, color: 'primary.main', fontSize: '0.7rem' }}>{t('settings.users.table.status')}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 900, color: 'primary.main', fontSize: '0.7rem' }}>{t('settings.users.table.actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {viewMode === 'users' ? (
                                Array.isArray(users) && users.map((user) => (
                                    <TableRow key={user.id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem', bgcolor: 'primary.main', fontWeight: 800 }}>
                                                    {user.username[0].toUpperCase()}
                                                </Avatar>
                                                <Typography sx={{ fontWeight: 800, fontSize: '0.85rem' }}>{user.username.toUpperCase()}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.profile_name?.toUpperCase() || profiles.find(p => p.id === user.profile_id)?.name?.toUpperCase() || (user.role || 'USER').toUpperCase()}
                                                size="small"
                                                variant="outlined"
                                                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, borderColor: 'rgba(255,255,255,0.2)' }}
                                            />
                                        </TableCell>
                                        <TableCell><Switch checked size="small" disabled sx={{ opacity: 0.5 }} /></TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <Tooltip title={t('settings.users.tooltips.change_password')}>
                                                    <IconButton size="small" onClick={() => handleOpenPasswordDialog(user)} sx={{ color: 'primary.main' }}>
                                                        <MagicIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Channel Access">
                                                    <IconButton
                                                        size="small"
                                                        sx={{ color: 'info.main' }}
                                                        onClick={async () => {
                                                            setChannelAccessUser(user);
                                                            try {
                                                                const chRes = await channelsAPI.list();
                                                                setAllChannels(chRes.data || []);
                                                            } catch { setAllChannels([]); }
                                                            try {
                                                                const accRes = await userChannelAPI.getChannels(user.id);
                                                                setChannelAccessIds(accRes.data || []);
                                                            } catch { setChannelAccessIds([]); }
                                                            setChannelAccessOpen(true);
                                                        }}
                                                    >
                                                        <TvIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                {user.username !== 'admin' && (
                                                    <Tooltip title={t('settings.users.tooltips.delete_user')}>
                                                        <IconButton size="small" onClick={() => handleDeleteUser(user.id)} color="error">
                                                            <DeleteIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                Array.isArray(profiles) && profiles.map((profile) => (
                                    <TableRow key={profile.id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.main' }}>
                                                    <SettingsIcon sx={{ fontSize: 16 }} />
                                                </Avatar>
                                                <Typography sx={{ fontWeight: 800, fontSize: '0.85rem' }}>{profile.name.toUpperCase()}</Typography>
                                                {profile.is_system && <Chip label={t('settings.users.table.system_badge')} color="info" size="small" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 900 }} />}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.65rem', fontWeight: 600 }}>
                                                {t('settings.users.table.permissions')}: {(profile.permissions || []).join(', ').toUpperCase()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={t('settings.users.table.active')} size="small" color="success" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 900, bgcolor: 'rgba(76,175,80,0.1)' }} />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <Tooltip title={t('settings.users.tooltips.edit_profile')}>
                                                    <IconButton size="small" onClick={() => { setCurrentProfile(profile); setProfileDialogOpen(true); }}>
                                                        <EditIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                {!profile.is_system && (
                                                    <Tooltip title={t('settings.users.tooltips.delete_profile')}>
                                                        <IconButton size="small" onClick={() => handleDeleteProfile(profile.id)} color="error">
                                                            <DeleteIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default UsersTab;
