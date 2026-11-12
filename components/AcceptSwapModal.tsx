'use client';

import React, { useState } from 'react';
import { SkillSwapInvitation } from '@/types';
import { useApp } from '@/context/AppContext';
import {
  X,
  Calendar,
  Clock,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { getISTDateString, parseISTTimestamp } from '@/lib/timezone';

interface AcceptSwapModalProps {
  invitation: SkillSwapInvitation;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AcceptSwapModal({
  invitation,
  onClose,
  onSuccess,
}: AcceptSwapModalProps) {
  const { acceptSwapProposal } = useApp();

  const [todayStr] = useState<string>(() => getISTDateString(0));
  const [session1Date, setSession1Date] = useState<string>(() => getISTDateString(1));
  const [session1Time, setSession1Time] = useState<string>('14:00');

  const [session2Date, setSession2Date] = useState<string>(() => getISTDateString(2));
  const [session2Time, setSession2Time] = useState<string>('16:00');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeOptions = [
    '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00',
    '19:00', '20:00',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate dates
    if (!session1Date || !session2Date) {
      setError('Please select dates for both reciprocal sessions.');
      return;
    }

    if (session1Date < todayStr || session2Date < todayStr) {
      setError('Session dates cannot be in the past.');
      return;
    }

    if (!session1Time || !session2Time) {
      setError('Please select times for both sessions.');
      return;
    }

    // Check that both session start times are strictly in the future in IST (including when date is today)
    const now = Date.now();
    const s1Start = parseISTTimestamp(session1Date, session1Time);
    const s1End = s1Start + 60 * 60 * 1000;
    const s2Start = parseISTTimestamp(session2Date, session2Time);
    const s2End = s2Start + 60 * 60 * 1000;

    if (s1Start <= now) {
      setError(
        'Session 1 scheduled start time has already passed in IST. Please select a future time slot.'
      );
      return;
    }

    if (s2Start <= now) {
      setError(
        'Session 2 scheduled start time has already passed in IST. Please select a future time slot.'
      );
      return;
    }

    // Check 60-minute interval overlap across reciprocal sessions
    if (s1Start < s2End && s2Start < s1End) {
      setError(
        'The two reciprocal sessions overlap in schedule. Each session lasts 60 minutes; please allow at least 60 minutes between session start times.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await acceptSwapProposal(
        invitation.id,
        session1Date,
        session1Time,
        session2Date,
        session2Time
      );

      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || 'Failed to confirm mutual skill swap.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white ring-1 ring-white/30 shadow-xs">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 border border-emerald-400/40">
                  Reciprocal Scheduling
                </span>
                <span className="text-xs font-semibold text-emerald-200">
                  {invitation.credits} Cr Exchange
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
                Schedule & Accept Mutual Swap
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Proposal Summary Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={invitation.senderAvatar}
                alt={invitation.senderName}
                className="w-9 h-9 rounded-full object-cover ring-1 ring-emerald-200 shrink-0"
              />
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate">
                  Partner: {invitation.senderName}
                </span>
                <span className="text-[11px] text-slate-500 block truncate">
                  {invitation.senderUniversity || 'Student Peer'} • {invitation.senderMajor || 'Student'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200/70 shrink-0">
              0 Net Cost
            </span>
          </div>

          {/* Scheduling Section: Two Independent Sessions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Coordinate Session Dates & Times
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Independent schedules
              </span>
            </div>

            {/* Session 1: You Learn */}
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                    1
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Session 1: You Learn
                    </span>
                    <span className="text-[11px] text-emerald-800 font-semibold">
                      {invitation.offeredSkillTitle}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Taught by {invitation.senderName?.split(' ')[0]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 flex items-center gap-1 mb-1">
                    <Calendar className="w-3 h-3 text-emerald-600" />
                    Date
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={session1Date}
                    onChange={(e) => setSession1Date(e.target.value)}
                    required
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3 text-emerald-600" />
                    Time (IST)
                  </label>
                  <select
                    value={session1Time}
                    onChange={(e) => setSession1Time(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {timeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Session 2: You Teach */}
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                    2
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Session 2: You Teach
                    </span>
                    <span className="text-[11px] text-blue-800 font-semibold">
                      {invitation.requestedSkillTitle}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Student: {invitation.senderName?.split(' ')[0]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 flex items-center gap-1 mb-1">
                    <Calendar className="w-3 h-3 text-blue-600" />
                    Date
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={session2Date}
                    onChange={(e) => setSession2Date(e.target.value)}
                    required
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3 text-blue-600" />
                    Time (IST)
                  </label>
                  <select
                    value={session2Time}
                    onChange={(e) => setSession2Time(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    {timeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Credit Assurance & Accounting Info */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Credit Lifecycle Protection</span>
            </div>
            <p className="text-slate-500">
              Accepting reserves {invitation.credits} credit in escrow for each student&apos;s learning session.
              Upon completion of each session, credits transfer to the instructor. If an uncompleted session is cancelled,
              escrowed credits are automatically refunded. Net balance change is 0 credits.
            </p>
          </div>

          {/* Buttons */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-xs hover:shadow flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Confirming Swap...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Confirm & Schedule Both Sessions
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
