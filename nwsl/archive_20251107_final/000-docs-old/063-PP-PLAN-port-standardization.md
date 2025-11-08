# Plan: Standardize Port Configuration and Add Gemini HTTP Support

This document outlines the plan to standardize network port configuration across all MCP (Media Control Protocol) servers and to add HTTP transport support to the `mcp-gemini-go` server.

## 1. Problem Statement

Currently, there is an inconsistency in how network ports are defined and used across the various MCP servers:

-   **HTTP Transport:** `avtool`, `chirp3`, `imagen`, `lyria`, and `veo` use the `PORT` environment variable, defaulting to `8080`. There is no command-line flag to override this.
-   **SSE Transport:** `avtool`, `imagen`, `lyria`, and `veo` hardcode the SSE port to `8081`. `chirp3` uses a `-p`/`--port` flag that defaults to `8080` but is changed to `8081` to avoid conflicts. This is confusing and inconsistent.
-   **Gemini Server:** `mcp-gemini-go` only supports the `stdio` transport, limiting its integration possibilities.

This inconsistency makes the servers harder to configure, deploy, and manage, especially in containerized environments or when running multiple servers on the same host.

## 2. Proposed Solution

To resolve these issues, I will implement the following changes:

### 2.1. Standardize Port Configuration for All Servers

For each of the existing HTTP/SSE-capable servers (`avtool`, `chirp3`, `imagen`, `lyria`, `veo`), I will refactor the `main` function in their respective Go files (`avtool.go`, `chirp3.go`, etc.).

The new, standardized logic for determining the listening port will be as follows:

1.  **Unified Flag:** A single `--port` (and `-p`) integer flag will be used to specify the port from the command line.
2.  **Environment Variable Fallback:** If the `--port` flag is not provided, the server will attempt to use the `PORT` environment variable.
3.  **Transport-Specific Defaults:**
    *   If neither the flag nor the environment variable is set, the port will default to **`8080`** for the **`http`** transport.
    *   If neither is set, the port will default to **`8081`** for the **`sse`** transport.
4.  **Precedence:** The order of precedence for port configuration will be:
    1.  `--port` command-line flag
    2.  `PORT` environment variable
    3.  Transport-specific default (`8080` for HTTP, `8081` for SSE)

This change ensures that `http` and `sse` can run simultaneously without port conflicts by default, while still allowing full configuration flexibility.

### 2.2. Add HTTP Support to Gemini Server

I will modify `experiments/mcp-genmedia/mcp-genmedia-go/mcp-gemini-go/main.go` to add full HTTP transport support.

1.  **Add HTTP Transport Case:** A new `case "http":` will be added to the `switch transport` statement.
2.  **Implement Port Logic:** The same standardized port configuration logic described in section 2.1 will be implemented for the Gemini server.
3.  **Unify Flags:** The command-line flag definitions in `mcp-gemini-go` will be updated to match the other servers for consistency (i.e., ensuring both short `-p` and long `--port` versions are present and documented identically).

## 3. Testing Plan

To ensure the changes are working correctly and have not introduced regressions, I will perform the following tests for **each modified server** (`avtool`, `chirp3`, `imagen`, `lyria`, `veo`, and `gemini`).

### 3.1. Unit & Build Verification

1.  **Build:** Run `go build` within each server's directory to ensure the code compiles successfully.
2.  **Lint:** Run `golangci-lint run` (if available) to check for style issues.
3.  **Verify Script:** Execute the `verify.sh` script in each server's directory. This provides a basic liveness check to confirm the server can start and respond to a basic `mcptools tools` command.

### 3.2. Manual Functional Testing

For each server, I will manually execute a series of tests using the compiled binary and `mcptools`.

**Test Environment Setup:**
-   `PROJECT_ID` environment variable will be set.
-   `GENMEDIA_BUCKET` environment variable will be set (if required by the server).
-   Tests will be run from the `/usr/local/google/home/emmanuelawa/repos/vertex-ai-creative-studio/experiments/mcp-genmedia/mcp-genmedia-go/` directory.

**Test Cases (to be run for each server):**

1.  **Default HTTP Port:**
    *   **Command:** `./<server-binary> -transport http &`
    *   **Verification:**
        *   Check server logs to confirm it starts on the default port `8080`.
        *   Run `curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc": "2.0", "method": "tools", "id": "1"}' http://localhost:8080/mcp` and verify a successful (or gracefully failed) response, not a connection error.

2.  **Default SSE Port:**
    *   **Command:** `./<server-binary> -transport sse &`
    *   **Verification:**
        *   Check server logs to confirm it starts on the default port `8081`.

3.  **`--port` Flag Override (HTTP):**
    *   **Command:** `./<server-binary> -transport http --port 9001 &`
    *   **Verification:**
        *   Check server logs to confirm it starts on port `9001`.
        *   Run `curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc": "2.0", "method": "tools", "id": "1"}' http://localhost:9001/mcp` and verify a successful response.

4.  **`PORT` Environment Variable Override (HTTP):**
    *   **Command:** `PORT=9002 ./<server-binary> -transport http &`
    *   **Verification:**
        *   Check server logs to confirm it starts on port `9002`.
        *   Run `curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc": "2.0", "method": "tools", "id": "1"}' http://localhost:9002/mcp` and verify a successful response.

5.  **Flag-over-Environment Precedence (HTTP):**
    *   **Command:** `PORT=9003 ./<server-binary> -transport http --port 9004 &`
    *   **Verification:**
        *   Check server logs to confirm it starts on port `9004` (the flag's value).
        *   Run `curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc": "2.0", "method": "tools", "id": "1"}' http://localhost:9004/mcp` and verify a successful response.

6.  **`stdio` Transport (Regression Test):**
    *   **Command:** `mcptools call <tool_name> --params '''{}''' ./<server-binary>`
    *   **Verification:** Verify the command completes successfully, ensuring the `stdio` transport was not broken by the changes.

This comprehensive testing strategy will validate the new port configuration logic across all scenarios and ensure that existing functionality remains intact.
