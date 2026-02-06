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

import { RateLimiter, createRateLimiter } from '../../../src/shared/rate-limiter.js';
import { RateLimitError } from '../../../src/shared/errors.js';

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// ============================================================================
// Constructor
// ============================================================================

describe('RateLimiter constructor', () => {
  it('throws when maxTokens is zero', () => {
    expect(() => new RateLimiter({ maxTokens: 0, refillRate: 1 })).toThrow(
      'maxTokens must be positive',
    );
  });

  it('throws when maxTokens is negative', () => {
    expect(() => new RateLimiter({ maxTokens: -5, refillRate: 1 })).toThrow(
      'maxTokens must be positive',
    );
  });

  it('throws when refillRate is zero', () => {
    expect(() => new RateLimiter({ maxTokens: 10, refillRate: 0 })).toThrow(
      'refillRate must be positive',
    );
  });

  it('throws when refillRate is negative', () => {
    expect(() => new RateLimiter({ maxTokens: 10, refillRate: -1 })).toThrow(
      'refillRate must be positive',
    );
  });

  it('creates successfully with valid options', () => {
    const limiter = new RateLimiter({ maxTokens: 10, refillRate: 2 });
    expect(limiter.getAvailableTokens()).toBe(10);
  });
});

// ============================================================================
// acquire
// ============================================================================

describe('RateLimiter.acquire', () => {
  it('returns true when tokens are available', () => {
    const limiter = new RateLimiter({ maxTokens: 5, refillRate: 1 });
    expect(limiter.acquire()).toBe(true);
  });

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

// ============================================================================
// Refill
// ============================================================================

describe('RateLimiter refill', () => {
  it('refills tokens over time', () => {
    const limiter = new RateLimiter({ maxTokens: 5, refillRate: 1 });

    // Exhaust all tokens
    for (let i = 0; i < 5; i++) {
      limiter.acquire();
    }
    expect(limiter.getAvailableTokens()).toBe(0);

    // Advance 2 seconds => 2 tokens refilled (rate = 1/s)
    vi.advanceTimersByTime(2000);
    expect(limiter.getAvailableTokens()).toBe(2);
  });

  it('does not exceed maxTokens on refill', () => {
    const limiter = new RateLimiter({ maxTokens: 5, refillRate: 10 });

    // Exhaust 2 tokens
    limiter.acquire();
    limiter.acquire();

    // Advance enough to overfill
    vi.advanceTimersByTime(10_000);
    expect(limiter.getAvailableTokens()).toBe(5);
  });

  it('refills at correct rate', () => {
    const limiter = new RateLimiter({ maxTokens: 10, refillRate: 2 });

    // Exhaust all
    for (let i = 0; i < 10; i++) {
      limiter.acquire();
    }

    // 1 second at rate 2/s = 2 tokens
    vi.advanceTimersByTime(1000);
    expect(limiter.getAvailableTokens()).toBe(2);
  });
});

// ============================================================================
// acquireOrThrow
// ============================================================================

describe('RateLimiter.acquireOrThrow', () => {
  it('does not throw when tokens available', () => {
    const limiter = new RateLimiter({ maxTokens: 5, refillRate: 1 });
    expect(() => limiter.acquireOrThrow()).not.toThrow();
  });

  it('throws RateLimitError when no tokens', () => {
    const limiter = new RateLimiter({ maxTokens: 1, refillRate: 1 });
    limiter.acquire();
    expect(() => limiter.acquireOrThrow()).toThrow(RateLimitError);
  });

  it('RateLimitError includes retryAfterMs', () => {
    const limiter = new RateLimiter({ maxTokens: 1, refillRate: 1 });
    limiter.acquire();
    try {
      limiter.acquireOrThrow();
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError);
      const rateError = error as RateLimitError;
      expect(rateError.data.retryAfterMs).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// waitForToken
// ============================================================================

describe('RateLimiter.waitForToken', () => {
  it('resolves immediately when tokens are available', async () => {
    const limiter = new RateLimiter({ maxTokens: 5, refillRate: 1 });
    await limiter.waitForToken();
    expect(limiter.getAvailableTokens()).toBe(4);
  });

  it('waits and resolves when token becomes available', async () => {
    const limiter = new RateLimiter({ maxTokens: 1, refillRate: 1 });
    limiter.acquire(); // exhaust

    const promise = limiter.waitForToken();

    // Advance time past the refill window
    vi.advanceTimersByTime(1100);

    await promise;
    // Should have resolved
  });

  it('rejects when signal is already aborted', async () => {
    const limiter = new RateLimiter({ maxTokens: 1, refillRate: 1 });
    limiter.acquire();

    const controller = new AbortController();
    controller.abort();

    await expect(limiter.waitForToken(controller.signal)).rejects.toThrow(
      'Rate limit wait was cancelled',
    );
  });

  it('rejects when signal aborts during wait', async () => {
    const limiter = new RateLimiter({ maxTokens: 1, refillRate: 0.1 });
    limiter.acquire();

    const controller = new AbortController();
    const promise = limiter.waitForToken(controller.signal);

    // Abort before refill
    controller.abort();

    await expect(promise).rejects.toThrow('Rate limit wait was cancelled');
  });
});

// ============================================================================
// getTimeUntilNextToken
// ============================================================================

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

// ============================================================================
// reset
// ============================================================================

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

// ============================================================================
// createRateLimiter factory
// ============================================================================

describe('createRateLimiter', () => {
  it('creates a new RateLimiter instance', () => {
    const limiter = createRateLimiter({ maxTokens: 10, refillRate: 2 });
    expect(limiter).toBeInstanceOf(RateLimiter);
    expect(limiter.getAvailableTokens()).toBe(10);
  });
});
