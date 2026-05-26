import React, { useState } from "react";
import { Check, Copy, Maximize2 } from "lucide-react";
import { ArtifactData } from "./ArtifactViewer";

export function CodeBlock({ 
  language, 
  code, 
  onOpenArtifact 
}: { 
  language: string; 
  code: string;
  onOpenArtifact?: (artifact: ArtifactData) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-md overflow-hidden bg-[#1e1e1e] border border-neutral-700 font-mono text-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-800 text-neutral-400">
        <span className="text-xs font-semibold uppercase">{language}</span>
        <div className="flex items-center gap-3">
          {onOpenArtifact && (
            <button 
              onClick={() => onOpenArtifact({ title: "Code Snippet", language, content: code })}
              className="hover:text-white transition-colors flex items-center gap-1 text-xs"
              title="Open in Artifact Viewer"
            >
              <Maximize2 size={14} />
            </button>
          )}
          <button 
            onClick={handleCopy}
            className="hover:text-white transition-colors flex items-center gap-1 text-xs"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <div className="p-4 overflow-x-auto text-neutral-300">
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
