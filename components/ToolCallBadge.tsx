import React from "react";
import { Search, Terminal, Calculator, FileText, Wrench } from "lucide-react";

export function ToolCallBadge({ name, input }: { name: string, input?: string }) {
  let icon = <Wrench size={14} />;
  let label = `Using ${name}...`;

  if (name.includes("search") || name.includes("tavily")) {
    icon = <Search size={14} />;
    label = `Searching web: ${input || "..."}`;
  } else if (name.includes("python") || name.includes("repl")) {
    icon = <Terminal size={14} />;
    label = `Running code...`;
  } else if (name.includes("calculator")) {
    icon = <Calculator size={14} />;
    label = `Calculating...`;
  } else if (name.includes("file")) {
    icon = <FileText size={14} />;
    label = `Reading file...`;
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 my-1 text-xs font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-full">
      {icon}
      <span className="truncate max-w-[200px]">{label}</span>
    </div>
  );
}
