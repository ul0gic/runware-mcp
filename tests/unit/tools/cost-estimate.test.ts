/**
 * Unit tests for the cost estimate tool.
 */

import { describe, it, expect, vi } from 'vitest';

// ============================================================================
// Mocks
// ============================================================================

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

import { costEstimate, costEstimateToolDefinition } from '../../../src/tools/cost-estimate/handler.js';
import { costEstimateInputSchema } from '../../../src/tools/cost-estimate/schema.js';

// ============================================================================
// Tests
// ============================================================================

describe('costEstimate', () => {
  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(costEstimateToolDefinition.name).toBe('costEstimate');
    });

    it('should require taskType', () => {
      expect(costEstimateToolDefinition.inputSchema.required).toContain('taskType');
    });

    it('should have a description', () => {
      expect(costEstimateToolDefinition.description).toBeTruthy();
    });
  });

  describe('schema validation', () => {
    it('should accept valid input for imageInference', () => {
      const result = costEstimateInputSchema.safeParse({
        taskType: 'imageInference',
      });
      expect(result.success).toBe(true);
    });

    it('should apply numberResults default', () => {
      const result = costEstimateInputSchema.safeParse({
        taskType: 'imageInference',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.numberResults).toBe(1);
      }
    });

    it('should accept all valid task types', () => {
      const taskTypes = [
        'imageInference', 'photoMaker', 'upscale', 'removeBackground',
        'caption', 'imageMasking', 'videoInference', 'audioInference',
      ];
      for (const taskType of taskTypes) {
        const result = costEstimateInputSchema.safeParse({ taskType });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid taskType', () => {
      const result = costEstimateInputSchema.safeParse({
        taskType: 'invalidTask',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('imageInference estimation', () => {
    it('should estimate cost with default dimensions', () => {
      const input = costEstimateInputSchema.parse({
        taskType: 'imageInference',
      });

      const result = costEstimate(input);

      expect(result.status).toBe('success');
      expect(result.message).toContain('imageInference');
      expect(result.message).toContain('$');

      const data = result.data as { taskType: string; totalCost: number; isEstimate: boolean };
      expect(data.taskType).toBe('imageInference');
      expect(data.totalCost).toBeGreaterThan(0);
      expect(data.isEstimate).toBe(true);
    });

    it('should scale cost with custom dimensions', () => {
      const smallInput = costEstimateInputSchema.parse({
        taskType: 'imageInference',
        width: 512,
        height: 512,
      });

      const largeInput = costEstimateInputSchema.parse({
        taskType: 'imageInference',
        width: 2048,
        height: 2048,
      });

      const smallResult = costEstimate(smallInput);
      const largeResult = costEstimate(largeInput);

      const smallData = smallResult.data as { totalCost: number };
      const largeData = largeResult.data as { totalCost: number };

      expect(largeData.totalCost).toBeGreaterThan(smallData.totalCost);
    });

    it('should scale cost with numberResults', () => {
      const singleInput = costEstimateInputSchema.parse({
        taskType: 'imageInference',
        numberResults: 1,
      });

      const multiInput = costEstimateInputSchema.parse({
        taskType: 'imageInference',
        numberResults: 5,
      });

      const singleResult = costEstimate(singleInput);
      const multiResult = costEstimate(multiInput);

      const singleData = singleResult.data as { totalCost: number };
      const multiData = multiResult.data as { totalCost: number };

      expect(multiData.totalCost).toBeCloseTo(singleData.totalCost * 5, 10);
    });
  });

  describe('upscale estimation', () => {
    it('should estimate upscale cost', () => {
      const input = costEstimateInputSchema.parse({
        taskType: 'upscale',
      });

      const result = costEstimate(input);

      expect(result.status).toBe('success');
      const data = result.data as { taskType: string; totalCost: number };
      expect(data.taskType).toBe('upscale');
      expect(data.totalCost).toBeGreaterThan(0);
    });
  });

  describe('videoInference estimation', () => {
    it('should estimate video cost based on duration', () => {
      const input = costEstimateInputSchema.parse({
        taskType: 'videoInference',
        duration: 5,
      });

      const result = costEstimate(input);

      expect(result.status).toBe('success');
      const data = result.data as { taskType: string; totalCost: number; unitDescription: string };
      expect(data.taskType).toBe('videoInference');
      expect(data.unitDescription).toBe('second');
      expect(data.totalCost).toBeGreaterThan(0);
    });
  });

  describe('audioInference estimation', () => {
    it('should estimate audio cost based on duration', () => {
      const input = costEstimateInputSchema.parse({
        taskType: 'audioInference',
        duration: 30,
      });

      const result = costEstimate(input);

      expect(result.status).toBe('success');
      const data = result.data as { taskType: string; totalCost: number; units: number };
      expect(data.taskType).toBe('audioInference');
      expect(data.units).toBe(30);
      expect(data.totalCost).toBeGreaterThan(0);
    });
  });

  describe('all task types return valid estimates', () => {
    it('should return valid estimates for every supported task type', () => {
      const taskTypes = [
        'imageInference', 'photoMaker', 'upscale', 'removeBackground',
        'caption', 'imageMasking', 'videoInference', 'audioInference',
      ] as const;

      for (const taskType of taskTypes) {
        const input = costEstimateInputSchema.parse({ taskType });
        const result = costEstimate(input);

        expect(result.status).toBe('success');
        const data = result.data as { totalCost: number; isEstimate: boolean };
        expect(data.totalCost).toBeGreaterThanOrEqual(0);
        expect(data.isEstimate).toBe(true);
      }
    });
  });
});
