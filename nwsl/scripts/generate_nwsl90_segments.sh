#!/bin/bash
# generate_nwsl90_segments.sh
# Submit 90-second spec segments to Vertex AI Veo (preview endpoint)

set -euo pipefail

PROJECT_ID=$(gcloud config get-value project)
LOCATION="us-central1"
MODEL_ID="veo-3.0-generate-preview"
API_ENDPOINT="https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:predictLongRunning"
BUCKET="gs://pipelinepilot-prod-veo-videos/nwsl90"
WORKDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${WORKDIR}/tmp/nwsl90/raw"
LOG_DIR="${WORKDIR}/tmp/nwsl90/logs"

mkdir -p "${OUT_DIR}" "${LOG_DIR}"

echo "🎬 VEO 90-second project"
echo "Project: ${PROJECT_ID}"
echo "Model : ${MODEL_ID}"
echo "Bucket: ${BUCKET}"
echo

SEGMENTS_JSON=$(cat <<'JSON'
[
  {"id":"01","name":"joy","duration":8,"prompt":"Create PHOTOREALISTIC 8-second sports documentary video. Shot on RED camera. NO TEXT visible.\n\nYoung girls ages 10-12 playing youth soccer on grass field, bright sunny day. Girls wearing purple, red, and light blue soccer jerseys representing different youth teams. Proper soccer uniforms with shorts, shin guards, cleats.\n\nSlow motion: Girl in purple jersey dribbling ball, passes to teammate in red jersey who scores. Team celebrates with jumping, hugging, high-fives. Smiling faces, athletic joy. Diverse young athletes playing soccer.\n\nNatural outdoor lighting, grass field, positive youth sports atmosphere.\n\nStyle: Professional youth sports documentary, warm golden tones, inspirational."},
  {"id":"02","name":"training","duration":6,"prompt":"Create PHOTOREALISTIC 6-second sports video. Shot on RED camera. NO TEXT visible.\n\nYouth girls soccer team ages 11-13 doing training drills on grass field. Girls in matching practice jerseys - purple, red, and blue colors. Running drills, practicing shots, coach visible from behind directing them. Focused young athletes training hard.\n\nGolden hour lighting, outdoor field, competitive youth soccer training.\n\nStyle: Sports training documentary, warm lighting, professional quality."},
  {"id":"03","name":"league-hq","duration":8,"prompt":"Create PHOTOREALISTIC 8-second video. Shot on RED camera. NO TEXT visible.\n\nModern professional sports headquarters building - glass and steel exterior. Interior: professional office corridor with windows and city views. Conference room with table, chairs, sports trophies on shelves (no readable text).\n\nExecutive office with desk, chair facing windows, city skyline view. Professional sports administration environment.\n\nStyle: Clean corporate sports documentary, neutral lighting, professional architecture."},
  {"id":"04","name":"washington-spirit","duration":6,"prompt":"Create PHOTOREALISTIC 6-second video. Shot on RED camera. NO TEXT visible.\n\nModern executive office with Washington DC cityscape view through floor-to-ceiling windows. Contemporary professional office design, minimalist furniture. Pen signing documents on desk. Investment documents visible (text blurred).\n\nExterior: Professional soccer stadium, modern architecture.\n\nStyle: Professional business documentary, clean lighting, corporate aesthetic."},
  {"id":"05","name":"kc-current-stadium","duration":8,"prompt":"Create PHOTOREALISTIC 8-second video. Shot on RED camera. NO TEXT visible.\n\nAerial drone footage of modern soccer stadium - contemporary architecture, women’s soccer venue. Beautiful empty stadium with grass field. Drone descends from aerial view to ground level.\n\nWalking through empty stadium - luxury seating, premium facilities, modern construction. State-of-the-art women’s soccer venue, unoccupied.\n\nStyle: Architectural documentary, drone cinematography, golden hour lighting, professional broadcast quality."},
  {"id":"06","name":"orlando-pride-suite","duration":6,"prompt":"Create PHOTOREALISTIC 6-second video. Shot on RED camera. NO TEXT visible.\n\nProfessional executive office with traditional decor - wood furniture, leather seating. Documents and financial papers on desk (text blurred). Professional calculator, business materials.\n\nLuxury stadium suite with premium seating, empty. Professional sports ownership environment.\n\nStyle: Business documentary, professional lighting, corporate sports ownership aesthetic."},
  {"id":"07","name":"league-policy","duration":8,"prompt":"Create PHOTOREALISTIC 8-second video. Shot on RED camera. NO TEXT visible.\n\nProfessional conference room with policy documents on table (text blurred). Official binders and papers. Professional meeting space with leather chairs and table.\n\nModern sports medicine facility - professional athletic training center, sports science equipment for athlete health monitoring, clean professional healthcare environment for athletes.\n\nStyle: Professional sports documentary, neutral lighting, official policy environment."},
  {"id":"08","name":"player-advocacy","duration":6,"prompt":"Create PHOTOREALISTIC 6-second video. Shot on RED camera. NO TEXT visible.\n\nProfessional female soccer player in her 30s wearing team uniform, standing on sideline of empty stadium at twilight. She stands looking at empty field, contemplative posture. Profile view showing thoughtful stance.\n\nTwilight lighting, empty stadium, professional athlete in contemplation.\n\nStyle: Cinematic documentary, twilight photography, professional athlete portrait."},
  {"id":"09","name":"youth-bench","duration":8,"prompt":"Create PHOTOREALISTIC 8-second video. Shot on RED camera. NO TEXT visible.\n\nTeenage female athletes ages 14-16 in soccer uniforms sitting on bench at field during dusk. Athletes in thoughtful discussion, some looking contemplative. One holding soccer ball. Coach visible from behind. Serious conversation happening.\n\nNot distressed - just serious and thoughtful. Twilight lighting, youth soccer setting.\n\nStyle: Documentary realism, natural lighting, authentic youth sports moment."},
  {"id":"10","name":"dusk-field","duration":6,"prompt":"Create PHOTOREALISTIC 6-second video. Shot on RED camera. NO TEXT visible.\n\nEmpty youth soccer field at dusk with purple-orange sky. Goalposts silhouetted against sunset. Single soccer ball on grass in center of frame. Camera slowly moves toward ball. Empty field, twilight atmosphere.\n\nBeautiful contemplative scene, no people.\n\nStyle: Cinematic landscape, twilight photography, emotional documentary shot."},
  {"id":"11","name":"the-question","duration":6,"prompt":"Create PHOTOREALISTIC 6-second video. Shot on RED camera. NO TEXT visible.\n\nClose-up of young female athlete age 17-18 in soccer uniform. Twilight lighting on face. She looks at camera with serious, thoughtful expression. Composed, dignified, questioning look. Strong eye contact showing determination and thoughtfulness.\n\nNot crying or distressed - professional athlete portrait showing thoughtful contemplation.\n\nStyle: Portrait cinematography, shallow depth of field, twilight lighting, prestige quality."},
  {"id":"12","name":"outro-fade","duration":6,"prompt":"Create 6-second video: Smooth gradual fade from twilight sky to complete black screen over 6 seconds. Clean professional fade. Documentary ending."}
]
JSON
)

