import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ResourceError } from './resource-error-handler';

@Component({
  selector: 'app-resource-error',
  imports: [MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './resource-error.html',
  styleUrl: './resource-error.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResourceErrorComponent {
  /**
   * The error to display
   */
  error = input.required<ResourceError | null>();

  /**
   * Current retry count
   */
  retryCount = input<number>(0);

  /**
   * Maximum retry attempts allowed
   */
  maxRetries = input<number>(3);

  /**
   * Whether retry is currently in progress
   */
  retrying = input<boolean>(false);

  /**
   * Custom error title (optional)
   */
  title = input<string>('Error Loading Data');

  /**
   * Whether to show retry button
   */
  showRetry = input<boolean>(true);

  /**
   * Event emitted when user clicks retry button
   */
  retry = output<void>();

  /**
   * Check if retry is available
   */
  get canRetry(): boolean {
    const err = this.error();
    return err !== null &&
           err.isRetryable &&
           this.retryCount() < this.maxRetries() &&
           !this.retrying();
  }

  /**
   * Handle retry button click
   */
  onRetry(): void {
    if (this.canRetry) {
      this.retry.emit();
    }
  }
}
