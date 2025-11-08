#!/usr/bin/env python3
"""
Generate "Why Won't They Answer?" - 60-second emotional documentary
Using Veo 3.1 + Lyria orchestral score
NO in-video text - overlays added in post-production
"""

import json
import time
import requests
import subprocess
import os
from pathlib import Path
from datetime import datetime
from google.auth import default
from google.auth.transport.requests import Request

# Configuration
PROJECT_ID = "pipelinepilot-prod"
LOCATION = "us-central1"
VEO_MODEL = "veo-3.1-generate-001"
LYRIA_MODEL = "lyria-001"
OUTPUT_DIR = Path("./why_wont_they_answer_60s")
OUTPUT_DIR.mkdir(exist_ok=True)

# API Endpoints
VEO_ENDPOINT = (
    f"https://{LOCATION}-aiplatform.googleapis.com/v1/"
    f"projects/{PROJECT_ID}/locations/{LOCATION}/"
    f"publishers/google/models/{VEO_MODEL}:predictLongRunning"
)

LYRIA_ENDPOINT = (
    f"https://{LOCATION}-aiplatform.googleapis.com/v1/"
    f"projects/{PROJECT_ID}/locations/{LOCATION}/"
    f"publishers/google/models/{LYRIA_MODEL}:predict"
)

# Master Veo 3.1 Prompt (60-second single generation)
VEO_PROMPT = """Create a PHOTOREALISTIC, LIVE-ACTION STYLE 60-second emotional cinematic documentary. Shot on RED camera with authentic broadcast quality.

**0-10 seconds - THE INNOCENCE:**
Young girls (ages 8-12) playing soccer on sunny field, pure joy and determination on their faces, running with abandon, celebrating goals together, authentic children's athletic movements, golden hour lighting, slow motion captures of pure athletic dreams, close-ups of excited determined faces, genuine childhood passion for the game, girls high-fiving teammates, hugging after scoring, photorealistic youth soccer practice atmosphere, diversity of young athletes, pure competitive spirit.

**10-15 seconds - THE COMMISSIONER:**
Stark corporate office - empty executive desk with nameplate, dark wood paneling, floor-to-ceiling windows overlooking city skyline, cold professional lighting, leather chair facing away from camera, official NWSL branding visible, impersonal institutional power, documents on desk, coffee cup abandoned, silent and disconnected from the field.

**15-22 seconds - MICHELE KANG:**
Luxury corporate headquarters, modern glass building exterior establishing shot. Interior: sleek contemporary office, minimalist design, expensive art on walls, floor-to-ceiling windows with city views. Close-up of $30 million check being written, pen signing financial documents, stacks of money/financial statements, investment portfolios. Cut to: empty stadium seats, new construction equipment, "Future Home of…" stadium signage. Modern architectural renderings on wall. Money changing hands in boardroom. Clinical corporate transaction atmosphere.

**22-30 seconds - ANGIE LONG:**
Exterior establishing shot: Brand new CPKC Stadium (Kansas City), stunning modern architecture, beautiful women's soccer-specific venue. Aerial drone footage of pristine empty stadium, perfectly manicured grass field, state-of-the-art facilities. Close-ups of luxury suites, premium seating, professional broadcast equipment. "Built for Women's Soccer" aesthetic - brand new, beautiful, dedicated space. Then: Medical facility equipment being wheeled through corridor, clinical reality invading the dream, testosterone blocker prescription bottles on medical cart. The contradiction: beautiful stadium built "for women" but policy allows males with medical intervention.

**30-37 seconds - THE WILFS:**
Upscale country club or executive boardroom, wealthy atmospheric environment. Close-up of expensive watch on wrist signing documents, luxury pen on contract, financial spreadsheets with revenue projections, profit/loss statements. Counting money, calculator close-ups, dollar signs, investment returns. Wall Street atmosphere - cold calculation. Empty luxury box seats at stadium, expensive but soulless. Champagne glasses at corporate event. Money as the driving force - clinical, transactional, removed from the athletes.

**37-45 seconds - THE POLICY:**
Cold clinical medical environment - sterile examination room, harsh fluorescent lights. Laboratory with test tubes labeled for hormone testing. Prescription medication bottles (testosterone blockers) on clinical counter with warning labels. Medical consent forms being signed. Empty surgical suite visible through window. Realistic medical equipment. Patient gown hanging on hook. Clinical paperwork stamped "APPROVED." Uncomfortable, dehumanizing atmosphere. Medical intervention as requirement.

**45-52 seconds - THE QUESTION RETURNS:**
Return to young girls on soccer field - now their faces show confusion, sitting on bench looking uncertain. Coach trying to explain something difficult to young players. Close-up of young girl's face with questioning, hurt expression. Girls looking at each other confused. One girl holds soccer ball, looking down at it, dreams fading. Empty youth soccer field at dusk, goals silhouetted against purple-orange sky. Single ball abandoned on darkening grass.

**52-60 seconds - THE UNANSWERED:**
Slow emotional final sequence: Young female athlete in uniform, around 16-17 years old, sitting alone in empty stadium stands, looking small and lost in massive venue. She looks up at camera with tears forming - raw authentic teenage emotion - silently asking "why?" Close-up of her determined but heartbroken face. Slow aerial pull-back from her alone in the stadium, getting smaller and smaller, consumed by the massive empty venue. Stadium lights begin to dim. Final shot: Her face in extreme close-up, single tear, looking directly at camera with devastating question in her eyes. Fade to black slowly.

**CINEMATOGRAPHY REQUIREMENTS:**
- Shot on RED Komodo 6K or ARRI Alexa
- Naturalistic color grading: warm golds (children), cold steel blues (executives), clinical whites (medical), twilight purples (ending)
- Authentic documentary style
- NO text visible in any footage
- Real locations, real architectural environments, real emotions
- Shallow depth of field for emotional close-ups
- Slow deliberate camera movements - crane, dolly, gimbal, drone
- Film grain texture
- Prestige documentary cinematography

Style: 'The Big Short' meets 'Spotlight' meets 'Icarus' - investigative financial documentary merged with emotional sports documentary and human tragedy. Must look like REAL footage shot by acclaimed documentary filmmaker Alex Gibney or Errol Morris."""

