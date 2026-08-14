import type { TeletextCell } from './cell';

/**
 * Standard Teletext grid dimensions
 */
export const TELETEXT_COLUMNS = 40;
export const TELETEXT_ROWS = 24;

/**
 * Fast-Text navigation keys (Red, Green, Yellow, Blue bottom buttons)
 */
export interface FastTextLinks {
  red?: number;
  green?: number;
  yellow?: number;
  blue?: number;
}

/**
 * Normalized Teletext Page representation
 */
export interface TeletextPage {
  /** Broadcaster identifier (e.g. "ard", "zdf", "3sat", "wdr", "hr") */
  channel: string;
  /** Human readable broadcaster name (e.g. "ARD Text", "ZDF Text") */
  channelName: string;
  /** 3-digit page number (100–899) */
  pageNumber: number;
  /** Current sub-page index (1-based) */
  subPage: number;
  /** Total count of available sub-pages for this page */
  subPageCount: number;
  /** Available sub-page numbers/indices if known */
  subPages?: number[];
  /** Page title or topic header */
  title: string;
  /** Header banner line text */
  headerLine?: string;
  /** ISO timestamp of when page was fetched or updated */
  timestamp: string;
  /** Fixed 24-row by 40-column matrix of cells */
  grid: TeletextCell[][];
  /** Fast-text bottom color button links */
  fastText?: FastTextLinks;
  /** Plaintext representation of the 24 lines */
  rawText: string;
  /** List of all 3-digit page links referenced in the page */
  links: number[];
  /** Navigation helpers */
  prevPage?: number;
  nextPage?: number;
  /** Provider metadata */
  meta?: Record<string, unknown>;
}

/**
 * Page summary used in directory index and search results
 */
export interface TeletextPageSummary {
  channel: string;
  pageNumber: number;
  title: string;
  category?: string;
}
