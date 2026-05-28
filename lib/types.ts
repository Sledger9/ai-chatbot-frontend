export type Role = "user" | "assistant" | "system";

export interface ToolCall {
  id: string;
  name: string;
  input: string;
  result?: string;
  status: "running" | "done" | "error";
  startedAt: number;
  endedAt?: number;
}

export interface MessagePayload {
  role: Role;
  content: string;
  reasoning?: string;
  toolCalls?: ToolCall[];
  imageUrls?: string[];   // base64 data URLs for inline images
}

export interface FilePayload {
  name: string;
  type: string;
  base64: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
  messages: MessagePayload[];
}

export interface ChatState {
  sessions: ChatSession[];
}

export interface StreamEvent {
  type: "reasoning" | "token" | "tool_start" | "tool_end" | "done" | "cancelled" | "error";
  content?: string;
  name?: string;
  input?: string;
  result?: string;
}
