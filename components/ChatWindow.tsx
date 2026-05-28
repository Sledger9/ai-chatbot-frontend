"use client";
import React, { useEffect, useRef } from "react";
import { MessagePayload } from "@/lib/types";
import { MessageBubble }  from "./MessageBubble";
import { ArtifactData }   from "./ArtifactViewer";
import { Sparkles }       from "lucide-react";

interface ChatWindowProps {
  messages: MessagePayload[];
  isStreaming?: boolean;
  onOpenArtifact?: (artifact: ArtifactData) => void;
  onRetry?: () => void;
}

const SUGGESTIONS = [
  "Summarize a document I upload",
  "Write a Python web scraper",
  "Explain quantum entanglement simply",
  "Build a to-do app in React",
];

export function ChatWindow({ messages, isStreaming, onOpenArtifact, onRetry }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto w-full h-full pb-40 pt-6">
      <div className="max-w-3xl mx-auto w-full flex flex-col">
        {messages.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center text-center mt-24 px-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center mb-5 shadow-xl shadow-orange-900/30">
              <Sparkles size={26} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-neutral-100 to-neutral-400 bg-clip-text text-transparent">
              How can I help you?
            </h1>
            <p className="text-neutral-500 text-sm mb-8 max-w-sm">
              Powered by Qwen3-Coder 480B · Upload files, write code, search the web, and more.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  className="text-left p-3 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800/80 hover:border-neutral-700 transition-all text-sm text-neutral-400 hover:text-neutral-200"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <MessageBubble
              key={idx}
              message={msg}
              isStreaming={isStreaming && idx === messages.length - 1 && msg.role === "assistant"}
              onOpenArtifact={onOpenArtifact}
              onRetry={idx === messages.length - 1 && msg.role === "assistant" ? onRetry : undefined}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
