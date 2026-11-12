'use client';

import React, { useState, useRef } from 'react';
import { Skill } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { getISTDateString, isISTDateTimeInFuture } from '@/lib/timezone';
import { X, Calendar, Clock, Coins, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface BookingModalProps {
  skill: Skill | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BookingModal({ skill, onClose, onSuccess }: BookingModalProps) {
  const { user } = useAuth();
  const { bookSession, sessions } = useApp();

  const [todayStr] = useState<string>(() => getISTDateString(0));
  const [date, setDate] = useState<string>(() => getISTDateString(1));
  const [time, setTime] = useState('16:00');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const isSubmittingRef = useRef(false);

  if (!skill) return null;

  const cost = skill.hourlyCredits;
  const hasEnoughCredits = (user?.credits ?? 0) >= cost;
  const isOwnSkill = user?.id === skill.teacherId;
  const hasPendingBooking = Boolean(
    user &&
      sessions.some(
        (s) =>
          s.skillId === skill.id &&
          s.learnerId === user.id &&
          (s.status === 'pending' || s.status === 'confirmed')
      )
  );

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isSubmitting || isSuccess) return;
    setError(null);

    if (!user) {
      setError('Please sign in first to book a session.');
      return;
    }

    if (isOwnSkill) {
      setError('You cannot book a session with yourself.');
      return;
    }

    if (hasPendingBooking) {
      setError('You already have a pending or confirmed session for this skill.');
      return;
    }

    if (!hasEnoughCredits) {
      setError(`You need ${cost} credits, but you have ${user.credits} credits. Offer a skill to earn more credits!`);
      return;
    }

    if (!date || !time) {
      setError('Please select a valid date and time.');
      return;
    }

    if (!isISTDateTimeInFuture(date, time)) {
      setError('Selected date and time have already passed in IST. Please choose a future time slot.');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const res = await bookSession({
        skillId: skill.id,
        date,
        time,
        notes,
      });

      if (res.success) {
        setIsSuccess(true);
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || 'Failed to book session. Please try again.');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to book session.');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              Request Skill Swap
            </span>
            <h2 className="text-sm font-bold text-slate-900 line-clamp-1">{skill.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-6 text-center space-y-3.5">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Session Request Sent!</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sent to <span className="font-semibold text-slate-800">{skill.teacherName}</span>.
                Your credits are placed in safe escrow until the session is confirmed.
              </p>
            </div>

            <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-100 text-left text-xs text-emerald-800 space-y-1">
              <div className="flex justify-between font-medium">
                <span>Reserved in Escrow:</span>
                <span className="font-bold">{cost} Credits</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Proposed Time:</span>
                <span>{date} at {time}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Close
              </button>
              <Link
                href="/sessions"
                onClick={onClose}
                className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 shadow-2xs flex items-center justify-center gap-1"
              >
                View Sessions
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleBooking} className="p-5 space-y-4">
            {/* Teacher summary */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200/70">
              <img
                src={skill.teacherAvatar}
                alt={skill.teacherName}
                className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900">{skill.teacherName}</p>
                <p className="text-[11px] text-slate-500">{skill.teacherMajor} • {skill.teacherUniversity.split(' ')[0]}</p>
                <p className="text-[10px] text-amber-700 font-medium mt-0.5">
                  ★ {skill.teacherRating} ({skill.reviewsCount} reviews)
                </p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs">
                  <Coins className="w-3 h-3 text-emerald-600" />
                  {cost} Cr
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{skill.sessionDurationMinutes || 60} mins</p>
              </div>
            </div>

            {/* Credit balance check */}
            {user && (
              <div
                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                  hasEnoughCredits
                    ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <span className="text-[11px]">
                  Your balance: <strong>{user.credits} credits</strong>
                </span>
                <span className="text-[11px] font-semibold">
                  {hasEnoughCredits ? `Balance after: ${user.credits - cost} Cr` : `Need ${cost - user.credits} more`}
                </span>
              </div>
            )}

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                <span className="text-[11px]">{error}</span>
              </div>
            )}

            {/* Date & Time selection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  Preferred Date
                </label>
                <input
                  type="date"
                  required
                  disabled={isSubmitting}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={todayStr}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Preferred Time
                </label>
                <input
                  type="time"
                  required
                  disabled={isSubmitting}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:bg-slate-50"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                What would you like to focus on? (Optional)
              </label>
              <textarea
                rows={2}
                disabled={isSubmitting}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Debugging algorithmic runtime, review my portfolio wireframes..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:bg-slate-50"
              />
            </div>

            {/* Submit CTA */}
            <div className="pt-1">
              {!user ? (
                <Link
                  href="/login"
                  className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5"
                >
                  Sign In to Book Session
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : isOwnSkill ? (
                <div className="p-2.5 text-center bg-slate-100 rounded-lg text-xs text-slate-500">
                  This is your own skill listing.
                </div>
              ) : hasPendingBooking ? (
                <div className="p-2.5 text-center bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  You already have an active session request for this skill.
                </div>
              ) : !hasEnoughCredits ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-2 px-3 rounded-lg bg-slate-200 text-slate-400 font-semibold text-xs cursor-not-allowed"
                >
                  Insufficient Credits ({user?.credits || 0}/{cost})
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white font-semibold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Confirming Escrow...
                    </>
                  ) : (
                    <>
                      <Coins className="w-3.5 h-3.5" />
                      Confirm Swap &amp; Spend {cost} Credits
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
