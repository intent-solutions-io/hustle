#!/usr/bin/env python3
"""Generate 5 NWSL policy videos using Vertex AI Veo 3"""

import os
import json
from google.cloud import aiplatform
from vertexai.preview.vision_models import VideoGenerationModel

# Config
PROJECT_ID = "pipelinepilot-prod"
LOCATION = "us-central1"
OUTPUT_DIR = "./000-docs/nwsl-videos"

# Initialize
aiplatform.init(project=PROJECT_ID, location=LOCATION)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Video prompts
videos = [
    ("01_the_loophole", "Photorealistic 4K cinematic shot. Close-up of official NWSL policy document on mahogany desk, dramatic side lighting through window blinds creating film noir shadows. Camera slowly pushes in on highlighted text: 'transgender women may compete if testosterone below 10 nmol/L'. Text glows red as camera zooms closer. Final 2 seconds: Bold white text overlay appears bottom of frame: '10 nmol/L = MALE RANGE' with '@asphaltcowb0y' watermark in bottom right corner, white text with subtle black outline. Serious, ominous, documentary realism. Film grain, shallow depth of field, professional color grading. 8 seconds total."),

    ("02_the_door", "Hyper-realistic 4K shot. Women's soccer locker room, empty and pristine with professional lighting. Camera slowly tracks toward door with sign 'WOMEN'S TEAM'. Door is slightly ajar, golden light streaming through gap. Text overlay fades in at 3 seconds: 'CURRENT NWSL POLICY: DOOR IS OPEN' in white sans-serif font, centered. Camera pushes through doorway at 5 seconds. Final frame at 7 seconds: Bold text 'TO BIOLOGICAL MALES' with '@asphaltcowb0y' watermark bottom right corner in white with black outline. Dramatic, cinematic, powerful symbolism. Professional lighting, film grain, shallow focus. 8 seconds total."),

    ("03_one_voice", "Cinematic portrait style. Dramatic single spotlight illuminating empty chair in otherwise dark room, suggesting courage of someone who stood alone. At 2 seconds, white text appears: 'ONE PLAYER SPOKE UP'. Light intensifies at 3 seconds. At 4 seconds: 'SHE SAID: WOMEN'S SPORTS = BIOLOGICAL WOMEN' in bold white text. Camera slowly orbits chair from 4-7 seconds. Final frame at 7 seconds: 'HER TEAMMATES CALLED HER RACIST' with '@asphaltcowb0y' watermark bottom right in white with black outline. Fade to black at 8 seconds. Emotional, powerful, heroic tone. Film noir aesthetic, professional grade lighting. 8 seconds total."),

    ("04_the_science", "Photorealistic medical visualization. 3D rendered testosterone molecule rotating slowly in dark space with scientific labels and atomic structure clearly visible. At 2 seconds, white text overlay: 'TESTOSTERONE SUPPRESSION'. Molecule splits apart with particle effects at 3 seconds. At 4 seconds, new text: 'REDUCES MALE ADVANTAGE BY ONLY 5%'. At 5 seconds, medical graphics show side-by-side silhouettes comparing male vs female muscle mass and bone density. Final frame at 7 seconds: Bold text 'BIOLOGY DOESN'T LIE' with '@asphaltcowb0y' watermark bottom right in white with black outline. High-end medical documentary style, BBC/National Geographic quality. 8 seconds total."),

    ("05_the_question", "4K photorealistic aerial drone shot. Empty professional women's soccer stadium at dusk with golden hour lighting casting long shadows. Slow cinematic descent from high altitude toward center field from 0-4 seconds. At 4 seconds, large white text overlay appears on grass surface: 'IF A BIOLOGICAL MALE COMPETES...' Camera continues smooth descent. At 6 seconds, text updates: '...IS IT STILL WOMEN'S SPORTS?' Final frame at 7 seconds: Freeze on empty goal with '@asphaltcowb0y' watermark in white with black outline, bottom right corner. Hold for 1 second. Cinematic, thought-provoking, stunning aerial cinematography. Professional color grading, 4K quality. 8 seconds total.")
]

print("="*80)
print("NWSL VIDEO GENERATOR")
print("="*80)
print(f"Project: {PROJECT_ID}")
print(f"Output: {OUTPUT_DIR}")
print(f"Videos: 5 × $6 = $30")
print("="*80)

model = VideoGenerationModel.from_pretrained("veo-3.0-generate")

for i, (name, prompt) in enumerate(videos, 1):
    print(f"\n[{i}/5] {name}")
    try:
        response = model.generate_videos(
            prompt=prompt,
            number_of_videos=1,
            video_length_seconds=8,
            include_audio=True,
            aspect_ratio="16:9",
            output_mime_type="video/mp4"
        )

        output_path = f"{OUTPUT_DIR}/{name}.mp4"
        with open(output_path, "wb") as f:
            f.write(response.videos[0])

        print(f"✓ Saved: {output_path}")
    except Exception as e:
        print(f"✗ Error: {e}")

print("\n" + "="*80)
print("COMPLETE - Videos in 000-docs/nwsl-videos/")
print("="*80)