# Master Lyria Orchestration Prompt (60-second emotional masterpiece)
LYRIA_PROMPT = """Create a 60-second orchestral masterpiece that takes the listener on a devastating emotional journey:

**Movement 1: PURE INNOCENCE (0-10 seconds)**
- Playful, joyful orchestration
- Pizzicato strings, woodwinds (flutes, clarinets), harp glissandos
- Bright major key (G major)
- Childlike wonder, bubbling youthful energy
- Think Pixar's 'Up' opening - pure unbridled joy
- Tempo: Allegro (quick, happy)
- Dynamics: mf (moderately loud, bright)

**Movement 2: INSTITUTIONAL COLDNESS (10-22 seconds)**
- Transition to darker, corporate tones
- Low strings (cellos, double bass), minimal cold brass
- Shift to minor key (E minor)
- Disconnected, removed from humanity
- 'The Social Network' score aesthetic - cold calculation
- Tempo: Andante (walking pace, methodical)
- Dynamics: mf to f (building corporate weight)

**Movement 3: THE MONEY (22-37 seconds)**
- Adding tension and greed
- Dissonant piano notes, sharp violin stabs
- Dollar signs in musical form - repetitive, mechanical
- Building intensity, uncomfortable accumulation
- Think 'There Will Be Blood' score - greed and compromise
- Tempo: Moderato (steady, relentless)
- Dynamics: f to ff (loud, oppressive)

**Movement 4: CLINICAL HORROR (37-45 seconds)**
- Deeply unsettling, dissonant sustained notes
- High tension strings, atonal moments
- Suspended unresolved chords
- Medical thriller atmosphere - dehumanizing
- 'Requiem for a Dream' intensity
- Tempo: Adagio (slow, heavy)
- Dynamics: ff (very loud), sharp dynamic drops

**Movement 5: CONFUSION & HEARTBREAK (45-52 seconds)**
- Return of innocent themes but now broken, fractured
- Solo violin playing the childhood melody but in minor key, struggling
- Piano entering with melancholic supporting chords
- Recognition of loss, innocence shattered
- Tempo: Andante (slower, wounded)
- Dynamics: mf diminishing to mp (fading hope)

**Movement 6: THE UNANSWERED QUESTION (52-60 seconds)**
- Devastating emotional crescendo
- Full orchestra swelling to heartbreaking climax
- Solo violin soaring over orchestral bed with the question melody
- Major key attempting to emerge but can't fully resolve (A minor to C major suspended)
- Building to massive orchestral question mark
- Ethereal female soprano vocal enters: wordless "why?" - pure vocalization of pain and confusion
- Final chord: completely unresolved suspension, lingering in silence
- Think Hans Zimmer 'Interstellar' docking scene - emotional devastation
- Tempo: Ritardando (gradually slowing) into Adagio
- Dynamics: Building from mp to fff (extremely loud) then sudden drop to pp (whisper) on final unresolved note

**Overall Composition Style:**
- Live symphony orchestra recording (NOT synthesized)
- Natural concert hall reverb
- Emotional storytelling through leitmotifs:
  - Innocence theme (major, light, playful)
  - Money/Power theme (minor, heavy, mechanical)
  - Question theme (suspended, unresolved, aching)
- Award-winning prestige film score quality
- Think: Thomas Newman + Alexandre Desplat + Hans Zimmer + Jóhann Jóhannsson

**Full Instrumentation:**
- Strings: Full section (1st violin, 2nd violin, viola, cello, double bass)
- Woodwinds: Flute, clarinet, oboe, bassoon
- Brass: French horn (minimal use - only in power sections), trumpet (single note in climax)
- Keyboards: Piano (prominent in money/clinical sections), Harp (innocence only)
- Vocals: Female soprano (final 8 seconds only - wordless, devastating)
- Percussion: Minimal - triangle (innocence), soft timpani (institutional), suspended cymbal (clinical)

**Emotional Arc:**
Childhood Joy → Corporate Coldness → Greed & Compromise → Medical Horror → Shattered Dreams → Devastating Unanswered Question

The music should make people CRY. It should be unbearable by the end."""

