"use client";

import React, { useState, useEffect } from "react";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatWindow } from "@/components/ChatWindow";
import { ChatInput } from "@/components/ChatInput";
import { FilePreview } from "@/components/FilePreview";
import { ArtifactViewer, ArtifactData } from "@/components/ArtifactViewer";
import { loadSessions, createSession, getSession, updateSessionMessages, updateSessionTitle, deleteSession } from "@/lib/localStorage";
import { ChatSession, MessagePayload, FilePayload } from "@/lib/types";
import { startStream, stopStream, generateChatTitle } from "@/lib/streamChat";

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [streamingSessions, setStreamingSessions] = useState<Set<string>>(new Set());
  const [activeTool, setActiveTool] = useState<{name: string, input: string} | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<FilePayload[]>([]);
  const [activeArtifact, setActiveArtifact] = useState<ArtifactData | null>(null);

  useEffect(() => {
    const loaded = loadSessions();
    if (loaded.length > 0) {
      setSessions(loaded);
      setActiveSessionId(loaded[0].id);
    } else {
      handleNewChat();
    }
  }, []);

  const handleNewChat = () => {
    const newSession = createSession();
    setSessions(loadSessions());
    setActiveSessionId(newSession.id);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleDeleteSession = (id: string) => {
    deleteSession(id);
    const updated = loadSessions();
    setSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated.length > 0 ? updated[0].id : null);
    }
    if (updated.length === 0) handleNewChat();
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const handleSend = () => {
    if (!input.trim() || !activeSessionId) return;

    const userMessage: MessagePayload = { role: "user", content: input };
    const currentMessages = [...(activeSession?.messages || [])];
    const newHistory = [...currentMessages, userMessage];

    updateSessionMessages(activeSessionId, newHistory);
    setSessions(loadSessions());
    setInput("");
    
    // Auto title gen if it's the first message
    if (currentMessages.length === 0) {
      generateChatTitle(input).then(title => {
        updateSessionTitle(activeSessionId, title);
        setSessions(loadSessions());
      });
    }

    // Add empty assistant message to stream into
    newHistory.push({ role: "assistant", content: "", reasoning: "" });
    updateSessionMessages(activeSessionId, newHistory);
    setSessions(loadSessions());

    setStreamingSessions(prev => new Set(prev).add(activeSessionId));
    setActiveTool(null);
    const filesToSubmit = [...attachedFiles];
    setAttachedFiles([]);

    let assistantContent = "";
    let assistantReasoning = "";

    startStream(
      activeSessionId,
      input,
      currentMessages,
      filesToSubmit,
      {
        onReasoning: (content) => {
          assistantReasoning += content;
          updateAssistantMsg();
        },
        onToken: (content) => {
          assistantContent += content;
          
          let displayContent = assistantContent;
          // Filter out LangChain ReAct agent's internal thought/answer prefixes
          displayContent = displayContent.replace(/Final Answer:\s*/g, "");
          if (displayContent.includes("Thought: ")) {
             displayContent = displayContent.replace(/Thought:.*?(?=\n|$)/g, "");
          }
          
          // Filter out Nemotron's leaked <tool_call> XML tags!
          // Remove complete tool calls
          displayContent = displayContent.replace(/<tool_call>[\s\S]*?<\/tool_call>/g, "");
          // Hide incomplete tool calls that are currently streaming
          displayContent = displayContent.replace(/<tool_call>[\s\S]*$/g, "");
          
          updateAssistantMsg(displayContent);
        },
        onToolCall: (name, input) => {
          setActiveTool({ name, input });
        },
        onToolResult: (name, result) => {
          setActiveTool(null);
          if (name === "zip_and_expose") {
            try {
              // result is expected to be a string representing the relative URL path
              const url = result.trim();
              if (url.startsWith("/downloads")) {
                const filename = url.split('/').pop() || "project.zip";
                assistantContent += `\n\n<download url="${url}" filename="${filename}"></download>\n\n`;
                updateAssistantMsg();
              }
            } catch (e) {
              console.error("Error parsing zip_and_expose result", e);
            }
          }
        },
        onDone: () => {
          setStreamingSessions(prev => {
            const next = new Set(prev);
            next.delete(activeSessionId);
            return next;
          });
          setActiveTool(null);
        },
        onError: (err) => {
          console.error("Stream error:", err);
          assistantContent += `\n\n**Error:** ${err}`;
          updateAssistantMsg();
        }
      }
    );

    function updateAssistantMsg(displayContent?: string) {
      let finalContent = displayContent !== undefined ? displayContent : assistantContent;
      
      // Filter out LangChain ReAct agent's internal thought/answer prefixes
      finalContent = finalContent.replace(/Final Answer:\s*/g, "");
      if (finalContent.includes("Thought: ")) {
         finalContent = finalContent.replace(/Thought:.*?(?=\n|$)/g, "");
      }
      
      // Filter out Nemotron's leaked <tool_call> XML tags!
      finalContent = finalContent.replace(/<tool_call>[\s\S]*?<\/tool_call>/g, "");
      finalContent = finalContent.replace(/<tool_call>[\s\S]*$/g, "");

      const messages = [...newHistory];
      messages[messages.length - 1] = {
        role: "assistant",
        content: finalContent,
        reasoning: assistantReasoning
      };
      updateSessionMessages(activeSessionId!, messages);
      setSessions(loadSessions());
    }
  };

  const handleStop = () => {
    if (activeSessionId) {
      stopStream(activeSessionId);
      setStreamingSessions(prev => {
        const next = new Set(prev);
        next.delete(activeSessionId);
        return next;
      });
    }
    setActiveTool(null);
  };

  const isCurrentSessionStreaming = activeSessionId ? streamingSessions.has(activeSessionId) : false;

  return (
    <main className="flex h-screen bg-[#121212] text-white overflow-hidden">
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
        {/* Chat Area */}
        <div className={`flex-1 flex flex-col relative h-full transition-all duration-300 ${activeArtifact ? 'hidden md:flex w-1/2' : 'w-full'}`}>
          {activeSession ? (
            <ChatWindow 
              messages={activeSession.messages} 
              activeTool={activeTool} 
              isStreaming={isCurrentSessionStreaming} 
              onOpenArtifact={setActiveArtifact}
            />
          ) : (
            <div className="flex-1" />
          )}
          
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#121212] via-[#121212] to-transparent pt-10 pb-6 px-4">
            <div className="max-w-4xl mx-auto flex flex-col gap-2">
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 px-2">
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
                onFileSelect={(f) => setAttachedFiles([...attachedFiles, f])}
              />
            </div>
          </div>
        </div>

        {/* Artifacts Area */}
        {activeArtifact && (
          <div className={`h-full flex-shrink-0 transition-all duration-300 ${activeArtifact ? 'w-full md:w-1/2' : 'w-0'}`}>
            <ArtifactViewer 
              artifact={activeArtifact} 
              onClose={() => setActiveArtifact(null)} 
            />
          </div>
        )}
      </div>
    </main>
  );
}
