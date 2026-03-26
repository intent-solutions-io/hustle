"""
Cloud Run Video Merger Service
Auto-merges Veo clips + adds watermark
"""

import os
import subprocess
from flask import Flask, request, jsonify
from google.cloud import storage

app = Flask(__name__)
storage_client = storage.Client()

@app.route('/merge', methods=['POST'])
def merge_videos():
    """Merge multiple video clips from GCS and add watermark"""

    data = request.json
    bucket_name = data.get('bucket', 'pipelinepilot-prod-veo-videos')
    scenes = data.get('scenes', ['scene1_celebration', 'scene2_policy', 'scene3_isolation', 'scene4_stadium'])
    output_name = data.get('output', 'nwsl_final_32s.mp4')
    watermark_text = data.get('watermark', '@asphaltcowb0y')

    try:
        # Download clips from GCS
        print("Downloading clips from Cloud Storage...")
        bucket = storage_client.bucket(bucket_name)
        downloaded_files = []

        for i, scene in enumerate(scenes):
            # Find the generated video in the scene folder
            blobs = list(bucket.list_blobs(prefix=f"{scene}/"))
            video_blob = [b for b in blobs if b.name.endswith('.mp4')][0]

            local_file = f"/tmp/scene{i+1}.mp4"
            video_blob.download_to_filename(local_file)
            downloaded_files.append(local_file)
            print(f"✓ Downloaded: {video_blob.name}")

        # Create FFmpeg concat file
        concat_file = "/tmp/concat.txt"
        with open(concat_file, 'w') as f:
            for file in downloaded_files:
                f.write(f"file '{file}'\n")

        # Merge videos + add watermark
        print("Merging videos and adding watermark...")
        output_file = f"/tmp/{output_name}"

        cmd = [
            'ffmpeg', '-y',
            '-f', 'concat',
            '-safe', '0',
            '-i', concat_file,
            '-vf', f"drawtext=text='{watermark_text}':fontsize=24:fontcolor=white:borderw=2:bordercolor=black:x=W-tw-20:y=H-th-20",
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '22',
            '-c:a', 'aac',
            output_file
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            return jsonify({'error': 'FFmpeg failed', 'details': result.stderr}), 500

        print("✓ Video merged successfully")

        # Upload final video to GCS
        print("Uploading final video to Cloud Storage...")
        final_blob = bucket.blob(f"final/{output_name}")
        final_blob.upload_from_filename(output_file)
        final_url = f"gs://{bucket_name}/final/{output_name}"

        print(f"✓ Uploaded: {final_url}")

        # Cleanup
        for file in downloaded_files + [concat_file, output_file]:
            if os.path.exists(file):
                os.remove(file)

        return jsonify({
            'success': True,
            'output_url': final_url,
            'public_url': final_blob.public_url,
            'duration_seconds': len(scenes) * 8
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
