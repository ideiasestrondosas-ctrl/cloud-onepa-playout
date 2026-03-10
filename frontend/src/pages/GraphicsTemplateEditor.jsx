import { useState, useRef, useCallback } from 'react';
import {
  Box, Grid, Paper, Typography, Button, TextField, Slider, Divider,
  List, ListItemButton, ListItemIcon, ListItemText, IconButton, Tooltip,
  Select, MenuItem, FormControl, InputLabel, Alert, Snackbar,
} from '@mui/material';
import {
  TextFields as TextIcon,
  AccessTime as ClockIcon,
  ViewStream as LowerThirdIcon,
  LinearScale as MarqueeIcon,
  Crop169 as ShapeIcon,
  Image as ImageIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Visibility as PreviewIcon,
} from '@mui/icons-material';
import { DndContext, useDraggable, useDroppable, DragOverlay } from '@dnd-kit/core';
import axios from 'axios';
import useAuthStore from '../stores/authStore';

// ─── Component types palette ─────────────────────────────────────────────────
const PALETTE_ITEMS = [
  { type: 'text',        label: 'Text',        icon: <TextIcon /> },
  { type: 'clock',       label: 'Clock',       icon: <ClockIcon /> },
  { type: 'lower_third', label: 'Lower Third', icon: <LowerThirdIcon /> },
  { type: 'marquee',     label: 'Marquee',     icon: <MarqueeIcon /> },
  { type: 'shape',       label: 'Shape',       icon: <ShapeIcon /> },
  { type: 'image',       label: 'Image',       icon: <ImageIcon /> },
];

const DEFAULT_PROPS = {
  text:        { content: 'Sample Text', fontSize: 32, color: '#ffffff', x: 10, y: 10, width: 300, height: 50, opacity: 1 },
  clock:       { format: 'HH:mm:ss', fontSize: 28, color: '#00e5ff', x: 10, y: 10, width: 200, height: 50, opacity: 1 },
  lower_third: { title: 'Name', subtitle: 'Title', color: '#00e5ff', bgColor: 'rgba(0,0,0,0.7)', x: 5, y: 75, width: 50, height: 12, opacity: 1 },
  marquee:     { content: 'Breaking news...', speed: 80, color: '#ffffff', bgColor: 'rgba(0,0,0,0.8)', x: 0, y: 90, width: 100, height: 8, opacity: 1 },
  shape:       { fill: '#00e5ff', x: 10, y: 10, width: 200, height: 100, opacity: 0.5 },
  image:       { src: '', x: 10, y: 10, width: 20, height: 20, opacity: 1 },
};

// ─── Palette Item (draggable) ─────────────────────────────────────────────────
function PaletteItem({ type, label, icon }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `palette-${type}`, data: { fromPalette: true, type } });
  return (
    <ListItemButton
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      sx={{ borderRadius: 1, mb: 0.5, opacity: isDragging ? 0.4 : 1, cursor: 'grab', '&:active': { cursor: 'grabbing' } }}
    >
      <ListItemIcon sx={{ minWidth: 36, color: 'primary.main' }}>{icon}</ListItemIcon>
      <ListItemText primary={label} primaryTypographyProps={{ variant: 'body2' }} />
    </ListItemButton>
  );
}

