/**
 * Cache module for the Runware MCP server.
 *
 * Provides an LRU (Least Recently Used) cache with optional TTL support.
 * Used for caching API responses and reducing redundant requests.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Internal cache entry with metadata.
 */
interface CacheEntry<V> {
  readonly value: V;
  readonly expiresAt: number | null;
}

/**
 * Options for creating an LRU cache.
 */
export interface LRUCacheOptions {
  /**
   * Maximum number of entries in the cache.
   */
  readonly maxSize: number;

  /**
   * Time-to-live in milliseconds.
   * If not specified, entries never expire.
   */
  readonly ttlMs?: number;
}

// ============================================================================
// LRU Cache Class
// ============================================================================

/**
 * LRU (Least Recently Used) cache with optional TTL.
 *
 * Entries are evicted in LRU order when the cache exceeds maxSize.
 * Entries with TTL are automatically invalidated after expiration.
 *
 * @typeParam K - Key type
 * @typeParam V - Value type
 */
export class LRUCache<K, V> {
  private readonly maxSize: number;
  private readonly ttlMs: number | null;
  private readonly cache: Map<K, CacheEntry<V>>;

  constructor(options: LRUCacheOptions) {
    if (options.maxSize <= 0) {
      throw new Error('maxSize must be positive');
    }
    if (options.ttlMs !== undefined && options.ttlMs <= 0) {
      throw new Error('ttlMs must be positive if specified');
    }

    this.maxSize = options.maxSize;
    this.ttlMs = options.ttlMs ?? null;
    this.cache = new Map();
  }

  /**
   * Gets a value from the cache.
   *
   * If the entry exists and is not expired, it is moved to the end
   * of the LRU order (most recently used).
   *
   * @param key - Cache key
   * @returns The cached value, or undefined if not found or expired
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (entry === undefined) {
      return undefined;
    }

    // Check expiration
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Sets a value in the cache.
   *
   * If the cache exceeds maxSize, the least recently used entry is evicted.
   *
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttlMs - Optional TTL override for this entry
   */
  set(key: K, value: V, ttlMs?: number): void {
    // Remove existing entry if present
    this.cache.delete(key);

    // Evict LRU entries if at capacity
    while (this.cache.size >= this.maxSize) {
      const iteratorResult = this.cache.keys().next();
      if (iteratorResult.done === true) {
        break;
      }
      this.cache.delete(iteratorResult.value);
    }

    // Calculate expiration
    const effectiveTtl = ttlMs ?? this.ttlMs;
    const expiresAt = effectiveTtl === null ? null : Date.now() + effectiveTtl;

    // Add new entry
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Checks if a key exists in the cache.
   *
   * Does not update LRU order.
   * Returns false for expired entries (without removing them).
   *
   * @param key - Cache key
   * @returns true if the key exists and is not expired
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);

    if (entry === undefined) {
      return false;
    }

    if (this.isExpired(entry)) {
      return false;
    }

    return true;
  }

  /**
   * Deletes a key from the cache.
   *
   * @param key - Cache key
   * @returns true if the key was deleted, false if it didn't exist
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clears all entries from the cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Gets the current number of entries in the cache.
   *
   * Note: This may include expired entries that haven't been evicted yet.
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Gets all keys in the cache (including potentially expired ones).
   */
  keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  /**
   * Gets all values in the cache (including potentially expired ones).
   */
  *values(): Generator<V, void, undefined> {
    for (const entry of this.cache.values()) {
      yield entry.value;
    }
  }

  /**
   * Removes all expired entries from the cache.
   *
   * Call this periodically if you have many entries with TTL.
   *
   * @returns Number of entries removed
   */
  prune(): number {
    let removed = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt !== null && entry.expiresAt <= now) {
        this.cache.delete(key);
        removed += 1;
      }
    }

    return removed;
  }

  /**
   * Gets or sets a value using a factory function.
   *
   * If the key exists and is not expired, returns the cached value.
   * Otherwise, calls the factory function, caches the result, and returns it.
   *
   * @param key - Cache key
   * @param factory - Function to create the value if not cached
   * @returns The cached or newly created value
   */
  async getOrSet(key: K, factory: () => Promise<V>): Promise<V> {
    const existing = this.get(key);
    if (existing !== undefined) {
      return existing;
    }

    const value = await factory();
    this.set(key, value);
    return value;
  }

  /**
   * Synchronous version of getOrSet.
   *
   * @param key - Cache key
   * @param factory - Function to create the value if not cached
   * @returns The cached or newly created value
   */
  getOrSetSync(key: K, factory: () => V): V {
    const existing = this.get(key);
    if (existing !== undefined) {
      return existing;
    }

    const value = factory();
    this.set(key, value);
    return value;
  }

  /**
   * Checks if an entry is expired.
   */
  private isExpired(entry: CacheEntry<V>): boolean {
    return entry.expiresAt !== null && entry.expiresAt <= Date.now();
  }
}

// ============================================================================
// Preset Caches
// ============================================================================

/**
 * Cache for model metadata.
 *
 * Models don't change frequently, so we use a longer TTL.
 * Max 500 entries, 1 hour TTL.
 */
export const modelCache = new LRUCache<string, unknown>({
  maxSize: 500,
  ttlMs: 60 * 60 * 1000, // 1 hour
});

/**
 * Cache for image data.
 *
 * Used for caching uploaded images and intermediate results.
 * Max 100 entries, 15 minute TTL.
 */
export const imageCache = new LRUCache<string, unknown>({
  maxSize: 100,
  ttlMs: 15 * 60 * 1000, // 15 minutes
});

/**
 * Cache for API responses.
 *
 * Short-lived cache for deduplicating identical requests.
 * Max 50 entries, 30 second TTL.
 */
export const responseCache = new LRUCache<string, unknown>({
  maxSize: 50,
  ttlMs: 30 * 1000, // 30 seconds
});

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Creates a new LRU cache with custom options.
 *
 * @param options - Cache configuration
 * @returns New LRUCache instance
 */
export function createCache<K, V>(options: LRUCacheOptions): LRUCache<K, V> {
  return new LRUCache<K, V>(options);
}

// ============================================================================
// Cache Key Helpers
// ============================================================================

/**
 * Creates a cache key from an object by JSON-serializing it.
 *
 * @param obj - Object to create key from
 * @returns Stable string key
 */
export function createCacheKey(obj: Record<string, unknown>): string {
  // Sort keys for consistent ordering and create stable JSON
  const sortedKeys = Object.keys(obj).toSorted((a, b) => a.localeCompare(b));

  // Build the JSON string manually for stable ordering
  const parts: string[] = [];
  for (const key of sortedKeys) {
    // Using Object.prototype.hasOwnProperty ensures we only access own properties
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = Reflect.get(obj, key);
      parts.push(`${JSON.stringify(key)}:${JSON.stringify(value)}`);
    }
  }

  return `{${parts.join(',')}}`;
}
