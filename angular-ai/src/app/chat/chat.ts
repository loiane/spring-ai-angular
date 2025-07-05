export interface Chat {
  id: string;
  description: string;
}

export interface ChatStartResponse {
  chatId: string;
  message: string;
  description: string;
}
