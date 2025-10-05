import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ReservationList } from './reservation-list';
import { FlightReservationService } from '../../services/flight-reservation.service';
import { FlightReservation, ReservationStatus } from '../../models/flight-reservation';

describe('ReservationList', () => {
  let component: ReservationList;
  let fixture: ComponentFixture<ReservationList>;
  let service: FlightReservationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationList],
      providers: [
        FlightReservationService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationList);
    component = fixture.componentInstance;
    service = TestBed.inject(FlightReservationService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display correct columns', () => {
    expect(component.displayedColumns).toEqual([
      'number', 'name', 'date', 'status', 'from', 'to', 'seat', 'class', 'actions'
    ]);
  });

  it('should have access to reservations resource', () => {
    expect(component.reservations).toBe(service.reservationsResource);
  });

  it('should have access to selected reservation signal', () => {
    expect(component.selectedReservation).toBe(service.selectedReservation);
  });

  describe('onSelectReservation', () => {
    it('should call service to select reservation', () => {
      const mockReservation: FlightReservation = {
        number: 'SA101',
        name: 'John Doe',
        date: '2025-10-10',
        status: ReservationStatus.CONFIRMED,
        from: 'New York',
        to: 'London',
        seat: '12A',
        class: 'Economy'
      };

      spyOn(service, 'selectReservation');
      component.onSelectReservation(mockReservation);
      expect(service.selectReservation).toHaveBeenCalledWith(mockReservation);
    });
  });

  describe('getStatusChipClass', () => {
    it('should return correct class for CONFIRMED status', () => {
      expect(component.getStatusChipClass(ReservationStatus.CONFIRMED)).toBe('status-confirmed');
    });

    it('should return correct class for PENDING status', () => {
      expect(component.getStatusChipClass(ReservationStatus.PENDING)).toBe('status-pending');
    });

    it('should return correct class for CANCELLED status', () => {
      expect(component.getStatusChipClass(ReservationStatus.CANCELLED)).toBe('status-cancelled');
    });

    it('should return empty string for unknown status', () => {
      expect(component.getStatusChipClass('UNKNOWN' as ReservationStatus)).toBe('');
    });
  });

  describe('onRefresh', () => {
    it('should call service to refresh reservations', () => {
      spyOn(service, 'refreshReservations');
      component.onRefresh();
      expect(service.refreshReservations).toHaveBeenCalled();
    });
  });

  it('should expose ReservationStatus enum', () => {
    expect(component.ReservationStatus).toBe(ReservationStatus);
  });
});