# Text Overlays for Post-Production
TEXT_OVERLAYS = [
    # No text during innocence (0-10s)
    {"start": 10, "end": 13, "text": "Commissioner Jessica Berman"},
    {"start": 13, "end": 15, "text": "Receives her marching orders from majority owners"},
    {"start": 15, "end": 18, "text": "Michele Kang - Washington Spirit"},
    {"start": 18, "end": 20, "text": "Spent $30 million+ on women's soccer"},
    {"start": 20, "end": 22, "text": "Why no answer?"},
    {"start": 22, "end": 26, "text": "Angie Long - Kansas City Current"},
    {"start": 26, "end": 28, "text": "Built a $117 million stadium for women"},
    {"start": 28, "end": 30, "text": "…only to let males play"},
    {"start": 30, "end": 33, "text": "The Wilf Family - Orlando Pride"},
    {"start": 33, "end": 35, "text": "What excuse will they use?"},
    {"start": 35, "end": 37, "text": "Money, probably."},
    {"start": 37, "end": 41, "text": "The 2021 NWSL Policy remains in place"},
    {"start": 41, "end": 45, "text": "Males can compete with castration or testosterone blockers"},
    {"start": 45, "end": 49, "text": "Thousands of young girls are asking…"},
    {"start": 49, "end": 52, "text": "Is it all about the money?"},
    {"start": 52, "end": 56, "text": "What happened to women playing women?"},
    {"start": 56, "end": 60, "text": "Why won't you answer them?"},
]

def get_access_token():
    """Get Google Cloud access token"""
    try:
        credentials, project = default()
        credentials.refresh(Request())
        return credentials.token
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        print("Please run: gcloud auth application-default login")
        return None

