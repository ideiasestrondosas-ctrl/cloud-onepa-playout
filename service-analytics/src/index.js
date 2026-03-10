/**
 * service-analytics — Analytics & Audit Microservice
 *
 * Phase 3 / v2.4.0-ALPHA.42-PRO
 *
 * Responsibilities:
 *   - Subscribe to Redis channel `playout:*` for clip_start / heartbeat events
 *   - Write as_run_logs rows on clip_start
 *   - Write audit_logs rows on mutation events
 *   - Expose GET /health and GET /internal/as-run for backend use
 */

'use strict';

const express = require('express');
const Redis   = require('ioredis');
const { Pool } = require('pg');

// ── Config ───────────────────────────────────────────────────────────────────
const PORT        = process.env.PORT         || 4001;
const REDIS_URL   = process.env.REDIS_URL    || 'redis://redis:6379';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://onepa:onepa@postgres:5432/onepa_playout';

// ── Database ─────────────────────────────────────────────────────────────────
const db = new Pool({ connectionString: DATABASE_URL });

db.on('error', (err) => console.error('[analytics] pg pool error', err.message));

// ── Redis subscriber ──────────────────────────────────────────────────────────
const subscriber = new Redis(REDIS_URL);
const publisher  = new Redis(REDIS_URL); // separate connection for non-subscribe use

subscriber.on('error', (err) => console.error('[analytics] redis subscriber error', err.message));

/**
 * Handle incoming Redis pub/sub message.
 * Expected payload shape:
 *   { event_type: 'clip_start'|'clip_end'|'heartbeat'|'audit', payload: {...} }
 */
async function handleMessage(channel, raw) {
  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    console.warn('[analytics] malformed message on', channel, raw.slice(0, 80));
    return;
  }

  const { event_type, payload = {} } = event;

  try {
    if (event_type === 'clip_start') {
      await insertAsRunLog(payload);
    } else if (event_type === 'clip_end') {
      await finaliseAsRunLog(payload);
    } else if (event_type === 'audit') {
      await insertAuditLog(payload);
    }
    // heartbeats are intentionally ignored here (used only by WS clients)
  } catch (err) {
    console.error('[analytics] db write error for', event_type, err.message);
  }
}

// ── DB helpers ────────────────────────────────────────────────────────────────
async function insertAsRunLog(payload) {
  const { channel_id, asset_id, playlist_id, status = 'playing', metadata = {} } = payload;
  await db.query(
    `INSERT INTO as_run_logs (channel_id, asset_id, playlist_id, actual_start, status, metadata)
     VALUES ($1, $2, $3, NOW(), $4, $5)
     ON CONFLICT DO NOTHING`,
    [channel_id, asset_id || null, playlist_id || null, status, JSON.stringify(metadata)]
  );
  console.info(`[analytics] as_run_log inserted — asset=${asset_id} channel=${channel_id}`);
}

async function finaliseAsRunLog(payload) {
  const { asset_id, channel_id } = payload;
  if (!asset_id) return;
  await db.query(
    `UPDATE as_run_logs
     SET actual_end = NOW(), status = 'played'
     WHERE asset_id = $1
       AND channel_id = $2
       AND actual_end IS NULL
     ORDER BY actual_start DESC
     LIMIT 1`,
    [asset_id, channel_id]
  );
}

async function insertAuditLog(payload) {
  const { user_id, channel_id, action, resource, resource_id, metadata = {}, ip_address } = payload;
  await db.query(
    `INSERT INTO audit_logs (user_id, channel_id, action, resource, resource_id, metadata, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7::inet)`,
    [user_id || null, channel_id || null, action, resource || null, resource_id || null, JSON.stringify(metadata), ip_address || null]
  );
}

// ── Subscribe ─────────────────────────────────────────────────────────────────
subscriber.psubscribe('playout:*', (err) => {
  if (err) { console.error('[analytics] psubscribe failed', err.message); process.exit(1); }
  console.info('[analytics] subscribed to playout:* on', REDIS_URL);
});

subscriber.on('pmessage', (_pattern, channel, message) => handleMessage(channel, message));

// ── HTTP API ──────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'analytics', version: '2.4.0-ALPHA.42-PRO' }));

/**
 * GET /internal/as-run?channel_id=&start=&end=&limit=
 * Returns as_run_logs for a given time window — called by the main backend
 * to serve /api/v2/analytics/as-run without direct DB coupling.
 */
app.get('/internal/as-run', async (req, res) => {
  try {
    const { channel_id, start, end, limit = 500 } = req.query;
    const conditions = [];
    const params = [];

    if (channel_id) { params.push(channel_id); conditions.push(`channel_id = $${params.length}`); }
    if (start)      { params.push(start);      conditions.push(`actual_start >= $${params.length}`); }
    if (end)        { params.push(end);        conditions.push(`actual_start <= $${params.length}`); }

    params.push(Math.min(Number(limit), 2000));
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT id, channel_id, asset_id, playlist_id, actual_start, actual_end, status, metadata
       FROM as_run_logs ${where}
       ORDER BY actual_start DESC
       LIMIT $${params.length}`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error('[analytics] /internal/as-run error', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /internal/audit-logs?user_id=&start=&end=&limit=
 */
app.get('/internal/audit-logs', async (req, res) => {
  try {
    const { user_id, start, end, limit = 200 } = req.query;
    const conditions = [];
    const params = [];

    if (user_id) { params.push(user_id); conditions.push(`user_id = $${params.length}`); }
    if (start)   { params.push(start);   conditions.push(`created_at >= $${params.length}`); }
    if (end)     { params.push(end);     conditions.push(`created_at <= $${params.length}`); }

    params.push(Math.min(Number(limit), 1000));
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT id, user_id, channel_id, action, resource, resource_id, metadata, ip_address, created_at
       FROM audit_logs ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length}`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.info(`[analytics] listening on :${PORT}`));

// ── Graceful shutdown ─────────────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.info('[analytics] SIGTERM — shutting down');
  subscriber.disconnect();
  publisher.disconnect();
  await db.end();
  process.exit(0);
});
