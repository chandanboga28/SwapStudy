'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useCommunity } from '@/context/CommunityContext';
import { useMessaging } from '@/context/MessagingContext';
import ConversationList from '@/components/messaging/ConversationList';
import ActiveChat from '@/components/messaging/ActiveChat';
import ConversationDetails from '@/components/messaging/ConversationDetails';
import NewConversationModal from '@/components/messaging/NewConversationModal';
import SkillSwapInviteModal from '@/components/messaging/SkillSwapInviteModal';
import ShareResourceModal from '@/components/messaging/ShareResourceModal';
import BookingModal from '@/components/BookingModal';
import StudentProfileModal from '@/components/StudentProfileModal';
import { User, Skill } from '@/types';
import {
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Plus,
  AlertCircle,
  ChevronLeft,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

function MessagesContent() {
  const { user, allUsers, isLoading: authLoading } = useAuth();
  const { skills } = useApp();
  const { currentCollege } = useCommunity();
  const {
    conversations,
    activeConversationId,
    activeConversation,
    activeChatPartner,
    messages,
    isLoading: messagingLoading,
    selectConversation,
    startConversationWith,
    toast,
    clearToast,
  } = useMessaging();

  const searchParams = useSearchParams();

  // Modals state
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [bookingSkill, setBookingSkill] = useState<Skill | null>(null);
  const [inspectingStudent, setInspectingStudent] = useState<User | null>(null);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const handledStudentParamRef = useRef<string | null>(null);

  // Handle query parameter for auto-selecting conversation or student
  useEffect(() => {
    const paramConvId = searchParams.get('conversationId');
    const paramStudentId = searchParams.get('studentId');

    if (paramConvId) {
      selectConversation(paramConvId);
      setIsMobileChatOpen(true);
      return;
    }

    if (
      paramStudentId &&
      user &&
      allUsers.some((u) => u.id === paramStudentId) &&
      handledStudentParamRef.current !== `${user.id}:${paramStudentId}`
    ) {
      handledStudentParamRef.current = `${user.id}:${paramStudentId}`;
      let cancelled = false;
      (async () => {
        const res = await startConversationWith(paramStudentId);
        if (!cancelled && res.success && res.conversationId) {
          setIsMobileChatOpen(true);
        }
      })();
      return () => {
        cancelled = true;
      };
    }
  }, [searchParams, user, allUsers, selectConversation, startConversationWith]);

  // Handle select conversation
  const handleSelectConv = (convId: string) => {
    selectConversation(convId);
    setIsMobileChatOpen(true);
  };

  // When an invitation is accepted, booking modal opens for that skill
  const handleBookFromInvitation = (skillId: string, fallbackTitle: string) => {
    const matched = skills.find((s) => s.id === skillId || s.title === fallbackTitle);
    if (matched) {
      setBookingSkill(matched);
    } else if (activeChatPartner) {
      // Create a fallback skill object if not directly listed
      const partnerSkill: Skill = {
        id: skillId || '',
        teacherId: activeChatPartner.id,
        teacherName: activeChatPartner.name,
        teacherAvatar: activeChatPartner.avatar,
        teacherUniversity: activeChatPartner.university,
        teacherMajor: activeChatPartner.major,
        teacherRating: activeChatPartner.repRating,
        title: fallbackTitle,
        category: 'Programming & Tech',
        level: 'All Levels',
        hourlyCredits: 1,
        description: `1-to-1 Skill Swap session with ${activeChatPartner.name} on ${fallbackTitle}.`,
        topics: [fallbackTitle, '1-on-1 Practice & Feedback'],
        sessionDurationMinutes: 60,
        reviewsCount: 0,
      };
      setBookingSkill(partnerSkill);
    }
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 min-h-[60vh] gap-2">
        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading SwapStudy Direct...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 min-h-[60vh]">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Student Sign-In Required</h2>
        <p className="text-xs text-slate-500 max-w-sm mb-4">
          SwapStudy Direct messaging is exclusively available for verified college students. Sign in to chat with peers.
        </p>
        <Link
          href="/login"
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-xs hover:bg-emerald-500 transition-colors"
        >
          Sign In to SwapStudy
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.75rem)] overflow-hidden bg-slate-100/70">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-18 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200 max-w-sm">
          <div
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg border flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : toast.type === 'warning'
                ? 'bg-rose-950 text-rose-100 border-rose-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {toast.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={clearToast}
              className="ml-2 text-white/70 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Subheader Network Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            SwapStudy Direct
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            {currentCollege.name} ({currentCollege.shortName}) Network
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="hidden sm:inline">
            Active Persona: <strong className="text-slate-800">{user.name}</strong>
          </span>
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors flex items-center gap-1 shadow-2xs"
          >
            <Plus className="w-3 h-3" />
            Start Messaging
          </button>
        </div>
      </div>

      {/* Three Panel Messaging Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel 1: Left Conversations Panel (Desktop visible, mobile conditional) */}
        <div
          className={`w-full md:w-80 lg:w-88 shrink-0 h-full ${
            isMobileChatOpen ? 'hidden md:flex' : 'flex'
          }`}
        >
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConv}
            onOpenNewMessageModal={() => setIsNewChatModalOpen(true)}
          />
        </div>

        {/* Panel 2: Middle Active Chat Panel (Desktop visible, mobile conditional) */}
        <div
          className={`flex-1 h-full flex flex-col ${
            !isMobileChatOpen ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversation ? (
            <ActiveChat
              conversation={activeConversation}
              messages={messages}
              partner={activeChatPartner}
              onOpenInviteModal={() => setIsInviteModalOpen(true)}
              onOpenResourceModal={() => setIsResourceModalOpen(true)}
              onViewProfile={(partnerUser) => setInspectingStudent(partnerUser)}
              onBookSkillFromInvitation={handleBookFromInvitation}
              onBackMobile={() => setIsMobileChatOpen(false)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white space-y-3 relative">
              {isMobileChatOpen && (
                <button
                  onClick={() => setIsMobileChatOpen(false)}
                  className="md:hidden absolute top-4 left-4 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Conversations
                </button>
              )}
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                {messagingLoading ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <MessageSquare className="w-7 h-7" />
                )}
              </div>
              <div className="max-w-sm">
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {messagingLoading ? 'Loading Conversations...' : 'Select a Conversation'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Choose a classmate from the left panel or start a new message to coordinate credit-neutral skill swaps.
                </p>
              </div>
              <button
                onClick={() => setIsNewChatModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Start Messaging
              </button>
            </div>
          )}
        </div>

        {/* Panel 3: Right Conversation Details Panel (Desktop lg+ visible) */}
        {activeConversation && activeChatPartner && (
          <div className="hidden lg:flex w-76 xl:w-80 shrink-0 h-full">
            <ConversationDetails
              partner={activeChatPartner}
              conversationId={activeConversation.id}
              onOpenInviteModal={() => setIsInviteModalOpen(true)}
              onBookSkill={(skill) => setBookingSkill(skill)}
              onViewProfile={(partnerUser) => setInspectingStudent(partnerUser)}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {isNewChatModalOpen && (
        <NewConversationModal
          onClose={() => setIsNewChatModalOpen(false)}
          onSelectStudent={() => {
            setIsMobileChatOpen(true);
          }}
          onViewProfile={(student) => setInspectingStudent(student)}
        />
      )}

      {isInviteModalOpen && activeChatPartner && activeConversation && (
        <SkillSwapInviteModal
          partner={activeChatPartner}
          conversationId={activeConversation.id}
          onClose={() => setIsInviteModalOpen(false)}
        />
      )}

      {isResourceModalOpen && activeConversation && (
        <ShareResourceModal
          conversationId={activeConversation.id}
          onClose={() => setIsResourceModalOpen(false)}
        />
      )}

      {bookingSkill && (
        <BookingModal
          skill={bookingSkill}
          onClose={() => setBookingSkill(null)}
          onSuccess={() => {
            setBookingSkill(null);
          }}
        />
      )}

      {inspectingStudent && (
        <StudentProfileModal
          student={inspectingStudent}
          onClose={() => setInspectingStudent(null)}
          availableSkills={skills}
        />
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12 text-slate-400 text-xs font-semibold">
          Loading SwapStudy Direct...
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
