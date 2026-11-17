// Does:  Proves imageUpload refuses an oversized or non-image local file before reading it, and rejects unsafe URLs.
// Holds: Uses real files in a mkdtemp root; config, rate limiter and the client are mocked, the size cap is 1 KiB.

import { mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const MAX_BYTES = 1024;

const mockConfig = vi.hoisted(() => {
  const allowedRoots: string[] = [];
  return {
    RUNWARE_API_KEY: 'test-api-key-that-is-at-least-32-characters-long',
    REQUEST_TIMEOUT_MS: 60000,
    POLL_MAX_ATTEMPTS: 150,
    MAX_FILE_SIZE_MB: 1,
    ALLOWED_FILE_ROOTS: allowedRoots,
    LOG_LEVEL: 'error',
    NODE_ENV: 'test',
    RATE_LIMIT_MAX_TOKENS: 10,
    RATE_LIMIT_REFILL_RATE: 1,
    WATCH_FOLDERS: [],
    WATCH_DEBOUNCE_MS: 500,
  };
});

vi.mock('../../src/shared/rate-limiter.js', () => ({
  defaultRateLimiter: { waitForToken: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../../src/shared/config.js', () => ({
  config: mockConfig,
  API_BASE_URL: 'https://api.runware.ai/v1',
  getMaxFileSizeBytes: () => MAX_BYTES,
}));

import { RunwareClient } from '../../src/integrations/runware/client.js';
import { createApiKey } from '../../src/shared/types.js';
import { imageUpload, imageUploadInputSchema } from '../../src/tools/image-upload/index.js';

const requestSingle = vi.fn();

class StubClient extends RunwareClient {
  override requestSingle<T>(...args: Parameters<RunwareClient['requestSingle']>): Promise<T> {
    return requestSingle(...args);
  }
}

const client = new StubClient({ apiKey: createApiKey(mockConfig.RUNWARE_API_KEY) });

let root = '';

beforeAll(async () => {
  root = await realpath(await mkdtemp(path.join(tmpdir(), 'runware-upload-')));
  mockConfig.ALLOWED_FILE_ROOTS.push(root);
  await writeFile(path.join(root, 'small.png'), Buffer.alloc(MAX_BYTES - 1));
  await writeFile(path.join(root, 'huge.png'), Buffer.alloc(MAX_BYTES * 4));
  await writeFile(path.join(root, 'notes.txt'), 'not an image');
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

beforeEach(() => {
  requestSingle.mockReset();
  requestSingle.mockResolvedValue({ taskType: 'imageUpload', taskUUID: 't', imageUUID: 'img-1' });
});

describe('imageUpload local file limits', () => {
  it('refuses a file larger than the configured maximum without sending it', async () => {
    const result = await imageUpload({ filePath: path.join(root, 'huge.png') }, client);

    expect(result.status).toBe('error');
    expect(result.message).toMatch(/exceeds maximum size/i);
    expect(requestSingle).not.toHaveBeenCalled();
  });

  it('refuses a file whose extension is not an allowed image type', async () => {
    const result = await imageUpload({ filePath: path.join(root, 'notes.txt') }, client);

    expect(result.status).toBe('error');
    expect(requestSingle).not.toHaveBeenCalled();
  });

  it('uploads a file within the limit', async () => {
    const result = await imageUpload({ filePath: path.join(root, 'small.png') }, client);

    expect(result.status).toBe('success');
    expect(requestSingle).toHaveBeenCalledTimes(1);
  });
});

describe('imageUploadInputSchema URL and data URI sources', () => {
  it.each(['http://example.com/a.png', 'file:///etc/passwd', 'javascript:alert(1)', 'ftp://example.com/a.png'])(
    'rejects url %s',
    (url) => {
      expect(imageUploadInputSchema.safeParse({ url }).success).toBe(false);
    },
  );

  it('rejects a non-image data URI', () => {
    expect(imageUploadInputSchema.safeParse({ dataUri: 'data:text/html;base64,PHNjcmlwdD4=' }).success).toBe(false);
  });

  it('accepts an https url and an image data URI', () => {
    expect(imageUploadInputSchema.safeParse({ url: 'https://example.com/a.png' }).success).toBe(true);
    expect(imageUploadInputSchema.safeParse({ dataUri: 'data:image/png;base64,iVBORw0KGgo=' }).success).toBe(true);
  });
});
