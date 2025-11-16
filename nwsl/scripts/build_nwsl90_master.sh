#!/bin/bash
# build_nwsl90_master.sh
# Assemble the 90-second master cut once clips + audio are ready.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EDIT_DIR="${ROOT}/tmp/nwsl90/edit"
BUILD_DIR="${ROOT}/tmp/nwsl90"
AUDIO_MIX="${BUILD_DIR}/audio_mix.wav"
CONCAT_LIST="${BUILD_DIR}/concat.txt"
MASTER="${ROOT}/000-complete/015-MS-VIDF-nwsl-90s-master.mp4"

ORDER=(
  "01-joy.mp4"
  "02-training.mp4"
  "03-league-hq.mp4"
  "04-washington-spirit.mp4"
  "05-kc-current-stadium.mp4"
  "06-orlando-pride-suite.mp4"
  "07-league-policy.mp4"
  "08-player-advocacy.mp4"
  "09-youth-bench.mp4"
  "10-dusk-field.mp4"
  "11-the-question.mp4"
  "12-outro-fade.mp4"
)

if [[ ! -f "${AUDIO_MIX}" ]]; then
  echo "❌ Missing audio mix at ${AUDIO_MIX}"
  exit 1
fi

for clip in "${ORDER[@]}"; do
  if [[ ! -f "${EDIT_DIR}/${clip}" ]]; then
    echo "❌ Missing conformed clip ${clip}"
    exit 1
  fi
done

mkdir -p "$(dirname "${MASTER}")"

{
  for clip in "${ORDER[@]}"; do
    echo "file '${EDIT_DIR}/${clip}'"
  done
} > "${CONCAT_LIST}"

ffmpeg -y -f concat -safe 0 -i "${CONCAT_LIST}" -i "${AUDIO_MIX}" \
  -map 0:v:0 -map 1:a:0 \
  -c:v libx264 -preset medium -crf 17 \
  -c:a aac -b:a 192k \
  -vf "fps=24,format=yuv420p,drawtext=text='INTENT SOLUTIONS':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=64:fontcolor=white:x=(w-text_w)/2:y=h-160:enable='between(t,84,88)',fade=t=out:st=88:d=2" \
  -shortest \
  "${MASTER}"

echo "✅ Master created at ${MASTER}"
