export interface CacheEntry<T> {
  data: T;
  etag?: string;
  lastModified?: string;
  expiresAt: number;
  insertedAt: number;
}

export interface CacheOptions {
  /** Time to live in milliseconds (default: 30000ms = 30s) */
  ttlMs?: number;
  /** Maximum number of entries to keep in cache (default: 500) */
  maxEntries?: number;
}

export class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly defaultTtl: number;
  private readonly maxEntries: number;

  constructor(options: CacheOptions = {}) {
    this.defaultTtl = options.ttlMs ?? 30000;
    this.maxEntries = options.maxEntries ?? 500;
  }

  get(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  set(key: string, data: T, ttlMs?: number, etag?: string, lastModified?: string): void {
    if (this.cache.size >= this.maxEntries) {
      // Evict oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    const ttl = ttlMs ?? this.defaultTtl;
    this.cache.set(key, {
      data,
      etag,
      lastModified,
      expiresAt: Date.now() + ttl,
      insertedAt: Date.now(),
    });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}
