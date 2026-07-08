import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { disabled, form, FormField, maxLength } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbar } from '@angular/material/toolbar';
import { catchError, interval, of, switchMap, takeWhile } from 'rxjs';
import { LoggingService } from '../../shared/logging.service';
import { MarkdownToHtmlPipe } from '../../shared/markdown-to-html.pipe';
import { DocumentMetadata, RagChatMessage, RagResponse } from './rag.model';
import { RagService } from './rag.service';

const MAX_MESSAGE_LENGTH = 2000;
const POLL_INTERVAL_MS = 2000;

@Component({
  selector: 'app-document-chat',
  imports: [MatCardModule, MatInputModule, MatButtonModule, FormField, MatToolbar,
    MatIconModule, MatChipsModule, MatProgressSpinnerModule, MarkdownToHtmlPipe],
  templateUrl: './document-chat.html',
  styleUrl: './document-chat.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentChat {

  private readonly chatHistory = viewChild.required<ElementRef>('chatHistory');

  private readonly ragService = inject(RagService);
  private readonly logger = inject(LoggingService);

  protected readonly MAX_LENGTH = MAX_MESSAGE_LENGTH;

  protected userInput = signal('');
  protected readonly chatForm = form(this.userInput, p => {
    maxLength(p, MAX_MESSAGE_LENGTH);
    disabled(p, () => !this.isReady());
  });
  protected isLoading = signal(false);
  private isUploading = signal(false);

  protected document = signal<DocumentMetadata | null>(null);

  protected messages = signal<RagChatMessage[]>([
    { message: 'Upload a PDF document and I will answer questions about it.', isBot: true },
  ]);

  protected readonly isReady = computed(() => this.document()?.status === 'READY');
  protected readonly isProcessing = computed(() => this.isUploading() || this.document()?.status === 'PROCESSING');

  protected readonly validationError = computed(() => {
    if (this.chatForm().errors().some(error => error.kind === 'maxLength')) {
      return `Message is too long (${this.userInput().length}/${MAX_MESSAGE_LENGTH} characters)`;
    }
    return null;
  });

  protected readonly canSend = computed(() => {
    const input = this.userInput().trim();
    return input.length > 0 &&
           this.chatForm().valid() &&
           !this.isLoading() &&
           this.isReady();
  });

  private readonly autoScrollEffect = effect(() => {
    this.messages();
    setTimeout(() => this.scrollToBottom(), 0);
  });

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (file.type !== 'application/pdf') {
      this.updateMessages('Please select a PDF file.', true);
      return;
    }

    this.isUploading.set(true);
    this.ragService.uploadDocument(file)
      .pipe(
        catchError(() => {
          this.isUploading.set(false);
          this.updateMessages('Sorry, the document upload failed. Please try again.', true);
          return of(null);
        })
      )
      .subscribe(document => {
        this.isUploading.set(false);
        if (document) {
          this.document.set(document);
          if (document.status === 'PROCESSING') {
            this.pollDocumentStatus(document.id);
          } else {
            this.onDocumentStatusSettled(document);
          }
        }
      });
  }

  protected sendMessage(): void {
    if (!this.canSend()) {
      return;
    }

    const sanitizedInput = this.sanitizeInput(this.userInput().trim());

    this.updateMessages(sanitizedInput);
    this.isLoading.set(true);

    this.askQuestion(sanitizedInput);
  }

  private pollDocumentStatus(documentId: string): void {
    interval(POLL_INTERVAL_MS)
      .pipe(
        switchMap(() => this.ragService.getDocument(documentId)),
        takeWhile(document => document.status === 'PROCESSING', true),
        catchError(() => {
          this.updateMessages('Sorry, I could not check the document status. Please try uploading again.', true);
          return of(null);
        })
      )
      .subscribe(document => {
        if (document) {
          this.document.set(document);
          if (document.status !== 'PROCESSING') {
            this.onDocumentStatusSettled(document);
          }
        }
      });
  }

  private onDocumentStatusSettled(document: DocumentMetadata): void {
    if (document.status === 'READY') {
      this.updateMessages(`Your document **${document.filename}** is ready! Ask me anything about it.`, true);
    } else if (document.status === 'ERROR') {
      this.updateMessages(`Sorry, I could not process **${document.filename}**. Please try another PDF.`, true);
    }
  }

  private askQuestion(question: string): void {
    const documentId = this.document()?.id;
    if (!documentId) {
      return;
    }
    this.ragService.askQuestion(question, documentId)
      .pipe(
        catchError(() => {
          this.updateMessages('Sorry, I am unable to process your request at the moment.', true);
          this.isLoading.set(false);
          return of();
        })
      )
      .subscribe((response: RagResponse) => {
        if (response) {
          this.messages.update(messages =>
            [...messages, { message: response.answer, isBot: true, sources: response.sources }]);
        }
        this.userInput.set('');
        this.isLoading.set(false);
      });
  }

  private sanitizeInput(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  private updateMessages(message: string, isBot = false): void {
    this.messages.update(messages => [...messages, { message, isBot }]);
  }

  private scrollToBottom(): void {
    try {
      const chatElement = this.chatHistory();
      if (chatElement?.nativeElement) {
        chatElement.nativeElement.scrollTop = chatElement.nativeElement.scrollHeight;
      }
    } catch (err) {
      this.logger.error('Failed to scroll chat history', err);
    }
  }
}
