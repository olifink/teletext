import { inject, Injectable } from '@angular/core';
import { TeletextService } from './teletext.service';

@Injectable({
  providedIn: 'root',
})
export class KeypadService {
  private readonly teletext = inject(TeletextService);
  private isListening = false;

  public initGlobalKeyboardListener(): void {
    if (this.isListening || typeof window === 'undefined') return;

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // Ignore if typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const key = e.key;

      // Digits 0-9
      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        this.teletext.pressDigit(key);
        return;
      }

      // Backspace / Delete
      if (key === 'Backspace' || key === 'Delete') {
        e.preventDefault();
        this.teletext.pressDelete();
        return;
      }

      // Escape -> Clear buffer or close modal
      if (key === 'Escape') {
        e.preventDefault();
        if (this.teletext.isSearchOpen()) {
          this.teletext.isSearchOpen.set(false);
        } else {
          this.teletext.pressClear();
        }
        return;
      }

      // Navigation arrows
      if (key === 'ArrowRight' || key === 'PageDown') {
        e.preventDefault();
        if (e.shiftKey) {
          this.teletext.nextSubPage();
        } else {
          this.teletext.nextPage();
        }
        return;
      }

      if (key === 'ArrowLeft' || key === 'PageUp') {
        e.preventDefault();
        if (e.shiftKey) {
          this.teletext.prevSubPage();
        } else {
          this.teletext.prevPage();
        }
        return;
      }

      if (key === 'ArrowDown') {
        e.preventDefault();
        this.teletext.nextPage();
        return;
      }

      if (key === 'ArrowUp') {
        e.preventDefault();
        this.teletext.prevPage();
        return;
      }

      // Fast-text shortcuts: r, g, y, b
      if (key === 'r' || key === 'R') {
        e.preventDefault();
        this.teletext.pressFastText('red');
        return;
      }
      if (key === 'g' || key === 'G') {
        e.preventDefault();
        this.teletext.pressFastText('green');
        return;
      }
      if (key === 'y' || key === 'Y') {
        e.preventDefault();
        this.teletext.pressFastText('yellow');
        return;
      }
      if (key === 'b' || key === 'B') {
        e.preventDefault();
        this.teletext.pressFastText('blue');
        return;
      }

      // Quick hotkeys
      if (key === 'm' || key === 'M') {
        e.preventDefault();
        this.teletext.toggleDisplayMode();
        return;
      }

      if (key === 'f' || key === 'F') {
        e.preventDefault();
        this.teletext.toggleBookmark();
        return;
      }

      if (key === 's' || key === 'S' || key === '/') {
        e.preventDefault();
        this.teletext.isSearchOpen.set(!this.teletext.isSearchOpen());
        return;
      }
    });

    this.isListening = true;
  }
}
