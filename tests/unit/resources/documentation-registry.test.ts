// Does:  Proves every relatedDocs link in the documentation registry points at a registered doc other than itself.
// Holds: The real registry is loaded through provider.js; only config is mocked because it validates env at import.
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

// Why: Docs register through side-effect imports reached from provider.js; without it the registry is empty.
import '../../../src/resources/documentation/provider.js';

import { listDocResources } from '../../../src/resources/documentation/registry.js';

describe('documentation registry cross-references', () => {
  it('all relatedDocs URIs point to docs that actually exist in the registry', () => {
    const allDocs = listDocResources();
    const validUris = new Set(allDocs.map((doc) => `runware://docs/${doc.category}/${doc.id}`));

    for (const doc of allDocs) {
      for (const uri of doc.content.relatedDocs ?? []) {
        expect(validUris.has(uri)).toBe(true);
      }
    }
  });

  it('no doc references itself in relatedDocs', () => {
    for (const doc of listDocResources()) {
      if (doc.content.relatedDocs === undefined) {
        continue;
      }
      expect(doc.content.relatedDocs).not.toContain(`runware://docs/${doc.category}/${doc.id}`);
    }
  });
});
