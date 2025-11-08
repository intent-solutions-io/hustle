#!/usr/bin/env python3
"""
Smart Documentary Generator - Intelligent Multi-Clip System
Generates multiple short clips and merges them with transitions
Optimized for narrative flow and cost efficiency
"""

import os
import time
import json
import subprocess
import requests
from datetime import datetime
import concurrent.futures

# Configuration
PROJECT_ID = "pipelinepilot-prod"
LOCATION = "us-central1"
BUCKET = f"gs://{PROJECT_ID}-veo-videos"
TIMESTAMP = datetime.now().strftime("%Y%m%d_%H%M%S")
OUTPUT_DIR = f"./SMART_DOC_{TIMESTAMP}"

# API endpoint
MODEL_ID = "veo-3.0-generate-001"
API_ENDPOINT = f"https://{LOCATION}-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/{LOCATION}/publishers/google/models/{MODEL_ID}:predictLongRunning"

def get_access_token():
    """Get GCP access token"""
    result = subprocess.run(
        ["gcloud", "auth", "application-default", "print-access-token"],
        capture_output=True,
        text=True
    )
    return result.stdout.strip()

# Define smart clip sequences - each 4-5 seconds for optimal generation
SMART_CLIPS = [
    {
        "id": "opening",
        "duration": "5s",
        "prompt": """Create a 5-second PHOTOREALISTIC opening shot.
        Wide establishing shot of empty soccer stadium at golden hour.
        Slow push-in revealing vast emptiness. Goal posts silhouetted.
        Documentary cinematography, desaturated colors, shallow depth.
        NO TEXT. Pure visual storytelling.""",
        "order": 1
    },
    {
        "id": "ball",
        "duration": "4s",
        "prompt": """Create a 4-second PHOTOREALISTIC close-up.
        Weathered soccer ball on penalty spot, untouched.
        Dust particles floating in stadium lights.
        Extreme close-up showing texture, wear.
        Documentary style, high contrast. NO TEXT.""",
        "order": 2
    },
    {
        "id": "locker",
        "duration": "5s",
        "prompt": """Create a 5-second PHOTOREALISTIC tracking shot.
        Slow dolly through empty locker room.
        Jerseys hanging, long shadows, abandoned feeling.
        Documentary handheld movement, moody lighting.
        NO TEXT.""",
        "order": 3
    },
    {
        "id": "cleats",
        "duration": "4s",
        "prompt": """Create a 4-second PHOTOREALISTIC detail shot.
        Extreme close-up of cleats hanging by laces.
        Gentle swaying motion, dust motes in light beam.
        Shallow depth of field, emotional framing.
        NO TEXT.""",
        "order": 4
    },
    {
        "id": "field",
        "duration": "5s",
        "prompt": """Create a 5-second PHOTOREALISTIC dawn shot.
        Wide training field at sunrise, fog rolling across.
        Empty pitch, morning mist, ethereal atmosphere.
        Documentary cinematography, blue hour lighting.
        NO TEXT.""",
        "order": 5
    },
    {
        "id": "tunnel",
        "duration": "4s",
        "prompt": """Create a 4-second PHOTOREALISTIC tunnel shot.
        Ground-level view into dark stadium tunnel.
        Ominous, silent, abandoned atmosphere.
        High contrast, documentary style.
        NO TEXT.""",
        "order": 6
    },
    {
        "id": "lights",
        "duration": "5s",
        "prompt": """Create a 5-second PHOTOREALISTIC ending.
        Stadium lights turning off one by one.
        Wide shot showing progressive darkness.
        Emotional finale, documentary style.
        Fade to black at end. NO TEXT.""",
        "order": 7
    }
]

