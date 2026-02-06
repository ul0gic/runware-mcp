/**
 * Polling module for async Runware API operations.
 *
 * Implements exponential backoff polling for long-running tasks
 * like video and audio generation.
 */

import {
  config,
  DEFAULT_POLL_INTERVAL_MS,
  MAX_POLL_INTERVAL_MS,
} from '../../shared/config.js';
import { GenerationFailedError, PollTimeoutError } from '../../shared/errors.js';

import { type RequestOptions, type RunwareClient, getDefaultClient } from './client.js';

import type { AsyncTaskResponse, ProgressReporter, TaskStatus, TaskUUID } from '../../shared/types.js';

// ============================================================================
// Polling Types
// ============================================================================

/**
 * Options for polling operations.
 */
export interface PollOptions extends RequestOptions {
  /**
   * Maximum number of polling attempts.
   * Defaults to config.POLL_MAX_ATTEMPTS.
   */
  readonly maxAttempts?: number;

  /**
   * Initial polling interval in milliseconds.
   * Defaults to DEFAULT_POLL_INTERVAL_MS (2000ms).
   */
  readonly initialIntervalMs?: number;

  /**
   * Maximum polling interval in milliseconds.
   * Caps exponential backoff to prevent excessive wait times.
   * Defaults to MAX_POLL_INTERVAL_MS (10000ms).
   */
  readonly maxIntervalMs?: number;

  /**
   * Progress reporter for long-running operations.
   * Called after each poll attempt with progress information.
   */
  readonly progress?: ProgressReporter;

  /**
   * Runware client instance to use.
   * Defaults to the shared client instance.
   */
  readonly client?: RunwareClient;
}

/**
 * Result of a polling operation.
 */
export interface PollResult<T extends AsyncTaskResponse> {
  /**
   * The final result from the API.
   */
  readonly result: T;

  /**
   * Number of polling attempts made.
   */
  readonly attempts: number;

  /**
   * Total elapsed time in milliseconds.
   */
  readonly elapsedMs: number;
}

/**
 * Response from getResponse API call.
 */
interface GetResponseResult extends AsyncTaskResponse {
  readonly status: TaskStatus;
}

// ============================================================================
// Polling Implementation
// ============================================================================

/**
 * Polls for the result of an async task with exponential backoff.
 *
 * This function implements the recommended polling pattern for Runware's
 * async operations. It starts with a 2-second interval and uses exponential
 * backoff up to 10 seconds between polls.
 *
 * @param taskUUID - UUID of the task to poll for
 * @param options - Polling configuration options
 * @returns The completed task result
 * @throws PollTimeoutError if max attempts is reached
 * @throws GenerationFailedError if the task fails
 */
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
    // Check for cancellation before each poll
    if (signal?.aborted === true) {
      throw new PollTimeoutError('Polling was cancelled', {
        taskUUID,
        attempts,
        elapsedMs: Date.now() - startTime,
      });
    }

    attempts += 1;

    // Report progress if reporter is available
    if (progress !== undefined) {
      progress.report({
        progress: attempts,
        total: maxAttempts,
        message: `Polling for result (attempt ${String(attempts)}/${String(maxAttempts)})`,
      });
    }

    // Make the getResponse request
    const response = await client.requestSingle<GetResponseResult>(
      {
        taskType: 'getResponse',
        taskUUID,
      },
      { signal },
    );

    // Check status
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

    // Still processing - wait before next poll
    await sleep(currentInterval, signal);

    // Exponential backoff: increase interval by 50% each time, up to max
    currentInterval = Math.min(currentInterval * 1.5, maxInterval);
  }

  // Max attempts reached
  throw new PollTimeoutError(
    `Polling timed out after ${String(maxAttempts)} attempts`,
    {
      taskUUID,
      attempts,
      elapsedMs: Date.now() - startTime,
    },
  );
}

/**
 * Sleeps for the specified duration, respecting abort signals.
 *
 * @param ms - Duration to sleep in milliseconds
 * @param signal - Optional abort signal for cancellation
 */
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

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Submits a task and polls for its result.
 *
 * This is a convenience function that combines task submission with polling.
 * Use for operations that always require async processing (video, audio).
 *
 * @param client - Runware client instance
 * @param task - Task to submit (must include taskUUID)
 * @param options - Polling options
 * @returns The completed task result
 */
export async function submitAndPoll<TResult extends AsyncTaskResponse>(
  client: RunwareClient,
  task: { taskType: string; taskUUID: string },
  options?: PollOptions,
): Promise<PollResult<TResult>> {
  // Submit the task — use request() instead of requestSingle() because
  // async tasks may return { data: [] } on submission, which requestSingle() rejects.
  await client.request([task], {
    signal: options?.signal,
  });

  // Poll for result
  return pollForResult<TResult>(task.taskUUID as TaskUUID, {
    ...options,
    client,
  });
}

/**
 * Calculates the estimated maximum wait time for polling.
 *
 * This is useful for informing users about expected wait times.
 *
 * @param maxAttempts - Maximum polling attempts
 * @param initialIntervalMs - Initial polling interval
 * @param maxIntervalMs - Maximum polling interval
 * @returns Estimated maximum wait time in milliseconds
 */
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

/**
 * Formats a duration in milliseconds as a human-readable string.
 *
 * @param ms - Duration in milliseconds
 * @returns Human-readable duration string
 */
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
