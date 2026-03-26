#!/usr/bin/env python3
"""
Test script to generate a single Veo segment using Gemini API directly.
Requires: pip install httpx
"""

import os
import sys
import time
import json
import httpx
import asyncio

async def generate_segment():
    # Get API key from environment or prompt
    API_KEY = os.environ.get('GEMINI_API_KEY')
    if not API_KEY:
        print("Please set GEMINI_API_KEY environment variable")
        print("Get your key from: https://makersuite.google.com/app/apikey")
        sys.exit(1)

    # Test with segment 1
    prompt = """Create PHOTOREALISTIC 8-second video. Shot on RED camera documentary style.
    Young girls ages 8-12 playing competitive soccer on sunny field during golden hour.
    Slow motion: Girl dribbling ball with intense focus and joy, close-up of cleats striking ball,
    girls celebrating goal together with pure excitement, high-fives and hugs,
    authentic children's athletic movements, diverse young athletes, genuine childhood passion
    and competitive spirit. Cinematography: Warm golden lighting, shallow depth of field,
    film grain, slow motion at 120fps, handheld gimbal movement, ESPN documentary quality.
    Natural outdoor lighting, real grass field, authentic youth soccer atmosphere.
    Style: Prestige sports documentary - real, emotional, beautiful."""

    # Build request
    request_body = {
        "instances": [{
            "prompt": prompt
        }],
        "parameters": {
            "aspectRatio": "16:9",
            "resolution": "1080p",
            "durationSeconds": 8,
            "generateAudio": True,
            "sampleCount": 1
        }
    }

    headers = {
        "x-goog-api-key": API_KEY,
        "Content-Type": "application/json"
    }

    print("🎬 Submitting to Gemini API Veo 3.0...")

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Submit request
        response = await client.post(
            "https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-preview:predictLongRunning",
            json=request_body,
            headers=headers
        )

        if response.status_code != 200:
            print(f"❌ Error {response.status_code}: {response.text}")
            return

        data = response.json()
        operation_name = data.get("name", "").split("/")[-1]
        print(f"✅ Operation started: {operation_name}")

        # Poll for completion
        print("⏳ Waiting for video generation (this takes 2-3 minutes)...")
        poll_url = f"https://generativelanguage.googleapis.com/v1beta/operations/{operation_name}"

        for i in range(60):  # Max 5 minutes
            await asyncio.sleep(5)

            poll_response = await client.get(poll_url, headers=headers)
            if poll_response.status_code != 200:
                continue

            poll_data = poll_response.json()

            if poll_data.get("done"):
                if "error" in poll_data:
                    print(f"❌ Generation failed: {poll_data['error']}")
                    return

                # Extract video URI
                predictions = poll_data.get("response", {}).get("predictions", [])
                if predictions and "videoUri" in predictions[0]:
                    video_uri = predictions[0]["videoUri"]
                    print(f"✅ Video ready: {video_uri}")

                    # Download video
                    print("📥 Downloading video...")
                    video_response = await client.get(video_uri)
                    with open("test_segment.mp4", "wb") as f:
                        f.write(video_response.content)
                    print("✅ Saved as test_segment.mp4")
                    return

            # Show progress
            print(f"   Still processing... ({i*5}s)")

        print("❌ Timeout after 5 minutes")

if __name__ == "__main__":
    asyncio.run(generate_segment())