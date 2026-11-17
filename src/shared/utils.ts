// Does:  Provides task-UUID, truncation, object type-guard, debounce and bounded-concurrency helpers.
// Holds: mapWithConcurrency runs at most `concurrency` mappers at once and returns results in input order.

import { randomUUID } from 'node:crypto';

import { type TaskUUID, createTaskUUID } from './types.js';

export function generateTaskUUID(): TaskUUID {
  return createTaskUUID(randomUUID());
}

// Holds: maxLength includes the ellipsis; below 4 it hard-slices instead.
export function truncate(str: string, maxLength: number): string {
  if (maxLength < 4) {
    return str.slice(0, maxLength);
  }

  if (str.length <= maxLength) {
    return str;
  }

  return `${str.slice(0, maxLength - 3)}...`;
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Holds: Trailing-edge; fires once, delayMs after the last call.
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

// Holds: Results come back in task order, not completion order.
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
      if (task === undefined) {
        continue;
      }
      // biome-ignore lint/performance/noAwaitInLoops: each worker drains the shared queue serially; parallelism comes from the worker count.
      const result = await mapper(task, index);
      resultsMap.set(index, result);
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
