import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { DocumentChat } from './document-chat';
import { RagService } from './rag.service';
import { DocumentMetadata, RagResponse } from './rag.model';

const readyDocument: DocumentMetadata = {
  id: 'doc-1',
  filename: 'test.pdf',
  contentType: 'application/pdf',
  fileSize: 1024,
  uploadDate: '2026-07-06T10:00:00Z',
  status: 'READY'
};

class MockRagService {
  uploadDocument() {
    return of(readyDocument);
  }
  getDocument() {
    return of(readyDocument);
  }
  askQuestion() {
    return of({ answer: 'Mocked answer', sources: [] });
  }
}

describe('DocumentChat', () => {
  let component: DocumentChat;
  let fixture: ComponentFixture<DocumentChat>;
  let ragService: RagService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentChat],
      providers: [
        provideZonelessChangeDetection(),
        { provide: RagService, useClass: MockRagService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentChat);
    component = fixture.componentInstance;
    ragService = TestBed.inject(RagService);
    fixture.detectChanges();
  });

  function getQuestionInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input[matInput]');
  }

  function typeQuestion(text: string): void {
    const input = getQuestionInput();
    input.value = text;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function clickSend(): void {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-label="Send"]');
    button.click();
    fixture.detectChanges();
  }

  function selectFile(name: string, type: string): void {
    const fileInput: HTMLInputElement = fixture.nativeElement.querySelector('input[type="file"]');
    const file = new File(['content'], name, { type });
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    fileInput.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function getMessageBubbles(): string[] {
    const bubbles = fixture.nativeElement.querySelectorAll('.message-bubble');
    return Array.from(bubbles as NodeListOf<HTMLElement>).map(b => b.textContent?.trim() ?? '');
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the welcome message and no document chip initially', () => {
    const bubbles = getMessageBubbles();
    expect(bubbles.length).toBe(1);
    expect(bubbles[0]).toContain('Upload a PDF document');
    expect(fixture.nativeElement.querySelector('mat-chip')).toBeNull();
  });

  it('should disable the question input until a document is ready', async () => {
    expect(getQuestionInput().disabled).toBe(true);

    selectFile('test.pdf', 'application/pdf');

    await fixture.whenStable();
    expect(getQuestionInput().disabled).toBe(false);
  });

  it('should upload a PDF and show the document chip and ready message', () => {
    vi.spyOn(ragService, 'uploadDocument').mockReturnValue(of(readyDocument));

    selectFile('test.pdf', 'application/pdf');

    expect(ragService.uploadDocument).toHaveBeenCalled();
    const chip: HTMLElement = fixture.nativeElement.querySelector('mat-chip');
    expect(chip.textContent).toContain('test.pdf');
    expect(chip.textContent).toContain('READY');

    const bubbles = getMessageBubbles();
    expect(bubbles[bubbles.length - 1]).toContain('test.pdf');
    expect(bubbles[bubbles.length - 1]).toContain('ready');
  });

  it('should reject non-PDF files', () => {
    vi.spyOn(ragService, 'uploadDocument');

    selectFile('test.txt', 'text/plain');

    expect(ragService.uploadDocument).not.toHaveBeenCalled();
    const bubbles = getMessageBubbles();
    expect(bubbles[bubbles.length - 1]).toBe('Please select a PDF file.');
  });

  it('should show an error message when the upload fails', () => {
    vi.spyOn(ragService, 'uploadDocument').mockReturnValue(
      throwError(() => new Error('Upload failed'))
    );

    selectFile('test.pdf', 'application/pdf');

    expect(fixture.nativeElement.querySelector('mat-chip')).toBeNull();
    const bubbles = getMessageBubbles();
    expect(bubbles[bubbles.length - 1]).toBe('Sorry, the document upload failed. Please try again.');
  });

  it('should disable the upload button and show a spinner while uploading', () => {
    const upload$ = new Subject<DocumentMetadata>();
    vi.spyOn(ragService, 'uploadDocument').mockReturnValue(upload$);

    selectFile('test.pdf', 'application/pdf');

    const uploadButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('button[aria-label="Upload PDF"]');
    expect(uploadButton.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeTruthy();

    upload$.next(readyDocument);
    upload$.complete();
    fixture.detectChanges();

    expect(uploadButton.disabled).toBe(false);
  });

  it('should poll the status until the document is ready', () => {
    vi.useFakeTimers();
    const processingDocument: DocumentMetadata = { ...readyDocument, status: 'PROCESSING' };
    vi.spyOn(ragService, 'uploadDocument').mockReturnValue(of(processingDocument));
    vi.spyOn(ragService, 'getDocument').mockReturnValue(of(readyDocument));

    selectFile('test.pdf', 'application/pdf');
    expect(getQuestionInput().disabled).toBe(true);

    vi.advanceTimersByTime(2100);
    fixture.detectChanges();

    expect(ragService.getDocument).toHaveBeenCalledWith('doc-1');
    const chip: HTMLElement = fixture.nativeElement.querySelector('mat-chip');
    expect(chip.textContent).toContain('READY');
    vi.useRealTimers();
  });

  it('should show an error message when document processing fails', () => {
    const errorDocument: DocumentMetadata = { ...readyDocument, status: 'ERROR' };
    vi.spyOn(ragService, 'uploadDocument').mockReturnValue(of(errorDocument));

    selectFile('test.pdf', 'application/pdf');

    expect(getQuestionInput().disabled).toBe(true);
    const bubbles = getMessageBubbles();
    expect(bubbles[bubbles.length - 1]).toContain('could not process');
  });

  it('should send a question and render the answer with sources', async () => {
    const response: RagResponse = {
      answer: 'The answer',
      sources: [{ content: 'snippet from doc', filename: 'test.pdf', metadata: {} }]
    };
    vi.spyOn(ragService, 'askQuestion').mockReturnValue(of(response));

    selectFile('test.pdf', 'application/pdf');
    typeQuestion('What is this about?');
    clickSend();

    expect(ragService.askQuestion).toHaveBeenCalledWith('What is this about?', 'doc-1');
    const bubbles = getMessageBubbles();
    expect(bubbles).toContain('What is this about?');
    expect(bubbles[bubbles.length - 1]).toContain('The answer');

    const sources: HTMLElement = fixture.nativeElement.querySelector('.sources');
    expect(sources.textContent).toContain('test.pdf');
    expect(sources.textContent).toContain('snippet from doc');
    await fixture.whenStable();
    expect(getQuestionInput().value).toBe('');
  });

  it('should not render a sources section when the answer has no sources', () => {
    vi.spyOn(ragService, 'askQuestion').mockReturnValue(
      of({ answer: 'No sources answer', sources: [] })
    );

    selectFile('test.pdf', 'application/pdf');
    typeQuestion('off-topic question');
    clickSend();

    expect(getMessageBubbles()).toContain('No sources answer');
    expect(fixture.nativeElement.querySelector('.sources')).toBeNull();
  });

  it('should show the typing indicator while waiting for the answer', () => {
    const response$ = new Subject<RagResponse>();
    vi.spyOn(ragService, 'askQuestion').mockReturnValue(response$);

    selectFile('test.pdf', 'application/pdf');
    typeQuestion('slow question');
    clickSend();

    expect(fixture.nativeElement.querySelector('.typing')).toBeTruthy();

    response$.next({ answer: 'Done', sources: [] });
    response$.complete();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.typing')).toBeNull();
  });

  it('should render an error message when asking fails', () => {
    vi.spyOn(ragService, 'askQuestion').mockReturnValue(
      throwError(() => new Error('Service error'))
    );

    selectFile('test.pdf', 'application/pdf');
    typeQuestion('failing question');
    clickSend();

    const bubbles = getMessageBubbles();
    expect(bubbles[bubbles.length - 1]).toBe('Sorry, I am unable to process your request at the moment.');
  });

  it('should sanitize HTML and script tags before sending', () => {
    vi.spyOn(ragService, 'askQuestion').mockReturnValue(
      of({ answer: 'Answer', sources: [] })
    );

    selectFile('test.pdf', 'application/pdf');
    typeQuestion('Hello <script>alert("xss")</script> world');
    clickSend();

    expect(ragService.askQuestion).toHaveBeenCalledWith('Hello  world', 'doc-1');
  });

  it('should not send a whitespace-only question', () => {
    vi.spyOn(ragService, 'askQuestion');

    selectFile('test.pdf', 'application/pdf');
    typeQuestion('   ');
    getQuestionInput().dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
    fixture.detectChanges();

    expect(ragService.askQuestion).not.toHaveBeenCalled();
  });

  it('should disable send for questions over the max length', () => {
    selectFile('test.pdf', 'application/pdf');

    expect(getQuestionInput().getAttribute('maxlength')).toBe('2000');
    typeQuestion('a'.repeat(2001));

    const button = fixture.nativeElement.querySelector('button[aria-label="Send"]');
    expect(button.disabled).toBe(true);
  });
});
