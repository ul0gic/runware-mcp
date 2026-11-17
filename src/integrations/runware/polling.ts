// Does:  Polls getResponse for an async task with capped 1.5x backoff until it succeeds, fails, or exhausts attempts.
// Holds: Stops after at most maxAttempts polls with no wall-clock deadline; every cancellation is one PollTimeoutError.

import { config, DEFAULT_POLL_INTERVAL_MS, MAX_POLL_INTERVAL_MS } from '../../shared/config.js';
import { GenerationFailedError, PollTimeoutError } from '../../shared/errors.js';

import { type RequestOptions, type RunwareClient, getDefaultClient } from './client.js';

import type { AsyncTaskResponse, ProgressReporter, TaskStatus, TaskUUID } from '../../shared/types.js';

export interface PollOptions extends RequestOptions {
  readonly maxAttempts?: number | undefined;

  readonly initialIntervalMs?: number | undefined;

  readonly maxIntervalMs?: number | undefined;

  readonly progress?: ProgressReporter | undefined;

  readonly client?: RunwareClient | undefined;
}

export interface PollResult<T extends AsyncTaskResponse> {
  readonly result: T;
  readonly attempts: number;
  readonly elapsedMs: number;
}

interface GetResponseResult extends AsyncTaskResponse {
  readonly status: TaskStatus;
}

// Why: A function call, not an inline check, so TypeScript does not narrow aborted to false across an await.
function isAborted(signal: AbortSignal | undefined): boolean {
  return signal?.aborted === true;
}

function cancellationError(taskUUID: TaskUUID, attempts: number, startTime: number): PollTimeoutError {
  return new PollTimeoutError('Polling was cancelled', { taskUUID, attempts, elapsedMs: Date.now() - startTime });
}

// Holds: A request that fails after the signal aborted rejects with the cancellation error, never its own error.
async function requestOrCancel<R>(
  request: Promise<R>,
  signal: AbortSignal | undefined,
  cancelled: () => PollTimeoutError,
): Promise<R> {
  try {
    return await request;
  } catch (error) {
    throw isAborted(signal) ? cancelled() : error;
  }
}

// Holds: Once the signal aborts, before a poll, mid-request, or mid-sleep, the only rejection is cancellationError.
export async function pollForResult<T extends AsyncTaskResponse>(
  taskUUID: TaskUUID,
  options?: PollOptions,
): Promise<PollResult<T>> {
  const client = options?.client ?? getDefaultClient();
  const maxAttempts = options?.maxAttempts ?? config.POLL_MAX_ATTEMPTS;
  const maxInterval = options?.maxIntervalMs ?? MAX_POLL_INTERVAL_MS;
  const progress = options?.progress;
  const signal = options?.signal;

  const startTime = Date.now();
  let currentInterval = options?.initialIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  let attempts = 0;

  while (attempts < maxAttempts) {
    if (isAborted(signal)) {
      throw cancellationError(taskUUID, attempts, startTime);
    }

    attempts += 1;

    progress?.report({
      progress: attempts,
      total: maxAttempts,
      message: `Polling for result (attempt ${String(attempts)}/${String(maxAttempts)})`,
    });

    // biome-ignore lint/performance/noAwaitInLoops: each poll must observe the previous status before waiting and asking again.
    const response = await requestOrCancel(
      client.requestSingle<T & GetResponseResult>({ taskType: 'getResponse', taskUUID }, { signal }),
      signal,
      () => cancellationError(taskUUID, attempts, startTime),
    );

    if (response.status === 'success') {
      return { result: response, attempts, elapsedMs: Date.now() - startTime };
    }

    if (response.status === 'error') {
      throw new GenerationFailedError('Task failed during processing', {
        taskType: response.taskType,
        taskUUID,
        reason: 'API returned error status',
      });
    }

    await sleep(currentInterval, signal);

    currentInterval = Math.min(currentInterval * 1.5, maxInterval);
  }

  throw new PollTimeoutError(`Polling timed out after ${String(maxAttempts)} attempts`, {
    taskUUID,
    attempts,
    elapsedMs: Date.now() - startTime,
  });
}

// Holds: Never rejects; an abort ends the wait early, and the timer and abort listener are both released either way.
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (isAborted(signal)) {
      resolve();
      return;
    }

    const finish = (): void => {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', finish);
      resolve();
    };
    const timeoutId = setTimeout(finish, ms);
    signal?.addEventListener('abort', finish, { once: true });
  });
}

export async function submitAndPoll<TResult extends AsyncTaskResponse>(
  client: RunwareClient,
  task: { taskType: string; taskUUID: TaskUUID },
  options?: PollOptions,
): Promise<PollResult<TResult>> {
  const startTime = Date.now();
  // Why: Async submissions may return { data: [] }, which requestSingle() rejects.
  await requestOrCancel(client.request([task], { signal: options?.signal }), options?.signal, () =>
    cancellationError(task.taskUUID, 0, startTime),
  );

  return pollForResult<TResult>(task.taskUUID, {
    ...options,
    client,
  });
}
