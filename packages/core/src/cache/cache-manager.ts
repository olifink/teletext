import { MemoryCache } from './memory-cache';
import type { TeletextPage } from '../models/page';

export class CacheManager {
  private static instance: CacheManager;
  private pageCache: MemoryCache<TeletextPage>;
  private inFlightRequests = new Map<string, Promise<TeletextPage>>();
  private lastHostRequest = new Map<string, number>();

  private constructor() {
    this.pageCache = new MemoryCache<TeletextPage>({ ttlMs: 30000, maxEntries: 1000 });
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  public getCacheKey(channel: string, pageNumber: number, subPage: number = 1): string {
    return `${channel.toLowerCase()}:${pageNumber}:${subPage}`;
  }

  public getCachedPage(channel: string, pageNumber: number, subPage: number = 1): TeletextPage | null {
    const key = this.getCacheKey(channel, pageNumber, subPage);
    const entry = this.pageCache.get(key);
    return entry ? entry.data : null;
  }

  public setCachedPage(page: TeletextPage, ttlMs?: number): void {
    const key = this.getCacheKey(page.channel, page.pageNumber, page.subPage);
    this.pageCache.set(key, page, ttlMs);
  }

  /**
   * Request coalescer - ensures only 1 request per key executes concurrently
   */
  public async coalesce<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key) as unknown as Promise<T>;
    }

    const promise = (async () => {
      try {
        return await fetcher();
      } finally {
        this.inFlightRequests.delete(key);
      }
    })();

    this.inFlightRequests.set(key, promise as unknown as Promise<TeletextPage>);
    return promise;
  }

  /**
   * Rate limits requests per host to be polite
   */
  public async throttleHost(host: string, minIntervalMs: number = 50): Promise<void> {
    const now = Date.now();
    const last = this.lastHostRequest.get(host) || 0;
    const diff = now - last;

    if (diff < minIntervalMs) {
      await new Promise(resolve => setTimeout(resolve, minIntervalMs - diff));
    }

    this.lastHostRequest.set(host, Date.now());
  }

  public clear(): void {
    this.pageCache.clear();
    this.inFlightRequests.clear();
    this.lastHostRequest.clear();
  }
}
