import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { FlightReservationMain } from './flight-reservation-main';

describe('FlightReservationMain', () => {
  let component: FlightReservationMain;
  let fixture: ComponentFixture<FlightReservationMain>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlightReservationMain],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FlightReservationMain);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function getToggleButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button[aria-label="Toggle concierge chat"]');
  }

  function getToggleIcon(): string {
    return getToggleButton().querySelector('mat-icon')?.textContent?.trim() ?? '';
  }

  function getSidenav(): HTMLElement {
    return fixture.nativeElement.querySelector('mat-sidenav');
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the toolbar title', () => {
    const toolbar: HTMLElement = fixture.nativeElement.querySelector('mat-toolbar');
    expect(toolbar.textContent).toContain('SpringFly Reservations');
  });

  it('should render the reservation list and concierge chat', () => {
    expect(fixture.nativeElement.querySelector('app-reservation-list')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-concierge-chat')).toBeTruthy();
  });

  it('should start with the sidenav opened', () => {
    expect(getToggleIcon()).toBe('chevron_right');
    expect(getSidenav().classList.contains('mat-drawer-opened')).toBe(true);
  });

  it('should close the sidenav when clicking the toggle button', () => {
    getToggleButton().click();
    fixture.detectChanges();

    expect(getToggleIcon()).toBe('chat');
    expect(getSidenav().classList.contains('mat-drawer-opened')).toBe(false);
  });

  it('should reopen the sidenav when toggling twice', () => {
    getToggleButton().click();
    fixture.detectChanges();
    getToggleButton().click();
    fixture.detectChanges();

    expect(getToggleIcon()).toBe('chevron_right');
    expect(getSidenav().classList.contains('mat-drawer-opened')).toBe(true);
  });
});
