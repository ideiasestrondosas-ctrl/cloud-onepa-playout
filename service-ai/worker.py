"""
service-ai — AI Metadata Worker

Phase 3 / v2.4.0-ALPHA.42-PRO

Responsibilities:
  - Poll `media_tasks` table for pending jobs of type 'ai-caption'
  - Download media file from local volume mount
  - Run faster-whisper ASR → produce WebVTT caption file
  - Detect silence windows via ffmpeg-python
  - Write results back to `media.metadata` JSONB
  - Update task status in `media_tasks` table
  - Publish completion event to Redis
"""

import os
import json
import time
import logging
import tempfile
import subprocess
from pathlib import Path

import psycopg2
import psycopg2.extras
import redis
from faster_whisper import WhisperModel

# ── Config ────────────────────────────────────────────────────────────────────
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://onepa:onepa@postgres:5432/onepa_playout")
REDIS_URL    = os.environ.get("REDIS_URL",    "redis://redis:6379")
MEDIA_PATH   = os.environ.get("MEDIA_PATH",   "/var/lib/onepa-playout/media")
POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL", "15"))   # seconds between polls
WHISPER_MODEL = os.environ.get("WHISPER_MODEL", "base")       # tiny|base|small|medium|large

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [ai-worker] %(levelname)s %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
log = logging.getLogger("ai-worker")

# ── DB connection ─────────────────────────────────────────────────────────────
def connect_db():
    return psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)

# ── Redis connection ──────────────────────────────────────────────────────────
def connect_redis():
    import redis as _redis
    return _redis.from_url(REDIS_URL)

# ── Whisper model (loaded once) ───────────────────────────────────────────────
log.info(f"Loading Whisper model '{WHISPER_MODEL}' ...")
model = WhisperModel(WHISPER_MODEL, device="cpu", compute_type="int8")
log.info("Whisper model ready.")

