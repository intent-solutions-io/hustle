#!/usr/bin/env python3
"""
NWSL Policy Video Generator using Vertex AI Veo 3
Generates 5 hyper-realistic 8-second videos with @asphaltcowb0y watermark

Cost: $6 per video × 5 = $30 total
"""

import os
import time
from datetime import datetime
from google.cloud import aiplatform
from vertexai.preview.vision_models import VideoGenerationModel

# GCP Configuration
PROJECT_ID = os.getenv("GCP_PROJECT_ID", "TheCitadel2003")
LOCATION = os.getenv("GCP_LOCATION", "us-central1")
OUTPUT_DIR = "./000-docs/nwsl-videos"

# Video definitions with prompts
VIDEOS = [
    {
        "name": "01_the_loophole",
        "title": "The Loophole",
        "prompt": """Photorealistic 4K cinematic shot. Close-up of official NWSL policy document
on mahogany desk, dramatic side lighting through window blinds creating film noir shadows.
Camera slowly pushes in on highlighted text: 'transgender women may compete if testosterone
below 10 nmol/L'. Text glows red as camera zooms closer. Final 2 seconds: Bold white text
overlay appears bottom of frame: '10 nmol/L = MALE RANGE' with '@asphaltcowb0y' watermark
in bottom right corner, white text with subtle black outline. Serious, ominous, documentary
realism. Film grain, shallow depth of field, professional color grading. 8 seconds total.""",
        "description": "Exposes the policy allows biological males to compete"
    },
    {
        "name": "02_the_door",
        "title": "The Door",
        "prompt": """Hyper-realistic 4K shot. Women's soccer locker room, empty and pristine
with professional lighting. Camera slowly tracks toward door with sign 'WOMEN'S TEAM'. Door
is slightly ajar, golden light streaming through gap. Text overlay fades in at 3 seconds:
'CURRENT NWSL POLICY: DOOR IS OPEN' in white sans-serif font, centered. Camera pushes through
doorway at 5 seconds. Final frame at 7 seconds: Bold text 'TO BIOLOGICAL MALES' with
'@asphaltcowb0y' watermark bottom right corner in white with black outline. Dramatic, cinematic,
powerful symbolism. Professional lighting, film grain, shallow focus. 8 seconds total.""",
        "description": "Metaphor showing policy opens women's sports to males"
    },
    {
        "name": "03_one_voice",
        "title": "One Voice",
        "prompt": """Cinematic portrait style. Dramatic single spotlight illuminating empty chair
in otherwise dark room, suggesting courage of someone who stood alone. At 2 seconds, white text
appears: 'ONE PLAYER SPOKE UP'. Light intensifies at 3 seconds. At 4 seconds: 'SHE SAID:
WOMEN'S SPORTS = BIOLOGICAL WOMEN' in bold white text. Camera slowly orbits chair from 4-7 seconds.
Final frame at 7 seconds: 'HER TEAMMATES CALLED HER RACIST' with '@asphaltcowb0y' watermark
bottom right in white with black outline. Fade to black at 8 seconds. Emotional, powerful,
heroic tone. Film noir aesthetic, professional grade lighting. 8 seconds total.""",
        "description": "Defends Eddy as brave voice for women's sports"
    },
    {
        "name": "04_the_science",
        "title": "The Science",
        "prompt": """Photorealistic medical visualization. 3D rendered testosterone molecule
rotating slowly in dark space with scientific labels and atomic structure clearly visible.
At 2 seconds, white text overlay: 'TESTOSTERONE SUPPRESSION'. Molecule splits apart with
particle effects at 3 seconds. At 4 seconds, new text: 'REDUCES MALE ADVANTAGE BY ONLY 5%'.
At 5 seconds, medical graphics show side-by-side silhouettes comparing male vs female muscle
mass and bone density. Final frame at 7 seconds: Bold text 'BIOLOGY DOESN'T LIE' with
'@asphaltcowb0y' watermark bottom right in white with black outline. High-end medical
documentary style, BBC/National Geographic quality. 8 seconds total.""",
        "description": "Scientific evidence that hormone suppression doesn't eliminate male advantage"
    },
    {
        "name": "05_the_question",
        "title": "The Question",
        "prompt": """4K photorealistic aerial drone shot. Empty professional women's soccer
stadium at dusk with golden hour lighting casting long shadows. Slow cinematic descent from
high altitude toward center field from 0-4 seconds. At 4 seconds, large white text overlay
appears on grass surface: 'IF A BIOLOGICAL MALE COMPETES...' Camera continues smooth descent.
At 6 seconds, text updates: '...IS IT STILL WOMEN'S SPORTS?' Final frame at 7 seconds:
Freeze on empty goal with '@asphaltcowb0y' watermark in white with black outline, bottom right
corner. Hold for 1 second. Cinematic, thought-provoking, stunning aerial cinematography.
Professional color grading, 4K quality. 8 seconds total.""",
        "description": "Philosophical question challenging the integrity of women's sports category"
    }
]


