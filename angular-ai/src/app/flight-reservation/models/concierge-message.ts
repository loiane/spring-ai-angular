export interface ConciergeMessage {
  content: string;
  type: MessageType;
  timestamp: Date;
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
