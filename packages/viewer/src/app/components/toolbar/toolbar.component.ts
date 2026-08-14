import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeletextService } from '../../core/teletext.service';
import { ChannelSelectorComponent } from '../channel-selector/channel-selector.component';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, ChannelSelectorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="app-toolbar">
      <!-- Left: Logo & History -->
      <div class="toolbar-left">
        <div class="brand-logo" (click)="teletext.goToPage(100)">
          <span class="logo-txt fg-red">V</span>
          <span class="logo-txt fg-green">I</span>
          <span class="logo-txt fg-yellow">D</span>
          <span class="logo-txt fg-cyan">E</span>
          <span class="logo-txt fg-magenta">O</span>
          <span class="logo-txt fg-white">TEXT</span>
          <span class="logo-badge">MODERN</span>
        </div>

        <!-- History Back / Forward -->
        <div class="history-nav">
          <button
            class="history-btn"
            [disabled]="!teletext.canGoBack()"
            (click)="teletext.goBack()"
            title="Zurück [Alt+Links]"
          >
            ◀
          </button>
          <button
            class="history-btn"
            [disabled]="!teletext.canGoForward()"
            (click)="teletext.goForward()"
            title="Vorwärts [Alt+Rechts]"
          >
            ▶
          </button>
        </div>
      </div>

      <!-- Center: Channel Switcher Tabs -->
      <div class="toolbar-center">
        <app-channel-selector></app-channel-selector>
      </div>

      <!-- Right: Action Controls -->
      <div class="toolbar-right">
        <!-- Search Trigger -->
        <button
          class="action-btn search-trigger"
          (click)="teletext.isSearchOpen.set(true)"
          title="Seiten & Index durchsuchen [Taste S]"
        >
          <span class="btn-icon">🔍</span>
          <span class="btn-text">Suche</span>
          <span class="key-hint">[S]</span>
        </button>

        <!-- Display Mode Toggle (CRT vs Clean) -->
        <button
          class="action-btn mode-toggle"
          [class.crt-active]="teletext.displayMode() === 'crt'"
          (click)="teletext.toggleDisplayMode()"
          title="Anzeigemodus umschalten: Retro CRT / Scharf [Taste M]"
        >
          <span class="btn-icon">{{ teletext.displayMode() === 'crt' ? '📺' : '⚡' }}</span>
          <span class="btn-text">{{ teletext.displayMode() === 'crt' ? 'CRT Scanlines' : 'Pixel Scharf' }}</span>
          <span class="key-hint">[M]</span>
        </button>

        <!-- Sound Toggle -->
        <button
          class="action-btn icon-only"
          (click)="teletext.toggleSound()"
          title="{{ teletext.soundEnabled() ? 'Sound stummschalten' : 'Sound einschalten' }}"
        >
          {{ teletext.soundEnabled() ? '🔊' : '🔇' }}
        </button>

        <!-- Mobile Keypad Toggle -->
        <button
          class="action-btn icon-only mobile-keypad-toggle"
          [class.active]="teletext.isKeypadOpen()"
          (click)="teletext.isKeypadOpen.set(!teletext.isKeypadOpen())"
          title="Fernbedienung anzeigen/verbergen"
        >
          🔢
        </button>
      </div>
    </header>
  `,
  styleUrl: './toolbar.component.scss',
})
export class ToolbarComponent {
  public readonly teletext = inject(TeletextService);
}
