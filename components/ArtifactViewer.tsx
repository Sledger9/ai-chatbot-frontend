"use client";
import React, { useState } from "react";
import { X, Copy, Download, Code2, Eye, CheckCheck } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

export interface ArtifactData {
  type: "artifact";
  title: string;
  language: string;
  content: string;
}

interface ArtifactViewerProps {
  artifact: ArtifactData;
  onClose: () => void;
}

export function ArtifactViewer({ artifact, onClose }: ArtifactViewerProps) {
  const [view, setView] = useState<"code" | "preview">("code");
  const [copied, setCopied] = useState(false);

  const isPreviewable = ["html", "svg", "css"].includes(artifact.language.toLowerCase());

  const handleCopy = async () => {
    await navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extMap: Record<string, string> = {
      python: "py", javascript: "js", typescript: "ts",
      html: "html", css: "css", json: "json", bash: "sh",
    };
    const ext  = extMap[artifact.language.toLowerCase()] || artifact.language.toLowerCase();
    const blob = new Blob([artifact.content], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${artifact.title.replace(/\s+/g, "_").toLowerCase()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Build preview content for HTML/SVG
  const previewSrc = isPreviewable
    ? `data:text/html;charset=utf-8,${encodeURIComponent(
        artifact.language === "svg"
          ? `<html><body style="background:#1a1a1a;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">${artifact.content}</body></html>`
          : artifact.content
      )}`
    : "";

  return (
    <div className="h-full flex flex-col bg-[#0d0d0d] border-l border-neutral-800">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
          <Code2 size={16} className="text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-neutral-200 text-sm truncate">{artifact.title}</p>
          <p className="text-[11px] text-neutral-500 uppercase tracking-wider">{artifact.language}</p>
        </div>

        {/* View toggle */}
        {isPreviewable && (
          <div className="flex items-center gap-1 bg-neutral-800 rounded-lg p-1">
            <button
              onClick={() => setView("code")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                view === "code" ? "bg-neutral-700 text-neutral-100" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Code2 size={12} /> Code
            </button>
            <button
              onClick={() => setView("preview")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                view === "preview" ? "bg-neutral-700 text-neutral-100" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Eye size={12} /> Preview
            </button>
          </div>
        )}

        <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-neutral-200 transition-colors" title="Copy">
          {copied ? <CheckCheck size={15} className="text-emerald-400" /> : <Copy size={15} />}
        </button>
        <button onClick={handleDownload} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-neutral-200 transition-colors" title="Download">
          <Download size={15} />
        </button>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-neutral-200 transition-colors">
          <X size={15} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {view === "preview" && isPreviewable ? (
          <iframe
            src={previewSrc}
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full border-0 bg-white"
            title={artifact.title}
          />
        ) : (
          <SyntaxHighlighter
            language={artifact.language}
            style={oneDark}
            showLineNumbers
            wrapLines
            customStyle={{
              margin: 0,
              borderRadius: 0,
              background: "transparent",
              fontSize: "13px",
              lineHeight: "1.6",
              height: "100%",
            }}
          >
            {artifact.content}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
}
