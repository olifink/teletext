import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeletextService } from '../../core/teletext.service';
import type { BookmarkItem } from '../../core/storage.service';

@Component({
  selector: 'app-bookmarks-bar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bookmarks-container">
      <!-- Toggle Bookmark for Current Page Button -->
      <button
        class="star-btn"
        [class.is-bookmarked]="teletext.isBookmarked()"
        (click)="teletext.toggleBookmark()"
        title="{{ teletext.isBookmarked() ? 'Aus Lesezeichen entfernen [Taste F]' : 'Zu Lesezeichen hinzufügen [Taste F]' }}"
      >
        <span class="star-icon">{{ teletext.isBookmarked() ? '★' : '☆' }}</span>
      </button>

      <!-- Horizontal Pinned Bookmarks List -->
      <div class="bookmarks-scroll">
        @for (item of filteredBookmarks(); track item.id) {
          <button
            class="bookmark-chip"
            [class.active]="item.channel === teletext.currentChannel() && item.pageNumber === teletext.currentPage()"
            (click)="onBookmarkClick(item)"
          >
            <span class="chip-channel">{{ item.channel.toUpperCase() }}</span>
            <span class="chip-page">{{ item.pageNumber }}</span>
            <span class="chip-label">{{ item.label }}</span>
          </button>
        }
      </div>
    </div>
  `,
  styleUrl: './bookmarks-bar.component.scss',
})
export class BookmarksBarComponent {
  public readonly teletext = inject(TeletextService);

  public readonly filteredBookmarks = computed(() => {
    return this.teletext.bookmarks();
  });

  public onBookmarkClick(item: BookmarkItem): void {
    if (item.channel !== this.teletext.currentChannel()) {
      this.teletext.currentChannel.set(item.channel);
    }
    this.teletext.goToPage(item.pageNumber, 1);
  }
}
