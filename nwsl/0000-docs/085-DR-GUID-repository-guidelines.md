# Repository Guidelines

## Project Structure & Module Organization
- `cloud-run-proxy/` holds the FastAPI service that fronts Gemini Veo; code resides in `main.py`, deployment helpers in `deploy.sh` and `setup-resources.sh`.
- `scripts/` bundles operational shell utilities such as `ffmpeg_overlay_pipeline.sh`; escape dollar amounts (`\$`) to prevent shell expansion.
- `0000-docs/` is the research canon (briefs, manifests, audits); treat it as read-only reference unless leadership signs off.
- `0000-archive/` stores historical assets, intermediate renders, and diagnostic scripts (`test-single-segment.py`). Preserve folder structure when adding runs.
- Media outputs live in `0000-images/` and `0000-videos/`; mirror existing patterns (`segment-03-overlay.png`).

## Build, Test, and Development Commands
- Environment setup: `cd cloud-run-proxy && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`.
- Local service: `uvicorn main:app --reload` runs on `http://127.0.0.1:8000`; check `/health` before end-to-end flows.
- Deployment: `./deploy.sh` builds and ships to Cloud Run; ensure `gcloud` auth and override `PROJECT_ID` if not targeting production.
- Overlays: `bash scripts/ffmpeg_overlay_pipeline.sh` once footage and overlay manifests are staged.

## Coding Style & Naming Conventions
- Python follows PEP 8 with 4-space indents, type hints, and docstrings on public endpoints; keep logging JSON-friendly (`logger.info` with structured strings).
- Shell scripts start with `#!/bin/bash` plus `set -euo pipefail`; name new helpers with hyphenated verbs (`generate-thumbnails.sh`).
- Asset filenames stay lower-case, dash-separated, and segment-numbered (`segment-05-audio.wav`).

## Testing Guidelines
- Add automated coverage under `cloud-run-proxy/tests/` and run `python -m pytest`; isolate external calls with `httpx` mocking or `pytest-asyncio`.
- Use `0000-archive/test-single-segment.py` for Gemini smoke tests—export `GEMINI_API_KEY` first.
- Validate overlay timing with a low-resolution render in `tmp/` before writing canonical exports.

## Commit & Pull Request Guidelines
- Follow conventional commits already in history: `feat(firebase): Day 3 - Replace NextAuth with Firebase Auth`. Keep scope lowercase and imperative summary.
- Squash unrelated changes; each PR should ship one reviewable unit and include: purpose, implementation notes, verification steps, and asset diffs or thumbnails when visuals change.
- Link Task IDs or issue URLs inline and request reviewers who own the affected module or asset pillar.

## Security & Configuration Tips
- Never hard-code API keys; rely on Secret Manager via `get_api_key()` or local `.env` ignored by git. Double-check `PROJECT_ID`, `SECRET_NAME`, and regional settings before deploying.
- Sanitise personal or league-sensitive data before committing media or transcripts; redact in docs with `[REDACTED]` instead of deletion for traceability.
