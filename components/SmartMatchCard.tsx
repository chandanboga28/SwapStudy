'use client';

import React from 'react';
import { SmartMatch } from '@/types';
import {
  Repeat,
  Sparkles,
  BookOpen,
  Star,
  Clock,
  Coins,
  ArrowRight,
  CheckCircle2,
  User as UserIcon,
  GraduationCap,
} from 'lucide-react';

interface SmartMatchCardProps {
  match: SmartMatch;
  onRequestExchange: (match: SmartMatch) => void;
  onProposeSwap?: (match: SmartMatch) => void;
  onViewProfile: (studentId: string) => void;
}

export default function SmartMatchCard({
  match,
  onRequestExchange,
  onProposeSwap,
  onViewProfile,
}: SmartMatchCardProps) {
  const {
    candidate,
    matchType,
    score,
    compatibilityTier,
    skillTheyTeach,
    matchedListing,
    skillYouTeach,
    creditCost,
    hasEnoughCredits,
    creditsNeeded,
    explanation,
    isExistingRequestPending,
    existingSessionStatus,
  } = match;

  const isMutual = matchType === 'mutual';
  const isOneWayLearn = matchType === 'one-way-learn';

  const handlePrimaryAction = () => {
    if (isMutual && onProposeSwap) {
      onProposeSwap(match);
    } else {
      onRequestExchange(match);
    }
  };

  return (
    <div className="bg-[#22211F] border border-[#37332E] hover:border-[#4F4942] rounded-2xl p-6 flex flex-col justify-between transition-all duration-200">
      <div>
        {/* Header: Tier Badge & Score */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              isMutual
                ? 'bg-[#65C995]/15 text-[#65C995] border-[#65C995]/30'
                : isOneWayLearn
                ? 'bg-[#FF9B45]/15 text-[#FF9B45] border-[#FF9B45]/30'
                : 'bg-[#F5B66B]/15 text-[#F5B66B] border-[#F5B66B]/30'
            }`}
          >
            {isMutual ? (
              <Repeat className="w-3.5 h-3.5" />
            ) : isOneWayLearn ? (
              <Sparkles className="w-3.5 h-3.5" />
            ) : (
              <BookOpen className="w-3.5 h-3.5" />
            )}
            {compatibilityTier}
          </span>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#171715] border border-[#37332E] text-xs font-bold text-[#F7F5F0]">
            <span className="text-[#FF9B45] tabular-nums">{score}%</span> Match
          </div>
        </div>

        {/* Peer Identity */}
        <div className="flex items-start gap-3.5 mb-4">
          <button
            type="button"
            onClick={() => onViewProfile(candidate.id)}
            className="shrink-0 group cursor-pointer"
          >
            <img
              src={candidate.avatar}
              alt={candidate.name}
              className="w-12 h-12 rounded-full object-cover border border-[#37332E] group-hover:border-[#FF9B45] transition-colors bg-[#171715]"
            />
          </button>
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => onViewProfile(candidate.id)}
              className="text-left group cursor-pointer"
            >
              <h3 className="text-lg font-bold text-[#F7F5F0] group-hover:text-[#FF9B45] transition-colors truncate">
                {candidate.name}
              </h3>
            </button>
            <p className="text-xs text-[#AAA69F] flex items-center gap-1.5 mt-0.5 truncate">
              <GraduationCap className="w-3.5 h-3.5 text-[#AAA69F] shrink-0" />
              <span className="truncate">
                {candidate.major || 'Student'} · {candidate.university}
              </span>
            </p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-[#AAA69F]">
              <span className="inline-flex items-center gap-1 font-semibold text-[#F7F5F0]">
                <Star className="w-3.5 h-3.5 text-[#FF9B45] fill-[#FF9B45]" />
                {candidate.repRating > 0 ? candidate.repRating.toFixed(1) : 'New'}
              </span>
              <span>{candidate.totalHoursTaught}h taught</span>
            </div>
          </div>
        </div>

        {/* Exchange Breakdown Box */}
        <div className="bg-[#2B2824] border border-[#37332E] rounded-xl p-4 space-y-3 mb-4">
          {isMutual ? (
            <>
              <div className="flex items-start justify-between gap-2 text-sm">
                <span className="text-xs font-semibold text-[#AAA69F] uppercase tracking-wider shrink-0 pt-0.5">
                  They teach
                </span>
                <span className="font-bold text-[#F7F5F0] text-right truncate">
                  {matchedListing?.title || skillTheyTeach}
                </span>
              </div>
              <div className="border-t border-[#37332E]" />
              <div className="flex items-start justify-between gap-2 text-sm">
                <span className="text-xs font-semibold text-[#AAA69F] uppercase tracking-wider shrink-0 pt-0.5">
                  You offer
                </span>
                <span className="font-bold text-[#FF9B45] text-right truncate">
                  {skillYouTeach || 'Mutual Skill'}
                </span>
              </div>
            </>
          ) : isOneWayLearn ? (
            <div className="flex items-start justify-between gap-2 text-sm">
              <span className="text-xs font-semibold text-[#AAA69F] uppercase tracking-wider shrink-0 pt-0.5">
                Available
              </span>
              <span className="font-bold text-[#F7F5F0] text-right truncate">
                {matchedListing?.title || skillTheyTeach}
              </span>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2 text-sm">
              <span className="text-xs font-semibold text-[#AAA69F] uppercase tracking-wider shrink-0 pt-0.5">
                Needs Help In
              </span>
              <span className="font-bold text-[#F5B66B] text-right truncate">
                {skillYouTeach || 'Your Skill'}
              </span>
            </div>
          )}

          {matchedListing && (
            <div className="pt-2 border-t border-[#37332E] flex items-center justify-between text-xs text-[#AAA69F]">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {matchedListing.sessionDurationMinutes} min
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-[#FF9B45]">
                <Coins className="w-3.5 h-3.5" />
                {creditCost} {creditCost === 1 ? 'Credit' : 'Credits'}
              </span>
            </div>
          )}
        </div>

        {/* Explanation */}
        <p className="text-sm text-[#AAA69F] leading-relaxed mb-5 line-clamp-2">
          {explanation}
        </p>
      </div>

      {/* Footer Actions */}
      <div className="space-y-2.5 pt-3 border-t border-[#37332E]">
        {!isExistingRequestPending && isOneWayLearn && !hasEnoughCredits && creditsNeeded > 0 && (
          <p className="text-xs font-medium text-[#F5B66B] bg-[#F5B66B]/10 border border-[#F5B66B]/25 rounded-lg px-3 py-2">
            You need {creditsNeeded} more {creditsNeeded === 1 ? 'credit' : 'credits'} to book. Teach a session to earn credits.
          </p>
        )}

        <div className="flex items-center gap-2.5">
          {isExistingRequestPending ? (
            <div className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#2B2824] border border-[#37332E] text-sm font-bold text-[#AAA69F]">
              <CheckCircle2 className="w-4 h-4 text-[#65C995]" />
              {existingSessionStatus === 'confirmed' ? 'Session Confirmed' : 'Request Pending'}
            </div>
          ) : (
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-sm font-bold transition-colors cursor-pointer"
            >
              {isMutual
                ? 'Request Exchange'
                : isOneWayLearn
                ? 'Request Session'
                : 'Connect to Teach'}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onViewProfile(candidate.id)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-full bg-[#2B2824] hover:bg-[#37332E] border border-[#37332E] text-sm font-semibold text-[#F7F5F0] transition-colors shrink-0 cursor-pointer"
            title="View Student Profile"
          >
            <UserIcon className="w-4 h-4 text-[#AAA69F]" />
            <span className="hidden sm:inline">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
