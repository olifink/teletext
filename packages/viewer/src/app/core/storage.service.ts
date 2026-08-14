import { Injectable } from '@angular/core';
import type { TeletextPage } from '@teletext/core';

export interface BookmarkItem {
  id: string;
  channel: string;
  pageNumber: number;
  label: string;
  category?: string;
  pinnedAt: string;
}

export interface AppSettings {
  displayMode: 'crt' | 'clean';
  autoRotateSubpages: boolean;
  subpageIntervalSec: number;
  soundEnabled: boolean;
  scanlineIntensity: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  displayMode: 'crt',
  autoRotateSubpages: true,
  subpageIntervalSec: 8,
  soundEnabled: true,
  scanlineIntensity: 1,
};

const DEFAULT_BOOKMARKS: BookmarkItem[] = [
  { id: 'ard-100', channel: 'ard', pageNumber: 100, label: 'ARD Start', category: 'News', pinnedAt: '' },
  { id: 'ard-101', channel: 'ard', pageNumber: 101, label: 'Tagesschau', category: 'News', pinnedAt: '' },
  { id: 'ard-200', channel: 'ard', pageNumber: 200, label: 'ARD Sport', category: 'Sports', pinnedAt: '' },
  { id: 'zdf-100', channel: 'zdf', pageNumber: 100, label: 'ZDF Start', category: 'News', pinnedAt: '' },
  { id: 'zdf-112', channel: 'zdf', pageNumber: 112, label: 'ZDF News', category: 'News', pinnedAt: '' },
  { id: 'zdf-200', channel: 'zdf', pageNumber: 200, label: 'ZDF Sport', category: 'Sports', pinnedAt: '' },
  { id: 'wdr-100', channel: 'wdr', pageNumber: 100, label: 'WDR Start', category: 'News', pinnedAt: '' },
  { id: 'hr-100',  channel: 'hr',  pageNumber: 100, label: 'HR Start', category: 'News', pinnedAt: '' },
];

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly SETTINGS_KEY = 'teletext_settings_v1';
  private readonly BOOKMARKS_KEY = 'teletext_bookmarks_v1';
  private readonly CACHE_PREFIX = 'teletext_cache_page_';

  public getSettings(): AppSettings {
    try {
      const raw = localStorage.getItem(this.SETTINGS_KEY);
      if (!raw) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage:', e);
    }
  }

  public getBookmarks(): BookmarkItem[] {
    try {
      const raw = localStorage.getItem(this.BOOKMARKS_KEY);
      if (!raw) return DEFAULT_BOOKMARKS;
      return JSON.parse(raw);
    } catch {
      return DEFAULT_BOOKMARKS;
    }
  }

  public saveBookmarks(bookmarks: BookmarkItem[]): void {
    try {
      localStorage.setItem(this.BOOKMARKS_KEY, JSON.stringify(bookmarks));
    } catch (e) {
      console.warn('Failed to save bookmarks to localStorage:', e);
    }
  }

  public getCachedPage(channel: string, pageNumber: number, subPage: number = 1): TeletextPage | null {
    try {
      const key = `${this.CACHE_PREFIX}${channel}_${pageNumber}_${subPage}`;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public setCachedPage(page: TeletextPage): void {
    try {
      const key = `${this.CACHE_PREFIX}${page.channel}_${page.pageNumber}_${page.subPage}`;
      localStorage.setItem(key, JSON.stringify(page));
    } catch (e) {
      console.warn('Failed to cache page in localStorage:', e);
    }
  }

  public getAllCachedPages(): TeletextPage[] {
    const list: TeletextPage[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          const raw = localStorage.getItem(key);
          if (raw) list.push(JSON.parse(raw));
        }
      }
    } catch (e) {
      console.warn('Error reading cached pages:', e);
    }
    return list;
  }
}
