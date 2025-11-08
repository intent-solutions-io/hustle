#!/usr/bin/env python3
"""
Test Veo 3 Lip-Sync Capability
Generates a 10-second test clip with dialogue to validate lip-sync quality.
"""

import json
import time
import requests
from google.auth import default
import subprocess

# Configuration
PROJECT_ID = "pipelinepilot-prod"
LOCATION = "us-central1"
MODEL_ID = "veo-3.0-generate-001"
BUCKET = f"gs://{PROJECT_ID}-veo-videos"

# API Endpoint
API_ENDPOINT = (
    f"https://{LOCATION}-aiplatform.googleapis.com/v1/"
    f"projects/{PROJECT_ID}/locations/{LOCATION}/"
    f"publishers/google/models/{MODEL_ID}:predictLongRunning"
)

def get_access_token():
    """Get GCP access token."""
    credentials, _ = default()
    credentials.refresh(requests.Request())
    return credentials.token

def generate_test_clip():
    """Generate 10-second test clip with dialogue."""

    print("=" * 70)
    print("VEO 3 LIP-SYNC TEST")
    print("=" * 70)
    print()
    print("Generating 10-second test clip with dialogue...")
    print("Cost: $7.50 (10 seconds × $0.75/sec)")
    print()

    # Test prompt with dialogue
    prompt = """
4K cinematic documentary interview style. Professional female soccer player
in her early 30s, athletic build, wearing red NWSL jersey. Sitting in modern
locker room with natural window lighting. She looks directly at camera with
confidence and warmth, and says clearly: 'The NWSL was built by women, for
women, and that will always matter to us.' Camera slowly pushes in on her face.
Genuine emotion in her eyes. Documentary realism. 10 seconds with perfect lip
synchronization to her speech.
    """.strip()

    # Request payload
    payload = {
        "instances": [{"prompt": prompt}],
        "parameters": {
            "storageUri": f"{BUCKET}/lipsync_test/",
            "sampleCount": 1,
            "aspectRatio": "16:9"
        }
    }

    # Get access token
    access_token = get_access_token()

    # Submit request
    print("Submitting generation request...")
    response = requests.post(
        API_ENDPOINT,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        },
        json=payload
    )

    if response.status_code != 200:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
        return None

    result = response.json()
    operation_name = result.get('name')

    if not operation_name:
        print("❌ No operation name returned")
        print(json.dumps(result, indent=2))
        return None

    print(f"✓ Generation started: {operation_name}")
    print()
    print("Waiting 90 seconds for video generation...")
    print()

    # Wait for generation
    for i in range(18):  # 90 seconds / 5 second intervals
        time.sleep(5)
        elapsed = (i + 1) * 5
        remaining = 90 - elapsed
        print(f"Elapsed: {elapsed}s | Remaining: {remaining}s", end='\r')

    print()
    print()
    print("✓ Generation should be complete!")
    print()

    # Check if video exists
    video_path = f"{BUCKET}/lipsync_test/"
    print(f"Checking for video at: {video_path}")

    try:
        result = subprocess.run(
            ["gsutil", "ls", "-r", video_path],
            capture_output=True,
            text=True
        )

        if "sample_0.mp4" in result.stdout:
            # Find the full path
            for line in result.stdout.split('\n'):
                if 'sample_0.mp4' in line:
                    full_path = line.strip()
                    print(f"✓ Video generated: {full_path}")
                    print()

                    # Download to local
                    local_path = "./000-docs/nwsl/lipsync_test.mp4"
                    print(f"Downloading to: {local_path}")

                    subprocess.run(
                        ["gsutil", "cp", full_path, local_path],
                        check=True
                    )

                    print("✓ Downloaded!")
                    print()
                    print("=" * 70)
                    print("TEST COMPLETE")
                    print("=" * 70)
                    print()
                    print(f"Review video: {local_path}")
                    print()
                    print("Evaluation Criteria:")
                    print("  ✓ Do lips match the spoken words?")
                    print("  ✓ Does voice sound natural?")
                    print("  ✓ Is audio quality clear?")
                    print("  ✓ Are there visual artifacts?")
                    print()
                    print("If quality is good:")
                    print("  → Proceed with full 90-second production ($67.50)")
                    print()
                    print("If quality is poor:")
                    print("  → Pivot to SadTalker deployment ($2-5)")
                    print()

                    return local_path
        else:
            print("❌ Video not found. Check operation status:")
            print(f"   gcloud ai operations describe {operation_name}")

    except subprocess.CalledProcessError as e:
        print(f"❌ Error checking video: {e}")

    return None

if __name__ == "__main__":
    generate_test_clip()
