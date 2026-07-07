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
}
