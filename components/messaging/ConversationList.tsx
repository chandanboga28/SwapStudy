'use client';

import React, { useState, useMemo } from 'react';
import { Conversation } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  Search,
  Plus,
  MessageSquare,
  ShieldCheck,
  ArrowRightLeft,
  Link as LinkIcon,
} from 'lucide-react';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onOpenNewMessageModal: () => void;
}

export default function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onOpenNewMessageModal,
}: ConversationListProps) {
  const { user, allUsers } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');

  // Format relative timestamp
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Build item metadata
  const conversationItems = useMemo(() => {
    if (!user) return [];
    return conversations.map((conv) => {
      const partnerId = conv.participantIds.find((id) => id !== user.id);
      const partner = allUsers.find((u) => u.id === partnerId);
      const unread = conv.unreadCounts?.[user.id] || 0;

      return {
        conv,
        partner,
        unread,
      };
    });
  }, [conversations, user, allUsers]);

  // Filter conversations
  const filteredItems = useMemo(() => {
    let items = conversationItems;

    if (filterMode === 'unread') {
      items = items.filter((item) => item.unread > 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((item) => {
        const partnerName = item.partner?.name.toLowerCase() || '';
        const partnerMajor = item.partner?.major.toLowerCase() || '';
        const lastMsg = item.conv.lastMessage?.text.toLowerCase() || '';
        return partnerName.includes(q) || partnerMajor.includes(q) || lastMsg.includes(q);
      });
    }

    return items;
  }, [conversationItems, filterMode, searchQuery]);

  const totalUnread = useMemo(() => {
    return conversationItems.reduce((acc, item) => acc + item.unread, 0);
  }, [conversationItems]);

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/90 w-full select-none">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">Messages</h1>
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-xs">
                {totalUnread} new
              </span>
            )}
          </div>
          <button
            onClick={onOpenNewMessageModal}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 transition-colors flex items-center gap-1 text-xs font-semibold"
            title="Start Messaging"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Start Messaging</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${filterMode === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            All ({conversationItems.length})
          </button>
          <button
            onClick={() => setFilterMode('unread')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${filterMode === 'unread'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            Unread
            {totalUnread > 0 && (
              <span
                className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${filterMode === 'unread'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-100 text-emerald-800'
                  }`}
              >
                {totalUnread}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Conversation List Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">No conversations found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {filterMode === 'unread'
                  ? 'All caught up! No unread messages.'
                  : 'Connect with classmates to start study swaps.'}
              </p>
            </div>
            {filterMode === 'all' && (
              <button
                onClick={onOpenNewMessageModal}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Start Messaging
              </button>
            )}
          </div>
        ) : (
          filteredItems.map(({ conv, partner, unread }) => {
            const isActive = conv.id === activeConversationId;
            const lastMsgType = conv.lastMessage?.type;

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all ${isActive
                    ? 'bg-emerald-50/70 border-l-4 border-emerald-600'
                    : 'hover:bg-slate-50/80 border-l-4 border-transparent'
                  }`}
              >
                {/* Avatar with Status */}
                <div className="relative shrink-0">
                  <img
                    src={
                      partner?.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(partner?.id || conv.id)}`
                    }
                    alt={partner?.name || 'Classmate'}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  {partner?.isCollegeVerified && (
                    <span
                      title="Verified University Student"
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center text-emerald-600 shadow-xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 fill-emerald-100" />
                    </span>
                  )}
                </div>

                {/* Info & Last message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className={`text-xs truncate ${unread > 0 ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'
                        }`}
                    >
                      {partner?.name || 'Study Partner'}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                      {formatTime(conv.lastMessage?.createdAt || conv.updatedAt)}
                    </span>
                  </div>

                  {/* University / Major Snippet */}
                  <p className="text-[10px] text-slate-500 truncate mb-1">
                    {partner?.major || 'Campus Peer'} • {partner?.university?.includes('Ajeenkya') ? 'ADYPU' : partner?.university?.split(' ')[0] || 'Campus'}
                  </p>

                  {/* Last Message Snippet */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      {lastMsgType === 'skill_invitation' && (
                        <ArrowRightLeft className="w-3 h-3 text-emerald-600 shrink-0" />
                      )}
                      {lastMsgType === 'resource' && (
                        <LinkIcon className="w-3 h-3 text-blue-600 shrink-0" />
                      )}
                      <p
                        className={`text-[11px] truncate ${unread > 0
                            ? 'font-semibold text-slate-900'
                            : 'text-slate-500'
                          }`}
                      >
                        {conv.lastMessage?.text || 'Direct conversation started'}
                      </p>
                    </div>

                    {unread > 0 && (
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs">
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


