import { randomUUID } from 'node:crypto';

import {
  type ImageUUID,
  type TaskUUID,
  createImageUUID,
  createTaskUUID,
} from './types.js';

export function generateTaskUUID(): TaskUUID {
  return createTaskUUID(randomUUID());
}

export function generateImageUUID(): ImageUUID {
  return createImageUUID(randomUUID());
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export interface RetryOptions {
  /** Total attempts including the first. Default: 3. */
  readonly maxAttempts?: number;

  /** Default: 1000. */
  readonly initialDelayMs?: number;

  /** Backoff ceiling. Default: 30000. */
  readonly maxDelayMs?: number;

  /** Default: 2. */
  readonly backoffMultiplier?: number;

  /** Default: every error is retried. */
  readonly isRetryable?: (error: unknown) => boolean;

  /** Checked between attempts only — an in-flight call is not aborted. */
  readonly signal?: AbortSignal;

  readonly onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

/** Exponential backoff; rethrows the final error once attempts are exhausted. */
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
    if (signal?.aborted === true) {
      throw new Error('Operation was cancelled');
    }

    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !isRetryable(error)) {
        throw error;
      }

      onRetry?.(error, attempt, delay);

      await sleep(delay);

      delay = Math.min(delay * backoffMultiplier, maxDelayMs);
    }
  }

  // Unreachable — the loop either returns or throws; present to satisfy the return type
  throw lastError;
}

/** Binary units (1024-based), e.g. `1572864` -> `"1.50 MB"`. */
export function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const base = 1024;
  const exponent = Math.floor(Math.log(bytes) / Math.log(base));
  const unit = units[Math.min(exponent, units.length - 1)];
  const value = bytes / Math.pow(base, exponent);

  if (value >= 100) {
    return `${String(Math.round(value))} ${unit ?? 'B'}`;
  }
  if (value >= 10) {
    return `${value.toFixed(1)} ${unit ?? 'B'}`;
  }
  return `${value.toFixed(2)} ${unit ?? 'B'}`;
}

/** Coarsens to at most two units, e.g. `150000` -> `"2m 30s"`. */
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

/** maxLength includes the ellipsis; under 4 it hard-slices instead. */
export function truncate(str: string, maxLength: number): string {
  if (maxLength < 4) {
    return str.slice(0, maxLength);
  }

  if (str.length <= maxLength) {
    return str;
  }

  return str.slice(0, maxLength - 3) + '...';
}

export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Pick<T, K> {
  const result: Partial<Pick<T, K>> = {};

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = Reflect.get(obj, key) as T[K];
      Reflect.set(result, key, value);
    }
  }

  return result as Pick<T, K>;
}

export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Omit<T, K> {
  const keySet = new Set<string | number | symbol>(keys);
  const result: Partial<T> = {};

  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (!keySet.has(key)) {
      const value = Reflect.get(obj, key) as T[keyof T];
      Reflect.set(result, key, value);
    }
  }

  return result as Omit<T, K>;
}

/** Narrowing predicate for `array.filter(isNotNullish)`. */
export function isNotNullish<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/** NaN is rejected. */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

/** Rejects null and arrays. */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

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

/** Half-open [start, end); a negative step counts down. */
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

/** Trailing-edge: fires once delayMs after the last call. */
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

/** Leading-edge: calls inside the interval are dropped, not queued. */
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

/** Results come back in task order, not completion order. */
export async function mapWithConcurrency<T, R>(
  tasks: readonly T[],
  mapper: (task: T, index: number) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  if (concurrency <= 0) {
    throw new Error('Concurrency must be positive');
  }

  const resultsMap = new Map<number, R>();
  let currentIndex = 0;

  async function worker(): Promise<void> {
    while (currentIndex < tasks.length) {
      const index = currentIndex;
      currentIndex += 1;

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

  const results: R[] = [];
  for (let i = 0; i < tasks.length; i++) {
    const result = resultsMap.get(i);
    if (result !== undefined) {
      results.push(result);
    }
  }

  return results;
}