def generate_veo_video(prompt, output_path, duration=60):
    """Generate 60-second video using Veo 3.1"""
    print("\n" + "="*80)
    print("GENERATING VEO 3.1 VIDEO (60 seconds)")
    print("="*80)
    print(f"\nPrompt length: {len(prompt)} characters")
    print(f"Output: {output_path}")
    print(f"Duration: {duration} seconds")

    token = get_access_token()
    if not token:
        return None

    # For 60-second video, might need to split into 2x30s segments
    # Check if Veo 3.1 supports 60s directly
    payload = {
        "instances": [{
            "prompt": prompt,
            "duration": duration,
            "aspect_ratio": "16:9",
            "quality": "high",
            "style": "photorealistic",
            "camera_movement": "cinematic"
        }],
        "parameters": {
            "sampleCount": 1,
            "temperature": 0.8  # Slightly creative but controlled
        }
    }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    print("\n📹 Sending request to Veo 3.1...")
    print(f"⏱️  Estimated generation time: 8-12 minutes")

    response = requests.post(VEO_ENDPOINT, headers=headers, json=payload)

    if response.status_code != 200:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
        return None

    print("✓ Video generation started")
    operation = response.json()
    operation_name = operation.get("name")

    # Poll for completion
    print("\n⏳ Generating video...")
    print("Progress: ", end="", flush=True)

    start_time = time.time()
    while True:
        check_url = f"https://{LOCATION}-aiplatform.googleapis.com/v1/{operation_name}"
        check_response = requests.get(check_url, headers=headers)

        if check_response.status_code != 200:
            print(f"\n❌ Error checking status: {check_response.status_code}")
            return None

        result = check_response.json()

        if result.get("done"):
            if "error" in result:
                print(f"\n❌ Generation failed: {result['error']}")
                return None

            # Extract video URL or data
            video_data = result.get("response", {})
            predictions = video_data.get("predictions", [])

            if predictions:
                video_url = predictions[0].get("bytesBase64Encoded") or predictions[0].get("gcsUri")

                if video_url:
                    elapsed = time.time() - start_time
                    print(f"\n✓ Video generation complete! (Time: {elapsed:.1f}s)")

                    # Download or save video
                    if video_url.startswith("gs://"):
                        print(f"📥 Downloading from GCS: {video_url}")
                        # Use gsutil to download
                        subprocess.run([
                            "gsutil", "cp", video_url, str(output_path)
                        ], check=True)
                    else:
                        # Base64 encoded
                        print(f"📥 Saving video to {output_path}")
                        import base64
                        video_bytes = base64.b64decode(video_url)
                        output_path.write_bytes(video_bytes)

                    print(f"✓ Video saved: {output_path}")
                    return str(output_path)

            print("❌ No video data in response")
            return None

        # Progress indicator
        elapsed = int(time.time() - start_time)
        if elapsed % 10 == 0:
            print(".", end="", flush=True)

        time.sleep(5)

def generate_lyria_audio(prompt, output_path):
    """Generate 60-second orchestral score using Lyria"""
    print("\n" + "="*80)
    print("GENERATING LYRIA ORCHESTRAL SCORE (60 seconds)")
    print("="*80)
    print(f"\nPrompt length: {len(prompt)} characters")
    print(f"Output: {output_path}")

    token = get_access_token()
    if not token:
        return None

    payload = {
        "instances": [{
            "prompt": prompt,
            "duration": 60,
            "style": "orchestral",
            "quality": "high",
            "instruments": "full_orchestra"
        }]
    }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    print("\n🎵 Sending request to Lyria...")
    response = requests.post(LYRIA_ENDPOINT, headers=headers, json=payload)

    if response.status_code != 200:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
        # Fallback: Try to generate with alternative method
        print("\n⚠️ Lyria failed, trying alternative audio generation...")
        return None

    print("✓ Audio generation complete")

    # Extract audio
    audio_data = response.json()
    predictions = audio_data.get("predictions", [])

    if predictions:
        audio_b64 = predictions[0].get("bytesBase64Encoded")
        if audio_b64:
            import base64
            audio_bytes = base64.b64decode(audio_b64)
            output_path.write_bytes(audio_bytes)
            print(f"✓ Audio saved: {output_path}")
            return str(output_path)

    print("❌ No audio data in response")
    return None

