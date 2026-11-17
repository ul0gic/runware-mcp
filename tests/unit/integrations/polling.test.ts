// Does:  pollForResult backs off until success, error, exhaustion or cancel; submitAndPoll submits once then polls.
// Holds: config and the client are mocked; polling and sleep run on fake timers; every cancel is PollTimeoutError.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
  DEFAULT_POLL_INTERVAL_MS: 2000,
  MAX_POLL_INTERVAL_MS: 10000,
}));

import { pollForResult, submitAndPoll } from '../../../src/integrations/runware/polling.js';
import type { RunwareClient } from '../../../src/integrations/runware/client.js';
import { PollTimeoutError, GenerationFailedError, RunwareApiError } from '../../../src/shared/errors.js';
import type { TaskUUID } from '../../../src/shared/types.js';
import { createTaskUUID } from '../../../src/shared/types.js';

function createMockClient(): RunwareClient {
  return {
    request: vi.fn(),
    requestSingle: vi.fn(),
    generateTaskUUID: vi.fn().mockReturnValue('mock-uuid'),
  } as unknown as RunwareClient;
}

const TEST_TASK_UUID: TaskUUID = createTaskUUID('test-task-uuid-1234');

describe('pollForResult', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockClient = createMockClient();
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

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(150);
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

    // Why: Advancing in steps lets each poll's sleep resolve before the next attempt schedules its own timer.
    for (let i = 0; i < 10; i++) {
      // biome-ignore lint/performance/noAwaitInLoops: fake-timer steps must complete in order.
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

  it('rejects and stops polling when the signal aborts mid-sleep', async () => {
    const controller = new AbortController();
    const requestSingle = mockClient.requestSingle as ReturnType<typeof vi.fn>;
    requestSingle.mockResolvedValue({
      taskType: 'getResponse',
      taskUUID: 'test-task-uuid-1234',
      status: 'processing',
    });

    const resultPromise = pollForResult(TEST_TASK_UUID, {
      client: mockClient,
      maxAttempts: 10,
      initialIntervalMs: 5000,
      maxIntervalMs: 10000,
      signal: controller.signal,
    });
    const settled = resultPromise.then(
      () => undefined,
      (error: unknown) => error,
    );

    await vi.advanceTimersByTimeAsync(0);
    controller.abort();
    await vi.advanceTimersByTimeAsync(20000);

    const caughtError = await settled;
    expect(caughtError).toBeInstanceOf(PollTimeoutError);
    expect(caughtError).toMatchObject({ message: 'Polling was cancelled', data: { attempts: 1 } });
    expect(requestSingle).toHaveBeenCalledTimes(1);
  });

  it('reports an abort during a poll request as the same cancellation error', async () => {
    const controller = new AbortController();
    const client = createMockClient();
    vi.mocked(client.requestSingle).mockImplementation(
      (_task, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () => {
            reject(new RunwareApiError('Request was cancelled'));
          });
        }),
    );

    const settled = pollForResult(TEST_TASK_UUID, { client, maxAttempts: 10, signal: controller.signal }).then(
      () => undefined,
      (error: unknown) => error,
    );
    await vi.advanceTimersByTimeAsync(0);
    controller.abort();

    const caughtError = await settled;
    expect(caughtError).toBeInstanceOf(PollTimeoutError);
    expect(caughtError).toMatchObject({ message: 'Polling was cancelled' });
  });

  it('leaves no abort listener on the signal after each backoff sleep', async () => {
    const controller = new AbortController();
    const added = vi.spyOn(controller.signal, 'addEventListener');
    const removed = vi.spyOn(controller.signal, 'removeEventListener');
    const client = createMockClient();
    vi.mocked(client.requestSingle).mockResolvedValue({ taskType: 'getResponse', taskUUID: 'x', status: 'processing' });

    const settled = pollForResult(TEST_TASK_UUID, {
      client,
      maxAttempts: 6,
      initialIntervalMs: 100,
      maxIntervalMs: 100,
      signal: controller.signal,
    }).then(
      () => undefined,
      (error: unknown) => error,
    );
    await vi.advanceTimersByTimeAsync(1000);

    expect(await settled).toMatchObject({ message: 'Polling timed out after 6 attempts' });
    expect(added.mock.calls.length).toBeGreaterThanOrEqual(5);
    expect(removed.mock.calls.length).toBe(added.mock.calls.length);
  });

  it('applies exponential backoff to poll intervals', async () => {
    const requestSingle = mockClient.requestSingle as ReturnType<typeof vi.fn>;
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

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(150);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(225);
    await vi.advanceTimersByTimeAsync(0);

    const result = await resultPromise;
    expect(result.attempts).toBe(4);
  });
});

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
    const request = mockClient.request as ReturnType<typeof vi.fn>;
    const requestSingle = mockClient.requestSingle as ReturnType<typeof vi.fn>;

    request.mockResolvedValueOnce({ data: [] });
    requestSingle.mockResolvedValueOnce({
      taskType: 'videoInference',
      taskUUID: 'submit-uuid',
      status: 'success',
      videoURL: 'https://example.com/video.mp4',
    });

    const resultPromise = submitAndPoll(
      mockClient,
      { taskType: 'videoInference', taskUUID: createTaskUUID('submit-uuid') },
      {
        maxAttempts: 5,
        initialIntervalMs: 100,
        maxIntervalMs: 500,
      },
    );

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);

    const result = await resultPromise;

    expect(result.result.status).toBe('success');
    expect(request).toHaveBeenCalledTimes(1);
    expect(requestSingle).toHaveBeenCalledTimes(1);
  });

  it('passes signal to the submission request', async () => {
    const controller = new AbortController();
    const request = mockClient.request as ReturnType<typeof vi.fn>;
    const requestSingle = mockClient.requestSingle as ReturnType<typeof vi.fn>;

    request.mockResolvedValueOnce({ data: [] });
    requestSingle.mockResolvedValueOnce({
      taskType: 'audioInference',
      taskUUID: 'audio-uuid',
      status: 'success',
    });

    const resultPromise = submitAndPoll(
      mockClient,
      { taskType: 'audioInference', taskUUID: createTaskUUID('audio-uuid') },
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

    const firstCallOptions = request.mock.calls[0]![1] as { signal?: AbortSignal };
    expect(firstCallOptions.signal).toBe(controller.signal);
  });

  it('reports an abort during submission as the polling cancellation error', async () => {
    const controller = new AbortController();
    const client = createMockClient();
    vi.mocked(client.request).mockImplementation(() => {
      controller.abort();
      return Promise.reject(new RunwareApiError('Request was cancelled'));
    });

    await expect(
      submitAndPoll(client, { taskType: 'audioInference', taskUUID: TEST_TASK_UUID }, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'PollTimeoutError', message: 'Polling was cancelled' });
    expect(client.requestSingle).not.toHaveBeenCalled();
  });
});
