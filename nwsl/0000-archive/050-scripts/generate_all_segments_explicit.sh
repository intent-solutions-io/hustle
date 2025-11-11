#!/bin/bash
# GENERATE ALL 8 SEGMENTS FOR NWSL DOCUMENTARY
# With EXPLICIT SOCCER CONTEXT where needed (SEG-01, 04, 07, 08)
set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================

PROJECT_ID="pipelinepilot-prod"
LOCATION="us-central1"
MODEL_ID="veo-3.0-generate-001"
BUCKET="gs://pipelinepilot-prod-veo-videos"
API_ENDPOINT="https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:predictLongRunning"

# Output directories
OUTPUT_DIR="/home/jeremy/000-projects/hustle/nwsl/003-raw-segments"
LOGS_DIR="/home/jeremy/000-projects/hustle/nwsl/007-logs/generation"
CANON_DIR="/home/jeremy/000-projects/hustle/nwsl/000-docs"

# Create directories
mkdir -p "$OUTPUT_DIR"
mkdir -p "$LOGS_DIR"

# Log file
LOGFILE="${LOGS_DIR}/generate_all_$(date +%Y%m%d_%H%M%S).log"

# =============================================================================
# LOGGING FUNCTIONS
# =============================================================================

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOGFILE"
}

log_error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*" | tee -a "$LOGFILE" >&2
}

log_success() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $*" | tee -a "$LOGFILE"
}

# =============================================================================
# UNIVERSAL NEGATIVE PROMPTS
# =============================================================================

# Base negative prompt for ALL segments
BASE_NEGATIVE="text, watermark, logo, brand, Nike, Adidas, timestamp, caption, subtitle, name tag, scoreboard text, readable signs, Getty Images, copyright notice"

# Soccer-specific negative (for segments that need to avoid non-soccer visuals)
SOCCER_NEGATIVE="office, boardroom, documents, papers, desk, computer, indoor meeting, conference room, American football, gridiron, yard lines, goalposts with uprights, oval ball, football helmet, basketball court, baseball diamond"

# =============================================================================
# EXPLICIT SOCCER CONTEXT (for soccer segments)
# =============================================================================

SOCCER_CONTEXT="Context: professional women's soccer (NWSL) and elite youth soccer (ECNL). Use authentic SOCCER visuals only. Pitch: full-size soccer field with white touchlines, halfway line, center circle, penalty boxes, corner flags. Round soccer ball. Soccer jerseys. Soccer goals with nets. Grass or turf field surface."

# =============================================================================
# SEGMENT DEFINITIONS
# =============================================================================

# SEG-01: The Innocence - 8.0s - NEEDS EXPLICIT SOCCER
declare -A SEG01=(
    [id]="01"
    [duration]=8
    [canon]="${CANON_DIR}/004-DR-REFF-veo-seg-01.md"
    [prompt]="Young female soccer players aged 12-14 wearing colorful soccer jerseys on grass soccer field with visible white chalk lines, soccer goals with nets, corner flags. Girls actively playing soccer, kicking round soccer ball, running on field. Slow motion: Girl dribbling ball with intense focus and joy, close-up of cleats striking ball, girls celebrating goal with high-fives and hugs. Authentic children's athletic movements, diverse young athletes, genuine passion. Golden hour lighting, shallow depth of field, handheld gimbal, ESPN documentary quality. ${SOCCER_CONTEXT}"
    [negative]="${BASE_NEGATIVE}, ${SOCCER_NEGATIVE}"
)

# SEG-02: The Commissioner - 8.0s - Corporate office (NO soccer context needed)
declare -A SEG02=(
    [id]="02"
    [duration]=8
    [canon]="${CANON_DIR}/005-DR-REFF-veo-seg-02.md"
    [prompt]="Empty corporate executive office. Slow push-in on dark wood desk with nameplate, official documents visible, leather executive chair facing away toward floor-to-ceiling windows showing city skyline. Cold fluorescent and natural window lighting. Official plaques on wall, coffee cup abandoned on desk, silent and powerful but disconnected. Camera slowly dollies toward empty chair. Cold blue color grading, sharp focus, corporate documentary style, 24fps cinematic. Style: 'The Social Network' - cold institutional power."
    [negative]="${BASE_NEGATIVE}, soccer, sports, athletic equipment, stadium, field"
)

