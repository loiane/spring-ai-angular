import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { RagService } from './rag.service';
import { DocumentMetadata, RagResponse } from './rag.model';

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

  describe('listDocuments', () => {
    it('should list all documents', () => {
      const documents = [mockDocument, { ...mockDocument, id: 'doc-2', status: 'READY' as const }];

      service.listDocuments().subscribe(response => {
        expect(response).toEqual(documents);
      });

      const req = httpMock.expectOne(`${service.API}/documents`);
      expect(req.request.method).toBe('GET');
      req.flush(documents);
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document by id', () => {
      let completed = false;
      service.deleteDocument('doc-1').subscribe({ complete: () => completed = true });

      const req = httpMock.expectOne(`${service.API}/documents/doc-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      expect(completed).toBe(true);
    });

    it('should handle delete errors', () => {
      service.deleteDocument('doc-1').subscribe({
        next: () => expect.unreachable('should have failed with an error'),
        error: (error) => expect(error.status).toBe(404)
      });

      const req = httpMock.expectOne(`${service.API}/documents/doc-1`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
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
    it('should POST to the stream endpoint and emit answer deltas followed by sources', () => {
      const events: unknown[] = [];
      let completed = false;
      service.askQuestionStream('What is this about?', 'doc-1').subscribe({
        next: event => events.push(event),
        complete: () => completed = true
      });

      const req = httpMock.expectOne(`${service.API}/ask/stream`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ question: 'What is this about?', documentId: 'doc-1' });
      // Real wire format: raw unquoted answer deltas, no padding after "data:"
      req.flush('event:answer\ndata:The \n\n'
        + 'event:answer\ndata:answer\n\n'
        + 'event:sources\ndata:[{"content":"snippet","filename":"test.pdf","metadata":{}}]\n\n');

      expect(events).toEqual([
        { type: 'answer', content: 'The ' },
        { type: 'answer', content: 'answer' },
        { type: 'sources', sources: [{ content: 'snippet', filename: 'test.pdf', metadata: {} }] }
      ]);
      expect(completed).toBe(true);
    });
  });
});
