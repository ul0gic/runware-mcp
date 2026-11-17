// Does:  Proves truncate, debounce and mapWithConcurrency semantics, including order and the concurrency cap.
// Holds: Exercises the real utilities; debounce runs under fake timers.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { debounce, mapWithConcurrency, truncate } from '../../../src/shared/utils.js';

describe('truncate', () => {
  it('returns original string if shorter than max', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('returns original string if equal to max', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('truncates with ellipsis when too long', () => {
    expect(truncate('hello world', 8)).toBe('hello...');
  });

  it('handles maxLength less than 4 (no ellipsis)', () => {
    expect(truncate('hello', 3)).toBe('hel');
  });

  it('handles empty string', () => {
    expect(truncate('', 10)).toBe('');
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays execution by specified ms', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('resets timer on subsequent calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);

    debounced();
    vi.advanceTimersByTime(100);
    debounced();
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('passes arguments to the underlying function', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('a', 'b');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('a', 'b');
  });

  it('only invokes once for rapid calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();
    debounced();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
  });
});

describe('mapWithConcurrency', () => {
  it('processes all tasks', async () => {
    const tasks = [1, 2, 3, 4, 5];
    const results = await mapWithConcurrency(tasks, async (n) => n * 2, 2);
    expect(results).toEqual([2, 4, 6, 8, 10]);
  });

  it('maintains order', async () => {
    const tasks = ['a', 'b', 'c'];
    const results = await mapWithConcurrency(tasks, async (s) => s.toUpperCase(), 1);
    expect(results).toEqual(['A', 'B', 'C']);
  });

  it('handles empty array', async () => {
    const results = await mapWithConcurrency([], async (x: number) => x, 5);
    expect(results).toEqual([]);
  });

  it('throws on zero concurrency', async () => {
    await expect(mapWithConcurrency([1], async (x) => x, 0)).rejects.toThrow('Concurrency must be positive');
  });

  it('throws on negative concurrency', async () => {
    await expect(mapWithConcurrency([1], async (x) => x, -1)).rejects.toThrow('Concurrency must be positive');
  });

  it('respects concurrency limits', async () => {
    let maxConcurrent = 0;
    let current = 0;

    const tasks = [1, 2, 3, 4, 5, 6];
    await mapWithConcurrency(
      tasks,
      async (n) => {
        current += 1;
        maxConcurrent = Math.max(maxConcurrent, current);
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 10);
        });
        current -= 1;
        return n;
      },
      2,
    );

    expect(maxConcurrent).toBeLessThanOrEqual(2);
  });
});
