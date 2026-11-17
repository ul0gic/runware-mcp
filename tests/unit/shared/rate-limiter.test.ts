// Does:  Proves the token bucket bursts, refills, caps at max, queues concurrent waiters, and honours abort.
// Holds: config is mocked and timers are faked; the limiter's accounting is real.

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
}));

import { RateLimiter } from '../../../src/shared/rate-limiter.js';
import { RateLimitError } from '../../../src/shared/errors.js';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('RateLimiter constructor', () => {
  it('throws when maxTokens is zero', () => {
    expect(() => new RateLimiter({ maxTokens: 0, refillRate: 1 })).toThrow('maxTokens must be positive');
  });

  it('throws when maxTokens is negative', () => {
    expect(() => new RateLimiter({ maxTokens: -5, refillRate: 1 })).toThrow('maxTokens must be positive');
  });

  it('throws when refillRate is zero', () => {
    expect(() => new RateLimiter({ maxTokens: 10, refillRate: 0 })).toThrow('refillRate must be positive');
  });

  it('throws when refillRate is negative', () => {
    expect(() => new RateLimiter({ maxTokens: 10, refillRate: -1 })).toThrow('refillRate must be positive');
  });
});

describe('RateLimiter.acquire', () => {
  it('decrements tokens on acquire', () => {
    const limiter = new RateLimiter({ maxTokens: 3, refillRate: 1 });
    limiter.acquire();
    expect(limiter.getAvailableTokens()).toBe(2);
  });

  it('returns false when all tokens are exhausted', () => {
    const limiter = new RateLimiter({ maxTokens: 2, refillRate: 1 });
    limiter.acquire();
    limiter.acquire();
    expect(limiter.acquire()).toBe(false);
  });

  it('can burst up to maxTokens', () => {
    const limiter = new RateLimiter({ maxTokens: 5, refillRate: 1 });
    for (let i = 0; i < 5; i++) {
      expect(limiter.acquire()).toBe(true);
    }
    expect(limiter.acquire()).toBe(false);
  });
});

describe('RateLimiter refill', () => {
  it('refills tokens over time', () => {
    const limiter = new RateLimiter({ maxTokens: 5, refillRate: 1 });

    for (let i = 0; i < 5; i++) {
      limiter.acquire();
    }
    expect(limiter.getAvailableTokens()).toBe(0);

    vi.advanceTimersByTime(2000);
    expect(limiter.getAvailableTokens()).toBe(2);
  });

  it('does not exceed maxTokens on refill', () => {
    const limiter = new RateLimiter({ maxTokens: 5, refillRate: 10 });

    limiter.acquire();
    limiter.acquire();

    vi.advanceTimersByTime(10_000);
    expect(limiter.getAvailableTokens()).toBe(5);
  });

  it('refills at correct rate', () => {
    const limiter = new RateLimiter({ maxTokens: 10, refillRate: 2 });

    for (let i = 0; i < 10; i++) {
      limiter.acquire();
    }

    vi.advanceTimersByTime(1000);
    expect(limiter.getAvailableTokens()).toBe(2);
  });
});

