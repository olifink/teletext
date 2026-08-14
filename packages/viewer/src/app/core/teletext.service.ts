import { computed, effect, inject, Injectable, signal } from '@angular/core';
import type { BroadcasterInfo, FastTextLinks, TeletextPage } from '@teletext/core';
import { AudioService } from './audio.service';
import { BookmarkItem, StorageService } from './storage.service';

const API_BASE = 'http://localhost:3000/api';

const BROADCASTERS: BroadcasterInfo[] = [
  {
    id: 'ard',
    name: 'ARD Text',
    shortName: 'ARD',
    description: 'Das Erste – Tagesschau, Sport, Programminfos',
    primaryColor: '#002B5C',
    defaultPage: 100,
    featuredPages: [
      { page: 100, label: 'Startseite', category: 'News' },
      { page: 101, label: 'Tagesschau I', category: 'News' },
      { page: 110, label: 'Inland', category: 'News' },
      { page: 120, label: 'Ausland', category: 'News' },
      { page: 170, label: 'Wetter', category: 'Weather' },
      { page: 200, label: 'Sport', category: 'Sports' },
      { page: 300, label: 'Programm', category: 'TV' },
    ],
    supported: true,
  },
  {
    id: 'zdf',
    name: 'ZDF Text',
    shortName: 'ZDF',
    description: 'ZDFtext – heute Nachrichten, Sport, Unterhaltung',
    primaryColor: '#FA7D00',
    defaultPage: 100,
    featuredPages: [
      { page: 100, label: 'Startseite', category: 'News' },
      { page: 111, label: 'Schlagzeilen', category: 'News' },
      { page: 120, label: 'heute Top', category: 'News' },
      { page: 131, label: 'Wetter', category: 'Weather' },
      { page: 200, label: 'Sport', category: 'Sports' },
      { page: 300, label: 'Programm', category: 'TV' },
      { page: 555, label: 'Lotto', category: 'Service' },
    ],
    supported: true,
  },
  {
    id: '3sat',
    name: '3sat Text',
    shortName: '3sat',
    description: '3sat – Kultur, Wissenschaft und Dokumentation',
    primaryColor: '#D90000',
    defaultPage: 100,
    featuredPages: [
      { page: 100, label: 'Startseite', category: 'News' },
      { page: 110, label: 'Kultur', category: 'Culture' },
      { page: 120, label: 'Wissen', category: 'Science' },
      { page: 170, label: 'Wetter D-A-CH', category: 'Weather' },
      { page: 300, label: 'Programm', category: 'TV' },
    ],
    supported: true,
  },
  {
    id: 'wdr',
    name: 'WDR Text',
    shortName: 'WDR',
    description: 'WDR Text – NRW regional, Verkehr, Wetter & Sport',
    primaryColor: '#003366',
    defaultPage: 100,
    featuredPages: [
      { page: 100, label: 'Startseite', category: 'News' },
      { page: 110, label: 'NRW Kompakt', category: 'News' },
      { page: 170, label: 'Wetter NRW', category: 'Weather' },
      { page: 180, label: 'Stau-Infos', category: 'Service' },
      { page: 200, label: 'Sport', category: 'Sports' },
      { page: 300, label: 'Programm', category: 'TV' },
    ],
    supported: true,
  },
  {
    id: 'hr',
    name: 'HR Text',
    shortName: 'HR',
    description: 'hr-text – Hessischer Rundfunk regional & Service',
    primaryColor: '#005599',
    defaultPage: 100,
    featuredPages: [
      { page: 100, label: 'Startseite', category: 'News' },
      { page: 101, label: 'Hessen News', category: 'News' },
      { page: 170, label: 'Wetter Hessen', category: 'Weather' },
      { page: 200, label: 'Sport Hessen', category: 'Sports' },
      { page: 300, label: 'Programm', category: 'TV' },
    ],
    supported: true,
  },
];

@Injectable({
  providedIn: 'root',
})
export class TeletextService {
  private readonly storage = inject(StorageService);
  private readonly audio = inject(AudioService);

  // Settings & Broadcasters
  private readonly settings = this.storage.getSettings();
  public readonly channels = signal<BroadcasterInfo[]>(BROADCASTERS);
  public readonly currentChannel = signal<string>('ard');
  public readonly currentPage = signal<number>(100);
  public readonly currentSubPage = signal<number>(1);

  // Display & UI state
  public readonly displayMode = signal<'crt' | 'clean'>(this.settings.displayMode);
  public readonly soundEnabled = signal<boolean>(this.settings.soundEnabled);
  public readonly autoRotate = signal<boolean>(this.settings.autoRotateSubpages);
  public readonly autoRotateProgress = signal<number>(0);
  public readonly keypadBuffer = signal<string>('');
  public readonly isKeypadOpen = signal<boolean>(false);
  public readonly isSearchOpen = signal<boolean>(false);
  public readonly isTvOnly = signal<boolean>(false);

