# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Optional SQLite persistence via `better-sqlite3` and Drizzle ORM
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
- `getAccountBalance` -- check Runware credit balance

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

#### Database

- Optional SQLite database with Drizzle ORM
- `generations` table for tracking all media generations with metadata
- `watchedFolders` table for folder watch configurations
- `analytics` table for daily aggregated usage statistics
- Full CRUD operations, date range queries, and full-text search on prompts
- Analytics aggregation by provider, model, and task type

#### Security

- Path traversal prevention via canonicalization and symlink resolution
- SSRF protection blocking private IPs and cloud metadata endpoints
- Token bucket rate limiting with configurable thresholds
- Zod schema validation on every tool input
- Error sanitization preventing stack traces and internal paths from leaking
- Allowed file roots restricting file system access

#### Testing

- 1,378 tests across 47 test files
- 82%+ line, statement, and function coverage
- 67%+ branch coverage
- Unit tests for all 22 tools, shared modules, and resource providers
- Integration tests for MCP protocol handlers and database operations

### Removed

- Python implementation replaced entirely by this TypeScript rewrite

[1.0.0]: https://github.com/runware/mcp-server/releases/tag/v1.0.0
