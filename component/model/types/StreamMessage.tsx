export type FileInfo = {
  id: string;
  title: string;
  url: string;
  filePath: string;
  category?: string;
};

export type DocumentMatch = {
  id: string;
  title: string;
  key: string;
  description: string;
  documentNumber: string;
  url: string;
  category?: string;
};

export enum StreamMessageType {
  Token = "token",
  Error = "error",
  Connected = "connected",
  Done = "done",
  ToolStart = "tool_start",
  ToolEnd = "tool_end",
  MLDocuments = "tool_end", // Added new message type for ML documents
}

export interface BaseStreamMessage {
  type: StreamMessageType;
}

export interface TokenMessage extends BaseStreamMessage {
  type: StreamMessageType.Token;
  token: string;
}

export interface ErrorMessage extends BaseStreamMessage {
  type: StreamMessageType.Error;
  error: string;
}

export interface ConnectedMessage extends BaseStreamMessage {
  type: StreamMessageType.Connected;
}

export interface DoneMessage extends BaseStreamMessage {
  type: StreamMessageType.Done;
}

export interface ToolStartMessage extends BaseStreamMessage {
  type: StreamMessageType.ToolStart;
  tool: string;
  input: unknown;
  fileInfo?: FileInfo[];
}

export interface ToolEndMessage extends BaseStreamMessage {
  type: StreamMessageType.ToolEnd;
  tool: string;
  input: unknown;
  fileInfo?: FileInfo[];
  output: unknown; // ✅ Add this line
}

// ML Documents message
export interface MLDocumentsStreamMessage extends BaseStreamMessage {
  type: StreamMessageType.MLDocuments;
  fileInfo?: FileInfo[];
  matches: DocumentMatch[]; // Add the matches property
}

export type StreamMessage =
  | TokenMessage
  | ErrorMessage
  | ConnectedMessage
  | DoneMessage
  | ToolStartMessage
  | ToolEndMessage
  | MLDocumentsStreamMessage; // Added to union type
