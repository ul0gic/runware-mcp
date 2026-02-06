/**
 * Unit tests for the watch folder tool.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('../../../src/shared/rate-limiter.js', () => ({
  defaultRateLimiter: {
    waitForToken: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../../src/shared/config.js', () => ({
  config: {
    RUNWARE_API_KEY: 'test-api-key-that-is-at-least-32-characters-long',
    REQUEST_TIMEOUT_MS: 60000,
    POLL_MAX_ATTEMPTS: 150,
    MAX_FILE_SIZE_MB: 50,
    ALLOWED_FILE_ROOTS: [],
    LOG_LEVEL: 'error',
    NODE_ENV: 'test',
    RATE_LIMIT_MAX_TOKENS: 10,
    RATE_LIMIT_REFILL_RATE: 1,
    WATCH_FOLDERS: [],
    WATCH_DEBOUNCE_MS: 500,
  },
  API_BASE_URL: 'https://api.runware.ai/v1',
}));

vi.mock('../../../src/shared/file-utils.js', () => ({
  readFileAsBase64: vi.fn().mockResolvedValue('base64data'),
  validateFilePath: vi.fn().mockResolvedValue('/valid/path'),
  getFileMimeType: vi.fn().mockReturnValue('image/jpeg'),
  validateFileSize: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../src/shared/folder-utils.js', () => ({
  validateFolder: vi.fn().mockResolvedValue('/valid/folder'),
  getImagesInFolder: vi.fn().mockResolvedValue(['/valid/folder/image1.jpg']),
  IMAGE_EXTENSIONS: new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp']),
}));

// Mock node:fs watch
vi.mock('node:fs', () => ({
  watch: vi.fn().mockReturnValue({
    close: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    removeAllListeners: vi.fn(),
    listeners: vi.fn().mockReturnValue([]),
    emit: vi.fn(),
    eventNames: vi.fn().mockReturnValue([]),
    listenerCount: vi.fn().mockReturnValue(0),
    prependListener: vi.fn(),
    prependOnceListener: vi.fn(),
    off: vi.fn(),
    rawListeners: vi.fn().mockReturnValue([]),
    setMaxListeners: vi.fn(),
    getMaxListeners: vi.fn().mockReturnValue(10),
    ref: vi.fn(),
    unref: vi.fn(),
  }),
}));

// Mock underlying tool handlers
vi.mock('../../../src/tools/image-upscale/index.js', () => ({
  imageUpscale: vi.fn(),
}));

vi.mock('../../../src/tools/image-background-removal/index.js', () => ({
  imageBackgroundRemoval: vi.fn(),
}));

vi.mock('../../../src/tools/image-caption/index.js', () => ({
  imageCaption: vi.fn(),
}));

vi.mock('../../../src/tools/vectorize/index.js', () => ({
  vectorize: vi.fn(),
}));

vi.mock('../../../src/tools/controlnet-preprocess/index.js', () => ({
  controlNetPreprocess: vi.fn(),
}));

// ============================================================================
// Imports
// ============================================================================

import { watchFolder, watchFolderToolDefinition, stopAllWatchers } from '../../../src/tools/watch-folder/handler.js';
import { watchFolderInputSchema } from '../../../src/tools/watch-folder/schema.js';
import type { RunwareClient } from '../../../src/integrations/runware/client.js';

// ============================================================================
// Helpers
// ============================================================================

function createMockClient() {
  return {
    request: vi.fn(),
    requestSingle: vi.fn(),
    generateTaskUUID: vi.fn().mockReturnValue('mock-uuid'),
  } as unknown as RunwareClient;
}

// ============================================================================
// Tests
// ============================================================================

describe('watchFolder', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
    // Clean up any watchers from previous tests
    stopAllWatchers();
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(watchFolderToolDefinition.name).toBe('watchFolder');
    });

    it('should require action', () => {
      expect(watchFolderToolDefinition.inputSchema.required).toContain('action');
    });

    it('should have a description', () => {
      expect(watchFolderToolDefinition.description).toBeTruthy();
    });
  });

  describe('schema validation', () => {
    it('should accept list action with no other params', () => {
      const result = watchFolderInputSchema.safeParse({
        action: 'list',
      });
      expect(result.success).toBe(true);
    });

    it('should accept status action with no watcherId', () => {
      const result = watchFolderInputSchema.safeParse({
        action: 'status',
      });
      expect(result.success).toBe(true);
    });

    it('should accept start action with required params', () => {
      const result = watchFolderInputSchema.safeParse({
        action: 'start',
        folderPath: '/valid/folder',
        operation: 'upscale',
      });
      expect(result.success).toBe(true);
    });

    it('should reject start action without folderPath', () => {
      const result = watchFolderInputSchema.safeParse({
        action: 'start',
        operation: 'upscale',
      });
      expect(result.success).toBe(false);
    });

    it('should reject start action without operation', () => {
      const result = watchFolderInputSchema.safeParse({
        action: 'start',
        folderPath: '/valid/folder',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid action', () => {
      const result = watchFolderInputSchema.safeParse({
        action: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('should reject stop action without watcherId', () => {
      const result = watchFolderInputSchema.safeParse({
        action: 'stop',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('list action', () => {
    it('should return empty list when no watchers', async () => {
      const input = watchFolderInputSchema.parse({
        action: 'list',
      });

      const result = await watchFolder(input, mockClient);

      expect(result.status).toBe('success');

      const data = result.data as { action: string; watchers?: unknown[]; message: string };
      expect(data.action).toBe('list');
      expect(data.watchers).toBeDefined();
      expect(data.message).toContain('0');
    });
  });

  describe('start action', () => {
    it('should start watching a folder', async () => {
      const input = watchFolderInputSchema.parse({
        action: 'start',
        folderPath: '/valid/folder',
        operation: 'upscale',
      });

      const result = await watchFolder(input, mockClient);

      expect(result.status).toBe('success');

      const data = result.data as { action: string; watcherId?: string; message: string };
      expect(data.action).toBe('start');
      expect(data.watcherId).toBeDefined();
      expect(data.message).toContain('Started watching');
    });
  });

  describe('status action', () => {
    it('should report overall status when no watcherId provided', async () => {
      const input = watchFolderInputSchema.parse({
        action: 'status',
      });

      const result = await watchFolder(input, mockClient);

      expect(result.status).toBe('success');

      const data = result.data as { action: string; message: string };
      expect(data.action).toBe('status');
      expect(data.message).toContain('active watcher');
    });
  });

  describe('stop action', () => {
    it('should return watcher not found for unknown ID', async () => {
      const input = watchFolderInputSchema.parse({
        action: 'stop',
        watcherId: '00000000-0000-4000-8000-000000000000',
      });

      const result = await watchFolder(input, mockClient);

      expect(result.status).toBe('success');

      const data = result.data as { action: string; message: string };
      expect(data.action).toBe('stop');
      expect(data.message).toContain('Watcher not found');
    });

    it('should stop an active watcher', async () => {
      // First start a watcher
      const startInput = watchFolderInputSchema.parse({
        action: 'start',
        folderPath: '/valid/folder',
        operation: 'upscale',
      });

      const startResult = await watchFolder(startInput, mockClient);
      const startData = startResult.data as { watcherId?: string };
      const watcherId = startData.watcherId;
      expect(watcherId).toBeDefined();

      // Then stop it
      const stopInput = watchFolderInputSchema.parse({
        action: 'stop',
        watcherId,
      });

      const stopResult = await watchFolder(stopInput, mockClient);

      expect(stopResult.status).toBe('success');
      const stopData = stopResult.data as { action: string; message: string };
      expect(stopData.action).toBe('stop');
      expect(stopData.message).toContain('Stopped watching');
    });
  });

  describe('start then list', () => {
    it('should show started watcher in list', async () => {
      const startInput = watchFolderInputSchema.parse({
        action: 'start',
        folderPath: '/valid/folder',
        operation: 'caption',
      });

      await watchFolder(startInput, mockClient);

      const listInput = watchFolderInputSchema.parse({
        action: 'list',
      });

      const listResult = await watchFolder(listInput, mockClient);

      const data = listResult.data as { watchers?: { folderPath: string; operation: string }[] };
      expect(data.watchers).toBeDefined();
      expect(data.watchers?.length).toBeGreaterThanOrEqual(1);
    });
  });
});
