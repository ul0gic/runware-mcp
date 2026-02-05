/**
 * General utilities module for the Runware MCP server.
 *
 * Provides helper functions used across the codebase.
 */

import { randomUUID } from 'node:crypto';

import {
  type ImageUUID,
  type TaskUUID,
  createImageUUID,
  createTaskUUID,
} from './types.js';

// ============================================================================
// UUID Generation
// ============================================================================

/**
 * Generates a new TaskUUID.
 *
 * @returns Branded TaskUUID
 */
export function generateTaskUUID(): TaskUUID {
  return createTaskUUID(randomUUID());
}

/**
 * Generates a new ImageUUID.
 *
 * @returns Branded ImageUUID
 */
export function generateImageUUID(): ImageUUID {
  return createImageUUID(randomUUID());
}

// ============================================================================
// Async Utilities
// ============================================================================

/**
 * Promisified setTimeout.
 *
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after the delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Options for the retry function.
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts.
   * Default: 3
   */
  readonly maxAttempts?: number;

  /**
   * Initial delay in milliseconds.
   * Default: 1000
   */
  readonly initialDelayMs?: number;

  /**
   * Maximum delay in milliseconds.
   * Default: 30000
   */
  readonly maxDelayMs?: number;

  /**
   * Backoff multiplier (delay = delay * multiplier).
   * Default: 2
   */
  readonly backoffMultiplier?: number;

  /**
   * Function to determine if an error is retryable.
   * Default: all errors are retryable
   */
  readonly isRetryable?: (error: unknown) => boolean;

  /**
   * Abort signal for cancellation.
   */
  readonly signal?: AbortSignal;

  /**
   * Callback for each retry attempt.
   */
  readonly onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

/**
 * Retries an async function with exponential backoff.
 *
 * @param fn - Function to retry
 * @param options - Retry options
 * @returns Result of the function
 * @throws The last error if all retries fail
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30_000,
    backoffMultiplier = 2,
    isRetryable = (): boolean => true,
    signal,
    onRetry,
  } = options;

  let lastError: unknown;
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Check for cancellation
    if (signal?.aborted === true) {
      throw new Error('Operation was cancelled');
    }

    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt === maxAttempts || !isRetryable(error)) {
        throw error;
      }

      // Notify about retry
      onRetry?.(error, attempt, delay);

      // Wait before retrying
      await sleep(delay);

      // Increase delay for next attempt
      delay = Math.min(delay * backoffMultiplier, maxDelayMs);
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError;
}

// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Formats bytes as a human-readable string.
 *
 * @param bytes - Number of bytes
 * @returns Human-readable string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const base = 1024;
  const exponent = Math.floor(Math.log(bytes) / Math.log(base));
  const unit = units[Math.min(exponent, units.length - 1)];
  const value = bytes / Math.pow(base, exponent);

  // Use fixed decimal places based on size
  if (value >= 100) {
    return `${String(Math.round(value))} ${unit ?? 'B'}`;
  }
  if (value >= 10) {
    return `${value.toFixed(1)} ${unit ?? 'B'}`;
  }
  return `${value.toFixed(2)} ${unit ?? 'B'}`;
}

/**
 * Formats milliseconds as a human-readable duration.
 *
 * @param ms - Duration in milliseconds
 * @returns Human-readable string (e.g., "2m 30s")
 */
