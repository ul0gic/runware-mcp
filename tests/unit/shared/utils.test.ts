import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  sleep,
  retry,
  formatBytes,
  formatDuration,
  truncate,
  pick,
  omit,
  isNotNullish,
  isString,
  isNumber,
  isObject,
  chunk,
  range,
  debounce,
  throttle,
  mapWithConcurrency,
} from '../../../src/shared/utils.js';

// ============================================================================
// sleep
// ============================================================================

describe('sleep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves after the specified delay', async () => {
    const promise = sleep(1000);
    vi.advanceTimersByTime(1000);
    await promise;
    // If we got here, the promise resolved
  });

  it('does not resolve before the delay', async () => {
    let resolved = false;
    const promise = sleep(1000).then(() => {
      resolved = true;
    });
    vi.advanceTimersByTime(999);
    // Give microtasks a chance to run
    await Promise.resolve();
    expect(resolved).toBe(false);

    vi.advanceTimersByTime(1);
    await promise;
    expect(resolved).toBe(true);
  });
});

// ============================================================================
// retry
// ============================================================================

describe('retry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns result on first attempt success', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await retry(fn, { maxAttempts: 3 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledOnce();
  });

  it('retries on failure and returns on success', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockResolvedValue('success');

    const promise = retry(fn, { maxAttempts: 3, initialDelayMs: 100 });
    // Advance past the delay
    await vi.advanceTimersByTimeAsync(200);

    const result = await promise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws after maxAttempts exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));

    await expect(
      retry(fn, { maxAttempts: 1, initialDelayMs: 100 }),
    ).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('respects isRetryable predicate', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('non-retryable'));

    const promise = retry(fn, {
      maxAttempts: 5,
      initialDelayMs: 100,
      isRetryable: () => false,
    });

    await expect(promise).rejects.toThrow('non-retryable');
    expect(fn).toHaveBeenCalledOnce();
  });

  it('calls onRetry callback on each retry', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('ok');

    const onRetry = vi.fn();

    const promise = retry(fn, {
      maxAttempts: 3,
      initialDelayMs: 100,
      onRetry,
    });
    await vi.advanceTimersByTimeAsync(500);

    await promise;
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, 100);
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 2, 200);
  });

  it('applies exponential backoff', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok');

    const onRetry = vi.fn();

    const promise = retry(fn, {
      maxAttempts: 3,
      initialDelayMs: 100,
      backoffMultiplier: 2,
      onRetry,
    });
    await vi.advanceTimersByTimeAsync(1000);

    await promise;
    // First retry delay: 100, second: 200
    expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 1, 100);
    expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2, 200);
  });

  it('throws on cancellation via signal', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const controller = new AbortController();
    controller.abort();

    await expect(
      retry(fn, { signal: controller.signal }),
    ).rejects.toThrow('Operation was cancelled');
    expect(fn).not.toHaveBeenCalled();
  });

  it('uses defaults when no options provided', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await retry(fn);
    expect(result).toBe('ok');
  });
});

// ============================================================================
// formatBytes
// ============================================================================

describe('formatBytes', () => {
  it('formats 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats bytes (< 1024)', () => {
    expect(formatBytes(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1.00 KB');
  });

  it('formats megabytes', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
  });

  it('formats gigabytes', () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB');
  });

  it('formats with appropriate decimal places', () => {
    // 10+ value => 1 decimal
    expect(formatBytes(15 * 1024)).toBe('15.0 KB');
    // 100+ value => 0 decimals
    expect(formatBytes(150 * 1024)).toBe('150 KB');
  });
});

// ============================================================================
// formatDuration
// ============================================================================

describe('formatDuration', () => {
  it('formats 0ms', () => {
    expect(formatDuration(0)).toBe('0ms');
  });

  it('formats milliseconds (< 1s)', () => {
    expect(formatDuration(500)).toBe('500ms');
  });

  it('formats seconds', () => {
    expect(formatDuration(5000)).toBe('5s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(90_000)).toBe('1m 30s');
  });

  it('formats exact minutes', () => {
    expect(formatDuration(120_000)).toBe('2m');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(3_900_000)).toBe('1h 5m');
  });

  it('formats exact hours', () => {
    expect(formatDuration(3_600_000)).toBe('1h');
  });

  it('handles negative as 0ms', () => {
    expect(formatDuration(-100)).toBe('0ms');
  });
});

// ============================================================================
// truncate
// ============================================================================

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

// ============================================================================
// pick
// ============================================================================

describe('pick', () => {
  it('picks specified keys', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = pick(obj, ['a', 'c']);
    expect(result).toEqual({ a: 1, c: 3 });
  });

  it('returns empty object for empty keys', () => {
    const obj = { a: 1, b: 2 };
    const result = pick(obj, []);
    expect(result).toEqual({});
  });

  it('ignores keys not present on object', () => {
    const obj = { a: 1 } as Record<string, number>;
    const result = pick(obj, ['a' as keyof typeof obj, 'z' as keyof typeof obj]);
    expect(result).toEqual({ a: 1 });
  });
});

// ============================================================================
// omit
// ============================================================================

