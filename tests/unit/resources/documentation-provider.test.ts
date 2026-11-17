// Does:  Proves every listed documentation URI resolves to its doc and malformed or unknown URIs resolve to null.
// Holds: The real doc registry is loaded; only config is mocked because config.ts validates env at import.
import { describe, expect, it, vi } from 'vitest';

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

import { documentationProvider } from '../../../src/resources/documentation/provider.js';

import type { DocResource } from '../../../src/resources/documentation/types.js';

describe('documentationProvider.get()', () => {
  it('every listed URI is resolvable via get()', async () => {
    const entries = await documentationProvider.list();
    const results = await Promise.all(entries.map((entry) => documentationProvider.get(entry.uri)));
    for (const [index, entry] of entries.entries()) {
      const result = results[index];
      expect(result).not.toBeNull();
      expect(result!.uri).toBe(entry.uri);
      expect(result!.mimeType).toBe('application/json');
      expect(typeof result!.text).toBe('string');

      const doc: DocResource = JSON.parse(result!.text!);
      expect(doc.id).toBeTruthy();
      expect(doc.category).toBeTruthy();
      expect(doc.title).toBe(entry.name);
    }
  });

  it.each([
    'runware://docs/invalid/foo',
    'runware://docs/concepts/nonexistent',
    'runware://other/thing',
    '',
    'runware://docs/',
    'runware://docs/concepts',
    'https://example.com/something',
    'runware://docs/concepts/air-identifiers/extra',
  ])('returns null for %j', async (uri) => {
    expect(await documentationProvider.get(uri)).toBeNull();
  });
});
