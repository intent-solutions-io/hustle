#!/usr/bin/env python3
"""
Soccer-Specific Clip Generator
Ensures clear SOCCER imagery - no confusion with football
"""

import os
import time
import json
import subprocess
import requests
from datetime import datetime

# Configuration
PROJECT_ID = "pipelinepilot-prod"
LOCATION = "us-central1"
BUCKET = f"gs://{PROJECT_ID}-veo-videos"
TIMESTAMP = datetime.now().strftime("%Y%m%d_%H%M%S")
OUTPUT_DIR = f"./SOCCER_CLIPS_{TIMESTAMP}"

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

# CLEARLY SOCCER-SPECIFIC CLIPS
SOCCER_CLIPS = [
    {
        "id": "soccer_goal",
        "duration": "5s",
        "prompt": """Create a 5-second PHOTOREALISTIC soccer scene.
        SOCCER GOAL with white crossbar and net, clearly showing rectangular shape.
        NOT football goalposts - SOCCER GOAL with NET.
        Empty soccer stadium, green pitch with white lines.
        Documentary style, golden hour. NO TEXT."""
    },
    {
        "id": "soccer_ball_close",
        "duration": "4s",
        "prompt": """Create a 4-second PHOTOREALISTIC close-up.
        Classic BLACK AND WHITE SOCCER BALL (football) on grass.
        Show hexagonal pattern clearly. SOCCER BALL not American football.
        On penalty spot with white line visible.
        Documentary style, shallow depth. NO TEXT."""
    },
    {
        "id": "nwsl_jersey",
        "duration": "4s",
        "prompt": """Create a 4-second PHOTOREALISTIC jersey shot.
        Women's soccer jersey hanging in locker room.
        Number visible, feminine cut jersey.
        Empty locker, abandoned feeling.
        Documentary lighting. NO TEXT."""
    },
    {
        "id": "soccer_cleats_detail",
        "duration": "4s",
        "prompt": """Create a 4-second PHOTOREALISTIC detail.
        SOCCER CLEATS (football boots) with studs visible.
        Women's size, colorful design typical of soccer.
        Hanging or on bench, showing soccer-specific design.
        Close-up, documentary style. NO TEXT."""
    },
    {
        "id": "soccer_pitch_lines",
        "duration": "5s",
        "prompt": """Create a 5-second PHOTOREALISTIC field shot.
        Soccer pitch showing CENTER CIRCLE and halfway line.
        Clear soccer field markings - penalty area, goal area visible.
        Empty women's soccer stadium, NWSL style.
        Wide shot, documentary style. NO TEXT."""
    }
]

def generate_soccer_clips():
    """Generate clearly soccer-specific clips"""
    print("\n" + "="*70)
    print("   ⚽ SOCCER-SPECIFIC CLIP GENERATION")
    print("="*70)
    print("\n🎯 Ensuring clear SOCCER imagery - no football confusion!")
    print("• Soccer goals with nets (not football goalposts)")
    print("• Classic soccer balls with hexagonal pattern")
    print("• Soccer cleats and women's jerseys")
    print("• Soccer field markings (center circle, penalty area)")
    print("-"*70)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    access_token = get_access_token()

    operations = []
    for clip in SOCCER_CLIPS:
        print(f"\n⚽ Generating: {clip['id']}")

        request = {
            "instances": [{"prompt": clip["prompt"].strip()}],
            "parameters": {
                "storageUri": f"{BUCKET}/soccer_specific/{clip['id']}/",
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
                json=request
            )

            if response.status_code == 200:
                result = response.json()
                if "name" in result:
                    print(f"✅ {clip['id']}: Started")
                    operations.append({
                        "clip_id": clip["id"],
                        "operation": result["name"]
                    })
            else:
                print(f"❌ {clip['id']}: Failed")

            time.sleep(3)  # Delay between requests

        except Exception as e:
            print(f"❌ Error: {str(e)}")

    # Save operations
    with open(f"{OUTPUT_DIR}/operations.json", "w") as f:
        json.dump(operations, f, indent=2)

    print(f"\n✅ Generated {len(operations)} soccer-specific clips")
    return operations

def create_merge_instructions():
    """Create instructions for merging with main documentary"""
    instructions = f"""
SOCCER CLIP INTEGRATION INSTRUCTIONS
====================================

These clips ensure clear SOCCER (not football) imagery:

1. soccer_goal - Use to replace any ambiguous stadium shot
2. soccer_ball_close - Clear soccer ball with hexagonal pattern
3. nwsl_jersey - Women's soccer jersey in locker
4. soccer_cleats_detail - Soccer-specific cleats
5. soccer_pitch_lines - Clear soccer field markings

To integrate with main documentary:

# Download soccer-specific clips
gsutil cp "gs://pipelinepilot-prod-veo-videos/soccer_specific/*/sample_0.mp4" {OUTPUT_DIR}/

# Use these to replace any ambiguous clips in the main documentary
# Especially important: Use soccer_goal instead of generic stadium shots

The final video should clearly show:
- ⚽ Soccer goals with nets
- ⚽ Soccer balls (black/white pattern)
- ⚽ Soccer cleats
- ⚽ Soccer field markings
- ⚽ Women's soccer context (NWSL)
"""

    with open(f"{OUTPUT_DIR}/integration_guide.txt", "w") as f:
        f.write(instructions)

    print(f"\n📋 Integration guide created: {OUTPUT_DIR}/integration_guide.txt")

if __name__ == "__main__":
    print("\n⚽ GENERATING SOCCER-SPECIFIC CLIPS")
    print("These will ensure no confusion with American football")

    operations = generate_soccer_clips()

    if operations:
        create_merge_instructions()
        print("\n" + "="*70)
        print("✅ SOCCER CLIPS GENERATING!")
        print("="*70)
        print("\nThese clips will clearly show:")
        print("• ⚽ Soccer goals (not football goalposts)")
        print("• ⚽ Soccer balls with hexagonal pattern")
        print("• ⚽ Women's soccer jerseys")
        print("• ⚽ Soccer cleats and equipment")
        print("• ⚽ Soccer field with proper markings")
        print(f"\nOutput: {OUTPUT_DIR}")
    else:
        print("\n❌ Failed to generate soccer clips")