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
