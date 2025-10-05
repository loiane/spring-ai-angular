import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ResourceErrorHandler, DEFAULT_RETRY_CONFIG, ResourceRetryConfig } from './resource-error-handler';

describe('ResourceErrorHandler', () => {
  let errorHandler: ResourceErrorHandler;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    errorHandler = new ResourceErrorHandler(DEFAULT_RETRY_CONFIG);
  });

  afterEach(() => {
    // Clean up any pending timeouts
    errorHandler.reset();
  });

  describe('initialization', () => {
    it('should create with default config', () => {
      expect(errorHandler).toBeTruthy();
      expect(errorHandler.error()).toBeNull();
      expect(errorHandler.retryCount()).toBe(0);
    });

    it('should create with custom config', () => {
      const customConfig = {
        maxRetries: 5,
        initialDelay: 500,
        backoffMultiplier: 3,
        maxDelay: 20000
      };
      const customHandler = new ResourceErrorHandler(customConfig);
      expect(customHandler).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('should handle network errors (status 0)', () => {
      const networkError = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });

      errorHandler.handleError(networkError);

      const error = errorHandler.error();
      expect(error).not.toBeNull();
      expect(error!.isRetryable).toBe(true);
      expect(error!.message).toContain('Network error');
      expect(error!.retryCount).toBe(0);
    });

    it('should handle 404 errors as non-retryable', () => {
      const notFoundError = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });

      errorHandler.handleError(notFoundError);

      const error = errorHandler.error();
      expect(error).not.toBeNull();
      expect(error!.isRetryable).toBe(false);
      expect(error!.message).toContain('Resource not found');
    });

    it('should handle 500 errors as retryable', () => {
      const serverError = new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' });

      errorHandler.handleError(serverError);

      const error = errorHandler.error();
      expect(error).not.toBeNull();
      expect(error!.isRetryable).toBe(true);
      expect(error!.message).toContain('Server error');
    });

    it('should handle 401 errors as non-retryable', () => {
      const authError = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });

      errorHandler.handleError(authError);

      const error = errorHandler.error();
      expect(error).not.toBeNull();
      expect(error!.isRetryable).toBe(false);
      expect(error!.message).toContain('Authentication required');
    });

    it('should handle 403 errors as non-retryable', () => {
      const forbiddenError = new HttpErrorResponse({ status: 403, statusText: 'Forbidden' });

      errorHandler.handleError(forbiddenError);

      const error = errorHandler.error();
      expect(error).not.toBeNull();
      expect(error!.isRetryable).toBe(false);
      expect(error!.message).toContain('Access denied');
    });

    it('should handle generic errors as retryable', () => {
      const genericError = new Error('Something went wrong');

      errorHandler.handleError(genericError);

      const error = errorHandler.error();
      expect(error).not.toBeNull();
      expect(error!.isRetryable).toBe(true);
      expect(error!.message).toBe('Something went wrong');
    });

    it('should handle 503 (Service Unavailable) errors as retryable', () => {
      const serviceUnavailable = new HttpErrorResponse({ status: 503, statusText: 'Service Unavailable' });

      errorHandler.handleError(serviceUnavailable);

      const error = errorHandler.error();
      expect(error).not.toBeNull();
      expect(error!.isRetryable).toBe(true);
      expect(error!.message).toContain('Server error');
    });

    it('should handle 400 (Bad Request) errors as non-retryable', () => {
      const badRequest = new HttpErrorResponse({ status: 400, statusText: 'Bad Request' });

      errorHandler.handleError(badRequest);

      const error = errorHandler.error();
      expect(error).not.toBeNull();
      expect(error!.isRetryable).toBe(false);
      // HttpErrorResponse provides a default message that includes the status
      expect(error!.message).toBeTruthy();
    });

    it('should handle HttpErrorResponse with error message', () => {
      const errorWithMessage = new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error',
        error: { message: 'Database connection failed' }
      });

      errorHandler.handleError(errorWithMessage);

      const error = errorHandler.error();
      expect(error).not.toBeNull();
      expect(error!.error).toBe(errorWithMessage);
    });
  });

  describe('retry logic', () => {
    it('should allow retry when error is retryable and under max retries', () => {
      const networkError = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });
      errorHandler.handleError(networkError);

      expect(errorHandler.canRetry).toBe(true);
    });

    it('should not allow retry when error is non-retryable', () => {
      const notFoundError = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
      errorHandler.handleError(notFoundError);

      expect(errorHandler.canRetry).toBe(false);
    });

    it('should not allow retry when max retries reached', () => {
      const networkError = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });
      errorHandler.handleError(networkError);

      // Simulate reaching max retries
      errorHandler.setRetryCount(3);

      expect(errorHandler.canRetry).toBe(false);
    });

    it('should call operation with exponential backoff', (done) => {
      const networkError = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });
      errorHandler.handleError(networkError);

      let operationCalled = false;
      const operation = () => {
        operationCalled = true;
      };

      const startTime = Date.now();
      errorHandler.retry(operation);

      // Check that operation is not called immediately
      expect(operationCalled).toBe(false);
      expect(errorHandler.retryCount()).toBe(1);

      // Wait for the operation to be called
      setTimeout(() => {
        expect(operationCalled).toBe(true);
        const elapsedTime = Date.now() - startTime;
        // Should be approximately 1000ms (initialDelay)
        expect(elapsedTime).toBeGreaterThanOrEqual(950);
        done();
      }, 1100);
    });

    it('should calculate correct delay with backoff multiplier', () => {
      const networkError = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });
      errorHandler.handleError(networkError);

      // First retry: 1000ms
      errorHandler.retry(() => {});
      expect(errorHandler.retryCount()).toBe(1);

      // Second retry would be: 1000 * 2 = 2000ms
      errorHandler.retry(() => {});
      expect(errorHandler.retryCount()).toBe(2);

      // Third retry would be: 1000 * 4 = 4000ms
      errorHandler.retry(() => {});
      expect(errorHandler.retryCount()).toBe(3);
    });
  });

  describe('reset', () => {
    it('should reset error state', () => {
      const networkError = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });
      errorHandler.handleError(networkError);
      errorHandler.setRetryCount(2);

      errorHandler.reset();

      expect(errorHandler.error()).toBeNull();
      expect(errorHandler.retryCount()).toBe(0);
    });

    it('should clear pending retry timeouts', () => {
      const networkError = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });
      errorHandler.handleError(networkError);

      let operationCalled = false;
      errorHandler.retry(() => { operationCalled = true; });

      errorHandler.reset();

      // Wait longer than the retry delay
      setTimeout(() => {
        expect(operationCalled).toBe(false);
      }, 1500);
    });
  });

  describe('retry count management', () => {
    it('should increment retry count on each retry', () => {
      const networkError = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });
      errorHandler.handleError(networkError);

      expect(errorHandler.retryCount()).toBe(0);

      errorHandler.retry(() => {});
      expect(errorHandler.retryCount()).toBe(1);

      errorHandler.retry(() => {});
      expect(errorHandler.retryCount()).toBe(2);
    });

    it('should allow manual setting of retry count', () => {
      errorHandler.setRetryCount(5);
      expect(errorHandler.retryCount()).toBe(5);
    });
  });

  describe('custom configuration', () => {
    it('should accept custom retry configuration', () => {
      const customConfig: ResourceRetryConfig = {
        maxRetries: 5,
        initialDelay: 500,
        backoffMultiplier: 3,
        maxDelay: 20000
      };
      const customHandler = new ResourceErrorHandler(customConfig);

      const networkError = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });
      customHandler.handleError(networkError);

      // Should allow up to 5 retries based on custom config
      customHandler.setRetryCount(4);
      expect(customHandler.canRetry).toBe(true);

      customHandler.setRetryCount(5);
      expect(customHandler.canRetry).toBe(false);
    });
  });

  describe('retry when canRetry is false', () => {
    it('should not execute operation when canRetry is false', (done) => {
      const notFoundError = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
      errorHandler.handleError(notFoundError);

      let operationCalled = false;
      errorHandler.retry(() => { operationCalled = true; });

      setTimeout(() => {
        expect(operationCalled).toBe(false);
        done();
      }, 1500);
    });

    it('should not execute operation when max retries reached', (done) => {
      const networkError = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });
      errorHandler.handleError(networkError);
      errorHandler.setRetryCount(3); // Max retries reached

      let operationCalled = false;
      errorHandler.retry(() => { operationCalled = true; });

      setTimeout(() => {
        expect(operationCalled).toBe(false);
        done();
      }, 1500);
    });
  });

  describe('error message fallbacks', () => {
    it('should use error.error.message when available', () => {
      const errorWithNestedMessage = new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error',
        error: { message: 'Database connection failed' }
      });

      errorHandler.handleError(errorWithNestedMessage);

      const error = errorHandler.error();
      expect(error).not.toBeNull();
      expect(error!.message).toContain('Server error');
    });

    it('should use default message for client errors without specific message', () => {
      const clientError = new HttpErrorResponse({
        status: 418, // I'm a teapot - not a specific status we handle
        statusText: 'I am a teapot'
      });

      errorHandler.handleError(clientError);

      const error = errorHandler.error();
      expect(error).not.toBeNull();
      // Should fall back to generic message or error.message
      expect(error!.message).toBeTruthy();
    });

    it('should handle Error without message property', () => {
      const errorWithoutMessage = new Error();
      (errorWithoutMessage as any).message = ''; // Empty message

      errorHandler.handleError(errorWithoutMessage);

      const error = errorHandler.error();
      expect(error).not.toBeNull();
      expect(error!.message).toBe('An unexpected error occurred.');
    });
  });
});
