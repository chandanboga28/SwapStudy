'use client';

import React, { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { SmartMatch } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import {
  X,
  Repeat,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Coins,
  ShieldCheck,
} from 'lucide-react';

interface MutualSwapModalProps {
  match: SmartMatch;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function MutualSwapModal({ match, onClose, onSuccess }: MutualSwapModalProps) {
  const { user } = useAuth();
  const { skills, sendSwapProposal } = useApp();

  const myListings = useMemo(
    () => (user ? skills.filter((s) => s.teacherId === user.id) : []),
    [skills, user]
  );

  const peerListings = useMemo(
    () => skills.filter((s) => s.teacherId === match.candidate.id),
    [skills, match.candidate.id]
  );

  const defaultOfferedId = useMemo(() => {
    if (match.skillYouTeach) {
      const target = match.skillYouTeach.toLowerCase();
      const matched = myListings.find(
        (s) => s.title.toLowerCase().includes(target) || target.includes(s.title.toLowerCase())
      );
      if (matched) return matched.id;
    }
    return myListings[0]?.id || '';
  }, [myListings, match.skillYouTeach]);

  const defaultRequestedId = useMemo(() => {
    if (match.matchedListing?.id) return match.matchedListing.id;
    return peerListings[0]?.id || '';
  }, [match.matchedListing, peerListings]);

  const [offeredSkillId, setOfferedSkillId] = useState(defaultOfferedId);
  const [requestedSkillId, setRequestedSkillId] = useState(defaultRequestedId);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const isSubmittingRef = useRef(false);

  const offeredSkill = myListings.find((s) => s.id === offeredSkillId) || myListings[0];
  const requestedSkill = peerListings.find((s) => s.id === requestedSkillId) || match.matchedListing;
  const swapCredits = requestedSkill?.hourlyCredits || match.creditCost || 1;
  const canSubmit = Boolean(user && offeredSkill && requestedSkill && user.credits >= swapCredits);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isSubmitting) return;

    if (!user) {
      setErrorMsg('Please log in to send a mutual swap proposal.');
      return;
    }
    if (!offeredSkill) {
      setErrorMsg('Publish a skill listing first so you can offer it in this exchange.');
      return;
    }
    if (!requestedSkill) {
      setErrorMsg('Selected peer skill listing is unavailable.');
      return;
    }
    if (user.credits < swapCredits) {
      setErrorMsg(`You need at least ${swapCredits} credit(s) in escrow balance to propose this swap.`);
      return;
    }

    setErrorMsg('');
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const res = await sendSwapProposal({
        recipientId: match.candidate.id,
        offeredSkillId: offeredSkill.id,
        offeredSkillTitle: offeredSkill.title,
        requestedSkillId: requestedSkill.id,
        requestedSkillTitle: requestedSkill.title,
        credits: swapCredits,
        note: note.trim() || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to submit mutual swap proposal.');
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
      <div className="w-full max-w-xl bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#CEC9BC] flex items-start justify-between gap-4 bg-[#E6E3DA] shrink-0">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DCF2E4] border border-[#47785B] text-[#195434] mb-2">
              <Repeat className="w-3.5 h-3.5" />
              Mutual Skill Exchange ({match.score}% Match)
            </span>
            <h2 className="text-xl font-bold text-[#1F2227]">
              {isSuccess ? 'Mutual Swap Proposal Sent' : `Propose Exchange with ${match.candidate.name}`}
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

        <div className="p-6 overflow-y-auto">
          {isSuccess ? (
            <div className="py-4 text-center space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-[#DCF2E4] border border-[#47785B] text-[#195434] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[#1F2227]">Proposal Delivered</h3>
                <p className="text-sm text-[#464B55] max-w-md mx-auto leading-relaxed">
                  {match.candidate.name} can now review both skills and schedule separate sessions for your reciprocal exchange.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-sm font-bold transition-colors cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Two-sided Exchange Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Side 1: You Teach */}
                <div className="bg-[#E6E3DA] border border-[#4A4E57] rounded-xl p-4 space-y-2.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#2F4D96]">
                    You Offer to Teach
                  </p>
                  {myListings.length > 0 ? (
                    <>
                      <select
                        value={offeredSkill?.id || ''}
                        onChange={(e) => setOfferedSkillId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm font-semibold text-[#1F2227] focus:outline-none"
                      >
                        {myListings.map((skill) => (
                          <option key={skill.id} value={skill.id} className="bg-[#F8F6F0]">
                            {skill.title}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-[#464B55]">
                        {match.candidate.name} wants to learn:{' '}
                        <span className="text-[#1F2227] font-semibold">
                          {match.skillYouTeach || offeredSkill?.title}
                        </span>
                      </p>
                    </>
                  ) : (
                    <div className="space-y-2.5">
                      <p className="text-xs text-[#9E3922]">
                        You have no active teaching listing yet. Publish one to propose a mutual swap.
                      </p>
                      <Link
                        href="/teach"
                        onClick={onClose}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2F4D96] hover:text-[#9E3922]"
                      >
                        Publish a skill listing
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Side 2: You Learn */}
                <div className="bg-[#E6E3DA] border border-[#4A4E57] rounded-xl p-4 space-y-2.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#195434]">
                    {match.candidate.name} Teaches You
                  </p>
                  {peerListings.length > 0 ? (
                    <select
                      value={requestedSkill?.id || ''}
                      onChange={(e) => setRequestedSkillId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm font-semibold text-[#1F2227] focus:outline-none"
                    >
                      {peerListings.map((skill) => (
                        <option key={skill.id} value={skill.id} className="bg-[#F8F6F0]">
                          {skill.title}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-bold text-[#1F2227]">
                      {requestedSkill?.title || match.skillTheyTeach}
                    </p>
                  )}
                  <p className="text-xs text-[#464B55]">
                    Matches your wishlist:{' '}
                    <span className="text-[#1F2227] font-semibold">{match.skillTheyTeach}</span>
                  </p>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#464B55] mb-2">
                  Proposal Message (Optional)
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Introduce yourself and suggest preferred days or topics for both sessions..."
                  className="w-full px-4 py-3 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] placeholder-[#5A606B] focus:outline-none resize-none"
                />
              </div>

              {/* Balanced Escrow Summary */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#EFECE4] border border-[#4A4E57] text-xs text-[#464B55] leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-[#195434] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[#1F2227] font-bold inline-flex items-center gap-1">
                    Balanced Credit Escrow ({swapCredits} <Coins className="w-3 h-3 text-[#2F4D96] inline" /> each way):
                  </span>{' '}
                  When {match.candidate.name} accepts, separate schedules are created for both sessions. Completing both sessions nets zero cost while protecting partial completions.
                </div>
              </div>

              {user && user.credits < swapCredits && (
                <div className="flex items-start gap-2 p-3.5 rounded-xl bg-[#FBF0C9] border border-[#8C7228] text-xs font-semibold text-[#5C4609]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    You need {swapCredits} credit(s) available for swap escrow protection (current balance: {user.credits}).
                  </span>
                </div>
              )}

              {errorMsg && (
                <div className="flex items-start gap-2 p-3.5 rounded-xl bg-[#FCE7E3] border border-[#B34B39] text-sm text-[#8F2618]">
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
                  disabled={isSubmitting || !canSubmit}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] disabled:opacity-50 border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-sm font-bold transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending Proposal...
                    </>
                  ) : (
                    'Send Swap Proposal'
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
