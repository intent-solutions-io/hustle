# Revised Plan: Imagen Editing Feature Implementation (with Prompts, Resources & Examples)

This document outlines the detailed plan to integrate Imagen's advanced editing capabilities into the `mcp-imagen-go` server.

## Guiding Principles & Architecture

*   **Model:** All new editing tools will use the `imagen-3.0-capability-001` model exclusively.
*   **User-Centric Prompts:** Each new editing capability will be wrapped in a simple, interactive prompt.
*   **Discoverability:** Key data, like segmentation classes, will be exposed as MCP resources.
*   **Input Handling:** Tools will accept both GCS URIs and local file paths. Local files will be transparently uploaded to a temporary GCS location for processing.
*   **Code Organization:** To ensure maintainability, all new editing-related logic, tools, and prompts will be housed in a new, dedicated file: `mcp-imagen-go/imagen-editing.go`.

## Architectural Change

1.  **New File:** A new file, `imagen-editing.go`, will be created within the `mcp-imagen-go` directory.
2.  **New Registration Function:** A function `registerImagenEditingTools(s *server.MCPServer, client *genai.Client)` will be created in `imagen-editing.go`. This function will be responsible for adding all the new editing tools and prompts to the MCP server.
3.  **Updated `main()`:** The `main()` function in `imagen.go` will be updated with a single call to `registerImagenEditingTools(s, genAIClient)` to keep it clean and delegate setup responsibility.

---

## **Phase 0: Prerequisite - Segmentation Class Resource**

**Goal:** Make the list of semantic segmentation classes available and discoverable.

*   **New Items:**
    *   **File:** `mcp-imagen-go/imagen-editing.go`
    *   **Global Variable:** `SegmentationClassMap map[string]int32`
    *   **Resource:** `imagen://segmentation_classes`

*   **Implementation:**
    1.  Create the new `imagen-editing.go` file.
    2.  Define the `SegmentationClassMap` global variable in the new file, populating it with all class names and IDs.
    3.  Create the `registerImagenEditingTools` function.
    4.  Within that function, add a resource handler for `imagen://segmentation_classes` that marshals the map to JSON.

---

## **Phase 1: Foundational Inpainting**

**Goal:** Implement core inpainting and removal, wrapped in a single, intelligent prompt.

*   **New Items:**
    *   **Tool:** `imagen_edit_inpainting_insert`
    *   **Tool:** `imagen_edit_inpainting_remove`
    *   **Prompt:** `edit_image_area`

*   **Implementation:**
    1.  Define the tools and the prompt within `registerImagenEditingTools`.
    2.  Create a unified `imagenEditHandler` in `imagen-editing.go`.
    3.  The handler will accept `segmentation_classes` as either string names or integer IDs and use the `SegmentationClassMap` for resolution.

*   **Go Implementation Examples:**
    *   **Inpainting Insert (Semantic):**
        ```go
        // Handler resolves "dog" to ID 8 from the map
        rawRefImg := &genai.RawReferenceImage{ ReferenceImage: &genai.Image{GCSURI: "gs://.../dog_image.png"}, ReferenceID: 0 }
        maskRefImg := &genai.MaskReferenceImage{
            ReferenceID: 1,
            Config: &genai.MaskReferenceConfig{
                MaskMode: "MASK_MODE_SEMANTIC",
                SegmentationClasses: []int32{8},
            },
        }
        response, err := client.Models.EditImage(ctx, "imagen-3.0-capability-001", "a golden retriever", []genai.ReferenceImage{rawRefImg, maskRefImg}, &genai.EditImageConfig{EditMode: "EDIT_MODE_INPAINT_INSERTION"})
        ```
    *   **Inpainting Remove:**
        ```go
        rawRefImg := &genai.RawReferenceImage{ ReferenceImage: &genai.Image{GCSURI: "gs://.../mirror_image.png"}, ReferenceID: 0 }
        maskRefImg := &genai.MaskReferenceImage{
            ReferenceID: 1,
            Config: &genai.MaskReferenceConfig{
                MaskMode: "MASK_MODE_SEMANTIC",
                SegmentationClasses: []int32{85}, // mirror
            },
        }
        response, err := client.Models.EditImage(ctx, "imagen-3.0-capability-001", "", []genai.ReferenceImage{rawRefImg, maskRefImg}, &genai.EditImageConfig{EditMode: "EDIT_MODE_INPAINT_REMOVAL"})
        ```

