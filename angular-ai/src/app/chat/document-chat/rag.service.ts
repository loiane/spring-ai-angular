import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DocumentMetadata, RagResponse } from './rag.model';

/**
 * RAG (Retrieval-Augmented Generation) Service
 *
 * Handles document upload and document-scoped question answering.
 *
 * **Responsibilities:**
 * - Upload PDF documents for ingestion into the vector store
 * - Poll document processing status
 * - Ask questions scoped to a single uploaded document
 *
 * The backend answers questions using only the content of the uploaded
 * document and politely refuses off-topic questions.
 */
@Injectable({
  providedIn: 'root'
})
export class RagService {

  /**
   * API endpoint for RAG operations.
   *
   * @remarks
   * Public to allow test files to reference this constant with full type safety.
   */
  public readonly API = '/api/rag';

  private readonly http = inject(HttpClient);

  /**
   * Upload a PDF document for processing.
   * The returned metadata starts with status PROCESSING; poll getDocument
   * until status becomes READY or ERROR.
   */
  uploadDocument(file: File): Observable<DocumentMetadata> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<DocumentMetadata>(`${this.API}/upload`, formData);
  }

  /**
   * Get the metadata (including processing status) of an uploaded document.
   */
  getDocument(id: string): Observable<DocumentMetadata> {
    return this.http.get<DocumentMetadata>(`${this.API}/documents/${id}`);
  }

  /**
   * Ask a question scoped to a single uploaded document.
   * The answer is grounded on the document content and includes source citations.
   */
  askQuestion(question: string, documentId: string): Observable<RagResponse> {
    return this.http.post<RagResponse>(`${this.API}/ask`, { question, documentId });
  }
}
