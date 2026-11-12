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
    <div className="flex flex-col h-full bg-[#111110] border-r border-[#37332E]">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[#37332E] space-y-4 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-extrabold text-[#F7F5F0]">Messages</h1>
          <button
            type="button"
            onClick={onNewChat}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Chat
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-[#AAA69F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 py-2 rounded-full bg-[#22211F] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] placeholder-[#AAA69F]/60 focus:outline-none"
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
                  ? 'bg-[#2B2824] border border-[#FF9B45] text-[#FF9B45]'
                  : 'bg-[#171715] border border-[#37332E] text-[#AAA69F] hover:text-[#F7F5F0]'
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
            <MessageSquare className="w-8 h-8 text-[#FF9B45] mx-auto" />
            <p className="text-sm font-bold text-[#F7F5F0]">No conversations yet</p>
            <p className="text-xs text-[#AAA69F]">
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
                    ? 'bg-[#2B2824] border-[#37332E]'
                    : 'bg-transparent border-transparent hover:bg-[#1B1A18]'
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
                  className="w-11 h-11 rounded-full object-cover border border-[#37332E] bg-[#22211F] shrink-0"
                />

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[#F7F5F0] truncate">
                      {partner?.name || conv.groupName || 'Campus Peer'}
                    </p>
                    <span className="text-[11px] text-[#AAA69F] shrink-0">
                      {formatTime(conv.lastMessage?.createdAt || conv.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-xs truncate ${
                        unread > 0 ? 'font-bold text-[#F7F5F0]' : 'text-[#AAA69F]'
                      }`}
                    >
                      {conv.lastMessage?.text || 'Direct conversation started'}
                    </p>
                    {unread > 0 && (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#FF9B45] text-[#171715] text-[11px] font-extrabold flex items-center justify-center shrink-0 tabular-nums">
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
