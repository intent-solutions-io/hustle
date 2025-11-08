# Phase 1 Testing Commands

This document lists the commands used to test the prompt implementations for each MCP server in Phase 1.

## `mcp-chirp3-go`

*   **Build:** `go build` (in `mcp-chirp3-go` directory)
*   **List Prompts:** `echo '{"jsonrpc":"2.0","method":"prompts/list","id":1}' | ./mcp-chirp3-go/mcp-chirp3-go`
*   **Get Prompt (No Args):** `echo '{"jsonrpc":"2.0","method":"prompts/get","id":2,"params":{"name":"list-voices"}}' | ./mcp-chirp3-go/mcp-chirp3-go`
*   **Get Prompt (With Args):** `echo '{"jsonrpc":"2.0","method":"prompts/get","id":3,"params":{"name":"list-voices", "arguments": {"language": "en-US"}}}' | ./mcp-chirp3-go/mcp-chirp3-go`
*   **Read Resource:** `echo '{"jsonrpc":"2.0","method":"resources/read","id":4,"params":{"uri":"chirp://language_codes"}}' | ./mcp-chirp3-go/mcp-chirp3-go`
*   **Tool Regression:** `echo '{"jsonrpc":"2.0","method":"tools/call","id":5,"params":{"name":"list_chirp_voices","arguments":{"language":"en-US"}}}' | ./mcp-chirp3-go/mcp-chirp3-go`

## `mcp-imagen-go`

*   **Build:** `go build` (in `mcp-imagen-go` directory)
*   **List Prompts:** `export PROJECT_ID=genai-blackbelt-fishfooding && echo '{"jsonrpc":"2.0","method":"prompts/list","id":1}' | ./mcp-imagen-go/mcp-imagen-go`
*   **Get Prompt (No Args):** `export PROJECT_ID=genai-blackbelt-fishfooding && echo '{"jsonrpc":"2.0","method":"prompts/get","id":2,"params":{"name":"generate-image"}}' | ./mcp-imagen-go/mcp-imagen-go`
*   **Get Prompt (With Args):** `export PROJECT_ID=genai-blackbelt-fishfooding && echo '{"jsonrpc":"2.0","method":"prompts/get","id":3,"params":{"name":"generate-image", "arguments": {"prompt": "a photo of a cat"}}}' | ./mcp-imagen-go/mcp-imagen-go`

## `mcp-veo-go`

*   **Build:** `go build` (in `mcp-veo-go` directory)
*   **List Prompts:** `export PROJECT_ID=genai-blackbelt-fishfooding && echo '{"jsonrpc":"2.0","method":"prompts/list","id":1}' | ./mcp-veo-go/mcp-veo-go`
*   **Get Prompt (No Args):** `export PROJECT_ID=genai-blackbelt-fishfooding && echo '{"jsonrpc":"2.0","method":"prompts/get","id":2,"params":{"name":"generate-video"}}' | ./mcp-veo-go/mcp-veo-go`
*   **Get Prompt (With Args):** `export PROJECT_ID=genai-blackbelt-fishfooding && echo '{"jsonrpc":"2.0","method":"prompts/get","id":3,"params":{"name":"generate-video", "arguments": {"prompt": "a cat driving a car"}}}' | ./mcp-veo-go/mcp-veo-go`

## `mcp-lyria-go`

*   **Build:** `go build` (in `mcp-lyria-go` directory)
*   **List Prompts:** `export PROJECT_ID=genai-blackbelt-fishfooding && echo '{"jsonrpc":"2.0","method":"prompts/list","id":1}' | ./mcp-lyria-go/mcp-lyria-go`
*   **Get Prompt (No Args):** `export PROJECT_ID=genai-blackbelt-fishfooding && echo '{"jsonrpc":"2.0","method":"prompts/get","id":2,"params":{"name":"generate-music"}}' | ./mcp-lyria-go/mcp-lyria-go`
*   **Get Prompt (With Args):** `export PROJECT_ID=genai-blackbelt-fishfooding && echo '{"jsonrpc":"2.0","method":"prompts/get","id":3,"params":{"name":"generate-music", "arguments": {"prompt": "a happy upbeat song"}}}' | ./mcp-lyria-go/mcp-lyria-go`

## `mcp-avtool-go`

*   **Build:** `go build` (in `mcp-avtool-go` directory)
*   **List Prompts:** `export PROJECT_ID=genai-blackbelt-fishfooding && echo '{"jsonrpc":"2.0","method":"prompts/list","id":1}' | ./mcp-avtool-go/mcp-avtool-go`
*   **Get Prompt (No Args):** `export PROJECT_ID=genai-blackbelt-fishfooding && echo '{"jsonrpc":"2.0","method":"prompts/get","id":2,"params":{"name":"create-gif"}}' | ./mcp-avtool-go/mcp-avtool-go`
*   **Get Prompt (With Args):** `export PROJECT_ID=genai-blackbelt-fishfooding && echo '{"jsonrpc":"2.0","method":"prompts/get","id":3,"params":{"name":"create-gif", "arguments": {"input_video_uri": "/Users/ghchinoy/dev/github/vertex-ai-creative-studio/experiments/mcp-genmedia/mcp-genmedia-go/mcp-avtool-go/test.mp4"}}}' | ./mcp-avtool-go/mcp-avtool-go`
