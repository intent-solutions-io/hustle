#!/usr/bin/env python3
"""
Cloud Run proxy for Gemini API Veo 3.0 video generation.
Handles API key from Secret Manager and LRO polling.
"""

import os
import json
import time
import logging
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import httpx
from google.cloud import secretmanager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","message":"%(message)s"}',
    datefmt='%Y-%m-%dT%H:%M:%S'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Veo Proxy", version="1.0.0")

# Configuration
PROJECT_ID = os.environ.get("GCP_PROJECT_ID", "hustleapp-production")
SECRET_NAME = os.environ.get("API_KEY_SECRET", "gemini-api-key")
SECRET_VERSION = os.environ.get("API_KEY_VERSION", "latest")
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
MODEL_ID = "veo-3.0-generate-preview"  # Using 3.0 as specified
POLL_INTERVAL = 5  # seconds
MAX_WAIT_TIME = 1200  # 20 minutes

class GenerateRequest(BaseModel):
    segment: int = Field(..., ge=1, le=9, description="Segment number (1-9)")
    prompt: str = Field(..., min_length=10, description="Video generation prompt")
    negativePrompt: Optional[str] = Field(None, description="Negative prompt")
    aspectRatio: str = Field("16:9", description="Aspect ratio")
    resolution: str = Field("1080p", description="Resolution string")
    durationSeconds: int = Field(8, description="Duration in seconds")

class GenerateResponse(BaseModel):
    segment: int
    video_uri: str
    operation: str
    duration_seconds: int

def get_api_key() -> str:
    """Fetch API key from Secret Manager."""
    try:
        client = secretmanager.SecretManagerServiceClient()
        name = f"projects/{PROJECT_ID}/secrets/{SECRET_NAME}/versions/{SECRET_VERSION}"
        response = client.access_secret_version(request={"name": name})
        api_key = response.payload.data.decode("UTF-8").strip()
        logger.info(f"Successfully retrieved API key from {SECRET_NAME}")
        return api_key
    except Exception as e:
        logger.error(f"Failed to get API key: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve API key: {e}")

# Cache API key at startup
API_KEY = None

@app.on_event("startup")
async def startup_event():
    global API_KEY
    API_KEY = get_api_key()
    logger.info("Veo proxy service started")

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "service": "veo-proxy", "model": MODEL_ID}

@app.post("/generate", response_model=GenerateResponse)
async def generate_video(request: GenerateRequest):
    """Generate a video segment using Gemini API Veo 3.0."""

    logger.info(f"Generating segment {request.segment} with prompt length {len(request.prompt)}")

    # Build Veo request
    veo_request = {
        "instances": [{
            "prompt": request.prompt
        }],
        "parameters": {
            "aspectRatio": request.aspectRatio,
            "resolution": request.resolution,
            "durationSeconds": request.durationSeconds,
            "generateAudio": True,  # Allow native audio
            "sampleCount": 1
        }
    }

    if request.negativePrompt:
        veo_request["instances"][0]["negativePrompt"] = request.negativePrompt

    # Submit to Gemini API
    headers = {
        "x-goog-api-key": API_KEY,
        "Content-Type": "application/json"
    }

    submit_url = f"{GEMINI_BASE_URL}/models/{MODEL_ID}:predictLongRunning"

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # Submit generation request
            logger.info(f"Submitting to {submit_url}")
            response = await client.post(submit_url, json=veo_request, headers=headers)

            if response.status_code != 200:
                logger.error(f"Submit failed: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Veo submit failed: {response.text}"
                )

            submit_data = response.json()
            operation_name = submit_data.get("name")

            if not operation_name:
                raise HTTPException(status_code=500, detail="No operation name in response")

            logger.info(f"Operation started: {operation_name}")

            # Poll for completion
            poll_url = f"{GEMINI_BASE_URL}/operations/{operation_name.split('/')[-1]}"
            start_time = time.time()

            while time.time() - start_time < MAX_WAIT_TIME:
                await asyncio.sleep(POLL_INTERVAL)

                poll_response = await client.get(poll_url, headers=headers)

                if poll_response.status_code != 200:
                    logger.warning(f"Poll failed: {poll_response.status_code}")
                    continue

                poll_data = poll_response.json()

                if poll_data.get("done"):
                    if "error" in poll_data:
                        logger.error(f"Generation failed: {poll_data['error']}")
                        raise HTTPException(
                            status_code=500,
                            detail=f"Generation failed: {poll_data['error']}"
                        )

                    # Extract video URI from response
                    response_data = poll_data.get("response", {})
                    predictions = response_data.get("predictions", [])

                    if predictions and "videoUri" in predictions[0]:
                        video_uri = predictions[0]["videoUri"]
                        logger.info(f"Segment {request.segment} complete: {video_uri}")

                        return GenerateResponse(
                            segment=request.segment,
                            video_uri=video_uri,
                            operation=operation_name,
                            duration_seconds=request.durationSeconds
                        )
                    else:
                        raise HTTPException(
                            status_code=500,
                            detail="No video URI in response"
                        )

                # Log progress
                progress = poll_data.get("metadata", {}).get("progress", "unknown")
                logger.info(f"Operation {operation_name} progress: {progress}")

            # Timeout
            raise HTTPException(
                status_code=504,
                detail=f"Generation timed out after {MAX_WAIT_TIME} seconds"
            )

        except httpx.RequestError as e:
            logger.error(f"Request error: {e}")
            raise HTTPException(status_code=500, detail=f"Request failed: {e}")

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

# Add missing import
import asyncio

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))