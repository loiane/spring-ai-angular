import { signal, Signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * Configuration for resource retry behavior
 */
export interface ResourceRetryConfig {
  /**
   * Maximum number of retry attempts before giving up
   * @default 3
   */
  maxRetries: number;

  /**
   * Delay in milliseconds before the first retry
   * @default 1000
   */
  initialDelay: number;

  /**
   * Multiplier for exponential backoff
   * @default 2
   */
  backoffMultiplier: number;

  /**
   * Maximum delay in milliseconds between retries
   * @default 10000
   */
  maxDelay: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: ResourceRetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000
};

/**
 * Represents an error state for a resource
 */
export interface ResourceError {
  /**
   * The original HTTP error response
   */
  error: HttpErrorResponse | Error;

  /**
   * User-friendly error message
   */
  message: string;

  /**
   * Number of retry attempts made
   */
  retryCount: number;

  /**
   * Timestamp when the error occurred
   */
  timestamp: Date;

  /**
   * Whether the error is retryable (network errors, 5xx errors)
   */
  isRetryable: boolean;
}

/**
 * State management for resource errors and retries
 */
export class ResourceErrorHandler {
  private readonly errorSignal = signal<ResourceError | null>(null);
  private readonly retryCountSignal = signal<number>(0);
  private retryTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly config: ResourceRetryConfig = DEFAULT_RETRY_CONFIG
  ) {}

  /**
   * Get the current error state
   */
  get error(): Signal<ResourceError | null> {
    return this.errorSignal.asReadonly();
  }

  /**
   * Get the current retry count
   */
  get retryCount(): Signal<number> {
    return this.retryCountSignal.asReadonly();
  }

  /**
   * Check if the resource can be retried
   */
  get canRetry(): boolean {
    const currentError = this.errorSignal();
    return currentError !== null && 
           currentError.isRetryable && 
           this.retryCountSignal() < this.config.maxRetries;
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: HttpErrorResponse | Error): boolean {
    if (error instanceof HttpErrorResponse) {
      // Network errors (status 0) or server errors (5xx) are retryable
      // Client errors (4xx) are not retryable
      return error.status === 0 || (error.status >= 500 && error.status < 600);
    }
    // Generic errors are retryable (could be network issues)
    return true;
  }

  /**
   * Get a user-friendly error message
   */
  private getUserFriendlyMessage(error: HttpErrorResponse | Error): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Network error. Please check your internet connection.';
      }
      if (error.status === 404) {
        return 'Resource not found.';
      }
      if (error.status === 403) {
        return 'Access denied.';
      }
      if (error.status === 401) {
        return 'Authentication required.';
      }
      if (error.status >= 500) {
        return 'Server error. Please try again later.';
      }
      return error.error?.message || error.message || 'An error occurred.';
    }
    return error.message || 'An unexpected error occurred.';
  }

  /**
   * Handle an error from a resource
   */
  handleError(error: HttpErrorResponse | Error): void {
    const isRetryable = this.isRetryableError(error);
    const message = this.getUserFriendlyMessage(error);

    this.errorSignal.set({
      error,
      message,
      retryCount: this.retryCountSignal(),
      timestamp: new Date(),
      isRetryable
    });
  }

  /**
   * Calculate delay for next retry using exponential backoff
   */
  private calculateRetryDelay(): number {
    const retryCount = this.retryCountSignal();
    const delay = this.config.initialDelay * Math.pow(this.config.backoffMultiplier, retryCount);
    return Math.min(delay, this.config.maxDelay);
  }

  /**
   * Retry the operation with exponential backoff
   */
  retry(operation: () => void): void {
    if (!this.canRetry) {
      return;
    }

    const delay = this.calculateRetryDelay();
    this.retryCountSignal.update(count => count + 1);

    // Clear any existing retry timeout
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    this.retryTimeout = setTimeout(() => {
      operation();
    }, delay);
  }

  /**
   * Reset error state
   */
  reset(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = undefined;
    }
    this.errorSignal.set(null);
    this.retryCountSignal.set(0);
  }

  /**
   * Manually set retry count (useful for testing)
   */
  setRetryCount(count: number): void {
    this.retryCountSignal.set(count);
  }
}
