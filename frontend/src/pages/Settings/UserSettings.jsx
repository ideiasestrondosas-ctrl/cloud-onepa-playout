/**
 * UserSettings.jsx - Users Tab Component
 * Extraído do Settings.jsx principal para melhorar manutenibilidade
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Paper,
    Avatar,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Add as AddIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import { authAPI } from '../../services/api';

const UserSettings = ({ refreshKey }) => {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        profile_id: '',
        is_active: true,
    });

    useEffect(() => {
        loadData();
    }, [refreshKey]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersRes, profilesRes] = await Promise.all([
                authAPI.getUsers(),
                authAPI.getProfiles(),
            ]);
            setUsers(usersRes.data || []);
            setProfiles(profilesRes.data || []);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm(t('settings.users.confirm_delete', 'Are you sure you want to delete this user?'))) {
            return;
        }
        try {
            await authAPI.deleteUser(userId);
            showSuccess(t('settings.users.deleted', 'User deleted successfully'));
            loadData();
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const handleSaveUser = async () => {
        try {
            if (editingUser?.id) {
                await authAPI.updateUser(editingUser.id, newUser);
            } else {
                await authAPI.createUser(newUser);
            }
            setDialogOpen(false);
            setEditingUser(null);
            setNewUser({ username: '', password: '', profile_id: '', is_active: true });
            loadData();
        } catch (error) {
            console.error('Error saving user:', error);
        }
    };

    const openEditDialog = (user) => {
        setEditingUser(user);
        setNewUser({
            username: user.username,
            password: '',
            profile_id: user.profile_id,
            is_active: user.is_active,
        });
        setDialogOpen(true);
    };

    const openAddDialog = () => {
        setEditingUser(null);
        setNewUser({ username: '', password: '', profile_id: '', is_active: true });
        setDialogOpen(true);
    };

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t('settings.users.title', 'User Management')}
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={openAddDialog}
                >
                    {t('settings.users.add', 'Add User')}
                </Button>
            </Box>

            <TableContainer component={Paper} sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                            <TableCell sx={{ fontWeight: 900, color: 'primary.main', fontSize: '0.7rem' }}>
                                {t('settings.users.table.username', 'Username')}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 900, color: 'primary.main', fontSize: '0.7rem' }}>
                                {t('settings.users.table.profile', 'Profile')}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 900, color: 'primary.main', fontSize: '0.7rem' }}>
                                {t('settings.users.table.status', 'Status')}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 900, color: 'primary.main', fontSize: '0.7rem' }}>
                                {t('settings.users.table.actions', 'Actions')}
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                            {user.username?.charAt(0).toUpperCase()}
                                        </Avatar>
                                        {user.username}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    {profiles.find(p => p.id === user.profile_id)?.name || '-'}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        size="small"
                                        label={user.is_active ? 'Active' : 'Inactive'}
                                        color={user.is_active ? 'success' : 'default'}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => openEditDialog(user)}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => handleDeleteUser(user.id)} color="error">
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* User Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingUser ? t('settings.users.edit_title', 'Edit User') : t('settings.users.add_title', 'Add User')}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            fullWidth
                            label={t('settings.users.username', 'Username')}
                            value={newUser.username}
                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        />
                        {!editingUser && (
                            <TextField
                                fullWidth
                                type="password"
                                label={t('settings.users.password', 'Password')}
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            />
                        )}
                        <FormControl fullWidth>
                            <InputLabel>{t('settings.users.profile', 'Profile')}</InputLabel>
                            <Select
                                value={newUser.profile_id}
                                label={t('settings.users.profile', 'Profile')}
                                onChange={(e) => setNewUser({ ...newUser, profile_id: e.target.value })}
                            >
                                {profiles.map((profile) => (
                                    <MenuItem key={profile.id} value={profile.id}>
                                        {profile.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
                    <Button onClick={handleSaveUser} variant="contained">
                        {t('common.save', 'Save')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserSettings;
