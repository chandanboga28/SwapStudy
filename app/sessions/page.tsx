'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { Session, SessionStatus } from '@/types';
import SessionMeetingSection from '@/components/SessionMeetingSection';
import ReviewModal from '@/components/ReviewModal';
import {
  Calendar,
  Clock,
  Coins,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Repeat,
  Star,
  BookOpen,
  GraduationCap,
  X,
  ArrowUpRight,
} from 'lucide-react';

type RoleTab = 'learning' | 'teaching';
type StatusFilter = 'all' | SessionStatus;

const STATUS_BADGE_MAP: Record<
  SessionStatus,
  { label: string; className: string }
> = {
  pending: {
    label: 'Pending',
    className: 'bg-[#FBF0C9] text-[#5C4609] border-[#8C7228]',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-[#DCF2E4] text-[#195434] border-[#47785B]',
  },
  completed: {
    label: 'Completed',
    className: 'bg-[#DCEB8E] text-[#1F2227] border-[#4A4E57]',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-[#FCE7E3] text-[#8F2618] border-[#B34B39]',
  },
  declined: {
    label: 'Declined',
    className: 'bg-[#FCE7E3] text-[#8F2618] border-[#B34B39]',
  },
};

export default function SessionsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const {
    sessions,
    isLoading: appLoading,
    acceptSession,
    declineSession,
    cancelSession,
  } = useApp();

  const [activeTab, setActiveTab] = useState<RoleTab>('learning');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [reviewingSession, setReviewingSession] = useState<Session | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const currentUserId = user?.id;

  const learningSessions = useMemo(() => {
    if (!currentUserId) return [];
    return sessions
      .filter((s) => s.learnerId === currentUserId)
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  }, [sessions, currentUserId]);

  const teachingSessions = useMemo(() => {
    if (!currentUserId) return [];
    return sessions
      .filter((s) => s.teacherId === currentUserId)
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  }, [sessions, currentUserId]);

  const activeList = activeTab === 'learning' ? learningSessions : teachingSessions;

  const filteredSessions = useMemo(() => {
    if (statusFilter === 'all') return activeList;
    return activeList.filter((s) => s.status === statusFilter);
  }, [activeList, statusFilter]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const handleAction = async (
    sessionId: string,
    fn: () => Promise<{ success: boolean; error?: string }>,
    successMsg: string
  ) => {
    if (processingId) return;
    setProcessingId(sessionId);
    try {
      const res = await fn();
      if (!res.success) {
        showToast('error', res.error || 'Could not update session.');
      } else {
        showToast('success', successMsg);
      }
    } finally {
      setProcessingId(null);
    }
  };

  if (authLoading || appLoading) {
    return (
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-5">
        <div className="h-24 rounded-2xl bg-[#F8F6F0] border border-[#4A4E57] animate-pulse" />
        <div className="h-56 rounded-2xl bg-[#F8F6F0] border border-[#4A4E57] animate-pulse" />
        <div className="h-56 rounded-2xl bg-[#F8F6F0] border border-[#4A4E57] animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-8 text-center space-y-5">
          <Calendar className="w-10 h-10 text-[#2F4D96] mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-[#1F2227]">Sign in to view Sessions</h1>
            <p className="text-sm text-[#464B55]">
              Manage your learning bookings, teaching requests, and Google Meet rooms in one place.
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
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#2F4D96]">
            Schedule & Meetings
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1F2227]">
            My Sessions
          </h1>
          <p className="text-sm sm:text-base text-[#464B55]">
            Track requests, coordinate Google Meet rooms, and release escrow credits upon completion.
          </p>
        </div>

        <Link
          href="/skills"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-sm font-bold transition-colors shrink-0"
        >
          Book a Session
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border text-sm font-medium ${
            toast.type === 'error'
              ? 'bg-[#FCE7E3] border-[#B34B39] text-[#8F2618]'
              : 'bg-[#DCF2E4] border-[#47785B] text-[#195434]'
          }`}
        >
          <span className="flex items-center gap-2">
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            {toast.message}
          </span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 rounded-lg hover:bg-[#1F2227]/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Role Switcher + Status Filter Controls */}
      <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Role Tabs */}
        <div className="inline-flex p-1 rounded-full bg-[#EFECE4] border border-[#4A4E57] self-start">
          <button
            type="button"
            onClick={() => setActiveTab('learning')}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-colors cursor-pointer ${
              activeTab === 'learning'
                ? 'bg-[#3B5CA8] text-[#FFFFFF]'
                : 'text-[#464B55] hover:text-[#1F2227]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Learning ({learningSessions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('teaching')}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-colors cursor-pointer ${
              activeTab === 'teaching'
                ? 'bg-[#3B5CA8] text-[#FFFFFF]'
                : 'text-[#464B55] hover:text-[#1F2227]'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Teaching ({teachingSessions.length})
          </button>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            ['all', 'confirmed', 'pending', 'completed', 'cancelled', 'declined'] as StatusFilter[]
          ).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold capitalize transition-colors cursor-pointer ${
                statusFilter === status
                  ? 'bg-[#E6E3DA] border border-[#3B5CA8] text-[#2F4D96]'
                  : 'bg-[#EFECE4] border border-[#4A4E57] text-[#464B55] hover:text-[#1F2227]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions List */}
      {filteredSessions.length > 0 ? (
        <div className="space-y-5">
          {filteredSessions.map((session) => {
            const isTeacher = session.teacherId === user.id;
            const partnerName = isTeacher ? session.learnerName : session.teacherName;
            const partnerAvatar = isTeacher ? session.learnerAvatar : session.teacherAvatar;
            const statusMeta = STATUS_BADGE_MAP[session.status];

            return (
              <div
                key={session.id}
                className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-6 space-y-5"
              >
                {/* Top Metadata */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${statusMeta.className}`}
                      >
                        {statusMeta.label}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-[#E6E3DA] border border-[#4A4E57] text-xs font-semibold text-[#9E3922]">
                        {session.category}
                      </span>
                      {session.isMutualSwap && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#DCF2E4] border border-[#47785B] text-xs font-bold text-[#195434]">
                          <Repeat className="w-3 h-3" />
                          Mutual Swap
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-bold text-[#1F2227]">{session.skillTitle}</h2>

                    <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#464B55]">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#2F4D96]" />
                        {session.date}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#2F4D96]" />
                        {session.time} IST ({session.durationMinutes} min)
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-bold text-[#1F2227]">
                        <Coins className="w-4 h-4 text-[#2F4D96]" />
                        {session.credits} {session.credits === 1 ? 'Credit' : 'Credits'}
                      </span>
                    </div>
                  </div>

                  {/* Partner Chip */}
                  <div className="flex items-center gap-3 bg-[#E6E3DA] border border-[#4A4E57] rounded-xl px-4 py-2.5 shrink-0">
                    <img
                      src={partnerAvatar}
                      alt={partnerName}
                      className="w-9 h-9 rounded-full object-cover border border-[#4A4E57] bg-[#EFECE4]"
                    />
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#464B55]">
                        {isTeacher ? 'Learner' : 'Teacher'}
                      </p>
                      <p className="text-sm font-bold text-[#1F2227]">{partnerName}</p>
                    </div>
                  </div>
                </div>

                {/* Learner Notes */}
                {session.learnerNotes && (
                  <div className="bg-[#EFECE4] border border-[#4A4E57] rounded-xl px-4 py-3 text-sm text-[#464B55]">
                    <span className="font-bold text-[#1F2227]">Session Note: </span>
                    {session.learnerNotes}
                  </div>
                )}

                {/* Embedded Google Meet Section */}
                <SessionMeetingSection session={session} isTeacher={isTeacher} />

                {/* Completed Review Display */}
                {session.status === 'completed' && session.ratingGiven && (
                  <div className="bg-[#E6E3DA] border border-[#4A4E57] rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2 text-[#2F4D96] font-bold">
                      <Star className="w-4 h-4 text-[#8A6500] fill-[#F4DC82]" />
                      <span>Rated {session.ratingGiven}/5</span>
                    </div>
                    {session.reviewGiven && (
                      <p className="text-[#464B55] italic">&ldquo;{session.reviewGiven}&rdquo;</p>
                    )}
                  </div>
                )}

                {/* Action Footer */}
                {(session.status === 'pending' || session.status === 'confirmed') && (
                  <div className="pt-3 border-t border-[#CEC9BC] flex flex-wrap items-center justify-end gap-3">
                    {session.status === 'pending' && isTeacher && (
                      <>
                        <button
                          type="button"
                          disabled={processingId === session.id}
                          onClick={() =>
                            handleAction(
                              session.id,
                              () => declineSession(session.id),
                              'Request declined and credits refunded to learner.'
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#E6E3DA] hover:bg-[#DCD8CD] border border-[#4A4E57] text-xs sm:text-sm font-semibold text-[#8F2618] transition-colors cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          Decline
                        </button>
                        <button
                          type="button"
                          disabled={processingId === session.id}
                          onClick={() =>
                            handleAction(
                              session.id,
                              () => acceptSession(session.id),
                              'Session confirmed! Add your Google Meet link above.'
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#8AD7A8] hover:bg-[#77CA97] border-[1.5px] border-[#47785B] shadow-[0_2px_0_#47785B] text-[#18241C] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {processingId === session.id ? 'Confirming...' : 'Accept Request'}
                        </button>
                      </>
                    )}

                    {session.status === 'pending' && !isTeacher && (
                      <button
                        type="button"
                        disabled={processingId === session.id}
                        onClick={() =>
                          handleAction(
                            session.id,
                            () => cancelSession(session.id),
                            'Session cancelled and credit refunded to your wallet.'
                          )
                        }
                        className="px-4 py-2 rounded-full bg-[#E6E3DA] hover:bg-[#DCD8CD] border border-[#4A4E57] text-xs sm:text-sm font-semibold text-[#8F2618] transition-colors cursor-pointer"
                      >
                        {processingId === session.id ? 'Cancelling...' : 'Cancel & Refund'}
                      </button>
                    )}

                    {session.status === 'confirmed' && (
                      <>
                        <button
                          type="button"
                          disabled={processingId === session.id}
                          onClick={() =>
                            handleAction(
                              session.id,
                              () => cancelSession(session.id),
                              'Session cancelled safely and escrow settled.'
                            )
                          }
                          className="px-4 py-2 rounded-full bg-[#E6E3DA] hover:bg-[#DCD8CD] border border-[#4A4E57] text-xs sm:text-sm font-semibold text-[#8F2618] transition-colors cursor-pointer"
                        >
                          {processingId === session.id ? 'Cancelling...' : 'Cancel Session'}
                        </button>
                        {!isTeacher && (
                          <button
                            type="button"
                            onClick={() => setReviewingSession(session)}
                            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Complete & Review
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-12 text-center space-y-4">
          <Calendar className="w-9 h-9 text-[#2F4D96] mx-auto" />
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-[#1F2227]">No sessions in this view</h2>
            <p className="text-sm text-[#464B55] max-w-md mx-auto">
              {activeTab === 'learning'
                ? 'You have not booked any peer learning sessions matching this filter yet.'
                : 'No teaching sessions match this filter yet.'}
            </p>
          </div>
          <Link
            href={activeTab === 'learning' ? '/skills' : '/teach'}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-sm font-bold"
          >
            {activeTab === 'learning' ? 'Explore Skills' : 'Offer a Skill'}
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {reviewingSession && (
        <ReviewModal
          session={reviewingSession}
          onClose={() => setReviewingSession(null)}
          onCompleted={() => {
            showToast('success', 'Session completed! Credits released to the teacher and review saved.');
          }}
        />
      )}
    </div>
  );
}
