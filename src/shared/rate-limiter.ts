/**
 * Rate limiter module for the Runware MCP server.
 *
 * Implements a token bucket algorithm for request rate limiting.
 * Prevents abuse and ensures fair API usage.
 */

import { config } from './config.js';
import { RateLimitError } from './errors.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Options for creating a rate limiter.
 */
export interface RateLimiterOptions {
  /**
   * Maximum number of tokens in the bucket.
   * Determines burst capacity.
   */
  readonly maxTokens: number;

  /**
   * Tokens added per second.
   * Determines sustained request rate.
   */
  readonly refillRate: number;
}

// ============================================================================
// Rate Limiter Class
// ============================================================================

/**
 * Token bucket rate limiter.
 *
 * Allows burst traffic up to maxTokens, then throttles to refillRate.
 * Thread-safe for single-threaded async environments.
 */
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
    this.tokens = options.maxTokens; // Start with full bucket
    this.lastRefillTime = Date.now();
  }

  /**
   * Attempts to acquire a token without blocking.
   *
   * @returns true if a token was acquired, false otherwise
   */
  acquire(): boolean {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Attempts to acquire a token, throwing if none available.
   *
   * @throws RateLimitError if no tokens are available
   */
  acquireOrThrow(): void {
    if (!this.acquire()) {
      const retryAfterMs = this.getTimeUntilNextToken();
      throw new RateLimitError(
        'Rate limit exceeded. Please wait before making more requests.',
        retryAfterMs,
      );
    }
  }

  /**
   * Waits until a token is available, then acquires it.
   *
   * @param signal - Optional abort signal for cancellation
   * @returns Promise that resolves when token is acquired
   */
  async waitForToken(signal?: AbortSignal): Promise<void> {
    // Check if already available
    if (this.acquire()) {
      return;
    }

    // Wait for next token
    const waitTime = this.getTimeUntilNextToken();

    await new Promise<void>((resolve, reject) => {
      // Check for cancellation
      if (signal?.aborted === true) {
        reject(new Error('Rate limit wait was cancelled'));
        return;
      }

      const timeoutId = setTimeout(() => {
        // Refill and try to acquire
        this.refill();
        if (this.tokens >= 1) {
          this.tokens -= 1;
        }
        resolve();
      }, waitTime);

      // Handle cancellation during wait
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

  /**
   * Gets the current number of available tokens.
   *
   * @returns Number of tokens currently available
   */
  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  /**
   * Gets the time until the next token becomes available.
   *
   * @returns Time in milliseconds until next token
   */
  getTimeUntilNextToken(): number {
    this.refill();

    if (this.tokens >= 1) {
      return 0;
    }

    // Calculate time to get one token
    const tokensNeeded = 1 - this.tokens;
    const secondsNeeded = tokensNeeded / this.refillRate;
    return Math.ceil(secondsNeeded * 1000);
  }

  /**
   * Resets the rate limiter to full capacity.
   * Useful for testing or after error recovery.
   */
  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefillTime = Date.now();
  }

  /**
   * Refills tokens based on elapsed time.
   */
  private refill(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillTime) / 1000;

    if (elapsedSeconds > 0) {
      // Add tokens based on elapsed time
      const tokensToAdd = elapsedSeconds * this.refillRate;
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefillTime = now;
    }
  }
}

// ============================================================================
// Default Rate Limiter
// ============================================================================

/**
 * Default rate limiter instance.
 *
 * Uses configuration values from environment variables:
 * - RATE_LIMIT_MAX_TOKENS: Burst capacity
 * - RATE_LIMIT_REFILL_RATE: Tokens per second
 */
export const defaultRateLimiter = new RateLimiter({
  maxTokens: config.RATE_LIMIT_MAX_TOKENS,
  refillRate: config.RATE_LIMIT_REFILL_RATE,
});

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Creates a new rate limiter with custom options.
 *
 * @param options - Rate limiter configuration
 * @returns New RateLimiter instance
 */
export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  return new RateLimiter(options);
}

// ============================================================================
// Decorator/Wrapper Functions
// ============================================================================

/**
 * Wraps an async function with rate limiting.
 *
 * @param fn - Function to wrap
 * @param limiter - Rate limiter to use (defaults to defaultRateLimiter)
 * @returns Wrapped function that respects rate limits
 */
export function withRateLimit<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  limiter: RateLimiter = defaultRateLimiter,
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    limiter.acquireOrThrow();
    return fn(...args);
  };
}

/**
 * Wraps an async function with rate limiting that waits for tokens.
 *
 * @param fn - Function to wrap
 * @param limiter - Rate limiter to use (defaults to defaultRateLimiter)
 * @returns Wrapped function that waits for rate limit tokens
 */
export function withRateLimitWait<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  limiter: RateLimiter = defaultRateLimiter,
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    await limiter.waitForToken();
    return fn(...args);
  };
}
