import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Switch,
    Stack,
    Chip,
    Tooltip,
    Divider
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    DragIndicator as DragIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import graphicsLayersAPI from '../../services/graphicsLayersAPI';
import { useNotification } from '../../contexts/NotificationContext';
import ClockLayerConfig from './ClockLayerConfig';
import LowerThirdLayerConfig from './LowerThirdLayerConfig';
import MarqueeLayerConfig from './MarqueeLayerConfig';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableLayerItem({
    layer,
    index,
    onToggle,
    onEdit,
    onDelete,
    getLayerTypeLabel
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: layer.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        bgcolor: layer.enabled ? 'rgba(0,229,255,0.05)' : 'transparent',
        borderRadius: 1,
        mb: 1,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 'auto',
        position: 'relative',
        border: isDragging ? '1px solid #00e5ff' : '1px solid transparent',
        cursor: 'pointer',
    };

    return (
        <ListItem
            ref={setNodeRef}
            style={style}
            onDoubleClick={() => onEdit(layer)}
            sx={{
                '&:hover .drag-handle': { opacity: 1 },
                userSelect: 'none'
            }}
        >
            <Box
                className="drag-handle"
                {...attributes}
                {...listeners}
                sx={{
                    mr: 2,
                    opacity: 0.3,
                    cursor: 'grab',
                    '&:active': { cursor: 'grabbing' }
                }}
            >
                <DragIcon />
            </Box>
            <ListItemText
                primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                            {layer.name}
                        </Typography>
                        <Chip
                            label={getLayerTypeLabel(layer.layer_type)}
                            size="small"
                            sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }}
                        />
                    </Box>
                }
                secondary={`Z-Index: ${layer.z_index} | Position: (${layer.position_x}, ${layer.position_y})`}
            />
            <ListItemSecondaryAction>
                <Stack direction="row" spacing={1}>
                    <Tooltip title={layer.enabled ? 'Disable' : 'Enable'}>
                        <IconButton size="small" onClick={() => onToggle(layer.id)}>
                            {layer.enabled ? <VisibilityIcon /> : <VisibilityOffIcon />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => onEdit(layer)}>
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => onDelete(layer.id)} color="error">
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </ListItemSecondaryAction>
        </ListItem>
    );
}

export default function LayerManager({
    layers = [],
    onLayersChange,
    onRefresh,
    initialEditLayer,
    onEditClose
}) {
    const { showSuccess, showError } = useNotification();
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedLayer, setSelectedLayer] = useState(null);
    const [layerType, setLayerType] = useState('clock');
    const [layerName, setLayerName] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (initialEditLayer && layers.length > 0) {
            const layer = layers.find(l => l.id === initialEditLayer.id) || initialEditLayer;
            handleEditLayer(layer);
            if (onEditClose) onEditClose();
        }
    }, [initialEditLayer, layers]);

    const handleAddLayer = () => {
        setSelectedLayer(null);
        setLayerName('');
        setLayerType('clock');
        setDialogOpen(true);
    };

    const handleEditLayer = (layer) => {
        setSelectedLayer(layer);
        setLayerName(layer.name);
        setLayerType(layer.layer_type);
        setDialogOpen(true);
    };

    const handleSaveLayer = async (config) => {
        try {
            if (selectedLayer) {
                await graphicsLayersAPI.update(selectedLayer.id, {
                    name: layerName,
                    config
                });
                showSuccess('Layer updated successfully');
            } else {
                await graphicsLayersAPI.create({
                    layer_type: layerType,
                    name: layerName,
                    config
                });
                showSuccess('Layer created successfully');
            }
            setDialogOpen(false);
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Failed to save layer:', error);

            if (error.response) {
                const errorMsg = error.response.data?.error || error.message;
                showError(`Failed to save layer: ${errorMsg}`);
            } else if (error.request) {
                showError('No response from server. Please check your connection.');
            } else {
                showError(`Failed to save layer: ${error.message}`);
            }
        }
    };

    const handleDeleteLayer = async (id) => {
        if (!window.confirm('Are you sure you want to delete this layer?')) return;
        try {
            await graphicsLayersAPI.delete(id);
            showSuccess('Layer deleted successfully');
            if (onRefresh) onRefresh();
        } catch (error) {
            showError('Failed to delete layer');
        }
    };

    const handleToggleLayer = async (id) => {
        try {
            await graphicsLayersAPI.toggle(id);
            if (onRefresh) onRefresh();
        } catch (error) {
            showError('Failed to toggle layer');
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (active && over && active.id !== over.id) {
            const oldIndex = layers.findIndex((l) => l.id === active.id);
            const newIndex = layers.findIndex((l) => l.id === over.id);

            const newLayers = arrayMove(layers, oldIndex, newIndex);
            if (onLayersChange) onLayersChange(newLayers);

            try {
                await graphicsLayersAPI.reorder(newLayers.map(l => l.id));
                if (onRefresh) onRefresh();
            } catch (error) {
                showError('Failed to save layer order');
                if (onRefresh) onRefresh(); // Revert to server state
            }
        }
    };

    const getLayerTypeLabel = (type) => {
        const labels = {
            clock: 'Clock',
            lower_third: 'Lower Third',
            marquee: 'Marquee'
        };
        return labels[type] || type;
    };

    const renderLayerConfig = () => {
        const config = selectedLayer?.config || {};

        switch (layerType) {
            case 'clock':
                return <ClockLayerConfig config={config} onSave={handleSaveLayer} />;
            case 'lower_third':
                return <LowerThirdLayerConfig config={config} onSave={handleSaveLayer} />;
            case 'marquee':
                return <MarqueeLayerConfig config={config} onSave={handleSaveLayer} />;
            default:
                return null;
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>GRAPHICS LAYERS</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddLayer}
                    sx={{ fontWeight: 800, borderRadius: 2 }}
                >
                    ADD LAYER
                </Button>
            </Box>

            <Paper className="glass-panel" sx={{ p: 2 }}>
                {layers.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            No layers created yet. Click "ADD LAYER" to get started.
                        </Typography>
                    </Box>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={layers.map(l => l.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <List>
                                {layers.map((layer, index) => (
                                    <Box key={layer.id}>
                                        {index > 0 && <Divider sx={{ my: 1, opacity: 0.1 }} />}
                                        <SortableLayerItem
                                            layer={layer}
                                            index={index}
                                            onToggle={handleToggleLayer}
                                            onEdit={handleEditLayer}
                                            onDelete={handleDeleteLayer}
                                            getLayerTypeLabel={getLayerTypeLabel}
                                        />
                                    </Box>
                                ))}
                            </List>
                        </SortableContext>
                    </DndContext>
                )}
            </Paper>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>
                    {selectedLayer ? 'EDIT LAYER' : 'CREATE NEW LAYER'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 2 }}>
                        <TextField
                            label="Layer Name"
                            value={layerName}
                            onChange={(e) => setLayerName(e.target.value)}
                            fullWidth
                            required
                        />
                        {!selectedLayer && (
                            <FormControl fullWidth>
                                <InputLabel>Layer Type</InputLabel>
                                <Select value={layerType} onChange={(e) => setLayerType(e.target.value)} label="Layer Type">
                                    <MenuItem value="clock">Clock</MenuItem>
                                    <MenuItem value="lower_third">Lower Third</MenuItem>
                                    <MenuItem value="marquee">Marquee / Crawler</MenuItem>
                                </Select>
                            </FormControl>
                        )}
                        <Divider />
                        {renderLayerConfig()}
                    </Stack>
                </DialogContent>
            </Dialog>
        </Box>
    );
}
