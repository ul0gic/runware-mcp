// Does:  Builds a RunwareClient stand-in whose methods are vi.fn() with empty default results.
// Holds: No network; callers override any method through the partial they pass in.

import { vi } from 'vitest';

import type { RunwareClient } from '../../src/integrations/runware/client.js';

export function createMockClient(overrides?: Partial<RunwareClient>): RunwareClient {
  return {
    request: vi.fn().mockResolvedValue({ data: [] }),
    requestSingle: vi.fn().mockResolvedValue({}),
    generateTaskUUID: vi.fn().mockReturnValue('mock-task-uuid'),
    ...overrides,
  } as unknown as RunwareClient;
}
