// Does:  Proves costEstimate scales with dimensions, result count and duration, and prices every supported task type.
// Holds: Only config is mocked; the estimate is pure local arithmetic with no client involved.

import { describe, it, expect, vi } from 'vitest';

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

import { costEstimate } from '../../../src/tools/cost-estimate/handler.js';
import { costEstimateInputSchema } from '../../../src/tools/cost-estimate/schema.js';

describe('costEstimate', () => {
  it('should scale image cost with custom dimensions', () => {
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

    const smallData = costEstimate(smallInput).data as { totalCost: number };
    const largeData = costEstimate(largeInput).data as { totalCost: number };

    expect(largeData.totalCost).toBeGreaterThan(smallData.totalCost);
  });

  it('should scale image cost linearly with numberResults', () => {
    const singleInput = costEstimateInputSchema.parse({
      taskType: 'imageInference',
      numberResults: 1,
    });

    const multiInput = costEstimateInputSchema.parse({
      taskType: 'imageInference',
      numberResults: 5,
    });

    const singleData = costEstimate(singleInput).data as { totalCost: number };
    const multiData = costEstimate(multiInput).data as { totalCost: number };

    expect(multiData.totalCost).toBeCloseTo(singleData.totalCost * 5, 10);
  });

  it('should price video per second of duration', () => {
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

  it('should count audio duration as units', () => {
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

  it('should return valid estimates for every supported task type', () => {
    const taskTypes = [
      'imageInference',
      'photoMaker',
      'upscale',
      'removeBackground',
      'caption',
      'imageMasking',
      'videoInference',
      'audioInference',
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
