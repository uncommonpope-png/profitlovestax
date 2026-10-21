# GSK Environment Variables Map

This document outlines the environment variables identified within the GSK core codebase, specifically from `process.env` calls. These variables are crucial for configuring GSK's behavior, connectivity, and access to external services.

## Identified Environment Variables

| Environment Variable | Purpose | Location(s) | Default Value (if specified) | Notes |
| :------------------- | :------ | :---------- | :--------------------------- | :---- |
| `GSK_MODEL` | Sets the default AI model used by the GSK brain. | `fusion-loader.js` | `cx/gpt-5.4-mini` | Determines the foundational LLM for core cognitive processes. |
| `NINE_ROUTER_API_KEY` | API key for authenticating with the NineRouter service. | `fusion-loader.js` | (None) | Its presence enables/disables NineRouter integration. |
| `SCRIBE_URL` | Specifies the URL for connecting to the SCRIBE service. | `fusion-loader.js`, `scripts/sync-gsk-to-scribe.js` | `http://127.0.0.1:4000` | Defines the endpoint for GSK-SCRIBE communication. |
| `OBSIDIAN_VAULT_PATH` | Path to the Obsidian vault used for knowledge management and memory storage. | `fusion-loader.js` | (Empty string) | Critical for integration with the Obsidian knowledge base. |
| `IDENTITY_MODE` | Sets the operational mode for the Identity Kernel. | `fusion-loader.js` | `strict` | Controls how GSK's identity is managed and protected. |
| `SANCTUM_URL` | Defines the WebSocket URL for connecting to the Sanctum service. | `fusion-loader.js` | `ws://127.0.0.1:9001` | Used for world simulation and other real-time interactions. |
| `ep.authKey` (dynamic) | Dynamically determined environment variables for API keys. | `api-registry.js`, `llm-router.js` | (Varies) | `llm-router.js` and `api-registry.js` fetch API keys based on a dynamic `authKey` property within endpoint configurations. This means any string value configured as an `authKey` in the API registry (e.g., `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) will be looked up in `process.env`. |

## Dynamic API Key Loading

The presence of `ep.authKey ? process.env[ep.authKey] : null;` in `llm-router.js` indicates a flexible system for loading API keys. GSK can be configured to use various LLM providers, and their respective API keys are expected to be available as environment variables. For example, if an endpoint definition includes `authKey: "OPENAI_API_KEY"`, then GSK will attempt to read `process.env.OPENAI_API_KEY`.

## Importance

These environment variables are critical configuration points, allowing the Architect to customize GSK's operational parameters, integrate with necessary external services, and secure sensitive API credentials. Misconfiguration or missing variables could lead to functional limitations or security vulnerabilities.