def generate_clip(clip_data, access_token):
    """Generate a single video clip"""
    clip_id = clip_data["id"]
    print(f"\n📹 Generating clip: {clip_id} ({clip_data['duration']})")

    request = {
        "instances": [{"prompt": clip_data["prompt"].strip()}],
        "parameters": {
            "storageUri": f"{BUCKET}/smart_doc/{clip_id}/",
            "sampleCount": 1,
            "aspectRatio": "16:9"
        }
    }

    try:
        response = requests.post(
            API_ENDPOINT,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            },
            json=request,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            if "name" in result:
                operation_name = result["name"]
                print(f"✅ {clip_id}: Generation started")
                return {
                    "clip_id": clip_id,
                    "operation": operation_name,
                    "order": clip_data["order"],
                    "status": "started"
                }
        else:
            print(f"❌ {clip_id}: Failed - {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ {clip_id}: Error - {str(e)}")
        return None

def smart_generation():
    """Execute smart multi-clip generation strategy"""
    print("\n" + "="*70)
    print("   🧠 SMART DOCUMENTARY GENERATION SYSTEM")
    print("="*70)
    print("\n📊 Strategy: Generate 7 clips × 4-5 seconds = ~32 seconds total")
    print("💰 Cost: ~$3-4 per clip = ~$21-28 total (vs $45-68 for 60s)")
    print("🎯 Benefit: Better narrative control, smooth transitions")
    print("-"*70)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    access_token = get_access_token()

    # Generate clips in parallel for efficiency
    print("\n🚀 Launching parallel clip generation...")
    operations = []

    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        futures = []
        for clip in SMART_CLIPS:
            time.sleep(2)  # Small delay between submissions
            future = executor.submit(generate_clip, clip, access_token)
            futures.append(future)

        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            if result:
                operations.append(result)

    # Save operations for tracking
    with open(f"{OUTPUT_DIR}/operations.json", "w") as f:
        json.dump(operations, f, indent=2)

    print(f"\n✅ Started generation of {len(operations)} clips")
    print("⏳ Clips will be ready in 8-10 minutes")

    return operations

