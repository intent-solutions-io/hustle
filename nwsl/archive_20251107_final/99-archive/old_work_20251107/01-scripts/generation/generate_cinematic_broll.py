#!/usr/bin/env python3
"""
Generate Cinematic B-Roll NWSL Video
NO lip-sync needed - voiceover style like Nike/ESPN

Total cost: ~$45
Total time: ~20 minutes
"""

import json
import time
import requests
import subprocess
from google.auth import default
from google.auth.transport.requests import Request
from google.cloud import texttospeech

# Configuration
PROJECT_ID = "pipelinepilot-prod"
LOCATION = "us-central1"
MODEL_ID = "veo-3.0-generate-001"
BUCKET = f"gs://{PROJECT_ID}-veo-videos"
OUTPUT_DIR = "./000-docs/nwsl/cinematic_broll"

# API Endpoint
API_ENDPOINT = (
    f"https://{LOCATION}-aiplatform.googleapis.com/v1/"
    f"projects/{PROJECT_ID}/locations/{LOCATION}/"
    f"publishers/google/models/{MODEL_ID}:predictLongRunning"
)

# Voiceover Script (60 seconds)
VOICEOVER_SCRIPT = """
<speak>
<prosody rate="0.95" pitch="0st">
For generations, they told us women's sports didn't matter.
<break time="500ms"/>
That we couldn't compete.
<break time="500ms"/>
That no one would watch.
<break time="1500ms"/>

They were wrong.
<break time="1000ms"/>

Today, the NWSL proves that when women have space to compete on a level playing field,
<break time="300ms"/>
we don't just participate -
<break time="300ms"/>
we dominate.
<break time="1500ms"/>

But here's the truth: this space was created for a reason.
<break time="800ms"/>

Biological differences in sports aren't opinions - they're science.
<break time="800ms"/>

Testosterone. Muscle mass. Bone density.
<break time="800ms"/>

These aren't talking points. They're physiology.
<break time="600ms"/>

And they're why women's sports exist.
<break time="1500ms"/>

Eleven-year NWSL veteran Elizabeth Eddy spoke the truth about protecting women's sports.
<break time="800ms"/>

Her teammates called her racist.
<break time="800ms"/>

But fairness isn't hateful - it's foundational.
<break time="1500ms"/>

Because the 'W' in NWSL?
<break time="800ms"/>

It stands for something.
<break time="800ms"/>

And it's worth fighting for.
</prosody>
</speak>
""".strip()

# Video Scene Prompts (15 seconds each)
SCENES = {
    "scene1_celebration": """
4K cinematic slow-motion. Women's soccer championship celebration at golden hour.
Professional female athletes in NWSL jerseys in mid-embrace after scoring winning
goal. Pure joy, tears streaming, teammates jumping together. Diverse team, powerful
athletic builds. Stadium crowd visible in background cheering. Shot on Arri Alexa
aesthetic, shallow depth of field isolates emotion. Documentary realism meets
artistic beauty. Warm golds, deep greens, emotional authenticity. This is women's
sports at its finest. NO TEXT. 15 seconds.
    """,

    "scene2_policy": """
4K cinematic. Extreme close-up on official NWSL policy document lying on executive
mahogany desk. Text visible about transgender athlete policy and testosterone levels.
Camera slowly pushes in on the document. Dramatic side lighting through venetian
blinds creates film noir shadows across the pages. Pages flutter slightly in office
breeze. Serious, ominous atmosphere. Professional office setting, legal document
aesthetic. High contrast black and white cinematography. Think "Spotlight" meets
"All the President's Men" investigative journalism style. NO TEXT OVERLAYS. 15 seconds.
    """,

    "scene3_isolation": """
4K dramatic metaphor. Empty women's soccer locker room after hours. Single soccer
jersey with number "1" hanging alone in spotlight, all other jersey hooks empty.
Slow 360-degree camera orbit around the isolated jersey creating sense of
abandonment. Modern athletic facility, pristine but cold and quiet. Harsh overhead
spotlight creates dramatic shadows. The jersey sways slightly as if breathing.
Metaphor for: one voice standing alone, being singled out, cancelled for speaking
truth. Emotional weight of isolation palpable. Film noir aesthetic, heavy use of
negative space. NO TEXT. 15 seconds.
    """,

    "scene4_stadium": """
4K aerial cinematography masterpiece. Ultra-wide drone shot starting from 500 feet
above empty professional women's soccer stadium at dusk. Golden hour magic - long
shadows cast across pristine grass, stadium seats completely empty, no players, no
controversy, absolute silence. Slow cinematic descent toward center field, camera
movement deliberate and meaningful. The field where it all began. Beautiful but
haunting. Stadium lights off, scoreboard dark. The void where reason should be.
Final shot: freeze on empty goal, hold for 2 seconds. National Geographic / BBC
Earth quality aerial work. NO TEXT. 15 seconds.
    """
}

