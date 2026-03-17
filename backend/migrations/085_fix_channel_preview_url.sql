-- Migration 085: Fix channel preview_url to point at MediaMTX live HLS path
-- Previous migrations stored /hls/{slug}/index.m3u8 (backend disk path, not always available).
-- The correct path is /hls-live/{slug}/index.m3u8 (nginx proxy → MediaMTX in-memory HLS).
UPDATE channels
SET
    preview_url = '/hls-live/' || slug || '/index.m3u8',
    updated_at  = NOW()
WHERE preview_url IS NULL
   OR preview_url NOT LIKE '/hls-live/%';
