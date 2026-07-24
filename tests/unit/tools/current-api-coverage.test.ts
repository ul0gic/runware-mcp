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
  defaultRateLimiter: {
    waitForToken: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../../src/integrations/runware/polling.js', () => ({
  pollForResult: vi.fn(),
}));

import type { RunwareClient } from '../../../src/integrations/runware/client.js';
import { pollForResult } from '../../../src/integrations/runware/polling.js';
import {
  CURRENT_TASK_DETAILS,
  CURRENT_TEXT_RESULT,
  CURRENT_THREE_D_RESULT,
} from '../../fixtures/current-api-contracts.js';
import {
  accountManagement,
  accountManagementInputSchema,
} from '../../../src/tools/account-management/index.js';
import { getTaskDetails } from '../../../src/tools/task-details/index.js';
import { mediaStorageInputSchema } from '../../../src/tools/media-storage/index.js';
import { modelUpload, modelUploadInputSchema } from '../../../src/tools/model-upload/index.js';
import { runInferenceInputSchema } from '../../../src/tools/run-inference/index.js';
import { textInference, textInferenceInputSchema } from '../../../src/tools/text-inference/index.js';
import { threeDInference } from '../../../src/tools/three-d-inference/index.js';
import { training, trainingInputSchema } from '../../../src/tools/training/index.js';

function createMockClient(): RunwareClient {
  return {
    request: vi.fn().mockResolvedValue({ data: [] }),
    requestSingle: vi.fn(),
    generateTaskUUID: vi.fn(),
  } as unknown as RunwareClient;
}

describe('current Runware API coverage', () => {
  let client: RunwareClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = createMockClient();
  });

  it('sends current account usage operations and redacts secret-like response values', async () => {
    (client.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
      operation: 'getDetails',
      apiKeys: [{ apiKeyUUID: 'safe-id', keyValue: 'secret-value' }],
    });

    const input = accountManagementInputSchema.parse({ operation: 'getDetails' });
    const result = await accountManagement(input, client);

    expect(result.status).toBe('success');
    expect(result.data).toEqual({
      operation: 'getDetails',
      apiKeys: [{ apiKeyUUID: 'safe-id', keyValue: '[REDACTED]' }],
    });
  });

  it('requires date ranges for usage analytics', () => {
    expect(accountManagementInputSchema.safeParse({
      operation: 'getUsageActivity',
    }).success).toBe(false);
  });

  it('retrieves current untyped task details envelopes', async () => {
    (client.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue(CURRENT_TASK_DETAILS);
    const result = await getTaskDetails(
      { taskUUID: CURRENT_TASK_DETAILS.taskUUID },
      client,
    );

    expect(result.status).toBe('success');
    expect(result.data).toEqual(CURRENT_TASK_DETAILS);
  });

  it('returns text, finish reason, usage, and cost', async () => {
    (client.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [CURRENT_TEXT_RESULT],
    });
    const input = textInferenceInputSchema.parse({
      model: 'anthropic:claude@opus-4.8',
      messages: [{ role: 'user', content: 'Write a haiku.' }],
    });
    const result = await textInference(input, client);

    expect(result.status).toBe('success');
    expect(result.cost).toBe(0.0005);
    expect(result.data).toMatchObject({ results: [CURRENT_TEXT_RESULT] });
  });

  it('normalizes multi-file 3D output', async () => {
    vi.mocked(pollForResult).mockResolvedValue({
      result: CURRENT_THREE_D_RESULT,
      attempts: 2,
      elapsedMs: 3000,
    });
    const result = await threeDInference({
      model: 'tripo:v3.1@0',
      positivePrompt: 'A vintage camera',
      parameters: {},
      includeCost: true,
    }, client);

    expect(result.status).toBe('success');
    expect(result.data).toMatchObject({
      files: CURRENT_THREE_D_RESULT.outputs.files,
      pollingAttempts: 2,
    });
  });

  it('blocks administrative fields in generic inference parameters', () => {
    expect(runInferenceInputSchema.safeParse({
      model: 'runware:400@1',
      parameters: { operation: 'delete' },
    }).success).toBe(false);
  });

  it('requires a UUID for media deletion', () => {
    expect(mediaStorageInputSchema.safeParse({
      operation: 'delete',
      media: 'not-a-uuid',
    }).success).toBe(false);
  });

  it('requires HTTPS model download URLs', () => {
    expect(modelUploadInputSchema.safeParse({
      category: 'lora',
      architecture: 'flux1d',
      name: 'Unsafe model',
      version: '1',
      downloadURL: 'http://example.com/model.safetensors',
    }).success).toBe(false);
  });

  it('submits explicit model uploads asynchronously', async () => {
    vi.mocked(pollForResult).mockResolvedValue({
      result: {
        taskType: 'modelUpload',
        taskUUID: 'a770f077-f413-47de-9dac-be0b26a35da6',
        status: 'success',
        air: 'myorg:42@1',
      },
      attempts: 3,
      elapsedMs: 5000,
    });
    const input = modelUploadInputSchema.parse({
      category: 'checkpoint',
      architecture: 'flux1d',
      name: 'My model',
      version: '1',
      downloadURL: 'https://example.com/model.safetensors',
    });
    const result = await modelUpload(input, client);

    expect(result.status).toBe('success');
    expect(result.message).toContain('myorg:42@1');
  });

  it('submits model-specific training parameters and normalizes outputs', async () => {
    vi.mocked(pollForResult).mockResolvedValue({
      result: {
        taskType: 'training',
        taskUUID: 'a770f077-f413-47de-9dac-be0b26a35da6',
        status: 'success',
        air: 'myorg:trained@1',
        outputs: { files: [{ uuid: 'file-uuid', url: 'https://example.com/lora.safetensors' }] },
        cost: 1,
      },
      attempts: 10,
      elapsedMs: 30_000,
    });
    const input = trainingInputSchema.parse({
      model: 'runware:flux-2-klein-4b@style-lora-training',
      dataset: 'https://example.com/dataset.zip',
      importModel: { air: 'myorg:trained@1', name: 'My trained style' },
      parameters: { trainingSteps: 1000, triggerWord: 'MY_STYLE' },
    });
    const result = await training(input, client);

    expect(result.status).toBe('success');
    expect(result.cost).toBe(1);
    expect(result.data).toMatchObject({ air: 'myorg:trained@1' });
  });
});
