/**
 * VirtualizedMediaGrid.jsx - Virtualized Media Grid Component
 * Usa react-window para renderizar grandes listas de mídia eficientemente
 */
import React, { useMemo, useCallback } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { Box, Card, CardMedia, CardContent, Typography, Checkbox, IconButton } from '@mui/material';
import {
    PlayArrow as PlayIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
} from '@mui/icons-material';

const CARD_WIDTH = 220;
const CARD_HEIGHT = 200;
const CARD_GAP = 16;

const MediaCard = ({ media, style, onSelect, onPlay, onEdit, onDelete, isSelected }) => {
    return (
        <Card
            style={style}
            sx={{
                m: 1,
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                cursor: 'pointer',
                border: isSelected ? '2px solid' : '1px solid',
                borderColor: isSelected ? 'primary.main' : 'rgba(255,255,255,0.1)',
                transition: 'all 0.2s',
                '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: 6,
                    borderColor: 'primary.main',
                }
            }}
            onClick={() => onSelect?.(media)}
        >
            <Box sx={{ position: 'relative' }}>
                <CardMedia
                    component="img"
                    height="120"
                    image={media.thumbnail || '/placeholder.png'}
                    alt={media.filename}
                    sx={{ objectFit: 'cover' }}
                />
                <Checkbox
                    checked={isSelected}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect?.(media);
                    }}
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        borderRadius: '0 0 8px 0',
                    }}
                />
            </Box>
            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="body2" noWrap title={media.filename}>
                    {media.filename}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {media.duration ? `${Math.floor(media.duration / 60)}:${String(Math.floor(media.duration % 60)).padStart(2, '0')}` : '--:--'}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 0.5 }}>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onPlay?.(media); }}>
                        <PlayIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit?.(media); }}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete?.(media); }} color="error">
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            </CardContent>
        </Card>
    );
};

const VirtualizedMediaGrid = ({
    media = [],
    selectedItems = [],
    onSelect,
    onPlay,
    onEdit,
    onDelete,
    containerWidth = 1200,
    containerHeight = 600,
}) => {
    // Calculate columns based on container width
    const columnCount = useMemo(() => {
        return Math.floor((containerWidth + CARD_GAP) / (CARD_WIDTH + CARD_GAP)) || 1;
    }, [containerWidth]);

    const rowCount = useMemo(() => {
        return Math.ceil(media.length / columnCount);
    }, [media.length, columnCount]);

    const Cell = useCallback(({ columnIndex, rowIndex, style }) => {
        const index = rowIndex * columnCount + columnIndex;
        const item = media[index];

        if (!item) return null;

        return (
            <MediaCard
                media={item}
                style={style}
                isSelected={selectedItems.includes(item.id)}
                onSelect={onSelect}
                onPlay={onPlay}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        );
    }, [media, columnCount, selectedItems, onSelect, onPlay, onEdit, onDelete]);

    if (!media.length) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: containerHeight }}>
                <Typography color="text.secondary">
                    No media found
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ width: containerWidth, height: containerHeight }}>
            <Grid
                columnCount={columnCount}
                columnWidth={CARD_WIDTH + CARD_GAP}
                height={containerHeight}
                rowCount={rowCount}
                rowHeight={CARD_HEIGHT + CARD_GAP}
                width={containerWidth}
            >
                {Cell}
            </Grid>
        </Box>
    );
};

export default VirtualizedMediaGrid;
