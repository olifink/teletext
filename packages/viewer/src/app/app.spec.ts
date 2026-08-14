import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('Teletext Viewer App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have initial channel and page', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app.teletext.currentChannel()).toBe('ard');
    expect(app.teletext.currentPage()).toBe(100);
  });
});
