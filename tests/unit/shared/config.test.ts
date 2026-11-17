// Does:  Proves getMaxFileSizeBytes converts the env-configured MAX_FILE_SIZE_MB to bytes.
// Holds: The real config module is loaded against a stubbed environment; nothing is mocked.

import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('getMaxFileSizeBytes', () => {
  it('returns MAX_FILE_SIZE_MB converted to bytes', async () => {
    vi.stubEnv('RUNWARE_API_KEY', 'test-key-that-is-at-least-32-characters-long-enough');
    vi.stubEnv('MAX_FILE_SIZE_MB', '7');
    vi.resetModules();
    const { getMaxFileSizeBytes } = await import('../../../src/shared/config.js');

    expect(getMaxFileSizeBytes()).toBe(7 * 1024 * 1024);
  });
});
