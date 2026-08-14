import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  ViewChild,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeletextService } from '../../core/teletext.service';
import { StorageService } from '../../core/storage.service';

interface SearchResult {
  channel: string;
  pageNumber: number;
  title: string;
  category?: string;
  matchType: 'featured' | 'cached' | 'direct';
}

@Component({
  selector: 'app-search-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (teletext.isSearchOpen()) {
      <div class="search-backdrop" (click)="close()">
        <div class="search-modal" (click)="$event.stopPropagation()">
          <!-- Search Input Bar -->
          <div class="search-header">
            <span class="search-icon">🔍</span>
            <input
              #searchInput
              type="text"
              class="search-input"
              placeholder="Seite (z.B. 100, 200) oder Begriff (Nachrichten, Sport, Wetter, heute)..."
              [ngModel]="query()"
              (ngModelChange)="query.set($event)"
              (keydown.escape)="close()"
              (keydown.enter)="onEnter()"
            />
            <button class="close-btn" (click)="close()">✕</button>
          </div>

          <!-- Search Results List -->
          <div class="search-results">
            @if (results().length > 0) {
              @for (res of results(); track res.channel + '-' + res.pageNumber) {
                <button class="result-item" (click)="selectResult(res)">
                  <div class="res-badge" [style.background-color]="getChannelColor(res.channel)">
                    {{ res.channel.toUpperCase() }}
                  </div>
                  <div class="res-page">{{ res.pageNumber }}</div>
                  <div class="res-info">
                    <span class="res-title">{{ res.title }}</span>
                    @if (res.category) {
                      <span class="res-cat">{{ res.category }}</span>
                    }
                  </div>
                  <span class="res-jump">Öffnen ➔</span>
                </button>
              }
            } @else {
              <div class="no-results">
                <p>Keine Seiten gefunden für "{{ query() }}"</p>
                <p class="hint">Geben Sie eine 3-stellige Seitenzahl (100–899) oder einen Suchbegriff ein.</p>
              </div>
            }
          </div>

          <!-- Quick Directory Categories -->
          <div class="search-footer">
            <span class="footer-label">Kategorien:</span>
            <div class="cat-tags">
              <button class="cat-tag" (click)="query.set('Nachrichten')">Nachrichten</button>
              <button class="cat-tag" (click)="query.set('Sport')">Sport</button>
              <button class="cat-tag" (click)="query.set('Wetter')">Wetter</button>
              <button class="cat-tag" (click)="query.set('Programm')">TV-Programm</button>
              <button class="cat-tag" (click)="query.set('Wirtschaft')">Wirtschaft</button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './search-dialog.component.scss',
})
export class SearchDialogComponent {
  public readonly teletext = inject(TeletextService);
  private readonly storage = inject(StorageService);

  @ViewChild('searchInput') private inputRef?: ElementRef<HTMLInputElement>;

  public readonly query = signal<string>('');

  constructor() {
    effect(() => {
      if (this.teletext.isSearchOpen()) {
        this.query.set('');
        setTimeout(() => this.inputRef?.nativeElement?.focus(), 50);
      }
    });
  }

  public readonly results = computed<SearchResult[]>(() => {
    const q = this.query().trim().toLowerCase();
    const list: SearchResult[] = [];

    // 1. Direct digit match
    if (/^[1-8]\d{2}$/.test(q)) {
      const pageNum = parseInt(q, 10);
      list.push({
        channel: this.teletext.currentChannel(),
        pageNumber: pageNum,
        title: `Direktsprung zu Seite ${pageNum}`,
        matchType: 'direct',
      });
    }

    // 2. Featured pages across all channels
    for (const broadcaster of this.teletext.channels()) {
      for (const fp of broadcaster.featuredPages) {
        if (!q || fp.label.toLowerCase().includes(q) || String(fp.page).includes(q) || fp.category?.toLowerCase().includes(q)) {
          list.push({
            channel: broadcaster.id,
            pageNumber: fp.page,
            title: `${broadcaster.shortName}: ${fp.label}`,
            category: fp.category,
            matchType: 'featured',
          });
        }
      }
    }

    // 3. Local offline cached pages
    const cached = this.storage.getAllCachedPages();
    for (const p of cached) {
      if (q && (p.title.toLowerCase().includes(q) || p.rawText.toLowerCase().includes(q))) {
        if (!list.some(r => r.channel === p.channel && r.pageNumber === p.pageNumber)) {
          list.push({
            channel: p.channel,
            pageNumber: p.pageNumber,
            title: p.title || `${p.channel.toUpperCase()} Seite ${p.pageNumber}`,
            matchType: 'cached',
          });
        }
      }
    }

    return list.slice(0, 15);
  });

  public close(): void {
    this.teletext.isSearchOpen.set(false);
  }

  public onEnter(): void {
    const res = this.results();
    if (res.length > 0) {
      this.selectResult(res[0]);
    }
  }

  public selectResult(res: SearchResult): void {
    if (res.channel !== this.teletext.currentChannel()) {
      this.teletext.currentChannel.set(res.channel);
    }
    this.teletext.goToPage(res.pageNumber, 1);
    this.close();
  }

  public getChannelColor(channelId: string): string {
    const ch = this.teletext.channels().find(c => c.id === channelId);
    return ch ? ch.primaryColor : '#3b82f6';
  }
}
