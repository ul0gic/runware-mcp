# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-03-19

### Changed

- Made project fully client-agnostic — removed all Claude-specific branding from README, source comments, and package.json
- Added MCP client setup instructions for Claude Code, Cursor, Windsurf, VS Code Copilot, and Claude Desktop
- Redesigned all README diagrams with horizontal layouts and color-coded sections
- Replaced negative comparison table with positive "What's Included" feature summary
- Pinned production dependencies to semver ranges instead of `latest`

### Fixed

#### Security Audit Fixes

- **SEC-01 (Medium):** Fixed path prefix bypass in `startsWith` root checks — added trailing path separator to prevent sibling directory access (3 locations in `file-utils.ts`)
- **SEC-02 (Medium):** Documented DNS rebinding limitation as accepted risk in `url-validation.ts`
- **SEC-03 (Low):** Validation failures now return MCP error responses instead of silently passing raw unvalidated args to handlers
- **SEC-04 (Low):** Removed `resolvedPath` from client-facing `PathTraversalError` data to prevent internal filesystem structure leakage
- **SEC-06 (Low):** Replaced manual `combineAbortSignals` with `AbortSignal.any()` to fix event listener leak
- **SEC-11 (Informational):** Fixed operator precedence bug in video elapsed time calculation

#### Dependency Vulnerabilities

- Bumped `hono` 4.11.7 → 4.12.8 (prototype pollution, serveStatic file access, cookie/SSE injection)
- Bumped `@hono/node-server` 1.19.9 → 1.19.11 (auth bypass via encoded slashes)
- Bumped `express-rate-limit` 8.2.1 → 8.3.1 (IPv4-mapped IPv6 rate limit bypass)
- Bumped `rollup` 4.57.1 → 4.59.0 (arbitrary file write via path traversal)

### Added

- `MAX_SESSION_SIZE` (10,000) with oldest-entry eviction on all session stores to prevent unbounded memory growth
- Security policy (`SECURITY.md`)
- `generated/` to `.gitignore`

### Removed

- SQLite database layer (`better-sqlite3`, `drizzle-orm`) — replaced with in-memory session stores
- `.env.example` and all `.env` file references

---

## [1.0.0] - 2026-02-05

Complete TypeScript rewrite of the Runware MCP server with 100% API coverage.

### Added

#### Core Infrastructure

- TypeScript strict-mode codebase with ESM modules and Node.js 25+
- MCP protocol support via `@modelcontextprotocol/sdk` (stdio transport)
- Runware HTTP client with native `fetch` and task UUID management
- Async task polling with exponential backoff for video/audio generation
- Zod schema validation on all tool inputs and configuration
- Token bucket rate limiter with configurable burst and refill rate
- LRU cache for repeated lookups
- Branded types for API keys, task UUIDs, image/video/audio UUIDs
- Progress reporting for long-running operations
- AbortController-based cancellation support
- Environment variable validation at startup with clear error messages

#### Image Tools (8)

- `imageInference` -- text-to-image, image-to-image, inpainting, outpainting with 60+ parameters including ControlNet, LoRA, IP-Adapters, embeddings, PuLID, ACE++, refiner models, acceleration (TeaCache/DeepCache), and provider-specific settings
- `photoMaker` -- identity-preserving generation with automatic trigger word injection
- `imageUpscale` -- resolution enhancement up to 4x with multiple algorithms
- `imageBackgroundRemoval` -- instant background removal with alpha matting and custom replacement colors
- `imageCaption` -- image description generation with multiple captioning models
- `imageMasking` -- segmentation mask generation for faces, bodies, and facial features (15 models)
- `imageUpload` -- upload local images via base64, URL, or data URI with path traversal protection
- `vectorize` -- raster-to-SVG conversion for logos and icons

#### Video Tools (4)

- `videoInference` -- text-to-video and image-to-video generation across 9 providers with provider-specific settings (frame images, reference videos, speech, lip sync)
- `listVideoModels` -- browse all 31 available video models with specs and capabilities
- `getVideoModelInfo` -- detailed model information including dimensions, duration, and features
- `transcription` -- video-to-text transcription with multi-language support

#### Audio Tools (1)

- `audioInference` -- music generation, sound effects, and text-to-speech with ElevenLabs and Mirelo models, 14 TTS voices, duration 10-300 seconds

#### Creative Tools (3)

- `promptEnhance` -- AI-powered prompt enrichment with 1-5 variations and token length control
- `controlNetPreprocess` -- image preprocessing for 12 ControlNet types (canny, depth, openpose, mlsd, lineart, tile, seg, normalbae, shuffle, scribble, softedge, lineart_anime)
- `styleTransfer` -- apply artistic styles to images combined with any model

