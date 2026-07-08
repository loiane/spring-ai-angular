export interface ChatResponse {
  message: string;
  isBot: boolean;
  /**
   * True while this message's content is still being streamed in.
   * Used by templates to avoid rendering partial/incomplete markdown.
   */
  streaming?: boolean;
}
