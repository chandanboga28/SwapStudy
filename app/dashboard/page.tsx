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
        <div className="h-56 rounded-3xl bg-[#22211F] border border-[#37332E] animate-pulse" />
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 h-96 rounded-2xl bg-[#22211F] border border-[#37332E] animate-pulse" />
          <div className="xl:col-span-4 h-96 rounded-2xl bg-[#22211F] border border-[#37332E] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-[#22211F] border border-[#37332E] rounded-2xl p-8 text-center space-y-5">
          <Sparkles className="w-10 h-10 text-[#FF9B45] mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-[#F7F5F0]">Sign in to your Dashboard</h1>
            <p className="text-sm text-[#AAA69F]">
              Access personalized mutual skill matches, confirmed sessions, and your escrow credit balance.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-sm font-bold"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2.5 rounded-full bg-[#2B2824] border border-[#37332E] text-[#F7F5F0] text-sm font-semibold"
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

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-7 sm:py-9 space-y-7">
      {/* Action Feedback Banner */}
      {actionAlert && (
        <div
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border text-sm font-medium ${actionAlert.type === 'error'
            ? 'bg-[#F07878]/10 border-[#F07878]/30 text-[#F07878]'
            : 'bg-[#65C995]/10 border-[#65C995]/30 text-[#65C995]'
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
            className="p-1 rounded-lg hover:bg-black/20 cursor-pointer"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Editorial Bronze Banner */}
      <section className="hero-bronze rounded-3xl p-6 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-center">
          {/* Welcome Headline & Action */}
          <div className="lg:col-span-5 space-y-5">
            <p className="text-sm font-semibold text-[#F7F5F0]/85">
              Hello, {firstName}
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F7F5F0] tracking-tight leading-[1.15]">
              {upcomingSessions.length > 0
                ? `${upcomingSessions.length} upcoming ${upcomingSessions.length === 1 ? 'session' : 'sessions'
                } scheduled`
                : 'Ready for your next peer skill exchange'}
            </h1>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/skills"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-sm font-bold transition-colors"
              >
                Explore Skills
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                href="/teach"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#171715]/35 hover:bg-[#171715]/55 border border-[#F7F5F0]/20 text-[#F7F5F0] text-sm font-semibold transition-colors"
              >
                Offer a Skill
              </Link>
            </div>
          </div>

          {/* 3 High-Contrast Editorial Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Link
              href="/teach"
              className="bg-[#F7F5F0] text-[#171715] rounded-2xl p-5 flex flex-col justify-between min-h-[154px] hover:-translate-y-0.5 transition-transform"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#7D5736]">01</span>
                <BookOpen className="w-5 h-5 text-[#171715]" />
              </div>
              <div className="pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#171715]/60">
                  Your Listings
                </p>
                <p className="text-2xl font-extrabold mt-0.5 tabular-nums">
                  {mySkills.length} Active
                </p>
              </div>
            </Link>

            <a
              href="#smart-matches"
              className="bg-[#F5B66B] text-[#171715] rounded-2xl p-5 flex flex-col justify-between min-h-[154px] hover:-translate-y-0.5 transition-transform"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#171715]/70">02</span>
                <Repeat className="w-5 h-5 text-[#171715]" />
              </div>
              <div className="pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#171715]/70">
                  Smart Matches
                </p>
                <p className="text-2xl font-extrabold mt-0.5 tabular-nums">
                  {smartMatches.length} Peers
                </p>
              </div>
            </a>

            <Link
              href="/credits"
              className="bg-[#E6DFD5] text-[#171715] rounded-2xl p-5 flex flex-col justify-between min-h-[154px] hover:-translate-y-0.5 transition-transform"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#7D5736]">03</span>
                <Coins className="w-5 h-5 text-[#171715]" />
              </div>
              <div className="pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#171715]/60">
                  Credit Balance
                </p>
                <p className="text-2xl font-extrabold mt-0.5 tabular-nums">
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
          {/* Exchange Activity Module (Matches LearnWell Module Progress Card) */}
          <section className="bg-[#22211F] border border-[#37332E] rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#AAA69F]">
                  Exchange Progress
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-[#F7F5F0] mt-0.5">
                  Campus Activity & Readiness
                </h2>
              </div>

              <div className="flex items-center gap-3 min-w-[180px]">
                <div className="flex-1 h-2.5 rounded-full bg-[#2B2824] overflow-hidden border border-[#37332E]">
                  <div
                    className="h-full bg-[#FF9B45] rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(8, goalPercentage)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-[#F7F5F0] tabular-nums shrink-0">
                  {totalHoursCombined}h total
                </span>
              </div>
            </div>

            <div className="divide-y divide-[#37332E]">
              <Link
                href="/teach"
                className="py-3.5 flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#2B2824] border border-[#37332E] flex items-center justify-center text-[#FF9B45] shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-bold text-[#F7F5F0] group-hover:text-[#FF9B45] transition-colors">
                      Teaching Portfolio
                    </p>
                    <p className="text-xs sm:text-sm text-[#AAA69F]">
                      {mySkills.length} active skill listings · {user.totalHoursTaught}h taught
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#AAA69F] group-hover:text-[#F7F5F0] inline-flex items-center gap-1 shrink-0">
                  Manage
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>

              <Link
                href="/sessions"
                className="py-3.5 flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#2B2824] border border-[#37332E] flex items-center justify-center text-[#65C995] shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-bold text-[#F7F5F0] group-hover:text-[#FF9B45] transition-colors">
                      Completed & Active Sessions
                    </p>
                    <p className="text-xs sm:text-sm text-[#AAA69F]">
                      {completedCount} completed · {upcomingSessions.length} upcoming confirmed
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#AAA69F] group-hover:text-[#F7F5F0] inline-flex items-center gap-1 shrink-0">
                  Open
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>

              <Link
                href="/messages"
                className="py-3.5 flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#2B2824] border border-[#37332E] flex items-center justify-center text-[#F5B66B] shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-bold text-[#F7F5F0] group-hover:text-[#FF9B45] transition-colors">
                      SwapStudy Direct Inbox
                    </p>
                    <p className="text-xs sm:text-sm text-[#AAA69F]">
                      {totalUnreadCount > 0
                        ? `${totalUnreadCount} unread message(s) waiting`
                        : 'Coordinate topics and schedules directly with peers'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#AAA69F] group-hover:text-[#F7F5F0] inline-flex items-center gap-1 shrink-0">
                  Inbox
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>
          </section>

          {/* Mutual Swap Proposals (Incoming + Sent Pending) */}
          {(incomingSwapInvitations.length > 0 || sentPendingSwapInvitations.length > 0) && (
            <section className="bg-[#22211F] border border-[#37332E] rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#65C995]">
                    <Repeat className="w-3.5 h-3.5" />
                    Reciprocal Swaps
                  </span>
                  <h2 className="text-xl font-bold text-[#F7F5F0] mt-0.5">
                    Pending Mutual Swap Proposals
                  </h2>
                </div>
              </div>

              <div className="space-y-3.5">
                {incomingSwapInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="bg-[#2B2824] border border-[#37332E] rounded-xl p-5 space-y-4"
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
                          className="w-10 h-10 rounded-full object-cover border border-[#37332E] bg-[#171715]"
                        />
                        <div>
                          <p className="text-sm font-bold text-[#F7F5F0]">
                            {inv.senderName || 'Campus Peer'} proposed a swap
                          </p>
                          <p className="text-xs text-[#AAA69F]">
                            {inv.credits} {inv.credits === 1 ? 'Credit' : 'Credits'} balanced escrow
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[#FF9B45]/15 border border-[#FF9B45]/30 text-xs font-bold text-[#FF9B45]">
                        Action Needed
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="bg-[#171715] border border-[#37332E] rounded-xl p-3">
                        <p className="text-xs font-semibold text-[#AAA69F]">They offer to teach</p>
                        <p className="font-bold text-[#F7F5F0] mt-0.5">{inv.offeredSkillTitle}</p>
                      </div>
                      <div className="bg-[#171715] border border-[#37332E] rounded-xl p-3">
                        <p className="text-xs font-semibold text-[#AAA69F]">They want to learn</p>
                        <p className="font-bold text-[#FF9B45] mt-0.5">{inv.requestedSkillTitle}</p>
                      </div>
                    </div>

                    {inv.note && (
                      <p className="text-xs sm:text-sm text-[#AAA69F] italic border-l-2 border-[#FF9B45] pl-3">
                        &ldquo;{inv.note}&rdquo;
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setAcceptingInvitation(inv)}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
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
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#22211F] hover:bg-[#37332E] border border-[#37332E] text-[#F07878] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
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
                    className="bg-[#171715] border border-[#37332E] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#F7F5F0]">
                        Swap proposal sent to {inv.recipientName || 'peer'}
                      </p>
                      <p className="text-xs text-[#AAA69F] mt-0.5">
                        Offering <span className="text-[#F7F5F0]">{inv.offeredSkillTitle}</span> for{' '}
                        <span className="text-[#FF9B45]">{inv.requestedSkillTitle}</span>
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#2B2824] border border-[#37332E] text-xs font-semibold text-[#F5B66B]">
                      Awaiting Schedule
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Pending Direct Session Requests */}
          {(incomingRequests.length > 0 || pendingLearnerRequests.length > 0) && (
            <section className="bg-[#22211F] border border-[#37332E] rounded-2xl p-6 space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#F5B66B]">
                  Pending Approvals
                </p>
                <h2 className="text-xl font-bold text-[#F7F5F0] mt-0.5">
                  Session Requests
                </h2>
              </div>

              <div className="space-y-3">
                {incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-[#2B2824] border border-[#37332E] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <img
                        src={req.learnerAvatar}
                        alt={req.learnerName}
                        className="w-10 h-10 rounded-full object-cover border border-[#37332E] bg-[#171715] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#F7F5F0] truncate">
                          {req.learnerName} requested {req.skillTitle}
                        </p>
                        <p className="text-xs text-[#AAA69F] flex items-center gap-2 mt-1">
                          <Calendar className="w-3.5 h-3.5 text-[#FF9B45]" />
                          {req.date} at {req.time} IST · +{req.credits} Cr
                        </p>
                        {req.learnerNotes && (
                          <p className="text-xs text-[#AAA69F] mt-1.5 italic line-clamp-2">
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
                        className="px-4 py-2 rounded-full bg-[#65C995] hover:bg-[#53b984] text-[#171715] text-xs font-bold transition-colors cursor-pointer"
                      >
                        {processingId === req.id ? 'Processing...' : 'Accept'}
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
                        className="px-4 py-2 rounded-full bg-[#22211F] hover:bg-[#37332E] border border-[#37332E] text-[#F07878] text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}

                {pendingLearnerRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-[#171715] border border-[#37332E] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={req.teacherAvatar}
                        alt={req.teacherName}
                        className="w-10 h-10 rounded-full object-cover border border-[#37332E] bg-[#22211F] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#F7F5F0] truncate">
                          Waiting on {req.teacherName} · {req.skillTitle}
                        </p>
                        <p className="text-xs text-[#AAA69F] mt-0.5">
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
                      className="px-4 py-2 rounded-full bg-[#22211F] hover:bg-[#2B2824] border border-[#37332E] text-xs font-semibold text-[#F07878] transition-colors shrink-0 cursor-pointer"
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
                <p className="text-xs font-bold uppercase tracking-wider text-[#FF9B45]">
                  Personalized Discovery
                </p>
                <h2 className="text-2xl font-bold text-[#F7F5F0] mt-0.5">
                  Recommended Peer Matches
                </h2>
              </div>

              <div className="inline-flex items-center p-1 rounded-full bg-[#22211F] border border-[#37332E]">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'mutual', label: 'Mutual Swaps' },
                  { key: 'wishlist', label: 'Direct Learn' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setMatchFilter(tab.key as 'all' | 'mutual' | 'wishlist')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${matchFilter === tab.key
                      ? 'bg-[#FF9B45] text-[#171715]'
                      : 'text-[#AAA69F] hover:text-[#F7F5F0]'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {user.skillsToTeach.length === 0 || user.skillsToLearn.length === 0 ? (
              <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#F7F5F0]">
                    Complete your skill tags to unlock better mutual matches
                  </h3>
                  <p className="text-sm text-[#AAA69F]">
                    Add skills you can teach and subjects you want to learn in your profile.
                  </p>
                </div>
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-sm font-bold shrink-0"
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
              <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-10 text-center space-y-4">
                <Users className="w-8 h-8 text-[#FF9B45] mx-auto" />
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-[#F7F5F0]">No matches in this filter yet</h3>
                  <p className="text-sm text-[#AAA69F] max-w-md mx-auto">
                    Browse the live marketplace to book directly or expand your learning wishlist tags in your profile.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                  <Link
                    href="/skills"
                    className="px-5 py-2.5 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-sm font-bold"
                  >
                    Browse All Skills
                  </Link>
                  <Link
                    href="/teach"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#2B2824] border border-[#37332E] text-sm font-semibold text-[#F7F5F0]"
                  >
                    <PlusCircle className="w-4 h-4 text-[#FF9B45]" />
                    Offer a Skill
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN (4 Cols — Upcoming Confirmed Sessions & Wallet Ledger) */}
        <div className="xl:col-span-4 space-y-7">
          {/* Upcoming Sessions Column */}
          <section className="bg-[#22211F] border border-[#37332E] rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-[#F7F5F0]">Upcoming Sessions</h2>
              <Link
                href="/sessions"
                className="text-xs font-bold text-[#AAA69F] hover:text-[#FF9B45] transition-colors"
              >
                See all
              </Link>
            </div>

            {upcomingSessions.length > 0 ? (
              <div className="space-y-4">
                {upcomingSessions.slice(0, 4).map((session) => {
                  const isTeacher = session.teacherId === user.id;
                  const partnerName = isTeacher ? session.learnerName : session.teacherName;
                  const partnerAvatar = isTeacher ? session.learnerAvatar : session.teacherAvatar;
                  const isToday = session.date === todayIST;

                  return (
                    <div
                      key={session.id}
                      className="bg-[#2B2824] border border-[#37332E] rounded-2xl p-4 space-y-3.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#F5B66B]">
                          {isToday ? 'Today' : session.date}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${isTeacher
                            ? 'bg-[#FF9B45]/15 text-[#FF9B45] border-[#FF9B45]/30'
                            : 'bg-[#65C995]/15 text-[#65C995] border-[#65C995]/30'
                            }`}
                        >
                          {isTeacher ? 'Teaching' : 'Learning'}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-[#F7F5F0] leading-snug">
                          {session.skillTitle}
                        </h3>
                        <p className="text-xs text-[#AAA69F] flex items-center gap-1.5 mt-1">
                          <Clock className="w-3.5 h-3.5 text-[#AAA69F]" />
                          {session.time} IST · {session.durationMinutes} min
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <img
                          src={partnerAvatar}
                          alt={partnerName}
                          className="w-7 h-7 rounded-full object-cover border border-[#37332E] bg-[#171715]"
                        />
                        <span className="text-xs font-semibold text-[#F7F5F0] truncate">
                          with {partnerName}
                        </span>
                      </div>

                      <SessionMeetingSection session={session} isTeacher={isTeacher} compact />

                      <div className="flex items-center gap-2 pt-1">
                        {!isTeacher && (
                          <button
                            type="button"
                            onClick={() => setReviewSession(session)}
                            className="flex-1 py-2 rounded-full bg-[#65C995] hover:bg-[#53b984] text-[#171715] text-xs font-bold transition-colors cursor-pointer"
                          >
                            Mark Complete
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
                          className="px-3.5 py-2 rounded-full bg-[#22211F] hover:bg-[#37332E] border border-[#37332E] text-xs font-semibold text-[#F07878] transition-colors cursor-pointer"
                        >
                          {processingId === session.id ? '...' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-[#2B2824] border border-[#37332E] rounded-2xl p-5 text-center space-y-3">
                <Calendar className="w-7 h-7 text-[#FF9B45] mx-auto" />
                <p className="text-sm font-bold text-[#F7F5F0]">No confirmed sessions yet</p>
                <p className="text-xs text-[#AAA69F] leading-relaxed">
                  Request a skill from the marketplace or accept an incoming proposal to populate your schedule.
                </p>
                <Link
                  href="/skills"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-xs font-bold"
                >
                  Browse Skills
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </section>

          {/* Credit Wallet Summary */}
          <section className="bg-[#22211F] border border-[#37332E] rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-[#F7F5F0]">Credit Wallet</h2>
              <Link
                href="/credits"
                className="text-xs font-bold text-[#FF9B45] hover:text-[#F5B66B]"
              >
                Full Ledger
              </Link>
            </div>

            <div className="bg-[#2B2824] border border-[#37332E] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#AAA69F]">Available Balance</p>
                <p className="text-3xl font-extrabold text-[#F7F5F0] mt-0.5 tabular-nums">
                  {user.credits}{' '}
                  <span className="text-sm font-semibold text-[#FF9B45]">Cr</span>
                </p>
              </div>
              <div className="text-right text-xs space-y-1">
                <p className="text-[#65C995] font-bold">+{totalEarned} Earned</p>
                <p className="text-[#AAA69F] font-semibold">-{totalSpent} Spent</p>
              </div>
            </div>

            {userTransactions.length > 0 ? (
              <div className="space-y-2.5">
                {userTransactions.slice(0, 4).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-3 py-2 border-b border-[#37332E] last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#F7F5F0] truncate">{tx.title}</p>
                      <p className="text-xs text-[#AAA69F] truncate">{tx.date}</p>
                    </div>
                    <span
                      className={`text-sm font-extrabold tabular-nums shrink-0 ${tx.amount >= 0 ? 'text-[#65C995]' : 'text-[#F07878]'
                        }`}
                    >
                      {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#AAA69F]">No wallet transactions recorded yet.</p>
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