# SEG-03: Michele Kang - The Investment - 8.0s - Financial/corporate (NO soccer context)
declare -A SEG03=(
    [id]="03"
    [duration]=8
    [canon]="${CANON_DIR}/006-DR-REFF-veo-seg-03.md"
    [prompt]="Luxury corporate office interior: Modern glass building, sleek contemporary design, expensive minimalist furniture. Close-up sequence: Expensive fountain pen signing 30 million dollar check, hands reviewing financial documents with large dollar amounts visible, stacks of investment portfolios on desk. Cut to: Modern soccer stadium construction site with cranes and 'Future Home' signage. Architectural rendering visible on wall showing new stadium plans. Cold professional lighting, sharp business aesthetic, clean corporate documentary style, smooth gimbal movements. Style: 'The Big Short' financial documentary - money and investment."
    [negative]="${BASE_NEGATIVE}, people in frame, faces, athletes"
)

# SEG-04: Angie Long - The Stadium - 8.0s - NEEDS EXPLICIT SOCCER (stadium context)
declare -A SEG04=(
    [id]="04"
    [duration]=8
    [canon]="${CANON_DIR}/007-DR-REFF-veo-seg-04.md"
    [prompt]="Exterior aerial establishing shot: Brand new CPKC Stadium in Kansas City - stunning modern architecture, beautiful women's soccer-specific venue, pristine empty stadium with perfectly manicured grass SOCCER FIELD with visible white chalk lines, center circle, penalty boxes. Drone descends from aerial view down toward field level. Cut to: Ground-level walking through empty luxury suites and premium seating, state-of-the-art facilities. Beautiful new construction, built specifically for women's soccer. Majestic but empty. Drone cinematography, smooth aerial movements, architectural beauty shots, golden hour lighting, 4K broadcast quality. ${SOCCER_CONTEXT}"
    [negative]="${BASE_NEGATIVE}, American football field, gridiron markings, yard lines, football goalposts"
)

# SEG-05: The Wilfs - The Money - 8.0s - Wealth/finance (NO soccer context)
declare -A SEG05=(
    [id]="05"
    [duration]=8
    [canon]="${CANON_DIR}/008-DR-REFF-veo-seg-05.md"
    [prompt]="Upscale executive environment: Close-up of expensive Rolex watch on wrist as hand signs contracts, luxury fountain pen on financial documents, calculator with large numbers, spreadsheets showing profit projections and revenue streams. Cut to: Counting cash, financial statements with dollar signs, investment return charts. Empty luxury box seats at stadium with champagne glasses. Cold transactional atmosphere. Extreme close-ups of wealth signifiers, sharp focus on money and documents, cold professional lighting, corporate aesthetic. Style: 'Wall Street' meets 'The Wolf of Wall Street' - greed and calculation."
    [negative]="${BASE_NEGATIVE}, soccer players, athletes, sports action"
)

# SEG-06: The Policy - Medical Reality - 8.0s - Clinical (NO soccer context)
declare -A SEG06=(
    [id]="06"
    [duration]=8
    [canon]="${CANON_DIR}/009-DR-REFF-veo-seg-06.md"
    [prompt]="Cold clinical medical environment sequence: Sterile examination room with harsh fluorescent lighting, medical equipment on metal tray. Close-up of multiple prescription medication bottles (testosterone blockers) on clinical counter with warning labels. Laboratory test tubes with hormone testing labels. Medical consent forms being stamped APPROVED. Empty surgical suite visible through window with cold blue lighting. Clinical paperwork on clipboard. Harsh fluorescent lighting with green tint, clinical documentary style, unsettling close-ups, cold sterile atmosphere. Style: Medical thriller documentary like 'Icarus' - uncomfortable clinical reality."
    [negative]="${BASE_NEGATIVE}, readable text on forms, specific drug names, people, faces, surgical procedures shown"
)

