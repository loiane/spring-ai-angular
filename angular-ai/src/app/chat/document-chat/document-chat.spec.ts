import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { DocumentChat } from './document-chat';
import { RagService } from './rag.service';
import { DocumentMetadata } from './rag.model';

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
  // Accessor for protected/private members in tests
  let c: any;
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
    c = component;
    ragService = TestBed.inject(RagService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with welcome message and no document', () => {
    expect(c.messages().length).toBe(1);
    expect(c.messages()[0].isBot).toBe(true);
    expect(c.document()).toBeNull();
    expect(c.isReady()).toBe(false);
  });

  it('should not allow sending before a document is ready', () => {
    c.userInput.set('a question');
    expect(c.canSend()).toBe(false);
  });

  it('should allow sending when a document is ready', () => {
    c.document.set(readyDocument);
    c.userInput.set('a question');
    expect(c.canSend()).toBe(true);
  });

  it('should not send when loading', () => {
    c.document.set(readyDocument);
    c.userInput.set('a question');
    c.isLoading.set(true);
    expect(c.canSend()).toBe(false);
  });

  it('should send question and append bot answer with sources', () => {
    const sources = [{ content: 'snippet', filename: 'test.pdf', metadata: {} }];
    vi.spyOn(ragService, 'askQuestion').mockReturnValue(
      of({ answer: 'The answer', sources })
    );

    c.document.set(readyDocument);
    c.userInput.set('What is this about?');
    c.sendMessage();

    expect(ragService.askQuestion).toHaveBeenCalledWith('What is this about?', 'doc-1');
    const lastMessage = c.messages()[c.messages().length - 1];
    expect(lastMessage.message).toBe('The answer');
    expect(lastMessage.isBot).toBe(true);
    expect(lastMessage.sources).toEqual(sources);
    expect(c.userInput()).toBe('');
    expect(c.isLoading()).toBe(false);
  });

  it('should handle ask question errors', () => {
    vi.spyOn(ragService, 'askQuestion').mockReturnValue(
      throwError(() => new Error('Service error'))
    );

    c.document.set(readyDocument);
    c.userInput.set('question');
    c.sendMessage();

    const lastMessage = c.messages()[c.messages().length - 1];
    expect(lastMessage.message).toBe('Sorry, I am unable to process your request at the moment.');
    expect(lastMessage.isBot).toBe(true);
    expect(c.isLoading()).toBe(false);
  });

  it('should upload a PDF file and set document when ready', () => {
    vi.spyOn(ragService, 'uploadDocument').mockReturnValue(of(readyDocument));

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const event = {
      target: { files: [file], value: '' }
    } as unknown as Event;

    c.onFileSelected(event);

    expect(ragService.uploadDocument).toHaveBeenCalledWith(file);
    expect(c.document()).toEqual(readyDocument);
    expect(c.isReady()).toBe(true);
    const lastMessage = c.messages()[c.messages().length - 1];
    expect(lastMessage.message).toContain('test.pdf');
  });

  it('should reject non-PDF files', () => {
    vi.spyOn(ragService, 'uploadDocument');

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const event = {
      target: { files: [file], value: '' }
    } as unknown as Event;

    c.onFileSelected(event);

    expect(ragService.uploadDocument).not.toHaveBeenCalled();
    const lastMessage = c.messages()[c.messages().length - 1];
    expect(lastMessage.message).toBe('Please select a PDF file.');
  });

  it('should handle upload errors', () => {
    vi.spyOn(ragService, 'uploadDocument').mockReturnValue(
      throwError(() => new Error('Upload failed'))
    );

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const event = {
      target: { files: [file], value: '' }
    } as unknown as Event;

    c.onFileSelected(event);

    expect(c.document()).toBeNull();
    expect(c.isUploading()).toBe(false);
    const lastMessage = c.messages()[c.messages().length - 1];
    expect(lastMessage.message).toBe('Sorry, the document upload failed. Please try again.');
  });

  it('should poll status when uploaded document is processing', () => {
    vi.useFakeTimers();
    const processingDocument: DocumentMetadata = { ...readyDocument, status: 'PROCESSING' };
    vi.spyOn(ragService, 'uploadDocument').mockReturnValue(of(processingDocument));
    vi.spyOn(ragService, 'getDocument').mockReturnValue(of(readyDocument));

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const event = {
      target: { files: [file], value: '' }
    } as unknown as Event;

    c.onFileSelected(event);
    expect(c.isReady()).toBe(false);

    vi.advanceTimersByTime(2100);

    expect(ragService.getDocument).toHaveBeenCalledWith('doc-1');
    expect(c.isReady()).toBe(true);
    vi.useRealTimers();
  });

  it('should show error message when document processing fails', () => {
    const errorDocument: DocumentMetadata = { ...readyDocument, status: 'ERROR' };
    vi.spyOn(ragService, 'uploadDocument').mockReturnValue(of(errorDocument));

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const event = {
      target: { files: [file], value: '' }
    } as unknown as Event;

    c.onFileSelected(event);

    expect(c.isReady()).toBe(false);
    const lastMessage = c.messages()[c.messages().length - 1];
    expect(lastMessage.message).toContain('could not process');
  });

  it('should sanitize input before sending', () => {
    vi.spyOn(ragService, 'askQuestion').mockReturnValue(
      of({ answer: 'Answer', sources: [] })
    );

    c.document.set(readyDocument);
    c.userInput.set('Hello <script>alert("xss")</script> world');
    c.sendMessage();

    expect(ragService.askQuestion).toHaveBeenCalledWith('Hello  world', 'doc-1');
  });

  it('should not send empty message', () => {
    vi.spyOn(ragService, 'askQuestion');
    c.document.set(readyDocument);
    c.userInput.set('   ');
    c.sendMessage();
    expect(ragService.askQuestion).not.toHaveBeenCalled();
  });
});
