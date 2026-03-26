#!/bin/bash
ACCESS_TOKEN=$(gcloud auth application-default print-access-token)
OPERATION="projects/pipelinepilot-prod/locations/us-central1/publishers/google/models/veo-3.0-generate-001/operations/1a530574-e9c8-4efc-a83f-6c46e2e9ed09"
curl -s -H "Authorization: Bearer $ACCESS_TOKEN" "https://us-central1-aiplatform.googleapis.com/v1/${OPERATION}" | jq '.done, .metadata.currentProgress'
