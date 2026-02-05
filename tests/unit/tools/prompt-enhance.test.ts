/**
 * Unit tests for the prompt enhance tool.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('../../../src/database/operations.js', () => ({
  recordAnalytics: vi.fn(),
  saveGeneration: vi.fn(),
}));

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
    ENABLE_DATABASE: false,
    LOG_LEVEL: 'error',
    NODE_ENV: 'test',
    RATE_LIMIT_MAX_TOKENS: 10,
    RATE_LIMIT_REFILL_RATE: 1,
    DATABASE_PATH: ':memory:',
    WATCH_FOLDERS: [],
    WATCH_DEBOUNCE_MS: 500,
  },
  API_BASE_URL: 'https://api.runware.ai/v1',
}));

// ============================================================================
// Imports
// ============================================================================

import { promptEnhance, promptEnhanceToolDefinition } from '../../../src/tools/prompt-enhance/handler.js';
import { promptEnhanceInputSchema } from '../../../src/tools/prompt-enhance/schema.js';
import type { RunwareClient } from '../../../src/integrations/runware/client.js';

// ============================================================================
// Helpers
// ============================================================================

function createMockClient() {
  return {
    request: vi.fn(),
    requestSingle: vi.fn(),
    generateTaskUUID: vi.fn().mockReturnValue('mock-uuid'),
  } as unknown as RunwareClient;
}

// ============================================================================
// Tests
// ============================================================================

describe('promptEnhance', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(promptEnhanceToolDefinition.name).toBe('promptEnhance');
    });

    it('should require prompt', () => {
      expect(promptEnhanceToolDefinition.inputSchema.required).toContain('prompt');
    });

    it('should have a description', () => {
      expect(promptEnhanceToolDefinition.description).toBeTruthy();
    });
  });

  describe('schema validation', () => {
    it('should accept valid input', () => {
      const result = promptEnhanceInputSchema.safeParse({
        prompt: 'a cat',
      });
      expect(result.success).toBe(true);
    });

    it('should apply defaults', () => {
      const result = promptEnhanceInputSchema.safeParse({
        prompt: 'a cat',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.promptVersions).toBe(1);
        expect(result.data.includeCost).toBe(true);
      }
    });

    it('should accept promptMaxLength', () => {
      const result = promptEnhanceInputSchema.safeParse({
        prompt: 'a cat',
        promptMaxLength: 200,
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty prompt', () => {
      const result = promptEnhanceInputSchema.safeParse({
        prompt: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject prompt over 300 chars', () => {
      const result = promptEnhanceInputSchema.safeParse({
        prompt: 'x'.repeat(301),
      });
      expect(result.success).toBe(false);
    });

    it('should reject promptVersions over 5', () => {
      const result = promptEnhanceInputSchema.safeParse({
        prompt: 'a cat',
        promptVersions: 6,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('handler success case', () => {
    it('should return success with enhanced prompt', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
        taskType: 'promptEnhance',
        taskUUID: 'task-uuid',
        text: 'A majestic cat sitting gracefully, detailed fur, warm lighting, photorealistic',
        cost: 0.001,
      });

      const input = promptEnhanceInputSchema.parse({
        prompt: 'a cat',
        promptVersions: 1,
      });

      const result = await promptEnhance(input, mockClient);

      expect(result.status).toBe('success');
      expect(result.message).toContain('1 variation');

      const data = result.data as { enhancedPrompts: string[]; cost?: number };
      expect(data.enhancedPrompts).toHaveLength(1);
      expect(data.enhancedPrompts[0]).toContain('majestic cat');
    });

    it('should handle multiple versions', async () => {
      let callCount = 0;
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount += 1;
        return Promise.resolve({
          taskType: 'promptEnhance',
          taskUUID: `task-uuid-${callCount}`,
          text: `Enhanced prompt version ${callCount}`,
          cost: 0.001,
        });
      });

      const input = promptEnhanceInputSchema.parse({
        prompt: 'a dog',
        promptVersions: 3,
      });

      const result = await promptEnhance(input, mockClient);

      expect(result.status).toBe('success');
      expect(result.message).toContain('3 variations');

      const data = result.data as { enhancedPrompts: string[] };
      expect(data.enhancedPrompts).toHaveLength(3);
    });
  });

  describe('handler error case', () => {
    it('should return error when client throws', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Rate limit exceeded'),
      );

      const input = promptEnhanceInputSchema.parse({
        prompt: 'a cat',
      });

      const result = await promptEnhance(input, mockClient);

      expect(result.status).toBe('error');
      expect(result.message).toContain('Rate limit exceeded');
    });
  });

  describe('cost tracking', () => {
    it('should aggregate cost across multiple versions', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
        taskType: 'promptEnhance',
        taskUUID: 'task-uuid',
        text: 'enhanced prompt',
        cost: 0.002,
      });

      const input = promptEnhanceInputSchema.parse({
        prompt: 'a cat',
        promptVersions: 2,
      });

      const result = await promptEnhance(input, mockClient);

      expect(result.status).toBe('success');
      expect(result.cost).toBe(0.004);
    });
  });
});