---

## **Phase 2: Background Swap and Outpainting**

**Goal:** Add tools and prompts for background replacement and image expansion.

*   **New Items:**
    *   **Tool:** `imagen_edit_bg_swap`
    *   **Tool:** `imagen_edit_outpainting`
    *   **Prompt:** `edit_background`
    *   **Prompt:** `expand_image`

*   **Implementation:** The `registerImagenEditingTools` and `imagenEditHandler` functions will be extended to support the new tools, prompts, and `edit_mode` values.

*   **Go Implementation Example (Background Swap):**
    ```go
    rawRefImg := &genai.RawReferenceImage{ ReferenceImage: &genai.Image{GCSURI: "gs://.../product.png"}, ReferenceID: 0 }
    maskRefImg := &genai.MaskReferenceImage{
        ReferenceID: 1,
        Config: &genai.MaskReferenceConfig{ MaskMode: "MASK_MODE_BACKGROUND" },
    }
    response, err := client.Models.EditImage(ctx, "imagen-3.0-capability-001", "a beautiful beach scene", []genai.ReferenceImage{rawRefImg, maskRefImg}, &genai.EditImageConfig{EditMode: "EDIT_MODE_BGSWAP"})
    ```

---

## **Phase 3: Mask-Free Editing**

**Goal:** Implement simple, prompt-only editing.

*   **New Items:**
    *   **Tool:** `imagen_edit_mask_free`
    *   **Prompt:** `edit_image_with_prompt`

*   **Implementation:** The `registerImagenEditingTools` and `imagenEditHandler` functions will be extended to support the new tool, prompt, and `EDIT_MODE_DEFAULT`.

*   **Go Implementation Example (Mask-Free Edit):**
    ```go
    rawRefImg := &genai.RawReferenceImage{ ReferenceImage: &genai.Image{GCSURI: "gs://.../latte.jpg"}, ReferenceID: 0 }
    response, err := client.Models.EditImage(ctx, "imagen-3.0-capability-001", "swan latte art", []genai.ReferenceImage{rawRefImg}, &genai.EditImageConfig{EditMode: "EDIT_MODE_DEFAULT"})
    ```

---

## **Phase 4: Image Segmentation with Vertex AI**

**Goal:** Add a powerful new capability to generate image masks by integrating with the Vertex AI Image Segmentation model.

*   **New Items:**
    *   **Tool:** `imagen_segment_image`
    *   **Prompt:** `create_mask_from_image`
    *   **SDK Client:** The `aiplatform.PredictionClient` will need to be initialized in `mcp-imagen-go/main.go` alongside the existing `genai.Client`.

*   **Implementation Details:**
    1.  **Initialize New Client:** In `imagen.go`, I will add the logic to create and initialize an `aiplatform.PredictionClient`, which is necessary for calling the segmentation model.
    2.  **Create New Handler:** A new handler function, `imagenSegmentImageHandler`, will be created in `imagen-editing.go`.
    3.  **Construct API Request:** This handler will:
        *   Accept an `image_uri` and a `prompt` (e.g., "the dog").
        *   Read the image data and Base64-encode it.
        *   Construct the JSON payload matching the structure you provided, using the `aiplatform.PredictionClient.Predict` method.
    4.  **Process Response:** The handler will parse the response from the segmentation API, which should contain the generated mask data (likely as a Base64-encoded string).
    5.  **Save and Return Mask:** The tool will save the returned mask as a new image file (e.g., to a temporary GCS location) and return the URI of the mask to the user. This URI can then be used in subsequent calls to the inpainting or outpainting tools.

*   **New Prompt: `create_mask_from_image`**
    *   **Description:** Interactively creates a segmentation mask for a part of an image.
    *   **Interaction Flow:**
        1.  Asks: "What image do you want to create a mask for?" (gets `image_uri`).
        2.  Asks: "What object in the image should I create a mask for?" (gets `prompt`).
        3.  Calls the new `imagen_segment_image` tool.
        4.  Returns the GCS URI of the newly created mask image.

---

## **Risk Mitigation and Testing**

*   **Isolation:** The new file structure further isolates new code, reducing the risk of regressions.
*   **Phased Rollout:** Features will be implemented and tested incrementally.
*   **Regression Tests:** After each phase, the `verify.sh` script will be run to ensure no regressions. New tests will be added to validate each new tool and prompt.