// Does:  Throttles outgoing API calls with a token bucket refilled continuously at refillRate per second.
// Holds: A token is spent only when a whole one is available; queued waiters are admitted one token at a time.

import { config } from './config.js';
import { RateLimitError } from './errors.js';

// Holds: maxTokens is the burst capacity; refillRate is tokens per second.
export interface RateLimiterOptions {
  readonly maxTokens: number;

  readonly refillRate: number;
}

interface Waiter {
  readonly resolve: () => void;
  readonly signal: AbortSignal | undefined;
  readonly onAbort: () => void;
}

export class RateLimiter {
  private readonly waiters: Waiter[] = [];
  private drainTimer: ReturnType<typeof setTimeout> | undefined;
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

  acquire(): boolean {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }

  acquireOrThrow(): void {
    if (this.acquire()) {
      return;
    }

    const retryAfterMs = this.getTimeUntilNextToken();
    throw new RateLimitError('Rate limit exceeded. Please wait before making more requests.', retryAfterMs);
  }

  // Holds: Waiters are admitted in arrival order, each spending one whole token; none resolves without one.
  waitForToken(signal?: AbortSignal): Promise<void> {
    if (this.waiters.length === 0 && this.acquire()) {
      return Promise.resolve();
    }
    if (signal?.aborted === true) {
      return Promise.reject(new Error('Rate limit wait was cancelled'));
    }

    return new Promise<void>((resolve, reject) => {
      const waiter: Waiter = {
        resolve,
        signal,
        onAbort: () => {
          this.removeWaiter(waiter);
          reject(new Error('Rate limit wait was cancelled'));
        },
      };
      signal?.addEventListener('abort', waiter.onAbort, { once: true });
      this.waiters.push(waiter);
      this.scheduleDrain();
    });
  }

  private scheduleDrain(): void {
    if (this.drainTimer !== undefined || this.waiters.length === 0) {
      return;
    }
    this.drainTimer = setTimeout(() => {
      this.drainTimer = undefined;
      this.drain();
    }, this.getTimeUntilNextToken());
  }

  private drain(): void {
    let waiter = this.waiters[0];
    while (waiter !== undefined && this.acquire()) {
      this.waiters.shift();
      waiter.signal?.removeEventListener('abort', waiter.onAbort);
      waiter.resolve();
      waiter = this.waiters[0];
    }
    this.scheduleDrain();
  }

  private removeWaiter(waiter: Waiter): void {
    const index = this.waiters.indexOf(waiter);
    if (index !== -1) {
      this.waiters.splice(index, 1);
    }
    if (this.waiters.length === 0 && this.drainTimer !== undefined) {
      clearTimeout(this.drainTimer);
      this.drainTimer = undefined;
    }
  }

  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  getTimeUntilNextToken(): number {
    this.refill();

    if (this.tokens >= 1) {
      return 0;
    }

    const tokensNeeded = 1 - this.tokens;
    const secondsNeeded = tokensNeeded / this.refillRate;
    return Math.ceil(secondsNeeded * 1000);
  }

  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefillTime = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillTime) / 1000;

    if (elapsedSeconds <= 0) {
      return;
    }

    const tokensToAdd = elapsedSeconds * this.refillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefillTime = now;
  }
}

export const defaultRateLimiter = new RateLimiter({
  maxTokens: config.RATE_LIMIT_MAX_TOKENS,
  refillRate: config.RATE_LIMIT_REFILL_RATE,
});
