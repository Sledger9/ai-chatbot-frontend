"use client";
import React, { useState } from "react";
import { MessagePayload, ToolCall } from "@/lib/types";
import { ThinkingPanel } from "./ThinkingPanel";
import { ToolCallCard } from "./ToolCallCard";
import { CodeBlock } from "./CodeBlock";
import { ArtifactData } from "./ArtifactViewer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  User, Sparkles, Code2, Download,
  Copy, CheckCheck, RefreshCw, ThumbsUp, ThumbsDown
} from "lucide-react";

interface MessageBubbleProps {
  message: MessagePayload;
  isStreaming?: boolean;
  onOpenArtifact?: (a: ArtifactData) => void;
  onRetry?: () => void;
  onEdit?: (content: string) => void;
}

export function MessageBubble({
  message, isStreaming, onOpenArtifact, onRetry, onEdit
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied]     = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [hovered, setHovered]   = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse <artifact> and <download> tags out of the content
  const parts: any[] = [];
  let lastIndex = 0;
  const tagRegex = /(?:<artifact\s+title="([^"]+)"\s+language="([^"]+)">([\\s\S]*?)(?:<\/artifact>|$))|(?:<download\s+url="([^"]+)"\s+filename="([^"]+)"><\/download>)/g;
  let match;
  while ((match = tagRegex.exec(message.content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: message.content.substring(lastIndex, match.index) });
    }
    if (match[1]) {
      parts.push({ type: "artifact", title: match[1], language: match[2], content: match[3] });
    } else if (match[4]) {
      parts.push({ type: "download", url: match[4], filename: match[5] });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < message.content.length) {
    parts.push({ type: "text", content: message.content.substring(lastIndex) });
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://sledger99-ai-chatbot-backend.hf.space";

  return (
    <div
      className={`group flex gap-4 w-full px-4 py-5 relative ${isUser ? "bg-transparent" : "bg-neutral-900/20"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <User size={15} className="text-white" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center shadow-lg shadow-orange-900/30">
            <Sparkles size={15} className="text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
          {isUser ? "You" : "Assistant"}
        </p>

        {/* Inline images */}
        {message.imageUrls && message.imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {message.imageUrls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`attachment-${i}`}
                className="max-h-48 max-w-xs rounded-xl border border-neutral-700 object-cover"
              />
            ))}
          </div>
        )}

        {/* Claude-style 3-dots pulsing loader when streaming and content hasn't arrived yet */}
        {isStreaming && !message.content && (
          <div className="flex items-center gap-1.5 py-3 px-1 select-none">
            <span className="w-2 h-2 rounded-full bg-neutral-600 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 rounded-full bg-neutral-600 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 rounded-full bg-neutral-600 animate-bounce" />
          </div>
        )}

        {/* Tool call cards */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mb-2">
            {message.toolCalls.map((tc) => (
              <ToolCallCard key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}

        {/* Main content */}
        <div className="prose prose-invert prose-p:leading-relaxed prose-pre:p-0 max-w-none text-[15px] leading-relaxed">
          {parts.map((part, i) => {
            if (part.type === "artifact") {
              return (
                <button
                  key={i}
                  onClick={() => onOpenArtifact?.(part as ArtifactData)}
                  className="flex items-center gap-3 my-3 p-3.5 rounded-xl border border-neutral-700 bg-neutral-800/50 hover:bg-neutral-800 hover:border-orange-500/40 transition-all text-left w-full sm:w-80 group/art"
                >
                  <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover/art:scale-105 transition-transform">
                    <Code2 size={18} />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-medium text-neutral-200 text-sm truncate">{part.title}</span>
                    <span className="text-[11px] text-neutral-500 uppercase tracking-wider">{part.language} · Click to open</span>
                  </div>
                </button>
              );
            }
            if (part.type === "download") {
              return (
                <div key={i} className="flex items-center justify-between gap-3 my-3 p-3.5 rounded-xl border border-neutral-700 bg-neutral-800/60 w-full sm:w-80">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <Download size={18} />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-medium text-neutral-200 text-sm truncate">{part.filename}</span>
                      <span className="text-[11px] text-neutral-500">Ready to download</span>
                    </div>
                  </div>
                  <a
                    href={`${backendUrl.replace(/\/$/, "")}${part.url}`}
                    download={part.filename}
                    className="flex-shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Download
                  </a>
                </div>
              );
            }
            return (
              <ReactMarkdown
                key={i}
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const langMatch = /language-(\w+)/.exec(className || "");
                    return !inline && langMatch ? (
                      <CodeBlock
                        language={langMatch[1]}
                        code={String(children).replace(/\n$/, "")}
                        onOpenArtifact={onOpenArtifact}
                      />
                    ) : (
                      <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-amber-200 font-mono text-[13px]" {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {part.content}
              </ReactMarkdown>
            );
          })}

          {/* Streaming cursor */}
          {isStreaming && !isUser && (
            <span className="inline-block w-2 h-4 bg-orange-400 animate-pulse rounded-sm ml-0.5 align-middle" />
          )}
        </div>

        {/* Action bar (shows on hover) */}
        {!isStreaming && hovered && (
          <div className="flex items-center gap-1 mt-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
            >
              {copied ? <CheckCheck size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copied ? "Copied!" : "Copy"}
            </button>

            {!isUser && onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
              >
                <RefreshCw size={12} />
                Retry
              </button>
            )}

            {!isUser && (
              <>
                <button
                  onClick={() => setFeedback("up")}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${feedback === "up" ? "text-emerald-400 bg-emerald-900/20" : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800"}`}
                >
                  <ThumbsUp size={12} />
                </button>
                <button
                  onClick={() => setFeedback("down")}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${feedback === "down" ? "text-red-400 bg-red-900/20" : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800"}`}
                >
                  <ThumbsDown size={12} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
