'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Skill, User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useMessaging } from '@/context/MessagingContext';
import ConversationList from '@/components/messaging/ConversationList';
import ActiveChat from '@/components/messaging/ActiveChat';
import ConversationDetails from '@/components/messaging/ConversationDetails';
import NewConversationModal from '@/components/messaging/NewConversationModal';
import ShareResourceModal from '@/components/messaging/ShareResourceModal';
import SkillSwapInviteModal from '@/components/messaging/SkillSwapInviteModal';
import StudentProfileModal from '@/components/StudentProfileModal';
import BookingModal from '@/components/BookingModal';
import { MessageSquare, Plus, X, Info } from 'lucide-react';

function MessagesContent() {
  const { user, isLoading: authLoading } = useAuth();
  const {
    conversations,
    activeConversationId,
    activeConversation,
    activeChatPartner,
    messages,
    toast,
    clearToast,
    selectConversation,
    startConversationWith,
    isLoading: messagingLoading,
  } = useMessaging();

  const searchParams = useSearchParams();
  const paramConvId = searchParams.get('conversationId');
  const paramStudentId = searchParams.get('studentId');

  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<User | null>(null);
  const [bookingSkill, setBookingSkill] = useState<Skill | null>(null);

  useEffect(() => {
    if (!user) return;
    if (paramConvId) {
      selectConversation(paramConvId);
    } else if (paramStudentId) {
      startConversationWith(paramStudentId);
    }
  }, [user, paramConvId, paramStudentId, selectConversation, startConversationWith]);

  const handleSelectConversation = (id: string) => {
    selectConversation(id);
    setMobileShowChat(true);
  };

  if (authLoading || messagingLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[#EFECE4]">
        <div className="w-full max-w-5xl h-[540px] rounded-2xl bg-[#F8F6F0] border border-[#4A4E57] animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-16 bg-[#EFECE4]">
        <div className="max-w-md w-full bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-8 text-center space-y-5">
          <MessageSquare className="w-10 h-10 text-[#2F4D96] mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-[#1F2227]">
              Sign in to SwapStudy Direct
            </h1>
            <p className="text-sm text-[#464B55]">
              Message connected peers, share study links, and propose mutual skill exchanges.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-sm font-bold"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2.5 rounded-full bg-[#E6E3DA] border border-[#4A4E57] text-[#1F2227] text-sm font-semibold"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#EFECE4]">
      {/* Messaging Toast Bar */}
      {toast && (
        <div
          className={`px-4 py-2.5 border-b border-[#CEC9BC] flex items-center justify-between gap-3 text-xs sm:text-sm font-medium shrink-0 ${
            toast.type === 'warning'
              ? 'bg-[#FBF0C9] text-[#5C4609]'
              : toast.type === 'success'
              ? 'bg-[#DCF2E4] text-[#195434]'
              : 'bg-[#F8F6F0] text-[#1F2227]'
          }`}
        >
          <span className="flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            {toast.message}
          </span>
          <button
            type="button"
            onClick={clearToast}
            className="p-1 rounded-lg hover:bg-[#1F2227]/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3-Panel Responsive Layout */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* Left: Conversation List */}
        <div
          className={`w-full md:w-[320px] xl:w-[340px] shrink-0 min-h-0 ${
            mobileShowChat && activeConversation ? 'hidden md:block' : 'block'
          }`}
        >
          <ConversationList
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={handleSelectConversation}
            onNewChat={() => setShowNewChatModal(true)}
          />
        </div>

        {/* Center: Active Chat */}
        <div
          className={`flex-1 min-w-0 min-h-0 ${
            !mobileShowChat && activeConversation ? 'hidden md:flex md:flex-col' : 'flex flex-col'
          }`}
        >
          {activeConversation && activeChatPartner ? (
            <ActiveChat
              conversation={activeConversation}
              partner={activeChatPartner}
              messages={messages}
              onBack={() => setMobileShowChat(false)}
              onOpenDetails={() => setShowDetailsDrawer(!showDetailsDrawer)}
              onOpenShareResource={() => setShowShareModal(true)}
              onOpenInviteSwap={() => setShowInviteModal(true)}
              onViewProfile={(student) => setViewingStudent(student)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-5 bg-[#EFECE4]">
              <div className="w-16 h-16 rounded-2xl bg-[#F8F6F0] border border-[#4A4E57] text-[#2F4D96] flex items-center justify-center">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h2 className="text-xl font-bold text-[#1F2227]">Select a conversation</h2>
                <p className="text-sm text-[#464B55]">
                  Choose a thread from the left or start a new conversation with a connected classmate.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewChatModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-sm font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Start New Chat
              </button>
            </div>
          )}
        </div>

        {/* Right: Peer Details (Desktop always when active; slide-over on smaller screens when toggled) */}
        {activeConversation && activeChatPartner && (
          <>
            <div className="hidden xl:block w-[300px] shrink-0 min-h-0">
              <ConversationDetails
                partner={activeChatPartner}
                onViewProfile={(student) => setViewingStudent(student)}
                onBookSkill={(skill) => setBookingSkill(skill)}
                onOpenInviteSwap={() => setShowInviteModal(true)}
              />
            </div>

            {showDetailsDrawer && (
              <div className="fixed inset-y-0 right-0 z-40 w-[300px] max-w-[90vw] xl:hidden shadow-2xl">
                <ConversationDetails
                  partner={activeChatPartner}
                  onViewProfile={(student) => {
                    setShowDetailsDrawer(false);
                    setViewingStudent(student);
                  }}
                  onBookSkill={(skill) => {
                    setShowDetailsDrawer(false);
                    setBookingSkill(skill);
                  }}
                  onOpenInviteSwap={() => {
                    setShowDetailsDrawer(false);
                    setShowInviteModal(true);
                  }}
                  onClose={() => setShowDetailsDrawer(false)}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showNewChatModal && (
        <NewConversationModal
          onClose={() => setShowNewChatModal(false)}
          onConversationStarted={(convId) => {
            selectConversation(convId);
            setMobileShowChat(true);
          }}
        />
      )}

      {showShareModal && activeConversationId && (
        <ShareResourceModal
          conversationId={activeConversationId}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {showInviteModal && activeConversationId && activeChatPartner && (
        <SkillSwapInviteModal
          conversationId={activeConversationId}
          partner={activeChatPartner}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {viewingStudent && (
        <StudentProfileModal
          student={viewingStudent}
          onClose={() => setViewingStudent(null)}
          onSelectSkill={(skill) => setBookingSkill(skill)}
        />
      )}

      {bookingSkill && (
        <BookingModal skill={bookingSkill} onClose={() => setBookingSkill(null)} />
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-6 bg-[#EFECE4]">
          <div className="w-full max-w-5xl h-[540px] rounded-2xl bg-[#F8F6F0] border border-[#4A4E57] animate-pulse" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
