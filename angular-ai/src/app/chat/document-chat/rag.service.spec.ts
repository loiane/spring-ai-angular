import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { RagService } from './rag.service';
import { DocumentMetadata, RagResponse } from './rag.model';

function sseResponse(body: string, status = 200): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(body));
      controller.close();
    }
  });
  return new Response(stream, { status, headers: { 'Content-Type': 'text/event-stream' } });
}

describe('RagService', () => {
  let service: RagService;
  let httpMock: HttpTestingController;

  const mockDocument: DocumentMetadata = {
    id: 'doc-1',
    filename: 'test.pdf',
    contentType: 'application/pdf',
    fileSize: 1024,
    uploadDate: '2026-07-06T10:00:00Z',
    status: 'PROCESSING'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        RagService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(RagService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('uploadDocument', () => {
    it('should upload a file as multipart form data', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      service.uploadDocument(file).subscribe(response => {
        expect(response).toEqual(mockDocument);
      });

      const req = httpMock.expectOne(`${service.API}/upload`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      expect((req.request.body as FormData).get('file')).toBe(file);
      req.flush(mockDocument);
    });

    it('should handle upload errors', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      service.uploadDocument(file).subscribe({
        next: () => expect.unreachable('should have failed with an error'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${service.API}/upload`);
      req.flush('Upload failed', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getDocument', () => {
    it('should get document metadata by id', () => {
      service.getDocument('doc-1').subscribe(response => {
        expect(response).toEqual(mockDocument);
      });

      const req = httpMock.expectOne(`${service.API}/documents/doc-1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDocument);
    });
  });

  describe('askQuestion', () => {
    it('should send question and documentId and return the rag response', () => {
      const mockResponse: RagResponse = {
        answer: 'The document is about Spring AI.',
        sources: [{ content: 'snippet', filename: 'test.pdf', metadata: {} }]
      };

      service.askQuestion('What is this about?', 'doc-1').subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${service.API}/ask`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ question: 'What is this about?', documentId: 'doc-1' });
      req.flush(mockResponse);
    });

    it('should handle HTTP errors', () => {
      service.askQuestion('question', 'doc-1').subscribe({
        next: () => expect.unreachable('should have failed with an error'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${service.API}/ask`);
      req.flush('Something went wrong', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('askQuestionStream', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    afterEach(() => {
      fetchSpy?.mockRestore();
    });

    it('should POST to the stream endpoint and emit answer deltas followed by sources', async () => {
      const body = 'event: answer\ndata: "The "\n\n'
        + 'event: answer\ndata: "answer"\n\n'
        + 'event: sources\ndata: [{"content":"snippet","filename":"test.pdf","metadata":{}}]\n\n';
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(sseResponse(body));

      const events: unknown[] = [];
      await new Promise<void>((resolve, reject) => {
        service.askQuestionStream('What is this about?', 'doc-1').subscribe({
          next: event => events.push(event),
          error: reject,
          complete: resolve
        });
      });

      expect(events).toEqual([
        { type: 'answer', content: 'The ' },
        { type: 'answer', content: 'answer' },
        { type: 'sources', sources: [{ content: 'snippet', filename: 'test.pdf', metadata: {} }] }
      ]);
      expect(fetchSpy).toHaveBeenCalledWith(`${service.API}/ask/stream`, expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ question: 'What is this about?', documentId: 'doc-1' })
      }));
    });
  });
});
