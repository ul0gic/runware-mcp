import {
  config,
  DEFAULT_POLL_INTERVAL_MS,
  MAX_POLL_INTERVAL_MS,
} from '../../shared/config.js';
import { GenerationFailedError, PollTimeoutError } from '../../shared/errors.js';

import { type RequestOptions, type RunwareClient, getDefaultClient } from './client.js';

import type { AsyncTaskResponse, ProgressReporter, TaskStatus, TaskUUID } from '../../shared/types.js';

export interface PollOptions extends RequestOptions {
  /** Defaults to config.POLL_MAX_ATTEMPTS. */
  readonly maxAttempts?: number;

  /** Defaults to DEFAULT_POLL_INTERVAL_MS. */
  readonly initialIntervalMs?: number;

  /** Caps the exponential backoff; defaults to MAX_POLL_INTERVAL_MS. */
  readonly maxIntervalMs?: number;

  /** Invoked after each poll attempt. */
  readonly progress?: ProgressReporter;

  /** Defaults to the shared client instance. */
  readonly client?: RunwareClient;
}

export interface PollResult<T extends AsyncTaskResponse> {
  readonly result: T;
  readonly attempts: number;
  readonly elapsedMs: number;
}

interface GetResponseResult extends AsyncTaskResponse {
  readonly status: TaskStatus;
}

/** Throws PollTimeoutError on max attempts or cancellation, GenerationFailedError when the task itself fails. */
export async function pollForResult<T extends AsyncTaskResponse>(
  taskUUID: TaskUUID,
  options?: PollOptions,
): Promise<PollResult<T>> {
  const client = options?.client ?? getDefaultClient();
  const maxAttempts = options?.maxAttempts ?? config.POLL_MAX_ATTEMPTS;
  const initialInterval = options?.initialIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const maxInterval = options?.maxIntervalMs ?? MAX_POLL_INTERVAL_MS;
  const progress = options?.progress;
  const signal = options?.signal;

  const startTime = Date.now();
  let currentInterval = initialInterval;
  let attempts = 0;

  while (attempts < maxAttempts) {
    if (signal?.aborted === true) {
      throw new PollTimeoutError('Polling was cancelled', {
        taskUUID,
        attempts,
        elapsedMs: Date.now() - startTime,
      });
    }

    attempts += 1;

    if (progress !== undefined) {
      progress.report({
        progress: attempts,
        total: maxAttempts,
        message: `Polling for result (attempt ${String(attempts)}/${String(maxAttempts)})`,
      });
    }

    const response = await client.requestSingle<GetResponseResult>(
      {
        taskType: 'getResponse',
        taskUUID,
      },
      { signal },
    );

    if (response.status === 'success') {
      return {
        result: response as T,
        attempts,
        elapsedMs: Date.now() - startTime,
      };
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

  throw new PollTimeoutError(
    `Polling timed out after ${String(maxAttempts)} attempts`,
    {
      taskUUID,
      attempts,
      elapsedMs: Date.now() - startTime,
    },
  );
}

async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      resolve();
    }, ms);

    if (signal !== undefined) {
      if (signal.aborted) {
        clearTimeout(timeoutId);
        reject(new Error('Sleep was aborted'));
        return;
      }

      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timeoutId);
          reject(new Error('Sleep was aborted'));
        },
        { once: true },
      );
    }
  });
}

/** For operations that always require async processing (video, audio). */
export async function submitAndPoll<TResult extends AsyncTaskResponse>(
  client: RunwareClient,
  task: { taskType: string; taskUUID: string },
  options?: PollOptions,
): Promise<PollResult<TResult>> {
  // request() not requestSingle(): async tasks may return { data: [] } on submission, which requestSingle() rejects.
  await client.request([task], {
    signal: options?.signal,
  });

  return pollForResult<TResult>(task.taskUUID as TaskUUID, {
    ...options,
    client,
  });
}

export function estimateMaxPollTime(
  maxAttempts: number = config.POLL_MAX_ATTEMPTS,
  initialIntervalMs: number = DEFAULT_POLL_INTERVAL_MS,
  maxIntervalMs: number = MAX_POLL_INTERVAL_MS,
): number {
  let totalTime = 0;
  let currentInterval = initialIntervalMs;

  for (let i = 0; i < maxAttempts; i++) {
    totalTime += currentInterval;
    currentInterval = Math.min(currentInterval * 1.5, maxIntervalMs);
  }

  return totalTime;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${String(ms)}ms`;
  }

  const seconds = Math.floor(ms / 1000);

  if (seconds < 60) {
    return `${String(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${String(minutes)}m`;
  }

  return `${String(minutes)}m ${String(remainingSeconds)}s`;
}
