import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ResourceErrorComponent } from './resource-error';
import { ResourceError } from './resource-error-handler';

function makeError(overrides: Partial<ResourceError> = {}): ResourceError {
  return {
    error: new HttpErrorResponse({ status: 0 }),
    message: 'Network error',
    retryCount: 0,
    timestamp: new Date(),
    isRetryable: true,
    ...overrides
  };
}

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

  function getRetryButton(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector('button[aria-label="Retry loading data"]');
  }

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

    it('should render nothing when there is no error', () => {
      fixture.componentRef.setInput('error', null);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.error-container')).toBeNull();
    });
  });

  describe('retry button availability', () => {
    it('should show the retry button when error is retryable and under max retries', () => {
      fixture.componentRef.setInput('error', makeError());
      fixture.componentRef.setInput('retryCount', 1);
      fixture.componentRef.setInput('maxRetries', 3);
      fixture.detectChanges();

      expect(getRetryButton()).toBeTruthy();
    });

    it('should not show the retry button when error is not retryable', () => {
      fixture.componentRef.setInput('error', makeError({
        error: new HttpErrorResponse({ status: 404 }),
        message: 'Not found',
        isRetryable: false
      }));
      fixture.detectChanges();

      expect(getRetryButton()).toBeNull();
    });

    it('should not show the retry button when max retries reached', () => {
      fixture.componentRef.setInput('error', makeError({ retryCount: 3 }));
      fixture.componentRef.setInput('retryCount', 3);
      fixture.componentRef.setInput('maxRetries', 3);
      fixture.detectChanges();

      expect(getRetryButton()).toBeNull();
    });

    it('should show a disabled retrying button while retry is in progress', () => {
      fixture.componentRef.setInput('error', makeError());
      fixture.componentRef.setInput('retrying', true);
      fixture.detectChanges();

      expect(getRetryButton()).toBeNull();
      const retryingButton: HTMLButtonElement =
        fixture.nativeElement.querySelector('button[aria-label="Retrying..."]');
      expect(retryingButton).toBeTruthy();
      expect(retryingButton.disabled).toBe(true);
    });

    it('should not show the retry button when showRetry is false', () => {
      fixture.componentRef.setInput('error', makeError());
      fixture.componentRef.setInput('showRetry', false);
      fixture.detectChanges();

      expect(getRetryButton()).toBeNull();
    });
  });

  describe('retry event', () => {
    it('should emit retry when clicking the retry button', () => {
      fixture.componentRef.setInput('error', makeError());
      fixture.detectChanges();

      let retryEmitted = false;
      component.retry.subscribe(() => {
        retryEmitted = true;
      });

      getRetryButton()!.click();

      expect(retryEmitted).toBe(true);
    });
  });

  describe('template rendering', () => {
    it('should display error message', () => {
      fixture.componentRef.setInput('error', makeError({
        error: new HttpErrorResponse({ status: 500 }),
        message: 'Server error occurred'
      }));
      fixture.detectChanges();

      const errorMessage = fixture.nativeElement.querySelector('.error-message');
      expect(errorMessage.textContent).toContain('Server error occurred');
    });

    it('should display custom title', () => {
      fixture.componentRef.setInput('error', makeError({
        error: new HttpErrorResponse({ status: 500 }),
        message: 'Server error'
      }));
      fixture.componentRef.setInput('title', 'Custom Error Title');
      fixture.detectChanges();

      const title = fixture.nativeElement.querySelector('.error-title');
      expect(title.textContent).toContain('Custom Error Title');
    });

    it('should display retry count when retries have been attempted', () => {
      fixture.componentRef.setInput('error', makeError({ retryCount: 2 }));
      fixture.componentRef.setInput('retryCount', 2);
      fixture.componentRef.setInput('maxRetries', 3);
      fixture.detectChanges();

      const retryInfo = fixture.nativeElement.querySelector('.retry-info');
      expect(retryInfo.textContent).toContain('Retry attempt 2 of 3');
    });

    it('should not display retry count when no retries attempted', () => {
      fixture.componentRef.setInput('error', makeError());
      fixture.componentRef.setInput('retryCount', 0);
      fixture.detectChanges();

      const retryInfo = fixture.nativeElement.querySelector('.retry-info');
      expect(retryInfo).toBeNull();
    });

    it('should show max retries message when limit reached', () => {
      fixture.componentRef.setInput('error', makeError({ retryCount: 3 }));
      fixture.componentRef.setInput('retryCount', 3);
      fixture.componentRef.setInput('maxRetries', 3);
      fixture.detectChanges();

      const maxRetriesMessage = fixture.nativeElement.querySelector('.max-retries-message');
      expect(maxRetriesMessage).toBeTruthy();
      expect(maxRetriesMessage.textContent).toContain('Maximum retry attempts reached');
    });

    it('should show non-retryable info for non-retryable errors', () => {
      fixture.componentRef.setInput('error', makeError({
        error: new HttpErrorResponse({ status: 404 }),
        message: 'Not found',
        isRetryable: false
      }));
      fixture.detectChanges();

      const nonRetryableInfo = fixture.nativeElement.querySelector('.non-retryable-info');
      expect(nonRetryableInfo).toBeTruthy();
      expect(nonRetryableInfo.textContent).toContain('cannot be automatically retried');
    });
  });
});
