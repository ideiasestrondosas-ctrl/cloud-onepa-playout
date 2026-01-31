-- Migration 015: Add missing columns to settings table
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS overlay_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS app_logo_path TEXT,
ADD COLUMN IF NOT EXISTS channel_name VARCHAR(255) DEFAULT 'Cloud Onepa';
