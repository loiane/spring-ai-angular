export interface ChatMessage {
  content: string;
  type: ChatType;
}

export enum ChatType {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT'
}