ACCESS_TOKEN="$(gcloud auth application-default print-access-token)"

download_segment () {
  local id="$1"
  local name="$2"
  local attempt=1
  local object

  while true; do
    object=$(gsutil ls "${BUCKET}/seg${id}/*/*.mp4" 2>/dev/null | head -1 || true)
    if [[ -n "${object}" ]]; then
      gsutil cp "${object}" "${OUT_DIR}/seg${id}_${name}.mp4" >/dev/null
      echo "  ✅ Downloaded ${OUT_DIR}/seg${id}_${name}.mp4"
      break
    fi
    if [[ ${attempt} -ge 18 ]]; then
      echo "  ⚠️  Timed out waiting for seg${id}"
      break
    fi
    attempt=$((attempt+1))
    sleep 10
  done
}

echo "📤 Submitting segments..."
echo

echo "${SEGMENTS_JSON}" | jq -c '.[]' | while read -r segment; do
  id=$(echo "${segment}" | jq -r '.id')
  name=$(echo "${segment}" | jq -r '.name')
  duration=$(echo "${segment}" | jq -r '.duration')
  prompt=$(echo "${segment}" | jq -r '.prompt')

  echo "SEG ${id} – ${name} (${duration}s)"

  payload=$(jq -n --arg prompt "${prompt}" --arg uri "${BUCKET}/seg${id}/" --argjson duration "${duration}" '{
      instances: [{prompt: $prompt}],
      parameters: {
        storageUri: $uri,
        sampleCount: 1,
        durationSeconds: $duration,
        aspectRatio: "16:9",
        resolution: "1080p",
        generateAudio: false
      }
    }')

  response=$(curl -s -X POST \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    "${API_ENDPOINT}" \
    -d "${payload}")

  operation=$(echo "${response}" | jq -r '.name // empty')
  if [[ -z "${operation}" ]]; then
    echo "  ❌ Submit failed: ${response}" | tee -a "${LOG_DIR}/submit.log"
    continue
  fi

  echo "  🪄 Operation: ${operation}" | tee -a "${LOG_DIR}/submit.log"

  poll_url="https://generativelanguage.googleapis.com/v1beta/operations/${operation##*/}"

  for attempt in {1..36}; do
    sleep 10
    poll=$(curl -s -H "Authorization: Bearer ${ACCESS_TOKEN}" "${poll_url}")
    done_flag=$(echo "${poll}" | jq -r '.done // false')
    if [[ "${done_flag}" == "true" ]]; then
      error_msg=$(echo "${poll}" | jq -r '.error.message // empty')
      if [[ -n "${error_msg}" ]]; then
        echo "  ❌ Generation failed: ${error_msg}" | tee -a "${LOG_DIR}/poll.log"
      else
        echo "  ✅ Generation complete"
        download_segment "${id}" "${name}"
      fi
      break
    fi
  done
done

echo
echo "📂 Raw clips saved to ${OUT_DIR}"
echo "Next: run scripts/conform_nwsl90_segments.py"
