FROM python:3.11-slim

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir google-cloud-storage flask gunicorn

WORKDIR /app
COPY merger.py .

CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 600 merger:app
