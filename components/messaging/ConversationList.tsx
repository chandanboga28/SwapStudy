'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Conversation } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Search, Plus, MessageSquare } from 'lucide-react';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNewChat,
}: ConversationListProps) {
  const { user, allUsers } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');

  const currentUserId = user?.id;

  const resolvePartner = useCallback(
    (conv: Conversation) => {
      const partnerId = conv.participantIds.find((id) => id !== currentUserId);
      return allUsers.find((u) => u.id === partnerId) || null;
    },
    [currentUserId, allUsers]
  );

  const filteredConversations = useMemo(() => {
    return conversations
      .filter((conv) => {
        const unread = currentUserId ? conv.unreadCounts[currentUserId] || 0 : 0;
        if (filterMode === 'unread' && unread === 0) return false;

        if (searchQuery.trim()) {
          const partner = resolvePartner(conv);
          const q = searchQuery.toLowerCase();
          const name = (partner?.name || conv.groupName || '').toLowerCase();
          const lastText = (conv.lastMessage?.text || '').toLowerCase();
          if (!name.includes(q) && !lastText.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [conversations, filterMode, searchQuery, currentUserId, resolvePartner]);

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-[#E6E3DA] border-r border-[#4A4E57]">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[#CEC9BC] space-y-4 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-extrabold text-[#1F2227]">Messages</h1>
          <button
            type="button"
            onClick={onNewChat}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Chat
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-[#464B55] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 py-2 rounded-full bg-[#F8F6F0] border border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] placeholder-[#5A606B] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'unread'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilterMode(mode)}
              className={`px-3.5 py-1 rounded-full text-xs font-bold capitalize transition-colors cursor-pointer ${
                filterMode === mode
                  ? 'bg-[#E6E3DA] border border-[#3B5CA8] text-[#2F4D96]'
                  : 'bg-[#EFECE4] border border-[#4A4E57] text-[#464B55] hover:text-[#1F2227]'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Items */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {filteredConversations.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2.5">
            <MessageSquare className="w-8 h-8 text-[#2F4D96] mx-auto" />
            <p className="text-sm font-bold text-[#1F2227]">No conversations yet</p>
            <p className="text-xs text-[#464B55]">
              Start a direct chat with a connected campus peer to coordinate your next session.
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const partner = resolvePartner(conv);
            const isSelected = conv.id === activeId;
            const unread = user ? conv.unreadCounts[user.id] || 0 : 0;

            return (
              <div
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(conv.id);
                  }
                }}
                className={`p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer transition-colors border ${
                  isSelected
                    ? 'bg-[#E6E3DA] border-[#4A4E57]'
                    : 'bg-transparent border-transparent hover:bg-[#E6E3DA]'
                }`}
              >
                <img
                  src={
                    partner?.avatar ||
                    `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(
                      conv.id
                    )}`
                  }
                  alt={partner?.name || 'Peer'}
                  className="w-11 h-11 rounded-full object-cover border border-[#4A4E57] bg-[#F8F6F0] shrink-0"
                />

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[#1F2227] truncate">
                      {partner?.name || conv.groupName || 'Campus Peer'}
                    </p>
                    <span className="text-[11px] text-[#464B55] shrink-0">
                      {formatTime(conv.lastMessage?.createdAt || conv.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-xs truncate ${
                        unread > 0 ? 'font-bold text-[#1F2227]' : 'text-[#464B55]'
                      }`}
                    >
                      {conv.lastMessage?.text || 'Direct conversation started'}
                    </p>
                    {unread > 0 && (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#3B5CA8] text-[#FFFFFF] text-[11px] font-extrabold flex items-center justify-center shrink-0 tabular-nums">
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
