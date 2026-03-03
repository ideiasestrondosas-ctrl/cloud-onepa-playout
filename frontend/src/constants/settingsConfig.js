// ─── constants/settingsConfig.js ─────────────────────────────────────────────
// Extracted from Settings.jsx to avoid re-creating these objects on every render.
// All values are static configuration; changes here propagate to all consumers.

/**
 * Default output configuration for each supported protocol.
 * Used by handleOutputTypeChange to auto-populate settings fields.
 */
export const OUTPUT_DEFAULTS = {
    rtmp: { url: 'rtmp://mediamtx:1935/stream', resolution: '1280x720', bitrate: '2500k' },
    hls: { url: '/hls/stream.m3u8', resolution: '1280x720', bitrate: '4000k' },
    srt: { url: 'srt://mediamtx:8890?mode=caller&streamid=publish:stream_srt', resolution: '1280x720', bitrate: '5000k' },
    udp: { url: 'udp://@:1234', resolution: '1280x720', bitrate: '3000k' },
    desktop: { url: 'local', resolution: '1280x720', bitrate: '0' },
};

/**
 * Video quality presets, keyed by resolution string.
 * Maximum allowed bitrate is enforced per-preset.
 */
export const PRESETS = {
    '3840x2160': { id: '4k', label: 'Ultra HD', bitrate: 15000, fps: '30' },
    '1920x1080': { id: '1080p', label: 'Full HD', bitrate: 5000, fps: '25' },
    '1280x720': { id: '720p', label: 'HD Ready', bitrate: 2500, fps: '25' },
    '640x360': { id: '360p', label: 'SD', bitrate: 1000, fps: '25' },
};

/**
 * Supported output protocols (for UI toggle group).
 */
export const OUTPUT_PROTOCOLS = ['rtmp', 'srt', 'udp', 'hls', 'desktop'];

/**
 * Default UDP multicast and unicast URLs.
 */
export const UDP_DEFAULTS = {
    multicast: 'udp://239.0.0.1:1234?ttl=2',
    unicast: 'udp://@:1234',
};

/**
 * Application version — single source of truth for display use.
 * Authoritative value is always the database setting.
 */
export const APP_VERSION_FALLBACK = 'v2.2.0-ALPHA.32-PRO';
