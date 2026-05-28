"use client";
import React, { useState, useEffect, useRef } from "react";
import { Brain, ChevronDown, ChevronRight } from "lucide-react";

interface ThinkingPanelProps {
  content: string;
  isStreaming?: boolean;
}

export function ThinkingPanel({ content, isStreaming }: ThinkingPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [tokenCount, setTokenCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-close when streaming finishes
  useEffect(() => {
    if (!isStreaming) setIsOpen(false);
    else setIsOpen(true);
  }, [isStreaming]);

  // Rough token counter
  useEffect(() => {
    setTokenCount(Math.round(content.split(/\s+/).length * 1.3));
  }, [content]);

  // Auto-scroll while open + streaming
  useEffect(() => {
    if (isOpen && isStreaming && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content, isOpen, isStreaming]);

  if (!content) return null;

  return (
    <div className={`my-3 rounded-xl overflow-hidden transition-all duration-300 ${
      isStreaming
        ? "border border-violet-500/40 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
        : "border border-neutral-700/60"
    }`}>
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-neutral-900/80 hover:bg-neutral-800/60 transition-colors text-left"
      >
        <div className={`relative flex-shrink-0 ${isStreaming ? "animate-pulse" : ""}`}>
          <Brain size={15} className={isStreaming ? "text-violet-400" : "text-neutral-500"} />
          {isStreaming && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-violet-500 rounded-full animate-ping" />
          )}
        </div>

        <span className={`text-sm font-medium ${isStreaming ? "text-violet-300" : "text-neutral-400"}`}>
          {isStreaming ? "Thinking..." : "Thought Process"}
        </span>

        {isStreaming && (
          <span className="flex gap-0.5 ml-1">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </span>
        )}

        <span className="ml-auto flex items-center gap-2">
          {tokenCount > 0 && (
            <span className="text-[11px] text-neutral-600 font-mono">
              ~{tokenCount.toLocaleString()} tokens
            </span>
          )}
          {isOpen ? (
            <ChevronDown size={13} className="text-neutral-500" />
          ) : (
            <ChevronRight size={13} className="text-neutral-500" />
          )}
        </span>
      </button>

      {/* Body */}
      {isOpen && (
        <div
          ref={scrollRef}
          className="px-4 py-3 text-xs text-neutral-500 italic whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto border-t border-neutral-800/60 bg-neutral-950/40 font-mono"
        >
          {content}
          {isStreaming && (
            <span className="inline-block w-2 h-3 bg-violet-500/60 animate-pulse ml-0.5 rounded-sm" />
          )}
        </div>
      )}
    </div>
  );
}
