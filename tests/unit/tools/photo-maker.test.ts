// Does:  Proves photoMaker inserts the `img` trigger word exactly once and bounds the reference image count.
// Holds: config and the rate limiter are mocked; the client is a stub, and assertions read the task it was sent.

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/shared/rate-limiter.js', () => ({
  defaultRateLimiter: {
    waitForToken: vi.fn().mockResolvedValue(undefined),
  },
}));

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

import type { RunwareClient } from '../../../src/integrations/runware/client.js';
import { photoMaker, photoMakerInputSchema } from '../../../src/tools/photo-maker/index.js';

function createMockClient(): RunwareClient {
  return {
    request: vi.fn().mockResolvedValue({
      data: [
        {
          taskType: 'photoMaker',
          taskUUID: 'uuid',
          imageUUID: 'img-uuid',
          imageURL: 'https://example.com/photo.png',
          cost: 0.02,
        },
      ],
    }),
    requestSingle: vi.fn(),
    generateTaskUUID: vi.fn().mockReturnValue('mock-uuid'),
  } as unknown as RunwareClient;
}

function sentPrompt(client: RunwareClient): string | undefined {
  const callArgs = (client.request as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
  const tasks = callArgs[0] as { positivePrompt?: string }[];
  return tasks[0]?.positivePrompt;
}

describe('photoMaker', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  it('should auto-prepend trigger word when not present', async () => {
    await photoMaker(
      photoMakerInputSchema.parse({
        positivePrompt: 'a person in a park',
        inputImages: ['https://example.com/face.jpg'],
      }),
      mockClient,
    );

    expect(sentPrompt(mockClient)).toContain('img');
  });

  it('should not duplicate trigger word when already present', async () => {
    await photoMaker(
      photoMakerInputSchema.parse({
        positivePrompt: 'img a person smiling',
        inputImages: ['https://example.com/face.jpg'],
      }),
      mockClient,
    );

    expect(sentPrompt(mockClient)).toBe('img a person smiling');
  });

  it('should reject empty inputImages array', () => {
    const result = photoMakerInputSchema.safeParse({
      positivePrompt: 'img a person',
      inputImages: [],
    });
    expect(result.success).toBe(false);
  });

  it('should reject more than 4 inputImages', () => {
    const result = photoMakerInputSchema.safeParse({
      positivePrompt: 'img a person',
      inputImages: [
        'https://example.com/1.jpg',
        'https://example.com/2.jpg',
        'https://example.com/3.jpg',
        'https://example.com/4.jpg',
        'https://example.com/5.jpg',
      ],
    });
    expect(result.success).toBe(false);
  });
});
