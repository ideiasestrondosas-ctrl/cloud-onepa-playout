-- Migration 020: Add udp_mode for independent UDP configuration
ALTER TABLE settings
ADD COLUMN udp_mode TEXT DEFAULT 'unicast';

UPDATE settings SET udp_mode = 'multicast' WHERE udp_output_url LIKE '%239.%' OR udp_output_url LIKE '%224.%';
UPDATE settings SET udp_mode = 'unicast' WHERE udp_mode IS NULL;
