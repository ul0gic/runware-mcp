import { config } from './config.js';
import { RateLimitError } from './errors.js';

export interface RateLimiterOptions {
  /** Bucket capacity — the burst allowance. */
  readonly maxTokens: number;

  /** Tokens added per second — the sustained rate. */
  readonly refillRate: number;
}

/** Token bucket: bursts up to maxTokens, then throttles to refillRate. */
export class RateLimiter {
  private readonly maxTokens: number;
  private readonly refillRate: number;
  private tokens: number;
  private lastRefillTime: number;

  constructor(options: RateLimiterOptions) {
    if (options.maxTokens <= 0) {
      throw new Error('maxTokens must be positive');
    }
    if (options.refillRate <= 0) {
      throw new Error('refillRate must be positive');
    }

    this.maxTokens = options.maxTokens;
    this.refillRate = options.refillRate;
    this.tokens = options.maxTokens;
    this.lastRefillTime = Date.now();
  }

  /** Non-blocking. */
  acquire(): boolean {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }

  /** Throws RateLimitError carrying a retry-after hint when the bucket is empty. */
  acquireOrThrow(): void {
    if (!this.acquire()) {
      const retryAfterMs = this.getTimeUntilNextToken();
      throw new RateLimitError(
        'Rate limit exceeded. Please wait before making more requests.',
        retryAfterMs,
      );
    }
  }

  /** Rejects with a cancellation error if the signal aborts before a token arrives. */
  async waitForToken(signal?: AbortSignal): Promise<void> {
    if (this.acquire()) {
      return;
    }

    const waitTime = this.getTimeUntilNextToken();

    await new Promise<void>((resolve, reject) => {
      if (signal?.aborted === true) {
        reject(new Error('Rate limit wait was cancelled'));
        return;
      }

      const timeoutId = setTimeout(() => {
        this.refill();
        if (this.tokens >= 1) {
          this.tokens -= 1;
        }
        resolve();
      }, waitTime);

      signal?.addEventListener(
        'abort',
        () => {
          clearTimeout(timeoutId);
          reject(new Error('Rate limit wait was cancelled'));
        },
        { once: true },
      );
    });
  }

  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  /** Milliseconds until one whole token is available; 0 when one already is. */
  getTimeUntilNextToken(): number {
    this.refill();

    if (this.tokens >= 1) {
      return 0;
    }

    const tokensNeeded = 1 - this.tokens;
    const secondsNeeded = tokensNeeded / this.refillRate;
    return Math.ceil(secondsNeeded * 1000);
  }

  /** Refills to full capacity — discards accumulated throttling state. */
  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefillTime = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillTime) / 1000;

    if (elapsedSeconds > 0) {
      const tokensToAdd = elapsedSeconds * this.refillRate;
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefillTime = now;
    }
  }
}

/** Process-wide limiter sized by RATE_LIMIT_MAX_TOKENS / RATE_LIMIT_REFILL_RATE. */
export const defaultRateLimiter = new RateLimiter({
  maxTokens: config.RATE_LIMIT_MAX_TOKENS,
  refillRate: config.RATE_LIMIT_REFILL_RATE,
});

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  return new RateLimiter(options);
}

/** Rejects immediately when the bucket is empty; use withRateLimitWait to queue instead. */
export function withRateLimit<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  limiter: RateLimiter = defaultRateLimiter,
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    limiter.acquireOrThrow();
    return fn(...args);
  };
}

/** Waits for a token rather than rejecting; the wait is uncancellable through this wrapper. */
export function withRateLimitWait<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  limiter: RateLimiter = defaultRateLimiter,
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    await limiter.waitForToken();
    return fn(...args);
  };
}