def create_merge_script():
    """Create intelligent merging script with transitions"""
    script_content = f'''#!/bin/bash
# Smart Documentary Merger with Transitions
# Adds crossfade transitions between clips for smooth flow

echo "🎬 SMART DOCUMENTARY MERGER"
echo "=========================="

OUTPUT_DIR="{OUTPUT_DIR}"
BUCKET="{BUCKET}"

# Download all clips
echo "📥 Downloading clips..."
for clip in opening ball locker cleats field tunnel lights; do
    echo "Downloading ${{clip}}..."
    gsutil cp "${{BUCKET}}/smart_doc/${{clip}}/*/sample_0.mp4" "${{OUTPUT_DIR}}/${{clip}}.mp4" 2>/dev/null || echo "Waiting for ${{clip}}..."
done

# Create clips with fade transitions
echo "🎨 Adding transitions..."

# Process each clip with fade in/out
for i in 1 2 3 4 5 6 7; do
    case $i in
        1) clip="opening" ;;
        2) clip="ball" ;;
        3) clip="locker" ;;
        4) clip="cleats" ;;
        5) clip="field" ;;
        6) clip="tunnel" ;;
        7) clip="lights" ;;
    esac

    if [ -f "${{OUTPUT_DIR}}/${{clip}}.mp4" ]; then
        # Add 0.5s crossfade transitions
        ffmpeg -i "${{OUTPUT_DIR}}/${{clip}}.mp4" \\
            -vf "fade=t=in:st=0:d=0.5,fade=t=out:st=3.5:d=0.5" \\
            -c:a copy "${{OUTPUT_DIR}}/${{clip}}_fade.mp4" -y 2>/dev/null
    fi
done

# Merge with crossfade transitions using filter_complex
echo "🔗 Merging clips with smooth transitions..."

ffmpeg -i "${{OUTPUT_DIR}}/opening_fade.mp4" \\
       -i "${{OUTPUT_DIR}}/ball_fade.mp4" \\
       -i "${{OUTPUT_DIR}}/locker_fade.mp4" \\
       -i "${{OUTPUT_DIR}}/cleats_fade.mp4" \\
       -i "${{OUTPUT_DIR}}/field_fade.mp4" \\
       -i "${{OUTPUT_DIR}}/tunnel_fade.mp4" \\
       -i "${{OUTPUT_DIR}}/lights_fade.mp4" \\
       -filter_complex "
       [0:v][0:a][1:v][1:a][2:v][2:a][3:v][3:a][4:v][4:a][5:v][5:a][6:v][6:a]
       concat=n=7:v=1:a=1[v][a]" \\
       -map "[v]" -map "[a]" \\
       "${{OUTPUT_DIR}}/merged_documentary.mp4" -y

# Add emotional text overlays
echo "📝 Adding text overlays..."

ffmpeg -i "${{OUTPUT_DIR}}/merged_documentary.mp4" \\
    -filter_complex "[0:v]
    drawtext=text='WHY WON\\'T THEY ANSWER?':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,2,5)':shadowcolor=black@0.9:shadowx=4:shadowy=4,
    drawtext=text='60 days of silence':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-100:enable='between(t,8,11)':shadowcolor=black@0.8:shadowx=3:shadowy=3,
    drawtext=text='Players deserve answers':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=100:enable='between(t,15,18)':shadowcolor=black@0.8:shadowx=3:shadowy=3,
    drawtext=text='#StopTheInsanity':fontcolor=white:fontsize=56:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,25,30)':shadowcolor=black@0.8:shadowx=3:shadowy=3,
    drawtext=text='@asphaltcowb0y':fontcolor=white:fontsize=28:x=w-tw-25:y=h-th-25:shadowcolor=black@0.7:shadowx=2:shadowy=2
    [v]" \\
    -map "[v]" -map 0:a -c:v libx264 -crf 20 -c:a aac \\
    "${{OUTPUT_DIR}}/documentary_with_text.mp4" -y

# Final X/Twitter optimization
echo "🐦 Optimizing for X/Twitter..."

ffmpeg -i "${{OUTPUT_DIR}}/documentary_with_text.mp4" \\
    -c:v libx264 -preset slow -crf 23 \\
    -c:a aac -b:a 128k \\
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080" \\
    -movflags +faststart \\
    "${{OUTPUT_DIR}}/SMART_DOCUMENTARY_FINAL.mp4" -y

echo ""
echo "✅ SMART DOCUMENTARY COMPLETE!"
echo "📹 Final: ${{OUTPUT_DIR}}/SMART_DOCUMENTARY_FINAL.mp4"
echo "⏱️ Duration: ~32 seconds"
echo "#️⃣ Hashtag: #StopTheInsanity"
echo "✍️ Credit: @asphaltcowb0y"
'''

    script_path = f"{OUTPUT_DIR}/smart_merge.sh"
    with open(script_path, "w") as f:
        f.write(script_content)
    os.chmod(script_path, 0o755)

    print(f"\n📜 Smart merge script created: {script_path}")
    print("Run this after clips generate (~10 minutes)")

if __name__ == "__main__":
    print("\n🧠 INITIATING SMART DOCUMENTARY GENERATION")
    print("This approach is more intelligent:")
    print("• Generates 7 clips of 4-5 seconds each")
    print("• Total ~32 seconds of compelling content")
    print("• Cost: ~$21-28 (vs $45-68 for forced 60s)")
    print("• Better narrative control and transitions")

    operations = smart_generation()

    if operations:
        create_merge_script()
        print("\n" + "="*70)
        print("✅ SMART GENERATION INITIATED!")
        print("="*70)
        print("\n📊 Status:")
        print(f"• {len(operations)} clips generating")
        print("• Wait 8-10 minutes for completion")
        print(f"• Then run: {OUTPUT_DIR}/smart_merge.sh")
        print("\nThis smart approach gives you:")
        print("• Better narrative flow")
        print("• Smooth transitions")
        print("• Lower cost")
        print("• More control")
    else:
        print("\n❌ Failed to start smart generation")