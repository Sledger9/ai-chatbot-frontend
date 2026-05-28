"use client";
import React, { useState } from "react";
import { ToolCall } from "@/lib/types";
import { ChevronDown, ChevronRight, Terminal, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

interface ToolCallCardProps {
  toolCall: ToolCall;
}

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);
  const duration = toolCall.endedAt && toolCall.startedAt
    ? ((toolCall.endedAt - toolCall.startedAt) / 1000).toFixed(1)
    : null;

  const statusIcon = {
    running: <Loader2 size={14} className="animate-spin text-amber-400" />,
    done:    <CheckCircle2 size={14} className="text-emerald-400" />,
    error:   <AlertCircle size={14} className="text-red-400" />,
  }[toolCall.status];

  const statusColor = {
    running: "border-amber-500/30 bg-amber-950/20",
    done:    "border-emerald-500/30 bg-emerald-950/20",
    error:   "border-red-500/30 bg-red-950/20",
  }[toolCall.status];

  return (
    <div className={`my-2 rounded-xl border ${statusColor} overflow-hidden text-sm font-mono transition-all`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors text-left"
      >
        {statusIcon}
        <Terminal size={13} className="text-neutral-400" />
        <span className="text-neutral-300 font-medium">{toolCall.name}</span>
        {duration && (
          <span className="ml-auto text-xs text-neutral-500">{duration}s</span>
        )}
        {toolCall.status === "running" && (
          <span className="ml-auto text-xs text-amber-400 animate-pulse">Running...</span>
        )}
        <span className="text-neutral-600 ml-1">
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
      </button>

      {/* Expandable body */}
      {expanded && (
        <div className="border-t border-white/5 text-xs">
          {/* Input */}
          {toolCall.input && (
            <div className="px-3 py-2 border-b border-white/5">
              <div className="text-neutral-500 mb-1 uppercase tracking-wider text-[10px]">Input</div>
              <pre className="text-neutral-400 whitespace-pre-wrap break-all leading-relaxed max-h-40 overflow-y-auto">
                {toolCall.input}
              </pre>
            </div>
          )}
          {/* Result */}
          {toolCall.result && (
            <div className="px-3 py-2">
              <div className="text-neutral-500 mb-1 uppercase tracking-wider text-[10px]">Output</div>
              <pre className="text-neutral-300 whitespace-pre-wrap break-all leading-relaxed max-h-48 overflow-y-auto">
                {toolCall.result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
