import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeletextService } from './core/teletext.service';
import { KeypadService } from './core/keypad.service';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { TeletextScreenComponent } from './components/teletext-screen/teletext-screen.component';
import { FasttextBarComponent } from './components/fasttext-bar/fasttext-bar.component';
import { SubpageControlsComponent } from './components/subpage-controls/subpage-controls.component';
import { KeypadComponent } from './components/keypad/keypad.component';
import { BookmarksBarComponent } from './components/bookmarks-bar/bookmarks-bar.component';
import { SearchDialogComponent } from './components/search-dialog/search-dialog.component';
import { ChannelSelectorComponent } from './components/channel-selector/channel-selector.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ToolbarComponent,
    TeletextScreenComponent,
    FasttextBarComponent,
    SubpageControlsComponent,
    KeypadComponent,
    BookmarksBarComponent,
    SearchDialogComponent,
    ChannelSelectorComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  public readonly teletext = inject(TeletextService);
  private readonly keypad = inject(KeypadService);

  ngOnInit(): void {
    this.keypad.initGlobalKeyboardListener();
  }
}
