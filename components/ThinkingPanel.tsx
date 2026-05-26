import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export function ThinkingPanel({ content, isStreaming }: { content: string, isStreaming?: boolean }) {
  const [isOpen, setIsOpen] = useState(true);

  // Automatically close when streaming finishes, unless user manually toggled it
  useEffect(() => {
    if (isStreaming === false) {
      setIsOpen(false);
    } else if (isStreaming === true) {
      setIsOpen(true);
    }
  }, [isStreaming]);

  if (!content) return null;

  return (
    <div className="my-2 border border-neutral-700 rounded-md overflow-hidden bg-neutral-900/50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 text-sm text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="font-medium flex items-center gap-2">
            Thinking Process
            {isStreaming && (
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            )}
          </span>
        </div>
      </button>
      {isOpen && (
        <div className="p-3 text-sm text-neutral-500 italic border-t border-neutral-800 whitespace-pre-wrap">
          {content}
        </div>
      )}
    </div>
  );
}