describe('omit', () => {
  it('omits specified keys', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = omit(obj, ['b']);
    expect(result).toEqual({ a: 1, c: 3 });
  });

  it('returns full copy for empty omit list', () => {
    const obj = { a: 1, b: 2 };
    const result = omit(obj, []);
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('returns empty object when all keys omitted', () => {
    const obj = { a: 1, b: 2 };
    const result = omit(obj, ['a', 'b']);
    expect(result).toEqual({});
  });
});

// ============================================================================
// Type Guards
// ============================================================================

describe('isNotNullish', () => {
  it('returns true for non-nullish values', () => {
    expect(isNotNullish(0)).toBe(true);
    expect(isNotNullish('')).toBe(true);
    expect(isNotNullish(false)).toBe(true);
    expect(isNotNullish([])).toBe(true);
    expect(isNotNullish({})).toBe(true);
  });

  it('returns false for null', () => {
    expect(isNotNullish(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isNotNullish(undefined)).toBe(false);
  });
});

describe('isString', () => {
  it('returns true for strings', () => {
    expect(isString('')).toBe(true);
    expect(isString('hello')).toBe(true);
  });

  it('returns false for non-strings', () => {
    expect(isString(42)).toBe(false);
    expect(isString(null)).toBe(false);
    expect(isString(undefined)).toBe(false);
    expect(isString([])).toBe(false);
    expect(isString({})).toBe(false);
  });
});

describe('isNumber', () => {
  it('returns true for numbers', () => {
    expect(isNumber(0)).toBe(true);
    expect(isNumber(42)).toBe(true);
    expect(isNumber(-1.5)).toBe(true);
    expect(isNumber(Infinity)).toBe(true);
  });

  it('returns false for NaN', () => {
    expect(isNumber(NaN)).toBe(false);
  });

  it('returns false for non-numbers', () => {
    expect(isNumber('42')).toBe(false);
    expect(isNumber(null)).toBe(false);
    expect(isNumber(undefined)).toBe(false);
  });
});

describe('isObject', () => {
  it('returns true for plain objects', () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ a: 1 })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isObject(null)).toBe(false);
  });

  it('returns false for arrays', () => {
    expect(isObject([])).toBe(false);
  });

  it('returns false for primitives', () => {
    expect(isObject('string')).toBe(false);
    expect(isObject(42)).toBe(false);
    expect(isObject(true)).toBe(false);
  });
});

// ============================================================================
// chunk
// ============================================================================

describe('chunk', () => {
  it('chunks array into pieces of specified size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('handles exact division', () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
  });

  it('returns empty array for empty input', () => {
    expect(chunk([], 3)).toEqual([]);
  });

  it('returns single chunk when size >= array length', () => {
    expect(chunk([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
  });

  it('throws on zero size', () => {
    expect(() => chunk([1, 2], 0)).toThrow('Chunk size must be positive');
  });

  it('throws on negative size', () => {
    expect(() => chunk([1, 2], -1)).toThrow('Chunk size must be positive');
  });
});

// ============================================================================
// range
// ============================================================================

describe('range', () => {
  it('creates ascending range', () => {
    expect(range(0, 5)).toEqual([0, 1, 2, 3, 4]);
  });

  it('creates range with custom step', () => {
    expect(range(0, 10, 2)).toEqual([0, 2, 4, 6, 8]);
  });

  it('creates descending range with negative step', () => {
    expect(range(5, 0, -1)).toEqual([5, 4, 3, 2, 1]);
  });

  it('returns empty array when start equals end', () => {
    expect(range(5, 5)).toEqual([]);
  });

  it('returns empty array for impossible range', () => {
    expect(range(5, 0, 1)).toEqual([]);
  });

  it('throws on zero step', () => {
    expect(() => range(0, 5, 0)).toThrow('Step cannot be zero');
  });
});

// ============================================================================
// debounce
// ============================================================================

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
    debounced(); // reset
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

// ============================================================================
// throttle
// ============================================================================

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('invokes immediately on first call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 200);

    throttled();
    expect(fn).toHaveBeenCalledOnce();
  });

  it('suppresses calls within interval', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 200);

    throttled(); // executes
    throttled(); // suppressed
    throttled(); // suppressed

    expect(fn).toHaveBeenCalledOnce();
  });

  it('allows call after interval passes', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 200);

    throttled();
    vi.advanceTimersByTime(200);
    throttled();

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('passes arguments to the underlying function', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled('x', 'y');
    expect(fn).toHaveBeenCalledWith('x', 'y');
  });
});

// ============================================================================
// mapWithConcurrency
// ============================================================================

describe('mapWithConcurrency', () => {
  it('processes all tasks', async () => {
    const tasks = [1, 2, 3, 4, 5];
    const results = await mapWithConcurrency(
      tasks,
      async (n) => n * 2,
      2,
    );
    expect(results).toEqual([2, 4, 6, 8, 10]);
  });

  it('maintains order', async () => {
    const tasks = ['a', 'b', 'c'];
    const results = await mapWithConcurrency(
      tasks,
      async (s) => s.toUpperCase(),
      1,
    );
    expect(results).toEqual(['A', 'B', 'C']);
  });

  it('handles empty array', async () => {
    const results = await mapWithConcurrency(
      [],
      async (x: number) => x,
      5,
    );
    expect(results).toEqual([]);
  });

  it('throws on zero concurrency', async () => {
    await expect(
      mapWithConcurrency([1], async (x) => x, 0),
    ).rejects.toThrow('Concurrency must be positive');
  });

  it('throws on negative concurrency', async () => {
    await expect(
      mapWithConcurrency([1], async (x) => x, -1),
    ).rejects.toThrow('Concurrency must be positive');
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
        // Simulate async work
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
