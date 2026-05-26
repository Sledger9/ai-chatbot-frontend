import React, { useEffect, useRef } from "react";
import { MessagePayload } from "../lib/types";
import { MessageBubble } from "./MessageBubble";
import { ToolCallBadge } from "./ToolCallBadge";
import { ArtifactData } from "./ArtifactViewer";

interface ChatWindowProps {
  messages: MessagePayload[];
  activeTool?: { name: string; input: string } | null;
  isStreaming?: boolean;
  onOpenArtifact?: (artifact: ArtifactData) => void;
}

export function ChatWindow({ messages, activeTool, isStreaming, onOpenArtifact }: ChatWindowProps) {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTool]);

  return (
    <div className="flex-1 overflow-y-auto w-full h-full pb-32 pt-10">
      <div className="max-w-4xl mx-auto w-full flex flex-col">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center mt-32">
            <h1 className="text-4xl font-semibold mb-4 text-white">How can I help you today?</h1>
            <p className="text-neutral-400">Ask a question or upload a file to get started.</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <MessageBubble 
              key={idx} 
              message={msg} 
              isStreaming={isStreaming && idx === messages.length - 1} 
              onOpenArtifact={onOpenArtifact}
            />
          ))
        )}
        
        {activeTool && (
          <div className="px-4 py-2 ml-12">
            <ToolCallBadge name={activeTool.name} input={activeTool.input} />
          </div>
        )}
        
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
}
