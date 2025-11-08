#!/usr/bin/env python3
"""
Merge videos using Cloud Run service
"""

import json
import requests
from google.auth import default
from google.auth.transport.requests import Request as AuthRequest
from google.cloud import storage
import subprocess

PROJECT_ID = "pipelinepilot-prod"
BUCKET_NAME = f"{PROJECT_ID}-veo-videos"
MERGER_URL = "https://video-merger-365258353703.us-central1.run.app"

def get_access_token():
    """Get GCP access token."""
    credentials, _ = default()
    credentials.refresh(AuthRequest())
    return credentials.token

def upload_voiceover():
    """Upload voiceover to GCS."""
    print("Uploading voiceover to GCS...")

    subprocess.run([
        "gsutil", "cp",
        "./000-docs/nwsl/cinematic_broll/voiceover.mp3",
        f"gs://{BUCKET_NAME}/cinematic_voiceover.mp3"
    ], check=True)

    print("✓ Voiceover uploaded")

def merge_videos():
    """Call Cloud Run merger to combine all assets."""
    print("Calling Cloud Run merger service...")

    # The videos are already in GCS at these locations
    payload = {
        "videos": [
            "gs://pipelinepilot-prod-veo-videos/cinematic_scene1_celebration/15543918551800212345/sample_0.mp4",
            "gs://pipelinepilot-prod-veo-videos/cinematic_scene2_policy/3700925929040679469/sample_0.mp4",
            "gs://pipelinepilot-prod-veo-videos/cinematic_scene3_isolation/11096656157345985480/sample_0.mp4",
            "gs://pipelinepilot-prod-veo-videos/cinematic_scene4_stadium/17037165525807474243/sample_0.mp4"
        ],
        "voiceover": f"gs://{BUCKET_NAME}/cinematic_voiceover.mp3",
        "output": "nwsl_cinematic_FINAL.mp4",
        "watermark": "@asphaltcowb0y"
    }

    access_token = get_access_token()

    response = requests.post(
        f"{MERGER_URL}/merge",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        },
        json=payload,
        timeout=600
    )

    if response.status_code == 200:
        result = response.json()
        if result.get('success'):
            print(f"✓ Video merged successfully!")
            print(f"✓ Output: {result.get('output_url')}")
            return result.get('output_url')
        else:
            print(f"❌ Merge failed: {result.get('error')}")
            return None
    else:
        print(f"❌ HTTP error: {response.status_code}")
        print(response.text)
        return None

def download_final_video(gcs_url):
    """Download final video from GCS."""
    print("Downloading final video...")

    subprocess.run([
        "gsutil", "cp",
        gcs_url,
        "./000-docs/nwsl/nwsl_cinematic_FINAL.mp4"
    ], check=True)

    print("✓ Downloaded: ./000-docs/nwsl/nwsl_cinematic_FINAL.mp4")
    print()

    # Show file info
    subprocess.run(["ls", "-lh", "./000-docs/nwsl/nwsl_cinematic_FINAL.mp4"])

if __name__ == "__main__":
    print("=" * 70)
    print("CLOUD RUN VIDEO MERGER")
    print("=" * 70)
    print()

    # Upload voiceover
    upload_voiceover()
    print()

    # Merge everything
    output_url = merge_videos()
    print()

    if output_url:
        # Download final video
        download_final_video(output_url)
        print()
        print("=" * 70)
        print("✅ VIDEO COMPLETE!")
        print("=" * 70)
        print()
        print("Ready to upload to X/Twitter!")
    else:
        print("❌ Merge failed")
