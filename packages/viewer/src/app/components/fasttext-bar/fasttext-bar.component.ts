import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeletextService } from '../../core/teletext.service';

@Component({
  selector: 'app-fasttext-bar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fasttext-container">
      <!-- Red Button -->
      <button
        class="ft-btn ft-red"
        (click)="teletext.pressFastText('red')"
        [disabled]="!resolvedFastText().red"
        title="Rot: Seite {{ resolvedFastText().red }} [Taste R]"
      >
        <span class="ft-indicator"></span>
        <span class="ft-num">{{ resolvedFastText().red || '---' }}</span>
        <span class="ft-key">[R]</span>
      </button>

      <!-- Green Button -->
      <button
        class="ft-btn ft-green"
        (click)="teletext.pressFastText('green')"
        [disabled]="!resolvedFastText().green"
        title="Grün: Seite {{ resolvedFastText().green }} [Taste G]"
      >
        <span class="ft-indicator"></span>
        <span class="ft-num">{{ resolvedFastText().green || '---' }}</span>
        <span class="ft-key">[G]</span>
      </button>

      <!-- Yellow Button -->
      <button
        class="ft-btn ft-yellow"
        (click)="teletext.pressFastText('yellow')"
        [disabled]="!resolvedFastText().yellow"
        title="Gelb: Seite {{ resolvedFastText().yellow }} [Taste Y]"
      >
        <span class="ft-indicator"></span>
        <span class="ft-num">{{ resolvedFastText().yellow || '---' }}</span>
        <span class="ft-key">[Y]</span>
      </button>

      <!-- Blue Button -->
      <button
        class="ft-btn ft-blue"
        (click)="teletext.pressFastText('blue')"
        [disabled]="!resolvedFastText().blue"
        title="Blau: Seite {{ resolvedFastText().blue }} [Taste B]"
      >
        <span class="ft-indicator"></span>
        <span class="ft-num">{{ resolvedFastText().blue || '---' }}</span>
        <span class="ft-key">[B]</span>
      </button>
    </div>
  `,
  styleUrl: './fasttext-bar.component.scss',
})
export class FasttextBarComponent {
  public readonly teletext = inject(TeletextService);

  public readonly resolvedFastText = computed(() => {
    const page = this.teletext.pageData();
    if (page?.fastText) {
      return {
        red: page.fastText.red || 100,
        green: page.fastText.green || 200,
        yellow: page.fastText.yellow || 300,
        blue: page.fastText.blue || 170,
      };
    }
    return {
      red: 100,
      green: 200,
      yellow: 300,
      blue: 170,
    };
  });
}