# SEG-07: The Confusion - 8.0s - NEEDS EXPLICIT SOCCER (return to field)
declare -A SEG07=(
    [id]="07"
    [duration]=8
    [canon]="${CANON_DIR}/010-DR-REFF-veo-seg-07.md"
    [prompt]="Young girls on SOCCER FIELD at dusk with purple-orange sky. Girls ages 10-14 sitting on bench looking confused and uncertain, coach crouching trying to explain something difficult. Close-up of young girl's face showing confusion and hurt. Girl holding SOCCER BALL, looking down at it sadly. Empty youth soccer field as sun sets, single abandoned soccer ball on darkening grass, SOCCER GOALS with nets silhouetted against twilight sky. White chalk field markings visible. Twilight golden hour transitioning to dusk, warm then cooling colors, emotional close-ups, shallow depth of field, handheld intimate camera work. Style: Coming-of-age drama documentary - innocence confronting harsh reality. ${SOCCER_CONTEXT}"
    [negative]="${BASE_NEGATIVE}, ${SOCCER_NEGATIVE}, happy expressions, celebration"
)

# SEG-08: The Unanswered Question - 4.0s - NEEDS SOCCER CONTEXT (stadium setting)
declare -A SEG08=(
    [id]="08"
    [duration]=4
    [canon]="${CANON_DIR}/011-DR-REFF-veo-seg-08.md"
    [prompt]="Extreme close-up of teenage female SOCCER PLAYER (16-17 years old) in soccer uniform, sitting alone in massive empty SOCCER STADIUM. Her face fills frame - raw authentic emotion, single tear forming and rolling down cheek, eyes looking directly into camera with devastating question. Expression shows heartbreak, confusion, pleading. No words, just pure human emotion asking why. Shallow depth of field, empty SOCCER STADIUM blurred behind her with visible goal posts and field markings. Extreme emotional close-up, twilight lighting, shallow depth of field f/1.4, film grain, handheld slight movement for intimacy, RED camera skin tones. Style: Prestige drama like 'Moonlight' - devastating emotional truth. ${SOCCER_CONTEXT}"
    [negative]="${BASE_NEGATIVE}, ${SOCCER_NEGATIVE}, smiling, happy, multiple people in focus"
)

# =============================================================================
# SEGMENT GENERATION FUNCTION
# =============================================================================

generate_segment() {
    local seg_id="$1"
    local duration="$2"
    local prompt="$3"
    local negative="$4"
    local canon_file="$5"

    log ""
    log "═══════════════════════════════════════════════════════════════"
    log "GENERATING SEGMENT ${seg_id}"
    log "═══════════════════════════════════════════════════════════════"
    log "Duration: ${duration}s"
    log "Canon: $(basename "$canon_file")"
    log ""

    # Create request JSON
    local request_file="/tmp/seg${seg_id}_request.json"
    cat > "$request_file" <<EOF
{
  "instances": [{
    "prompt": "$prompt",
    "negativePrompt": "$negative",
    "aspectRatio": "16:9",
    "generateAudio": false,
    "durationSecs": $duration
  }],
  "parameters": {
    "frameRate": 24,
    "resolution": "1080p",
    "sampleCount": 1,
    "storageUri": "${BUCKET}/seg${seg_id}_explicit/"
  }
}
EOF

    log "📝 Request saved to: $request_file"
    log ""
    log "🎬 Prompt preview:"
    echo "$prompt" | head -c 200 | tee -a "$LOGFILE"
    echo "..." | tee -a "$LOGFILE"
    log ""

    # Submit to Vertex AI
    log "📤 Submitting to Vertex AI Veo 3.0..."
    ACCESS_TOKEN=$(gcloud auth application-default print-access-token)

    RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        "$API_ENDPOINT" \
        -d @"$request_file")

    # Extract operation name
    OPERATION=$(echo "$RESPONSE" | jq -r '.name // empty')

    if [ -z "$OPERATION" ]; then
        log_error "Failed to submit SEG-${seg_id}"
        echo "$RESPONSE" | tee -a "$LOGFILE"
        return 1
    fi

    log_success "Operation submitted: $OPERATION"
    log "Storage: ${BUCKET}/seg${seg_id}_explicit/"

    # Save operation info
    echo "$OPERATION" > "${LOGS_DIR}/seg${seg_id}_operation.txt"
    echo "$RESPONSE" > "${LOGS_DIR}/seg${seg_id}_response.json"

    log ""
    log "⏳ Video generation in progress (typically 60-120 seconds)..."
    log "   Check status: gsutil ls '${BUCKET}/seg${seg_id}_explicit/**/*.mp4'"

    return 0
}

