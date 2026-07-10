import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbar } from '@angular/material/toolbar';
import { catchError, of } from 'rxjs';
import { LoggingService } from '../shared/logging.service';
import { Book } from './book-cover.model';
import { BookCoverService } from './book-cover.service';

const SUPPORTED_TYPES = ['image/png', 'image/jpeg'];

@Component({
  selector: 'app-book-cover-identifier',
  imports: [MatCardModule, MatButtonModule, MatToolbar, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './book-cover-identifier.html',
  styleUrl: './book-cover-identifier.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookCoverIdentifier {

  private readonly bookCoverService = inject(BookCoverService);
  private readonly logger = inject(LoggingService);

  protected previewUrl = signal<string | null>(null);
  protected isLoading = signal(false);
  protected result = signal<Book | null>(null);
  protected errorMessage = signal<string | null>(null);

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }

    if (!SUPPORTED_TYPES.includes(file.type)) {
      this.errorMessage.set('Please select a PNG or JPEG image.');
      return;
    }

    this.errorMessage.set(null);
    this.result.set(null);
    this.previewUrl.set(URL.createObjectURL(file));
    this.isLoading.set(true);

    this.bookCoverService.identifyCover(file)
      .pipe(
        catchError(() => {
          this.errorMessage.set('Sorry, I could not identify this book cover. Please try another image.');
          return of(null);
        })
      )
      .subscribe(book => {
        this.isLoading.set(false);
        if (book) {
          this.result.set(book);
        }
      });
  }
}
