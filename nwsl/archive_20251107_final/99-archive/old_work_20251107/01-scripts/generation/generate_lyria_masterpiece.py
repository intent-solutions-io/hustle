#!/usr/bin/env python3
"""
LYRIA ORCHESTRAL MASTERPIECE GENERATOR
60-Second Emotional Devastation Score
For "Why Won't They Answer?" Documentary
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
TIMESTAMP = datetime.now().strftime("%Y%m%d_%H%M%S")
OUTPUT_DIR = f"./LYRIA_MASTERPIECE_{TIMESTAMP}"

# Lyria API endpoint (if available) or fallback to audio generation
def get_access_token():
    """Get GCP access token"""
    result = subprocess.run(
        ["gcloud", "auth", "application-default", "print-access-token"],
        capture_output=True,
        text=True
    )
    return result.stdout.strip()

# The MASTER LYRIA PROMPT - 8 MOVEMENTS FOR 60 SECONDS
LYRIA_MASTER_PROMPT = """Create 60-second orchestral masterpiece for documentary "Why Won't They Answer?" about women's sports. Divided into 8 movements matching video segments:

**Movement 1: INNOCENCE (0-8s)**
Joyful playful major key (G major), pizzicato strings, flutes, harp, childlike wonder - Allegro, mf dynamics. Young girls playing soccer with pure joy and passion.

**Movement 2: COMMISSIONER (8-16s)**
Transition to cold minor (E minor), low cellos/bass, institutional coldness - Andante, mf to f. Empty corporate office, power without accountability.

**Movement 3: KANG MONEY (16-24s)**
Building tension, dissonant piano notes entering, corporate calculation - Moderato, f dynamics. $30 million investment questioning.

**Movement 4: LONG STADIUM (24-32s)**
Money theme intensifies, mechanical repetition, sharp violin stabs - Moderato, f to ff. $117 million stadium built for women.

**Movement 5: WILF GREED (32-40s)**
Greed theme peaks, dissonant and uncomfortable, oppressive - Moderato, ff dynamics. Wealth and profit over principles.

**Movement 6: MEDICAL POLICY (40-48s)**
Atonal horror, sustained dissonant strings, clinical terror - Adagio, ff with sharp drops. Medical interventions as policy.

**Movement 7: CONFUSION (48-56s)**
Childhood theme returns fractured in minor key, solo violin struggling, melancholic - Andante, mf to mp fading. Young girls asking why.

**Movement 8: UNANSWERED (56-60s - 4 SECONDS)**
DEVASTATING crescendo, full orchestra swelling, soprano vocal wordless "why?", unresolved suspended chord lingering - Ritardando to Adagio, mp building to fff then dropping to pp whisper. Final question: "Why won't you answer them?"

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

def generate_lyria_score():
    """Generate the orchestral masterpiece"""
    print("\n" + "="*70)
    print("   🎼 LYRIA ORCHESTRAL MASTERPIECE GENERATION")
    print("="*70)
    print("\n🎯 Creating 60-second emotional devastation score")
    print("🎵 6 movements of pure emotional journey")
    print("💔 Designed to make viewers cry")
    print("-"*70)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Save the prompt for reference
    with open(f"{OUTPUT_DIR}/lyria_prompt.txt", "w") as f:
        f.write(LYRIA_MASTER_PROMPT)

    print("\n📝 Master prompt saved: lyria_prompt.txt")

    # Note: Lyria API integration would go here
    # For now, we'll prepare the request structure

    print("\n🎼 Lyria Score Structure (8 Movements for 60 seconds):")
    print("• 0-8s: Movement 1 - Innocence (G major, joyful)")
    print("• 8-16s: Movement 2 - Commissioner (E minor, cold)")
    print("• 16-24s: Movement 3 - Kang Money ($30M, tension)")
    print("• 24-32s: Movement 4 - Long Stadium ($117M, mechanical)")
    print("• 32-40s: Movement 5 - Wilf Greed (dissonant peak)")
    print("• 40-48s: Movement 6 - Medical Policy (atonal horror)")
    print("• 48-56s: Movement 7 - Confusion (fractured innocence)")
    print("• 56-60s: Movement 8 - Unanswered (4s soprano 'why?')")

    # Create assembly script for when audio is ready
    create_assembly_script()

    return OUTPUT_DIR