def get_access_token():
    """Get GCP access token."""
    credentials, _ = default()
    credentials.refresh(Request())
    return credentials.token

def generate_voiceover():
    """Generate AI voiceover using Google Cloud Text-to-Speech."""
    print("=" * 70)
    print("STEP 1/5: GENERATING AI VOICEOVER")
    print("=" * 70)
    print()
    print("Using Google Cloud Text-to-Speech Neural2-F voice...")
    print("(Warm, authoritative female voice)")
    print()

    # Create TTS client
    client = texttospeech.TextToSpeechClient()

    # Configure voice
    synthesis_input = texttospeech.SynthesisInput(ssml=VOICEOVER_SCRIPT)

    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US",
        name="en-US-Neural2-F",  # Warm, mature female voice
        ssml_gender=texttospeech.SsmlVoiceGender.FEMALE
    )

    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=0.95,  # Slightly slower for gravitas
        pitch=0.0,
        volume_gain_db=0.0
    )

    # Generate audio
    response = client.synthesize_speech(
        input=synthesis_input,
        voice=voice,
        audio_config=audio_config
    )

    # Save to file
    voiceover_path = f"{OUTPUT_DIR}/voiceover.mp3"
    with open(voiceover_path, "wb") as out:
        out.write(response.audio_content)

    print(f"✓ Voiceover generated: {voiceover_path}")
    print(f"✓ Duration: ~60 seconds")
    print(f"✓ Cost: ~$0.03")
    print()

    return voiceover_path

def generate_video_scene(scene_name, prompt):
    """Generate video scene with Veo 3."""
    print(f"[{scene_name}] Submitting generation request...")

    payload = {
        "instances": [{"prompt": prompt.strip()}],
        "parameters": {
            "storageUri": f"{BUCKET}/cinematic_{scene_name}/",
            "sampleCount": 1,
            "aspectRatio": "16:9"
        }
    }

    access_token = get_access_token()

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
        return None

    print(f"✓ {operation_name}")
    return operation_name

def wait_and_download_videos(operations):
    """Wait for all videos to generate and download them."""
    print()
    print("STEP 3/5: WAITING FOR VIDEO GENERATION")
    print("=" * 70)
    print("Videos take ~90-120 seconds each to generate")
    print("Waiting 8 minutes for all 4 scenes...")
    print()

    # Wait 8 minutes
    for i in range(48):  # 8 mins / 10 sec intervals
        time.sleep(10)
        elapsed = (i + 1) * 10
        remaining = 480 - elapsed
        print(f"Elapsed: {elapsed}s | Remaining: {remaining}s", end='\r')

    print()
    print()
    print("✓ Generation window complete!")
    print()

    # Download videos
    print("STEP 4/5: DOWNLOADING VIDEOS")
    print("=" * 70)
    print()

    downloaded_files = []

    for scene_name in SCENES.keys():
        print(f"Downloading {scene_name}...")

        video_path = f"{BUCKET}/cinematic_{scene_name}/"

        try:
            result = subprocess.run(
                ["gsutil", "ls", "-r", video_path],
                capture_output=True,
                text=True
            )

            if "sample_0.mp4" in result.stdout:
                for line in result.stdout.split('\n'):
                    if 'sample_0.mp4' in line:
                        full_path = line.strip()
                        local_path = f"{OUTPUT_DIR}/{scene_name}.mp4"

                        subprocess.run(
                            ["gsutil", "cp", full_path, local_path],
                            check=True
                        )

                        print(f"✓ Downloaded: {local_path}")
                        downloaded_files.append(local_path)
                        break
            else:
                print(f"❌ Video not found for {scene_name}")

        except subprocess.CalledProcessError as e:
            print(f"❌ Error downloading {scene_name}: {e}")

    print()
    return downloaded_files

