export type DocumentStatus = 'PROCESSING' | 'READY' | 'ERROR';

export interface DocumentMetadata {
  id: string;
  filename: string;
  contentType: string;
  fileSize: number;
  uploadDate: string;
  status: DocumentStatus;
  errorMessage?: string;
}

export interface Source {
  content: string;
  filename: string;
  metadata: Record<string, unknown>;
}

export interface RagResponse {
  answer: string;
  sources: Source[];
}

export interface RagChatMessage {
  message: string;
  isBot: boolean;
  sources?: Source[];
  /**
   * True while this message's content is still being streamed in.
   * Used by templates to avoid rendering partial/incomplete markdown.
   */
  streaming?: boolean;
}

/**
 * A single event emitted while streaming a RAG answer.
 *
 * - `answer` events carry an incremental text chunk (delta) of the answer.
 * - `sources` event is emitted once, after the answer is complete, carrying
 *   the source citations used to generate it.
 */
export type RagStreamEvent =
  | { type: 'answer'; content: string }
  | { type: 'sources'; sources: Source[] };

