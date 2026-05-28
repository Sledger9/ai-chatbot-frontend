"use client";
import React, { useState, useEffect } from "react";
import { ChatSidebar }  from "@/components/ChatSidebar";
import { ChatWindow }   from "@/components/ChatWindow";
import { ChatInput }    from "@/components/ChatInput";
import { FilePreview }  from "@/components/FilePreview";
import { ArtifactViewer, ArtifactData } from "@/components/ArtifactViewer";
import {
  loadSessions, createSession,
  updateSessionMessages, updateSessionTitle, deleteSession
} from "@/lib/localStorage";
import { ChatSession, MessagePayload, FilePayload, ToolCall } from "@/lib/types";
import { startStream, stopStream, generateChatTitle } from "@/lib/streamChat";

export default function Home() {
  const [sessions,         setSessions]         = useState<ChatSession[]>([]);
  const [activeSessionId,  setActiveSessionId]  = useState<string | null>(null);
  const [input,            setInput]            = useState("");
  const [streamingSet,     setStreamingSet]     = useState<Set<string>>(new Set());
  const [sidebarOpen,      setSidebarOpen]      = useState(false);
  const [attachedFiles,    setAttachedFiles]    = useState<FilePayload[]>([]);
  const [activeArtifact,   setActiveArtifact]   = useState<ArtifactData | null>(null);

  const reload = () => setSessions(loadSessions());
  const activeSession = sessions.find(s => s.id === activeSessionId);

  const handleNewChat = () => {
    const s = createSession();
    reload();
    setActiveSessionId(s.id);
    if (typeof window !== "undefined" && window.innerWidth < 768) setSidebarOpen(false);
  };

  // Load sessions on mount
  useEffect(() => {
    const loaded = loadSessions();
    if (loaded.length > 0) {
      setTimeout(() => {
        setSessions(loaded);
        setActiveSessionId(loaded[0].id);
      }, 0);
    } else {
      setTimeout(() => {
        handleNewChat();
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleDeleteSession = (id: string) => {
    deleteSession(id);
    const updated = loadSessions();
    setSessions(updated);
    if (activeSessionId === id) {
      if (updated.length > 0) setActiveSessionId(updated[0].id);
      else handleNewChat();
    }
    // Also delete on server
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://sledger99-ai-chatbot-backend.hf.space";
    fetch(`${backendUrl}/sessions/${id}`, { method: "DELETE" }).catch(() => {});
  };

  const handleSend = () => {
    if (!input.trim() || !activeSessionId || streamingSet.has(activeSessionId)) return;

    const userMsg: MessagePayload = {
      role: "user",
      content: input,
      imageUrls: attachedFiles.filter(f => f.type.startsWith("image/")).map(f => `data:${f.type};base64,${f.base64}`)
    };

    const currentMessages = [...(activeSession?.messages || [])];
    const newHistory      = [...currentMessages, userMsg];
    updateSessionMessages(activeSessionId, newHistory);

    // Auto-title on first message
    if (currentMessages.length === 0) {
      generateChatTitle(input).then(title => {
        updateSessionTitle(activeSessionId, title);
        reload();
      });
    }

    // Placeholder assistant message
    const assistantPlaceholder: MessagePayload = {
      role: "assistant",
      content: "",
      reasoning: "",
      toolCalls: []
    };
    const withPlaceholder = [...newHistory, assistantPlaceholder];
    updateSessionMessages(activeSessionId, withPlaceholder);
    reload();

    setInput("");
    const filesToSubmit = [...attachedFiles];
    setAttachedFiles([]);
    setStreamingSet(prev => new Set(prev).add(activeSessionId));

    let assistantContent  = "";
    let assistantReasoning = "";
    const toolCallsMap    = new Map<string, ToolCall>();

    const updateMsg = () => {
      const msgs = [...withPlaceholder];
      msgs[msgs.length - 1] = {
        role: "assistant",
        content: assistantContent,
        reasoning: assistantReasoning,
        toolCalls: Array.from(toolCallsMap.values())
      };
      updateSessionMessages(activeSessionId!, msgs);
      reload();
    };

    startStream(
      activeSessionId,
      input,
      currentMessages,
      filesToSubmit,
      {
        onReasoning: (chunk) => { assistantReasoning += chunk; updateMsg(); },
        onToken:     (chunk) => {
          // Strip any residual leaked tool call tokens
          let safe = chunk;
          safe = safe.replace(/<\|[^|]+\|>/g, "");
          safe = safe.replace(/<tool_call>[\s\S]*?<\/tool_call>/g, "");
          assistantContent += safe;
          updateMsg();
        },
        onToolStart: (id, name, toolInput) => {
          toolCallsMap.set(id, {
            id, name,
            input: toolInput,
            status: "running",
            startedAt: Date.now()
          });
          updateMsg();
        },
        onToolEnd: (id, name, result) => {
          const existing = toolCallsMap.get(id) || { id, name, input: "", status: "running" as const, startedAt: Date.now() };
          toolCallsMap.set(id, {
            ...existing,
            result,
            status: "done",
            endedAt: Date.now()
          });
          // Append download link if zip
          if (name === "zip_and_expose" && result?.startsWith("/downloads")) {
            const filename = result.split("/").pop() || "project.zip";
            assistantContent += `\n\n<download url="${result}" filename="${filename}"></download>\n\n`;
          }
          updateMsg();
        },
        onDone: () => {
          setStreamingSet(prev => { const n = new Set(prev); n.delete(activeSessionId!); return n; });
        },
        onError: (err) => {
          assistantContent += `\n\n**Error:** ${err}`;
          updateMsg();
        }
      }
    );
  };

  const handleStop = () => {
    if (activeSessionId) stopStream(activeSessionId);
    setStreamingSet(prev => { const n = new Set(prev); n.delete(activeSessionId!); return n; });
  };

  const handleRetry = () => {
    if (!activeSession || activeSession.messages.length < 2) return;
    // Find last user message and re-send it
    const msgs = [...activeSession.messages];
    const lastUser = [...msgs].reverse().find(m => m.role === "user");
    if (!lastUser) return;
    // Remove last assistant message
    const trimmed = msgs.slice(0, msgs.findLastIndex((m: MessagePayload) => m.role === "user"));
    updateSessionMessages(activeSessionId!, trimmed);
    reload();
    setInput(lastUser.content);
    setTimeout(handleSend, 50);
  };

  const isCurrentSessionStreaming = activeSessionId ? streamingSet.has(activeSessionId) : false;

  return (
    <main className="flex h-screen bg-[#0d0d0d] text-white overflow-hidden">
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-row relative h-full overflow-hidden">
        {/* Chat column */}
        <div className={`flex-1 flex flex-col relative h-full transition-all duration-300 ${activeArtifact ? "hidden md:flex" : "flex"}`}>
          {activeSession ? (
            <ChatWindow
              messages={activeSession.messages}
              isStreaming={isCurrentSessionStreaming}
              onOpenArtifact={setActiveArtifact}
              onRetry={handleRetry}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-600 text-sm">
              Start a new conversation
            </div>
          )}

          {/* Input area */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/95 to-transparent pt-12 pb-6 px-4">
            <div className="max-w-3xl mx-auto flex flex-col gap-2">
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 px-1">
                  {attachedFiles.map((file, i) => (
                    <FilePreview
                      key={i}
                      file={file}
                      onRemove={() => setAttachedFiles(attachedFiles.filter((_, idx) => idx !== i))}
                    />
                  ))}
                </div>
              )}
              <ChatInput
                input={input}
                setInput={setInput}
                onSend={handleSend}
                onStop={handleStop}
                isStreaming={isCurrentSessionStreaming}
                onFileSelect={f => setAttachedFiles(prev => [...prev, f])}
              />
              <p className="text-center text-[10px] text-neutral-700">
                AI can make mistakes. Verify important information.
              </p>
            </div>
          </div>
        </div>

        {/* Artifact panel */}
        {activeArtifact && (
          <div className="w-full md:w-1/2 h-full flex-shrink-0 border-l border-neutral-800">
            <ArtifactViewer artifact={activeArtifact} onClose={() => setActiveArtifact(null)} />
          </div>
        )}
      </div>
    </main>
  );
}
