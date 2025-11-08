#!/usr/bin/env python3
"""
Generate Segment 8 - The Unanswered Question (4 seconds)
The emotional climax: teenage girl's face with tear
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
OUTPUT_DIR = f"./SEGMENT_8_{TIMESTAMP}"

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

# SEGMENT 8: THE UNANSWERED QUESTION (56-60 seconds) - 4 SECONDS ONLY
SEGMENT_8_PROMPT = """Create PHOTOREALISTIC 4-second video. Shot on RED camera.

Extreme close-up of teenage female athlete (16-17 years old) in soccer uniform, sitting alone in massive empty stadium. Her face fills frame - raw authentic emotion, single tear forming and rolling down cheek, eyes looking directly into camera with devastating question. Expression shows heartbreak, confusion, and pleading. No words, just pure human emotion asking "why?" Shallow depth of field, stadium blurred behind her.

Cinematography: Extreme emotional close-up, twilight lighting, shallow depth of field (f/1.4), film grain, handheld slight movement for intimacy, RED camera skin tones.

Style: Prestige drama like 'Moonlight' or 'Manchester by the Sea' - devastating emotional truth."""

def generate_segment_8():
    """Generate the missing final emotional segment"""
    print("\n" + "="*70)
    print("   🎬 GENERATING SEGMENT 8 - THE UNANSWERED QUESTION")
    print("="*70)
    print("\n💔 Creating the emotional climax: 4-second face with tear")
    print("📍 This completes the 60-second narrative")
    print("-"*70)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    access_token = get_access_token()

    print(f"\n⏳ Generating Segment 8 (4 seconds)...")

    request = {
        "instances": [{"prompt": SEGMENT_8_PROMPT.strip()}],
        "parameters": {
            "storageUri": f"{BUCKET}/segment_8_{TIMESTAMP}/",
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
                operation_name = result["name"]
                print(f"✅ Generation started")
                print(f"📝 Operation: {operation_name}")

                # Save operation info
                with open(f"{OUTPUT_DIR}/operation.json", "w") as f:
                    json.dump({
                        "segment": "8",
                        "duration": "4s",
                        "operation": operation_name,
                        "prompt": SEGMENT_8_PROMPT,
                        "timestamp": TIMESTAMP
                    }, f, indent=2)

                # Wait for generation
                print("\n⏳ Waiting for generation (usually 3-5 minutes)...")
                for i in range(60):
                    print(f"⏱️ Waiting... {i*5}/300 seconds", end="\r")
                    time.sleep(5)

                print("\n\n✅ Generation should be complete!")
                print(f"📥 Download command:")
                print(f"gsutil cp {BUCKET}/segment_8_{TIMESTAMP}/sample_0.mp4 {OUTPUT_DIR}/segment_8.mp4")

                # Try to download
                print("\n📥 Attempting download...")
                download_cmd = f"gsutil cp {BUCKET}/segment_8_{TIMESTAMP}/sample_0.mp4 {OUTPUT_DIR}/segment_8.mp4"
                subprocess.run(download_cmd, shell=True)

                if os.path.exists(f"{OUTPUT_DIR}/segment_8.mp4"):
                    print("✅ Segment 8 downloaded successfully!")
                    return f"{OUTPUT_DIR}/segment_8.mp4"

        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)

    except Exception as e:
        print(f"❌ Error: {str(e)}")

    return None

if __name__ == "__main__":
    print("\n🎬 GENERATING MISSING SEGMENT 8")
    print("The emotional face with tear - 4 seconds")

    segment_path = generate_segment_8()

    if segment_path:
        print("\n" + "="*70)
        print("✅ SEGMENT 8 GENERATED SUCCESSFULLY!")
        print("="*70)
        print(f"📹 File: {segment_path}")
        print("⏱️ Duration: 4 seconds")
        print("\n📝 This segment shows:")
        print("   • Teenage girl's face in extreme close-up")
        print("   • Single tear rolling down cheek")
        print("   • Devastating 'why?' expression")
        print("   • Direct eye contact with camera")
        print("\n🎯 Ready to merge with other 7 segments for 60-second total!")
    else:
        print("\n❌ Failed to generate Segment 8")
        print("Please check the operation status in Cloud Console")