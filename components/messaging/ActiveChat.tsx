'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Conversation, Message, User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useMessaging } from '@/context/MessagingContext';
import {
  Send,
  ArrowRightLeft,
  Link as LinkIcon,
  ShieldCheck,
  ChevronLeft,
  Calendar,
  Sparkles,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

interface ActiveChatProps {
  conversation: Conversation;
  messages: Message[];
  partner: User | null;
  onOpenInviteModal: () => void;
  onOpenResourceModal: () => void;
  onViewProfile: (user: User) => void;
  onBookSkillFromInvitation: (skillId: string, fallbackTitle: string) => void;
  onBackMobile?: () => void;
}

export default function ActiveChat({
  conversation,
  messages,
  partner,
  onOpenInviteModal,
  onOpenResourceModal,
  onViewProfile,
  onBookSkillFromInvitation,
  onBackMobile,
}: ActiveChatProps) {
  const { user } = useAuth();
  const { sendMessage, respondToSkillSwapInvitation } = useMessaging();
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [conversation.id]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    const res = sendMessage(conversation.id, trimmed, 'text');
    if (res.success) {
      setInputText('');
    }
    setIsSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Group messages by date
  const groupedMessages: { dateLabel: string; msgs: Message[] }[] = [];
  let currentDateLabel = '';
  let currentGroup: Message[] = [];

  messages.forEach((msg) => {
    const d = new Date(msg.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    let dateLabel = d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (d.toDateString() === today.toDateString()) {
      dateLabel = 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      dateLabel = 'Yesterday';
    }

    if (dateLabel !== currentDateLabel) {
      if (currentGroup.length > 0) {
        groupedMessages.push({ dateLabel: currentDateLabel, msgs: currentGroup });
      }
      currentDateLabel = dateLabel;
      currentGroup = [msg];
    } else {
      currentGroup.push(msg);
    }
  });

  if (currentGroup.length > 0) {
    groupedMessages.push({ dateLabel: currentDateLabel, msgs: currentGroup });
  }

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Active Conversation Header */}
      <div className="px-4 py-3 border-b border-slate-200/90 flex items-center justify-between gap-3 bg-white/90 backdrop-blur-xs z-10">
        <div className="flex items-center gap-3 min-w-0">
          {onBackMobile && (
            <button
              onClick={onBackMobile}
              className="md:hidden p-1.5 -ml-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Back to conversations"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Partner Avatar */}
          <div className="relative shrink-0">
            <img
              src={
                partner?.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(partner?.id || conversation.id)}`
              }
              alt={partner?.name || 'Partner'}
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
            />
            {partner?.isCollegeVerified && (
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center text-emerald-600 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 fill-emerald-100" />
              </span>
            )}
          </div>

          {/* Partner Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-slate-900 truncate">
                {partner?.name || 'Classmate'}
              </h2>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                Connected
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {partner?.university || 'Campus Peer'} • {partner?.major || 'Student'}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenInviteModal}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-colors flex items-center gap-1"
            title="Invite to a credit-neutral skill exchange"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Invite to Swap</span>
          </button>

          {partner && (
            <button
              onClick={() => onViewProfile(partner)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors hidden sm:inline-block"
            >
              View Profile
            </button>
          )}
        </div>
      </div>

      {/* Message History Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-[#fafbfb]">
        {groupedMessages.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-3.5">
            {/* Date Separator */}
            <div className="flex items-center justify-center my-3">
              <div className="px-3 py-0.5 rounded-full bg-slate-200/70 text-slate-600 text-[10px] font-semibold tracking-wider uppercase">
                {group.dateLabel}
              </div>
            </div>

            {/* Messages in Group */}
            {group.msgs.map((msg) => {
              const isOwn = msg.senderId === user?.id;
              const isSystem = msg.type === 'system';

              // System Message Rendering
              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className="px-3 py-1.5 rounded-xl bg-slate-100/90 text-slate-600 border border-slate-200 text-[11px] flex items-center gap-1.5 max-w-md text-center">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{msg.content}</span>
                    </div>
                  </div>
                );
              }

              // Normal & Rich Messages
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Left Avatar for Received */}
                  {!isOwn && (
                    <img
                      src={
                        msg.senderAvatar ||
                        partner?.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(msg.senderId)}`
                      }
                      alt={msg.senderName}
                      className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0 mb-1"
                    />
                  )}

                  {/* Message Bubble Container */}
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] rounded-2xl ${
                      isOwn
                        ? 'bg-slate-900 text-white rounded-br-xs shadow-xs'
                        : 'bg-white text-slate-900 border border-slate-200/90 rounded-bl-xs shadow-xs'
                    }`}
                  >
                    {/* Header with Sender Name on Received */}
                    {!isOwn && (
                      <div className="px-3.5 pt-2 pb-0.5 text-[11px] font-bold text-slate-700 flex items-center justify-between gap-2">
                        <span>{msg.senderName}</span>
                      </div>
                    )}

                    {/* 1. Skill Swap Invitation Card */}
                    {msg.type === 'skill_invitation' && msg.invitation && (
                      <div className="p-3.5 space-y-3">
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/50">
                          <span
                            className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                              isOwn ? 'text-emerald-300' : 'text-emerald-700'
                            }`}
                          >
                            <ArrowRightLeft className="w-4 h-4 text-emerald-500" />
                            Skill Swap Invitation
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              msg.invitation.status === 'accepted'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : msg.invitation.status === 'declined'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {msg.invitation.status.toUpperCase()}
                          </span>
                        </div>

                        {/* Swap Pairs Grid */}
                        <div className="grid grid-cols-1 gap-2 text-xs">
                          <div
                            className={`p-2 rounded-xl ${
                              isOwn
                                ? 'bg-white/10 text-slate-100'
                                : 'bg-emerald-50/80 border border-emerald-200/80 text-emerald-950'
                            }`}
                          >
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                              Offered Skill
                            </span>
                            <span className="font-semibold block">
                              {msg.invitation.offeredSkillTitle}
                            </span>
                          </div>

                          <div
                            className={`p-2 rounded-xl ${
                              isOwn
                                ? 'bg-white/10 text-slate-100'
                                : 'bg-teal-50/80 border border-teal-200/80 text-teal-950'
                            }`}
                          >
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                              In Exchange For
                            </span>
                            <span className="font-semibold block">
                              {msg.invitation.requestedSkillTitle}
                            </span>
                          </div>
                        </div>

                        {/* Personal Note */}
                        {msg.invitation.note && (
                          <p
                            className={`text-[11px] italic leading-relaxed ${
                              isOwn ? 'text-slate-300' : 'text-slate-600'
                            }`}
                          >
                            &ldquo;{msg.invitation.note}&rdquo;
                          </p>
                        )}

                        {/* Escrow Rule Reminder */}
                        <p
                          className={`text-[10px] ${
                            isOwn ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          Notice: Accepting coordinates the swap. Credits are reserved only when booking a confirmed session time.
                        </p>

                        {/* Invitation Action Buttons */}
                        <div className="pt-1 flex flex-wrap items-center gap-2">
                          {/* If Pending and recipient */}
                          {!isOwn && msg.invitation.status === 'pending' && (
                            <>
                              <button
                                onClick={() =>
                                  respondToSkillSwapInvitation(msg.id, true)
                                }
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Accept Swap
                              </button>
                              <button
                                onClick={() =>
                                  respondToSkillSwapInvitation(msg.id, false)
                                }
                                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {/* If Accepted: Allow proceeding to booking workflow! */}
                          {msg.invitation.status === 'accepted' && (
                            <button
                              onClick={() => {
                                if (msg.invitation) {
                                  onBookSkillFromInvitation(
                                    msg.invitation.requestedSkillId,
                                    msg.invitation.requestedSkillTitle
                                  );
                                }
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              Book Session Now →
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 2. Resource Link Message */}
                    {msg.type === 'resource' && (
                      <div className="p-3.5 space-y-2">
                        <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        {msg.resourceUrl && (
                          <a
                            href={msg.resourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                              isOwn
                                ? 'bg-white/10 border-white/20 hover:bg-white/15 text-white'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <LinkIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                              <div className="min-w-0">
                                <span className="text-xs font-semibold block truncate">
                                  {msg.resourceTitle || msg.resourceUrl}
                                </span>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {msg.resourceUrl}
                                </span>
                              </div>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* 3. Standard Text Message */}
                    {msg.type === 'text' && (
                      <div className="p-3.5 text-xs leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    )}

                    {/* Message Timestamp */}
                    <div
                      className={`px-3.5 pb-2 text-[10px] text-right ${
                        isOwn ? 'text-slate-400' : 'text-slate-400'
                      }`}
                    >
                      {formatMessageTime(msg.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bottom Bar */}
      <div className="p-3 border-t border-slate-200/90 bg-white space-y-2">
        {/* Quick Attachment Shortcuts */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenInviteModal}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-[11px] font-semibold flex items-center gap-1 transition-colors"
          >
            <ArrowRightLeft className="w-3 h-3 text-emerald-600" />
            Invite to Skill Swap
          </button>
          <button
            type="button"
            onClick={onOpenResourceModal}
            className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 text-[11px] font-semibold flex items-center gap-1 transition-colors"
          >
            <LinkIcon className="w-3 h-3 text-blue-600" />
            Share Resource Link
          </button>
        </div>

        {/* Text Input Row */}
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${partner?.name || 'classmate'}... (Enter to send, Shift+Enter for new line)`}
              className="w-full bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={!inputText.trim() || isSubmitting}
            className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
              inputText.trim() && !isSubmitting
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
