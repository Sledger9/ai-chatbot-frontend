"use client";
import React, { useState, useMemo } from "react";
import { Plus, MessageSquare, Trash2, X, Menu, Search, Bot } from "lucide-react";
import { ChatSession } from "@/lib/types";

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function ChatSidebar({
  sessions, activeSessionId, onSelectSession, onNewChat, onDeleteSession, isOpen, setIsOpen
}: ChatSidebarProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return sessions;
    const q = query.toLowerCase();
    return sessions.filter(s =>
      (s.title || "").toLowerCase().includes(q) ||
      s.messages.some(m => m.content.toLowerCase().includes(q))
    );
  }, [sessions, query]);

  // Group by today / yesterday / older
  const now   = new Date();
  const today = now.toDateString();
  const yday  = new Date(now.setDate(now.getDate() - 1)).toDateString();

  const groups: { label: string; items: ChatSession[] }[] = [];
  const todaySessions  = filtered.filter(s => new Date(s.createdAt).toDateString() === today);
  const ydaySessions   = filtered.filter(s => new Date(s.createdAt).toDateString() === yday);
  const olderSessions  = filtered.filter(s => {
    const d = new Date(s.createdAt).toDateString();
    return d !== today && d !== yday;
  });
  if (todaySessions.length)  groups.push({ label: "Today",     items: todaySessions });
  if (ydaySessions.length)   groups.push({ label: "Yesterday", items: ydaySessions });
  if (olderSessions.length)  groups.push({ label: "Older",     items: olderSessions });

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-20 md:hidden transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <div className={`fixed md:static inset-y-0 left-0 z-30 w-64 bg-[#0f0f0f] border-r border-neutral-800/60 flex flex-col transition-transform duration-200 ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        
        {/* Logo + New Chat */}
        <div className="p-4 space-y-3 border-b border-neutral-800/60">
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <span className="font-semibold text-neutral-100 text-sm">AI Assistant</span>
            <button className="md:hidden ml-auto p-1 text-neutral-500" onClick={() => setIsOpen(false)}>
              <X size={16} />
            </button>
          </div>
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg transition-colors text-sm font-medium text-neutral-200"
          >
            <Plus size={15} /> New Chat
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-neutral-800/40">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-600" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-neutral-800/60 text-neutral-300 placeholder-neutral-600 text-xs rounded-lg pl-8 pr-3 py-2 outline-none focus:ring-1 focus:ring-orange-500/40 transition-all"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400">
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {groups.length === 0 ? (
            <div className="text-center text-neutral-600 text-xs py-8">
              {query ? "No conversations match" : "No conversations yet"}
            </div>
          ) : (
            groups.map(group => (
              <div key={group.label} className="mb-3">
                <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest px-2 py-1">
                  {group.label}
                </p>
                {group.items.map(s => {
                  const isActive = activeSessionId === s.id;
                  const count    = s.messages.length;
                  return (
                    <div
                      key={s.id}
                      onClick={() => { onSelectSession(s.id); if (window.innerWidth < 768) setIsOpen(false); }}
                      className={`group flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors mb-0.5 ${
                        isActive ? "bg-neutral-800 text-neutral-100" : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <MessageSquare size={13} className="flex-shrink-0 opacity-60" />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium leading-snug">
                            {/* Highlight search match */}
                            {query
                              ? highlightMatch(s.title || "New Chat", query)
                              : (s.title || "New Chat")
                            }
                          </p>
                          <p className="text-[10px] text-neutral-600">{count} message{count !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); onDeleteSession(s.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-900/30 hover:text-red-400 transition-all flex-shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-800/60">
          <p className="text-[10px] text-neutral-600 text-center">Powered by Qwen3-Coder 480B · Agno</p>
        </div>
      </div>

      {/* Mobile hamburger */}
      {!isOpen && (
        <button
          className="md:hidden fixed top-3 left-3 z-10 p-2 bg-neutral-900/90 backdrop-blur rounded-lg text-neutral-300 border border-neutral-800"
          onClick={() => setIsOpen(true)}
        >
          <Menu size={18} />
        </button>
      )}
    </>
  );
}

function highlightMatch(text: string, query: string) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-orange-500/30 text-orange-300 rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}
