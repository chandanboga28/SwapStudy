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
    <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] hover:-translate-y-0.5 hover:shadow-[4.5px_4.5px_0_#B5B0A3] rounded-2xl p-6 flex flex-col justify-between transition-all duration-200">
      <div>
        {/* Header: Tier Badge & OLED Score */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[11px] font-bold border ${
              isMutual
                ? 'bg-[#DCF2E4] text-[#195434] border-[#47785B]'
                : isOneWayLearn
                ? 'bg-[#DCEB8E] text-[#1F2227] border-[#4A4E57]'
                : 'bg-[#F4DC82] text-[#1F2227] border-[#4A4E57]'
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

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#25282E] border border-[#4A4E57] font-mono text-[11px] font-bold text-[#F2EFE8]">
            <span className="text-[#CCE27A] tabular-nums">{score}%</span> MATCH
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
              className="w-12 h-12 rounded-xl object-cover border-[1.5px] border-[#4A4E57] group-hover:border-[#3B5CA8] transition-colors bg-[#EFECE4]"
            />
          </button>
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => onViewProfile(candidate.id)}
              className="text-left group cursor-pointer"
            >
              <h3 className="text-lg font-extrabold text-[#1F2227] group-hover:text-[#2F4D96] transition-colors truncate">
                {candidate.name}
              </h3>
            </button>
            <p className="text-xs text-[#464B55] flex items-center gap-1.5 mt-0.5 truncate">
              <GraduationCap className="w-3.5 h-3.5 text-[#464B55] shrink-0" />
              <span className="truncate font-medium">
                {candidate.major || 'Student'} · {candidate.university}
              </span>
            </p>
            <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-[#464B55]">
              <span className="inline-flex items-center gap-1 font-bold text-[#1F2227]">
                <Star className="w-3.5 h-3.5 text-[#8A6500] fill-[#F4DC82]" />
                {candidate.repRating > 0 ? candidate.repRating.toFixed(1) : 'New'}
              </span>
              <span>{candidate.totalHoursTaught}h taught</span>
            </div>
          </div>
        </div>

        {/* Exchange Breakdown Box */}
        <div className="bg-[#E6E3DA] border-[1.5px] border-[#4A4E57] rounded-xl p-4 space-y-2.5 mb-4">
          {isMutual ? (
            <>
              <div className="flex items-start justify-between gap-2 text-sm">
                <span className="font-mono text-[11px] font-bold text-[#464B55] uppercase tracking-wider shrink-0 pt-0.5">
                  They teach
                </span>
                <span className="font-bold text-[#1F2227] text-right truncate">
                  {matchedListing?.title || skillTheyTeach}
                </span>
              </div>
              <div className="border-t border-dashed border-[#A8A396]" />
              <div className="flex items-start justify-between gap-2 text-sm">
                <span className="font-mono text-[11px] font-bold text-[#2F4D96] uppercase tracking-wider shrink-0 pt-0.5">
                  You offer
                </span>
                <span className="font-bold text-[#2F4D96] text-right truncate">
                  {skillYouTeach || 'Mutual Skill'}
                </span>
              </div>
            </>
          ) : isOneWayLearn ? (
            <div className="flex items-start justify-between gap-2 text-sm">
              <span className="font-mono text-[11px] font-bold text-[#464B55] uppercase tracking-wider shrink-0 pt-0.5">
                Available
              </span>
              <span className="font-bold text-[#1F2227] text-right truncate">
                {matchedListing?.title || skillTheyTeach}
              </span>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2 text-sm">
              <span className="font-mono text-[11px] font-bold text-[#9E3922] uppercase tracking-wider shrink-0 pt-0.5">
                Needs Help In
              </span>
              <span className="font-bold text-[#1F2227] text-right truncate">
                {skillYouTeach || 'Your Skill'}
              </span>
            </div>
          )}

          {matchedListing && (
            <div className="pt-2 border-t border-dashed border-[#A8A396] flex items-center justify-between text-xs font-mono font-bold text-[#464B55]">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {matchedListing.sessionDurationMinutes}m
              </span>
              <span className="inline-flex items-center gap-1 text-[#2F4D96]">
                <Coins className="w-3.5 h-3.5" />
                {creditCost} {creditCost === 1 ? 'Credit' : 'Credits'}
              </span>
            </div>
          )}
        </div>

        {/* Explanation */}
        <p className="text-sm text-[#3A3E47] leading-relaxed mb-5 line-clamp-2">
          {explanation}
        </p>
      </div>

      {/* Footer Actions */}
      <div className="space-y-2.5 pt-3 border-t border-dashed border-[#B9B4A8]">
        {!isExistingRequestPending && isOneWayLearn && !hasEnoughCredits && creditsNeeded > 0 && (
          <p className="text-xs font-bold text-[#5C4609] bg-[#FBF0C9] border border-[#8C7228] rounded-lg px-3 py-2">
            You need {creditsNeeded} more {creditsNeeded === 1 ? 'credit' : 'credits'} to book. Teach a session to earn credits.
          </p>
        )}

        <div className="flex items-center gap-2.5">
          {isExistingRequestPending ? (
            <div className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#DCF2E4] border-[1.5px] border-[#47785B] text-xs font-mono font-bold text-[#195434]">
              <CheckCircle2 className="w-4 h-4 text-[#195434]" />
              {existingSessionStatus === 'confirmed' ? 'SESSION_CONFIRMED' : 'REQUEST_PENDING'}
            </div>
          ) : (
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-xs font-mono font-bold transition-colors cursor-pointer"
            >
              {isMutual
                ? 'PATCH_EXCHANGE'
                : isOneWayLearn
                ? 'REQUEST_SLOT'
                : 'CONNECT_TO_TEACH'}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onViewProfile(candidate.id)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#E6E3DA] hover:bg-[#EFECE4] border-[1.5px] border-[#4A4E57] shadow-[0_2px_0_#9D998F] text-xs font-mono font-bold text-[#1F2227] transition-colors shrink-0 cursor-pointer"
            title="View Student Profile"
          >
            <UserIcon className="w-4 h-4 text-[#464B55]" />
            <span className="hidden sm:inline">PROFILE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
