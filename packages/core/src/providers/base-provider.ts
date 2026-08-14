import { CacheManager } from '../cache/cache-manager';
import type { TeletextCell } from '../models/cell';
import type { TeletextColor } from '../models/colors';
import { TELETEXT_COLUMNS, TELETEXT_ROWS, type TeletextPage } from '../models/page';
import {
  type BroadcasterInfo,
  type ITeletextProvider,
  type ProviderRequestOptions,
  TeletextError,
} from '../models/provider';
import { annotateGridWithLinks, extractFastTextFromGrid, extractPageLinks, isValidPageNumber } from '../parser/link-extractor';
import { gridToRawText, normalizeGrid } from '../parser/grid';

export abstract class BaseProvider implements ITeletextProvider {
  public abstract readonly id: string;
  public abstract readonly info: BroadcasterInfo;

  protected readonly cacheManager = CacheManager.getInstance();
  protected readonly defaultTimeoutMs = 8000;
  protected readonly userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 (Teletext Modern Viewer/1.0)';

  public isPageSupported(pageNumber: number): boolean {
    return isValidPageNumber(pageNumber);
  }

  public async getPage(pageNumber: number, options: ProviderRequestOptions = {}): Promise<TeletextPage> {
    if (!this.isPageSupported(pageNumber)) {
      throw new TeletextError(
        `Invalid Teletext page number: ${pageNumber}. Must be between 100 and 899.`,
        'INVALID_PAGE',
        this.id,
        pageNumber
      );
    }

    const subPage = options.subPage || 1;

    // Check cache unless forced refresh
    if (!options.forceRefresh) {
      const cached = this.cacheManager.getCachedPage(this.id, pageNumber, subPage);
      if (cached) {
        return cached;
      }
    }

    const cacheKey = this.cacheManager.getCacheKey(this.id, pageNumber, subPage);

    return this.cacheManager.coalesce(cacheKey, async () => {
      try {
        const page = await this.fetchAndParse(pageNumber, subPage, options);

        // Normalize grid strictly to 24x40
        page.grid = normalizeGrid(page.grid);

        // Annotate clickable 3-digit numbers inside cells
        annotateGridWithLinks(page.grid);

        // Extract Fast-Text buttons if not already provided
        if (!page.fastText) {
          page.fastText = extractFastTextFromGrid(page.grid);
        }

        // Generate raw text
        if (!page.rawText) {
          page.rawText = gridToRawText(page.grid);
        }

        // Extract all referenced links
        if (!page.links || page.links.length === 0) {
          page.links = extractPageLinks(page.rawText);
        }

        // Cache page
        this.cacheManager.setCachedPage(page);

        return page;
      } catch (err: unknown) {
        if (err instanceof TeletextError) throw err;

        const message = err instanceof Error ? err.message : String(err);
        throw new TeletextError(
          `Failed to fetch page ${pageNumber} from ${this.info.name}: ${message}`,
          'NETWORK_ERROR',
          this.id,
          pageNumber,
          err
        );
      }
    });
  }

  protected abstract fetchAndParse(
    pageNumber: number,
    subPage: number,
    options: ProviderRequestOptions
  ): Promise<TeletextPage>;

  protected async fetchHtml(url: string, hostHeader?: string, timeoutMs?: number): Promise<string> {
    const host = new URL(url).host;
    await this.cacheManager.throttleHost(host, 30);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs || this.defaultTimeoutMs);

    try {
      const headers: Record<string, string> = {
        'User-Agent': this.userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
      };

      if (hostHeader) {
        headers['Host'] = hostHeader;
      }

      const fetchOptions: RequestInit & { tls?: { rejectUnauthorized: boolean } } = {
        headers,
        signal: controller.signal,
      };
      const isServerRuntime = typeof (globalThis as unknown as { process?: unknown }).process !== 'undefined' ||
        typeof (globalThis as unknown as { Bun?: unknown }).Bun !== 'undefined';
      if (isServerRuntime) {
        fetchOptions.tls = { rejectUnauthorized: false };
      }

      const res = await fetch(url, fetchOptions as RequestInit);

      if (res.status === 404) {
        throw new TeletextError(
          `Page ${url} not found (404)`,
          'NOT_FOUND',
          this.id,
          0
        );
      }

      if (!res.ok) {
        throw new TeletextError(
          `HTTP Error ${res.status}: ${res.statusText}`,
          'NETWORK_ERROR',
          this.id,
          0
        );
      }

      return await res.text();
    } catch (err: unknown) {
      if (err instanceof TeletextError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new TeletextError(
          `Request timeout fetching ${url}`,
          'TIMEOUT',
          this.id,
          0,
          err
        );
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}
