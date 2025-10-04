import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { LoggingService } from './logging.service';

describe('LoggingService', () => {
  let service: LoggingService;
  let consoleLogSpy: jasmine.Spy;
  let consoleWarnSpy: jasmine.Spy;
  let consoleErrorSpy: jasmine.Spy;
  let consoleDebugSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()]
    });
    service = TestBed.inject(LoggingService);

    consoleLogSpy = spyOn(console, 'log');
    consoleWarnSpy = spyOn(console, 'warn');
    consoleErrorSpy = spyOn(console, 'error');
    consoleDebugSpy = spyOn(console, 'debug');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should log informational messages', () => {
    service.log('Test message', { data: 'test' });
    expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] Test message', { data: 'test' });
  });

  it('should log warning messages', () => {
    service.warn('Warning message', 'extra data');
    expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] Warning message', 'extra data');
  });

  it('should log error messages', () => {
    const error = new Error('Test error');
    service.error('Error occurred', error);
    expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Error occurred', error);
  });

  it('should log debug messages', () => {
    service.debug('Debug info', { value: 123 });
    expect(consoleDebugSpy).toHaveBeenCalledWith('[DEBUG] Debug info', { value: 123 });
  });
});
