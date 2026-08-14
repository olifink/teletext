import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeletextService } from '../../core/teletext.service';
import type { TeletextCell } from '@teletext/core';

@Component({
  selector: 'app-teletext-screen',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="crt-container"
      [class.mode-crt]="teletext.displayMode() === 'crt'"
      [class.mode-clean]="teletext.displayMode() === 'clean'"
      [class.is-loading]="teletext.isLoading()"
    >
      <!-- CRT Screen Tube Bezel & Frame -->
      <div class="crt-bezel">
        <!-- CRT Screen Surface -->
        <div class="crt-screen">
          <!-- CRT Scanline & Phosphor Filter Overlays -->
          @if (teletext.displayMode() === 'crt') {
            <div class="crt-scanlines"></div>
            <div class="crt-vignette"></div>
            <div class="crt-flicker"></div>
          }

          <!-- Live Keypad Input / Search Overlay in Top-Left Corner -->
          @if (teletext.keypadBuffer().length > 0) {
            <div class="keypad-buffer-overlay">
              <span class="buffer-label">SEITE</span>
              <span class="buffer-value">{{ formattedBuffer() }}</span>
            </div>
          }

          <!-- Main 24-Row Teletext Display Matrix -->
          @if (pageData(); as page) {
            <div class="teletext-matrix" id="teletext-matrix-grid">
              @for (row of page.grid; track $index; let r = $index) {
                <div class="teletext-row" [attr.data-row]="r">
                  @for (cell of row; track $index; let c = $index) {
                    <span
                      class="teletext-cell fg-{{ cell.fg }} bg-{{ cell.bg }}"
                      [class.cell-link]="cell.link"
                      [class.blink-char]="cell.flash"
                      [class.is-graphic]="cell.isGraphic"
                      [class.double-height]="cell.doubleHeight"
                      [attr.data-col]="c"
                      [attr.title]="cell.link ? 'Gehe zu Seite ' + cell.link : null"
                      (click)="onCellClick(cell)"
                    >
                      @if (cell.isGraphic && cell.mosaicMask !== undefined && cell.mosaicMask > 0) {
                        <!-- Seamless 2x3 Sub-pixel Mosaic Grid -->
                        <span class="mosaic-grid" aria-hidden="true">
                          <span class="m-px" [class.on]="isPixelOn(cell.mosaicMask, 0)"></span>
                          <span class="m-px" [class.on]="isPixelOn(cell.mosaicMask, 1)"></span>
                          <span class="m-px" [class.on]="isPixelOn(cell.mosaicMask, 2)"></span>
                          <span class="m-px" [class.on]="isPixelOn(cell.mosaicMask, 3)"></span>
                          <span class="m-px" [class.on]="isPixelOn(cell.mosaicMask, 4)"></span>
                          <span class="m-px" [class.on]="isPixelOn(cell.mosaicMask, 5)"></span>
                        </span>
                        <span class="visually-hidden">{{ cell.char || ' ' }}</span>
                      } @else {
                        {{ cell.char || ' ' }}
                      }
                    </span>
                  }
                </div>
              }
            </div>
          } @else if (teletext.errorMessage(); as error) {
            <!-- Error Viewport -->
            <div class="error-viewport">
              <div class="error-header">
                <span class="fg-white bg-red"> FEHLER: {{ teletext.currentPage() }} </span>
              </div>
              <div class="error-body">
                <p class="fg-yellow">Seite {{ teletext.currentPage() }} konnte nicht geladen werden.</p>
                <p class="fg-cyan error-detail">{{ error }}</p>
                <button class="retry-button" (click)="teletext.goToPage(100)">
                  Zur Startseite 100
                </button>
              </div>
            </div>
          } @else {
            <!-- Skeleton / Searching placeholder -->
            <div class="loading-viewport">
              <div class="loading-pulse">
                <span class="fg-yellow">SUCHE SEITE {{ teletext.currentPage() }} ...</span>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styleUrl: './teletext-screen.component.scss',
})
export class TeletextScreenComponent {
  public readonly teletext = inject(TeletextService);
  public readonly pageData = this.teletext.pageData;

  public readonly formattedBuffer = computed(() => {
    const buf = this.teletext.keypadBuffer();
    return buf.padEnd(3, '—');
  });

  public isPixelOn(mask: number | undefined, bit: number): boolean {
    if (mask === undefined) return false;
    return (mask & (1 << bit)) !== 0;
  }

  public onCellClick(cell: TeletextCell): void {
    if (cell.link) {
      this.teletext.goToPage(cell.link, 1);
    }
  }
}
