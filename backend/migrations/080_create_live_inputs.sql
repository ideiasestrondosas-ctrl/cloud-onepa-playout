-- Migration: Create live_inputs and social_streams tables
-- Date: 2026-03-10
-- Description: Phase 30 - Live Input Ingestion Service and Social Streaming

-- Live Inputs table
CREATE TABLE IF NOT EXISTS live_inputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    protocol VARCHAR(50) NOT NULL,
    url VARCHAR(512) NOT NULL,
    port INTEGER,
    status VARCHAR(50) DEFAULT 'inactive',
    health_status JSONB DEFAULT '{}',
    channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
    preview_url VARCHAR(512),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social Streams table
CREATE TABLE IF NOT EXISTS social_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    stream_key VARCHAR(512),
    stream_url VARCHAR(512),
    status VARCHAR(50) DEFAULT 'inactive',
    health_status JSONB DEFAULT '{}',
    channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Live Input Routes table
CREATE TABLE IF NOT EXISTS live_input_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    live_input_id UUID NOT NULL REFERENCES live_inputs(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT false,
    switch_on_loss BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(live_input_id, channel_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_live_inputs_channel ON live_inputs(channel_id);
CREATE INDEX IF NOT EXISTS idx_live_inputs_status ON live_inputs(status);
CREATE INDEX IF NOT EXISTS idx_social_streams_channel ON social_streams(channel_id);
CREATE INDEX IF NOT EXISTS idx_social_streams_status ON social_streams(status);
CREATE INDEX IF NOT EXISTS idx_live_input_routes_channel ON live_input_routes(channel_id);
