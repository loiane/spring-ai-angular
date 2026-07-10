import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {

  let fixture: ComponentFixture<App>;
  let app: App;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideZonelessChangeDetection(), provideRouter([])]
    }).compileComponents();
    fixture = TestBed.createComponent(App);
    app = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(app).toBeTruthy();
  });

  it('should render the title in the toolbar', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.title')?.textContent).toContain('AI-Spring-Angular');
  });

  it('should render the toolbar with buttons', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    const toolbar = compiled.querySelector('mat-toolbar');
    expect(toolbar).toBeTruthy();

    const buttons = toolbar?.querySelectorAll('button');
    expect(buttons?.length).toBe(5);

    expect(buttons?.[0]?.textContent?.trim()).toBe('Simple Chat');
    expect(buttons?.[1]?.textContent?.trim()).toBe('Memory Chat');
    expect(buttons?.[2]?.textContent?.trim()).toBe('Chat with Document');
    expect(buttons?.[3]?.textContent?.trim()).toBe('Flight Reservations');
    expect(buttons?.[4]?.textContent?.trim()).toBe('Book Cover Identifier');
  });

  it('should have router outlet', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const routerOutlet = compiled.querySelector('router-outlet');
    expect(routerOutlet).toBeTruthy();
  });
});
