// Does:  RunwareClient sends authenticated requests and maps HTTP, API, network, timeout and cancel failures.
// Holds: config and global fetch are mocked; timeouts run on fake timers against the real abort wiring.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { RunwareClient } from '../../../src/integrations/runware/client.js';
import { RunwareApiError } from '../../../src/shared/errors.js';
import { createApiKey } from '../../../src/shared/types.js';

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

describe('RunwareClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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
      expect(headers.Authorization).toBe(`Bearer ${TEST_API_KEY}`);
    });

    it('throws RunwareApiError on HTTP 4xx error', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse('Unauthorized', { status: 401, statusText: 'Unauthorized', ok: false }),
      );

      const client = new RunwareClient({ apiKey: TEST_API_KEY });

      await expect(client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }])).rejects.toThrow(
        RunwareApiError,
      );

      await expect(client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }])).rejects.toThrow(
        /API request failed: 401/,
      );
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

      await expect(client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }])).rejects.toThrow(
        RunwareApiError,
      );
    });

    it('throws RunwareApiError when response contains API-level errors', async () => {
      const responseBody = {
        data: [],
        errors: [{ message: 'Invalid model ID', code: 'ERR_MODEL_NOT_FOUND', taskUUID: 'uuid-1' }],
      };
      mockFetch.mockResolvedValue(createMockResponse(responseBody));

      const client = new RunwareClient({ apiKey: TEST_API_KEY });

      await expect(client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }])).rejects.toThrow(
        RunwareApiError,
      );

      await expect(client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }])).rejects.toThrow(
        /Invalid model ID/,
      );
    });

    it('throws RunwareApiError with timeout message when request times out', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      const client = new RunwareClient({ apiKey: TEST_API_KEY, timeoutMs: 5000 });

      await expect(client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }])).rejects.toThrow(
        RunwareApiError,
      );

      await expect(client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }])).rejects.toThrow(/timed out/);
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

      await expect(client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }])).rejects.toThrow(
        RunwareApiError,
      );

      await expect(client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }])).rejects.toThrow(
        /Network error/,
      );
    });

    it('wraps unknown errors in RunwareApiError', async () => {
      mockFetch.mockRejectedValue(new Error('something weird happened'));

      const client = new RunwareClient({ apiKey: TEST_API_KEY });

      await expect(client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }])).rejects.toThrow(
        RunwareApiError,
      );
    });

    it('wraps non-Error thrown values', async () => {
      mockFetch.mockRejectedValue('string error');

      const client = new RunwareClient({ apiKey: TEST_API_KEY });

      await expect(client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }])).rejects.toThrow(
        RunwareApiError,
      );
    });

    it('re-throws RunwareApiError as-is', async () => {
      const originalError = new RunwareApiError('already wrapped');
      mockFetch.mockRejectedValue(originalError);

      const client = new RunwareClient({ apiKey: TEST_API_KEY });

      await expect(client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }])).rejects.toBe(originalError);
    });

    it('aborts the request once the per-request timeout elapses', async () => {
      vi.useFakeTimers();
      try {
        mockFetch.mockImplementation(
          (_url: string, init: RequestInit) =>
            new Promise((_resolve, reject) => {
              init.signal?.addEventListener('abort', () => {
                const abortError = new Error('The operation was aborted');
                abortError.name = 'AbortError';
                reject(abortError);
              });
            }),
        );

        const client = new RunwareClient({ apiKey: TEST_API_KEY, timeoutMs: 60000 });
        let settled = false;
        const pending = client.request([{ taskType: 'imageInference', taskUUID: 'uuid-1' }], { timeoutMs: 5000 });
        pending
          .catch(() => undefined)
          .finally(() => {
            settled = true;
          });

        await vi.advanceTimersByTimeAsync(4999);
        expect(settled).toBe(false);

        await vi.advanceTimersByTimeAsync(1);
        await expect(pending).rejects.toThrow(/timed out after 5000ms/);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('requestSingle()', () => {
    it('throws RunwareApiError when response has empty data', async () => {
      const responseBody = { data: [] };
      mockFetch.mockResolvedValue(createMockResponse(responseBody));

      const client = new RunwareClient({ apiKey: TEST_API_KEY });

      await expect(client.requestSingle({ taskType: 'imageInference', taskUUID: 'uuid-1' })).rejects.toThrow(
        RunwareApiError,
      );

      await expect(client.requestSingle({ taskType: 'imageInference', taskUUID: 'uuid-1' })).rejects.toThrow(
        /no results/,
      );
    });
  });
});
