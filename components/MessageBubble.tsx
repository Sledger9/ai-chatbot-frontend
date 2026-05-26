import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MessagePayload } from "../lib/types";
import { ThinkingPanel } from "./ThinkingPanel";
import { CodeBlock } from "./CodeBlock";
import { User, Sparkles, Code2, Download } from "lucide-react";
import { ArtifactData } from "./ArtifactViewer";

export function MessageBubble({ 
  message, 
  isStreaming,
  onOpenArtifact
}: { 
  message: MessagePayload;
  isStreaming?: boolean;
  onOpenArtifact?: (artifact: ArtifactData) => void;
}) {
  const isUser = message.role === "user";

  // Parse artifacts and downloads
  const parts = [];
  let lastIndex = 0;
  // Combined regex for artifact and download
  const tagRegex = /(?:<artifact\s+title="([^"]+)"\s+language="([^"]+)">([\s\S]*?)(?:<\/artifact>|$))|(?:<download\s+url="([^"]+)"\s+filename="([^"]+)"><\/download>)/g;
  
  let match;
  while ((match = tagRegex.exec(message.content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: message.content.substring(lastIndex, match.index) });
    }
    if (match[1]) {
      // It's an artifact
      parts.push({
        type: 'artifact',
        title: match[1],
        language: match[2],
        content: match[3]
      });
    } else if (match[4]) {
      // It's a download
      parts.push({
        type: 'download',
        url: match[4],
        filename: match[5]
      });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < message.content.length) {
    parts.push({ type: 'text', content: message.content.substring(lastIndex) });
  }

  return (
    <div className={`flex gap-4 w-full px-4 py-6 ${isUser ? "bg-transparent" : "bg-neutral-900/30"}`}>
      <div className="flex-shrink-0 mt-1">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-neutral-300">
            <User size={18} />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white">
            <Sparkles size={18} />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden text-neutral-200 leading-relaxed text-[15px]">
        {message.reasoning && (
          <ThinkingPanel content={message.reasoning} isStreaming={isStreaming} />
        )}
        
        <div className="prose prose-invert prose-p:leading-relaxed prose-pre:p-0 max-w-none break-words">
          {parts.map((part, i) => {
            if (part.type === 'artifact') {
              return (
                <button
                  key={i}
                  onClick={() => onOpenArtifact && onOpenArtifact(part as ArtifactData)}
                  className="flex items-center gap-3 my-4 p-4 rounded-xl border border-neutral-700 bg-neutral-800/50 hover:bg-neutral-800 transition-colors text-left w-full sm:w-80 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-105 transition-transform">
                    <Code2 size={20} />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-medium text-neutral-200 truncate">{part.title}</span>
                    <span className="text-xs text-neutral-500 uppercase tracking-wider">{part.language} artifact</span>
                  </div>
                </button>
              );
            } else if (part.type === 'download') {
              return (
                <div key={i} className="flex items-center justify-between gap-3 my-4 p-4 rounded-xl border border-neutral-700 bg-neutral-800/80 w-full sm:w-80 shadow-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Download size={20} />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-medium text-neutral-200 truncate">{part.filename}</span>
                      <span className="text-xs text-neutral-500 uppercase tracking-wider">Ready to Download</span>
                    </div>
                  </div>
                  <a 
                    href={`http://localhost:8000${part.url}`} 
                    download={part.filename}
                    className="flex-shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
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
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <CodeBlock 
                        language={match[1]} 
                        code={String(children).replace(/\n$/, "")} 
                        onOpenArtifact={onOpenArtifact}
                      />
                    ) : (
                      <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-amber-200 font-mono text-sm" {...props}>
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
        </div>
      </div>
    </div>
  );
}
