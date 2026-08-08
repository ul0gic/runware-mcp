interface CacheEntry<V> {
  readonly value: V;
  readonly expiresAt: number | null;
}

export interface LRUCacheOptions {
  readonly maxSize: number;

  /** Milliseconds; unset means entries never expire. */
  readonly ttlMs?: number;
}

/** Least-recently-used eviction at maxSize, with optional per-entry TTL. */
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

  /** A hit promotes the entry to most-recently-used. */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (entry === undefined) {
      return undefined;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return undefined;
    }

    // Re-inserting moves the key to the end of Map iteration order, which is the LRU order
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /** `ttlMs` overrides the cache-wide TTL for this entry only. */
  set(key: K, value: V, ttlMs?: number): void {
    this.cache.delete(key);

    while (this.cache.size >= this.maxSize) {
      const iteratorResult = this.cache.keys().next();
      if (iteratorResult.done === true) {
        break;
      }
      this.cache.delete(iteratorResult.value);
    }

    const effectiveTtl = ttlMs ?? this.ttlMs;
    const expiresAt = effectiveTtl === null ? null : Date.now() + effectiveTtl;

    this.cache.set(key, { value, expiresAt });
  }

  /** Does not update LRU order, and leaves expired entries in place. */
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

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  /** Counts expired-but-unpruned entries too. */
  get size(): number {
    return this.cache.size;
  }

  /** Includes expired-but-unpruned entries. */
  keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  /** Includes expired-but-unpruned entries. */
  *values(): Generator<V, void, undefined> {
    for (const entry of this.cache.values()) {
      yield entry.value;
    }
  }

  /** Expiry is otherwise lazy — call periodically when many TTL entries accumulate. */
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

  /** Concurrent misses each run the factory — no in-flight deduplication. */
  async getOrSet(key: K, factory: () => Promise<V>): Promise<V> {
    const existing = this.get(key);
    if (existing !== undefined) {
      return existing;
    }

    const value = await factory();
    this.set(key, value);
    return value;
  }

  getOrSetSync(key: K, factory: () => V): V {
    const existing = this.get(key);
    if (existing !== undefined) {
      return existing;
    }

    const value = factory();
    this.set(key, value);
    return value;
  }

  private isExpired(entry: CacheEntry<V>): boolean {
    return entry.expiresAt !== null && entry.expiresAt <= Date.now();
  }
}

/** Model metadata changes rarely, hence the long TTL. */
export const modelCache = new LRUCache<string, unknown>({
  maxSize: 500,
  ttlMs: 60 * 60 * 1000,
});

/** Uploaded images and intermediate results. */
export const imageCache = new LRUCache<string, unknown>({
  maxSize: 100,
  ttlMs: 15 * 60 * 1000,
});

/** Short window for deduplicating identical in-flight requests. */
export const responseCache = new LRUCache<string, unknown>({
  maxSize: 50,
  ttlMs: 30 * 1000,
});

export function createCache<K, V>(options: LRUCacheOptions): LRUCache<K, V> {
  return new LRUCache<K, V>(options);
}

/** Key ordering is stable regardless of the object's insertion order. */
export function createCacheKey(obj: Record<string, unknown>): string {
  const sortedKeys = Object.keys(obj).toSorted((a, b) => a.localeCompare(b));

  const parts: string[] = [];
  for (const key of sortedKeys) {
    // Guards against inherited/prototype-polluted keys reaching the serialized key
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = Reflect.get(obj, key);
      parts.push(`${JSON.stringify(key)}:${JSON.stringify(value)}`);
    }
  }

  return `{${parts.join(',')}}`;
}
