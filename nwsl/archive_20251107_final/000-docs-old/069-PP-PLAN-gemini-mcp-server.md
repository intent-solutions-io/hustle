# Plan: Create `mcp-gemini-go` MCP Server

This document outlines the plan to create a new MCP server, `mcp-gemini-go`, which will wrap the functionality of the existing Gemini image generation command-line tool.

## 1. Create Directory and Basic Files

- **Action:** Create a new directory named `mcp-gemini-go`.
- **Action:** Inside this new directory, create the following empty files:
    - `main.go`: The main entry point for the server.
    - `handlers.go`: To contain the logic for handling tool calls.
    - `go.mod`: To define the Go module and its dependencies.
    - `README.md`: A readme file for the new server.
    - `verify.sh`: A script to build and test the server.
    - `.gitignore`: To ignore build artifacts.

## 2. Adapt `main.go`

- **Template:** Use `mcp-imagen-go/imagen.go` as a reference for the structure.
- **Action:** Implement the `main` function to:
    - Initialize a new MCP server named "Gemini".
    - Define a new tool named `gemini_generate_content`. This name is chosen to reflect the multi-modal capabilities of the Gemini models.
    - The tool definition will include the following parameters:
        - `prompt` (string, required): The text prompt.
        - `model` (string, optional): The specific Gemini model to use (e.g., `gemini-1.5-pro-latest`).
        - `images` (string array, optional): A list of local file paths or GCS URIs for input images.
        - `output_directory` (string, optional): Local directory to save generated files.
        - `gcs_bucket_uri` (string, optional): GCS bucket to save generated files.
    - Register the `gemini_generate_content` tool and its handler with the server.
    - Start the server, supporting `stdio`, `sse`, and `http` transports.

## 3. Implement `handlers.go`

- **Action:** Create a `geminiGenerateContentHandler` function in `handlers.go`.
- **Action:** Adapt the logic from the existing `/Users/ghchinoy/genmedia/image-generation/main.go` to:
    - Parse the incoming `mcp.CallToolRequest` to extract the `prompt`, `images`, and other parameters.
    - Initialize the `google.golang.org/genai` client.
    - Construct the `genai.Content` parts, handling both text prompts and image inputs (from local files or GCS URIs).
    - Execute the `GenerateContent` call to the Gemini API.
    - Process the response:
        - If the response contains image data, save the images to the specified `output_directory` or upload them to the `gcs_bucket_uri`.
        - If the response contains text, include it in the result.
    - Return a `mcp.CallToolResult` containing the paths to the generated files, any text output, and a confirmation message.

## 4. Create `go.mod`

- **Action:** Initialize the `go.mod` file for the `mcp-gemini-go` module.
- **Action:** Add the necessary dependencies:
    - `github.com/mark3labs/mcp-go`
    - `google.golang.org/genai`
    - `github.com/GoogleCloudPlatform/vertex-ai-creative-studio/experiments/mcp-genmedia/mcp-genmedia-go/mcp-common` (as a local replacement)

## 5. Update `go.work`

- **Action:** Add the new `./mcp-gemini-go` directory to the `use` directive in the `go.work` file at the project root. This will include the new module in the multi-module workspace.

## 6. Create `verify.sh` and `README.md`

- **Action:** Create a `verify.sh` script that:
    - Builds the `mcp-gemini-go` binary.
    - Runs a basic `mcptools call tools` command to ensure the server starts and responds correctly.
- **Action:** Create a `README.md` file that:
    - Briefly describes the `mcp-gemini-go` server.
    - Documents the `gemini_generate_content` tool, its parameters, and provides an example usage command.
