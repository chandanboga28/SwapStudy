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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2227]/45 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#CEC9BC] flex items-start justify-between gap-4 bg-[#E6E3DA]">
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E6E3DA] border border-[#4A4E57] text-[#2F4D96] mb-2">
              {skill.category}
            </span>
            <h2 className="text-xl font-bold text-[#1F2227] leading-snug">
              {isSuccess ? 'Session Request Sent' : 'Request Learning Session'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#464B55] hover:text-[#1F2227] hover:bg-[#E6E3DA] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-6 sm:p-7 space-y-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#DCF2E4] border border-[#47785B] text-[#195434] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#1F2227]">{skill.title}</h3>
              <p className="text-sm text-[#464B55] leading-relaxed">
                Your booking request with <span className="text-[#1F2227] font-semibold">{skill.teacherName}</span> for{' '}
                <span className="text-[#1F2227] font-semibold">{date} at {time} IST</span> has been submitted.
                {' '}{skill.hourlyCredits} {skill.hourlyCredits === 1 ? 'credit is' : 'credits are'} safely held in escrow until completion.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/sessions"
                onClick={onClose}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-sm font-bold transition-colors"
              >
                View My Sessions
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full bg-[#E6E3DA] hover:bg-[#DCD8CD] border border-[#4A4E57] text-sm font-semibold text-[#1F2227] transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Skill Summary Card */}
            <div className="bg-[#E6E3DA] border border-[#4A4E57] rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={skill.teacherAvatar}
                  alt={skill.teacherName}
                  className="w-11 h-11 rounded-full object-cover border border-[#4A4E57] bg-[#EFECE4] shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#1F2227] truncate">{skill.title}</p>
                  <p className="text-xs text-[#464B55] truncate">
                    Mentor: {skill.teacherName} · {skill.sessionDurationMinutes} min
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EFECE4] border border-[#4A4E57] text-sm font-bold text-[#2F4D96] shrink-0">
                <Coins className="w-4 h-4" />
                {skill.hourlyCredits}
              </div>
            </div>

            {!user ? (
              <div className="bg-[#E6E3DA] border border-[#4A4E57] rounded-xl p-5 text-center space-y-4">
                <p className="text-sm text-[#464B55]">
                  Sign in to book peer sessions and manage time-credit escrow safely.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link
                    href="/login"
                    onClick={onClose}
                    className="px-5 py-2 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-sm font-bold"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={onClose}
                    className="px-5 py-2 rounded-full bg-[#F8F6F0] border border-[#4A4E57] text-[#1F2227] text-sm font-semibold"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {isOwnSkill && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FCE7E3] border border-[#B34B39] text-sm text-[#8F2618]">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>This is your own skill listing. Choose another mentor&apos;s skill to learn.</span>
                  </div>
                )}

                {!isOwnSkill && !hasEnoughCredits && (
                  <div className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-[#FBF0C9] border border-[#8C7228] text-sm font-semibold text-[#5C4609]">
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#464B55] mb-2">
                      Preferred Date (IST)
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-[#464B55] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="date"
                        min={minDate}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#464B55] mb-2">
                      Start Time (IST)
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-[#464B55] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#464B55] mb-2">
                    Learning Goals (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Share what specific concepts or questions you want to cover..."
                    className="w-full px-4 py-3 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] placeholder-[#5A606B] focus:outline-none resize-none"
                  />
                </div>

                {/* Escrow Notice */}
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#EFECE4] border border-[#4A4E57] text-xs text-[#464B55] leading-relaxed">
                  <ShieldCheck className="w-4 h-4 text-[#195434] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#1F2227]">Escrow Protection:</strong>{' '}
                    {skill.hourlyCredits} {skill.hourlyCredits === 1 ? 'credit' : 'credits'} will be reserved when you send this request and released to {skill.teacherName} only after completion. Full refund if declined or cancelled.
                  </span>
                </div>

                {errorMsg && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FCE7E3] border border-[#B34B39] text-sm text-[#8F2618]">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-full bg-[#E6E3DA] hover:bg-[#DCD8CD] border border-[#4A4E57] text-sm font-semibold text-[#1F2227] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isOwnSkill || !hasEnoughCredits}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] disabled:opacity-50 border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-sm font-bold transition-colors cursor-pointer"
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
