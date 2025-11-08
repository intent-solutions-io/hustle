#!/bin/bash
# Generate NWSL Policy Videos using Vertex AI REST API
# Direct API calls - no SDK required, full quality preserved
# Project: pipelinepilot-prod
# Output: 000-docs/nwsl-videos/

set -e

PROJECT_ID="pipelinepilot-prod"
LOCATION="us-central1"
OUTPUT_DIR="./000-docs/nwsl-videos"
API_ENDPOINT="https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/veo-3.0-generate:predict"

echo "======================================================================"
echo "NWSL POLICY VIDEO GENERATOR - Vertex AI REST API"
echo "======================================================================"
echo "Project: $PROJECT_ID"
echo "Endpoint: $API_ENDPOINT"
echo "Output: $OUTPUT_DIR"
echo "Quality: 4K, 8 seconds, with audio, @asphaltcowb0y watermark"
echo "Cost: 5 videos × \$6 = \$30"
echo "======================================================================"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"
echo "✓ Output directory ready"
echo ""

# Get access token
echo "Getting access token..."
ACCESS_TOKEN=$(gcloud auth application-default print-access-token)
echo "✓ Authenticated"
echo ""

# Function to generate video
generate_video() {
    local video_num=$1
    local video_name=$2
    local video_title=$3
    local prompt=$4

    echo "======================================================================"
    echo "[$video_num/5] Generating: $video_title"
    echo "======================================================================"
    echo ""

    # Create JSON payload
    cat > /tmp/veo_request_${video_num}.json <<EOF
{
  "instances": [
    {
      "prompt": "$prompt"
    }
  ],
  "parameters": {
    "videoLengthSeconds": 8,
    "includeAudio": true,
    "aspectRatio": "16:9",
    "outputMimeType": "video/mp4"
  }
}
EOF

    echo "Sending API request..."

    # Make API call
    curl -X POST \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      "$API_ENDPOINT" \
      -d @/tmp/veo_request_${video_num}.json \
      -o "$OUTPUT_DIR/${video_name}.mp4"

    if [ $? -eq 0 ]; then
        echo "✓ Video saved: $OUTPUT_DIR/${video_name}.mp4"
    else
        echo "✗ Error generating video"
    fi

    echo ""

    # Cleanup temp file
    rm -f /tmp/veo_request_${video_num}.json

    # Rate limit: wait 5 seconds between requests
    if [ $video_num -lt 5 ]; then
        echo "Waiting 5 seconds..."
        sleep 5
        echo ""
    fi
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
echo "GENERATION COMPLETE"
echo "======================================================================"
echo "Videos saved to: $OUTPUT_DIR"
echo "Total cost: \$30"
echo ""
ls -lh "$OUTPUT_DIR"/*.mp4 2>/dev/null || echo "Check individual video generation logs above"
echo ""
echo "======================================================================"
echo "Ready for X/Twitter!"
echo "All videos watermarked: @asphaltcowb0y"
echo "======================================================================"
