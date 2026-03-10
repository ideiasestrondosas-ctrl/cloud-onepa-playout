-- Migration 078: Bump system version to v2.5.0-ALPHA.44-PRO (Phase 5 — Kubernetes + MinIO + CI/CD)
UPDATE settings SET system_version = 'v2.5.0-ALPHA.44-PRO' WHERE TRUE;
