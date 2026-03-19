# Runware MCP Server

### AI Media Generation for Any MCP Client

<p align="center">
  <img src="https://img.shields.io/badge/Tools-22-blue?style=for-the-badge" alt="22 Tools">
  <img src="https://img.shields.io/badge/Resources-6-green?style=for-the-badge" alt="6 Resources">
  <img src="https://img.shields.io/badge/Providers-9-purple?style=for-the-badge" alt="9 Providers">
  <img src="https://img.shields.io/badge/API%20Coverage-100%25-gold?style=for-the-badge" alt="100% API Coverage">
</p>

<p align="center">
  <strong>Turn any MCP-compatible AI assistant into a creative powerhouse.</strong><br>
  Images. Videos. Audio. Vectors. All from natural language.
</p>

---

## What Is This?

An MCP server that connects your AI coding assistant directly to Runware's AI media generation infrastructure. Works with any client that supports the [Model Context Protocol](https://modelcontextprotocol.io).

```mermaid
flowchart LR
    Client["MCP Client"] <-->|"MCP Protocol"| Server

    subgraph Server["Runware MCP Server"]
        direction TB
        Tools["22 Tools  &middot;  6 Resources"]
        Engine["Rate Limiting  &middot;  Caching  &middot;  Batch Processing"]
    end

    Server -->|"REST API"| Cloud

    subgraph Cloud["Runware Cloud"]
        direction TB
        Models["FLUX  &middot;  SDXL  &middot;  Kling  &middot;  Veo  &middot;  ElevenLabs  &middot;  +more"]
    end

    style Client fill:#0d9488,stroke:#2dd4bf,stroke-width:2px,color:#fff
    style Server fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#fff
    style Tools fill:#2563eb,stroke:#60a5fa,color:#fff
    style Engine fill:#2563eb,stroke:#60a5fa,color:#fff
    style Cloud fill:#854d0e,stroke:#facc15,stroke-width:2px,color:#fff
    style Models fill:#a16207,stroke:#fde047,color:#fff
```

**One config. Zero complexity. Infinite creativity.**

---

## Installation

Add the server to your MCP client config:

```json
{
  "mcpServers": {
    "runware": {
      "command": "npx",
      "args": ["-y", "@runware/mcp-server"],
      "env": {
        "RUNWARE_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Config locations by client

| Client | Config Location |
|--------|-----------------|
| **Claude Code** | `~/.claude.json` or project `.mcp.json` |
| **Claude Desktop (macOS)** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Claude Desktop (Linux)** | `~/.config/claude/claude_desktop_config.json` |
| **Claude Desktop (Windows)** | `%APPDATA%\Claude\claude_desktop_config.json` |
| **Cursor** | `.cursor/mcp.json` in your project root |
| **Windsurf** | `~/.codeium/windsurf/mcp_config.json` |
| **VS Code (Copilot)** | `.vscode/mcp.json` in your project root |

> **Note:** Config format may vary slightly by client. Check your client's MCP documentation for exact syntax.

That's it. No `pip install`. No virtual environments. No Python version conflicts. Just paste, restart, create.

---

## Capabilities at a Glance

```mermaid
flowchart LR
    R((Runware MCP)) --> IMG[Images]
    R --> VID[Video]
    R --> AUD[Audio]
    R --> BATCH[Batch Ops]
    R --> INT[Intelligence]

    IMG --> I1[Text to Image]
    IMG --> I2[Img to Img &middot; Inpaint &middot; Outpaint]
    IMG --> I3[Upscale &middot; BG Removal &middot; Caption]
    IMG --> I4[Masking &middot; Vectorize]

    VID --> V1[Text/Image to Video]
    VID --> V2[Lip Sync &middot; 9 Providers]

    AUD --> A1[Music &middot; SFX &middot; TTS]
    AUD --> A2[Transcription]

    BATCH --> B1[Folder Processing]
    BATCH --> B2[Batch Generate &middot; Watch]

    INT --> N1[Prompt Enhance &middot; ControlNet]
    INT --> N2[Model Search &middot; Cost Est.]

    style R fill:#0d9488,stroke:#2dd4bf,stroke-width:2px,color:#fff
    style IMG fill:#2563eb,stroke:#60a5fa,color:#fff
    style VID fill:#7c3aed,stroke:#a78bfa,color:#fff
    style AUD fill:#059669,stroke:#34d399,color:#fff
    style BATCH fill:#d97706,stroke:#fbbf24,color:#fff
    style INT fill:#dc2626,stroke:#f87171,color:#fff

    style I1 fill:#1e40af,stroke:#3b82f6,color:#fff
    style I2 fill:#1e40af,stroke:#3b82f6,color:#fff
    style I3 fill:#1e40af,stroke:#3b82f6,color:#fff
    style I4 fill:#1e40af,stroke:#3b82f6,color:#fff
    style V1 fill:#5b21b6,stroke:#8b5cf6,color:#fff
    style V2 fill:#5b21b6,stroke:#8b5cf6,color:#fff
    style A1 fill:#065f46,stroke:#10b981,color:#fff
    style A2 fill:#065f46,stroke:#10b981,color:#fff
    style B1 fill:#92400e,stroke:#f59e0b,color:#fff
    style B2 fill:#92400e,stroke:#f59e0b,color:#fff
    style N1 fill:#991b1b,stroke:#ef4444,color:#fff
    style N2 fill:#991b1b,stroke:#ef4444,color:#fff
