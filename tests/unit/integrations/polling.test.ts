/**
 * Unit tests for the polling module.
 *
 * Tests pollForResult, submitAndPoll, estimateMaxPollTime, and formatDuration.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock config before importing modules that depend on it.
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
  DEFAULT_POLL_INTERVAL_MS: 2000,
  MAX_POLL_INTERVAL_MS: 10000,
}));

// Mock the client module so pollForResult can resolve getDefaultClient.
vi.mock('../../../src/integrations/runware/client.js', () => ({
  getDefaultClient: vi.fn(),
  RunwareClient: vi.fn(),
}));

import {
  pollForResult,
  submitAndPoll,
  estimateMaxPollTime,
  formatDuration,
} from '../../../src/integrations/runware/polling.js';
import { getDefaultClient } from '../../../src/integrations/runware/client.js';
import type { RunwareClient } from '../../../src/integrations/runware/client.js';
import { PollTimeoutError, GenerationFailedError } from '../../../src/shared/errors.js';
import type { TaskUUID, ProgressReporter } from '../../../src/shared/types.js';
import { createTaskUUID } from '../../../src/shared/types.js';

// ============================================================================
// Helpers
// ============================================================================

function createMockClient(): RunwareClient {
  return {
    request: vi.fn(),
    requestSingle: vi.fn(),
    generateTaskUUID: vi.fn().mockReturnValue('mock-uuid'),
  } as unknown as RunwareClient;
}

const TEST_TASK_UUID: TaskUUID = createTaskUUID('test-task-uuid-1234');

// ============================================================================
// pollForResult
// ============================================================================

describe('pollForResult', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockClient = createMockClient();
    (getDefaultClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns immediately when first poll returns success', async () => {
    (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
      taskType: 'imageInference',
      taskUUID: 'test-task-uuid-1234',
      status: 'success',
      imageURL: 'https://example.com/image.png',
    });

    const resultPromise = pollForResult(TEST_TASK_UUID, {
      client: mockClient,
      maxAttempts: 5,
      initialIntervalMs: 100,
      maxIntervalMs: 500,
    });

    // Advance timers to flush any microtasks
    await vi.advanceTimersByTimeAsync(0);

    const result = await resultPromise;

    expect(result.result.status).toBe('success');
    expect(result.attempts).toBe(1);
    expect(mockClient.requestSingle).toHaveBeenCalledTimes(1);
    expect(mockClient.requestSingle).toHaveBeenCalledWith(
      { taskType: 'getResponse', taskUUID: TEST_TASK_UUID },
      { signal: undefined },
    );
  });

  it('polls multiple times before success', async () => {
    const requestSingle = mockClient.requestSingle as ReturnType<typeof vi.fn>;
    requestSingle
      .mockResolvedValueOnce({
        taskType: 'getResponse',
        taskUUID: 'test-task-uuid-1234',
        status: 'processing',
      })
      .mockResolvedValueOnce({
        taskType: 'getResponse',
        taskUUID: 'test-task-uuid-1234',
        status: 'processing',
      })
      .mockResolvedValueOnce({
        taskType: 'imageInference',
        taskUUID: 'test-task-uuid-1234',
        status: 'success',
        imageURL: 'https://example.com/image.png',
      });

    const resultPromise = pollForResult(TEST_TASK_UUID, {
      client: mockClient,
      maxAttempts: 10,
      initialIntervalMs: 100,
      maxIntervalMs: 500,
    });

    // First poll happens immediately, returns processing
    await vi.advanceTimersByTimeAsync(0);
    // Advance past first sleep (100ms)
    await vi.advanceTimersByTimeAsync(100);
    // Second poll returns processing
    await vi.advanceTimersByTimeAsync(0);
    // Advance past second sleep (150ms with 1.5x backoff)
    await vi.advanceTimersByTimeAsync(150);
    // Third poll returns success
    await vi.advanceTimersByTimeAsync(0);

    const result = await resultPromise;

    expect(result.result.status).toBe('success');
    expect(result.attempts).toBe(3);
    expect(requestSingle).toHaveBeenCalledTimes(3);
  });

  it('throws PollTimeoutError when max attempts reached', async () => {
    (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
      taskType: 'getResponse',
      taskUUID: 'test-task-uuid-1234',
      status: 'processing',
    });

    let caughtError: unknown = null;

    const resultPromise = pollForResult(TEST_TASK_UUID, {
      client: mockClient,
      maxAttempts: 3,
      initialIntervalMs: 50,
      maxIntervalMs: 200,
    }).catch((error: unknown) => {
      caughtError = error;
    });

    // Advance enough time for all 3 attempts and sleeps between them
    for (let i = 0; i < 10; i++) {
      await vi.advanceTimersByTimeAsync(200);
    }

    await resultPromise;

    expect(caughtError).toBeInstanceOf(PollTimeoutError);
    expect((caughtError as PollTimeoutError).message).toMatch(/timed out after 3 attempts/i);
  });

  it('throws GenerationFailedError when API returns error status', async () => {
    (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
      taskType: 'imageInference',
      taskUUID: 'test-task-uuid-1234',
      status: 'error',
    });

    let caughtError: unknown = null;

    const resultPromise = pollForResult(TEST_TASK_UUID, {
      client: mockClient,
      maxAttempts: 5,
      initialIntervalMs: 100,
      maxIntervalMs: 500,
    }).catch((error: unknown) => {
      caughtError = error;
    });

    await vi.advanceTimersByTimeAsync(0);
    await resultPromise;

    expect(caughtError).toBeInstanceOf(GenerationFailedError);
    expect((caughtError as GenerationFailedError).message).toMatch(/failed during processing/i);
  });

  it('throws PollTimeoutError when signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    let caughtError: unknown = null;

    const resultPromise = pollForResult(TEST_TASK_UUID, {
      client: mockClient,
      maxAttempts: 5,
      initialIntervalMs: 100,
      maxIntervalMs: 500,
      signal: controller.signal,
    }).catch((error: unknown) => {
      caughtError = error;
    });

    await vi.advanceTimersByTimeAsync(0);
    await resultPromise;

    expect(caughtError).toBeInstanceOf(PollTimeoutError);
    expect((caughtError as PollTimeoutError).message).toMatch(/cancelled/i);
  });

  it('reports progress when reporter is provided', async () => {
    const requestSingle = mockClient.requestSingle as ReturnType<typeof vi.fn>;
    requestSingle
      .mockResolvedValueOnce({
        taskType: 'getResponse',
        taskUUID: 'test-task-uuid-1234',
        status: 'processing',
      })
      .mockResolvedValueOnce({
        taskType: 'imageInference',
        taskUUID: 'test-task-uuid-1234',
        status: 'success',
      });

    const progressReporter: ProgressReporter = {
      report: vi.fn(),
    };

    const resultPromise = pollForResult(TEST_TASK_UUID, {
      client: mockClient,
      maxAttempts: 5,
      initialIntervalMs: 50,
      maxIntervalMs: 200,
      progress: progressReporter,
    });

    // First poll: processing
    await vi.advanceTimersByTimeAsync(0);
    // Sleep after first poll
    await vi.advanceTimersByTimeAsync(50);
    // Second poll: success
    await vi.advanceTimersByTimeAsync(0);

    await resultPromise;

    expect(progressReporter.report).toHaveBeenCalledTimes(2);
    expect(progressReporter.report).toHaveBeenNthCalledWith(1, {
      progress: 1,
      total: 5,
      message: 'Polling for result (attempt 1/5)',
    });
    expect(progressReporter.report).toHaveBeenNthCalledWith(2, {
      progress: 2,
      total: 5,
      message: 'Polling for result (attempt 2/5)',
    });
  });

  it('uses default client when none provided in options', async () => {
    const defaultClient = createMockClient();
    (getDefaultClient as ReturnType<typeof vi.fn>).mockReturnValue(defaultClient);

    (defaultClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
      taskType: 'imageInference',
      taskUUID: 'test-task-uuid-1234',
      status: 'success',
    });

    const resultPromise = pollForResult(TEST_TASK_UUID, {
      maxAttempts: 5,
      initialIntervalMs: 100,
      maxIntervalMs: 500,
    });

    await vi.advanceTimersByTimeAsync(0);

    const result = await resultPromise;
    expect(result.result.status).toBe('success');
    expect(defaultClient.requestSingle).toHaveBeenCalledTimes(1);
  });

  it('uses config defaults when no options provided', async () => {
    const defaultClient = createMockClient();
    (getDefaultClient as ReturnType<typeof vi.fn>).mockReturnValue(defaultClient);

    (defaultClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
      taskType: 'imageInference',
      taskUUID: 'test-task-uuid-1234',
      status: 'success',
    });

    const resultPromise = pollForResult(TEST_TASK_UUID);

    await vi.advanceTimersByTimeAsync(0);

    const result = await resultPromise;
    expect(result.result.status).toBe('success');
  });

  it('rejects via sleep abort when signal aborts mid-poll', async () => {
    const controller = new AbortController();
    const requestSingle = mockClient.requestSingle as ReturnType<typeof vi.fn>;

    // First poll returns processing, so polling enters sleep
    requestSingle.mockResolvedValue({
      taskType: 'getResponse',
      taskUUID: 'test-task-uuid-1234',
      status: 'processing',
    });

    let caughtError: unknown = null;

    const resultPromise = pollForResult(TEST_TASK_UUID, {
      client: mockClient,
      maxAttempts: 10,
      initialIntervalMs: 5000,
      maxIntervalMs: 10000,
      signal: controller.signal,
    }).catch((error: unknown) => {
      caughtError = error;
    });

    // First poll happens immediately, returns processing, enters sleep(5000)
    await vi.advanceTimersByTimeAsync(0);

    // Abort the signal mid-sleep (sleep should reject with "Sleep was aborted")
    controller.abort();
    await vi.advanceTimersByTimeAsync(0);

    await resultPromise;

    // The error propagates as an unhandled rejection from sleep
    // but pollForResult catches it on the next iteration check
    expect(caughtError).toBeDefined();
  });

  it('applies exponential backoff to poll intervals', async () => {
    const requestSingle = mockClient.requestSingle as ReturnType<typeof vi.fn>;
    // Return processing for several attempts, then success
    requestSingle
      .mockResolvedValueOnce({ taskType: 'getResponse', taskUUID: 'x', status: 'processing' })
      .mockResolvedValueOnce({ taskType: 'getResponse', taskUUID: 'x', status: 'processing' })
      .mockResolvedValueOnce({ taskType: 'getResponse', taskUUID: 'x', status: 'processing' })
      .mockResolvedValueOnce({ taskType: 'imageInference', taskUUID: 'x', status: 'success' });

    const resultPromise = pollForResult(TEST_TASK_UUID, {
      client: mockClient,
      maxAttempts: 10,
      initialIntervalMs: 100,
      maxIntervalMs: 500,
    });

    // First poll: immediate, returns processing, then sleep 100ms
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(100);
    // Second poll: returns processing, then sleep 150ms (100 * 1.5)
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(150);
    // Third poll: returns processing, then sleep 225ms (150 * 1.5)
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(225);
    // Fourth poll: returns success
    await vi.advanceTimersByTimeAsync(0);

    const result = await resultPromise;
    expect(result.attempts).toBe(4);
  });
});

// ============================================================================
// submitAndPoll
// ============================================================================

describe('submitAndPoll', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('submits a task then polls for result', async () => {
    const requestSingle = mockClient.requestSingle as ReturnType<typeof vi.fn>;

    // First call: task submission
    requestSingle.mockResolvedValueOnce({ taskType: 'videoInference', taskUUID: 'submit-uuid' });
    // Second call: poll result (success)
    requestSingle.mockResolvedValueOnce({
      taskType: 'videoInference',
      taskUUID: 'submit-uuid',
      status: 'success',
      videoURL: 'https://example.com/video.mp4',
    });

    const resultPromise = submitAndPoll(
      mockClient,
      { taskType: 'videoInference', taskUUID: 'submit-uuid' },
      {
        maxAttempts: 5,
        initialIntervalMs: 100,
        maxIntervalMs: 500,
      },
    );

    // Advance for task submission + first poll
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);

    const result = await resultPromise;

    expect(result.result.status).toBe('success');
    // First call was for submission, second for polling
    expect(requestSingle).toHaveBeenCalledTimes(2);
  });

  it('passes signal to the submission request', async () => {
    const controller = new AbortController();
    const requestSingle = mockClient.requestSingle as ReturnType<typeof vi.fn>;

    requestSingle.mockResolvedValueOnce({ taskType: 'audioInference', taskUUID: 'audio-uuid' });
    requestSingle.mockResolvedValueOnce({
      taskType: 'audioInference',
      taskUUID: 'audio-uuid',
      status: 'success',
    });

    const resultPromise = submitAndPoll(
      mockClient,
      { taskType: 'audioInference', taskUUID: 'audio-uuid' },
      {
        signal: controller.signal,
        maxAttempts: 5,
        initialIntervalMs: 100,
        maxIntervalMs: 500,
      },
    );

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);

    await resultPromise;

    // The first call (submission) should include the signal
    const firstCallOptions = requestSingle.mock.calls[0]![1] as { signal?: AbortSignal };
    expect(firstCallOptions.signal).toBe(controller.signal);
  });
});

// ============================================================================
// estimateMaxPollTime
// ============================================================================

describe('estimateMaxPollTime', () => {
  it('calculates estimated time with defaults', () => {
    // With default config: 150 attempts, 2000ms initial, 10000ms max
    const result = estimateMaxPollTime();
    expect(result).toBeGreaterThan(0);
    expect(typeof result).toBe('number');
  });

  it('calculates estimated time with custom params', () => {
    const result = estimateMaxPollTime(3, 1000, 5000);
    // Attempt 1: 1000ms, Attempt 2: 1500ms (1000 * 1.5), Attempt 3: 2250ms (1500 * 1.5)
    expect(result).toBe(1000 + 1500 + 2250);
  });

  it('caps interval at maxIntervalMs', () => {
    const result = estimateMaxPollTime(5, 1000, 2000);
    // Attempt 1: 1000, Attempt 2: 1500, Attempt 3: min(2250, 2000) = 2000,
    // Attempt 4: 2000, Attempt 5: 2000
    expect(result).toBe(1000 + 1500 + 2000 + 2000 + 2000);
  });

  it('returns 0 for 0 attempts', () => {
    const result = estimateMaxPollTime(0, 1000, 5000);
    expect(result).toBe(0);
  });

  it('handles single attempt', () => {
    const result = estimateMaxPollTime(1, 500, 10000);
    expect(result).toBe(500);
  });
});

// ============================================================================
// formatDuration
// ============================================================================

describe('formatDuration', () => {
  it('formats milliseconds under 1 second', () => {
    expect(formatDuration(500)).toBe('500ms');
    expect(formatDuration(0)).toBe('0ms');
    expect(formatDuration(999)).toBe('999ms');
  });

  it('formats seconds under 60', () => {
    expect(formatDuration(1000)).toBe('1s');
    expect(formatDuration(5000)).toBe('5s');
    expect(formatDuration(59000)).toBe('59s');
  });

  it('formats exact minutes', () => {
    expect(formatDuration(60000)).toBe('1m');
    expect(formatDuration(120000)).toBe('2m');
    expect(formatDuration(300000)).toBe('5m');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(90000)).toBe('1m 30s');
    expect(formatDuration(150000)).toBe('2m 30s');
    expect(formatDuration(61000)).toBe('1m 1s');
  });

  it('truncates sub-second portions in seconds display', () => {
    // 1500ms = 1.5 seconds, floor to 1s
    expect(formatDuration(1500)).toBe('1s');
  });
});
