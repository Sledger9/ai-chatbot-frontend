import { FilePayload, MessagePayload } from "./types";

let abortController: AbortController | null = null;

export interface StreamCallbacks {
  onReasoning: (content: string) => void;
  onToken: (content: string) => void;
  onToolCall: (name: string, input: string) => void;
  onToolResult: (name: string, result: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}

export function startStream(
  sessionId: string,
  message: string,
  history: MessagePayload[],
  files: FilePayload[],
  callbacks: StreamCallbacks
) {
  abortController = new AbortController();

  const payload = {
    session_id: sessionId,
    message,
    history,
    files
  };

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  fetch(`${backendUrl}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    signal: abortController.signal
  }).then(async (res) => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const reader = res.body?.getReader();
    if (!reader) throw new Error("No reader from response body");
    
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || "";
      
      let currentEvent = "";
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.substring("event: ".length).trim();
        } else if (line.startsWith("data: ")) {
          const dataStr = line.substring("data: ".length).trim();
          if (!dataStr) continue;
          
          if (currentEvent === "cancelled") {
            callbacks.onDone();
            return;
          }
          if (currentEvent === "done") {
            callbacks.onDone();
            return;
          }
          
          try {
            const data = JSON.parse(dataStr);
            if (data.type === "reasoning" && data.content) {
              callbacks.onReasoning(data.content);
            } else if (data.type === "token" && data.content) {
              callbacks.onToken(data.content);
            } else if (data.type === "tool_call" && data.name) {
              callbacks.onToolCall(data.name, data.input || "");
            } else if (data.type === "tool_result" && data.name) {
              callbacks.onToolResult(data.name, data.result || "");
            } else if (data.type === "error" && data.content) {
              callbacks.onError(data.content);
            }
          } catch (e) {
            console.error("Error parsing SSE data", e, dataStr);
          }
        }
      }
    }
    callbacks.onDone();
  }).catch((err) => {
    if (err.name === "AbortError") {
      callbacks.onDone(); // Treat cancellation as done so UI updates gracefully
    } else {
      callbacks.onError(err.message);
      callbacks.onDone();
    }
  });
}

export function stopStream() {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
}

export async function generateChatTitle(message: string): Promise<string> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${backendUrl}/chat/title`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    const data = await res.json();
    return data.title || message.substring(0, 30);
  } catch (e) {
    return message.substring(0, 30);
  }
}
