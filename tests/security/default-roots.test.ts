// Does:  Proves the default allowed roots exclude world-writable /tmp while ALLOWED_FILE_ROOTS can opt into it.
// Holds: Uses a real mkdtemp file under the system temp dir; only config is mocked, with roots changed per test.

import { mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mockConfig = vi.hoisted(() => {
  const allowedRoots: string[] = [];
  return {
    RUNWARE_API_KEY: 'test-key-that-is-at-least-32-characters-long',
    NODE_ENV: 'test',
    LOG_LEVEL: 'error',
    MAX_FILE_SIZE_MB: 50,
    ALLOWED_FILE_ROOTS: allowedRoots,
    REQUEST_TIMEOUT_MS: 60000,
    POLL_MAX_ATTEMPTS: 150,
    RATE_LIMIT_MAX_TOKENS: 10,
    RATE_LIMIT_REFILL_RATE: 1,
    WATCH_FOLDERS: [],
    WATCH_DEBOUNCE_MS: 500,
  };
});

vi.mock('../../src/shared/config.js', () => ({
  config: mockConfig,
  getMaxFileSizeBytes: () => 50 * 1024 * 1024,
}));

import { PathTraversalError } from '../../src/shared/errors.js';
import { isPathSafe, resolveAndValidatePath } from '../../src/shared/file-utils.js';

let dir = '';
let file = '';

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'runware-default-'));
  file = path.join(dir, 'photo.png');
  await writeFile(file, 'png');
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

beforeEach(() => {
  mockConfig.ALLOWED_FILE_ROOTS.length = 0;
});

describe('default allowed roots', () => {
  it('do not include /tmp', () => {
    expect(isPathSafe('/tmp/photo.png')).toBe(false);
  });

  it('do not include the real path of /tmp', async () => {
    expect(isPathSafe(path.join(await realpath('/tmp'), 'photo.png'))).toBe(false);
  });

  it('refuse a real file in the system temp directory', async () => {
    await expect(resolveAndValidatePath(file)).rejects.toThrow(PathTraversalError);
  });

  it('allow /tmp when ALLOWED_FILE_ROOTS opts into it explicitly', async () => {
    mockConfig.ALLOWED_FILE_ROOTS.push(tmpdir());

    await expect(resolveAndValidatePath(file)).resolves.toBe(await realpath(file));
  });
});
