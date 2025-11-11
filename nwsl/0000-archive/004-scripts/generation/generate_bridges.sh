#!/bin/bash
# Generate 7 bridge transition shots for seamless flow
set -e

PROJECT_ID="pipelinepilot-prod"
LOCATION="us-central1"
MODEL_ID="veo-3.0-generate-001"
BUCKET="gs://pipelinepilot-prod-veo-videos"
API_ENDPOINT="https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:predictLongRunning"

echo "🌉 GENERATING BRIDGE TRANSITIONS"
echo "================================"
echo ""

# Get access token
ACCESS_TOKEN=$(gcloud auth application-default print-access-token)

# Bridge shot prompts - 2.5 seconds each, no audio
declare -A BRIDGES
BRIDGES["BR-12"]="Photorealistic. Cinematic lensing. Shallow depth of field. Naturalistic movement. Sun flare hitting soccer ball transitioning to flare reflecting on office window glass, static hold. 2.5 seconds. No on-screen text, no captions, no signage, no UI, no watermarks or logos."

BRIDGES["BR-23"]="Photorealistic. Cinematic lensing. Shallow depth of field. Naturalistic movement. Extreme close-up of pen resting on desk slowly tilting as pen tip lowers to sign document. 2.5 seconds. No on-screen text, no captions, no signage, no UI, no watermarks or logos."

BRIDGES["BR-34"]="Photorealistic. Cinematic lensing. Shallow depth of field. Naturalistic movement. Construction crane silhouette against bright sky, slow upward tilt revealing clouds. 2.5 seconds. No on-screen text, no captions, no signage, no UI, no watermarks or logos."

BRIDGES["BR-45"]="Photorealistic. Cinematic lensing. Shallow depth of field. Naturalistic movement. Champagne flute catching light that echoes the glint of a luxury watch face. 2.5 seconds. No on-screen text, no captions, no signage, no UI, no watermarks or logos."

BRIDGES["BR-56"]="Photorealistic. Cinematic lensing. Shallow depth of field. Naturalistic movement. Clinical overhead fluorescent light flickering once, quick and unnerving. 2.5 seconds. No on-screen text, no captions, no signage, no UI, no watermarks or logos."

BRIDGES["BR-67"]="Photorealistic. Cinematic lensing. Shallow depth of field. Naturalistic movement. Clipboard woodgrain texture dissolving into bench woodgrain at golden hour dusk. 2.5 seconds. No on-screen text, no captions, no signage, no UI, no watermarks or logos."

BRIDGES["BR-78"]="Photorealistic. Cinematic lensing. Shallow depth of field. Naturalistic movement. Soccer ball perfectly centered slowly morphing into human iris pupil extreme close-up. 2.5 seconds. No on-screen text, no captions, no signage, no UI, no watermarks or logos."

# Submit all bridges
echo "📤 Submitting bridge generations..."
for bridge in BR-12 BR-23 BR-34 BR-45 BR-56 BR-67 BR-78; do
    echo ""
    echo "Bridge $bridge:"

    PROMPT="${BRIDGES[$bridge]}"

    cat > /tmp/${bridge}.json <<EOF
{
  "instances": [{"prompt": "$PROMPT"}],
  "parameters": {
    "storageUri": "${BUCKET}/${bridge}/",
    "sampleCount": 1
  }
}
EOF

    RESPONSE=$(curl -s -X POST \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      "$API_ENDPOINT" \
      -d @/tmp/${bridge}.json)

    OPERATION=$(echo "$RESPONSE" | jq -r '.name // .error.message // "Error"')

    if [[ "$OPERATION" == "projects/"* ]]; then
        echo "  ✅ Submitted: $OPERATION"
        echo "$OPERATION" > /tmp/${bridge}_operation.txt
    else
        echo "  ❌ Failed: $OPERATION"
    fi
done

echo ""
echo "⏳ Waiting 90 seconds for generation..."
sleep 90

echo ""
echo "📥 Downloading bridge shots..."
mkdir -p 030-video/bridges

for bridge in BR-12 BR-23 BR-34 BR-45 BR-56 BR-67 BR-78; do
    echo -n "$bridge: "

    VIDEO_PATH=$(gsutil ls "${BUCKET}/${bridge}/*/*.mp4" 2>/dev/null | head -1)

    if [ -n "$VIDEO_PATH" ]; then
        gsutil cp "$VIDEO_PATH" "030-video/bridges/${bridge}.mp4"
        # Strip audio immediately
        ffmpeg -y -i "030-video/bridges/${bridge}.mp4" -c:v copy -an "030-video/silent/${bridge}.mp4" -loglevel error
        SIZE=$(ls -lh "030-video/silent/${bridge}.mp4" | awk '{print $5}')
        echo "✅ Downloaded ($SIZE)"
    else
        echo "⚠️  Not ready, generating placeholder..."
        # Generate 2.5s placeholder
        ffmpeg -f lavfi -i "color=c=black:s=1920x1080:d=2.5" \
            -vf "drawtext=text='$bridge':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" \
            -r 24 -c:v libx264 -pix_fmt yuv420p \
            "030-video/silent/${bridge}.mp4" -y -loglevel error
    fi
done

echo ""
echo "✅ Bridge generation complete"
ls -lh 030-video/silent/BR-*.mp4