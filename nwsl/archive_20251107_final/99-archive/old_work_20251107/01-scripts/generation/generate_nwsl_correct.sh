#!/bin/bash
# NWSL Video Generation - Correct Vertex AI Veo API
# Uses predictLongRunning endpoint with Cloud Storage output

set -e

PROJECT_ID="pipelinepilot-prod"
LOCATION="us-central1"
MODEL_ID="veo-3.0-generate-001"
BUCKET="gs://${PROJECT_ID}-veo-videos"
OUTPUT_DIR="./000-docs/nwsl-videos"

# Correct endpoint with predictLongRunning
API_ENDPOINT="https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:predictLongRunning"

echo "======================================================================"
echo "NWSL VIDEO GENERATOR - Vertex AI Veo (Correct API)"
echo "======================================================================"
echo "Project: $PROJECT_ID"
echo "Model: $MODEL_ID"
echo "Storage: $BUCKET"
echo "Output: $OUTPUT_DIR"
echo "======================================================================"
echo ""

# Create Cloud Storage bucket if needed
echo "Setting up Cloud Storage..."
gsutil mb -p "$PROJECT_ID" -l "$LOCATION" "$BUCKET" 2>/dev/null || echo "Bucket already exists"
echo "✓ Storage ready"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Get access token
ACCESS_TOKEN=$(gcloud auth application-default print-access-token)

# Function to generate video
generate_video() {
    local num=$1
    local name=$2
    local title=$3
    local prompt=$4

    echo "======================================================================"
    echo "[$num/5] $title"
    echo "======================================================================"

    # Create request JSON
    cat > /tmp/veo_req_${num}.json <<EOF
{
  "instances": [{
    "prompt": "$prompt"
  }],
  "parameters": {
    "storageUri": "${BUCKET}/${name}/",
    "sampleCount": 1
  }
}
EOF

    echo "Submitting video generation request..."

    # Submit request
    RESPONSE=$(curl -s -X POST \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      "$API_ENDPOINT" \
      -d @/tmp/veo_req_${num}.json)

    # Check for operation name (long-running operation)
    OPERATION=$(echo "$RESPONSE" | jq -r '.name // empty')

    if [ -z "$OPERATION" ]; then
        echo "✗ Error: $(echo "$RESPONSE" | jq -r '.error.message // "Unknown error"')"
        echo "$RESPONSE" | jq '.'
        return 1
    fi

    echo "✓ Operation started: $OPERATION"
    echo "  (Videos generate asynchronously, check Cloud Storage)"
    echo ""

    rm -f /tmp/veo_req_${num}.json
}

# VIDEO 1: THE LOOPHOLE
generate_video 1 "01_the_loophole" "The Loophole" \
"Photorealistic 4K cinematic shot. Close-up of official NWSL policy document on mahogany desk, dramatic side lighting through window blinds creating film noir shadows. Camera slowly pushes in on highlighted text: 'transgender women may compete if testosterone below 10 nmol/L'. Text glows red as camera zooms closer. Final 2 seconds: Bold white text overlay appears bottom of frame: '10 nmol/L = MALE RANGE' with '@asphaltcowb0y' watermark in bottom right corner, white text with subtle black outline. Serious, ominous, documentary realism. Film grain, shallow depth of field, professional color grading. 8 seconds total."

# VIDEO 2: THE DOOR
generate_video 2 "02_the_door" "The Door" \
"Hyper-realistic 4K shot. Women's soccer locker room, empty and pristine with professional lighting. Camera slowly tracks toward door with sign 'WOMEN'S TEAM'. Door is slightly ajar, golden light streaming through gap. Text overlay fades in at 3 seconds: 'CURRENT NWSL POLICY: DOOR IS OPEN' in white sans-serif font, centered. Camera pushes through doorway at 5 seconds. Final frame at 7 seconds: Bold text 'TO BIOLOGICAL MALES' with '@asphaltcowb0y' watermark bottom right corner in white with black outline. Dramatic, cinematic, powerful symbolism. Professional lighting, film grain, shallow focus. 8 seconds total."

# VIDEO 3: ONE VOICE
generate_video 3 "03_one_voice" "One Voice" \
"Cinematic portrait style. Dramatic single spotlight illuminating empty chair in otherwise dark room, suggesting courage of someone who stood alone. At 2 seconds, white text appears: 'ONE PLAYER SPOKE UP'. Light intensifies at 3 seconds. At 4 seconds: 'SHE SAID: WOMEN'S SPORTS = BIOLOGICAL WOMEN' in bold white text. Camera slowly orbits chair from 4-7 seconds. Final frame at 7 seconds: 'HER TEAMMATES CALLED HER RACIST' with '@asphaltcowb0y' watermark bottom right in white with black outline. Fade to black at 8 seconds. Emotional, powerful, heroic tone. Film noir aesthetic, professional grade lighting. 8 seconds total."

# VIDEO 4: THE SCIENCE
generate_video 4 "04_the_science" "The Science" \
"Photorealistic medical visualization. 3D rendered testosterone molecule rotating slowly in dark space with scientific labels and atomic structure clearly visible. At 2 seconds, white text overlay: 'TESTOSTERONE SUPPRESSION'. Molecule splits apart with particle effects at 3 seconds. At 4 seconds, new text: 'REDUCES MALE ADVANTAGE BY ONLY 5%'. At 5 seconds, medical graphics show side-by-side silhouettes comparing male vs female muscle mass and bone density. Final frame at 7 seconds: Bold text 'BIOLOGY DOESN'T LIE' with '@asphaltcowb0y' watermark bottom right in white with black outline. High-end medical documentary style, BBC/National Geographic quality. 8 seconds total."

# VIDEO 5: THE QUESTION
generate_video 5 "05_the_question" "The Question" \
"4K photorealistic aerial drone shot. Empty professional women's soccer stadium at dusk with golden hour lighting casting long shadows. Slow cinematic descent from high altitude toward center field from 0-4 seconds. At 4 seconds, large white text overlay appears on grass surface: 'IF A BIOLOGICAL MALE COMPETES...' Camera continues smooth descent. At 6 seconds, text updates: '...IS IT STILL WOMEN'S SPORTS?' Final frame at 7 seconds: Freeze on empty goal with '@asphaltcowb0y' watermark in white with black outline, bottom right corner. Hold for 1 second. Cinematic, thought-provoking, stunning aerial cinematography. Professional color grading, 4K quality. 8 seconds total."

echo "======================================================================"
echo "REQUESTS SUBMITTED"
echo "======================================================================"
echo "Video generation is asynchronous (takes 2-5 minutes per video)"
echo ""
echo "To check Cloud Storage for completed videos:"
echo "  gsutil ls -r $BUCKET"
echo ""
echo "To download all videos when ready:"
echo "  gsutil -m cp -r '${BUCKET}/*/generated_videos/*.mp4' $OUTPUT_DIR/"
echo ""
echo "======================================================================"
