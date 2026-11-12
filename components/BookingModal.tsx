'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Skill } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { getISTDateString, isISTDateTimeInFuture } from '@/lib/timezone';
import {
  X,
  Calendar,
  Clock,
  Coins,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Loader2,
  ArrowRight,
} from 'lucide-react';

interface BookingModalProps {
  skill: Skill;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BookingModal({ skill, onClose, onSuccess }: BookingModalProps) {
  const { user } = useAuth();
  const { bookSession } = useApp();

  const [date, setDate] = useState(getISTDateString(1));
  const [time, setTime] = useState('16:00');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const isSubmittingRef = useRef(false);

  const minDate = getISTDateString(0);
  const isOwnSkill = user?.id === skill.teacherId;
  const hasEnoughCredits = user ? user.credits >= skill.hourlyCredits : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isSubmitting) return;

    if (!user) {
      setErrorMsg('Please log in to request a session.');
      return;
    }

    if (isOwnSkill) {
      setErrorMsg('You cannot book your own skill listing.');
      return;
    }

    if (!hasEnoughCredits) {
      setErrorMsg(`You need at least ${skill.hourlyCredits} credits to book this session.`);
      return;
    }

    if (!date || !time || !isISTDateTimeInFuture(date, time)) {
      setErrorMsg('Please choose a future date and time (IST).');
      return;
    }

    setErrorMsg('');
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const result = await bookSession({
        skillId: skill.id,
        date,
        time,
        notes: notes.trim() || undefined,
      });

      if (!result.success) {
        setErrorMsg(result.error || 'Could not submit booking request.');
        return;
      }

      setIsSuccess(true);
      onSuccess?.();
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#22211F] border border-[#37332E] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#37332E] flex items-start justify-between gap-4 bg-[#1B1A18]">
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#2B2824] border border-[#37332E] text-[#FF9B45] mb-2">
              {skill.category}
            </span>
            <h2 className="text-xl font-bold text-[#F7F5F0] leading-snug">
              {isSuccess ? 'Session Request Sent' : 'Request Learning Session'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#AAA69F] hover:text-[#F7F5F0] hover:bg-[#2B2824] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-6 sm:p-7 space-y-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#65C995]/15 border border-[#65C995]/30 text-[#65C995] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#F7F5F0]">{skill.title}</h3>
              <p className="text-sm text-[#AAA69F] leading-relaxed">
                Your booking request with <span className="text-[#F7F5F0] font-semibold">{skill.teacherName}</span> for{' '}
                <span className="text-[#F7F5F0] font-semibold">{date} at {time} IST</span> has been submitted.
                {' '}{skill.hourlyCredits} {skill.hourlyCredits === 1 ? 'credit is' : 'credits are'} safely held in escrow until completion.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/sessions"
                onClick={onClose}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-sm font-bold transition-colors"
              >
                View My Sessions
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full bg-[#2B2824] hover:bg-[#37332E] border border-[#37332E] text-sm font-semibold text-[#F7F5F0] transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Skill Summary Card */}
            <div className="bg-[#2B2824] border border-[#37332E] rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={skill.teacherAvatar}
                  alt={skill.teacherName}
                  className="w-11 h-11 rounded-full object-cover border border-[#37332E] bg-[#171715] shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#F7F5F0] truncate">{skill.title}</p>
                  <p className="text-xs text-[#AAA69F] truncate">
                    Mentor: {skill.teacherName} · {skill.sessionDurationMinutes} min
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#171715] border border-[#37332E] text-sm font-bold text-[#FF9B45] shrink-0">
                <Coins className="w-4 h-4" />
                {skill.hourlyCredits}
              </div>
            </div>

            {!user ? (
              <div className="bg-[#2B2824] border border-[#37332E] rounded-xl p-5 text-center space-y-4">
                <p className="text-sm text-[#AAA69F]">
                  Sign in to book peer sessions and manage time-credit escrow safely.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link
                    href="/login"
                    onClick={onClose}
                    className="px-5 py-2 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-sm font-bold"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={onClose}
                    className="px-5 py-2 rounded-full bg-[#22211F] border border-[#37332E] text-[#F7F5F0] text-sm font-semibold"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {isOwnSkill && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#F07878]/10 border border-[#F07878]/30 text-sm text-[#F07878]">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>This is your own skill listing. Choose another mentor&apos;s skill to learn.</span>
                  </div>
                )}

                {!isOwnSkill && !hasEnoughCredits && (
                  <div className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-[#F5B66B]/10 border border-[#F5B66B]/30 text-sm text-[#F5B66B]">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        You have <strong>{user.credits}</strong> credits, but this session requires{' '}
                        <strong>{skill.hourlyCredits}</strong>.
                      </span>
                    </div>
                    <Link
                      href="/teach"
                      onClick={onClose}
                      className="text-xs font-bold underline shrink-0"
                    >
                      Teach to earn
                    </Link>
                  </div>
                )}

                {/* Date & Time Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
                      Preferred Date (IST)
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-[#AAA69F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="date"
                        min={minDate}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
                      Start Time (IST)
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-[#AAA69F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#AAA69F] mb-2">
                    Learning Goals (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Share what specific concepts or questions you want to cover..."
                    className="w-full px-4 py-3 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] placeholder-[#AAA69F]/60 focus:outline-none resize-none"
                  />
                </div>

                {/* Escrow Notice */}
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#171715] border border-[#37332E] text-xs text-[#AAA69F] leading-relaxed">
                  <ShieldCheck className="w-4 h-4 text-[#65C995] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#F7F5F0]">Escrow Protection:</strong>{' '}
                    {skill.hourlyCredits} {skill.hourlyCredits === 1 ? 'credit' : 'credits'} will be reserved when you send this request and released to {skill.teacherName} only after completion. Full refund if declined or cancelled.
                  </span>
                </div>

                {errorMsg && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#F07878]/10 border border-[#F07878]/30 text-sm text-[#F07878]">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-full bg-[#2B2824] hover:bg-[#37332E] border border-[#37332E] text-sm font-semibold text-[#F7F5F0] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isOwnSkill || !hasEnoughCredits}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] disabled:opacity-50 text-[#171715] text-sm font-bold transition-colors cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Reserving Credit...
                      </>
                    ) : (
                      `Send Request (${skill.hourlyCredits} Cr)`
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