// ─── Canvas Element (draggable on canvas) ────────────────────────────────────
function CanvasElement({ el, selected, canvasW, canvasH, onSelect }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: el.id, data: { fromCanvas: true, elId: el.id } });
  const left = `${el.x}%`;
  const top = `${el.y}%`;
  const width = `${el.width}px`;
  const height = `${el.height}px`;

  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => { e.stopPropagation(); onSelect(el.id); }}
      sx={{
        position: 'absolute', left, top, width, height,
        opacity: isDragging ? 0.3 : el.opacity,
        cursor: 'grab',
        border: selected ? '2px solid #00e5ff' : '1px dashed rgba(255,255,255,0.2)',
        borderRadius: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: el.type === 'shape' ? el.fill :
          el.type === 'lower_third' || el.type === 'marquee' ? el.bgColor : 'transparent',
        userSelect: 'none',
        '&:active': { cursor: 'grabbing' },
      }}
    >
      {el.type === 'text' && (
        <Typography sx={{ color: el.color, fontSize: el.fontSize, fontWeight: 700, px: 1, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          {el.content}
        </Typography>
      )}
      {el.type === 'clock' && (
        <Typography sx={{ color: el.color, fontSize: el.fontSize, fontFamily: 'monospace', pointerEvents: 'none' }}>
          {new Date().toLocaleTimeString()}
        </Typography>
      )}
      {el.type === 'lower_third' && (
        <Box sx={{ p: 1, pointerEvents: 'none' }}>
          <Typography sx={{ color: el.color, fontSize: 14, fontWeight: 700 }}>{el.title}</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>{el.subtitle}</Typography>
        </Box>
      )}
      {el.type === 'marquee' && (
        <Typography sx={{ color: el.color, fontSize: 13, px: 1, pointerEvents: 'none', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {el.content}
        </Typography>
      )}
      {el.type === 'shape' && null /* rendered by bg */}
      {el.type === 'image' && (
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', pointerEvents: 'none' }}>
          IMG
        </Typography>
      )}
    </Box>
  );
}

// ─── Canvas Drop Zone ─────────────────────────────────────────────────────────
function Canvas({ elements, selectedId, onSelect, onDrop, canvasRef }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas' });

  return (
    <Box
      ref={(node) => { setNodeRef(node); canvasRef.current = node; }}
      onClick={() => onSelect(null)}
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        background: 'rgba(0,0,0,0.85)',
        border: isOver ? '2px solid #00e5ff' : '1px solid rgba(255,255,255,0.1)',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      {elements.map((el) => (
        <CanvasElement
          key={el.id}
          el={el}
          selected={selectedId === el.id}
          onSelect={onSelect}
        />
      ))}
      {elements.length === 0 && (
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)' }}>
            Drag components from the palette onto the canvas
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// ─── Property Inspector ───────────────────────────────────────────────────────
function PropertyInspector({ el, onChange, onDelete }) {
  if (!el) {
    return (
      <Typography variant="body2" sx={{ color: 'text.secondary', p: 2, textAlign: 'center' }}>
        Select an element to edit its properties
      </Typography>
    );
  }

  const field = (label, key, type = 'text', extra = {}) => (
    <Box key={key} sx={{ mb: 1.5 }}>
      {type === 'slider' ? (
        <>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
          <Slider
            size="small"
            value={el[key] ?? 1}
            min={extra.min ?? 0}
            max={extra.max ?? 1}
            step={extra.step ?? 0.1}
            onChange={(_, v) => onChange(key, v)}
            valueLabelDisplay="auto"
          />
        </>
      ) : (
        <TextField
          fullWidth
          size="small"
          label={label}
          type={type}
          value={el[key] ?? ''}
          onChange={(e) => onChange(key, type === 'number' ? +e.target.value : e.target.value)}
          inputProps={extra}
        />
      )}
    </Box>
  );

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary' }}>
          {el.type}
        </Typography>
        <Tooltip title="Delete element">
          <IconButton size="small" color="error" onClick={onDelete}><DeleteIcon fontSize="small" /></IconButton>
        </Tooltip>
      </Box>
      <Divider sx={{ mb: 1.5 }} />

      {/* Position / Size */}
      <Grid container spacing={1}>
        <Grid item xs={6}>{field('X (%)', 'x', 'number', { min: 0, max: 100, step: 0.1 })}</Grid>
        <Grid item xs={6}>{field('Y (%)', 'y', 'number', { min: 0, max: 100, step: 0.1 })}</Grid>
        <Grid item xs={6}>{field('W (px)', 'width', 'number', { min: 10 })}</Grid>
        <Grid item xs={6}>{field('H (px)', 'height', 'number', { min: 10 })}</Grid>
      </Grid>

      {field('Opacity', 'opacity', 'slider', { min: 0, max: 1, step: 0.05 })}

      {/* Type-specific */}
      {(el.type === 'text') && field('Content', 'content')}
      {(el.type === 'text' || el.type === 'clock') && field('Font Size', 'fontSize', 'number', { min: 8, max: 120 })}
      {(el.type === 'text' || el.type === 'clock') && field('Color', 'color', 'color')}
      {el.type === 'clock' && field('Format', 'format')}
      {el.type === 'lower_third' && field('Title', 'title')}
      {el.type === 'lower_third' && field('Subtitle', 'subtitle')}
      {(el.type === 'lower_third' || el.type === 'marquee') && field('Text Color', 'color', 'color')}
      {(el.type === 'lower_third' || el.type === 'marquee') && field('Background', 'bgColor', 'text')}
      {el.type === 'marquee' && field('Content', 'content')}
      {el.type === 'shape' && field('Fill Color', 'fill', 'color')}
      {el.type === 'image' && field('Image URL / Path', 'src')}
    </Box>
  );
}

// ─── GraphicsTemplateEditor ───────────────────────────────────────────────────
export default function GraphicsTemplateEditor({ embedded = false }) {
  const { token } = useAuthStore();
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeDragType, setActiveDragType] = useState(null);
  const [templateName, setTemplateName] = useState('My Template');
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef(null);

  const selectedEl = elements.find((e) => e.id === selectedId) ?? null;

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const handleDragStart = ({ active }) => {
    if (active.data.current?.fromPalette) setActiveDragType(active.data.current.type);
  };

  const handleDragEnd = useCallback(({ active, over, delta }) => {
    setActiveDragType(null);

    if (active.data.current?.fromPalette && over?.id === 'canvas') {
      // Drop from palette → create element
      const type = active.data.current.type;
      const canvas = canvasRef.current;
      const rect = canvas?.getBoundingClientRect() ?? { width: 1280, height: 720 };
      // Approximate center-ish spawn
      const x = Math.max(0, Math.min(90, (rect.width / 2 / rect.width) * 100));
      const y = Math.max(0, Math.min(90, (rect.height / 2 / rect.height) * 100));
      const newEl = {
        id: `el-${Date.now()}`,
        type,
        ...DEFAULT_PROPS[type],
        x: parseFloat(x.toFixed(1)),
        y: parseFloat(y.toFixed(1)),
      };
      setElements((prev) => [...prev, newEl]);
      setSelectedId(newEl.id);
    } else if (active.data.current?.fromCanvas) {
      // Move existing element
      const elId = active.data.current.elId;
      setElements((prev) => prev.map((el) => {
        if (el.id !== elId) return el;
        const canvas = canvasRef.current;
        const rect = canvas?.getBoundingClientRect() ?? { width: 1280, height: 720 };
        const dx = (delta.x / rect.width) * 100;
        const dy = (delta.y / rect.height) * 100;
        return { ...el, x: Math.max(0, Math.min(99, el.x + dx)), y: Math.max(0, Math.min(99, el.y + dy)) };
      }));
    }
  }, []);

  // ── Property change ────────────────────────────────────────────────────────
  const handlePropChange = useCallback((key, value) => {
    setElements((prev) => prev.map((el) => el.id === selectedId ? { ...el, [key]: value } : el));
  }, [selectedId]);

  // ── Delete element ─────────────────────────────────────────────────────────
  const handleDelete = useCallback(() => {
    setElements((prev) => prev.filter((el) => el.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  // ── Save template ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!templateName.trim()) { setSnack({ open: true, msg: 'Enter a template name', severity: 'warning' }); return; }
    setSaving(true);
    try {
      await axios.post('/api/templates', {
        name: templateName,
        description: 'Created in Graphics Template Editor',
        structure: { elements },
        duration_seconds: 86400,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSnack({ open: true, msg: 'Template saved!', severity: 'success' });
    } catch {
      setSnack({ open: true, msg: 'Error saving template', severity: 'error' });
    } finally { setSaving(false); }
  };

  return (
    <Box sx={{ p: embedded ? 0 : { xs: 1, md: 2 }, height: embedded ? '100%' : 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', gap: embedded ? 1 : 2 }}>
      {/* Header bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h6" sx={{ fontWeight: 800, flex: 1 }}>
          Graphics Template Editor
        </Typography>
        <TextField
          size="small"
          label="Template Name"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          sx={{ width: 220 }}
        />
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          size="small"
        >
          {saving ? 'Saving…' : 'Save Template'}
        </Button>
      </Box>

      {/* Main area */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', gap: 2 }}>
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {/* Palette */}
          <Paper sx={{ width: 160, flexShrink: 0, p: 1, overflow: 'auto' }}>
            <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary', px: 1 }}>
              Components
            </Typography>
            <List dense disablePadding sx={{ mt: 1 }}>
              {PALETTE_ITEMS.map((item) => (
                <PaletteItem key={item.type} {...item} />
              ))}
            </List>
          </Paper>

          {/* Canvas */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
              Canvas (16:9)
            </Typography>
            <Canvas
              elements={elements}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onDrop={() => {}}
              canvasRef={canvasRef}
            />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', textAlign: 'right' }}>
              {elements.length} element{elements.length !== 1 ? 's' : ''} · Click to select · Drag to move
            </Typography>
          </Box>

          <DragOverlay>
            {activeDragType ? (
              <Box sx={{ px: 2, py: 1, background: 'rgba(0,229,255,0.2)', border: '1px solid #00e5ff', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ color: '#00e5ff' }}>{activeDragType}</Typography>
              </Box>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Property Inspector */}
        <Paper sx={{ width: 220, flexShrink: 0, overflow: 'auto' }}>
          <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary', p: 1, display: 'block' }}>
            Properties
          </Typography>
          <Divider />
          <PropertyInspector el={selectedEl} onChange={handlePropChange} onDelete={handleDelete} />
        </Paper>
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
