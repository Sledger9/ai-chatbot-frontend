import React, { useRef, useEffect } from "react";
import { ArrowUp, Square, Paperclip } from "lucide-react";
import { FilePayload } from "../lib/types";

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  onFileSelect: (file: FilePayload) => void;
}

export function ChatInput({ input, setInput, onSend, onStop, isStreaming, onFileSelect }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      onFileSelect({
        name: file.name,
        type: file.type || "application/octet-stream",
        base64
      });
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // reset
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto flex items-end gap-2 bg-neutral-800 p-2 rounded-2xl border border-neutral-700 shadow-lg">
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
        accept=".txt,.pdf,.docx"
      />
      
      <button 
        className="p-3 text-neutral-400 hover:text-white transition-colors rounded-xl hover:bg-neutral-700 flex-shrink-0"
        onClick={() => fileInputRef.current?.click()}
        disabled={isStreaming}
      >
        <Paperclip size={20} />
      </button>

      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message Claude..."
        className="w-full max-h-[200px] bg-transparent border-none focus:outline-none focus:ring-0 resize-none py-3 px-2 text-neutral-200 placeholder-neutral-500 min-h-[44px]"
        rows={1}
        disabled={isStreaming}
      />

      {isStreaming ? (
        <button 
          onClick={onStop}
          className="p-3 m-1 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors flex-shrink-0"
        >
          <Square size={20} className="fill-current" />
        </button>
      ) : (
        <button 
          onClick={onSend}
          disabled={!input.trim()}
          className="p-3 m-1 bg-white hover:bg-neutral-200 disabled:bg-neutral-700 disabled:text-neutral-500 text-black rounded-xl transition-colors flex-shrink-0"
        >
          <ArrowUp size={20} strokeWidth={3} />
        </button>
      )}
    </div>
  );
}
