import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeletextService } from '../../core/teletext.service';

@Component({
  selector: 'app-keypad',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="remote-keypad">
      <!-- Remote Control Header / Screen -->
      <div class="remote-display">
        <div class="display-top">
          <span class="channel-badge">{{ teletext.currentBroadcaster().shortName }}</span>
          <span class="subpage-indicator">
            @if (pageData(); as page) {
              @if (page.subPageCount > 1) {
                {{ page.subPage }}/{{ page.subPageCount }}
              }
            }
          </span>
        </div>
        <div class="display-page">
          {{ displayPage() }}
        </div>
      </div>

      <!-- Quick Nav Buttons -->
      <div class="quick-nav-row">
        <button class="remote-btn nav-btn" (click)="teletext.prevPage()" title="Vorige Seite [Pfeil Oben]">
          <span class="btn-label">PAGE ▲</span>
        </button>
        <button class="remote-btn nav-btn" (click)="teletext.nextPage()" title="Nächste Seite [Pfeil Unten]">
          <span class="btn-label">PAGE ▼</span>
        </button>
      </div>

      <div class="quick-nav-row">
        <button
          class="remote-btn nav-btn"
          (click)="teletext.prevSubPage()"
          [disabled]="(pageData()?.subPageCount || 1) <= 1"
          title="Vorige Unterseite [Shift+Pfeil Links]"
        >
          <span class="btn-label">SUB ◀</span>
        </button>
        <button
          class="remote-btn nav-btn"
          (click)="teletext.nextSubPage()"
          [disabled]="(pageData()?.subPageCount || 1) <= 1"
          title="Nächste Unterseite [Shift+Pfeil Rechts]"
        >
          <span class="btn-label">SUB ▶</span>
        </button>
      </div>

      <!-- Numeric Keypad Grid (1-9, 0) -->
      <div class="numpad-grid">
        <button class="remote-btn digit-btn" (click)="teletext.pressDigit('1')">1</button>
        <button class="remote-btn digit-btn" (click)="teletext.pressDigit('2')">2</button>
        <button class="remote-btn digit-btn" (click)="teletext.pressDigit('3')">3</button>

        <button class="remote-btn digit-btn" (click)="teletext.pressDigit('4')">4</button>
        <button class="remote-btn digit-btn" (click)="teletext.pressDigit('5')">5</button>
        <button class="remote-btn digit-btn" (click)="teletext.pressDigit('6')">6</button>

        <button class="remote-btn digit-btn" (click)="teletext.pressDigit('7')">7</button>
        <button class="remote-btn digit-btn" (click)="teletext.pressDigit('8')">8</button>
        <button class="remote-btn digit-btn" (click)="teletext.pressDigit('9')">9</button>

        <button class="remote-btn util-btn" (click)="teletext.pressDelete()" title="Ziffer löschen [Backspace]">
          DEL
        </button>
        <button class="remote-btn digit-btn" (click)="teletext.pressDigit('0')">0</button>
        <button class="remote-btn util-btn" (click)="teletext.pressClear()" title="Eingabe abbrechen [ESC]">
          CLR
        </button>
      </div>

      <!-- Quick Section Jump Row -->
      <div class="section-jumps">
        <button class="jump-pill" (click)="teletext.goToPage(100)">100 Start</button>
        <button class="jump-pill" (click)="teletext.goToPage(200)">200 Sport</button>
        <button class="jump-pill" (click)="teletext.goToPage(300)">300 TV</button>
        <button class="jump-pill" (click)="teletext.goToPage(170)">170 Wetter</button>
      </div>
    </div>
  `,
  styleUrl: './keypad.component.scss',
})
export class KeypadComponent {
  public readonly teletext = inject(TeletextService);
  public readonly pageData = this.teletext.pageData;

  public readonly displayPage = computed(() => {
    const buf = this.teletext.keypadBuffer();
    if (buf.length > 0) {
      return buf.padEnd(3, '—');
    }
    return String(this.teletext.currentPage());
  });
}