  // Data & Network state
  public readonly pageData = signal<TeletextPage | null>(null);
  public readonly isLoading = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly isOffline = signal<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  public readonly bookmarks = signal<BookmarkItem[]>(this.storage.getBookmarks());

  // History Stack
  private historyStack: Array<{ channel: string; page: number; subPage: number }> = [];
  private historyIndex = -1;

  // Auto-rotation timer
  private autoRotateTimer: any = null;
  private progressInterval: any = null;
  private readonly subpageIntervalMs = (this.settings.subpageIntervalSec || 8) * 1000;

  // Computed Properties
  public readonly currentBroadcaster = computed(() => {
    const ch = this.currentChannel();
    return this.channels().find(c => c.id === ch) || this.channels()[0];
  });

  public readonly isBookmarked = computed(() => {
    const ch = this.currentChannel();
    const pg = this.currentPage();
    return this.bookmarks().some(b => b.channel === ch && b.pageNumber === pg);
  });

  public readonly canGoBack = signal<boolean>(false);
  public readonly canGoForward = signal<boolean>(false);

  constructor() {
    this.audio.setEnabled(this.soundEnabled());

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.isOffline.set(false));
      window.addEventListener('offline', () => this.isOffline.set(true));
    }

    // Initial page load
    this.goToPage(100, 1, false);

    // Auto rotate watcher
    effect(() => {
      const page = this.pageData();
      const rotating = this.autoRotate();
      this.resetAutoRotate(page, rotating);
    });
  }

  public async goToPage(pageNumber: number, subPage: number = 1, pushHistory: boolean = true): Promise<void> {
    if (pageNumber < 100 || pageNumber > 899) return;

    this.audio.playPageBeep();
    this.currentPage.set(pageNumber);
    this.currentSubPage.set(subPage);
    this.errorMessage.set(null);
    this.keypadBuffer.set('');

    if (pushHistory) {
      if (this.historyIndex < this.historyStack.length - 1) {
        this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
      }
      this.historyStack.push({ channel: this.currentChannel(), page: pageNumber, subPage });
      this.historyIndex = this.historyStack.length - 1;
      this.updateHistoryState();
    }

    await this.fetchCurrentPage();
  }

  public async goToSubPage(subPage: number): Promise<void> {
    const current = this.pageData();
    if (!current || subPage < 1 || subPage > current.subPageCount) return;

    this.audio.playKeyClick();
    this.currentSubPage.set(subPage);
    await this.fetchCurrentPage();
  }

  public nextPage(): void {
    const current = this.currentPage();
    const next = current < 899 ? current + 1 : 100;
    this.goToPage(next, 1);
  }

  public prevPage(): void {
    const current = this.currentPage();
    const prev = current > 100 ? current - 1 : 899;
    this.goToPage(prev, 1);
  }

  public nextSubPage(): void {
    const page = this.pageData();
    if (!page || page.subPageCount <= 1) return;
    const next = page.subPage < page.subPageCount ? page.subPage + 1 : 1;
    this.goToSubPage(next);
  }

  public prevSubPage(): void {
    const page = this.pageData();
    if (!page || page.subPageCount <= 1) return;
    const prev = page.subPage > 1 ? page.subPage - 1 : page.subPageCount;
    this.goToSubPage(prev);
  }

  public switchChannel(channelId: string): void {
    if (channelId === this.currentChannel()) return;
    this.audio.playChirp();
    this.currentChannel.set(channelId);
    const broadcaster = this.channels().find(c => c.id === channelId);
    this.goToPage(broadcaster ? broadcaster.defaultPage : 100, 1);
  }

  public goBack(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const item = this.historyStack[this.historyIndex];
      this.currentChannel.set(item.channel);
      this.currentPage.set(item.page);
      this.currentSubPage.set(item.subPage);
      this.updateHistoryState();
      this.fetchCurrentPage();
    }
  }

  public goForward(): void {
    if (this.historyIndex < this.historyStack.length - 1) {
      this.historyIndex++;
      const item = this.historyStack[this.historyIndex];
      this.currentChannel.set(item.channel);
      this.currentPage.set(item.page);
      this.currentSubPage.set(item.subPage);
      this.updateHistoryState();
      this.fetchCurrentPage();
    }
  }

  public toggleBookmark(pageNumber?: number, channel?: string): void {
    const ch = channel || this.currentChannel();
    const pg = pageNumber || this.currentPage();
    const page = this.pageData();
    const label = page?.title ? page.title.substring(0, 20) : `${ch.toUpperCase()} ${pg}`;

    const currentList = this.bookmarks();
    const existingIndex = currentList.findIndex(b => b.channel === ch && b.pageNumber === pg);

    let updated: BookmarkItem[];
    if (existingIndex >= 0) {
      updated = currentList.filter((_, i) => i !== existingIndex);
    } else {
      updated = [
        ...currentList,
        {
          id: `${ch}-${pg}`,
          channel: ch,
          pageNumber: pg,
          label,
          pinnedAt: new Date().toISOString(),
        },
      ];
    }

    this.bookmarks.set(updated);
    this.storage.saveBookmarks(updated);
    this.audio.playKeyClick();
  }

  public toggleDisplayMode(): void {
    const next = this.displayMode() === 'crt' ? 'clean' : 'crt';
    this.displayMode.set(next);
    this.storage.saveSettings({ ...this.storage.getSettings(), displayMode: next });
    this.audio.playChirp();
  }

  public toggleAutoRotate(): void {
    const next = !this.autoRotate();
    this.autoRotate.set(next);
    this.storage.saveSettings({ ...this.storage.getSettings(), autoRotateSubpages: next });
    this.audio.playKeyClick();
  }

  public toggleTvOnly(): void {
    const next = !this.isTvOnly();
    this.isTvOnly.set(next);
    this.audio.playChirp();
  }

  public toggleSound(): void {
    const next = !this.soundEnabled();
    this.soundEnabled.set(next);
    this.audio.setEnabled(next);
    this.storage.saveSettings({ ...this.storage.getSettings(), soundEnabled: next });
    if (next) this.audio.playKeyClick();
  }

  // Keypad Buffer handling
  public pressDigit(digit: string): void {
    if (!/^[0-9]$/.test(digit)) return;
    this.audio.playKeyClick();

    const current = this.keypadBuffer();
    if (current.length >= 3) {
      // Start new buffer
      if (digit !== '0' && digit !== '9') {
        this.keypadBuffer.set(digit);
      }
      return;
    }

    // Teletext page first digit cannot be 0 or 9 (pages are 100-899)
    if (current.length === 0 && (digit === '0' || digit === '9')) {
      return;
    }

    const next = current + digit;
    this.keypadBuffer.set(next);

    if (next.length === 3) {
      const target = parseInt(next, 10);
      setTimeout(() => {
        this.goToPage(target, 1);
      }, 150);
    }
  }

  public pressDelete(): void {
    this.audio.playKeyClick();
    const current = this.keypadBuffer();
    if (current.length > 0) {
      this.keypadBuffer.set(current.slice(0, -1));
    }
  }

  public pressClear(): void {
    this.audio.playKeyClick();
    this.keypadBuffer.set('');
  }

  public pressFastText(color: 'red' | 'green' | 'yellow' | 'blue'): void {
    const page = this.pageData();
    if (!page?.fastText) return;
    const target = page.fastText[color];
    if (target) {
      this.goToPage(target, 1);
    }
  }

  private updateHistoryState(): void {
    this.canGoBack.set(this.historyIndex > 0);
    this.canGoForward.set(this.historyIndex < this.historyStack.length - 1);
  }

  private async fetchCurrentPage(): Promise<void> {
    const channel = this.currentChannel();
    const page = this.currentPage();
    const sub = this.currentSubPage();

    this.isLoading.set(true);

    try {
      // 1. Check local offline cache first if offline
      if (this.isOffline()) {
        const cached = this.storage.getCachedPage(channel, page, sub);
        if (cached) {
          this.pageData.set(cached);
          this.isLoading.set(false);
          return;
        }
      }

      // 2. Fetch from backend API
      const res = await fetch(`${API_BASE}/page/${channel}/${page}?sub=${sub}`);
      if (!res.ok) {
        // Fallback to local storage if available
        const cached = this.storage.getCachedPage(channel, page, sub);
        if (cached) {
          this.pageData.set(cached);
          this.isLoading.set(false);
          return;
        }
        throw new Error(`Seite ${page} auf ${channel.toUpperCase()} nicht verfügbar (${res.status})`);
      }

      const data: TeletextPage = await res.json();
      this.pageData.set(data);
      this.storage.setCachedPage(data);
    } catch (err: unknown) {
      // Fallback check
      const cached = this.storage.getCachedPage(channel, page, sub);
      if (cached) {
        this.pageData.set(cached);
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        this.errorMessage.set(msg);
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  private resetAutoRotate(page: TeletextPage | null, enabled: boolean): void {
    if (this.autoRotateTimer) clearTimeout(this.autoRotateTimer);
    if (this.progressInterval) clearInterval(this.progressInterval);
    this.autoRotateProgress.set(0);

    if (!enabled || !page || page.subPageCount <= 1) return;

    const startTime = Date.now();
    const duration = this.subpageIntervalMs;

    this.progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      this.autoRotateProgress.set(pct);
    }, 100);

    this.autoRotateTimer = setTimeout(() => {
      this.nextSubPage();
    }, duration);
  }
}