describe('RateLimiter.acquireOrThrow', () => {
  it('throws RateLimitError when no tokens', () => {
    const limiter = new RateLimiter({ maxTokens: 1, refillRate: 1 });
    limiter.acquire();
    expect(() => limiter.acquireOrThrow()).toThrow(RateLimitError);
  });

  it('RateLimitError includes retryAfterMs', () => {
    const limiter = new RateLimiter({ maxTokens: 1, refillRate: 1 });
    limiter.acquire();
    let thrown: unknown;
    try {
      limiter.acquireOrThrow();
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(RateLimitError);
    expect((thrown as RateLimitError).data.retryAfterMs).toBeGreaterThan(0);
  });
});

describe('RateLimiter.waitForToken', () => {
  it('resolves immediately when tokens are available', async () => {
    const limiter = new RateLimiter({ maxTokens: 5, refillRate: 1 });
    await limiter.waitForToken();
    expect(limiter.getAvailableTokens()).toBe(4);
  });

  it('resolves only after the refill window elapses', async () => {
    const limiter = new RateLimiter({ maxTokens: 1, refillRate: 1 });
    limiter.acquire();

    let resolved = false;
    const promise = limiter.waitForToken().then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(500);
    expect(resolved).toBe(false);

    await vi.advanceTimersByTimeAsync(600);
    await promise;
    expect(resolved).toBe(true);
  });

  it('rejects when signal is already aborted', async () => {
    const limiter = new RateLimiter({ maxTokens: 1, refillRate: 1 });
    limiter.acquire();

    const controller = new AbortController();
    controller.abort();

    await expect(limiter.waitForToken(controller.signal)).rejects.toThrow('Rate limit wait was cancelled');
  });

  it('rejects when signal aborts during wait', async () => {
    const limiter = new RateLimiter({ maxTokens: 1, refillRate: 0.1 });
    limiter.acquire();

    const controller = new AbortController();
    const promise = limiter.waitForToken(controller.signal);

    controller.abort();

    await expect(promise).rejects.toThrow('Rate limit wait was cancelled');
  });
});

describe('RateLimiter.waitForToken with concurrent waiters', () => {
  it('admits concurrent waiters one per refill interval when one token is available', async () => {
    const limiter = new RateLimiter({ maxTokens: 1, refillRate: 1 });
    const admittedAt: number[] = [];
    const start = Date.now();

    const waiters = Array.from({ length: 4 }, () =>
      limiter.waitForToken().then(() => {
        admittedAt.push(Date.now() - start);
      }),
    );
    await vi.advanceTimersByTimeAsync(5000);
    await Promise.all(waiters);

    expect(admittedAt).toEqual([0, 1000, 2000, 3000]);
  });

  it('removes its abort listener once a waiter is admitted', async () => {
    const limiter = new RateLimiter({ maxTokens: 1, refillRate: 1 });
    limiter.acquire();
    const controller = new AbortController();
    const added = vi.spyOn(controller.signal, 'addEventListener');
    const removed = vi.spyOn(controller.signal, 'removeEventListener');

    const waiter = limiter.waitForToken(controller.signal);
    await vi.advanceTimersByTimeAsync(1000);
    await waiter;

    expect(added).toHaveBeenCalledTimes(1);
    expect(removed).toHaveBeenCalledTimes(1);
  });

  it('lets the next waiter take the token a cancelled waiter gave up', async () => {
    const limiter = new RateLimiter({ maxTokens: 1, refillRate: 1 });
    limiter.acquire();
    const controller = new AbortController();
    const cancelled = limiter.waitForToken(controller.signal);
    let admitted = false;
    const next = limiter.waitForToken().then(() => {
      admitted = true;
    });

    controller.abort();
    await expect(cancelled).rejects.toThrow('Rate limit wait was cancelled');
    await vi.advanceTimersByTimeAsync(1000);
    await next;

    expect(admitted).toBe(true);
    expect(limiter.getAvailableTokens()).toBe(0);
  });
});

describe('RateLimiter.getTimeUntilNextToken', () => {
  it('returns 0 when tokens are available', () => {
    const limiter = new RateLimiter({ maxTokens: 5, refillRate: 1 });
    expect(limiter.getTimeUntilNextToken()).toBe(0);
  });

  it('returns positive ms when no tokens', () => {
    const limiter = new RateLimiter({ maxTokens: 1, refillRate: 1 });
    limiter.acquire();
    const time = limiter.getTimeUntilNextToken();
    expect(time).toBeGreaterThan(0);
  });
});

describe('RateLimiter.reset', () => {
  it('restores to full capacity', () => {
    const limiter = new RateLimiter({ maxTokens: 5, refillRate: 1 });
    limiter.acquire();
    limiter.acquire();
    limiter.acquire();
    expect(limiter.getAvailableTokens()).toBe(2);

    limiter.reset();
    expect(limiter.getAvailableTokens()).toBe(5);
  });
});