def merge_final_video(video_files, voiceover_path):
    """Merge all assets into final video with FFmpeg."""
    print("STEP 5/5: MERGING FINAL VIDEO")
    print("=" * 70)
    print()

    # Create concat file
    concat_file = f"{OUTPUT_DIR}/concat_list.txt"
    with open(concat_file, 'w') as f:
        for video_file in video_files:
            f.write(f"file '{video_file}'\n")

    # Step 1: Concatenate videos
    print("→ Concatenating video scenes...")
    merged_video = f"{OUTPUT_DIR}/merged_video.mp4"

    subprocess.run([
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_file,
        "-c", "copy",
        merged_video
    ], check=True)

    print("✓ Videos concatenated")

    # Step 2: Add voiceover and watermark
    print("→ Adding voiceover and watermark...")
    final_video = f"{OUTPUT_DIR}/nwsl_cinematic_FINAL.mp4"

    subprocess.run([
        "ffmpeg", "-y",
        "-i", merged_video,
        "-i", voiceover_path,
        "-filter_complex",
        "[0:a]volume=0.2[vid_audio];"  # Scene audio at 20%
        "[1:a]volume=1.0[voiceover];"   # Voiceover at 100%
        "[vid_audio][voiceover]amix=inputs=2[audio]",
        "-map", "0:v",
        "-map", "[audio]",
        "-vf", "drawtext=text='@asphaltcowb0y':fontsize=32:fontcolor=white:borderw=3:bordercolor=black:x=W-tw-30:y=H-th-30",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "20",
        "-c:a", "aac",
        "-b:a", "192k",
        final_video
    ], check=True)

    print("✓ Voiceover and watermark added")
    print()

    return final_video

def main():
    """Main execution."""
    print("=" * 70)
    print("CINEMATIC B-ROLL NWSL VIDEO GENERATOR")
    print("=" * 70)
    print()
    print("Style: Documentary trailer (Nike/ESPN)")
    print("Duration: 60 seconds")
    print("Cost: ~$45")
    print("Timeline: ~20 minutes")
    print()

    # Create output directory
    subprocess.run(["mkdir", "-p", OUTPUT_DIR], check=True)

    # Step 1: Generate voiceover
    voiceover_path = generate_voiceover()

    # Step 2: Submit video generations
    print("=" * 70)
    print("STEP 2/5: SUBMITTING VIDEO GENERATION REQUESTS")
    print("=" * 70)
    print()

    operations = {}
    for scene_name, prompt in SCENES.items():
        operation = generate_video_scene(scene_name, prompt)
        if operation:
            operations[scene_name] = operation

    if not operations:
        print("❌ No videos were submitted successfully")
        return

    # Step 3 & 4: Wait and download
    video_files = wait_and_download_videos(operations)

    if len(video_files) < 4:
        print(f"⚠️ Warning: Only {len(video_files)}/4 videos downloaded")

    # Step 5: Merge everything
    final_video = merge_final_video(video_files, voiceover_path)

    # Done!
    print("=" * 70)
    print("✅ PRODUCTION COMPLETE!")
    print("=" * 70)
    print()
    print(f"Final video: {final_video}")
    print()
    print("File size:", end=" ")
    subprocess.run(["ls", "-lh", final_video])
    print()
    print("Ready to upload to X/Twitter!")
    print()
    print("Cost breakdown:")
    print("  • Voiceover: $0.03")
    print("  • 4 video scenes (60s total): $45.00")
    print("  • Total: $45.03")
    print()
    print("Budget remaining: $2,918.97 (of $3,000)")
    print()

if __name__ == "__main__":
    main()
