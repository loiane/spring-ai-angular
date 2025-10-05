import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ResourceErrorComponent } from './resource-error';
import { ResourceError } from './resource-error-handler';

describe('ResourceErrorComponent', () => {
  let component: ResourceErrorComponent;
  let fixture: ComponentFixture<ResourceErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceErrorComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceErrorComponent);
    component = fixture.componentInstance;
  });

  describe('component initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default input values', () => {
      expect(component.retryCount()).toBe(0);
      expect(component.maxRetries()).toBe(3);
      expect(component.title()).toBe('Error Loading Data');
      expect(component.showRetry()).toBe(true);
      expect(component.retrying()).toBe(false);
    });
  });

  describe('canRetry getter', () => {
    it('should return true when error is retryable and under max retries', () => {
      const error: ResourceError = {
        error: new HttpErrorResponse({ status: 0 }),
        message: 'Network error',
        retryCount: 0,
        timestamp: new Date(),
        isRetryable: true
      };

      fixture.componentRef.setInput('error', error);
      fixture.componentRef.setInput('retryCount', 1);
      fixture.componentRef.setInput('maxRetries', 3);
      fixture.detectChanges();

      expect(component.canRetry).toBe(true);
    });

    it('should return false when error is null', () => {
      fixture.componentRef.setInput('error', null);
      fixture.detectChanges();

      expect(component.canRetry).toBe(false);
    });

    it('should return false when error is not retryable', () => {
      const error: ResourceError = {
        error: new HttpErrorResponse({ status: 404 }),
        message: 'Not found',
        retryCount: 0,
        timestamp: new Date(),
        isRetryable: false
      };

      fixture.componentRef.setInput('error', error);
      fixture.detectChanges();

      expect(component.canRetry).toBe(false);
    });

    it('should return false when max retries reached', () => {
      const error: ResourceError = {
        error: new HttpErrorResponse({ status: 0 }),
        message: 'Network error',
        retryCount: 3,
        timestamp: new Date(),
        isRetryable: true
      };

      fixture.componentRef.setInput('error', error);
      fixture.componentRef.setInput('retryCount', 3);
      fixture.componentRef.setInput('maxRetries', 3);
      fixture.detectChanges();

      expect(component.canRetry).toBe(false);
    });

    it('should return false when retrying is in progress', () => {
      const error: ResourceError = {
        error: new HttpErrorResponse({ status: 0 }),
        message: 'Network error',
        retryCount: 0,
        timestamp: new Date(),
        isRetryable: true
      };

      fixture.componentRef.setInput('error', error);
      fixture.componentRef.setInput('retrying', true);
      fixture.detectChanges();

      expect(component.canRetry).toBe(false);
    });
  });

  describe('onRetry', () => {
    it('should emit retry event when canRetry is true', () => {
      const error: ResourceError = {
        error: new HttpErrorResponse({ status: 0 }),
        message: 'Network error',
        retryCount: 0,
        timestamp: new Date(),
        isRetryable: true
      };

      fixture.componentRef.setInput('error', error);
      fixture.detectChanges();

      let retryEmitted = false;
      component.retry.subscribe(() => {
        retryEmitted = true;
      });

      component.onRetry();

      expect(retryEmitted).toBe(true);
    });

    it('should not emit retry event when canRetry is false', () => {
      const error: ResourceError = {
        error: new HttpErrorResponse({ status: 404 }),
        message: 'Not found',
        retryCount: 0,
        timestamp: new Date(),
        isRetryable: false
      };

      fixture.componentRef.setInput('error', error);
      fixture.detectChanges();

      let retryEmitted = false;
      component.retry.subscribe(() => {
        retryEmitted = true;
      });

      component.onRetry();

      expect(retryEmitted).toBe(false);
    });
  });

  describe('template rendering', () => {
    it('should display error message', () => {
      const error: ResourceError = {
        error: new HttpErrorResponse({ status: 500 }),
        message: 'Server error occurred',
        retryCount: 0,
        timestamp: new Date(),
        isRetryable: true
      };

      fixture.componentRef.setInput('error', error);
      fixture.detectChanges();

      const errorMessage = fixture.nativeElement.querySelector('.error-message');
      expect(errorMessage.textContent).toContain('Server error occurred');
    });

    it('should display custom title', () => {
      const error: ResourceError = {
        error: new HttpErrorResponse({ status: 500 }),
        message: 'Server error',
        retryCount: 0,
        timestamp: new Date(),
        isRetryable: true
      };

      fixture.componentRef.setInput('error', error);
      fixture.componentRef.setInput('title', 'Custom Error Title');
      fixture.detectChanges();

      const title = fixture.nativeElement.querySelector('.error-title');
      expect(title.textContent).toContain('Custom Error Title');
    });

    it('should display retry count when retries have been attempted', () => {
      const error: ResourceError = {
        error: new HttpErrorResponse({ status: 0 }),
        message: 'Network error',
        retryCount: 2,
        timestamp: new Date(),
        isRetryable: true
      };

      fixture.componentRef.setInput('error', error);
      fixture.componentRef.setInput('retryCount', 2);
      fixture.componentRef.setInput('maxRetries', 3);
      fixture.detectChanges();

      const retryInfo = fixture.nativeElement.querySelector('.retry-info');
      expect(retryInfo.textContent).toContain('Retry attempt 2 of 3');
    });

    it('should not display retry count when no retries attempted', () => {
      const error: ResourceError = {
        error: new HttpErrorResponse({ status: 0 }),
        message: 'Network error',
        retryCount: 0,
        timestamp: new Date(),
        isRetryable: true
      };

      fixture.componentRef.setInput('error', error);
      fixture.componentRef.setInput('retryCount', 0);
      fixture.detectChanges();

      const retryInfo = fixture.nativeElement.querySelector('.retry-info');
      expect(retryInfo).toBeNull();
    });

    it('should show retry button when error is retryable', () => {
      const error: ResourceError = {
        error: new HttpErrorResponse({ status: 0 }),
        message: 'Network error',
        retryCount: 0,
        timestamp: new Date(),
        isRetryable: true
      };

      fixture.componentRef.setInput('error', error);
      fixture.detectChanges();

      const retryButton = fixture.nativeElement.querySelector('button[aria-label="Retry loading data"]');
      expect(retryButton).toBeTruthy();
    });

    it('should not show retry button when error is non-retryable', () => {
      const error: ResourceError = {
        error: new HttpErrorResponse({ status: 404 }),
        message: 'Not found',
        retryCount: 0,
        timestamp: new Date(),
        isRetryable: false
      };

      fixture.componentRef.setInput('error', error);
      fixture.detectChanges();

      const retryButton = fixture.nativeElement.querySelector('button');
      expect(retryButton).toBeNull();
    });

    it('should show max retries message when limit reached', () => {
      const error: ResourceError = {
        error: new HttpErrorResponse({ status: 0 }),
        message: 'Network error',
        retryCount: 3,
        timestamp: new Date(),
        isRetryable: true
      };

      fixture.componentRef.setInput('error', error);
      fixture.componentRef.setInput('retryCount', 3);
      fixture.componentRef.setInput('maxRetries', 3);
      fixture.detectChanges();

      const maxRetriesMessage = fixture.nativeElement.querySelector('.max-retries-message');
      expect(maxRetriesMessage).toBeTruthy();
      expect(maxRetriesMessage.textContent).toContain('Maximum retry attempts reached');
    });

    it('should show non-retryable info for non-retryable errors', () => {
      const error: ResourceError = {
        error: new HttpErrorResponse({ status: 404 }),
        message: 'Not found',
        retryCount: 0,
        timestamp: new Date(),
        isRetryable: false
      };

      fixture.componentRef.setInput('error', error);
      fixture.detectChanges();

      const nonRetryableInfo = fixture.nativeElement.querySelector('.non-retryable-info');
      expect(nonRetryableInfo).toBeTruthy();
      expect(nonRetryableInfo.textContent).toContain('cannot be automatically retried');
    });
  });
});