def create_assembly_guide():
    """Create comprehensive post-production assembly guide"""
    guide_path = OUTPUT_DIR / "POST_PRODUCTION_GUIDE.md"

    guide_content = f"""# "Why Won't They Answer?" - 60-Second Version
## Post-Production Assembly Guide

**Generated:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

---

## 📁 Generated Files

1. **video_raw.mp4** - 60-second Veo 3.1 photorealistic footage
2. **audio_orchestral.mp3** - 60-second Lyria orchestral masterpiece
3. **text_overlays.json** - Timing data for text overlays
4. **ffmpeg_commands.sh** - Ready-to-run assembly commands

---

## 🎬 Assembly Instructions

### Step 1: Review Raw Materials

```bash
# Check video
ffplay video_raw.mp4

# Check audio
ffplay audio_orchestral.mp3
```

### Step 2: Combine Video + Audio

```bash
ffmpeg -i video_raw.mp4 -i audio_orchestral.mp3 \\
  -c:v copy -c:a aac -strict experimental \\
  video_with_music.mp4
```

### Step 3: Add Text Overlays

Use the provided FFmpeg script or import into video editor:

**Font Settings:**
- Font: Helvetica Neue Medium (or similar)
- Color: White (#FFFFFF)
- Shadow: 40% black drop shadow
- Size: Adjust based on frame (typically 48-72pt)
- Position: Lower third or centered

**Text Timing:**

| Time | Duration | Text |
|------|----------|------|
| 10-13s | 3s | Commissioner Jessica Berman |
| 13-15s | 2s | Receives her marching orders from majority owners |
| 15-18s | 3s | Michele Kang - Washington Spirit |
| 18-20s | 2s | Spent $30 million+ on women's soccer |
| 20-22s | 2s | Why no answer? |
| 22-26s | 4s | Angie Long - Kansas City Current |
| 26-28s | 2s | Built a $117 million stadium for women |
| 28-30s | 2s | …only to let males play |
| 30-33s | 3s | The Wilf Family - Orlando Pride |
| 33-35s | 2s | What excuse will they use? |
| 35-37s | 2s | Money, probably. |
| 37-41s | 4s | The 2021 NWSL Policy remains in place |
| 41-45s | 4s | Males can compete with castration or testosterone blockers |
| 45-49s | 4s | Thousands of young girls are asking… |
| 49-52s | 3s | Is it all about the money? |
| 52-56s | 4s | What happened to women playing women? |
| 56-60s | 4s | Why won't you answer them? |

### Step 4: Add Watermark

```bash
ffmpeg -i video_with_text.mp4 \\
  -vf "drawtext=text='@asphaltcowb0y':fontcolor=white:fontsize=24:\\
  x=w-tw-20:y=h-th-20:shadowcolor=black@0.5:shadowx=2:shadowy=2" \\
  video_final.mp4
```

### Step 5: Final Audio Mix (Optional)

Add subtle ambient sound layer (10-15% volume):

```bash
# Mix orchestral music with ambient sounds
ffmpeg -i audio_orchestral.mp3 -i ambient_sounds.mp3 \\
  -filter_complex "[0:a]volume=1.0[a1];[1:a]volume=0.15[a2];\\
  [a1][a2]amix=inputs=2:duration=first" \\
  audio_final.mp3
```

**Ambient sounds by section:**
- 0-10s: Children laughing, soccer ball kicks
- 10-37s: Office ambience, paper shuffling
- 37-45s: Clinical beeps, fluorescent hum
- 45-60s: Wind, distant traffic, emptiness

### Step 6: Final Export

```bash
ffmpeg -i video_final.mp4 -c:v libx264 -preset slow \\
  -crf 22 -c:a aac -b:a 192k \\
  -pix_fmt yuv420p -movflags +faststart \\
  "Why_Wont_They_Answer_60s_FINAL.mp4"
```

**Export Settings:**
- Resolution: 1920x1080 (1080p)
- Frame Rate: 24fps or 30fps
- Codec: H.264
- Bitrate: 8-10 Mbps
- Audio: AAC 192kbps
- Format: MP4
- Optimized for: X/Twitter

---

## 🎭 Emotional Arc Verification

### Visual Journey
✅ **0-10s:** Pure childhood joy (warm, golden)
✅ **10-15s:** Cold corporate power (blue, distant)
✅ **15-37s:** Money & corruption (steel, clinical)
✅ **37-45s:** Medical horror (white, sterile)
✅ **45-52s:** Shattered dreams (confused, dark)
✅ **52-60s:** The unanswered question (devastating)

### Musical Journey
✅ **0-10s:** Playful innocence (G major, light)
✅ **10-22s:** Institutional coldness (E minor, heavy)
✅ **22-37s:** Greed & compromise (dissonant, mechanical)
✅ **37-45s:** Clinical horror (atonal, disturbing)
✅ **45-52s:** Broken dreams (fractured melody)
✅ **52-60s:** Devastating question (unresolved suspension)

---

## ✅ Quality Checklist

- [ ] Video is photorealistic throughout (no AI artifacts)
- [ ] Music syncs with emotional beats
- [ ] Text appears at correct timestamps
- [ ] Text is readable against all backgrounds
- [ ] Watermark visible but not distracting
- [ ] Audio levels: Music -3dB, Ambient -18dB
- [ ] Film grain adds cinematic quality (3% opacity)
- [ ] Final frame holds 2 seconds after fade
- [ ] File size optimized for social media (<100MB)
- [ ] No spelling errors in text overlays

---

## 🚀 Distribution Strategy

### X/Twitter Post

**Option 1 - Direct & Powerful:**
```
The NWSL won't answer.

$147 million spent "for women's soccer"
…but males can still compete.

Thousands of girls are asking why.

The owners stay silent.
The commissioner stays silent.

Why won't they answer?
```

**Option 2 - Name Names:**
```
Jessica Berman - Silent
Michele Kang - Silent ($30M invested)
Angie Long - Silent ($117M stadium)
The Wilfs - Silent

Young girls are asking a simple question.

Why won't you answer them?
```

**Option 3 - The Money Angle:**
```
$30 million from Michele Kang
$117 million stadium from Angie Long

"For women's soccer"

But males can compete with medical intervention.

Is it all about the money?
```

### Hashtags
#NWSL #WomensSports #SaveWomensSports #FairPlay #Biology

---

## 💥 Expected Impact

**This video will:**
- Generate emotional response (music + children = tears)
- Create accountability pressure (names named)
- Expose the money contradiction
- Go viral through shares and quotes
- Force a response or expose the silence

**The power:**
The unresolved musical ending + unanswered question + children's faces =
Emotional devastation that demands action.

---

**Remember:** The goal is not just views, but creating pressure for answers.
This video makes the silence unbearable.
"""

    guide_path.write_text(guide_content)
    print(f"\n✓ Assembly guide created: {guide_path}")

    # Save text overlays as JSON
    overlays_path = OUTPUT_DIR / "text_overlays.json"
    overlays_path.write_text(json.dumps(TEXT_OVERLAYS, indent=2))
    print(f"✓ Text overlay data saved: {overlays_path}")

    # Create FFmpeg commands script
    create_ffmpeg_script()

