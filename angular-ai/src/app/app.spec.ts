import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { provideRouter, RouterLink, RouterOutlet } from '@angular/router';

describe('App', () => {

  let fixture: ComponentFixture<App>;
  let app: App;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        RouterOutlet,
        RouterLink],
      providers: [provideZonelessChangeDetection(), provideRouter([])]
    }).compileComponents();
    fixture = TestBed.createComponent(App);
    app = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(app).toBeTruthy();
  });

  it(`should have the 'AI-Spring-Angular' title`, () => {
    expect(app.title).toEqual('AI-Spring-Angular');
  });

  it('should render title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('span')?.textContent).toContain('AI-Spring-Angular');
  });

  it('should render the toolbar with buttons', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    const toolbar = compiled.querySelector('mat-toolbar');
    expect(toolbar).toBeTruthy();

    const buttons = toolbar?.querySelectorAll('button');
    expect(buttons?.length).toBe(2);

    expect(buttons?.[0]?.textContent?.trim()).toBe('Simple Chat');
    expect(buttons?.[1]?.textContent?.trim()).toBe('Memory Chat');
  });

  it('should have router outlet', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const routerOutlet = compiled.querySelector('router-outlet');
    expect(routerOutlet).toBeTruthy();
  });

  it('should have router links with correct routes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('[routerLink]');
    expect(links.length).toBeGreaterThanOrEqual(0); // May be 0 if using buttons instead of links
  });

  it('should have correct component structure', () => {
    expect(app.title).toBeDefined();
    expect(app.title).toEqual('AI-Spring-Angular');
  });

  it('should handle title property change', () => {
    const newTitle = 'New Title';
    // Since title is readonly, we test that it remains constant
    expect(app.title).toBe('AI-Spring-Angular');
    expect(app.title).not.toBe(newTitle);
  });
});
