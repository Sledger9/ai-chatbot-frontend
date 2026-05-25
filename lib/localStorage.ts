import { ChatSession, MessagePayload } from "./types";

const STORAGE_KEY = "claude_clone_sessions";

export function loadSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse sessions from localStorage", e);
      return [];
    }
  }
  return [];
}

export function saveSessions(sessions: ChatSession[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function createSession(): ChatSession {
  const newSession: ChatSession = {
    id: "session_" + Math.random().toString(36).substring(2, 9),
    title: "New Chat",
    createdAt: new Date().toISOString(),
    messages: []
  };
  const sessions = loadSessions();
  sessions.unshift(newSession);
  saveSessions(sessions);
  return newSession;
}

export function getSession(id: string): ChatSession | undefined {
  const sessions = loadSessions();
  return sessions.find(s => s.id === id);
}

export function updateSessionMessages(id: string, messages: MessagePayload[]) {
  const sessions = loadSessions();
  const index = sessions.findIndex(s => s.id === id);
  if (index !== -1) {
    sessions[index].messages = messages;
    saveSessions(sessions);
  }
}

export function updateSessionTitle(id: string, title: string) {
  const sessions = loadSessions();
  const index = sessions.findIndex(s => s.id === id);
  if (index !== -1) {
    sessions[index].title = title;
    saveSessions(sessions);
  }
}

export function deleteSession(id: string) {
  let sessions = loadSessions();
  sessions = sessions.filter(s => s.id !== id);
  saveSessions(sessions);
}