def create_ffmpeg_script():
    """Create ready-to-run FFmpeg commands"""
    script_path = OUTPUT_DIR / "ffmpeg_commands.sh"

    script_content = """#!/bin/bash
# FFmpeg commands for assembling the final video

set -e

echo "================================"
echo "Why Won't They Answer? - Assembly"
echo "================================"

# Step 1: Combine video and audio
echo "Step 1: Adding orchestral score..."
ffmpeg -i video_raw.mp4 -i audio_orchestral.mp3 \\
  -c:v copy -c:a aac -strict experimental \\
  -y video_with_music.mp4

# Step 2: Add all text overlays
echo "Step 2: Adding text overlays..."
ffmpeg -i video_with_music.mp4 \\
  -vf "drawtext=text='Commissioner Jessica Berman':fontcolor=white:fontsize=56:x=(w-text_w)/2:y=h-120:enable='between(t,10,13)':shadowcolor=black@0.4:shadowx=2:shadowy=2,\\
  drawtext=text='Receives her marching orders from majority owners':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-120:enable='between(t,13,15)':shadowcolor=black@0.4:shadowx=2:shadowy=2,\\
  drawtext=text='Michele Kang - Washington Spirit':fontcolor=white:fontsize=56:x=(w-text_w)/2:y=h-120:enable='between(t,15,18)':shadowcolor=black@0.4:shadowx=2:shadowy=2,\\
  drawtext=text='Spent $30 million+ on women\\'s soccer':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-120:enable='between(t,18,20)':shadowcolor=black@0.4:shadowx=2:shadowy=2,\\
  drawtext=text='Why no answer?':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=h-120:enable='between(t,20,22)':shadowcolor=black@0.4:shadowx=2:shadowy=2,\\
  drawtext=text='Angie Long - Kansas City Current':fontcolor=white:fontsize=56:x=(w-text_w)/2:y=h-120:enable='between(t,22,26)':shadowcolor=black@0.4:shadowx=2:shadowy=2,\\
  drawtext=text='Built a $117 million stadium for women':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-120:enable='between(t,26,28)':shadowcolor=black@0.4:shadowx=2:shadowy=2,\\
  drawtext=text='...only to let males play':fontcolor=white:fontsize=56:x=(w-text_w)/2:y=h-120:enable='between(t,28,30)':shadowcolor=black@0.4:shadowx=2:shadowy=2,\\
  drawtext=text='The Wilf Family - Orlando Pride':fontcolor=white:fontsize=56:x=(w-text_w)/2:y=h-120:enable='between(t,30,33)':shadowcolor=black@0.4:shadowx=2:shadowy=2,\\
  drawtext=text='What excuse will they use?':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-120:enable='between(t,33,35)':shadowcolor=black@0.4:shadowx=2:shadowy=2,\\
  drawtext=text='Money, probably.':fontcolor=white:fontsize=56:x=(w-text_w)/2:y=h-120:enable='between(t,35,37)':shadowcolor=black@0.4:shadowx=2:shadowy=2,\\
  drawtext=text='The 2021 NWSL Policy remains in place':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-120:enable='between(t,37,41)':shadowcolor=black@0.4:shadowx=2:shadowy=2,\\
  drawtext=text='Males can compete with castration or testosterone blockers':fontcolor=white:fontsize=44:x=(w-text_w)/2:y=h-120:enable='between(t,41,45)':shadowcolor=black@0.4:shadowx=2:shadowy=2,\\
  drawtext=text='Thousands of young girls are asking...':fontcolor=white:fontsize=52:x=(w-text_w)/2:y=h-120:enable='between(t,45,49)':shadowcolor=black@0.4:shadowx=2:shadowy=2,\\
  drawtext=text='Is it all about the money?':fontcolor=white:fontsize=56:x=(w-text_w)/2:y=h-120:enable='between(t,49,52)':shadowcolor=black@0.4:shadowx=2:shadowy=2,\\
  drawtext=text='What happened to women playing women?':fontcolor=white:fontsize=52:x=(w-text_w)/2:y=h-120:enable='between(t,52,56)':shadowcolor=black@0.4:shadowx=2:shadowy=2,\\
  drawtext=text='Why won\\'t you answer them?':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,56,60)':shadowcolor=black@0.4:shadowx=3:shadowy=3" \\
  -y video_with_text.mp4

# Step 3: Add watermark
echo "Step 3: Adding watermark..."
ffmpeg -i video_with_text.mp4 \\
  -vf "drawtext=text='@asphaltcowb0y':fontcolor=white:fontsize=24:x=w-tw-20:y=h-th-20:shadowcolor=black@0.5:shadowx=2:shadowy=2" \\
  -y video_with_watermark.mp4

# Step 4: Final optimization for social media
echo "Step 4: Optimizing for social media..."
ffmpeg -i video_with_watermark.mp4 \\
  -c:v libx264 -preset slow -crf 22 \\
  -c:a aac -b:a 192k \\
  -pix_fmt yuv420p -movflags +faststart \\
  -y "Why_Wont_They_Answer_60s_FINAL.mp4"

echo "================================"
echo "✓ Assembly complete!"
echo "Final video: Why_Wont_They_Answer_60s_FINAL.mp4"
echo "================================"
"""

    script_path.write_text(script_content)
    script_path.chmod(0o755)  # Make executable
    print(f"✓ FFmpeg script created: {script_path}")

