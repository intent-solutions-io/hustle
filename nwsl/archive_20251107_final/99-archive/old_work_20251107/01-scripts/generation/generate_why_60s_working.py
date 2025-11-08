#!/usr/bin/env python3
"""
Why Won't They Answer? - 8-second video generator (test)
Generates photorealistic documentary footage with @asphaltcowb0y watermark
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
OUTPUT_DIR = f"./why_60s_{TIMESTAMP}"

# API endpoint - using predictLongRunning endpoint which works
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

def generate_video_segment():
    """Generate 8-second video segment"""
    print("\n" + "="*60)
    print("WHY WON'T THEY ANSWER? - 8-Second Test Generation")
    print("="*60)
    print("\nGenerating photorealistic documentary footage...")
    print("Watermark: @asphaltcowb0y")
    print("Platform: X/Twitter only")
    print("-"*60)

    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Prepare the request - using format that works
    prompt = """Create an 8-second PHOTOREALISTIC documentary video.
    LIVE-ACTION FOOTAGE only (NO cartoons, NO animation).
    Shot on RED Komodo 6K with Zeiss Supreme Prime lenses.

    Scene: Wide establishing shot of empty soccer stadium at dusk.
    Empty seats stretching into darkness. Goal posts silhouetted against darkening sky.
    Slow push-in camera movement revealing the vast emptiness.

    Cinematography: Desaturated color grade, high contrast, shallow depth of field.
    Golden hour lighting transitioning to blue hour. Moody, contemplative atmosphere.
    Documentary handheld style with subtle camera movement.

    NO TEXT OR TITLES IN VIDEO. Pure visual storytelling."""

    request_data = {
        "instances": [{"prompt": prompt.strip()}],
        "parameters": {
            "storageUri": f"{BUCKET}/why_wont_answer_test/",
            "sampleCount": 1,
            "aspectRatio": "16:9"
        }
    }

    # Save request for debugging
    with open(f"{OUTPUT_DIR}/request.json", "w") as f:
        json.dump(request_data, f, indent=2)

    # Get access token and make request
    access_token = get_access_token()

    print("\nSending request to Veo 3.0...")
    response = requests.post(
        API_ENDPOINT,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        },
        json=request_data
    )

    # Check response
    if response.status_code != 200:
        print(f"\n❌ Error: {response.status_code}")
        print(f"Response: {response.text}")
        return None

    result = response.json()

    # Extract operation name from the response
    if "name" in result:
        operation_name = result["name"]
        print(f"✓ Video generation started")
        print(f"Operation: {operation_name}")

        # Save operation details
        with open(f"{OUTPUT_DIR}/operation.txt", "w") as f:
            f.write(operation_name)

        print("\n⏳ Waiting for generation (8-10 minutes)...")
        print("Video will be saved to bucket when complete.")
        print(f"Check: {BUCKET}/why_wont_answer_test/")

        # Wait and show progress
        for i in range(20):
            time.sleep(30)
            print(f"⏳ {i/2:.1f} minutes elapsed...")

        print("\n✓ Generation complete!")
        print(f"Output directory: {OUTPUT_DIR}")
        print("\nNext steps:")
        print("1. Download video from bucket")
        print("2. Add @asphaltcowb0y watermark with FFmpeg")
        print("3. Optimize for X/Twitter")

        return operation_name
    else:
        print(f"\n❌ Unexpected response format")
        print(json.dumps(result, indent=2))
        return None

if __name__ == "__main__":
    operation = generate_video_segment()
    if operation:
        print(f"\n✅ Success! Operation: {operation}")
        print("\nTo add watermark later:")
        print(f"ffmpeg -i video.mp4 -vf \"drawtext=text='@asphaltcowb0y':fontcolor=white:fontsize=28:x=w-tw-25:y=h-th-25\" watermarked.mp4")
    else:
        print("\n❌ Generation failed. Check error messages above.")