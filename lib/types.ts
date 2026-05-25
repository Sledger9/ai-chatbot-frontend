export type Role = "user" | "assistant" | "system";

export interface MessagePayload {
  role: Role;
  content: string;
  reasoning?: string;
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
  messages: MessagePayload[];
}

export interface ChatState {
  sessions: ChatSession[];
}

export interface StreamEvent {
  type: "reasoning" | "token" | "tool_call" | "tool_result" | "done" | "cancelled" | "error";
  content?: string;
  name?: string;
  input?: string;
  result?: string;
}
