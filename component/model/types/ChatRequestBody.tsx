export type MessageRole = "user" | "assistant";

export interface Message {
  id?: string;
  role: MessageRole;
  content: string;
}

export interface ChatRequestBody {
  messages: Message[];
  newMessage: string;
  chatId: string;
}
