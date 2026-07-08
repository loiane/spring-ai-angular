export interface ConciergeMessage {
  content: string;
  type: MessageType;
  timestamp: Date;
  /**
   * True while this message's content is still being streamed in.
   * Used by templates to avoid rendering partial/incomplete markdown.
   */
  streaming?: boolean;
}

export enum MessageType {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT'
}

export interface ConciergeResponse {
  content: string;
  requiresAction?: boolean;
  actions?: string[];
}
