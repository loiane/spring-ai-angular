import { Injectable } from '@angular/core';

/**
 * Logging service with environment-based configuration
 * In production, logs can be disabled or sent to a monitoring service
 */
@Injectable({
  providedIn: 'root'
})
export class LoggingService {

  // Enable logging in development mode
  // Replace with environment.production check when environment files are added
  private readonly isDevelopment = true;

  /**
   * Logs informational messages
   */
  log(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Logs warning messages
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  /**
   * Logs error messages
   */
  error(message: string, error?: unknown): void {
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, error);
    }
    // In production, this can be extended to send errors to monitoring services
  }

  /**
   * Logs debug messages (only in development)
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
}
