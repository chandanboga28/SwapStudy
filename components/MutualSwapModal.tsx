'use client';

import React, { useState } from 'react';
import { SmartMatch } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';
import {
  X,
  ArrowRightLeft,
  Star,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Send,
  Plus,
} from 'lucide-react';

interface MutualSwapModalProps {
  match: SmartMatch;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function MutualSwapModal({
  match,
  onClose,
  onSuccess,
}: MutualSwapModalProps) {
  const { user } = useAuth();
  const { skills, sendSwapProposal } = useApp();

  const { candidate, skillTheyTeach, skillYouTeach, matchedListing, creditCost } = match;

  // Real active skill listings the current user owns
  const userListings = skills.filter((s) => s.teacherId === user?.id);

  // Candidate listing
  const candidateListing =
    matchedListing ||
    skills.find(
      (s) =>
        s.teacherId === candidate.id &&
        s.title.toLowerCase() === (skillTheyTeach || '').toLowerCase()
    ) ||
    skills.find((s) => s.teacherId === candidate.id);

  // Default selected listing: match.skillYouTeach or first active listing
  const initialListing =
    userListings.find(
      (s) => s.title.toLowerCase() === (skillYouTeach || '').toLowerCase()
    ) || userListings[0];

  const [selectedListingId, setSelectedListingId] = useState<string>(
    initialListing?.id || ''
  );

  const selectedListing =
    userListings.find((s) => s.id === selectedListingId) || initialListing;

  const selectedOfferedSkill = selectedListing?.title || skillYouTeach || 'Your Skill';
  const selectedRequestedSkill =
    candidateListing?.title || skillTheyTeach || 'Skill Learning';

  // Custom proposal note
  const [note, setNote] = useState<string>(
    `Hi ${candidate.name.split(' ')[0]}! I noticed you teach ${selectedRequestedSkill} and are interested in learning ${selectedOfferedSkill}. Would love to do a mutual skill swap! Let's connect and coordinate our schedules.`
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Update note when offered skill changes
  const handleOfferedSkillChange = (newListingId: string) => {
    setSelectedListingId(newListingId);
    const chosen = userListings.find((s) => s.id === newListingId);
    const title = chosen?.title || selectedOfferedSkill;
    setNote(
      `Hi ${candidate.name.split(' ')[0]}! I noticed you teach ${selectedRequestedSkill} and are interested in learning ${title}. Would love to do a mutual skill swap! Let's connect and coordinate our schedules.`
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('You must be signed in to send a skill swap proposal.');
      return;
    }

    if (user.id === candidate.id) {
      setError('You cannot propose a skill swap with yourself.');
      return;
    }

    if (!selectedListing) {
      setError('You must have at least one active skill listing to propose a mutual exchange.');
      return;
    }

    if (!candidateListing) {
      setError('The peer does not currently have an active listing available for exchange.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendSwapProposal({
        recipientId: candidate.id,
        offeredSkillId: selectedListing.id,
        offeredSkillTitle: selectedListing.title,
        requestedSkillId: candidateListing.id,
        requestedSkillTitle: candidateListing.title,
        credits: creditCost || candidateListing.hourlyCredits || 1,
        note: note.trim(),
      });

      if (res.success) {
        setIsSuccess(true);
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || 'Failed to submit mutual skill swap proposal.');
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
              <ArrowRightLeft className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 border border-emerald-400/40">
                  Reciprocal Exchange
                </span>
                <span className="text-xs font-semibold text-emerald-200">
                  {match.score}% Synergy
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
                Propose Mutual Skill Swap
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

        {/* Success View */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Swap Proposal Sent!
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Your mutual skill swap proposal has been delivered to{' '}
                <span className="font-semibold text-slate-800">{candidate.name}</span>.
                They will see it on their student dashboard and direct messages.
              </p>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-left text-xs text-slate-700 space-y-2">
              <div className="flex items-center justify-between font-semibold text-emerald-900 pb-1.5 border-b border-emerald-200/60">
                <span className="flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-700" />
                  Proposed Exchange Summary
                </span>
                <span className="text-[11px] bg-emerald-100 px-2 py-0.5 rounded text-emerald-800">
                  Pending Partner Review
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    You Teach
                  </span>
                  <span className="font-semibold text-slate-900">
                    {selectedOfferedSkill}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    They Teach
                  </span>
                  <span className="font-semibold text-slate-900">
                    {selectedRequestedSkill}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-xs"
              >
                Done & Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Reciprocal Breakdown: Both Sides Clearly Displayed */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Two-Way Exchange Overview
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                {/* Side A: You (Current User) */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/60">
                    <img
                      src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=user`}
                      alt={user?.name || 'You'}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {user?.name} (You)
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {user?.university}
                      </span>
                    </div>
                  </div>

                  {/* What you offer */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        You Offer to Teach
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Active Listing
                      </span>
                    </div>
                    {userListings.length > 1 ? (
                      <select
                        value={selectedListingId}
                        onChange={(e) => handleOfferedSkillChange(e.target.value)}
                        className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                      >
                        {userListings.map((listing) => (
                          <option key={listing.id} value={listing.id}>
                            {listing.title} ({listing.category})
                          </option>
                        ))}
                      </select>
                    ) : userListings.length === 1 ? (
                      <div className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-semibold text-slate-900">
                        {userListings[0].title}
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-900 space-y-1">
                        <p className="text-[11px] font-medium leading-tight">
                          No active teaching listing found.
                        </p>
                        <Link
                          href="/teach"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
                        >
                          <Plus className="w-3 h-3" />
                          Publish a Listing First
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* What you want to learn */}
                  <div className="space-y-1 pt-1 border-t border-slate-200/40">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      You Want to Learn
                    </span>
                    <div className="px-2.5 py-1 bg-emerald-50/70 border border-emerald-200/60 rounded-md text-xs font-semibold text-emerald-800 truncate">
                      {selectedRequestedSkill}
                    </div>
                  </div>
                </div>

                {/* Side B: Partner (Candidate) */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/60">
                    <img
                      src={candidate.avatar}
                      alt={candidate.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {candidate.name}
                        </span>
                        <span className="flex items-center text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60 shrink-0">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500 mr-0.5" />
                          {candidate.repRating?.toFixed(1) || '5.0'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {candidate.university}
                      </span>
                    </div>
                  </div>

                  {/* What they offer */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        They Offer to Teach
                      </span>
                      <span className="text-[10px] text-slate-400">
                        On your wishlist
                      </span>
                    </div>
                    <div className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 truncate">
                      {selectedRequestedSkill}
                    </div>
                  </div>

                  {/* What they want to learn */}
                  <div className="space-y-1 pt-1 border-t border-slate-200/40">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      They Want to Learn
                    </span>
                    <div className="px-2.5 py-1 bg-blue-50/70 border border-blue-200/60 rounded-md text-xs font-semibold text-blue-800 truncate">
                      {selectedOfferedSkill}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Note & Custom Message */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Personal Proposal Message</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Introduce yourself & coordinate availability
                </span>
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write a friendly proposal note..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50 text-slate-800 resize-none leading-relaxed"
                maxLength={400}
              />
              <span className="text-[10px] text-slate-400 block text-right">
                {note.length}/400 characters
              </span>
            </div>

            {/* Terms and Assurance */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-[11px] text-slate-600 space-y-1 leading-relaxed">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>How Mutual Swaps Work</span>
              </div>
              <p className="text-slate-500">
                Submitting this proposal sends a direct invitation to{' '}
                <span className="font-medium text-slate-700">{candidate.name}</span>.
                No credits are deducted until both parties review and mutually agree on session details.
              </p>
            </div>

            {/* Footer Buttons */}
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
                disabled={isSubmitting || userListings.length === 0 || !candidateListing}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-xs hover:shadow flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending Proposal...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Send Swap Proposal
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