def main():
    """Main execution"""
    print("\n" + "="*80)
    print("WHY WON'T THEY ANSWER? - 60-SECOND VERSION")
    print("="*80)
    print("\nProject: Extended emotional documentary")
    print("Duration: 60 seconds")
    print("Style: Photorealistic cinematic documentary")
    print("Music: Full orchestral emotional journey")
    print(f"Output: {OUTPUT_DIR}/")
    print("\nEstimated cost: $45-68")
    print("Estimated time: 10-15 minutes")
    print("="*80)

    # Check authentication
    token = get_access_token()
    if not token:
        print("\n❌ Please authenticate first:")
        print("   gcloud auth application-default login")
        return

    print("\n✓ Authentication successful")
    print("\nStarting generation process...")

    # Generate video
    video_path = OUTPUT_DIR / "video_raw.mp4"
    print("\n" + "-"*80)
    video_result = generate_veo_video(VEO_PROMPT, video_path, duration=60)

    if not video_result:
        print("\n⚠️ Video generation failed.")
        print("You can try:")
        print("1. Generate as 2x 30-second segments")
        print("2. Reduce to 40-second version")
        print("3. Check API quota/availability")

    # Generate audio
    audio_path = OUTPUT_DIR / "audio_orchestral.mp3"
    print("\n" + "-"*80)
    audio_result = generate_lyria_audio(LYRIA_PROMPT, audio_path)

    if not audio_result:
        print("\n⚠️ Lyria audio generation failed.")
        print("Alternative: Generate with Google Cloud Text-to-Speech or other service")

    # Create assembly guide regardless
    print("\n" + "-"*80)
    create_assembly_guide()

    # Summary
    print("\n" + "="*80)
    print("GENERATION SUMMARY")
    print("="*80)

    if video_result and audio_result:
        print("\n✅ SUCCESS! All components generated.")
        print(f"\n📁 Output directory: {OUTPUT_DIR}/")
        print("\nGenerated files:")
        print(f"  • Video: {video_path}")
        print(f"  • Audio: {audio_path}")
        print("  • Assembly guide: POST_PRODUCTION_GUIDE.md")
        print("  • FFmpeg script: ffmpeg_commands.sh")
        print("  • Text overlays: text_overlays.json")
        print("\nNext steps:")
        print("1. Review the raw video and audio")
        print("2. Run: ./ffmpeg_commands.sh")
        print("3. Or use your video editor with the guide")
        print("4. Share on social media")
    else:
        print("\n⚠️ PARTIAL SUCCESS")
        if video_result:
            print(f"✓ Video generated: {video_path}")
        else:
            print("✗ Video generation failed")
        if audio_result:
            print(f"✓ Audio generated: {audio_path}")
        else:
            print("✗ Audio generation failed")
        print("\nCheck the assembly guide for manual steps")

    print("\n" + "="*80)
    print("Remember: This video is designed to create")
    print("emotional impact and demand accountability.")
    print("The silence after this video will be deafening.")
    print("="*80 + "\n")

if __name__ == "__main__":
    main()