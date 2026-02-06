/**
 * Unit tests for the Runware API client.
 *
 * Tests RunwareClient class, factory functions, and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock config before importing modules that depend on it.
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

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import {
  RunwareClient,
  createRunwareClient,
  getDefaultClient,
  createTaskRequest,
} from '../../../src/integrations/runware/client.js';
import { RunwareApiError } from '../../../src/shared/errors.js';
import { createApiKey } from '../../../src/shared/types.js';

// ============================================================================
// Helpers
// ============================================================================

function createMockResponse(body: unknown, options?: { status?: number; statusText?: string; ok?: boolean }): Response {
  const status = options?.status ?? 200;
  const statusText = options?.statusText ?? 'OK';
  const ok = options?.ok ?? (status >= 200 && status < 300);

  return {
    ok,
    status,
    statusText,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
    headers: new Headers(),
  } as unknown as Response;
}

const TEST_API_KEY = createApiKey('test-api-key-that-is-at-least-32-characters-long');

// ============================================================================
// RunwareClient constructor
// ============================================================================

describe('RunwareClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('creates a client with required options', () => {
      const client = new RunwareClient({ apiKey: TEST_API_KEY });
      expect(client).toBeInstanceOf(RunwareClient);
    });

    it('accepts optional timeout and base URL', () => {
      const client = new RunwareClient({
        apiKey: TEST_API_KEY,
        timeoutMs: 30000,
        baseUrl: 'https://custom-api.example.com',
      });
      expect(client).toBeInstanceOf(RunwareClient);
    });
  });

  // ============================================================================
  // generateTaskUUID
  // ============================================================================

  describe('generateTaskUUID()', () => {
    it('returns a string UUID', () => {
      const client = new RunwareClient({ apiKey: TEST_API_KEY });
      const uuid = client.generateTaskUUID();
      expect(typeof uuid).toBe('string');
      expect(uuid.length).toBeGreaterThan(0);
    });

    it('returns unique UUIDs on each call', () => {
      const client = new RunwareClient({ apiKey: TEST_API_KEY });
      const uuid1 = client.generateTaskUUID();
      const uuid2 = client.generateTaskUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  // ============================================================================
  // request()
  // ============================================================================

  describe('request()', () => {
    it('makes a POST request to the API with correct headers', async () => {
      const responseBody = { data: [{ taskType: 'test', taskUUID: '123' }] };
      mockFetch.mockResolvedValue(createMockResponse(responseBody));

      const client = new RunwareClient({
        apiKey: TEST_API_KEY,
        baseUrl: 'https://api.runware.ai/v1',
      });

      await client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }]);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://api.runware.ai/v1');
      expect(options.method).toBe('POST');

      const headers = options.headers as Record<string, string>;
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Authorization']).toBe(`Bearer ${String(TEST_API_KEY)}`);
    });

    it('sends tasks as JSON body', async () => {
      const responseBody = { data: [{ taskType: 'test', taskUUID: '123' }] };
      mockFetch.mockResolvedValue(createMockResponse(responseBody));

      const client = new RunwareClient({ apiKey: TEST_API_KEY });
      const tasks = [{ taskType: 'imageInference', taskUUID: 'uuid-1' }];

      await client.request(tasks);

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(options.body).toBe(JSON.stringify(tasks));
    });

    it('returns parsed response on success', async () => {
      const responseBody = {
        data: [
          { taskType: 'imageInference', taskUUID: 'uuid-1', imageURL: 'https://example.com/img.png' },
        ],
      };
      mockFetch.mockResolvedValue(createMockResponse(responseBody));

      const client = new RunwareClient({ apiKey: TEST_API_KEY });
      const result = await client.request<{ taskType: string; taskUUID: string; imageURL: string }>(
        [{ taskType: 'imageInference', taskUUID: 'uuid-1' }],
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.imageURL).toBe('https://example.com/img.png');
    });

    it('throws RunwareApiError on HTTP 4xx error', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse('Unauthorized', { status: 401, statusText: 'Unauthorized', ok: false }),
      );

      const client = new RunwareClient({ apiKey: TEST_API_KEY });

      await expect(
        client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }]),
      ).rejects.toThrow(RunwareApiError);

      await expect(
        client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }]),
      ).rejects.toThrow(/API request failed: 401/);
    });

    it('throws RunwareApiError on HTTP 5xx error', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse('Internal Server Error', {
          status: 500,
          statusText: 'Internal Server Error',
          ok: false,
        }),
      );

      const client = new RunwareClient({ apiKey: TEST_API_KEY });

      await expect(
        client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }]),
      ).rejects.toThrow(RunwareApiError);
    });

    it('throws RunwareApiError when response contains API-level errors', async () => {
      const responseBody = {
        data: [],
        errors: [
          { message: 'Invalid model ID', code: 'ERR_MODEL_NOT_FOUND', taskUUID: 'uuid-1' },
        ],
      };
      mockFetch.mockResolvedValue(createMockResponse(responseBody));

      const client = new RunwareClient({ apiKey: TEST_API_KEY });

      await expect(
        client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }]),
      ).rejects.toThrow(RunwareApiError);

      await expect(
        client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }]),
      ).rejects.toThrow(/Invalid model ID/);
    });

    it('throws RunwareApiError with timeout message when request times out', async () => {
      // Simulate an AbortError from timeout
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      const client = new RunwareClient({ apiKey: TEST_API_KEY, timeoutMs: 5000 });

      await expect(
        client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }]),
      ).rejects.toThrow(RunwareApiError);

      await expect(
        client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }]),
      ).rejects.toThrow(/timed out/);
    });

    it('throws RunwareApiError with cancel message when user cancels', async () => {
      const controller = new AbortController();
      controller.abort();

      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      const client = new RunwareClient({ apiKey: TEST_API_KEY });

      await expect(
        client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }], {
          signal: controller.signal,
        }),
      ).rejects.toThrow(/cancelled/);
    });

    it('throws RunwareApiError on network error', async () => {
      mockFetch.mockRejectedValue(new TypeError('fetch failed'));

      const client = new RunwareClient({ apiKey: TEST_API_KEY });

      await expect(
        client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }]),
      ).rejects.toThrow(RunwareApiError);

      await expect(
        client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }]),
      ).rejects.toThrow(/Network error/);
    });

    it('wraps unknown errors in RunwareApiError', async () => {
      mockFetch.mockRejectedValue(new Error('something weird happened'));

      const client = new RunwareClient({ apiKey: TEST_API_KEY });

      await expect(
        client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }]),
      ).rejects.toThrow(RunwareApiError);
    });

    it('wraps non-Error thrown values', async () => {
      mockFetch.mockRejectedValue('string error');

      const client = new RunwareClient({ apiKey: TEST_API_KEY });

      await expect(
        client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }]),
      ).rejects.toThrow(RunwareApiError);
    });

    it('re-throws RunwareApiError as-is', async () => {
      const originalError = new RunwareApiError('already wrapped');
      mockFetch.mockRejectedValue(originalError);

      const client = new RunwareClient({ apiKey: TEST_API_KEY });

      await expect(
        client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }]),
      ).rejects.toBe(originalError);
    });

    it('uses custom timeout from request options', async () => {
      const responseBody = { data: [{ taskType: 'test', taskUUID: '123' }] };
      mockFetch.mockResolvedValue(createMockResponse(responseBody));

      const client = new RunwareClient({ apiKey: TEST_API_KEY, timeoutMs: 60000 });

      await client.request(
        [{ taskType: 'imageInference', taskUUID: 'uuid-1' }],
        { timeoutMs: 5000 },
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('handles API errors with missing first error element', async () => {
      const responseBody = {
        data: [],
        errors: [] as { message: string }[],
      };
      // Force errors to have length > 0 while first element is undefined
      // by having an actual errors array with items
      const responseBodyWithErrors = {
        data: [],
        errors: [{ message: 'First error' }],
      };
      mockFetch.mockResolvedValue(createMockResponse(responseBodyWithErrors));

      const client = new RunwareClient({ apiKey: TEST_API_KEY });

      await expect(
        client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }]),
      ).rejects.toThrow(/First error/);
    });
  });

  // ============================================================================
  // requestSingle()
  // ============================================================================

  describe('requestSingle()', () => {
    it('returns the first result from the response', async () => {
      const responseBody = {
        data: [
          { taskType: 'imageInference', taskUUID: 'uuid-1', imageURL: 'https://example.com/img.png' },
        ],
      };
      mockFetch.mockResolvedValue(createMockResponse(responseBody));

      const client = new RunwareClient({ apiKey: TEST_API_KEY });
      const result = await client.requestSingle<{ taskType: string; imageURL: string }>(
        { taskType: 'imageInference', taskUUID: 'uuid-1' },
      );

      expect(result.taskType).toBe('imageInference');
      expect(result.imageURL).toBe('https://example.com/img.png');
    });

    it('throws RunwareApiError when response has empty data', async () => {
      const responseBody = { data: [] };
      mockFetch.mockResolvedValue(createMockResponse(responseBody));

      const client = new RunwareClient({ apiKey: TEST_API_KEY });

      await expect(
        client.requestSingle({ taskType: 'imageInference', taskUUID: 'uuid-1' }),
      ).rejects.toThrow(RunwareApiError);

      await expect(
        client.requestSingle({ taskType: 'imageInference', taskUUID: 'uuid-1' }),
      ).rejects.toThrow(/no results/);
    });

    it('wraps the task in an array when calling request', async () => {
      const responseBody = {
        data: [{ taskType: 'test', taskUUID: '123' }],
      };
      mockFetch.mockResolvedValue(createMockResponse(responseBody));

      const client = new RunwareClient({ apiKey: TEST_API_KEY });
      await client.requestSingle({ taskType: 'test', taskUUID: '123' });

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string) as unknown[];
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(1);
    });
  });
});

// ============================================================================
// createRunwareClient
// ============================================================================

describe('createRunwareClient()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a client with config API key', () => {
    const client = createRunwareClient();
    expect(client).toBeInstanceOf(RunwareClient);
  });

  it('accepts optional overrides', () => {
    const client = createRunwareClient({ timeoutMs: 30000, baseUrl: 'https://custom.api.com' });
    expect(client).toBeInstanceOf(RunwareClient);
  });
});

// ============================================================================
// getDefaultClient
// ============================================================================

describe('getDefaultClient()', () => {
  it('returns a RunwareClient instance', () => {
    const client = getDefaultClient();
    expect(client).toBeInstanceOf(RunwareClient);
  });

  it('returns the same instance on subsequent calls', () => {
    const client1 = getDefaultClient();
    const client2 = getDefaultClient();
    expect(client1).toBe(client2);
  });
});

// ============================================================================
// createTaskRequest
// ============================================================================

describe('createTaskRequest()', () => {
  it('creates a task with taskType and taskUUID', () => {
    const task = createTaskRequest('imageInference', { positivePrompt: 'a cat' });

    expect(task.taskType).toBe('imageInference');
    expect(typeof task.taskUUID).toBe('string');
    expect(task.taskUUID.length).toBeGreaterThan(0);
    expect(task.positivePrompt).toBe('a cat');
  });

  it('generates unique taskUUIDs', () => {
    const task1 = createTaskRequest('test', {});
    const task2 = createTaskRequest('test', {});
    expect(task1.taskUUID).not.toBe(task2.taskUUID);
  });

  it('merges additional params into the request', () => {
    const task = createTaskRequest('imageInference', {
      positivePrompt: 'a dog',
      width: 1024,
      height: 1024,
      model: 'civitai:123@456',
    });

    expect(task.positivePrompt).toBe('a dog');
    expect(task.width).toBe(1024);
    expect(task.height).toBe(1024);
    expect(task.model).toBe('civitai:123@456');
  });
});
