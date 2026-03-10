-- Migration 076: Bump system version to v2.4.0-ALPHA.43-PRO (Phase 4 — SCTE-35 + LL-HLS)
UPDATE settings SET system_version = 'v2.4.0-ALPHA.43-PRO' WHERE TRUE;