#### Utility Tools (3)

- `modelSearch` -- search 100,000+ models by name, type, architecture, and AIR identifier
- `costEstimate` -- estimate generation cost before running
- `accountBalance` -- check Runware credit balance

#### Batch Operations (3)

- `processFolder` -- process entire image folders with operations (upscale, removeBackground, caption, vectorize, controlNetPreprocess), configurable concurrency, progress reporting, and output folder support
- `batchImageInference` -- generate images from multiple prompts (1-20) with shared settings, concurrent processing, and per-prompt results
- `watchFolder` -- auto-process new files in watched directories with configurable debouncing, operations pipeline, start/stop/list/status actions

#### MCP Resources (5)

- `runware://images/{id}` -- generated images with metadata (model, prompt, dimensions, cost)
- `runware://videos/{id}` -- generated videos with metadata (provider, duration, resolution)
- `runware://audio/{id}` -- generated audio with metadata (type, duration, voice)
- `runware://session/history` -- full session generation history
- `runware://analytics/{period}` -- usage analytics by day, week, month, or all-time

#### MCP Prompt Templates (7)

- `product-photo` -- e-commerce and marketing product photography workflow
- `avatar-generator` -- profile pictures and character generation workflow
- `video-scene` -- storyboarding and video content creation workflow
- `style-transfer` -- artistic style transformation workflow
- `ui-mockup` -- web and mobile design prototype workflow
- `thumbnail` -- YouTube, article, and social media thumbnail workflow
- `music-composition` -- background music and jingle creation workflow

#### Provider Support (9 providers with full settings)

- **Alibaba (Wan)** -- prompt extension, single/multi-shot videos, audio generation
- **Black Forest Labs** -- safety tolerance, raw mode, prompt upsampling
- **Bria** -- content moderation, medium selection, fast mode, prompt enhancement
- **ByteDance** -- sequential image narratives (1-15 images), prompt optimization
- **Google Veo** -- prompt enhancement, audio generation (Veo 3)
- **Ideogram** -- 65+ style types, color palettes, magic prompt, rendering speed
- **KlingAI** -- sound generation, camera fixed mode, keep original sound
- **PixVerse** -- 20 viral effects, 21 camera movements, multi-clip mode
- **Sync.so** -- lip sync, speaker detection, occlusion handling, audio segments

#### Security

- Path traversal prevention via canonicalization and symlink resolution
- SSRF protection blocking private IPs and cloud metadata endpoints
- Token bucket rate limiting with configurable thresholds
- Zod schema validation on every tool input
- Error sanitization preventing stack traces and internal paths from leaking
- Allowed file roots restricting file system access

#### Testing

- 1,437 tests across 49 test files
- 82%+ line, statement, and function coverage
- 67%+ branch coverage
- Unit tests for all 22 tools, shared modules, and resource providers
- Integration tests for MCP protocol handlers

### Fixed

#### Dispatch-Layer Input Validation

- Added Zod schema parsing at the MCP dispatch boundary (`src/index.ts`) -- all tool inputs now go through `safeParse()` before reaching handlers, applying defaults and validating at the system boundary
- Added `toolInputSchemas` registry mapping all 22 tools to their Zod schemas

#### Wrong taskTypes (3 tools)

- `accountBalance` -- fixed taskType from `accountBalance` to `accountManagement`, added missing required `operation: 'getDetails'` parameter
- `transcription` -- fixed taskType from `transcription` to `audioTranscription`
- `controlNetPreprocess` -- fixed taskType from `controlNetPreprocess` to `imageControlNetPreProcess`

#### Invalid Default Values (4 tools)

- `promptEnhance` -- API requires `promptMaxLength`; added default of 200, changed min from 12 to 5
- `imageCaption` -- default model `runware:150@2` does not exist; changed to `runware:152@2` (Qwen2.5-VL-7B)
- `styleTransfer` -- default model `civitai:943001@1055701` invalid; changed to `runware:100@1`, caption model to `runware:152@2`
- `costEstimate`, `vectorize`, `batchImageInference` -- Zod defaults now applied via dispatch-layer validation

#### Response Parsing (1 tool)

- `modelSearch` -- API returns results in `data[0].results[]` not `data[0].models[]`; fixed field mapping. Also fixed `positiveTriggerWords` being split into individual characters when API returns a string instead of an array.

### Removed

- Python implementation replaced entirely by this TypeScript rewrite

[1.1.0]: https://github.com/ul0gic/runware-mcp/releases/tag/v1.1.0
[1.0.0]: https://github.com/ul0gic/runware-mcp/releases/tag/v1.0.0
