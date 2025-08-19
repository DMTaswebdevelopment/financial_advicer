export type MessageRole = "user" | "assistant";

export interface Message {
  id?: string;
  role?: MessageRole;
  content: string;
}

export type PDFListType = {
  id: string;
  name: string;
  title: string;
  category: string;
  url?: string;
  keyQuestions?: string[];
  keywords?: string[];
}[];

export interface ChatRequestBody {
  messages: Message[];
  newMessage: string;
  chatId: string;
  isDocumentNumberSelected: boolean;
}
