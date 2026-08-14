import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeletextService } from '../../core/teletext.service';
import type { BroadcasterInfo } from '@teletext/core';

@Component({
  selector: 'app-channel-selector',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="channel-selector-bar">
      @for (channel of teletext.channels(); track channel.id) {
        <button
          class="channel-tab"
          [class.active]="channel.id === teletext.currentChannel()"
          [style.--channel-color]="channel.primaryColor"
          (click)="teletext.switchChannel(channel.id)"
          [title]="channel.description"
        >
          <span class="live-dot" [class.offline]="teletext.isOffline()"></span>
          <span class="channel-name">{{ channel.shortName }}</span>
        </button>
      }
    </div>
  `,
  styleUrl: './channel-selector.component.scss',
})
export class ChannelSelectorComponent {
  public readonly teletext = inject(TeletextService);
}
