import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeletextService } from '../../core/teletext.service';

@Component({
  selector: 'app-subpage-controls',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (hasSubPages()) {
      <div class="subpage-bar">
        <!-- Subpage Navigation Buttons -->
        <div class="subpage-nav">
          <button
            class="sub-btn"
            (click)="teletext.prevSubPage()"
            title="Vorige Unterseite"
          >
            ◀
          </button>

          <span class="subpage-count">
            Seite {{ pageData()?.subPage }} von {{ pageData()?.subPageCount }}
          </span>

          <button
            class="sub-btn"
            (click)="teletext.nextSubPage()"
            title="Nächste Unterseite"
          >
            ▶
          </button>
        </div>

        <!-- Subpage Pills -->
        <div class="subpage-pills">
          @for (idx of subPageList(); track idx) {
            <button
              class="pill-btn"
              [class.active]="idx === pageData()?.subPage"
              (click)="teletext.goToSubPage(idx)"
            >
              {{ idx }}
            </button>
          }
        </div>

        <!-- Auto-Rotate Toggle & Progress Bar -->
        <div class="auto-rotate-container">
          <button
            class="rotate-toggle-btn"
            [class.active]="teletext.autoRotate()"
            (click)="teletext.toggleAutoRotate()"
            title="Automatisches Weiterblättern an/aus"
          >
            {{ teletext.autoRotate() ? '⏸ Pause' : '▶ Auto-Blättern' }}
          </button>

          @if (teletext.autoRotate()) {
            <div class="progress-track" title="Zeit bis zum nächsten Blatt">
              <div
                class="progress-bar"
                [style.width.%]="teletext.autoRotateProgress()"
              ></div>
            </div>
          }
        </div>
      </div>
    }
  `,
  styleUrl: './subpage-controls.component.scss',
})
export class SubpageControlsComponent {
  public readonly teletext = inject(TeletextService);
  public readonly pageData = this.teletext.pageData;

  public readonly hasSubPages = computed(() => {
    const page = this.pageData();
    return !!page && page.subPageCount > 1;
  });

  public readonly subPageList = computed(() => {
    const page = this.pageData();
    if (!page || page.subPageCount <= 1) return [];
    return Array.from({ length: page.subPageCount }, (_, i) => i + 1);
  });
}
