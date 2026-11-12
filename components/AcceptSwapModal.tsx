'use client';

import React, { useState, useRef } from 'react';
import { SkillSwapInvitation } from '@/types';
import { useApp } from '@/context/AppContext';
import { getISTDateString, isISTDateTimeInFuture, parseISTTimestamp } from '@/lib/timezone';
import {
  X,
  Repeat,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Coins,
} from 'lucide-react';

interface AcceptSwapModalProps {
  invitation: SkillSwapInvitation;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AcceptSwapModal({
  invitation,
  onClose,
  onSuccess,
}: AcceptSwapModalProps) {
  const { acceptSwapProposal } = useApp();

  const [session1Date, setSession1Date] = useState(getISTDateString(1));
  const [session1Time, setSession1Time] = useState('16:00');
  const [session2Date, setSession2Date] = useState(getISTDateString(2));
  const [session2Time, setSession2Time] = useState('17:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isAccepted, setIsAccepted] = useState(false);
  const isSubmittingRef = useRef(false);

  const minDate = getISTDateString(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isSubmitting) return;

    if (!session1Date || !session1Time || !session2Date || !session2Time) {
      setErrorMsg('Please select valid dates and start times for both reciprocal sessions.');
      return;
    }

    if (!isISTDateTimeInFuture(session1Date, session1Time)) {
      setErrorMsg('Session 1 must be scheduled in the future (IST).');
      return;
    }

    if (!isISTDateTimeInFuture(session2Date, session2Time)) {
      setErrorMsg('Session 2 must be scheduled in the future (IST).');
      return;
    }

    const ts1 = parseISTTimestamp(session1Date, session1Time);
    const ts2 = parseISTTimestamp(session2Date, session2Time);
    if (Math.abs(ts1 - ts2) < 60 * 60 * 1000) {
      setErrorMsg(
        'Both sessions are 60 minutes long and cannot overlap. Please schedule them at least 60 minutes apart.'
      );
      return;
    }

    setErrorMsg('');
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const result = await acceptSwapProposal(
        invitation.id,
        session1Date,
        session1Time,
        session2Date,
        session2Time
      );

      if (!result.success) {
        setErrorMsg(result.error || 'Could not accept mutual swap proposal.');
        return;
      }

      setIsAccepted(true);
      onSuccess?.();
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-[#22211F] border border-[#37332E] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#37332E] flex items-start justify-between gap-4 bg-[#1B1A18] shrink-0">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#65C995]/15 border border-[#65C995]/30 text-[#65C995] mb-2">
              <Repeat className="w-3.5 h-3.5" />
              Schedule Both Swap Sessions
            </span>
            <h2 className="text-xl font-bold text-[#F7F5F0]">
              {isAccepted
                ? 'Mutual Swap Confirmed'
                : `Accept Swap with ${invitation.senderName || 'Peer'}`}
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

        <div className="p-6 overflow-y-auto">
          {isAccepted ? (
            <div className="py-4 text-center space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-[#65C995]/15 border border-[#65C995]/30 text-[#65C995] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[#F7F5F0]">Both Sessions Created</h3>
                <p className="text-sm text-[#AAA69F] leading-relaxed">
                  Both reciprocal sessions are now active in My Sessions. You can add Google Meet links for the session you teach.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-sm font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Session 1 Scheduling */}
              <div className="bg-[#2B2824] border border-[#37332E] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#FF9B45]">
                      Session 1 · You Learn
                    </p>
                    <p className="text-sm font-bold text-[#F7F5F0] mt-0.5">
                      {invitation.offeredSkillTitle}
                    </p>
                    <p className="text-xs text-[#AAA69F]">
                      Taught by {invitation.senderName || 'Sender'} (60 min)
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#171715] border border-[#37332E] text-xs font-bold text-[#FF9B45]">
                    <Coins className="w-3.5 h-3.5" />
                    {invitation.credits} Cr
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-[#AAA69F] mb-1.5">
                      Date (IST)
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-[#AAA69F] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="date"
                        min={minDate}
                        value={session1Date}
                        onChange={(e) => setSession1Date(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#AAA69F] mb-1.5">
                      Start Time (IST)
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-[#AAA69F] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="time"
                        value={session1Time}
                        onChange={(e) => setSession1Time(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Session 2 Scheduling */}
              <div className="bg-[#2B2824] border border-[#37332E] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#65C995]">
                      Session 2 · You Teach
                    </p>
                    <p className="text-sm font-bold text-[#F7F5F0] mt-0.5">
                      {invitation.requestedSkillTitle}
                    </p>
                    <p className="text-xs text-[#AAA69F]">
                      You mentor {invitation.senderName || 'Sender'} (60 min)
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#171715] border border-[#37332E] text-xs font-bold text-[#65C995]">
                    <Coins className="w-3.5 h-3.5" />
                    +{invitation.credits} Cr
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-[#AAA69F] mb-1.5">
                      Date (IST)
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-[#AAA69F] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="date"
                        min={minDate}
                        value={session2Date}
                        onChange={(e) => setSession2Date(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#AAA69F] mb-1.5">
                      Start Time (IST)
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-[#AAA69F] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="time"
                        value={session2Time}
                        onChange={(e) => setSession2Time(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#AAA69F]">
                Note: Both sessions are 60 minutes long and must be scheduled at future IST times without overlapping.
              </p>

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
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] disabled:opacity-50 text-[#171715] text-sm font-bold transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Confirming Swap...
                    </>
                  ) : (
                    'Accept & Confirm Both Sessions'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