# =============================================================================
# DOWNLOAD FUNCTION
# =============================================================================

download_segment() {
    local seg_id="$1"
    local output_file="${OUTPUT_DIR}/SEG-${seg_id}.mp4"

    log ""
    log "📥 Attempting to download SEG-${seg_id}..."

    # Find the video file
    VIDEO_PATH=$(gsutil ls "${BUCKET}/seg${seg_id}_explicit/**/*.mp4" 2>/dev/null | head -1 || true)

    if [ -z "$VIDEO_PATH" ]; then
        log "⚠️  No video found yet for SEG-${seg_id}"
        return 1
    fi

    # Download
    if gsutil cp "$VIDEO_PATH" "$output_file" 2>&1 | tee -a "$LOGFILE"; then
        log_success "Downloaded: $output_file"

        # Extract preview frame
        local preview="${OUTPUT_DIR}/SEG-${seg_id}_preview.png"
        if ffmpeg -y -ss $(awk "BEGIN {print $2 / 2}") -i "$output_file" -frames:v 1 "$preview" 2>&1 | tee -a "$LOGFILE"; then
            log "📸 Preview frame: $preview"
        fi

        # Get file info
        local size=$(stat -f%z "$output_file" 2>/dev/null || stat -c%s "$output_file" 2>/dev/null)
        local duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$output_file" 2>/dev/null || echo "unknown")

        log "   Size: $(numfmt --to=iec-i --suffix=B $size 2>/dev/null || echo "${size} bytes")"
        log "   Duration: ${duration}s"

        return 0
    else
        log_error "Failed to download SEG-${seg_id}"
        return 1
    fi
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    log "════════════════════════════════════════════════════════════════"
    log "NWSL DOCUMENTARY - GENERATE ALL 8 SEGMENTS"
    log "════════════════════════════════════════════════════════════════"
    log "Date: $(date)"
    log "Project: $PROJECT_ID"
    log "Model: $MODEL_ID"
    log "Output: $OUTPUT_DIR"
    log "Logs: $LOGFILE"
    log ""

    # Verify gcloud auth
    log "🔐 Verifying authentication..."
    if ! gcloud auth application-default print-access-token &>/dev/null; then
        log_error "Not authenticated. Run: gcloud auth application-default login"
        exit 1
    fi
    log_success "Authentication verified"
    log ""

    # Track which segments to generate
    SEGMENTS_TO_GENERATE=()

    # Check for --resume flag
    if [[ "${1:-}" == "--resume" ]]; then
        log "🔄 RESUME MODE: Checking for existing videos..."
        log ""

        for seg_id in 01 02 03 04 05 06 07 08; do
            if [ -f "${OUTPUT_DIR}/SEG-${seg_id}.mp4" ]; then
                log "✓ SEG-${seg_id} already exists, skipping"
            else
                log "✗ SEG-${seg_id} missing, will generate"
                SEGMENTS_TO_GENERATE+=("$seg_id")
            fi
        done
        log ""
    else
        # Generate all segments
        SEGMENTS_TO_GENERATE=(01 02 03 04 05 06 07 08)
    fi

    if [ ${#SEGMENTS_TO_GENERATE[@]} -eq 0 ]; then
        log_success "All segments already exist!"
        exit 0
    fi

    log "Will generate ${#SEGMENTS_TO_GENERATE[@]} segment(s): ${SEGMENTS_TO_GENERATE[*]}"
    log ""

    # Generate each segment
    local failed=()

    for seg_id in "${SEGMENTS_TO_GENERATE[@]}"; do
        case "$seg_id" in
            01)
                generate_segment "${SEG01[id]}" "${SEG01[duration]}" "${SEG01[prompt]}" "${SEG01[negative]}" "${SEG01[canon]}" || failed+=("$seg_id")
                ;;
            02)
                generate_segment "${SEG02[id]}" "${SEG02[duration]}" "${SEG02[prompt]}" "${SEG02[negative]}" "${SEG02[canon]}" || failed+=("$seg_id")
                ;;
            03)
                generate_segment "${SEG03[id]}" "${SEG03[duration]}" "${SEG03[prompt]}" "${SEG03[negative]}" "${SEG03[canon]}" || failed+=("$seg_id")
                ;;
            04)
                generate_segment "${SEG04[id]}" "${SEG04[duration]}" "${SEG04[prompt]}" "${SEG04[negative]}" "${SEG04[canon]}" || failed+=("$seg_id")
                ;;
            05)
                generate_segment "${SEG05[id]}" "${SEG05[duration]}" "${SEG05[prompt]}" "${SEG05[negative]}" "${SEG05[canon]}" || failed+=("$seg_id")
                ;;
            06)
                generate_segment "${SEG06[id]}" "${SEG06[duration]}" "${SEG06[prompt]}" "${SEG06[negative]}" "${SEG06[canon]}" || failed+=("$seg_id")
                ;;
            07)
                generate_segment "${SEG07[id]}" "${SEG07[duration]}" "${SEG07[prompt]}" "${SEG07[negative]}" "${SEG07[canon]}" || failed+=("$seg_id")
                ;;
            08)
                generate_segment "${SEG08[id]}" "${SEG08[duration]}" "${SEG08[prompt]}" "${SEG08[negative]}" "${SEG08[canon]}" || failed+=("$seg_id")
                ;;
        esac

        # Small delay between submissions to avoid rate limits
        sleep 5
    done

    log ""
    log "════════════════════════════════════════════════════════════════"
    log "SUBMISSION PHASE COMPLETE"
    log "════════════════════════════════════════════════════════════════"
    log ""

    if [ ${#failed[@]} -gt 0 ]; then
        log_error "Failed to submit: ${failed[*]}"
        log ""
    fi

    # Wait for generation
    log "⏳ Waiting 90 seconds for video generation..."
    for i in {90..1}; do
        printf "\r   Time remaining: %02d seconds..." "$i"
        sleep 1
    done
    echo ""
    log ""

    # Download phase
    log "════════════════════════════════════════════════════════════════"
    log "DOWNLOAD PHASE"
    log "════════════════════════════════════════════════════════════════"
    log ""

    local downloaded=0
    local still_processing=()

    for seg_id in "${SEGMENTS_TO_GENERATE[@]}"; do
        if download_segment "$seg_id"; then
            ((downloaded++))
        else
            still_processing+=("$seg_id")
        fi
    done

    log ""
    log "════════════════════════════════════════════════════════════════"
    log "GENERATION SUMMARY"
    log "════════════════════════════════════════════════════════════════"
    log "Attempted: ${#SEGMENTS_TO_GENERATE[@]} segments"
    log "Downloaded: $downloaded segments"
    log "Still processing: ${#still_processing[@]} segments"

    if [ ${#still_processing[@]} -gt 0 ]; then
        log ""
        log "⏳ Still processing: ${still_processing[*]}"
        log ""
        log "Check status with:"
        for seg_id in "${still_processing[@]}"; do
            log "   gsutil ls '${BUCKET}/seg${seg_id}_explicit/**/*.mp4'"
        done
        log ""
        log "Download manually with:"
        for seg_id in "${still_processing[@]}"; do
            log "   gsutil cp \$(gsutil ls '${BUCKET}/seg${seg_id}_explicit/**/*.mp4' | head -1) ${OUTPUT_DIR}/SEG-${seg_id}.mp4"
        done
    fi

    log ""
    log "Log file: $LOGFILE"
    log "Output directory: $OUTPUT_DIR"
    log ""
    log "✅ Script complete!"
}

# =============================================================================
# RUN
# =============================================================================

main "$@"
