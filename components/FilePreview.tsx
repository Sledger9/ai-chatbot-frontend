import React from "react";
import { File, X } from "lucide-react";
import { FilePayload } from "../lib/types";

export function FilePreview({ file, onRemove }: { file: FilePayload, onRemove: () => void }) {
  return (
    <div className="relative inline-flex items-center gap-2 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-sm text-neutral-200 group">
      <File size={16} className="text-blue-400" />
      <span className="max-w-[150px] truncate">{file.name}</span>
      <button 
        onClick={onRemove}
        className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
      >
        <X size={12} />
      </button>
    </div>
  );
}