# ── Silence detection ─────────────────────────────────────────────────────────
def detect_silence(media_file: str) -> list[dict]:
    """
    Use ffmpeg silencedetect filter to find silence windows.
    Returns a list of {"start": float, "end": float, "duration": float}.
    """
    cmd = [
        "ffmpeg", "-y", "-i", media_file,
        "-af", "silencedetect=noise=-35dB:d=0.5",
        "-f", "null", "-",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    output = result.stderr
    silences = []
    start = None
    for line in output.splitlines():
        if "silence_start" in line:
            try:
                start = float(line.split("silence_start: ")[1].split()[0])
            except (IndexError, ValueError):
                pass
        elif "silence_end" in line and start is not None:
            try:
                end = float(line.split("silence_end: ")[1].split()[0])
                dur = float(line.split("silence_duration: ")[1].split()[0])
                silences.append({"start": round(start, 3), "end": round(end, 3), "duration": round(dur, 3)})
                start = None
            except (IndexError, ValueError):
                pass
    return silences

# ── WebVTT generator ──────────────────────────────────────────────────────────
def format_timestamp(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}"

def segments_to_vtt(segments) -> str:
    lines = ["WEBVTT", ""]
    for i, seg in enumerate(segments, 1):
        lines.append(str(i))
        lines.append(f"{format_timestamp(seg.start)} --> {format_timestamp(seg.end)}")
        lines.append(seg.text.strip())
        lines.append("")
    return "\n".join(lines)

# ── Core processing ───────────────────────────────────────────────────────────
def process_task(task: dict, db_conn, r: redis.Redis):
    task_id   = task["id"]
    asset_id  = task["media_id"]   # existing schema uses media_id
    log.info(f"Processing task {task_id} — asset {asset_id}")

    # Mark as running
    with db_conn.cursor() as cur:
        cur.execute("UPDATE media_tasks SET status='running', started_at=NOW() WHERE id=%s", (task_id,))
    db_conn.commit()

    try:
        # Fetch media file path from DB
        with db_conn.cursor() as cur:
            cur.execute("SELECT file_path, file_name FROM media WHERE id=%s", (asset_id,))
            row = cur.fetchone()
        if not row:
            raise FileNotFoundError(f"asset {asset_id} not found in media table")

        media_file = os.path.join(MEDIA_PATH, row["file_path"] or row["file_name"])
        if not os.path.exists(media_file):
            raise FileNotFoundError(f"media file not found: {media_file}")

        log.info(f"Running Whisper ASR on {media_file}")
        segments_gen, info = model.transcribe(media_file, beam_size=5, word_timestamps=False)
        segments = list(segments_gen)

        vtt_content  = segments_to_vtt(segments)
        plain_text   = " ".join(s.text.strip() for s in segments)
        detected_lang = info.language

        log.info(f"Detecting silence in {media_file}")
        silence_windows = detect_silence(media_file)

        # Write VTT to captions directory
        captions_dir = Path(MEDIA_PATH) / "captions"
        captions_dir.mkdir(parents=True, exist_ok=True)
        vtt_path = captions_dir / f"{asset_id}.vtt"
        vtt_path.write_text(vtt_content, encoding="utf-8")

        # Update media.metadata
        metadata_patch = {
            "ai_caption": {
                "language": detected_lang,
                "vtt_path": str(vtt_path),
                "plain_text": plain_text[:500],   # preview
                "segment_count": len(segments),
                "silence_windows": silence_windows[:20],  # cap at 20
                "processed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }
        }
        with db_conn.cursor() as cur:
            cur.execute(
                "UPDATE media SET metadata = metadata || %s::jsonb WHERE id=%s",
                (json.dumps(metadata_patch), asset_id)
            )
            cur.execute(
                "UPDATE media_tasks SET status='done', completed_at=NOW() WHERE id=%s",
                (task_id,)
            )
        db_conn.commit()

        # Publish completion event to Redis
        r.publish("analytics:ai", json.dumps({
            "event_type": "ai_caption_complete",
            "payload": {
                "task_id": str(task_id),
                "asset_id": str(asset_id),
                "language": detected_lang,
                "segment_count": len(segments),
            }
        }))
        log.info(f"Task {task_id} completed — {len(segments)} segments, lang={detected_lang}")

    except Exception as exc:
        log.error(f"Task {task_id} failed: {exc}")
        with db_conn.cursor() as cur:
            cur.execute(
                "UPDATE media_tasks SET status='error', error_message=%s WHERE id=%s",
                (str(exc)[:500], task_id)
            )
        db_conn.commit()

# ── Poll loop ─────────────────────────────────────────────────────────────────
def poll(db_conn, r: redis.Redis):
    with db_conn.cursor() as cur:
        cur.execute(
            """SELECT id, media_id, task_type, metadata
               FROM media_tasks
               WHERE task_type = 'ai-caption' AND status = 'pending'
               ORDER BY created_at ASC
               LIMIT 1
               FOR UPDATE SKIP LOCKED""",
        )
        task = cur.fetchone()
    if task:
        process_task(dict(task), db_conn, r)
    else:
        log.debug("No pending ai-caption tasks.")

# ── Entry point ───────────────────────────────────────────────────────────────
def main():
    log.info(f"AI Worker starting — model={WHISPER_MODEL}, poll_interval={POLL_INTERVAL}s")
    db_conn = None
    r = None

    while True:
        try:
            if db_conn is None or db_conn.closed:
                db_conn = connect_db()
                log.info("DB connection established.")
            if r is None:
                r = connect_redis()
                log.info("Redis connection established.")
            poll(db_conn, r)
        except psycopg2.OperationalError as e:
            log.error(f"DB error: {e} — reconnecting in {POLL_INTERVAL}s")
            db_conn = None
        except Exception as e:
            log.error(f"Poll error: {e}")
            if db_conn:
                db_conn.rollback()
        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()
