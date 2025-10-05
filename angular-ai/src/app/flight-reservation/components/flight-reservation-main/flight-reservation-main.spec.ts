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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with sidenav opened', () => {
    expect(component.sidenavOpened).toBe(true);
  });

  describe('toggleSidenav', () => {
    it('should toggle sidenav from true to false', () => {
      component.sidenavOpened = true;
      component.toggleSidenav();
      expect(component.sidenavOpened).toBe(false);
    });

    it('should toggle sidenav from false to true', () => {
      component.sidenavOpened = false;
      component.toggleSidenav();
      expect(component.sidenavOpened).toBe(true);
    });

    it('should toggle multiple times correctly', () => {
      component.sidenavOpened = true;

      component.toggleSidenav();
      expect(component.sidenavOpened).toBe(false);

      component.toggleSidenav();
      expect(component.sidenavOpened).toBe(true);

      component.toggleSidenav();
      expect(component.sidenavOpened).toBe(false);
    });
  });
});