export function formatDuration(ms: number): string {
  if (ms < 0) {
    return '0ms';
  }

  if (ms < 1000) {
    return `${String(Math.round(ms))}ms`;
  }

  const seconds = Math.floor(ms / 1000);

  if (seconds < 60) {
    return `${String(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${String(minutes)}m ${String(remainingSeconds)}s`
      : `${String(minutes)}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0
    ? `${String(hours)}h ${String(remainingMinutes)}m`
    : `${String(hours)}h`;
}

/**
 * Truncates a string to a maximum length with ellipsis.
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length (including ellipsis)
 * @returns Truncated string
 */
export function truncate(str: string, maxLength: number): string {
  if (maxLength < 4) {
    return str.slice(0, maxLength);
  }

  if (str.length <= maxLength) {
    return str;
  }

  return str.slice(0, maxLength - 3) + '...';
}

// ============================================================================
// Object Utilities
// ============================================================================

/**
 * Picks specified keys from an object.
 *
 * @param obj - Source object
 * @param keys - Keys to pick
 * @returns New object with only the specified keys
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Pick<T, K> {
  const result: Partial<Pick<T, K>> = {};

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Safe: we're iterating over known keys from the keys array
      const value = Reflect.get(obj, key) as T[K];
      Reflect.set(result, key, value);
    }
  }

  return result as Pick<T, K>;
}

/**
 * Omits specified keys from an object.
 *
 * @param obj - Source object
 * @param keys - Keys to omit
 * @returns New object without the specified keys
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Omit<T, K> {
  const keySet = new Set<string | number | symbol>(keys);
  const result: Partial<T> = {};

  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (!keySet.has(key)) {
      // Safe: we're iterating over the object's own keys
      const value = Reflect.get(obj, key) as T[keyof T];
      Reflect.set(result, key, value);
    }
  }

  return result as Omit<T, K>;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for non-null and non-undefined values.
 *
 * Useful for filtering arrays: array.filter(isNotNullish)
 *
 * @param value - Value to check
 * @returns true if value is not null or undefined
 */
export function isNotNullish<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for strings.
 *
 * @param value - Value to check
 * @returns true if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard for numbers.
 *
 * @param value - Value to check
 * @returns true if value is a number (excluding NaN)
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

/**
 * Type guard for objects (excluding null).
 *
 * @param value - Value to check
 * @returns true if value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// ============================================================================
// Array Utilities
// ============================================================================

/**
 * Chunks an array into smaller arrays of specified size.
 *
 * @param array - Array to chunk
 * @param size - Chunk size
 * @returns Array of chunks
 */
export function chunk<T>(array: readonly T[], size: number): T[][] {
  if (size <= 0) {
    throw new Error('Chunk size must be positive');
  }

  const chunks: T[][] = [];

  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }

  return chunks;
}

/**
 * Creates a range of numbers.
 *
 * @param start - Start value (inclusive)
 * @param end - End value (exclusive)
 * @param step - Step size (default: 1)
 * @returns Array of numbers
 */
export function range(start: number, end: number, step = 1): number[] {
  if (step === 0) {
    throw new Error('Step cannot be zero');
  }

  const result: number[] = [];

  if (step > 0) {
    for (let i = start; i < end; i += step) {
      result.push(i);
    }
  } else {
    for (let i = start; i > end; i += step) {
      result.push(i);
    }
  }

  return result;
}

// ============================================================================
// Debounce / Throttle
// ============================================================================

/**
 * Creates a debounced version of a function.
 *
 * @param fn - Function to debounce
 * @param delayMs - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delayMs: number,
): (...args: TArgs) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return (...args: TArgs): void => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = undefined;
    }, delayMs);
  };
}

/**
 * Creates a throttled version of a function.
 *
 * @param fn - Function to throttle
 * @param intervalMs - Minimum interval between calls
 * @returns Throttled function
 */
export function throttle<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  intervalMs: number,
): (...args: TArgs) => void {
  let lastCallTime = 0;

  return (...args: TArgs): void => {
    const now = Date.now();

    if (now - lastCallTime >= intervalMs) {
      lastCallTime = now;
      fn(...args);
    }
  };
}

// ============================================================================
// Promise Utilities
// ============================================================================

/**
 * Runs promises with limited concurrency.
 *
 * @param tasks - Array of items to process
 * @param mapper - Function that returns a promise for each item
 * @param concurrency - Maximum concurrent promises
 * @returns Array of results in same order as tasks
 */
export async function mapWithConcurrency<T, R>(
  tasks: readonly T[],
  mapper: (task: T, index: number) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  if (concurrency <= 0) {
    throw new Error('Concurrency must be positive');
  }

  // Use a Map to store results to avoid array index injection issues
  const resultsMap = new Map<number, R>();
  let currentIndex = 0;

  async function worker(): Promise<void> {
    while (currentIndex < tasks.length) {
      const index = currentIndex;
      currentIndex += 1;

      // Access by numeric index is safe here - index is controlled
      const task = tasks.at(index);
      if (task !== undefined) {
        const result = await mapper(task, index);
        resultsMap.set(index, result);
      }
    }
  }

  const workerCount = Math.min(concurrency, tasks.length);
  const workerPromises: Promise<void>[] = [];
  for (let i = 0; i < workerCount; i++) {
    workerPromises.push(worker());
  }

  await Promise.all(workerPromises);

  // Convert map back to array in order
  const results: R[] = [];
  for (let i = 0; i < tasks.length; i++) {
    const result = resultsMap.get(i);
    if (result !== undefined) {
      results.push(result);
    }
  }

  return results;
}
