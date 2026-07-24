# Runware MCP Server

Use [Runware](https://runware.ai) image, video, audio, text, and 3D generation
from any client that supports the
[Model Context Protocol](https://modelcontextprotocol.io).

The server provides 36 MCP tools, live model discovery, model-specific schema
validation, reusable prompt templates, and session resources.

## Highlights

- Generate and transform images, video, audio, text, and 3D assets.
- Discover current Runware models, capabilities, examples, pricing, and schemas.
- Run model-specific requests through a schema-validated unified tool.
- Estimate costs, inspect task results, and view account usage.
- Process batches and watch folders for automated media workflows.
- Validate inputs with Zod and live Runware JSON Schemas.

## Requirements

- Node.js 26 or newer
- A [Runware API key](https://runware.ai)

Runware inference and storage operations may incur usage charges.

## Quick start

Add the server to your MCP client configuration:

```json
{
  "mcpServers": {
    "runware": {
      "command": "npx",
      "args": ["-y", "runware-mcp"],
      "env": {
        "RUNWARE_API_KEY": "your-api-key"
      }
    }
  }
}
```

Restart the client after saving the configuration.

| Client | Common configuration location |
|---|---|
| Claude Code | `~/.claude.json` or project `.mcp.json` |
| Claude Desktop (macOS) | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Claude Desktop (Linux) | `~/.config/Claude/claude_desktop_config.json` |
| Claude Desktop (Windows) | `%APPDATA%\Claude\claude_desktop_config.json` |
| Cursor | Project `.cursor/mcp.json` |
| Codex CLI | `~/.codex/config.toml` or project `.codex/config.toml` |
| VS Code | Project `.vscode/mcp.json` |

Configuration formats vary by client. Clients that use TOML require the
equivalent TOML configuration.

## Tools

| Area | Tools |
|---|---|
| Unified API and discovery | `runInference`, `listModels`, `modelDetails`, `modelExamples`, `modelPricing`, `listCapabilities`, `modelSchema`, `getTaskDetails` |
| Images and creative controls | `imageInference`, `photoMaker`, `imageUpscale`, `imageBackgroundRemoval`, `imageCaption`, `imageMasking`, `imageUpload`, `vectorize`, `promptEnhance`, `controlNetPreprocess`, `styleTransfer` |
| Video | `videoInference`, `listVideoModels`, `getVideoModelInfo` |
| Audio, text, and 3D | `audioInference`, `transcription`, `textInference`, `threeDInference` |
| Models, account, and storage | `modelSearch`, `costEstimate`, `accountBalance`, `accountManagement`, `mediaStorage`, `modelUpload`, `training` |
| Batch and folders | `processFolder`, `batchImageInference`, `watchFolder` |

`listModels` uses Runware's live catalog. `listVideoModels` is an offline
compatibility catalog and may not reflect newly released models.

### Unified inference

`runInference` retrieves the selected model's current JSON Schema from Runware
and validates the request before submission. It supports allowlisted inference
tasks while preventing callers from overriding internal task identifiers or
delivery settings.

Administrative and destructive operations remain separate tools.
`runInference` cannot perform account management, training, model uploads,
media deletion, or webhook configuration.

## Resources and prompts

The server exposes six MCP resource providers:

| Resource | Purpose |
|---|---|
| `runware://images/{id}` | Generated images and metadata |
| `runware://videos/{id}` | Generated videos and metadata |
| `runware://audio/{id}` | Generated audio and metadata |
| `runware://session/history` | Current session history |
| `runware://analytics/{period}` | Session usage analytics |
| `runware://docs/...` | Built-in concepts, tools, features, providers, and guides |

Reusable prompt templates include `product-photo`, `avatar-generator`,
`video-scene`, `style-transfer`, `ui-mockup`, `thumbnail`, and
`music-composition`.

## Configuration

Only `RUNWARE_API_KEY` is required.

| Variable | Default | Purpose |
|---|---:|---|
| `RUNWARE_API_KEY` | required | Runware API credential |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn`, or `error` |
| `MAX_FILE_SIZE_MB` | `50` | Maximum local upload size |
| `ALLOWED_FILE_ROOTS` | safe system defaults | Comma-separated permitted filesystem roots |
| `REQUEST_TIMEOUT_MS` | `60000` | Timeout for individual API requests |
| `POLL_MAX_ATTEMPTS` | `150` | Maximum async polling attempts |
| `RATE_LIMIT_MAX_TOKENS` | `10` | Local request burst capacity |
| `RATE_LIMIT_REFILL_RATE` | `1` | Local tokens restored per second |
| `WATCH_FOLDERS` | none | Comma-separated folders available to the watcher |
| `WATCH_DEBOUNCE_MS` | `500` | Folder watcher debounce interval |

## Security

- Zod validation is applied to every MCP tool input.
- Live model schemas validate unified inference parameters.
- Filesystem access uses allowed roots, canonical paths, and symlink checks.
- Remote media requests block private networks and metadata endpoints.
- API errors are sanitized before they are returned to MCP clients.
- Local rate limiting protects the Runware API from accidental bursts.
- CI runs tests, CodeQL, dependency review, npm vulnerability audits, and
  registry signature verification.
- GitHub Actions are pinned to immutable commit SHAs with minimal permissions.

Treat MCP tool access as account access: keep the API key out of source control
and review model, training, upload, and deletion requests before approving them.

## Development

```bash
git clone https://github.com/ul0gic/runware-mcp.git
cd runware-mcp
npm ci
npm run check
```

| Command | Purpose |
|---|---|
| `npm run dev` | Run in watch mode |
| `npm run check` | Typecheck, lint, test, and build |
| `npm run test:coverage` | Generate the coverage report |
| `npm run audit:security` | Check known dependency vulnerabilities |
| `npm run audit:signatures` | Verify registry signatures and provenance |
| `npm run audit:outdated` | Check production dependency freshness |

See [CONTRIBUTING.md](CONTRIBUTING.md) for implementation and testing guidance,
and [CHANGELOG.md](CHANGELOG.md) for release history.

## License

MIT
