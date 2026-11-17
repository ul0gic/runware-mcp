// Does:  Proves HTTP error bodies reach tool output only as a bounded code and message that never contain the API key.
// Holds: Global fetch and config are mocked; the real RunwareClient, error mapping and imageUpload handler run.

import { beforeEach, describe, expect, it, vi } from 'vitest';

const API_KEY = 'fake-runware-key-for-redaction-tests-0123456789';

vi.mock('../../src/shared/rate-limiter.js', () => ({
  defaultRateLimiter: { waitForToken: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../../src/shared/config.js', () => ({
  config: {
    RUNWARE_API_KEY: 'fake-runware-key-for-redaction-tests-0123456789',
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
  getMaxFileSizeBytes: () => 50 * 1024 * 1024,
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { RunwareClient } from '../../src/integrations/runware/client.js';
import { RunwareApiError } from '../../src/shared/errors.js';
import { createApiKey } from '../../src/shared/types.js';
import { imageUpload } from '../../src/tools/image-upload/index.js';

const client = new RunwareClient({ apiKey: createApiKey(API_KEY) });

function respond(status: number, body: string, statusText = 'Unauthorized'): void {
  mockFetch.mockResolvedValue(new Response(body, { status, statusText }));
}

async function uploadOutput(): Promise<string> {
  const result = await imageUpload({ url: 'https://example.com/a.png' }, client);
  expect(result.status).toBe('error');
  return JSON.stringify(result);
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('HTTP error redaction', () => {
  it('keeps the API key out of tool output when a 401 JSON body echoes it', async () => {
    respond(401, JSON.stringify({ errors: [{ code: 'invalidApiKey', message: `Invalid API key: ${API_KEY}` }] }));

    const output = await uploadOutput();

    expect(output).not.toContain(API_KEY);
    expect(output).toContain('invalidApiKey');
  });

  it('keeps the API key out of tool output when a plain-text body echoes it', async () => {
    respond(401, `Bearer ${API_KEY} rejected`);

    expect(await uploadOutput()).not.toContain(API_KEY);
  });

  it('keeps the API key out of tool output when statusText echoes it', async () => {
    respond(401, 'denied', `bad key ${API_KEY}`);

    expect(await uploadOutput()).not.toContain(API_KEY);
  });

  it('bounds a large unstructured error body', async () => {
    respond(500, 'x'.repeat(100_000), 'Internal Server Error');

    expect((await uploadOutput()).length).toBeLessThan(1000);
  });

  it('reports the structured Runware code and message, not the raw body', async () => {
    respond(
      400,
      JSON.stringify({ errors: [{ code: 'invalidModel', message: 'Unknown model', extra: 'z'.repeat(5000) }] }),
    );

    const error = await client.request([{ taskType: 'imageUpload', taskUUID: 'u' }]).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(RunwareApiError);
    expect(error).toMatchObject({ data: { apiCode: 'invalidModel', statusCode: 400 } });
    expect(JSON.stringify(error instanceof RunwareApiError ? error.toJsonRpcError() : null)).not.toContain('zzzz');
  });

  it('keeps the API key out of API-level errors in a successful response', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ data: [], errors: [{ code: 'x', message: `key ${API_KEY}` }] }), { status: 200 }),
    );

    expect(await uploadOutput()).not.toContain(API_KEY);
  });
});
