'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import ReviewModal from '@/components/ReviewModal';
import { Session, SessionStatus } from '@/types';
import {
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  Coins,
  Star,
  Check,
  AlertCircle,
  XCircle,
} from 'lucide-react';

export default function SessionsPage() {
  const { user } = useAuth();
  const { sessions, acceptSession, declineSession, cancelSession } = useApp();

  const [activeTab, setActiveTab] = useState<'learning' | 'teaching'>('learning');
  const [statusFilter, setStatusFilter] = useState<'all' | SessionStatus>('all');
  const [reviewingSession, setReviewingSession] = useState<Session | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-base font-bold text-slate-900 mb-1">Student Session Required</h2>
        <p className="text-xs text-slate-500 mb-4">Please log in to manage your bookings.</p>
        <Link
          href="/login"
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  // Filter sessions by tab
  const tabSessions = sessions.filter((s) => {
    if (activeTab === 'learning') return s.learnerId === user.id;
    return s.teacherId === user.id;
  });

  // Filter by status
  const filteredSessions = tabSessions.filter((s) => {
    if (statusFilter === 'all') return true;
    return s.status === statusFilter;
  });

  const handleAccept = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await acceptSession(id);
      if (res.success) {
        setToastMessage('Session confirmed! Meeting room created.');
        setToastType('success');
      } else {
        setToastMessage(res.error || 'Failed to accept session.');
        setToastType('error');
      }
    } finally {
      setProcessingId(null);
      setTimeout(() => setToastMessage(null), 4500);
    }
  };

  const handleDecline = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await declineSession(id, 'Instructor unavailable');
      if (res.success) {
        setToastMessage('Session declined and credits returned to student.');
        setToastType('success');
      } else {
        setToastMessage(res.error || 'Failed to decline session.');
        setToastType('error');
      }
    } finally {
      setProcessingId(null);
      setTimeout(() => setToastMessage(null), 4500);
    }
  };

  const handleCancel = async (id: string, skillTitle?: string) => {
    if (
      !window.confirm(
        `Are you sure you want to cancel your session request${
          skillTitle ? ` for "${skillTitle}"` : ''
        }? Your credits held in escrow will be refunded to your wallet immediately.`
      )
    ) {
      return;
    }

    setProcessingId(id);
    try {
      const res = await cancelSession(id);
      if (res.success) {
        setToastMessage('Session request cancelled and credits returned to your wallet.');
        setToastType('success');
      } else {
        setToastMessage(res.error || 'Failed to cancel session.');
        setToastType('error');
      }
    } catch (err: unknown) {
      setToastMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setToastType('error');
    } finally {
      setProcessingId(null);
      setTimeout(() => setToastMessage(null), 4500);
    }
  };

  const getStatusBadge = (status: SessionStatus) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
      case 'pending':
        return 'bg-amber-50 text-amber-800 border-amber-200/80';
      case 'completed':
        return 'bg-blue-50 text-blue-800 border-blue-200/80';
      case 'declined':
      case 'cancelled':
        return 'bg-rose-50 text-rose-800 border-rose-200/80';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen py-8 bg-[#F8FAFC]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-medium shadow-md flex items-center justify-between animate-in fade-in ${
              toastType === 'error'
                ? 'bg-rose-950 text-rose-200 border border-rose-800'
                : 'bg-slate-900 text-slate-100'
            }`}
          >
            <span className="flex items-center gap-2">
              {toastType === 'error' ? (
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              ) : (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
              {toastMessage}
            </span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Skill Swap Sessions
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage your upcoming peer tutoring calls, requests, and completed learning hours.
            </p>
          </div>

          <Link
            href="/skills"
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-500 shadow-2xs"
          >
            Book New Swap
          </Link>
        </div>

        {/* Tab & Status Filter Bar */}
        <div className="card-subtle rounded-xl p-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Tabs */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-100 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('learning')}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                  activeTab === 'learning'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                As Learner ({sessions.filter((s) => s.learnerId === user.id).length})
              </button>
              <button
                onClick={() => setActiveTab('teaching')}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                  activeTab === 'teaching'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                As Teacher ({sessions.filter((s) => s.teacherId === user.id).length})
              </button>
            </div>

            {/* Status pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {(['all', 'confirmed', 'pending', 'completed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sessions List */}
        {filteredSessions.length > 0 ? (
          <div className="space-y-3.5">
            {filteredSessions.map((sess) => {
              const isLearner = sess.learnerId === user.id;
              const counterpartName = isLearner ? sess.teacherName : sess.learnerName;
              const counterpartAvatar = isLearner ? sess.teacherAvatar : sess.learnerAvatar;

              return (
                <div
                  key={sess.id}
                  className="card-subtle rounded-xl p-5 space-y-3 hover:border-slate-300 transition-colors"
                >
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getStatusBadge(
                          sess.status
                        )}`}
                      >
                        {sess.status}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-medium text-slate-600">{sess.category}</span>
                    </div>

                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-xs font-semibold">
                      <Coins className="w-3 h-3 text-emerald-600" />
                      {sess.credits} Credits
                    </div>
                  </div>

                  {/* Main Details */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-slate-900">{sess.skillTitle}</h3>
                      <div className="flex items-center gap-2.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {sess.date}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {sess.time} ({sess.durationMinutes} mins)
                        </span>
                      </div>
                    </div>

                    {/* Counterpart */}
                    <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                      <img
                        src={counterpartAvatar}
                        alt={counterpartName}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <div>
                        <p className="text-[10px] text-slate-400">
                          {isLearner ? 'Your Instructor' : 'Your Student'}
                        </p>
                        <p className="font-semibold text-slate-900">{counterpartName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Learner Goal Note */}
                  {sess.learnerNotes && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Goal: </span>
                      {sess.learnerNotes}
                    </div>
                  )}

                  {/* Feedback if completed */}
                  {sess.status === 'completed' && sess.reviewGiven && (
                    <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-100 text-xs space-y-0.5">
                      <div className="flex items-center gap-1 text-amber-600 font-bold text-[11px]">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>Rating: {sess.ratingGiven} / 5</span>
                      </div>
                      <p className="text-emerald-950 italic text-[11px]">&ldquo;{sess.reviewGiven}&rdquo;</p>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-400 text-[11px]">Booked on {sess.createdAt}</span>

                    <div className="flex items-center gap-2">
                      {!isLearner && sess.status === 'pending' && (
                        <>
                          <button
                            disabled={processingId === sess.id}
                            onClick={() => handleAccept(sess.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                          >
                            {processingId === sess.id ? (
                              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            Accept Request
                          </button>
                          <button
                            disabled={processingId === sess.id}
                            onClick={() => handleDecline(sess.id)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed text-xs font-medium transition-colors"
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {isLearner && sess.status === 'pending' && (
                        <button
                          disabled={processingId === sess.id}
                          onClick={() => handleCancel(sess.id, sess.skillTitle)}
                          className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-60 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                        >
                          {processingId === sess.id ? (
                            <span className="w-3 h-3 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          Cancel Request
                        </button>
                      )}

                      {sess.status === 'confirmed' && sess.meetingLink && (
                        <a
                          href={sess.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Video className="w-3 h-3 text-emerald-400" />
                          Open Meeting Room
                        </a>
                      )}

                      {isLearner && sess.status === 'confirmed' && (
                        <button
                          onClick={() => setReviewingSession(sess)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Complete & Release {sess.credits} Cr
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card-subtle rounded-xl p-12 text-center space-y-3">
            <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-lg flex items-center justify-center mx-auto">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">No sessions in this view</h3>
              <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto">
                {activeTab === 'learning'
                  ? 'You have not booked any peer tutoring sessions in this category yet.'
                  : 'No students have booked you for teaching in this category yet.'}
              </p>
            </div>
            <Link
              href="/skills"
              className="inline-block px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-500 shadow-2xs"
            >
              Explore Skills to Learn
            </Link>
          </div>
        )}
      </div>

      {/* Review & Complete Modal */}
      {reviewingSession && (
        <ReviewModal
          session={reviewingSession}
          onClose={() => setReviewingSession(null)}
          onCompleted={() => {
            setToastMessage('Session completed! Credits transferred to teacher and review published.');
            setTimeout(() => setToastMessage(null), 3500);
          }}
        />
      )}
    </div>
  );
}
