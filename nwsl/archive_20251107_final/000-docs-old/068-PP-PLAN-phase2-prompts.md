# Phase 2: Advanced Prompt Implementations

**Goal:** Enhance the user experience by implementing more advanced, interactive, and multi-step prompts for each MCP server.

## `mcp-avtool-go`

*   **Prompt: `media-recipe`**
    *   **Description:** Guides the user through a multi-step media manipulation workflow.
    *   **Interaction Flow:**
        1.  Ask the user what they want to do (e.g., "add a voiceover to a video," "create a slideshow with music").
        2.  Based on the user's goal, ask for the necessary input files (as resource URIs).
        3.  Chain the required `avtool` commands to achieve the desired outcome.
        4.  Provide the final output file to the user.

## `mcp-imagen-go`

*   **Prompt: `style-guide`**
    *   **Description:** Helps the user generate images with a consistent style.
    *   **Interaction Flow:**
        1.  Ask the user for a base style (e.g., "photorealistic," "anime," "watercolor").
        2.  Store the style as a variable.
        3.  For subsequent user prompts, automatically prepend the style to the prompt before calling the `imagen_t2i` tool.

## `mcp-veo-go`

*   **Prompt: `storyboard`**
    *   **Description:** Helps the user create a sequence of video scenes.
    *   **Interaction Flow:**
        1.  Ask the user for a list of text prompts, one for each scene.
        2.  For each prompt, generate a video using the `veo_t2v` tool.
        3.  Offer to concatenate the generated videos into a single video using the `ffmpeg_concatenate_media_files` tool from `mcp-avtool-go`.

## `mcp-lyria-go`

*   **Prompt: `soundtrack`**
    *   **Description:** Generates music that matches a specific mood and duration.
    *   **Interaction Flow:**
        1.  Ask the user for a mood (e.g., "upbeat," "dramatic," "calm").
        2.  Ask the user for a duration (in seconds).
        3.  Construct a prompt for the `lyria_generate_music` tool that incorporates the mood and duration.
        4.  Generate the music and provide the output file to the user.