```

---

## The Complete Toolset

### Image Generation & Manipulation

| Tool | What It Does | Key Features |
|------|--------------|--------------|
| `imageInference` | Text/image to images | 60+ parameters, LoRA, ControlNet, IP-Adapters |
| `photoMaker` | Preserve identity across generations | Face consistency, style transfer |
| `imageUpscale` | Enhance resolution up to 4x | Multiple algorithms, preserve details |
| `imageBackgroundRemoval` | Remove backgrounds instantly | Alpha matting, custom colors |
| `imageCaption` | Describe images in detail | Multiple models, structured output |
| `imageMasking` | Generate segmentation masks | Face, body, hands detection |
| `imageUpload` | Upload local images | Base64, URL, data URI support |
| `vectorize` | Convert raster to SVG | Perfect for logos, icons |

### Video Generation

| Tool | What It Does | Providers |
|------|--------------|-----------|
| `videoInference` | Create videos from text/images | Kling, Veo, MiniMax, PixVerse, Runway, Vidu, Wan, Sync |
| `listVideoModels` | Browse available models | All providers with specs |
| `getVideoModelInfo` | Get model details | Dimensions, duration, features |

### Audio Generation

| Tool | What It Does | Features |
|------|--------------|----------|
| `audioInference` | Generate music, SFX, speech | ElevenLabs, Mirelo, 14 voices |
| `transcription` | Video to text transcription | Multiple languages |

### Creative Tools

| Tool | What It Does | Use Cases |
|------|--------------|-----------|
| `promptEnhance` | Supercharge your prompts | 1-5 variations, AI enrichment |
| `controlNetPreprocess` | Prepare images for ControlNet | 12 preprocessors |
| `styleTransfer` | Apply artistic styles | Combine with any model |

### Utilities

| Tool | What It Does | Why It Matters |
|------|--------------|----------------|
| `modelSearch` | Search 100,000+ models | Find the perfect model |
| `costEstimate` | Estimate before generating | Budget control |
| `getAccountBalance` | Check your credits | Never run dry |

### Batch Operations

| Tool | What It Does | Power Features |
|------|--------------|----------------|
| `processFolder` | Process entire folders | Upscale, remove BG, caption, vectorize |
| `batchImageInference` | Generate from multiple prompts | Concurrent processing |
| `watchFolder` | Auto-process new files | Pipelines, debouncing |

---

## Provider-Specific Features

This server exposes the **full capabilities** of each provider:

| Provider | Exclusive Features |
|----------|-------------------|
| **Alibaba (Wan)** | Prompt extension, multi-shot videos, audio generation |
| **Black Forest Labs** | Safety tolerance, raw mode, prompt upsampling |
| **Bria** | Content moderation, medium selection, fast mode |
| **Ideogram** | 65+ style types, color palettes, magic prompt |
| **ByteDance** | Sequential image narratives (1-15 images) |
| **KlingAI** | Sound generation, camera fixed mode |
| **PixVerse** | 20 viral effects, 21 camera movements, multi-clip |
| **Google Veo** | Prompt enhancement, audio generation (Veo 3) |
| **Sync.so** | Lip sync, speaker detection, audio segments |

---

## MCP Resources

Access your generated content programmatically:

| Resource URI | Description |
|--------------|-------------|
| `runware://images/{id}` | Generated images with metadata |
| `runware://videos/{id}` | Generated videos with metadata |
| `runware://audio/{id}` | Generated audio with metadata |
| `runware://session/history` | Full session generation history |
| `runware://analytics/{period}` | Usage analytics (day/week/month/all) |

