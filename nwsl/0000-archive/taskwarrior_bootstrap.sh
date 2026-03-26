#!/bin/bash
set -euo pipefail
PROJ="NWSL-Docu-V1"

echo "📋 Creating Taskwarrior plan..."

task add project:$PROJ priority:H +phase0 desc:"P0: Reset & env sanity; set DOCS_DIR=./docs; verify symlink and tools; create 070-logs/" \
  annotation:"Done when: pwd correct; docs -> 000-docs; ffmpeg+jq present; gate.sh sourced." 2>/dev/null || true

task add project:$PROJ priority:H +phase1 desc:"P1: Canon integrity & overlay map check" \
  annotation:"Verify 004..011 seg canon, overlay spec, score present; write 071-AA-AACR-canon-verify.md" depends:1 2>/dev/null || true

task add project:$PROJ priority:H +phase2 desc:"P2: Veo pipeline hardening (no fallbacks, fail fast, load canon, enforce soccer tail)" \
  annotation:"Edit 050-scripts/veo_render.sh; remove placeholders; exit on error; append constraints; log HTTP; 072-AT-ADEC-veo-harden.md" depends:2 2>/dev/null || true

task add project:$PROJ priority:H +phase3 desc:"P3: Reference images — curate and upload to GCS refs/; wire into every call" \
  annotation:"At least center-circle/penalty box and goal net images; log filenames; 073-OD-DEPL-refs-prep.md" depends:3 2>/dev/null || true

task add project:$PROJ priority:H +phase4 desc:"P4: Probe SEG-08 (4.0s) with refs; validate no audio and no on-frame text" \
  annotation:"Success: HTTP 200; >3MB; visible facial CU if canon; AAR 074-AA-AACR-probe-seg08.md" depends:4 2>/dev/null || true

task add project:$PROJ priority:H +phase5 desc:"P5: Bridges BR-12..BR-78 (2–2.5s each) with refs; smooth tonal handoffs" \
  annotation:"7 bridges render; sizes >2MB; QC thumbs saved; 075-AA-AACR-bridges.md" depends:5 2>/dev/null || true

task add project:$PROJ priority:H +phase6 desc:"P6: Regenerate impacted segments (S1,S4,S7 minimum) enforcing soccer constraints + refs" \
  annotation:"No gridiron cues; no model audio; 076-AA-AACR-seg-fixes.md" depends:6 2>/dev/null || true

task add project:$PROJ priority:H +phase7 desc:"P7: Assemble master with continuous score; crossfades everywhere except S5→S6 hard cut" \
  annotation:"Output 060-renders/master_16x9_v2.mp4; 118–122s; LUFS≈−14; 077-OD-DEPL-assembly.md" depends:7 2>/dev/null || true

task add project:$PROJ priority:H +phase8 desc:"P8: Apply overlays per canon; add 4s tail watermark" \
  annotation:"Helvetica Neue Medium; downbeat timing; tail 4s w/ gray @asphaltcowb0y; 078-DR-GUID-overlays.md" depends:8 2>/dev/null || true

task add project:$PROJ priority:H +phase9 desc:"P9: QC battery + final AAR + publish" \
  annotation:"Check: no audio tracks, no on-frame text, transitions smooth, sizes sane; publish to GCS; checksums; 079-AA-AACR-final.md" depends:9 2>/dev/null || true

echo "✅ Plan loaded. Use: task project:$PROJ list"

# Mark P0 complete
task project:$PROJ +phase0 done 2>/dev/null || true
