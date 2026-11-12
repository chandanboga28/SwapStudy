'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Conversation, Message, User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useMessaging } from '@/context/MessagingContext';
import {
  ArrowLeft,
  Send,
  Link2,
  Repeat,
  Info,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Coins,
  ShieldCheck,
} from 'lucide-react';

interface ActiveChatProps {
  conversation: Conversation;
  partner: User;
  messages: Message[];
  onBack?: () => void;
  onOpenDetails?: () => void;
  onOpenShareResource: () => void;
  onOpenInviteSwap: () => void;
  onViewProfile: (student: User) => void;
}

export default function ActiveChat({
  conversation,
  partner,
  messages,
  onBack,
  onOpenDetails,
  onOpenShareResource,
  onOpenInviteSwap,
  onViewProfile,
}: ActiveChatProps) {
  const { user } = useAuth();
  const { sendMessage, respondToSkillSwapInvitation } = useMessaging();

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [respondingMsgId, setRespondingMsgId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, conversation.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const res = await sendMessage(conversation.id, trimmed, 'text');
      if (res.success) {
        setText('');
      }
    } finally {
      setSending(false);
    }
  };

  const handleRespondInvite = async (messageId: string, accept: boolean) => {
    if (respondingMsgId) return;
    setRespondingMsgId(messageId);
    try {
      await respondToSkillSwapInvitation(messageId, accept);
    } finally {
      setRespondingMsgId(null);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-[#171715]">
      {/* Chat Header */}
      <div className="px-4 sm:px-6 py-3.5 border-b border-[#37332E] bg-[#1B1A18] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="md:hidden p-2 rounded-xl bg-[#22211F] border border-[#37332E] text-[#F7F5F0] cursor-pointer"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onViewProfile(partner)}
            className="flex items-center gap-3 min-w-0 text-left group cursor-pointer"
          >
            <img
              src={partner.avatar}
              alt={partner.name}
              className="w-10 h-10 rounded-full object-cover border border-[#37332E] bg-[#22211F] shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm sm:text-base font-bold text-[#F7F5F0] group-hover:text-[#FF9B45] transition-colors truncate">
                  {partner.name}
                </h2>
                {partner.isCollegeVerified && (
                  <ShieldCheck className="w-4 h-4 text-[#65C995] shrink-0" />
                )}
              </div>
              <p className="text-xs text-[#AAA69F] truncate">
                {partner.major || partner.university}
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenInviteSwap}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#22211F] hover:bg-[#2B2824] border border-[#37332E] text-xs font-bold text-[#FF9B45] transition-colors cursor-pointer"
          >
            <Repeat className="w-3.5 h-3.5" />
            Propose Swap
          </button>

          {onOpenDetails && (
            <button
              type="button"
              onClick={onOpenDetails}
              className="p-2 rounded-xl bg-[#22211F] hover:bg-[#2B2824] border border-[#37332E] text-[#AAA69F] hover:text-[#F7F5F0] transition-colors cursor-pointer"
              title="Toggle peer details"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-2">
            <p className="text-base font-bold text-[#F7F5F0]">
              Start chatting with {partner.name}
            </p>
            <p className="text-sm text-[#AAA69F] max-w-sm">
              Share study resources, agree on learning goals, or propose a mutual skill swap directly below.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = user ? msg.senderId === user.id : false;

            if (msg.type === 'system') {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <span className="px-3.5 py-1 rounded-full bg-[#22211F] border border-[#37332E] text-xs font-medium text-[#AAA69F]">
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] sm:max-w-[72%] space-y-1 ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                  {msg.type === 'resource' && msg.resourceUrl ? (
                    <div
                      className={`rounded-2xl p-4 border space-y-2.5 ${
                        isMine
                          ? 'bg-[#2B2824] border-[#FF9B45]/40 text-[#F7F5F0]'
                          : 'bg-[#22211F] border-[#37332E] text-[#F7F5F0]'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF9B45]">
                        <Link2 className="w-3.5 h-3.5" />
                        Shared Resource
                      </div>
                      <p className="text-sm font-bold text-[#F7F5F0]">
                        {msg.resourceTitle || msg.content}
                      </p>
                      {msg.content && msg.content !== msg.resourceTitle && (
                        <p className="text-xs text-[#AAA69F]">{msg.content}</p>
                      )}
                      <a
                        href={msg.resourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-xs font-bold transition-colors"
                      >
                        Open Link
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ) : msg.type === 'skill_invitation' && msg.invitation ? (
                    <div className="bg-[#22211F] border border-[#FF9B45]/40 rounded-2xl p-4 space-y-3 w-full min-w-[260px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#FF9B45]">
                          <Repeat className="w-3.5 h-3.5" />
                          Skill Swap Invitation
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#F5B66B]">
                          <Coins className="w-3.5 h-3.5" />
                          {msg.invitation.credits} Cr
                        </span>
                      </div>

                      <div className="bg-[#2B2824] border border-[#37332E] rounded-xl p-3 space-y-1.5 text-xs">
                        <p className="text-[#AAA69F]">
                          Offered:{' '}
                          <span className="font-bold text-[#F7F5F0]">
                            {msg.invitation.offeredSkillTitle}
                          </span>
                        </p>
                        <p className="text-[#AAA69F]">
                          Requested:{' '}
                          <span className="font-bold text-[#FF9B45]">
                            {msg.invitation.requestedSkillTitle}
                          </span>
                        </p>
                      </div>

                      {msg.invitation.note && (
                        <p className="text-xs text-[#AAA69F] italic">&ldquo;{msg.invitation.note}&rdquo;</p>
                      )}

                      {msg.invitation.status === 'pending' && !isMine ? (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            disabled={respondingMsgId === msg.id}
                            onClick={() => handleRespondInvite(msg.id, true)}
                            className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-full bg-[#65C995] hover:bg-[#53b984] text-[#171715] text-xs font-bold cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Accept
                          </button>
                          <button
                            type="button"
                            disabled={respondingMsgId === msg.id}
                            onClick={() => handleRespondInvite(msg.id, false)}
                            className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-full bg-[#2B2824] border border-[#37332E] text-[#F07878] text-xs font-bold cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Decline
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs font-bold capitalize text-[#65C995]">
                          Status: {msg.invitation.status}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        isMine
                          ? 'bg-[#FF9B45] text-[#171715] font-medium rounded-br-md'
                          : 'bg-[#2B2824] border border-[#37332E] text-[#F7F5F0] rounded-bl-md'
                      }`}
                    >
                      {msg.content}
                    </div>
                  )}

                  <span className="text-[11px] text-[#AAA69F] px-1">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="p-3.5 sm:p-4 border-t border-[#37332E] bg-[#1B1A18] shrink-0 space-y-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenShareResource}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#22211F] hover:bg-[#2B2824] border border-[#37332E] text-xs font-semibold text-[#AAA69F] hover:text-[#F7F5F0] transition-colors cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5 text-[#65C995]" />
            Share Resource
          </button>
          <button
            type="button"
            onClick={onOpenInviteSwap}
            className="sm:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#22211F] hover:bg-[#2B2824] border border-[#37332E] text-xs font-semibold text-[#FF9B45] transition-colors cursor-pointer"
          >
            <Repeat className="w-3.5 h-3.5" />
            Propose Swap
          </button>
        </div>

        <form onSubmit={handleSend} className="flex items-center gap-2.5">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Message ${partner.name}...`}
            className="flex-1 px-4 py-2.5 rounded-full bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] placeholder-[#AAA69F]/60 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] disabled:opacity-45 text-[#171715] transition-colors shrink-0 cursor-pointer"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
