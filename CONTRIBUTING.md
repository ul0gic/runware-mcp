# Contributing to Runware MCP Server

## Prerequisites

- **Node.js 26.13.1+** (uses native `fetch`, modern ESM features)
- **npm** (ships with Node.js)
- **Runware API key** -- get one at [runware.ai](https://runware.ai)

## Development Setup

```bash
# Clone the repository
git clone https://github.com/runware/mcp-server.git
cd mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Run all checks
npm run check
```

### Available Scripts

| Command                 | Purpose                                                     |
| ----------------------- | ----------------------------------------------------------- |
| `npm run build`         | Compile TypeScript with `tsc` (TypeScript 7, ESM output)    |
| `npm run dev`           | Watch mode with tsx                                         |
| `npm run start`         | Run the compiled server                                     |
| `npm run typecheck`     | Type check with `tsc --noEmit`                              |
| `npm run lint`          | Lint and format-check with Biome (zero diagnostics allowed) |
| `npm run lint:fix`      | Apply Biome formatting and safe fixes                       |
| `npm test`              | Run tests with Vitest                                       |
| `npm run test:watch`    | Run tests in watch mode                                     |
| `npm run test:coverage` | Run tests with coverage report                              |
| `npm run sast`          | Run CodeQL `security-extended` locally (CodeQL CLI)         |

## Project Structure

```
src/
├── index.ts                          # Server entry point, wires MCP SDK
├── server/                           # MCP server infrastructure
│   ├── capabilities.ts               # Server capability declarations
│   ├── cancellation.ts               # AbortController management
│   └── progress.ts                   # Progress reporting for long ops
├── shared/                           # Cross-cutting concerns
│   ├── types.ts                      # Branded types (ApiKey, TaskUUID, etc.)
│   ├── config.ts                     # Env validation (Zod), singleton config
│   ├── errors.ts                     # Error codes, McpError hierarchy
│   ├── validation.ts                 # Reusable Zod schemas (dimensions, prompts)
│   ├── provider-settings.ts          # Per-provider Zod schemas (9 providers)
│   ├── rate-limiter.ts               # Token bucket rate limiter
│   ├── cache.ts                      # LRU cache
│   ├── file-utils.ts                 # Safe file I/O, path traversal prevention
│   ├── folder-utils.ts               # Directory scanning, image filtering
│   ├── url-validation.ts             # SSRF protection, URL validation
│   └── utils.ts                      # General helpers (retry, formatting)
├── integrations/runware/             # Runware API client
│   ├── client.ts                     # HTTP client (native fetch)
│   └── polling.ts                    # Async task polling with backoff
├── constants/                        # Static data catalogs
│   ├── video-models.ts               # 31 video models across 9 providers
│   ├── audio-models.ts               # 4 audio models, 14 TTS voices
│   ├── controlnet.ts                 # 12 ControlNet preprocessors
│   └── masking-models.ts             # 15 face/body masking models
├── tools/                            # MCP tool implementations (22 tools)
│   ├── index.ts                      # Tool registry and barrel exports
│   └── {tool-name}/                  # One directory per tool
│       ├── schema.ts                 # Zod input/output schemas
│       ├── handler.ts                # Tool logic + MCP tool definition
│       └── index.ts                  # Barrel export
├── resources/                        # MCP resource providers (5 providers)
│   ├── index.ts                      # Provider registry
│   └── {provider-name}/
│       ├── types.ts                  # Resource entry types
│       └── provider.ts               # list() and get() implementation
└── prompts/                          # MCP prompt templates (7 templates)
    ├── index.ts                      # Template registry
    └── {template-name}/
        └── index.ts                  # Template definition with arguments

tests/
├── unit/                             # Unit tests (mirrors src/ structure)
└── integration/                      # MCP protocol integration tests
```

## How to Add a New Tool

### 1. Create the tool directory

```bash
mkdir src/tools/my-new-tool
```

### 2. Define the schema (`src/tools/my-new-tool/schema.ts`)

```typescript
import { z } from 'zod';

export const myNewToolInputSchema = z.object({
  inputParam: z.string().min(1).max(500),
  optionalParam: z.number().int().min(1).max(10).optional(),
});

export type MyNewToolInput = z.infer<typeof myNewToolInputSchema>;

export const myNewToolOutputSchema = z.object({
  result: z.string(),
  cost: z.number().optional(),
});

export type MyNewToolOutput = z.infer<typeof myNewToolOutputSchema>;
```

### 3. Implement the handler (`src/tools/my-new-tool/handler.ts`)

```typescript
import { type RunwareClient, createTaskRequest, getDefaultClient } from '../../integrations/runware/client.js';
import { wrapError } from '../../shared/errors.js';
import { defaultRateLimiter } from '../../shared/rate-limiter.js';
import { type ToolContext, type ToolResult, successResult, errorResult } from '../../shared/types.js';

import type { MyNewToolInput } from './schema.js';

export async function myNewTool(
  input: MyNewToolInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    await defaultRateLimiter.waitForToken(context?.signal);

    const task = createTaskRequest('myTaskType', {
      inputParam: input.inputParam,
    });

    const response = await runwareClient.requestSingle<{ result: string }>(task, { signal: context?.signal });

    return successResult('Operation completed', response);
  } catch (error) {
    const mcpError = wrapError(error);
    return errorResult(mcpError.message, mcpError.data);
  }
}

export const myNewToolToolDefinition = {
  name: 'myNewTool',
  description: 'Short description of what the tool does.',
  inputSchema: {
    type: 'object',
    properties: {
      inputParam: {
        type: 'string',
        description: 'Description of this parameter',
      },
    },
    required: ['inputParam'],
  },
} as const;
```

### 4. Create the barrel export (`src/tools/my-new-tool/index.ts`)

```typescript
export {
  myNewTool,
  myNewToolToolDefinition,
} from './handler.js';

export {
  myNewToolInputSchema,
  myNewToolOutputSchema,
  type MyNewToolInput,
  type MyNewToolOutput,
} from './schema.js';
```

### 5. Register in `src/tools/index.ts`

Add your tool to three places in the tools index:

1. **Import** the handler and tool definition at the top
2. **Re-export** schemas and types
3. **Add** to `toolHandlers` and `toolDefinitions` objects

### 6. Write tests

Create `tests/unit/tools/my-new-tool.test.ts` following the patterns described in the Testing section below.

### 7. Verify

```bash
npm run check
```

## Testing

### Framework

Tests use **Vitest** with `globals: false`. You must import test utilities explicitly:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
```

### Mock Patterns

**Config mock** -- required in almost every test because `config.ts` validates env vars at import time:

```typescript
vi.mock('../../src/shared/config.js', () => ({
  config: {
    RUNWARE_API_KEY: 'test-key-that-is-at-least-32-characters-long',
    NODE_ENV: 'test',
    LOG_LEVEL: 'error',
    MAX_FILE_SIZE_MB: 50,
    ALLOWED_FILE_ROOTS: [],
    REQUEST_TIMEOUT_MS: 60000,
    POLL_MAX_ATTEMPTS: 150,
    RATE_LIMIT_MAX_TOKENS: 10,
    RATE_LIMIT_REFILL_RATE: 1,
    WATCH_FOLDERS: [],
    WATCH_DEBOUNCE_MS: 500,
  },
  API_BASE_URL: 'https://api.runware.ai/v1',
  getMaxFileSizeBytes: () => 50 * 1024 * 1024,
  isDevelopment: () => false,
  isProduction: () => false,
  isTest: () => true,
  shouldLog: () => false,
}));
```

**Rate limiter mock** -- must come before imports since it depends on config:

```typescript
vi.mock('../../src/shared/rate-limiter.js', () => ({
  defaultRateLimiter: {
    waitForToken: vi.fn().mockResolvedValue(undefined),
  },
}));
```

**Runware client mock** -- pass a mock client object directly:

```typescript
const mockClient = {
  request: vi.fn(),
  requestSingle: vi.fn(),
  generateTaskUUID: vi.fn().mockReturnValue('test-uuid'),
};
```

### Important: `vi.mock()` placement

All `vi.mock()` calls must appear at the **top of the file**, before any imports of the modules being tested. Vitest hoists them automatically, but the mock factory functions cannot reference variables that have not been defined yet.

### What a Test Must Earn

A test exists to catch a bug or a security regression. Coverage is not a goal and has no threshold.

- Test behaviour through the real code path; mock only the network boundary (`fetch`) and use real temp directories for filesystem cases.
- Prefer failure paths: rejected input, path escapes, HTTP errors, timeouts, cancellation, leaked secrets.
- Do not write tests that restate a schema, a constant table, a tool description, or a mock's return value.

## Code Style

### TypeScript

- **Strict mode** enabled (`strict: true` in tsconfig)
- `noUncheckedIndexedAccess: true` -- array/record access returns `T | undefined`
- `verbatimModuleSyntax: true` -- use `import type` for type-only imports

### ESM Imports

All imports use the `.js` extension, even for TypeScript files. This is required by Node.js ESM resolution:

```typescript
// Correct
import { config } from '../../shared/config.js';

// Wrong -- will fail at runtime
import { config } from '../../shared/config';
import { config } from '../../shared/config.ts';
```

### Naming Conventions

| Element                          | Convention   | Example                                      |
| -------------------------------- | ------------ | -------------------------------------------- |
| Variables, functions, parameters | `camelCase`  | `maxTokens`, `buildApiRequest`               |
| Constants                        | `UPPER_CASE` | `API_BASE_URL`, `LOG_LEVELS`                 |
| Types, interfaces                | `PascalCase` | `ToolResult`, `ImageInferenceInput`          |
| Tool directories                 | `kebab-case` | `image-inference/`, `batch-image-inference/` |
| No `I` prefix on interfaces      | --           | `ToolContext` not `IToolContext`             |

### Immutability

- Prefer `readonly` on interface properties and class fields
- Use `as const` for literal objects and arrays
- Use `readonly` arrays in function signatures where mutation is not needed

### Other Rules

- **No `any`** -- use `unknown` and narrow with type guards
- **No default exports** -- named exports only (config files excepted)
- **No `console.log`** -- use structured logging
- **Semicolons** required
- **Single quotes** for strings
- **2-space indentation**
- **Trailing commas** in multiline structures

## Pull Request Process

`main` is protected. Every change lands through a pull request, squash-merged, and the merge is the release.

### Before Submitting

Run the same gate CI runs, plus the local SAST scan (requires the [CodeQL CLI](https://github.com/github/codeql-cli-binaries)):

```bash
npm run check
npm run sast
```

`check` runs typecheck, Biome, tests and build with zero errors and zero warnings. `sast` runs CodeQL `security-extended` against the working tree and fails on any finding.

### Required Checks

| Check             | What it runs                                                                      |
| ----------------- | --------------------------------------------------------------------------------- |
| `CI`              | `npm run check`, production dependency audit, registry signature audit            |
| `SAST` / `CodeQL` | CodeQL `security-extended` for TypeScript and GitHub Actions; fails on new alerts |

Your branch must be up to date with `main` before it can merge (use **Update branch** on the PR).

### Releases

Bump `version` in `package.json` and add a `CHANGELOG.md` entry in the PR. On merge, the release workflow publishes that version to npm with provenance and creates the `v<version>` tag and GitHub release. No checks run after merge; a merge without a version bump publishes nothing.

### Commit Messages

Use conventional commit style:

```
feat: add new tool for X
fix: handle edge case in Y
docs: update README with Z
test: add coverage for W
refactor: simplify V
```

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
