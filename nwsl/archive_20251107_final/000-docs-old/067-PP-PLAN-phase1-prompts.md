# Revised and Expanded Phase 1 Plan: MCP Prompt Implementation

**Status: Complete**

This document outlines the detailed plan for Phase 1 of implementing prompt support in the MCP servers. The goal of this phase was to add a primary, functional prompt to each MCP server that wraps its core tool.

## High-Level Goal

The primary goal was to eliminate the `prompts not supported` error by implementing a useful, tool-wrapping prompt in each MCP server.

## Analysis of MCP Prompt Principles

Based on the [MCP specification](https://modelcontextprotocol.io/specification/2025-06-18/server/prompts), the following core principles were followed:

*   **Discoverability & Clarity:** Prompts are listed with clear descriptions and arguments.
*   **User Control & Composition:** Prompts empower users to guide the model and are composable with other resources.
*   **Role-Based Interaction:** The conversation flow uses clear `user` and `assistant` roles.
*   **Security:** All arguments are treated as untrusted input and validated.
*   **Multi-modality:** Prompts are designed to handle multi-modal content where applicable.

---

## **Phase 1 Implementation**

### **1. `mcp-chirp3-go` (Voice Synthesis)**

*   **Prompt: `list-voices`**
    *   **Description:** Lists available Chirp3-HD voices, with an option to filter by language.
    *   **Arguments:** `language` (optional).
*   **Resource: `chirp://language_codes`**
    *   **Description:** Provides a JSON list of supported languages and their BCP-47 codes.

### **2. `mcp-imagen-go` (Image Generation)**

*   **Prompt: `generate-image`**
    *   **Description:** Wraps the `imagen_t2i` tool to generate an image from a text prompt.
    *   **Arguments:** `prompt` (required), `model` (optional), `num_images` (optional), `aspect_ratio` (optional).

### **3. `mcp-veo-go` (Video Generation)**

*   **Prompt: `generate-video`**
    *   **Description:** Wraps the `veo_t2v` tool to generate a video from a text prompt.
    *   **Arguments:** `prompt` (required), `duration` (optional), `aspect_ratio` (optional), `model` (optional).

### **4. `mcp-lyria-go` (Music Generation)**

*   **Prompt: `generate-music`**
    *   **Description:** Wraps the `lyria_generate_music` tool.
    *   **Arguments:** `prompt` (required), `negative_prompt` (optional).

### **5. `mcp-avtool-go` (Media Manipulation)**

*   **Prompt: `create-gif`**
    *   **Description:** Wraps the `ffmpeg_video_to_gif` tool.
    *   **Arguments:** `input_video_uri` (required), `fps` (optional), `scale_width_factor` (optional).