---

## Prompt Templates

Pre-built workflows for common tasks:

| Template | Perfect For |
|----------|-------------|
| `product-photo` | E-commerce, catalogs, marketing |
| `avatar-generator` | Profile pictures, characters |
| `video-scene` | Storyboarding, content creation |
| `style-transfer` | Artistic transformations |
| `ui-mockup` | Web/mobile design prototypes |
| `thumbnail` | YouTube, articles, social media |
| `music-composition` | Background music, jingles |

---

## Documentation

This MCP server includes **comprehensive built-in documentation** accessible as MCP resources. Any connected client can discover and read detailed API references, feature guides, and provider docs on demand.

**42 documentation resources** organized across 5 categories:

| Category | Count | What's Covered |
|----------|-------|----------------|
| **Concepts** | 5 | AIR identifiers, task responses, output types, async delivery, connection |
| **Tools** | 13 | Full parameter reference for every tool |
| **Features** | 10 | ControlNet, LoRA, IP-Adapters, prompt weighting, acceleration, and more |
| **Providers** | 9 | Provider-specific settings and capabilities |
| **Guides** | 5 | Batch processing, cost optimization, quality tuning, combining features |

Example URIs: `runware://docs/tools/image-inference`, `runware://docs/features/controlnet-guide`, `runware://docs/providers/kling-ai`, `runware://docs/guides/cost-optimization`

Ask your AI assistant to list or read any `runware://docs/*` resource for detailed reference information.

---

## Architecture

```mermaid
flowchart LR
    Client["MCP Client"] <-->|"MCP"| Handler

    subgraph Server["Runware MCP Server"]
        Handler["Protocol Handler"]
        Handler --> Tools & Core
        Core --> Data

        subgraph Tools["Tools"]
            direction TB
            IMG["Image"] ~~~ VID["Video"]
            AUD["Audio"] ~~~ BATCH["Batch"]
        end

        subgraph Core["Services"]
            direction TB
            RL["Rate Limiter"] ~~~ Cache["Cache"]
            Val["Validation"]
        end

        subgraph Data["Data"]
            direction TB
            Session["Sessions"]
            Analytics["Analytics"]
        end
    end

    Tools -->|"HTTPS"| API["Runware Cloud API"]

    style Client fill:#0d9488,stroke:#2dd4bf,stroke-width:2px,color:#fff
    style Server fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#fff
    style Handler fill:#2563eb,stroke:#60a5fa,color:#fff
    style Tools fill:#1e40af,stroke:#3b82f6,color:#fff
    style Core fill:#065f46,stroke:#10b981,color:#fff
    style Data fill:#854d0e,stroke:#facc15,color:#fff
    style IMG fill:#2563eb,stroke:#60a5fa,color:#fff
    style VID fill:#7c3aed,stroke:#a78bfa,color:#fff
    style AUD fill:#059669,stroke:#34d399,color:#fff
    style BATCH fill:#d97706,stroke:#fbbf24,color:#fff
    style RL fill:#065f46,stroke:#10b981,color:#fff
    style Cache fill:#065f46,stroke:#10b981,color:#fff
    style Val fill:#065f46,stroke:#10b981,color:#fff
    style Session fill:#92400e,stroke:#f59e0b,color:#fff
    style Analytics fill:#92400e,stroke:#f59e0b,color:#fff
    style API fill:#854d0e,stroke:#facc15,stroke-width:2px,color:#fff
```

---

## Why This Exists

The original Python implementation covered **~40%** of Runware's API capabilities.

| Metric | Original Python | This TypeScript |
|--------|-----------------|-----------------|
| **API Coverage** | ~40% | **100%** |
| **Tools** | 8 | **22** |
| **Providers** | 4 | **9** |
| **Provider Settings** | 0 | **Full Support** |
| **Session Storage** | None | **In-memory session stores** |
| **Batch Ops** | None | **Folder processing, watching** |
| **Type Safety** | `Dict[str, Any]` | **Strict TypeScript + Zod** |
| **Security** | Path traversal bugs | **SSRF protection, rate limiting** |
| **Tests** | 0% | **80%+ coverage** |
| **Install Complexity** | UV, venv, Python hell | **`npx` — just works** |

---

## Video Model Comparison

