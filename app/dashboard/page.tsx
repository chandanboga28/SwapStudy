'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import ReviewModal from '@/components/ReviewModal';
import BookingModal from '@/components/BookingModal';
import SmartMatchCard from '@/components/SmartMatchCard';
import StudentProfileModal from '@/components/StudentProfileModal';
import { calculateSmartMatches } from '@/lib/matching';
import { Session, Skill, User } from '@/types';
import {
  Coins,
  Star,
  Plus,
  Calendar,
  CheckCircle2,
  Video,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  LayoutDashboard,
  User as UserIcon,
  Search,
  Check,
  ChevronRight,
  ArrowRightLeft,
  Users,
  MessageSquare,
} from 'lucide-react';
import { useMessaging } from '@/context/MessagingContext';

export default function DashboardPage() {
  const { user, allUsers } = useAuth();
  const { sessions, skills, transactions, acceptSession, declineSession } = useApp();
  const { totalUnreadCount } = useMessaging();

  const [reviewingSession, setReviewingSession] = useState<Session | null>(null);
  const [bookingSkill, setBookingSkill] = useState<Skill | null>(null);
  const [inspectingStudent, setInspectingStudent] = useState<User | null>(null);
  const [matchFilter, setMatchFilter] = useState<'all' | 'mutual' | 'wishlist'>('all');
  const [notification, setNotification] = useState<string | null>(null);

  // Smart skill matching based on teaching strengths & learning wishlists
  const smartMatches = useMemo(() => {
    return calculateSmartMatches(user, allUsers, skills, sessions);
  }, [user, allUsers, skills, sessions]);

  const mutualMatchesCount = smartMatches.filter((m) => m.matchType === 'mutual').length;
  const wishlistMatchesCount = smartMatches.filter((m) => m.matchType === 'one-way-learn').length;

  const displayedMatches = useMemo(() => {
    if (matchFilter === 'mutual') return smartMatches.filter((m) => m.matchType === 'mutual');
    if (matchFilter === 'wishlist') return smartMatches.filter((m) => m.matchType === 'one-way-learn');
    return smartMatches;
  }, [smartMatches, matchFilter]);

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Student Session Required</h2>
        <p className="text-xs text-slate-500 mb-4">Please sign in to access your student dashboard.</p>
        <Link
          href="/login"
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs"
        >
          Sign In
        </Link>
      </div>
    );
  }

  // Sessions where user is teacher
  const incomingRequests = sessions.filter(
    (s) => s.teacherId === user.id && s.status === 'pending'
  );

  // Confirmed upcoming sessions
  const upcomingSessions = sessions.filter(
    (s) =>
      (s.teacherId === user.id || s.learnerId === user.id) &&
      s.status === 'confirmed'
  );

  // User's recent credit transactions
  const userTransactions = transactions
    .filter((t) => t.userId === user.id)
    .slice(0, 4);

  const handleAccept = async (sessionId: string) => {
    const res = await acceptSession(sessionId);
    if (res.success) {
      setNotification('Session confirmed! Meeting link has been generated.');
      setTimeout(() => setNotification(null), 3500);
    }
  };

  const handleDecline = async (sessionId: string) => {
    const res = await declineSession(sessionId, 'Schedule conflict');
    if (res.success) {
      setNotification('Session declined. Credits refunded to student.');
      setTimeout(() => setNotification(null), 3500);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toast Alert */}
        {notification && (
          <div className="mb-6 p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-medium shadow-md flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              {notification}
            </span>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Left Sidebar Navigation */}
          <aside className="lg:col-span-3 space-y-6">
            {/* Student mini-profile card */}
            <div className="card-subtle rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user.major}</p>
                  <p className="text-[10px] text-emerald-700 font-medium truncate">{user.university}</p>
                </div>
              </div>

              {/* Sidebar navigation list */}
              <nav className="pt-2 border-t border-slate-100 space-y-1">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600" />
                  Overview
                </Link>
                <Link
                  href="/sessions"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    My Sessions
                  </span>
                  {incomingRequests.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      {incomingRequests.length}
                    </span>
                  )}
                </Link>
                <Link
                  href="/messages"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    Direct Messages
                  </span>
                  {totalUnreadCount > 0 ? (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                      {totalUnreadCount} new
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">Chat</span>
                  )}
                </Link>
                <Link
                  href="/community"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    Campus Community
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Hub
                  </span>
                </Link>
                <Link
                  href="/skills"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  Explore Skills
                </Link>
                <Link
                  href="/teach"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-400" />
                  Offer to Teach
                </Link>
                <Link
                  href="/credits"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <Coins className="w-3.5 h-3.5 text-slate-400" />
                  Credits & Ledger
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  Profile Settings
                </Link>
              </nav>
            </div>

            {/* Quick Tips card */}
            <div className="card-subtle rounded-xl p-4 space-y-2 text-xs text-slate-600">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                How to Earn
              </span>
              <p className="text-[11px] leading-relaxed text-slate-500">
                1 hour of teaching = 1 to 3 credits. Create a listing for your strongest course or coding skill.
              </p>
              <Link
                href="/teach"
                className="text-[11px] font-semibold text-emerald-700 hover:underline inline-flex items-center gap-0.5 pt-1"
              >
                Create Listing →
              </Link>
            </div>
          </aside>

          {/* Main Dashboard Area */}
          <main className="lg:col-span-9 space-y-6">
            {/* Greeting Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Student Dashboard
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Welcome back, {user.name} • Class of {user.graduationYear}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/teach"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-2xs transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Offer a Skill
                </Link>
                <Link
                  href="/skills"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Find Tutors
                </Link>
              </div>
            </div>

            {/* Prominent Credit Card + Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Main Credit Wallet Card (6 cols) */}
              <div className="md:col-span-6 card-subtle rounded-xl p-5 bg-gradient-to-br from-white to-emerald-50/40 border border-emerald-200/70 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Coins className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                      Swap Wallet
                    </span>
                  </div>
                  <Link
                    href="/credits"
                    className="text-[11px] font-semibold text-emerald-700 hover:underline"
                  >
                    View Ledger →
                  </Link>
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {user.credits}
                    </span>
                    <span className="text-sm font-semibold text-emerald-700">Credits Available</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Enables {user.credits} hours of 1-on-1 tutoring sessions
                  </p>
                </div>

                <div className="pt-2 border-t border-emerald-100/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">No cash needed</span>
                  <Link
                    href="/skills"
                    className="text-[11px] font-semibold text-slate-700 hover:text-emerald-700"
                  >
                    Spend on Learning →
                  </Link>
                </div>
              </div>

              {/* Two complementary stats (6 cols) */}
              <div className="md:col-span-6 grid grid-cols-2 gap-4">
                <div className="card-subtle rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Hours Taught
                    </span>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">
                      {user.totalHoursTaught} <span className="text-xs font-normal text-slate-500">hrs</span>
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    {user.skillsToTeach.length} active subjects
                  </p>
                </div>

                <div className="card-subtle rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Peer Rating
                    </span>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {user.repRating}
                    </p>
                  </div>
                  <p className="text-[10px] text-emerald-700 font-medium mt-2">
                    Verified mentor
                  </p>
                </div>
              </div>
            </div>

            {/* Pending Requests Alert Card */}
            {incomingRequests.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Pending Teaching Requests ({incomingRequests.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-amber-800 font-medium">
                    Awaiting your confirmation
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {incomingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white p-3.5 rounded-lg border border-amber-200/60 text-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{req.skillTitle}</span>
                        <span className="font-bold text-emerald-700 text-[11px]">
                          +{req.credits} Cr
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <img
                          src={req.learnerAvatar}
                          alt={req.learnerName}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <div className="text-[11px]">
                          <span className="font-medium text-slate-800">{req.learnerName}</span>
                          <span className="text-slate-400"> • {req.date} at {req.time}</span>
                        </div>
                      </div>

                      {req.learnerNotes && (
                        <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 italic">
                          &ldquo;{req.learnerNotes}&rdquo;
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleAccept(req.id)}
                          className="flex-1 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center justify-center gap-1 shadow-2xs"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleDecline(req.id)}
                          className="py-1.5 px-3 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-medium"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Confirmed Sessions */}
            <div className="card-subtle rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">Confirmed Upcoming Sessions</h3>
                </div>
                <Link
                  href="/sessions"
                  className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-0.5"
                >
                  View All ({sessions.length})
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {upcomingSessions.length > 0 ? (
                <div className="space-y-3">
                  {upcomingSessions.map((sess) => {
                    const isTeaching = sess.teacherId === user.id;
                    const partnerName = isTeaching ? sess.learnerName : sess.teacherName;
                    const partnerAvatar = isTeaching ? sess.learnerAvatar : sess.teacherAvatar;

                    return (
                      <div
                        key={sess.id}
                        className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                isTeaching
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isTeaching ? 'Teaching' : 'Learning'}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{sess.skillTitle}</span>
                          </div>

                          <span className="text-xs font-medium text-slate-600">
                            {sess.date} • {sess.time}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            <img
                              src={partnerAvatar}
                              alt={partnerName}
                              className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                            />
                            <div className="text-[11px]">
                              <p className="font-semibold text-slate-900">
                                {isTeaching ? `Student: ${partnerName}` : `Tutor: ${partnerName}`}
                              </p>
                              <p className="text-slate-400">
                                {sess.durationMinutes} mins • {sess.credits} credits
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {sess.meetingLink && (
                              <a
                                href={sess.meetingLink}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 rounded-md bg-slate-900 text-white hover:bg-slate-800 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                              >
                                <Video className="w-3.5 h-3.5 text-emerald-400" />
                                Join Call
                              </a>
                            )}

                            {!isTeaching && (
                              <button
                                onClick={() => setReviewingSession(sess)}
                                className="px-2.5 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-500 font-semibold text-xs transition-colors flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Complete & Review
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-500 space-y-1.5">
                  <p>No confirmed sessions currently scheduled.</p>
                  <Link
                    href="/skills"
                    className="inline-block text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    Browse available tutors to book a session →
                  </Link>
                </div>
              )}
            </div>

            {/* Smart Skill Matching: Your Best Matches */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-[11px] font-semibold text-emerald-800 mb-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Intelligent Skill Matching</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    Your Best Matches
                    {mutualMatchesCount > 0 && (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300/60">
                        {mutualMatchesCount} Mutual {mutualMatchesCount === 1 ? 'Swap' : 'Swaps'}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Peer matches connecting what you teach with what you want to learn.
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl self-start sm:self-auto border border-slate-200/60 text-xs">
                  <button
                    onClick={() => setMatchFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all text-xs ${
                      matchFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({smartMatches.length})
                  </button>
                  <button
                    onClick={() => setMatchFilter('mutual')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all text-xs flex items-center gap-1.5 ${
                      matchFilter === 'mutual'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    Mutual ({mutualMatchesCount})
                  </button>
                  <button
                    onClick={() => setMatchFilter('wishlist')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all text-xs ${
                      matchFilter === 'wishlist'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Wishlist ({wishlistMatchesCount})
                  </button>
                </div>
              </div>

              {/* Matches Grid or Empty State */}
              {displayedMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedMatches.map((m) => (
                    <SmartMatchCard
                      key={m.candidate.id}
                      match={m}
                      onRequestExchange={(skill) => setBookingSkill(skill)}
                      onViewProfile={() => setInspectingStudent(m.candidate)}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {matchFilter === 'mutual'
                        ? 'No Mutual Swaps Found Right Now'
                        : 'No Skill Matches Found'}
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                      {matchFilter === 'mutual'
                        ? 'No direct two-way reciprocal exchanges with your current teaching subjects. You can still book one-way wishlist matches or add more skills to your profile!'
                        : 'Update your learning wishlist or teach skills to unlock intelligent peer matches.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <Link
                      href="/profile"
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                    >
                      Update Profile Skills
                    </Link>
                    <Link
                      href="/skills"
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      Browse Marketplace
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Credit Activity Section */}
            <div className="card-subtle rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">Recent Credit Activity</h3>
                </div>
                <Link href="/credits" className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-0.5">
                  Full Ledger ({transactions.length})
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {userTransactions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {userTransactions.map((tx) => {
                    const isPositive = tx.amount > 0;
                    return (
                      <div
                        key={tx.id}
                        className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isPositive
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {isPositive ? (
                              <ArrowUpRight className="w-4 h-4" />
                            ) : (
                              <ArrowDownLeft className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate text-xs">
                              {tx.title}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{tx.date}</p>
                          </div>
                        </div>

                        <span
                          className={`font-bold text-xs shrink-0 px-2 py-0.5 rounded ${
                            isPositive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                              : 'bg-slate-100 text-slate-700 border border-slate-200/60'
                          }`}
                        >
                          {isPositive ? `+${tx.amount}` : tx.amount} Cr
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">No recent credit transactions.</p>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingSkill && (
        <BookingModal
          skill={bookingSkill}
          onClose={() => setBookingSkill(null)}
          onSuccess={() => {
            setNotification('Exchange requested! Credits held in escrow until session completion.');
            setTimeout(() => setNotification(null), 3500);
          }}
        />
      )}

      {/* Review Modal */}
      {reviewingSession && (
        <ReviewModal
          session={reviewingSession}
          onClose={() => setReviewingSession(null)}
          onCompleted={() => {
            setNotification('Session completed and credits transferred.');
            setTimeout(() => setNotification(null), 3500);
          }}
        />
      )}

      {/* Candidate Student Profile Modal */}
      {inspectingStudent && (
        <StudentProfileModal
          student={inspectingStudent}
          onClose={() => setInspectingStudent(null)}
          onSelectSkill={(skill) => {
            setInspectingStudent(null);
            setBookingSkill(skill);
          }}
          availableSkills={skills}
        />
      )}
    </div>
  );
}
