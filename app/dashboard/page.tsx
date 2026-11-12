'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useMessaging } from '@/context/MessagingContext';
import { calculateSmartMatches } from '@/lib/matching';
import { getISTDateString } from '@/lib/timezone';
import { Skill, Session, SmartMatch, SkillSwapInvitation } from '@/types';
import SmartMatchCard from '@/components/SmartMatchCard';
import SessionMeetingSection from '@/components/SessionMeetingSection';
import BookingModal from '@/components/BookingModal';
import MutualSwapModal from '@/components/MutualSwapModal';
import AcceptSwapModal from '@/components/AcceptSwapModal';
import ReviewModal from '@/components/ReviewModal';
import StudentProfileModal from '@/components/StudentProfileModal';
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  Repeat,
  Coins,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Sparkles,
  Users,
  AlertCircle,
  Loader2,
  X,
  PlusCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, allUsers, isLoading: authLoading } = useAuth();
  const {
    skills,
    sessions,
    transactions,
    swapInvitations,
    isLoading: appLoading,
    acceptSession,
    declineSession,
    cancelSession,
    declineSwapProposal,
  } = useApp();
  const { totalUnreadCount } = useMessaging();

  const [matchFilter, setMatchFilter] = useState<'all' | 'mutual' | 'wishlist'>('all');
  const [bookingSkill, setBookingSkill] = useState<Skill | null>(null);
  const [swapMatch, setSwapMatch] = useState<SmartMatch | null>(null);
  const [acceptingInvitation, setAcceptingInvitation] = useState<SkillSwapInvitation | null>(null);
  const [reviewSession, setReviewSession] = useState<Session | null>(null);
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionAlert, setActionAlert] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const currentUserId = user?.id;
  const [todayIST, setTodayIST] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setTodayIST(getISTDateString(0));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const mySkills = useMemo(() => {
    if (!currentUserId) return [];
    return skills.filter((s) => s.teacherId === currentUserId);
  }, [skills, currentUserId]);

  const smartMatches = useMemo(() => {
    if (!user) return [];
    return calculateSmartMatches(user, allUsers, skills, sessions, swapInvitations);
  }, [user, allUsers, skills, sessions, swapInvitations]);

  const filteredMatches = useMemo(() => {
    if (matchFilter === 'mutual') {
      return smartMatches.filter((m) => m.matchType === 'mutual');
    }
    if (matchFilter === 'wishlist') {
      return smartMatches.filter((m) => m.matchType === 'one-way-learn');
    }
    return smartMatches;
  }, [smartMatches, matchFilter]);

  const incomingSwapInvitations = useMemo(() => {
    if (!currentUserId) return [];
    return swapInvitations.filter(
      (inv) => inv.recipientId === currentUserId && inv.status === 'pending'
    );
  }, [swapInvitations, currentUserId]);

  const sentPendingSwapInvitations = useMemo(() => {
    if (!currentUserId) return [];
    return swapInvitations.filter(
      (inv) => inv.senderId === currentUserId && inv.status === 'pending'
    );
  }, [swapInvitations, currentUserId]);

  const incomingRequests = useMemo(() => {
    if (!currentUserId) return [];
    return sessions.filter((s) => s.teacherId === currentUserId && s.status === 'pending');
  }, [sessions, currentUserId]);

  const pendingLearnerRequests = useMemo(() => {
    if (!currentUserId) return [];
    return sessions.filter((s) => s.learnerId === currentUserId && s.status === 'pending');
  }, [sessions, currentUserId]);

  const upcomingSessions = useMemo(() => {
    if (!currentUserId) return [];
    return sessions
      .filter(
        (s) =>
          (s.teacherId === currentUserId || s.learnerId === currentUserId) &&
          s.status === 'confirmed'
      )
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  }, [sessions, currentUserId]);

  const completedCount = useMemo(() => {
    if (!currentUserId) return 0;
    return sessions.filter(
      (s) =>
        (s.teacherId === currentUserId || s.learnerId === currentUserId) &&
        s.status === 'completed'
    ).length;
  }, [sessions, currentUserId]);

  const userTransactions = useMemo(() => {
    if (!currentUserId) return [];
    return transactions.filter((t) => t.userId === currentUserId);
  }, [transactions, currentUserId]);

  const totalEarned = useMemo(
    () => userTransactions.filter((t) => t.amount > 0).reduce((acc, t) => acc + t.amount, 0),
    [userTransactions]
  );

  const totalSpent = useMemo(
    () =>
      userTransactions
        .filter((t) => t.amount < 0)
        .reduce((acc, t) => acc + Math.abs(t.amount), 0),
    [userTransactions]
  );

  const viewingStudent = useMemo(
    () => allUsers.find((u) => u.id === viewingStudentId) || null,
    [allUsers, viewingStudentId]
  );

  const runAction = async (
    id: string,
    fn: () => Promise<{ success: boolean; error?: string }>,
    successMsg: string
  ) => {
    if (processingId) return;
    setProcessingId(id);
    setActionAlert(null);
    try {
      const res = await fn();
      if (!res.success) {
        setActionAlert({ type: 'error', text: res.error || 'Action could not be completed.' });
      } else {
        setActionAlert({ type: 'success', text: successMsg });
      }
    } finally {
      setProcessingId(null);
    }
  };

  if (authLoading || appLoading) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="h-56 rounded-2xl bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] animate-pulse" />
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 h-96 rounded-2xl bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] animate-pulse" />
          <div className="xl:col-span-4 h-96 rounded-2xl bg-[#25282E] border-[1.5px] border-[#4A4E57] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[4px_4px_0_#C5C0B4] rounded-2xl p-8 text-center space-y-5">
          <Sparkles className="w-10 h-10 text-[#2F4D96] mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-[#1F2227]">Sign in to your Dashboard</h1>
            <p className="text-sm text-[#464B55]">
              Access personalized mutual skill matches, confirmed sessions, and your escrow credit balance.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-xl bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-sm font-bold"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2.5 rounded-xl bg-[#E6E3DA] hover:bg-[#EFECE4] border-[1.5px] border-[#4A4E57] text-[#1F2227] text-sm font-bold"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const firstName = user.name.split(' ')[0] || user.name;
  const totalHoursCombined = user.totalHoursTaught + user.totalHoursLearned;
  const goalPercentage = Math.min(100, Math.round((totalHoursCombined / 10) * 100));

  const eqHeights = [
    { day: 'M', on: 3, color: 'bg-[#7EA5E8]' },
    { day: 'T', on: 4, color: 'bg-[#C2DA6D]' },
    { day: 'W', on: 2, color: 'bg-[#7EA5E8]' },
    { day: 'T', on: Math.min(5, Math.max(2, upcomingSessions.length + 2)), color: 'bg-[#E38469]' },
    { day: 'F', on: 3, color: 'bg-[#C2DA6D]' },
    { day: 'S', on: 4, color: 'bg-[#7EA5E8]' },
    { day: 'S', on: 1, color: 'bg-[#C2DA6D]' },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-7 sm:py-9 space-y-7">
      {/* Action Feedback Banner */}
      {actionAlert && (
        <div
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-[1.5px] text-sm font-bold ${
            actionAlert.type === 'error'
              ? 'bg-[#FCE7E3] border-[#B34B39] text-[#8F2618]'
              : 'bg-[#DCF2E4] border-[#47785B] text-[#195434]'
          }`}
        >
          <span className="flex items-center gap-2">
            {actionAlert.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            {actionAlert.text}
          </span>
          <button
            type="button"
            onClick={() => setActionAlert(null)}
            className="p-1 rounded-lg hover:bg-black/10 cursor-pointer"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Steel Cobalt Banner + 3 Tactile Zine Patch Cards */}
      <section className="hero-synth-cobalt bg-[#3B5CA8] text-[#FFFFFF] border-[1.5px] border-[#2C437A] rounded-2xl p-6 sm:p-7">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Welcome Headline & Action */}
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 bg-[#DCEB8E] text-[#1F2227] border-[1.5px] border-[#25282E] rounded-md px-2.5 py-1 font-mono text-[11px] font-bold">
              HELLO, {firstName.toUpperCase()}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#FFFFFF] tracking-tight leading-[1.12]">
              {upcomingSessions.length > 0
                ? `${upcomingSessions.length} upcoming ${
                    upcomingSessions.length === 1 ? 'session' : 'sessions'
                  } scheduled`
                : 'Trade Brainpower. Zero Tuition.'}
            </h1>
            <p className="text-sm text-[#EDF2FF] font-medium leading-relaxed">
              Patch directly into peer skill decks across coding, design, audio &amp; media.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/skills"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F4DC82] hover:bg-[#EDD066] border-[1.5px] border-[#25282E] shadow-[0_2.5px_0_#25282E] text-[#1F2227] text-xs font-mono font-bold transition-colors"
              >
                EXPLORE_SKILLS
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                href="/teach"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F8F6F0] hover:bg-[#EFECE4] border-[1.5px] border-[#25282E] shadow-[0_2.5px_0_#25282E] text-[#1F2227] text-xs font-mono font-bold transition-colors"
              >
                + OFFER_SKILL
              </Link>
            </div>
          </div>

          {/* 3 Tactile Matte Zine Patch Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Link
              href="/teach"
              className="bg-[#E3EDA3] text-[#1F2227] border-[1.5px] border-[#25282E] shadow-[3.5px_3.5px_0_#25282E] rounded-2xl p-5 flex flex-col justify-between min-h-[154px] hover:-translate-y-0.5 transition-transform"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#25282E] text-[#DCEB8E]">
                  CH-01
                </span>
                <BookOpen className="w-5 h-5 text-[#1F2227]" />
              </div>
              <div className="pt-4">
                <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#383C42]">
                  Your Listings
                </p>
                <p className="text-2xl font-extrabold mt-0.5 tabular-nums text-[#1F2227]">
                  {mySkills.length} Active
                </p>
              </div>
            </Link>

            <a
              href="#smart-matches"
              className="bg-[#F4DC82] text-[#1F2227] border-[1.5px] border-[#25282E] shadow-[3.5px_3.5px_0_#25282E] rounded-2xl p-5 flex flex-col justify-between min-h-[154px] hover:-translate-y-0.5 transition-transform"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#3B5CA8] text-[#FFFFFF]">
                  CH-02
                </span>
                <Repeat className="w-5 h-5 text-[#1F2227]" />
              </div>
              <div className="pt-4">
                <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#383C42]">
                  Smart Matches
                </p>
                <p className="text-2xl font-extrabold mt-0.5 tabular-nums text-[#1F2227]">
                  {smartMatches.length} Peers
                </p>
              </div>
            </a>

            <Link
              href="/credits"
              className="bg-[#F8F6F0] text-[#1F2227] border-[1.5px] border-[#25282E] shadow-[3.5px_3.5px_0_#25282E] rounded-2xl p-5 flex flex-col justify-between min-h-[154px] hover:-translate-y-0.5 transition-transform"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#C25138] text-[#FFFFFF]">
                  CH-03
                </span>
                <Coins className="w-5 h-5 text-[#1F2227]" />
              </div>
              <div className="pt-4">
                <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#464B55]">
                  Credit Balance
                </p>
                <p className="text-2xl font-extrabold mt-0.5 tabular-nums text-[#1F2227]">
                  {user.credits} Credits
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Main 12-Column Asymmetrical Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-7 items-start">
        {/* LEFT COLUMN (8 Cols) */}
        <div className="xl:col-span-8 space-y-7">
          {/* Exchange Activity Module */}
          <section className="card-subtle bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#2F4D96]">
                  EXCHANGE_PROGRESS
                </p>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#1F2227] mt-0.5">
                  Campus Activity & Readiness
                </h2>
              </div>

              <div className="flex items-center gap-3 min-w-[190px]">
                <div className="flex-1 h-3 rounded-full bg-[#E6E3DA] overflow-hidden border border-[#4A4E57]">
                  <div
                    className="h-full bg-[#3B5CA8] rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(8, goalPercentage)}%` }}
                  />
                </div>
                <span className="font-mono text-xs font-bold text-[#1F2227] tabular-nums shrink-0">
                  {totalHoursCombined}h total
                </span>
              </div>
            </div>

            <div className="divide-y divide-[#CEC9BC]">
              <Link
                href="/teach"
                className="py-3.5 flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#DCEB8E] border-[1.5px] border-[#4A4E57] flex items-center justify-center text-[#1F2227] shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-bold text-[#1F2227] group-hover:text-[#2F4D96] transition-colors">
                      Teaching Portfolio
                    </p>
                    <p className="text-xs sm:text-sm text-[#464B55]">
                      {mySkills.length} active skill listings · {user.totalHoursTaught}h taught
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-[#2F4D96] group-hover:underline inline-flex items-center gap-1 shrink-0">
                  MANAGE
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>

              <Link
                href="/sessions"
                className="py-3.5 flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#DCF2E4] border-[1.5px] border-[#47785B] flex items-center justify-center text-[#195434] shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-bold text-[#1F2227] group-hover:text-[#2F4D96] transition-colors">
                      Completed & Active Sessions
                    </p>
                    <p className="text-xs sm:text-sm text-[#464B55]">
                      {completedCount} completed · {upcomingSessions.length} upcoming confirmed
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-[#2F4D96] group-hover:underline inline-flex items-center gap-1 shrink-0">
                  OPEN
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>

              <Link
                href="/messages"
                className="py-3.5 flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#F4DC82] border-[1.5px] border-[#4A4E57] flex items-center justify-center text-[#1F2227] shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-bold text-[#1F2227] group-hover:text-[#2F4D96] transition-colors">
                      SwapStudy Direct Inbox
                    </p>
                    <p className="text-xs sm:text-sm text-[#464B55]">
                      {totalUnreadCount > 0
                        ? `${totalUnreadCount} unread message(s) waiting`
                        : 'Coordinate topics and schedules directly with peers'}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-[#2F4D96] group-hover:underline inline-flex items-center gap-1 shrink-0">
                  INBOX
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>
          </section>

          {/* Mutual Swap Proposals (Incoming + Sent Pending) */}
          {(incomingSwapInvitations.length > 0 || sentPendingSwapInvitations.length > 0) && (
            <section className="card-subtle bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#195434]">
                    <Repeat className="w-3.5 h-3.5" />
                    RECIPROCAL_SWAPS
                  </span>
                  <h2 className="text-xl font-extrabold text-[#1F2227] mt-0.5">
                    Pending Mutual Swap Proposals
                  </h2>
                </div>
              </div>

              <div className="space-y-3.5">
                {incomingSwapInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="bg-[#E6E3DA] border-[1.5px] border-[#4A4E57] rounded-xl p-5 space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            inv.senderAvatar ||
                            `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(
                              inv.senderName || inv.senderId
                            )}`
                          }
                          alt={inv.senderName || 'Student'}
                          className="w-10 h-10 rounded-lg object-cover border-[1.5px] border-[#4A4E57] bg-[#F8F6F0]"
                        />
                        <div>
                          <p className="text-sm font-bold text-[#1F2227]">
                            {inv.senderName || 'Campus Peer'} proposed a swap
                          </p>
                          <p className="text-xs font-medium text-[#464B55]">
                            {inv.credits} {inv.credits === 1 ? 'Credit' : 'Credits'} balanced escrow
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-[#C25138] border border-[#7A3222] font-mono text-xs font-bold text-[#FFFFFF]">
                        ACTION_NEEDED
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="bg-[#F8F6F0] border border-[#4A4E57] rounded-xl p-3">
                        <p className="font-mono text-[11px] font-bold text-[#464B55] uppercase">
                          They offer to teach
                        </p>
                        <p className="font-bold text-[#1F2227] mt-0.5">{inv.offeredSkillTitle}</p>
                      </div>
                      <div className="bg-[#F8F6F0] border border-[#4A4E57] rounded-xl p-3">
                        <p className="font-mono text-[11px] font-bold text-[#2F4D96] uppercase">
                          They want to learn
                        </p>
                        <p className="font-bold text-[#1F2227] mt-0.5">{inv.requestedSkillTitle}</p>
                      </div>
                    </div>

                    {inv.note && (
                      <p className="text-xs sm:text-sm text-[#363940] italic border-l-2 border-[#3B5CA8] pl-3">
                        &ldquo;{inv.note}&rdquo;
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setAcceptingInvitation(inv)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Accept & Schedule Both
                      </button>
                      <button
                        type="button"
                        disabled={processingId === inv.id}
                        onClick={() =>
                          runAction(
                            inv.id,
                            () => declineSwapProposal(inv.id),
                            'Swap proposal declined.'
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FCE7E3] hover:bg-[#F8D4CD] border-[1.5px] border-[#B34B39] text-[#8F2618] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                      >
                        {processingId === inv.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        Decline
                      </button>
                    </div>
                  </div>
                ))}

                {sentPendingSwapInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="bg-[#EFECE4] border border-[#4A4E57] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#1F2227]">
                        Swap proposal sent to {inv.recipientName || 'peer'}
                      </p>
                      <p className="text-xs text-[#464B55] mt-0.5">
                        Offering <span className="font-semibold text-[#1F2227]">{inv.offeredSkillTitle}</span> for{' '}
                        <span className="font-semibold text-[#2F4D96]">{inv.requestedSkillTitle}</span>
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-md bg-[#FBF0C9] border border-[#8C7228] text-xs font-mono font-bold text-[#5C4609]">
                      AWAITING_SCHEDULE
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Pending Direct Session Requests */}
          {(incomingRequests.length > 0 || pendingLearnerRequests.length > 0) && (
            <section className="card-subtle bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] rounded-2xl p-6 space-y-5">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#9E3922]">
                  REQ_IN // PENDING_APPROVALS
                </p>
                <h2 className="text-xl font-extrabold text-[#1F2227] mt-0.5">
                  Session Requests
                </h2>
              </div>

              <div className="space-y-3">
                {incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-[#E6E3DA] border-[1.5px] border-[#4A4E57] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <img
                        src={req.learnerAvatar}
                        alt={req.learnerName}
                        className="w-10 h-10 rounded-lg object-cover border-[1.5px] border-[#4A4E57] bg-[#F8F6F0] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#1F2227] truncate">
                          {req.learnerName} requested {req.skillTitle}
                        </p>
                        <p className="text-xs font-medium text-[#464B55] flex items-center gap-2 mt-1">
                          <Calendar className="w-3.5 h-3.5 text-[#2F4D96]" />
                          {req.date} at {req.time} IST · +{req.credits} Cr
                        </p>
                        {req.learnerNotes && (
                          <p className="text-xs text-[#363940] mt-1.5 italic line-clamp-2">
                            &ldquo;{req.learnerNotes}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={processingId === req.id}
                        onClick={() =>
                          runAction(
                            req.id,
                            () => acceptSession(req.id),
                            'Session confirmed! Share a Google Meet link in Upcoming Sessions.'
                          )
                        }
                        className="px-4 py-2 rounded-xl bg-[#8AD7A8] hover:bg-[#77CA97] border-[1.5px] border-[#47785B] shadow-[0_2px_0_#47785B] text-[#18241C] text-xs font-mono font-bold transition-colors cursor-pointer"
                      >
                        {processingId === req.id ? 'WAIT...' : 'ACCEPT [✓]'}
                      </button>
                      <button
                        type="button"
                        disabled={processingId === req.id}
                        onClick={() =>
                          runAction(
                            req.id,
                            () => declineSession(req.id),
                            'Session request declined and credits refunded.'
                          )
                        }
                        className="px-4 py-2 rounded-xl bg-[#FCE7E3] hover:bg-[#F8D4CD] border-[1.5px] border-[#B34B39] text-[#8F2618] text-xs font-mono font-bold transition-colors cursor-pointer"
                      >
                        DECLINE
                      </button>
                    </div>
                  </div>
                ))}

                {pendingLearnerRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-[#EFECE4] border border-[#4A4E57] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={req.teacherAvatar}
                        alt={req.teacherName}
                        className="w-10 h-10 rounded-lg object-cover border-[1.5px] border-[#4A4E57] bg-[#F8F6F0] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#1F2227] truncate">
                          Waiting on {req.teacherName} · {req.skillTitle}
                        </p>
                        <p className="text-xs font-medium text-[#464B55] mt-0.5">
                          {req.date} at {req.time} IST · {req.credits} Cr in escrow
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={processingId === req.id}
                      onClick={() =>
                        runAction(
                          req.id,
                          () => cancelSession(req.id),
                          'Booking cancelled and credit refunded to your wallet.'
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-[#FCE7E3] hover:bg-[#F8D4CD] border-[1.5px] border-[#B34B39] text-xs font-bold text-[#8F2618] transition-colors shrink-0 cursor-pointer"
                    >
                      {processingId === req.id ? 'Cancelling...' : 'Cancel & Refund'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Smart Skill Matching Engine */}
          <section id="smart-matches" className="space-y-5 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#2F4D96]">
                  PERSONALIZED_DISCOVERY
                </p>
                <h2 className="text-2xl font-extrabold text-[#1F2227] mt-0.5">
                  Recommended Peer Matches
                </h2>
              </div>

              <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-[#E6E3DA] border-[1.5px] border-[#4A4E57]">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'mutual', label: 'Mutual Swaps' },
                  { key: 'wishlist', label: 'Direct Learn' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setMatchFilter(tab.key as 'all' | 'mutual' | 'wishlist')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                      matchFilter === tab.key
                        ? 'bg-[#DCEB8E] border border-[#4A4E57] text-[#1F2227]'
                        : 'text-[#464B55] hover:text-[#1F2227]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {user.skillsToTeach.length === 0 || user.skillsToLearn.length === 0 ? (
              <div className="card-subtle bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#1F2227]">
                    Complete your skill tags to unlock better mutual matches
                  </h3>
                  <p className="text-sm text-[#464B55]">
                    Add skills you can teach and subjects you want to learn in your profile.
                  </p>
                </div>
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] text-[#FFFFFF] text-sm font-bold shrink-0"
                >
                  Update Profile
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            ) : null}

            {filteredMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredMatches.map((match) => (
                  <SmartMatchCard
                    key={match.candidate.id}
                    match={match}
                    onRequestExchange={(m) => {
                      if (m.matchedListing) {
                        setBookingSkill(m.matchedListing);
                      } else {
                        setViewingStudentId(m.candidate.id);
                      }
                    }}
                    onProposeSwap={(m) => setSwapMatch(m)}
                    onViewProfile={(id) => setViewingStudentId(id)}
                  />
                ))}
              </div>
            ) : (
              <div className="card-subtle bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] rounded-2xl p-10 text-center space-y-4">
                <Users className="w-8 h-8 text-[#2F4D96] mx-auto" />
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-[#1F2227]">No matches in this filter yet</h3>
                  <p className="text-sm text-[#464B55] max-w-md mx-auto">
                    Browse the live marketplace to book directly or expand your learning wishlist tags in your profile.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                  <Link
                    href="/skills"
                    className="px-5 py-2.5 rounded-xl bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] text-[#FFFFFF] text-sm font-bold"
                  >
                    Browse All Skills
                  </Link>
                  <Link
                    href="/teach"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#E6E3DA] hover:bg-[#EFECE4] border-[1.5px] border-[#4A4E57] text-sm font-bold text-[#1F2227]"
                  >
                    <PlusCircle className="w-4 h-4 text-[#9E3922]" />
                    Offer a Skill
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN (4 Cols — Matte Slate OLED Telemetry & Upcoming Sessions + Wallet) */}
        <div className="xl:col-span-4 space-y-7">
          {/* Matte Slate OLED Telemetry Console */}
          <section className="synth-oled bg-[#25282E] text-[#F2EFE8] border-[1.5px] border-[#4A4E57] rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-dashed border-[#3D424C] font-mono text-[11px] font-bold">
              <span className="flex items-center gap-2 text-[#F39B83]">
                <span className="w-2 h-2 rounded-full bg-[#F39B83]" />
                LIVE_TELEMETRY
              </span>
              <span className="text-[#C4C8D1]">CAMPUS_NET v2.6</span>
            </div>

            {/* 3-Cell LED Readout */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-[#2F333B] border border-[#424752] rounded-xl p-3">
                <p className="font-mono text-[10px] font-bold text-[#C4C8D1]">CREDITS</p>
                <p className="font-mono text-xl font-extrabold text-[#CCE27A] mt-0.5 tabular-nums">
                  {user.credits}h
                </p>
              </div>
              <div className="bg-[#2F333B] border border-[#424752] rounded-xl p-3">
                <p className="font-mono text-[10px] font-bold text-[#C4C8D1]">SWAPS</p>
                <p className="font-mono text-xl font-extrabold text-[#7AD6A1] mt-0.5 tabular-nums">
                  {String(completedCount).padStart(2, '0')}
                </p>
              </div>
              <div className="bg-[#2F333B] border border-[#424752] rounded-xl p-3">
                <p className="font-mono text-[10px] font-bold text-[#C4C8D1]">RATING</p>
                <p className="font-mono text-xl font-extrabold text-[#EED073] mt-0.5 tabular-nums">
                  {user.repRating > 0 ? user.repRating.toFixed(1) : 'NEW'}★
                </p>
              </div>
            </div>

            {/* Weekly LED Bar Meter */}
            <div className="bg-[#2D3138] border border-[#424752] rounded-xl p-3.5">
              <div className="flex items-center justify-between font-mono text-[10px] font-bold mb-2.5">
                <span className="text-[#C4C8D1]">WEEKLY_OUTPUT</span>
                <span className="text-[#CCE27A]">{totalHoursCombined} HRS LOGGED</span>
              </div>
              <div className="grid grid-cols-7 gap-2 items-end h-14">
                {eqHeights.map((bar, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end">
                    <div className="flex flex-col gap-1 w-full">
                      {[5, 4, 3, 2, 1].map((seg) => (
                        <div
                          key={seg}
                          className={`h-1.5 rounded-xs ${
                            seg <= bar.on ? bar.color : 'bg-[#3B4049]'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-mono text-[10px] font-bold text-[#C4C8D1]">{bar.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Sessions List inside OLED Deck */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-extrabold text-[#F2EFE8]">Upcoming Sessions</h2>
                <Link
                  href="/sessions"
                  className="font-mono text-xs font-bold text-[#CCE27A] hover:underline"
                >
                  SEE_ALL -&gt;
                </Link>
              </div>

              {upcomingSessions.length > 0 ? (
                <div className="space-y-3.5">
                  {upcomingSessions.slice(0, 3).map((session) => {
                    const isTeacher = session.teacherId === user.id;
                    const partnerName = isTeacher ? session.learnerName : session.teacherName;
                    const partnerAvatar = isTeacher ? session.learnerAvatar : session.teacherAvatar;
                    const isToday = session.date === todayIST;

                    return (
                      <div
                        key={session.id}
                        className="bg-[#2E3239] border border-[#434853] border-l-[3.5px] border-l-[#E38469] rounded-xl p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-[#EED073]">
                            {isToday ? 'TODAY' : session.date}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                              isTeacher
                                ? 'bg-[#DCEB8E] text-[#1F2227]'
                                : 'bg-[#7AD6A1] text-[#18241C]'
                            }`}
                          >
                            {isTeacher ? 'TEACHING' : 'LEARNING'}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-[#F2EFE8] leading-snug">
                            {session.skillTitle}
                          </h3>
                          <p className="text-xs font-medium text-[#C4C8D1] flex items-center gap-1.5 mt-1">
                            <Clock className="w-3.5 h-3.5 text-[#C4C8D1]" />
                            {session.time} IST · {session.durationMinutes} min
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <img
                            src={partnerAvatar}
                            alt={partnerName}
                            className="w-7 h-7 rounded-md object-cover border border-[#5D616A] bg-[#25282E]"
                          />
                          <span className="text-xs font-semibold text-[#F2EFE8] truncate">
                            with {partnerName}
                          </span>
                        </div>

                        <SessionMeetingSection session={session} isTeacher={isTeacher} compact />

                        <div className="flex items-center gap-2 pt-1">
                          {!isTeacher && (
                            <button
                              type="button"
                              onClick={() => setReviewSession(session)}
                              className="flex-1 py-2 rounded-lg bg-[#8AD7A8] hover:bg-[#77CA97] border border-[#47785B] text-[#18241C] text-xs font-mono font-bold transition-colors cursor-pointer"
                            >
                              MARK_COMPLETE
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={processingId === session.id}
                            onClick={() =>
                              runAction(
                                session.id,
                                () => cancelSession(session.id),
                                'Session cancelled and credits refunded safely.'
                              )
                            }
                            className="px-3.5 py-2 rounded-lg bg-[#3A3F48] hover:bg-[#494F5A] border border-[#5D616A] text-xs font-bold text-[#F79B8E] transition-colors cursor-pointer"
                          >
                            {processingId === session.id ? '...' : 'Cancel'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[#2E3239] border border-[#434853] rounded-xl p-5 text-center space-y-3">
                  <Calendar className="w-7 h-7 text-[#CCE27A] mx-auto" />
                  <p className="text-sm font-bold text-[#F2EFE8]">No confirmed sessions yet</p>
                  <p className="text-xs text-[#C4C8D1] leading-relaxed">
                    Request a skill from the marketplace or accept a proposal to fill your schedule.
                  </p>
                  <Link
                    href="/skills"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3B5CA8] hover:bg-[#314E91] border border-[#2A3F75] text-[#FFFFFF] text-xs font-mono font-bold"
                  >
                    BROWSE_SKILLS
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* Credit Wallet Summary Card */}
          <section className="card-subtle bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-extrabold text-[#1F2227]">Credit Wallet</h2>
              <Link
                href="/credits"
                className="font-mono text-xs font-bold text-[#2F4D96] hover:underline"
              >
                FULL_LEDGER
              </Link>
            </div>

            <div className="bg-[#E6E3DA] border-[1.5px] border-[#4A4E57] rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-mono text-[11px] font-bold text-[#464B55] uppercase">
                  Available Balance
                </p>
                <p className="text-3xl font-extrabold text-[#1F2227] mt-0.5 tabular-nums">
                  {user.credits}{' '}
                  <span className="text-sm font-mono font-bold text-[#2F4D96]">Cr</span>
                </p>
              </div>
              <div className="text-right font-mono text-xs space-y-1">
                <p className="text-[#195434] font-bold">+{totalEarned} EARNED</p>
                <p className="text-[#464B55] font-bold">-{totalSpent} SPENT</p>
              </div>
            </div>

            {userTransactions.length > 0 ? (
              <div className="space-y-2.5">
                {userTransactions.slice(0, 4).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-3 py-2 border-b border-[#CEC9BC] last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#1F2227] truncate">{tx.title}</p>
                      <p className="text-xs text-[#464B55] truncate">{tx.date}</p>
                    </div>
                    <span
                      className={`font-mono text-sm font-extrabold tabular-nums shrink-0 ${
                        tx.amount >= 0 ? 'text-[#195434]' : 'text-[#8F2618]'
                      }`}
                    >
                      {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#464B55]">No wallet transactions recorded yet.</p>
            )}
          </section>
        </div>
      </div>

      {/* Modals */}
      {bookingSkill && (
        <BookingModal skill={bookingSkill} onClose={() => setBookingSkill(null)} />
      )}
      {swapMatch && (
        <MutualSwapModal match={swapMatch} onClose={() => setSwapMatch(null)} />
      )}
      {acceptingInvitation && (
        <AcceptSwapModal
          invitation={acceptingInvitation}
          onClose={() => setAcceptingInvitation(null)}
        />
      )}
      {reviewSession && (
        <ReviewModal session={reviewSession} onClose={() => setReviewSession(null)} />
      )}
      {viewingStudent && (
        <StudentProfileModal
          student={viewingStudent}
          onClose={() => setViewingStudentId(null)}
          onSelectSkill={(skill) => setBookingSkill(skill)}
        />
      )}
    </div>
  );
}