def initialize_vertex_ai():
    """Initialize Vertex AI with project and location"""
    print(f"Initializing Vertex AI...")
    print(f"Project: {PROJECT_ID}")
    print(f"Location: {LOCATION}")

    aiplatform.init(project=PROJECT_ID, location=LOCATION)
    print("✓ Vertex AI initialized\n")


def generate_video(video_config: dict) -> str:
    """
    Generate a single video using Veo 3 model

    Args:
        video_config: Dictionary with name, title, prompt, description

    Returns:
        Path to generated video file
    """
    name = video_config["name"]
    title = video_config["title"]
    prompt = video_config["prompt"]
    description = video_config["description"]

    print(f"{'='*80}")
    print(f"Generating: {title}")
    print(f"Description: {description}")
    print(f"{'='*80}\n")

    try:
        # Initialize Veo 3 model
        model = VideoGenerationModel.from_pretrained("veo-3.0-generate")

        # Generate video with audio (8 seconds)
        print("Sending request to Veo 3...")
        response = model.generate_videos(
            prompt=prompt,
            number_of_videos=1,
            video_length_seconds=8,
            include_audio=True,
            aspect_ratio="16:9",  # Optimized for X/Twitter
            output_mime_type="video/mp4"
        )

        print("✓ Video generation complete")

        # Save video to file
        output_path = os.path.join(OUTPUT_DIR, f"{name}.mp4")

        # Veo returns video as bytes
        video_data = response.videos[0]
        with open(output_path, "wb") as f:
            f.write(video_data)

        print(f"✓ Video saved: {output_path}\n")

        return output_path

    except Exception as e:
        print(f"✗ Error generating video '{title}': {e}\n")
        return None


def main():
    """Main execution function"""
    start_time = time.time()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    print("\n" + "="*80)
    print("NWSL POLICY VIDEO GENERATOR - Vertex AI Veo 3")
    print("="*80)
    print(f"Timestamp: {timestamp}")
    print(f"Videos to generate: {len(VIDEOS)}")
    print(f"Total cost: ${len(VIDEOS) * 6} (${6} per video)")
    print(f"Output directory: {OUTPUT_DIR}")
    print("="*80 + "\n")

    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"✓ Output directory ready: {OUTPUT_DIR}\n")

    # Initialize Vertex AI
    initialize_vertex_ai()

    # Generate all videos
    results = []
    for i, video_config in enumerate(VIDEOS, 1):
        print(f"\n[{i}/{len(VIDEOS)}] Processing: {video_config['title']}")

        output_path = generate_video(video_config)

        results.append({
            "name": video_config["name"],
            "title": video_config["title"],
            "path": output_path,
            "success": output_path is not None
        })

        # Rate limiting: wait 5 seconds between requests
        if i < len(VIDEOS):
            print("Waiting 5 seconds before next generation...")
            time.sleep(5)

    # Summary
    elapsed = time.time() - start_time
    successful = sum(1 for r in results if r["success"])

    print("\n" + "="*80)
    print("GENERATION COMPLETE")
    print("="*80)
    print(f"Total videos generated: {successful}/{len(VIDEOS)}")
    print(f"Time elapsed: {elapsed:.1f} seconds")
    print(f"Cost: ${successful * 6}")
    print("\nGenerated videos:")

    for result in results:
        status = "✓" if result["success"] else "✗"
        path = result["path"] if result["success"] else "FAILED"
        print(f"  {status} {result['title']}: {path}")

    print("\n" + "="*80)
    print("Ready to upload to X/Twitter!")
    print("Watermark: @asphaltcowb0y on all videos")
    print("="*80 + "\n")


if __name__ == "__main__":
    main()
