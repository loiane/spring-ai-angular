import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ReservationList } from './reservation-list';
import { FlightReservationService } from '../../services/flight-reservation.service';
import { FlightReservation, ReservationStatus } from '../../models/flight-reservation';

const mockReservations: FlightReservation[] = [
  {
    number: 'SA101',
    name: 'John Doe',
    date: '2025-10-10',
    status: ReservationStatus.CONFIRMED,
    from: 'New York',
    to: 'London',
    seat: '12A',
    class: 'Economy'
  },
  {
    number: 'SA202',
    name: 'Jane Smith',
    date: '2025-11-15',
    status: ReservationStatus.PENDING,
    from: 'Paris',
    to: 'Tokyo',
    seat: '3C',
    class: 'Business'
  },
  {
    number: 'SA303',
    name: 'Bob Brown',
    date: '2025-12-01',
    status: ReservationStatus.CANCELLED,
    from: 'Berlin',
    to: 'Madrid',
    seat: '20F',
    class: 'Economy'
  }
];

class MockFlightReservationService {
  selectedReservation = signal<FlightReservation | null>(null);
  resourceStatus = signal('resolved');
  resourceValue = signal<FlightReservation[]>(mockReservations);
  resourceError = signal<unknown>(null);
  reservationsResource = {
    value: this.resourceValue,
    status: this.resourceStatus,
    error: this.resourceError,
    reload: vi.fn()
  };
  handlerError = signal<unknown>(null);
  reservationsErrorHandler = {
    error: this.handlerError,
    retryCount: signal(0),
    reset: vi.fn()
  };
  selectReservation = vi.fn();
  refreshReservations = vi.fn();
  retryLoadReservations = vi.fn();
}

describe('ReservationList', () => {
  let component: ReservationList;
  let fixture: ComponentFixture<ReservationList>;
  let mockService: MockFlightReservationService;

  beforeEach(async () => {
    mockService = new MockFlightReservationService();

    await TestBed.configureTestingModule({
      imports: [ReservationList],
      providers: [
        provideZonelessChangeDetection(),
        { provide: FlightReservationService, useValue: mockService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function getRows(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('tr[mat-row]'));
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the header with title', () => {
    const title: HTMLElement = fixture.nativeElement.querySelector('mat-card-title');
    expect(title.textContent).toContain('SpringFly Bookings');
  });

  it('should render a table row for each reservation', () => {
    const rows = getRows();
    expect(rows.length).toBe(3);
    expect(rows[0].textContent).toContain('SA101');
    expect(rows[0].textContent).toContain('John Doe');
    expect(rows[1].textContent).toContain('SA202');
    expect(rows[2].textContent).toContain('SA303');
  });

  it('should render all column headers', () => {
    const headers = Array.from(
      fixture.nativeElement.querySelectorAll('th') as NodeListOf<HTMLElement>
    ).map(h => h.textContent?.trim());
    expect(headers).toEqual(
      ['Number', 'Name', 'Date', 'Status', 'From', 'To', 'Seat', 'Class', 'Actions']
    );
  });

  it('should render status chips with the correct class per status', () => {
    const rows = getRows();
    expect(rows[0].querySelector('mat-chip.status-confirmed')).toBeTruthy();
    expect(rows[1].querySelector('mat-chip.status-pending')).toBeTruthy();
    expect(rows[2].querySelector('mat-chip.status-cancelled')).toBeTruthy();
  });

  it('should select the reservation when clicking a row', () => {
    getRows()[0].click();
    expect(mockService.selectReservation).toHaveBeenCalledWith(mockReservations[0]);
  });

  it('should select the reservation when clicking its info button', () => {
    const infoButton: HTMLButtonElement =
      getRows()[1].querySelector('button[aria-label="Select reservation"]')!;
    infoButton.click();
    expect(mockService.selectReservation).toHaveBeenCalledWith(mockReservations[1]);
  });

  it('should highlight the selected row', () => {
    mockService.selectedReservation.set(mockReservations[1]);
    fixture.detectChanges();

    const rows = getRows();
    expect(rows[0].classList.contains('selected-row')).toBe(false);
    expect(rows[1].classList.contains('selected-row')).toBe(true);
  });

  it('should refresh the reservations when clicking the refresh button', () => {
    const refreshButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('button[aria-label="Refresh reservations"]');
    refreshButton.click();
    expect(mockService.refreshReservations).toHaveBeenCalled();
  });

  it('should show the loading spinner while loading', () => {
    mockService.resourceStatus.set('loading');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Loading reservations...');
  });

  it('should show the error component and retry when loading fails', () => {
    mockService.resourceStatus.set('error');
    mockService.handlerError.set({
      error: new Error('load failed'),
      message: 'Failed to load reservations',
      retryCount: 0,
      timestamp: new Date(),
      isRetryable: true
    });
    fixture.detectChanges();

    const errorComponent = fixture.nativeElement.querySelector('app-resource-error');
    expect(errorComponent).toBeTruthy();
    expect(errorComponent.textContent).toContain('Error Loading Reservations');

    const retryButton: HTMLButtonElement = errorComponent.querySelector('button[aria-label="Retry loading data"]');
    retryButton.click();
    expect(mockService.retryLoadReservations).toHaveBeenCalled();
  });
});