| Provider | Models | Max Resolution | Max Duration | Special Features |
|----------|--------|----------------|--------------|------------------|
| **KlingAI** | 10 | 1920x1080 | 10s | Sound, camera lock |
| **Google Veo** | 3 | 1920x1080 | 8s | Audio gen (Veo 3) |
| **MiniMax** | 4 | 1920x1080 | 5s | Fast generation |
| **PixVerse** | 3 | 1280x720 | 4s | Viral effects |
| **Vidu** | 4 | 1280x720 | 4s | Reference videos |
| **Wan/Alibaba** | 2 | 1280x720 | 5s | Multi-shot |
| **Runway** | 2 | 1920x1080 | 10s | Professional |
| **Sync.so** | 1 | 1920x1080 | 60s | Lip sync |

---

## ControlNet Preprocessors

| Preprocessor | Use Case | Best For |
|--------------|----------|----------|
| `canny` | Edge detection | Architectural, product |
| `depth` | Depth mapping | Scenes, landscapes |
| `mlsd` | Line segments | Interior design |
| `normalbae` | Normal maps | 3D-like rendering |
| `openpose` | Human pose | Character art |
| `tile` | Tile processing | Textures, patterns |
| `seg` | Segmentation | Complex scenes |
| `lineart` | Line extraction | Illustrations |
| `lineart_anime` | Anime lines | Anime, manga |
| `shuffle` | Content shuffle | Abstract, creative |
| `scribble` | Scribble style | Concept art |
| `softedge` | Soft edges | Soft, dreamy |

---

## Configuration Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `RUNWARE_API_KEY` | **required** | Your Runware API key |
| `NODE_ENV` | `production` | Environment mode |
| `LOG_LEVEL` | `info` | Logging verbosity |
| `MAX_FILE_SIZE_MB` | `50` | Max upload size |
| `REQUEST_TIMEOUT_MS` | `60000` | API timeout |
| `POLL_MAX_ATTEMPTS` | `150` | Video poll attempts |
| `RATE_LIMIT_MAX_TOKENS` | `10` | Rate limit burst |
| `RATE_LIMIT_REFILL_RATE` | `1` | Tokens per second |
| `WATCH_FOLDERS` | — | Auto-watch folders |
| `WATCH_DEBOUNCE_MS` | `500` | Watch debounce |

---

## Security

| Protection | Implementation |
|------------|----------------|
| **Input Validation** | Zod schemas on every tool |
| **Path Traversal** | Canonicalization + symlink resolution |
| **SSRF Protection** | Private IP + metadata endpoint blocking |
| **Rate Limiting** | Token bucket algorithm |
| **Error Sanitization** | No stack traces or paths leaked |

---

## Example Workflows

### Product Photography Pipeline
```
You: "Process all images in /photos/products - remove backgrounds,
      upscale 2x, and save as PNGs to /photos/processed"
Assistant uses processFolder with removeBackground and upscale pipeline
```

### Video Storyboard
```
You: "Create a 3-part video story: sunrise over mountains,
      eagle soaring, landing on a branch. Use Kling, 5s each."

Assistant generates 3 coordinated videos with consistent style
```

### Brand Asset Generation
```
You: "Generate 5 logo variations for 'TechFlow' - modern, minimal,
      tech-focused. Then vectorize the best one."

Assistant uses imageInference, selects best, then vectorize to SVG
```

### Music + Video
```
You: "Create a 30-second promo video with matching background music"

Assistant uses videoInference + audioInference in parallel
```

---

## Development

```bash
git clone https://github.com/runware/mcp-server
cd mcp-server
npm install
npm run build
npm test
```

| Command | Purpose |
|---------|---------|
| `npm run build` | Compile TypeScript |
| `npm run dev` | Watch mode |
| `npm run typecheck` | Type checking |
| `npm run lint` | Lint with strict rules |
| `npm run test` | Run tests |
| `npm run test:coverage` | Coverage report |

---

## Contributing

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for the full development guide including project structure, how to add new tools, testing patterns, and code style.

1. Fork it
2. Create a feature branch
3. Make it pass: `npm run build && npm run lint && npm test`
4. Submit PR

For version history and release notes, see **[CHANGELOG.md](CHANGELOG.md)**.

---

## License

MIT

---

<p align="center">
  <strong>Built for creators who demand more from their AI tools.</strong>
</p>

<p align="center">
  <sub>22 tools. 9 providers. 100% API coverage. Zero complexity.</sub>
</p>
