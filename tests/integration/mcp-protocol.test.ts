// Does:  Every advertised tool definition has an invoker and every invoker is advertised.
// Holds: config is mocked; the real tool registry from src/tools/index is loaded.

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/shared/config.js', () => ({
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

import { toolDefinitions, toolInvokers } from '../../src/tools/index.js';

describe('tool registry', () => {
  it('every tool definition name has a corresponding handler', () => {
    const handlerNames = new Set(Object.keys(toolInvokers));
    for (const def of toolDefinitions) {
      expect(handlerNames.has(def.name)).toBe(true);
    }
  });

  it('every handler name has a corresponding tool definition', () => {
    const definitionNames = new Set<string>(toolDefinitions.map((d) => d.name));
    for (const name of Object.keys(toolInvokers)) {
      expect(definitionNames.has(name)).toBe(true);
    }
  });
});
