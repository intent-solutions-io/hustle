# Test Plan: Imagen Editing Functional Verification

This document outlines the plan for functionally testing the new Imagen editing capabilities in the `mcp-imagen-go` server. This goes beyond the basic liveness checks of `verify.sh` to ensure each editing tool works as expected.

## Guiding Principle: Generate-Then-Edit Workflow

The core testing strategy is to mimic a real user workflow:

1.  **Generate a Base Image:** Use the standard `imagen_t2i` tool to create a new image from a text prompt.
2.  **Capture the Output:** Parse the GCS URI of the newly created image from the tool's output.
3.  **Manipulate the Image:** Use the captured URI as an input for one of the new editing tools (`imagen_edit_inpainting_insert`, `imagen_edit_inpainting_remove`, etc.).
4.  **Verify Success:** A test passes if the editing tool call completes successfully (exit code 0) and returns a URI for the new, edited image.

This approach validates the entire toolchain, from initial generation to final manipulation, ensuring all components work together correctly.

## Implementation: `test_editing.sh`

A new test script, `test_editing.sh`, will be created in the `mcp-imagen-go/` directory. This script will serve as the foundation for all functional tests related to Imagen editing.

### Script Workflow Example (Phase 1 - Inpainting Remove)

The script will contain a series of steps for each feature. For example, testing the `inpainting_remove` tool will involve:

```bash
#!/bin/bash

set -e

# Ensure PROJECT_ID is set
if [ -z "$PROJECT_ID" ]; then
  echo "Error: PROJECT_ID environment variable is not set." >&2
  exit 1
fi

# Step 1: Generate a base image and capture its GCS URI
echo "INFO: Generating base image for testing..."
GEN_RESULT=$(mcptools call imagen_t2i --params '{"prompt": "a golden retriever sitting on a green couch"}' ./mcp-imagen-go)
IMAGE_URI=$(echo "$GEN_RESULT" | grep -o 'gs://[^"]*' | head -n 1)

if [ -z "$IMAGE_URI" ]; then
  echo "ERROR: Failed to generate base image or parse GCS URI." >&2
  echo "Full generation result: $GEN_RESULT" >&2
  exit 1
fi
echo "INFO: Base image created at: $IMAGE_URI"

# Step 2: Call the editing tool to remove the dog
echo "INFO: Calling inpainting_remove to remove the dog..."
EDIT_PARAMS=$(printf '{"image_uri": "%s", "mask_mode": "MASK_MODE_SEMANTIC", "segmentation_classes": ["dog"]}' "$IMAGE_URI")
EDIT_RESULT=$(mcptools call imagen_edit_inpainting_remove --params "$EDIT_PARAMS" ./mcp-imagen-go)

# Step 3: Verify the edit was successful
if [ $? -eq 0 ]; then
  echo "SUCCESS: Inpainting remove tool executed successfully."
  echo "INFO: Edit result: $EDIT_RESULT"
else
  echo "ERROR: Inpainting remove tool failed." >&2
  exit 1
fi

# --- Additional test cases for other features will be added below --- #
```

### Extensibility for Future Phases

This script is designed to be extensible. As we complete subsequent phases of the `imagen_editing_plan.md`, new test cases will be added to `test_editing.sh` for:

*   **Phase 2:** `imagen_edit_bg_swap`, `imagen_edit_outpainting`
*   **Phase 3:** `imagen_edit_mask_free`
*   **Phase 4:** `imagen_segment_image`

This will create a comprehensive, automated regression suite for all Imagen editing functionality.
