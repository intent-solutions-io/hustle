#!/bin/bash
# Generate NWSL Policy Videos using Vertex AI Veo 3
# Project: TheCitadel2003
# Output: 000-docs/nwsl-videos/

set -e

PROJECT_ID="pipelinepilot-prod"
LOCATION="us-central1"
OUTPUT_DIR="./000-docs/nwsl-videos"

echo "======================================================================"
echo "NWSL POLICY VIDEO GENERATOR - Vertex AI Veo 3"
echo "======================================================================"
echo "Project: $PROJECT_ID"
echo "Location: $LOCATION"
echo "Output: $OUTPUT_DIR"
echo "======================================================================"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"
echo "✓ Output directory ready: $OUTPUT_DIR"
echo ""

# Set project
gcloud config set project "$PROJECT_ID"

# Video 1: The Loophole
echo "[1/5] Generating: The Loophole"
echo "Description: Exposes policy allows biological males to compete"
echo ""

gcloud ai generative-models generate video \
  --model=veo-3.0-generate \
  --prompt="Photorealistic 4K cinematic shot. Close-up of official NWSL policy document on mahogany desk, dramatic side lighting through window blinds creating film noir shadows. Camera slowly pushes in on highlighted text: 'transgender women may compete if testosterone below 10 nmol/L'. Text glows red as camera zooms closer. Final 2 seconds: Bold white text overlay appears bottom of frame: '10 nmol/L = MALE RANGE' with '@asphaltcowb0y' watermark in bottom right corner, white text with subtle black outline. Serious, ominous, documentary realism. Film grain, shallow depth of field, professional color grading. 8 seconds total." \
  --video-length-seconds=8 \
  --include-audio \
  --aspect-ratio=16:9 \
  --output-uri="gs://${PROJECT_ID}-videos/01_the_loophole.mp4" \
  --region="$LOCATION"

echo "✓ Video 1 complete"
echo ""

# Video 2: The Door
echo "[2/5] Generating: The Door"
echo "Description: Metaphor showing policy opens women's sports to males"
echo ""

gcloud ai generative-models generate video \
  --model=veo-3.0-generate \
  --prompt="Hyper-realistic 4K shot. Women's soccer locker room, empty and pristine with professional lighting. Camera slowly tracks toward door with sign 'WOMEN'S TEAM'. Door is slightly ajar, golden light streaming through gap. Text overlay fades in at 3 seconds: 'CURRENT NWSL POLICY: DOOR IS OPEN' in white sans-serif font, centered. Camera pushes through doorway at 5 seconds. Final frame at 7 seconds: Bold text 'TO BIOLOGICAL MALES' with '@asphaltcowb0y' watermark bottom right corner in white with black outline. Dramatic, cinematic, powerful symbolism. Professional lighting, film grain, shallow focus. 8 seconds total." \
  --video-length-seconds=8 \
  --include-audio \
  --aspect-ratio=16:9 \
  --output-uri="gs://${PROJECT_ID}-videos/02_the_door.mp4" \
  --region="$LOCATION"

echo "✓ Video 2 complete"
echo ""

# Video 3: One Voice
echo "[3/5] Generating: One Voice"
echo "Description: Defends Eddy as brave voice for women's sports"
echo ""

gcloud ai generative-models generate video \
  --model=veo-3.0-generate \
  --prompt="Cinematic portrait style. Dramatic single spotlight illuminating empty chair in otherwise dark room, suggesting courage of someone who stood alone. At 2 seconds, white text appears: 'ONE PLAYER SPOKE UP'. Light intensifies at 3 seconds. At 4 seconds: 'SHE SAID: WOMEN'S SPORTS = BIOLOGICAL WOMEN' in bold white text. Camera slowly orbits chair from 4-7 seconds. Final frame at 7 seconds: 'HER TEAMMATES CALLED HER RACIST' with '@asphaltcowb0y' watermark bottom right in white with black outline. Fade to black at 8 seconds. Emotional, powerful, heroic tone. Film noir aesthetic, professional grade lighting. 8 seconds total." \
  --video-length-seconds=8 \
  --include-audio \
  --aspect-ratio=16:9 \
  --output-uri="gs://${PROJECT_ID}-videos/03_one_voice.mp4" \
  --region="$LOCATION"

echo "✓ Video 3 complete"
echo ""

# Video 4: The Science
echo "[4/5] Generating: The Science"
echo "Description: Scientific evidence hormone suppression doesn't eliminate male advantage"
echo ""

gcloud ai generative-models generate video \
  --model=veo-3.0-generate \
  --prompt="Photorealistic medical visualization. 3D rendered testosterone molecule rotating slowly in dark space with scientific labels and atomic structure clearly visible. At 2 seconds, white text overlay: 'TESTOSTERONE SUPPRESSION'. Molecule splits apart with particle effects at 3 seconds. At 4 seconds, new text: 'REDUCES MALE ADVANTAGE BY ONLY 5%'. At 5 seconds, medical graphics show side-by-side silhouettes comparing male vs female muscle mass and bone density. Final frame at 7 seconds: Bold text 'BIOLOGY DOESN'T LIE' with '@asphaltcowb0y' watermark bottom right in white with black outline. High-end medical documentary style, BBC/National Geographic quality. 8 seconds total." \
  --video-length-seconds=8 \
  --include-audio \
  --aspect-ratio=16:9 \
  --output-uri="gs://${PROJECT_ID}-videos/04_the_science.mp4" \
  --region="$LOCATION"

echo "✓ Video 4 complete"
echo ""

# Video 5: The Question
echo "[5/5] Generating: The Question"
echo "Description: Philosophical question challenging category integrity"
echo ""

gcloud ai generative-models generate video \
  --model=veo-3.0-generate \
  --prompt="4K photorealistic aerial drone shot. Empty professional women's soccer stadium at dusk with golden hour lighting casting long shadows. Slow cinematic descent from high altitude toward center field from 0-4 seconds. At 4 seconds, large white text overlay appears on grass surface: 'IF A BIOLOGICAL MALE COMPETES...' Camera continues smooth descent. At 6 seconds, text updates: '...IS IT STILL WOMEN'S SPORTS?' Final frame at 7 seconds: Freeze on empty goal with '@asphaltcowb0y' watermark in white with black outline, bottom right corner. Hold for 1 second. Cinematic, thought-provoking, stunning aerial cinematography. Professional color grading, 4K quality. 8 seconds total." \
  --video-length-seconds=8 \
  --include-audio \
  --aspect-ratio=16:9 \
  --output-uri="gs://${PROJECT_ID}-videos/05_the_question.mp4" \
  --region="$LOCATION"

echo "✓ Video 5 complete"
echo ""

# Download videos from Cloud Storage
echo "======================================================================"
echo "Downloading videos to local directory..."
echo "======================================================================"
echo ""

gsutil -m cp "gs://${PROJECT_ID}-videos/*.mp4" "$OUTPUT_DIR/"

echo ""
echo "======================================================================"
echo "GENERATION COMPLETE"
echo "======================================================================"
echo "Total videos: 5"
echo "Cost: \$30"
echo "Location: $OUTPUT_DIR"
echo ""
ls -lh "$OUTPUT_DIR"/*.mp4
echo ""
echo "======================================================================"
echo "Ready to upload to X/Twitter!"
echo "Watermark: @asphaltcowb0y on all videos"
echo "======================================================================"
