import React from "react";
import { Plus, MessageSquare, Trash2, X, Menu } from "lucide-react";
import { ChatSession } from "../lib/types";

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function ChatSidebar({ sessions, activeSessionId, onSelectSession, onNewChat, onDeleteSession, isOpen, setIsOpen }: ChatSidebarProps) {
  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity ${isOpen ? "opacity-100 block" : "opacity-0 hidden"}`}
        onClick={() => setIsOpen(false)}
      />
      <div className={`fixed md:static inset-y-0 left-0 z-30 w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col transition-transform transform ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="p-4 flex items-center justify-between">
          <button 
            onClick={onNewChat}
            className="flex-1 flex items-center gap-2 px-3 py-2 bg-white text-black hover:bg-neutral-200 rounded-md transition-colors text-sm font-medium"
          >
            <Plus size={16} /> New Chat
          </button>
          <button className="md:hidden ml-2 p-2 text-neutral-400" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {sessions.map(s => (
            <div 
              key={s.id}
              className={`group flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${activeSessionId === s.id ? "bg-neutral-800 text-white" : "text-neutral-400 hover:bg-neutral-800/50 hover:text-white"}`}
              onClick={() => onSelectSession(s.id)}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <MessageSquare size={16} className="flex-shrink-0" />
                <span className="truncate text-sm">{s.title || "New Chat"}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteSession(s.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {!isOpen && (
        <button 
          className="md:hidden fixed top-4 left-4 z-10 p-2 bg-neutral-900 rounded-md text-white border border-neutral-800"
          onClick={() => setIsOpen(true)}
        >
          <Menu size={20} />
        </button>
      )}
    </>
  );
}
