# MCP Servers for Google Cloud Genmedia APIs

This repository provides Model Context Protocol (MCP) servers that enable AI agents and applications to easily integrate and leverage Google Cloud's powerful generative media APIs (Imagen, Veo, Chirp, Lyria) and advanced audio/video compositing capabilities (AVTool).

Each server can be enabled and run separately, allowing flexibility for environments that don't require all capabilities.

## Generative Media & Compositing Capabilities

*   **[Gemini 2.5 Flash multimodal output](https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-flash#image)** - for image generation and editing
*   **[Imagen 3](https://cloud.google.com/vertex-ai/generative-ai/docs/image/overview)** - for image generation and editing
*   **[Veo 2](https://cloud.google.com/vertex-ai/generative-ai/docs/video/generate-videos)** - for video creation
*   **[Chirp 3 HD](https://cloud.google.com/text-to-speech/docs/chirp3-hd)** - for audio synthesis
*   **[Lyria](https://cloud.google.com/vertex-ai/generative-ai/docs/music/generate-music)** - for music generation
*   **AVTool** - for audio/video compositing and manipulation

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/GoogleCloudPlatform/vertex-ai-creative-studio.git
    cd vertex-ai-creative-studio/experiments/mcp-genmedia
    ```
2.  **Install MCP Servers:** For detailed installation instructions, including an easy-to-use installer script, please refer to the [Go Implementations README](./mcp-genmedia-go/README.md).

## Running the Servers

The MCP servers can be run using different transport protocols. The default is `stdio`.

To start a server in Streamable HTTP mode, use the `--transport http` flag:
```bash
mcp-imagen-go --transport http
```

## Configuration

The servers are configured primarily through environment variables. Key variables include:

*   `PROJECT_ID`: Your Google Cloud project ID.
*   `LOCATION`: The Google Cloud region for the APIs (e.g., `us-central1`).
*   `PORT`: The port for the HTTP server (e.g., `8080`).
*   `GENMEDIA_BUCKET`: The Google Cloud Storage bucket for media assets.

## Available MCP Servers and Capabilities

*   **Gemini** Generate and edit images from text prompts.
*   **Imagen:** Generate and edit images from text prompts.
*   **Veo:** Create videos from text or images.
*   **Chirp 3 HD:** Synthesize high-quality audio from text.
*   **Lyria:** Generate music from text prompts.
*   **AVTool:** Perform audio/video compositing and manipulation (e.g., combining, concatenating, format conversion).

For a detailed list of tools provided by each server, refer to the [Go Implementations README](./mcp-genmedia-go/README.md).

## Authentication

The servers use Google's Application Default Credentials (ADC). Ensure you have authenticated by one of the following methods:

1.  Set up ADC: `gcloud auth application-default login`
2.  Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the path of your service account key file.

You may also need to grant your user or service account access to the Google Cloud Storage bucket:
```bash
gcloud storage buckets add-iam-policy-binding gs://BUCKET_NAME \
  --member=user:user@email.com \
  --role=roles/storage.objectUser
```

## Client Configurations

The MCP servers can be used with various clients and hosts. A sample MCP configuration JSON can be found at [genmedia-config.json](./sample-agents/mcp-inspector/genmedia-config.json).

This repository provides AI application samples for:

* [geminicli](./sample-agents/geminicli/)
* [Google ADK (Agent Development Kit)](./sample-agents/adk/README.md)
* [Google Firebase Genkit](./sample-agents/genkit/README.md)

## Development and Contribution

For those interested in extending the existing servers or creating new ones, the `mcp-genmedia-go` directory contains a more detailed `README.md` with information on the architecture and development process. Please refer to the [mcp-genmedia-go/README.md](./mcp-genmedia-go/README.md) for more information.

## License

Apache 2.0

## Disclaimer

This is not an officially supported Google product.