import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/shared/config.js', () => ({
  config: {
    RUNWARE_API_KEY: 'test-api-key-that-is-at-least-32-characters-long',
    REQUEST_TIMEOUT_MS: 60_000,
    POLL_MAX_ATTEMPTS: 150,
  },
  API_BASE_URL: 'https://api.runware.ai/v1',
}));

vi.mock('../../../src/shared/rate-limiter.js', () => ({
  defaultRateLimiter: { waitForToken: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../../../src/integrations/runware/schema-registry.js', () => ({
  resolveModelSchema: vi.fn(),
}));

import type { RunwareClient } from '../../../src/integrations/runware/client.js';
import { resolveModelSchema } from '../../../src/integrations/runware/schema-registry.js';
import {
  runInference,
  runInferenceInputSchema,
} from '../../../src/tools/run-inference/index.js';

function createMockClient(): RunwareClient {
  return {
    request: vi.fn().mockResolvedValue({
      data: [{ taskType: 'imageInference', imageURL: 'https://example.com/image.jpg', cost: 0.01 }],
    }),
    requestSingle: vi.fn(),
    generateTaskUUID: vi.fn(),
  } as unknown as RunwareClient;
}

describe('runInference', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resolveModelSchema).mockResolvedValue({
      taskType: 'imageInference',
      schema: {
        type: 'object',
        properties: {
          model: { type: 'string' },
          positivePrompt: { type: 'string' },
          width: { type: 'integer', minimum: 256 },
        },
        required: ['model', 'positivePrompt'],
        additionalProperties: false,
      },
    });
  });

  it('infers the task type and validates against the live model schema', async () => {
    const client = createMockClient();
    const input = runInferenceInputSchema.parse({
      model: 'runware:400@1',
      parameters: { positivePrompt: 'A cat', width: 1024 },
      deliveryMethod: 'sync',
    });
    const result = await runInference(input, client);

    expect(result.status).toBe('success');
    expect(result.cost).toBe(0.01);
    expect(client.request).toHaveBeenCalledWith(
      [expect.objectContaining({
        taskType: 'imageInference',
        model: 'runware:400@1',
        positivePrompt: 'A cat',
        width: 1024,
      })],
      expect.any(Object),
    );
  });

  it('rejects model parameters that fail live schema validation', async () => {
    const result = await runInference(runInferenceInputSchema.parse({
      model: 'runware:400@1',
      parameters: { width: 128 },
    }), createMockClient());

    expect(result.status).toBe('error');
    expect(result.message).toContain('Model parameter validation failed');
  });

  it('does not execute administrative task types inferred by a schema', async () => {
    vi.mocked(resolveModelSchema).mockResolvedValue({
      taskType: 'modelUpload',
      schema: { type: 'object' },
    });
    const client = createMockClient();
    const result = await runInference(runInferenceInputSchema.parse({
      model: 'private:model@1',
    }), client);

    expect(result.status).toBe('error');
    expect(client.request).not.toHaveBeenCalled();
  });
});
