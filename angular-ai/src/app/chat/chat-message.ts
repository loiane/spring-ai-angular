export interface ChatMessage {
  content: string;
  type: ChatType;
  /**
   * True while this message's content is still being streamed in.
   * Used by templates to avoid rendering partial/incomplete markdown.
   */
  streaming?: boolean;
}

export enum ChatType {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT'
}
