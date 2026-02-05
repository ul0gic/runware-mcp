import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { LRUCache, createCache, createCacheKey } from '../../../src/shared/cache.js';

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

describe('LRUCache constructor', () => {
  it('throws when maxSize is zero', () => {
    expect(() => new LRUCache({ maxSize: 0 })).toThrow('maxSize must be positive');
  });

  it('throws when maxSize is negative', () => {
    expect(() => new LRUCache({ maxSize: -1 })).toThrow('maxSize must be positive');
  });

  it('throws when ttlMs is zero', () => {
    expect(() => new LRUCache({ maxSize: 10, ttlMs: 0 })).toThrow(
      'ttlMs must be positive if specified',
    );
  });

  it('throws when ttlMs is negative', () => {
    expect(() => new LRUCache({ maxSize: 10, ttlMs: -100 })).toThrow(
      'ttlMs must be positive if specified',
    );
  });

  it('creates successfully with valid options', () => {
    const cache = new LRUCache({ maxSize: 10 });
    expect(cache.size).toBe(0);
  });

  it('creates successfully with TTL', () => {
    const cache = new LRUCache({ maxSize: 10, ttlMs: 5000 });
    expect(cache.size).toBe(0);
  });
});

// ============================================================================
// get / set
// ============================================================================

describe('LRUCache get/set', () => {
  it('returns undefined for missing key', () => {
    const cache = new LRUCache<string, number>({ maxSize: 10 });
    expect(cache.get('missing')).toBeUndefined();
  });

  it('stores and retrieves a value', () => {
    const cache = new LRUCache<string, number>({ maxSize: 10 });
    cache.set('key', 42);
    expect(cache.get('key')).toBe(42);
  });

  it('overwrites existing value', () => {
    const cache = new LRUCache<string, string>({ maxSize: 10 });
    cache.set('key', 'old');
    cache.set('key', 'new');
    expect(cache.get('key')).toBe('new');
    expect(cache.size).toBe(1);
  });

  it('stores multiple keys', () => {
    const cache = new LRUCache<string, number>({ maxSize: 10 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
  });
});

// ============================================================================
// TTL Expiry
// ============================================================================

describe('LRUCache TTL', () => {
  it('returns value before TTL expires', () => {
    const cache = new LRUCache<string, string>({ maxSize: 10, ttlMs: 5000 });
    cache.set('key', 'value');

    vi.advanceTimersByTime(4999);
    expect(cache.get('key')).toBe('value');
  });

  it('returns undefined after TTL expires', () => {
    const cache = new LRUCache<string, string>({ maxSize: 10, ttlMs: 5000 });
    cache.set('key', 'value');

    vi.advanceTimersByTime(5001);
    expect(cache.get('key')).toBeUndefined();
  });

  it('supports per-entry TTL override', () => {
    const cache = new LRUCache<string, string>({ maxSize: 10, ttlMs: 10_000 });
    cache.set('short', 'value', 1000);
    cache.set('long', 'value');

    vi.advanceTimersByTime(2000);
    expect(cache.get('short')).toBeUndefined();
    expect(cache.get('long')).toBe('value');
  });

  it('has no expiry when ttlMs not specified', () => {
    const cache = new LRUCache<string, string>({ maxSize: 10 });
    cache.set('key', 'value');

    vi.advanceTimersByTime(100_000_000);
    expect(cache.get('key')).toBe('value');
  });
});

// ============================================================================
// has
// ============================================================================

describe('LRUCache has', () => {
  it('returns false for missing key', () => {
    const cache = new LRUCache<string, number>({ maxSize: 10 });
    expect(cache.has('missing')).toBe(false);
  });

  it('returns true for existing key', () => {
    const cache = new LRUCache<string, number>({ maxSize: 10 });
    cache.set('key', 1);
    expect(cache.has('key')).toBe(true);
  });

  it('returns false for expired key', () => {
    const cache = new LRUCache<string, number>({ maxSize: 10, ttlMs: 1000 });
    cache.set('key', 1);
    vi.advanceTimersByTime(1001);
    expect(cache.has('key')).toBe(false);
  });
});

// ============================================================================
// delete
// ============================================================================

describe('LRUCache delete', () => {
  it('returns false for missing key', () => {
    const cache = new LRUCache<string, number>({ maxSize: 10 });
    expect(cache.delete('missing')).toBe(false);
  });

  it('returns true and removes existing key', () => {
    const cache = new LRUCache<string, number>({ maxSize: 10 });
    cache.set('key', 42);
    expect(cache.delete('key')).toBe(true);
    expect(cache.get('key')).toBeUndefined();
    expect(cache.size).toBe(0);
  });
});

// ============================================================================
// clear
// ============================================================================

describe('LRUCache clear', () => {
  it('removes all entries', () => {
    const cache = new LRUCache<string, number>({ maxSize: 10 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    expect(cache.size).toBe(3);

    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBeUndefined();
  });
});

// ============================================================================
// size
// ============================================================================

describe('LRUCache size', () => {
  it('returns 0 for empty cache', () => {
    const cache = new LRUCache<string, number>({ maxSize: 10 });
    expect(cache.size).toBe(0);
  });

  it('returns correct count after adds', () => {
    const cache = new LRUCache<string, number>({ maxSize: 10 });
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.size).toBe(2);
  });

  it('does not double-count overwrites', () => {
    const cache = new LRUCache<string, number>({ maxSize: 10 });
    cache.set('a', 1);
    cache.set('a', 2);
    expect(cache.size).toBe(1);
  });
});

// ============================================================================
// LRU Eviction
// ============================================================================

describe('LRUCache eviction', () => {
  it('evicts least recently used when at capacity', () => {
    const cache = new LRUCache<string, number>({ maxSize: 3 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    // Adding a 4th should evict 'a' (oldest)
    cache.set('d', 4);

    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
    expect(cache.get('d')).toBe(4);
    expect(cache.size).toBe(3);
  });

  it('accessing a key moves it to most recently used', () => {
    const cache = new LRUCache<string, number>({ maxSize: 3 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    // Access 'a' to make it most recently used
    cache.get('a');

    // Adding 'd' should evict 'b' (now the oldest)
    cache.set('d', 4);

    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBe(3);
    expect(cache.get('d')).toBe(4);
  });
});

// ============================================================================
// prune
// ============================================================================

describe('LRUCache prune', () => {
  it('removes expired entries', () => {
    const cache = new LRUCache<string, string>({ maxSize: 10, ttlMs: 1000 });
    cache.set('a', 'val');
    cache.set('b', 'val');

    vi.advanceTimersByTime(1001);
    cache.set('c', 'val'); // not expired

    const removed = cache.prune();
    expect(removed).toBe(2);
    expect(cache.size).toBe(1);
    expect(cache.get('c')).toBe('val');
  });

  it('returns 0 when nothing is expired', () => {
    const cache = new LRUCache<string, string>({ maxSize: 10, ttlMs: 10_000 });
    cache.set('a', 'val');
    const removed = cache.prune();
    expect(removed).toBe(0);
  });
});

// ============================================================================
// getOrSet / getOrSetSync
// ============================================================================

describe('LRUCache getOrSet', () => {
  it('returns cached value if exists', async () => {
    const cache = new LRUCache<string, number>({ maxSize: 10 });
    cache.set('key', 42);

    const factory = vi.fn().mockResolvedValue(99);
    const result = await cache.getOrSet('key', factory);

    expect(result).toBe(42);
    expect(factory).not.toHaveBeenCalled();
  });

  it('calls factory and caches when key missing', async () => {
    const cache = new LRUCache<string, number>({ maxSize: 10 });

    const factory = vi.fn().mockResolvedValue(99);
    const result = await cache.getOrSet('key', factory);

    expect(result).toBe(99);
    expect(factory).toHaveBeenCalledOnce();
    expect(cache.get('key')).toBe(99);
  });
});

describe('LRUCache getOrSetSync', () => {
  it('returns cached value if exists', () => {
    const cache = new LRUCache<string, number>({ maxSize: 10 });
    cache.set('key', 42);

    const factory = vi.fn().mockReturnValue(99);
    const result = cache.getOrSetSync('key', factory);

    expect(result).toBe(42);
    expect(factory).not.toHaveBeenCalled();
  });

  it('calls factory and caches when key missing', () => {
    const cache = new LRUCache<string, number>({ maxSize: 10 });

    const factory = vi.fn().mockReturnValue(99);
    const result = cache.getOrSetSync('key', factory);

    expect(result).toBe(99);
    expect(factory).toHaveBeenCalledOnce();
    expect(cache.get('key')).toBe(99);
  });
});

// ============================================================================
// createCache factory
// ============================================================================

describe('createCache', () => {
  it('creates a new LRUCache instance', () => {
    const cache = createCache<string, number>({ maxSize: 50, ttlMs: 1000 });
    expect(cache).toBeInstanceOf(LRUCache);
    expect(cache.size).toBe(0);
  });
});

// ============================================================================
// createCacheKey
// ============================================================================

describe('createCacheKey', () => {
  it('creates stable key from object', () => {
    const key = createCacheKey({ b: 2, a: 1 });
    expect(key).toBe('{"a":1,"b":2}');
  });

  it('produces same key regardless of property order', () => {
    const key1 = createCacheKey({ x: 'hello', y: 'world' });
    const key2 = createCacheKey({ y: 'world', x: 'hello' });
    expect(key1).toBe(key2);
  });

  it('handles empty object', () => {
    const key = createCacheKey({});
    expect(key).toBe('{}');
  });

  it('handles nested values', () => {
    const key = createCacheKey({ key: 'value', num: 42 });
    expect(typeof key).toBe('string');
    expect(key.length).toBeGreaterThan(0);
  });
});
