"use client";
import React, { useState, useRef, useEffect } from "react";
import { FilePayload } from "@/lib/types";
import {
  Send, Square, Paperclip, Mic, MicOff, X, Image as ImageIcon
} from "lucide-react";

interface ChatInputProps {
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  onFileSelect: (file: FilePayload) => void;
}

export function ChatInput({
  input, setInput, onSend, onStop, isStreaming, onFileSelect
}: ChatInputProps) {
  const textareaRef   = useRef<HTMLTextAreaElement>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [isRecording, setIsRecording]       = useState(false);
  const [recordingAnim, setRecordingAnim]   = useState(false);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && input.trim()) onSend();
    }
  };

  // ── File / Image upload ───────────────────────────────────────────────────
  const processFile = (file: File, isImage = false) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      onFileSelect({ name: file.name, type: file.type, base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isImage = false) => {
    const files = Array.from(e.target.files || []);
    files.forEach(f => processFile(f, isImage));
    e.target.value = "";
  };

  // ── Voice Input ───────────────────────────────────────────────────────────
  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      setRecordingAnim(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous    = false;
    recognition.interimResults = true;
    recognition.lang          = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setInput(transcript);
    };
    recognition.onend = () => {
      setIsRecording(false);
      setRecordingAnim(false);
    };
    recognition.onerror = () => {
      setIsRecording(false);
      setRecordingAnim(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setRecordingAnim(true);
  };

  return (
    <div className="relative">
      <div className={`flex flex-col gap-2 p-3 rounded-2xl border transition-all duration-200 ${
        isRecording
          ? "border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.2)] bg-neutral-900"
          : "border-neutral-700/60 bg-neutral-900 focus-within:border-neutral-600 focus-within:shadow-[0_0_20px_rgba(255,255,255,0.04)]"
      }`}>

        {/* Recording indicator */}
        {isRecording && (
          <div className="flex items-center gap-2 px-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-red-400 font-medium">Listening...</span>
            <div className="flex gap-0.5 ml-1">
              {[1,2,3,4,5].map(i => (
                <span
                  key={i}
                  className="w-0.5 bg-red-400 rounded-full animate-pulse"
                  style={{
                    height: `${8 + Math.random() * 12}px`,
                    animationDelay: `${i * 100}ms`
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message AI Assistant..."
          rows={1}
          className="w-full bg-transparent text-neutral-100 placeholder-neutral-600 resize-none outline-none text-[15px] leading-relaxed px-1 min-h-[24px] max-h-[200px]"
        />

        {/* Toolbar */}
        <div className="flex items-center gap-1">
          {/* File attach */}
          <input ref={fileInputRef} type="file" className="hidden" multiple onChange={e => handleFileChange(e)} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming}
            className="p-2 rounded-xl text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800 transition-colors disabled:opacity-40"
            title="Attach file"
          >
            <Paperclip size={16} />
          </button>

          {/* Image attach */}
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" multiple onChange={e => handleFileChange(e, true)} />
          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={isStreaming}
            className="p-2 rounded-xl text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800 transition-colors disabled:opacity-40"
            title="Attach image"
          >
            <ImageIcon size={16} />
          </button>

          {/* Voice */}
          <button
            onClick={toggleVoice}
            disabled={isStreaming}
            className={`p-2 rounded-xl transition-colors disabled:opacity-40 ${
              isRecording
                ? "text-red-400 bg-red-900/20 hover:bg-red-900/30"
                : "text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800"
            }`}
            title={isRecording ? "Stop recording" : "Voice input"}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          <div className="flex-1" />

          {/* Hint */}
          <span className="text-[11px] text-neutral-700 hidden sm:block">
            {isStreaming ? "" : "Enter to send · Shift+Enter for newline"}
          </span>

          {/* Send / Stop */}
          <button
            onClick={isStreaming ? onStop : onSend}
            disabled={!isStreaming && !input.trim()}
            className={`ml-1 p-2 rounded-xl font-medium text-sm transition-all ${
              isStreaming
                ? "bg-neutral-700 hover:bg-neutral-600 text-white"
                : input.trim()
                  ? "bg-white text-black hover:bg-neutral-200 shadow-md"
                  : "bg-neutral-800 text-neutral-600 cursor-not-allowed"
            }`}
          >
            {isStreaming ? <Square size={15} fill="currentColor" /> : <Send size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}
