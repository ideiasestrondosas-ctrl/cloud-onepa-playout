-- Create graphics_layers table for multi-layer graphics system
CREATE TABLE graphics_layers (
    id SERIAL PRIMARY KEY,
    layer_type VARCHAR(50) NOT NULL CHECK (layer_type IN ('clock', 'lower_third', 'marquee')),
    name VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    z_index INTEGER DEFAULT 0,
    
    -- Position & Style
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    anchor VARCHAR(50) DEFAULT 'top-left' CHECK (anchor IN ('top-left', 'top-right', 'bottom-left', 'bottom-right', 'center')),
    width INTEGER,
    height INTEGER,
    opacity REAL DEFAULT 1.0 CHECK (opacity >= 0.0 AND opacity <= 1.0),
    
    -- Layer-specific configuration (JSON)
    config JSONB NOT NULL DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_graphics_layers_enabled ON graphics_layers(enabled);
CREATE INDEX idx_graphics_layers_z_index ON graphics_layers(z_index);
CREATE INDEX idx_graphics_layers_type ON graphics_layers(layer_type);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_graphics_layers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER graphics_layers_updated_at
    BEFORE UPDATE ON graphics_layers
    FOR EACH ROW
    EXECUTE FUNCTION update_graphics_layers_updated_at();
