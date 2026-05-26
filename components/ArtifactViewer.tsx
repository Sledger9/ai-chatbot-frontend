import React, { useState } from "react";
import { X, Copy, Check, Download, Code2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./CodeBlock";

export interface ArtifactData {
  title: string;
  language: string;
  content: string;
}

interface ArtifactViewerProps {
  artifact: ArtifactData;
  onClose: () => void;
}

export function ArtifactViewer({ artifact, onClose }: ArtifactViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([artifact.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = artifact.title || `artifact.${artifact.language || "txt"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1e1e] border-l border-neutral-800 text-neutral-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-[#252526]">
        <div className="flex items-center gap-2 overflow-hidden">
          <Code2 size={18} className="text-orange-500 shrink-0" />
          <h3 className="font-medium text-sm truncate">{artifact.title || "Artifact"}</h3>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-neutral-700 rounded-md transition-colors text-neutral-400 hover:text-white"
            title="Copy Code"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-neutral-700 rounded-md transition-colors text-neutral-400 hover:text-white"
            title="Download File"
          >
            <Download size={16} />
          </button>
          <div className="w-px h-4 bg-neutral-700 mx-1"></div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-700 rounded-md transition-colors text-neutral-400 hover:text-white"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 bg-[#1e1e1e]">
        <div className="prose prose-invert prose-p:leading-relaxed prose-pre:p-0 max-w-none break-words">
          <CodeBlock language={artifact.language || "text"} code={artifact.content} />
        </div>
      </div>
    </div>
  );
}
