import { FilePayload, MessagePayload, ToolCall } from "./types";

let abortControllers = new Map<string, AbortController>();

export interface StreamCallbacks {
  onReasoning:  (content: string) => void;
  onToken:      (content: string) => void;
  onToolStart:  (id: string, name: string, input: string) => void;
  onToolEnd:    (id: string, name: string, result: string) => void;
  onDone:       () => void;
  onError:      (err: string) => void;
}

export function startStream(
  sessionId: string,
  message: string,
  history: MessagePayload[],
  files: FilePayload[],
  callbacks: StreamCallbacks
) {
  const abortController = new AbortController();
  abortControllers.set(sessionId, abortController);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const hfToken    = process.env.NEXT_PUBLIC_HF_TOKEN;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (hfToken) headers["Authorization"] = `Bearer ${hfToken}`;

  let toolCallCounter = 0;

  fetch(`${backendUrl.replace(/\/$/, "")}/chat/stream`, {
    method: "POST",
    headers,
    body: JSON.stringify({ session_id: sessionId, message, history, files }),
    signal: abortController.signal,
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let currentEvent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;

            if (currentEvent === "done" || currentEvent === "cancelled") {
              callbacks.onDone();
              return;
            }

            try {
              const data = JSON.parse(dataStr);

              if (data.type === "reasoning" && data.content) {
                callbacks.onReasoning(data.content);
              } else if (data.type === "token" && data.content) {
                callbacks.onToken(data.content);
              } else if (data.type === "tool_start") {
                const id = `tool_${++toolCallCounter}`;
                callbacks.onToolStart(id, data.name || "", data.input || "");
              } else if (data.type === "tool_end") {
                const id = `tool_${toolCallCounter}`;
                callbacks.onToolEnd(id, data.name || "", data.result || "");
              } else if (data.type === "error" && data.content) {
                callbacks.onError(data.content);
              }
            } catch (e) {
              console.error("SSE parse error", e, dataStr);
            }
          }
        }
      }
      callbacks.onDone();
    })
    .catch((err) => {
      if (err.name === "AbortError") {
        callbacks.onDone();
      } else {
        callbacks.onError(err.message);
        callbacks.onDone();
      }
    });
}

export function stopStream(sessionId: string) {
  const ctrl = abortControllers.get(sessionId);
  if (ctrl) {
    ctrl.abort();
    abortControllers.delete(sessionId);
  }
}

export async function generateChatTitle(message: string): Promise<string> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const hfToken    = process.env.NEXT_PUBLIC_HF_TOKEN;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (hfToken) headers["Authorization"] = `Bearer ${hfToken}`;

  try {
    const res  = await fetch(`${backendUrl.replace(/\/$/, "")}/chat/title`, {
      method: "POST", headers,
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    return data.title || message.substring(0, 40);
  } catch {
    return message.substring(0, 40);
  }
}