def create_assembly_script():
    """Create script to assemble video with Lyria score"""
    script = f'''#!/bin/bash
# FINAL ASSEMBLY: Video + Lyria + Text Overlays
# Creates the emotional masterpiece

echo "🎬 ASSEMBLING EMOTIONAL MASTERPIECE"
echo "===================================="

# Merge all video clips
echo "🎥 Merging video clips..."
ffmpeg -i opening.mp4 -i ball.mp4 -i locker.mp4 -i cleats.mp4 \\
       -i field.mp4 -i tunnel.mp4 -i lights.mp4 \\
       -filter_complex "[0:v][1:v][2:v][3:v][4:v][5:v][6:v]concat=n=7:v=1[v]" \\
       -map "[v]" merged_video.mp4 -y

# Add Lyria orchestral score
echo "🎼 Adding Lyria orchestral masterpiece..."
ffmpeg -i merged_video.mp4 -i lyria_score.mp3 \\
       -c:v copy -c:a aac -shortest \\
       video_with_music.mp4 -y

# Add emotional text overlays
echo "📝 Adding devastating text overlays..."
ffmpeg -i video_with_music.mp4 \\
    -filter_complex "[0:v]
    drawtext=text='Commissioner Jessica Berman':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-150:enable='between(t,10,13)':shadowcolor=black@0.8:shadowx=3:shadowy=3,
    drawtext=text='Receives her marching orders from majority owners':fontcolor=white:fontsize=40:x=(w-text_w)/2:y=h-120:enable='between(t,13,15)':shadowcolor=black@0.8:shadowx=2:shadowy=2,
    drawtext=text='Michele Kang - Washington Spirit':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-150:enable='between(t,15,18)':shadowcolor=black@0.8:shadowx=3:shadowy=3,
    drawtext=text='Spent $30 million+ on women\\'s soccer':fontcolor=white:fontsize=44:x=(w-text_w)/2:y=h-120:enable='between(t,18,20)':shadowcolor=black@0.8:shadowx=2:shadowy=2,
    drawtext=text='Why no answer?':fontcolor=red:fontsize=56:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,20,22)':shadowcolor=black@0.9:shadowx=3:shadowy=3,
    drawtext=text='Angie Long - Kansas City Current':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-150:enable='between(t,22,26)':shadowcolor=black@0.8:shadowx=3:shadowy=3,
    drawtext=text='Built a $117 million stadium for women':fontcolor=white:fontsize=44:x=(w-text_w)/2:y=h-120:enable='between(t,26,28)':shadowcolor=black@0.8:shadowx=2:shadowy=2,
    drawtext=text='...only to let males play':fontcolor=red:fontsize=48:x=(w-text_w)/2:y=h-80:enable='between(t,28,30)':shadowcolor=black@0.9:shadowx=3:shadowy=3,
    drawtext=text='The Wilf Family - Orlando Pride':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-150:enable='between(t,30,33)':shadowcolor=black@0.8:shadowx=3:shadowy=3,
    drawtext=text='What excuse will they use?':fontcolor=white:fontsize=44:x=(w-text_w)/2:y=h-120:enable='between(t,33,35)':shadowcolor=black@0.8:shadowx=2:shadowy=2,
    drawtext=text='Money, probably.':fontcolor=yellow:fontsize=52:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,35,37)':shadowcolor=black@0.9:shadowx=3:shadowy=3,
    drawtext=text='The 2021 NWSL Policy remains in place':fontcolor=white:fontsize=44:x=(w-text_w)/2:y=h-120:enable='between(t,37,41)':shadowcolor=black@0.8:shadowx=2:shadowy=2,
    drawtext=text='Males can compete with castration or testosterone blockers':fontcolor=red:fontsize=40:x=(w-text_w)/2:y=h-100:enable='between(t,41,45)':shadowcolor=black@0.8:shadowx=2:shadowy=2,
    drawtext=text='Thousands of young girls are asking...':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,45,49)':shadowcolor=black@0.8:shadowx=3:shadowy=3,
    drawtext=text='Is it all about the money?':fontcolor=yellow:fontsize=52:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,49,52)':shadowcolor=black@0.9:shadowx=3:shadowy=3,
    drawtext=text='What happened to women playing women?':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,52,56)':shadowcolor=black@0.8:shadowx=3:shadowy=3,
    drawtext=text='Why won\\'t you answer them?':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,56,60)':shadowcolor=black@0.9:shadowx=4:shadowy=4,
    drawtext=text='@asphaltcowb0y':fontcolor=white:fontsize=28:x=w-tw-25:y=h-th-25:shadowcolor=black@0.7:shadowx=2:shadowy=2,
    drawtext=text='#StopTheInsanity':fontcolor=white:fontsize=36:x=25:y=h-th-25:enable='between(t,56,60)':shadowcolor=black@0.7:shadowx=2:shadowy=2
    [v]" \\
    -map "[v]" -map 0:a -c:v libx264 -crf 19 -c:a copy \\
    EMOTIONAL_MASTERPIECE_FINAL.mp4 -y

echo ""
echo "✅ EMOTIONAL MASTERPIECE COMPLETE!"
echo "📹 Final: EMOTIONAL_MASTERPIECE_FINAL.mp4"
echo "⏱️ Duration: 60 seconds"
echo "🎼 Music: Lyria orchestral devastation"
echo "📝 Text: All devastating callouts included"
echo "#️⃣ #StopTheInsanity"
echo "✍️ @asphaltcowb0y"
'''

    script_path = f"{OUTPUT_DIR}/assemble_masterpiece.sh"
    with open(script_path, "w") as f:
        f.write(script)
    os.chmod(script_path, 0o755)

    print(f"\n📜 Assembly script created: {script_path}")

if __name__ == "__main__":
    print("\n🎼 INITIATING LYRIA ORCHESTRAL MASTERPIECE")
    print("This will create the emotional score that makes people cry")

    output_dir = generate_lyria_score()

    print("\n" + "="*70)
    print("✅ LYRIA PREPARATION COMPLETE!")
    print("="*70)
    print("\n📊 Next Steps:")
    print("1. Generate Lyria orchestral score using the prompt")
    print("2. Merge all video clips")
    print("3. Add Lyria music")
    print("4. Add devastating text overlays")
    print("5. Create final emotional masterpiece")
    print(f"\nOutput: {output_dir}")
    print("\nThis will be SHARED. People will FEEL it.")
    print("The music + children + money angle + unanswered question = VIRAL")