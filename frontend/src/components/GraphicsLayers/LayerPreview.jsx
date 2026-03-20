import { useState, useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';

export default function LayerPreview({ layers, onLayerMove, onLayerDoubleClick, onLayerSelect, selectedLayerId }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [draggingLayerId, setDraggingLayerId] = useState(null);
    const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Store layers in a ref to avoid stale closure in MouseUp handler
    const layersRef = useRef(layers);
    useEffect(() => {
        layersRef.current = layers;
    }, [layers]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleMouseDown = (e, layer) => {
        e.stopPropagation();
        if (onLayerSelect) onLayerSelect(layer.id);

        if (!onLayerMove) return;
        setDraggingLayerId(layer.id);
        setDragStartPos({ x: e.clientX, y: e.clientY });
        setDragOffset({ x: layer.position_x, y: layer.position_y });
    };

    const handleMouseMove = (e) => {
        if (!draggingLayerId) return;

        const dx = e.clientX - dragStartPos.x;
        const dy = e.clientY - dragStartPos.y;

        const layer = layers.find(l => l.id === draggingLayerId);
        if (!layer) return;

        let newX = dragOffset.x;
        let newY = dragOffset.y;

        if (layer.anchor === 'top-left') {
            newX = dragOffset.x + dx;
            newY = dragOffset.y + dy;
        } else if (layer.anchor === 'top-right') {
            newX = dragOffset.x - dx;
            newY = dragOffset.y + dy;
        } else if (layer.anchor === 'bottom-left') {
            newX = dragOffset.x + dx;
            newY = dragOffset.y - dy;
        } else if (layer.anchor === 'bottom-right') {
            newX = dragOffset.x - dx;
            newY = dragOffset.y - dy;
        }

        onLayerMove(draggingLayerId, Math.round(newX), Math.round(newY), false);
    };

    const handleMouseUp = () => {
        if (draggingLayerId) {
            // Access the latest layers state through the ref to avoid stale closure revert
            const latestLayer = layersRef.current.find(l => l.id === draggingLayerId);
            if (latestLayer) {
                onLayerMove(draggingLayerId, latestLayer.position_x, latestLayer.position_y, true);
            }
            setDraggingLayerId(null);
        }
    };

    useEffect(() => {
        if (draggingLayerId) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingLayerId]);

    const formatTime = (format, timezone) => {
        const options = { timeZone: timezone || 'UTC' };
        const date = new Date(currentTime.toLocaleString('en-US', options));

        if (format === 'HH:mm:ss') {
            return date.toLocaleTimeString('en-US', { ...options, hour12: false });
        } else if (format === 'hh:mm:ss A') {
            return date.toLocaleTimeString('en-US', { ...options, hour12: true });
        } else if (format === 'HH:mm') {
            return date.toLocaleTimeString('en-US', { ...options, hour12: false, hour: '2-digit', minute: '2-digit' });
        } else if (format === 'hh:mm A') {
            return date.toLocaleTimeString('en-US', { ...options, hour12: true, hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleTimeString('en-US', options);
    };

    const formatDate = (format, timezone) => {
        const tz = timezone || 'UTC';
        // Get current date in the target timezone
        const d = new Date(currentTime.toLocaleString('en-US', { timeZone: tz }));
        const pad = n => String(n).padStart(2, '0');
        const year  = d.getFullYear();
        const month = d.getMonth(); // 0-based
        const day   = d.getDate();
        const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const MONTHS_LONG  = ['January','February','March','April','May','June',
                              'July','August','September','October','November','December'];
        const DAYS_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

        switch (format) {
            case 'YYYY-MM-DD':    return `${year}-${pad(month+1)}-${pad(day)}`;
            case 'DD/MM/YYYY':   return `${pad(day)}/${pad(month+1)}/${year}`;
            case 'MM/DD/YYYY':   return `${pad(month+1)}/${pad(day)}/${year}`;
            case 'DD MMM YYYY':  return `${pad(day)} ${MONTHS_SHORT[month]} ${year}`;
            case 'MMMM DD, YYYY': return `${MONTHS_LONG[month]} ${pad(day)}, ${year}`;
            case 'ddd, DD MMM':  return `${DAYS_SHORT[d.getDay()]}, ${pad(day)} ${MONTHS_SHORT[month]}`;
            default:             return `${year}-${pad(month+1)}-${pad(day)}`;
        }
    };

    const getAnchorStyle = (anchor, x, y) => {
        const styles = {
            position: 'absolute',
        };

        switch (anchor) {
            case 'top-left':
                styles.top = y;
                styles.left = x;
                break;
            case 'top-right':
                styles.top = y;
                styles.right = x;
                break;
            case 'bottom-left':
                styles.bottom = y;
                styles.left = x;
                break;
            case 'bottom-right':
                styles.bottom = y;
                styles.right = x;
                break;
            case 'center':
                styles.top = '50%';
                styles.left = '50%';
                styles.transform = 'translate(-50%, -50%)';
                break;
            default:
                styles.top = y;
                styles.left = x;
        }

        return styles;
    };

    const renderLayer = (layer) => {
        if (!layer.enabled) return null;

        const isDraggingThis = draggingLayerId === layer.id;
        const isSelected = selectedLayerId === layer.id;

        const baseStyle = {
            ...getAnchorStyle(layer.anchor, layer.position_x, layer.position_y),
            opacity: layer.opacity,
            zIndex: layer.z_index,
            width: layer.width || 'auto',
            height: layer.height || 'auto',
            cursor: isDraggingThis ? 'grabbing' : (onLayerMove ? 'grab' : 'default'),
            userSelect: 'none',
            transition: isDraggingThis ? 'none' : 'all 0.1s ease',
            outline: isDraggingThis || isSelected ? '2px solid #00e5ff' : 'none',
            outlineOffset: '2px',
            boxShadow: isSelected ? '0 0 15px rgba(0, 229, 255, 0.4)' : 'none',
        };

        const onMouseDown = (e) => handleMouseDown(e, layer);
        const onDoubleClick = (e) => {
            e.stopPropagation();
            if (onLayerDoubleClick) onLayerDoubleClick(layer);
        };

        const typographyStyle = {
            pointerEvents: 'none', // Allow clicks to pass through to the parent Box
        };

        switch (layer.layer_type) {
            case 'clock':
                return (
                    <Box
                        key={layer.id}
                        onMouseDown={onMouseDown}
                        onDoubleClick={onDoubleClick}
                        sx={{
                            ...baseStyle,
                            fontFamily: layer.config.font_family || 'Roboto Mono',
                            fontSize: `${layer.config.font_size || 48}px`,
                            color: layer.config.font_color || '#FFFFFF',
                            backgroundColor: layer.config.background_color || 'rgba(0,0,0,0.7)',
                            padding: '10px 20px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            '&:hover': {
                                outline: (isDraggingThis || isSelected) ? '2px solid #00e5ff' : '1px dashed #00e5ff',
                            }
                        }}
                    >
                        {formatTime(layer.config.format, layer.config.timezone)}
                    </Box>
                );

            case 'lower_third':
                return (
                    <Box
                        key={layer.id}
                        onMouseDown={onMouseDown}
                        onDoubleClick={onDoubleClick}
                        sx={{
                            ...baseStyle,
                            backgroundColor: layer.config.background_color || 'rgba(0,229,255,0.9)',
                            padding: '15px 30px',
                            borderRadius: '4px',
                            minWidth: '300px',
                            '&:hover': {
                                outline: (isDraggingThis || isSelected) ? '2px solid #00e5ff' : '1px dashed #00e5ff',
                            }
                        }}
                    >
                        <Typography
                            sx={{
                                ...typographyStyle,
                                fontFamily: layer.config.font_family || 'Inter',
                                fontSize: `${layer.config.primary_font_size || 32}px`,
                                color: layer.config.text_color || '#FFFFFF',
                                fontWeight: 800,
                                lineHeight: 1.2,
                            }}
                        >
                            {layer.config.primary_text || 'Primary Text'}
                        </Typography>
                        {layer.config.secondary_text && (
                            <Typography
                                sx={{
                                    ...typographyStyle,
                                    fontFamily: layer.config.font_family || 'Inter',
                                    fontSize: `${layer.config.secondary_font_size || 24}px`,
                                    color: layer.config.text_color || '#FFFFFF',
                                    fontWeight: 400,
                                    lineHeight: 1.2,
                                    mt: 0.5,
                                }}
                            >
                                {layer.config.secondary_text}
                            </Typography>
                        )}
                    </Box>
                );

            case 'marquee':
                const direction = layer.config.direction || 'right_to_left';
                const animationName = direction === 'left_to_right' ? 'marquee-ltr' : 'marquee-rtl';

                return (
                    <Box
                        key={layer.id}
                        onMouseDown={onMouseDown}
                        onDoubleClick={onDoubleClick}
                        sx={{
                            ...baseStyle,
                            backgroundColor: layer.config.background_color || 'rgba(211,47,47,0.9)',
                            padding: '10px 20px',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            width: '100%',
                            '&:hover': {
                                outline: (isDraggingThis || isSelected) ? '2px solid #00e5ff' : '1px dashed #00e5ff',
                            }
                        }}
                    >
                        <Typography
                            sx={{
                                ...typographyStyle,
                                fontFamily: layer.config.font_family || 'Inter',
                                fontSize: `${layer.config.font_size || 28}px`,
                                color: layer.config.text_color || '#FFFFFF',
                                fontWeight: 700,
                                display: 'inline-block',
                                animation: `${animationName} ${100 / (layer.config.scroll_speed || 50)}s linear infinite`,
                                '@keyframes marquee-rtl': {
                                    '0%': { transform: 'translateX(100%)' },
                                    '100%': { transform: 'translateX(-100%)' },
                                },
                                '@keyframes marquee-ltr': {
                                    '0%': { transform: 'translateX(-100%)' },
                                    '100%': { transform: 'translateX(100%)' },
                                },
                            }}
                        >
                            {layer.config.text || 'Marquee Text'}
                        </Typography>
                    </Box>
                );

            case 'date': {
                const dateStr = (layer.config.prefix || '') + formatDate(
                    layer.config.format || 'YYYY-MM-DD',
                    layer.config.timezone
                );
                return (
                    <Box
                        key={layer.id}
                        onMouseDown={onMouseDown}
                        onDoubleClick={onDoubleClick}
                        sx={{
                            ...baseStyle,
                            backgroundColor: layer.config.background_color || 'rgba(0,0,0,0.5)',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            '&:hover': {
                                outline: (isDraggingThis || isSelected) ? '2px solid #00e5ff' : '1px dashed #00e5ff',
                            }
                        }}
                    >
                        <Typography sx={{
                            ...typographyStyle,
                            fontFamily: layer.config.font_family || 'Inter',
                            fontSize: `${layer.config.font_size || 28}px`,
                            color: layer.config.font_color || '#FFFFFF',
                            fontWeight: 700,
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                        }}>
                            {dateStr}
                        </Typography>
                    </Box>
                );
            }

            case 'data':
                return (
                    <Box
                        key={layer.id}
                        onMouseDown={onMouseDown}
                        onDoubleClick={onDoubleClick}
                        sx={{
                            ...baseStyle,
                            backgroundColor: layer.config.background_color || 'rgba(0,0,0,0.75)',
                            padding: `${layer.config.padding || 8}px`,
                            borderRadius: '4px',
                            display: 'inline-flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            minWidth: 120,
                            '&:hover': {
                                outline: (isDraggingThis || isSelected) ? '2px solid #00e5ff' : '1px dashed #00e5ff',
                            }
                        }}
                    >
                        <Typography sx={{
                            ...typographyStyle,
                            fontFamily: layer.config.font_family || 'Inter',
                            fontSize: `${Math.round((layer.config.font_size || 36) * 0.55)}px`,
                            color: layer.config.label_color || '#00e5ff',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            lineHeight: 1.2,
                        }}>
                            {layer.config.label || layer.name}
                        </Typography>
                        <Typography sx={{
                            ...typographyStyle,
                            fontFamily: layer.config.font_family || 'Inter',
                            fontSize: `${layer.config.font_size || 36}px`,
                            color: layer.config.text_color || '#FFFFFF',
                            fontWeight: 800,
                            lineHeight: 1.1,
                        }}>
                            {layer.config.value || 'N/A'}
                        </Typography>
                    </Box>
                );

            default:
                return null;
        }
    };

    const enabledLayers = layers.filter(l => l.enabled).sort((a, b) => a.z_index - b.z_index);

    const handleBackgroundClick = (e) => {
        if (e.target === e.currentTarget && onLayerSelect) {
            onLayerSelect(null);
        }
    };

    return (
        <Box
            sx={{ position: 'relative', width: '100%', height: '100%' }}
            onClick={handleBackgroundClick}
        >
            {enabledLayers.map(renderLayer)}
        </Box>
    );
}
