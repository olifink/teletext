import type { TeletextPage } from './page';

/**
 * Broadcaster metadata
 */
export interface BroadcasterInfo {
  id: string;
  name: string;
  shortName: string;
  description: string;
  primaryColor: string;
  defaultPage: number;
  featuredPages: Array<{ page: number; label: string; category?: string }>;
  supported: boolean;
}

/**
 * Provider request options
 */
export interface ProviderRequestOptions {
  subPage?: number;
  forceRefresh?: boolean;
  timeoutMs?: number;
}

/**
 * Common interface implemented by all broadcaster scraping adapters
 */
export interface ITeletextProvider {
  readonly id: string;
  readonly info: BroadcasterInfo;
  
  getPage(pageNumber: number, options?: ProviderRequestOptions): Promise<TeletextPage>;
  isPageSupported(pageNumber: number): boolean;
}

/**
 * Standard Teletext scraping error
 */
export class TeletextError extends Error {
  constructor(
    message: string,
    public readonly code: 'NOT_FOUND' | 'TIMEOUT' | 'PARSE_ERROR' | 'NETWORK_ERROR' | 'INVALID_PAGE',
    public readonly channel: string,
    public readonly pageNumber: number,
    public override readonly cause?: unknown
  ) {
    super(message);
    this.name = 'TeletextError';
  }
}
