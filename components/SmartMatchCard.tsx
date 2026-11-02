'use client';

import React from 'react';
import { SmartMatch, Skill } from '@/types';
import {
  ArrowRightLeft,
  Sparkles,
  Star,
  GraduationCap,
  Clock,
  ArrowRight,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface SmartMatchCardProps {
  match: SmartMatch;
  onRequestExchange: (skill: Skill) => void;
  onViewProfile: () => void;
}

export default function SmartMatchCard({
  match,
  onRequestExchange,
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

  return (
    <div
      className={`card-subtle rounded-2xl p-5 space-y-4 transition-all duration-200 border ${
        isMutual
          ? 'bg-gradient-to-b from-emerald-50/40 via-white to-white border-emerald-300/80 shadow-xs ring-1 ring-emerald-500/10'
          : 'bg-white border-slate-200/80 hover:border-slate-300'
      }`}
    >
      {/* Header: Candidate Info & Compatibility Pill */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <img
              src={candidate.avatar}
              alt={candidate.name}
              className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-xs"
            />
            {isMutual && (
              <span
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-2 ring-white shadow-xs"
                title="Mutual Skill Swap Opportunity"
              >
                <ArrowRightLeft className="w-2.5 h-2.5" />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 truncate">{candidate.name}</h4>
              <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/50">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                {candidate.repRating?.toFixed(1) || '5.0'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
              <GraduationCap className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{candidate.university}</span>
            </p>
          </div>
        </div>

        {/* Compatibility Badge */}
        <div className="shrink-0 text-right">
          {isMutual ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300/60 shadow-xs">
              <ArrowRightLeft className="w-3 h-3 text-emerald-700 animate-pulse" />
              {score}% Mutual Match
            </span>
          ) : matchType === 'one-way-learn' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200/60">
              <Sparkles className="w-3 h-3 text-blue-600" />
              {score}% Wishlist Match
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200/70">
              {score}% Compatible
            </span>
          )}
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">{compatibilityTier}</p>
        </div>
      </div>

      {/* Exchange Synergy Breakdown */}
      <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 space-y-2">
        {/* They Teach */}
        <div className="flex items-center justify-between text-xs gap-2">
          <span className="text-[11px] font-medium text-slate-500 shrink-0">They offer:</span>
          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 truncate">
            {skillTheyTeach}
          </span>
        </div>

        {/* You Teach (for mutual match) */}
        {isMutual && skillYouTeach && (
          <div className="flex items-center justify-between text-xs gap-2 pt-1 border-t border-slate-200/50">
            <span className="text-[11px] font-medium text-slate-500 shrink-0">You teach:</span>
            <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 truncate">
              {skillYouTeach}
            </span>
          </div>
        )}
      </div>

      {/* Transparent Match Reason Explanation */}
      <p className="text-xs text-slate-600 leading-relaxed bg-white/70 px-1">
        {explanation}
      </p>

      {/* Cost & Action Footer */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
        {/* Credit Info */}
        <div className="text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <span>{creditCost} {creditCost === 1 ? 'Credit' : 'Credits'}</span>
            {hasEnoughCredits ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/50">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                Balance Ready
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/50">
                <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
                Needs {creditsNeeded} more
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {matchedListing
              ? `${matchedListing.sessionDurationMinutes || 60} min session`
              : 'Direct exchange opportunity'}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onViewProfile}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold bg-white transition-colors flex items-center gap-1"
          >
            <UserIcon className="w-3 h-3 text-slate-400" />
            Profile
          </button>

          {isExistingRequestPending ? (
            <button
              disabled
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 text-xs font-semibold border border-slate-200 cursor-not-allowed flex items-center gap-1"
              title="You already have an active request or confirmed session with this student."
            >
              <Clock className="w-3 h-3" />
              {existingSessionStatus === 'confirmed' ? 'Confirmed' : 'Request Pending'}
            </button>
          ) : matchedListing ? (
            <button
              onClick={() => onRequestExchange(matchedListing)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-xs hover:shadow flex items-center gap-1"
            >
              Request Exchange
              <ArrowRight className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={onViewProfile}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors flex items-center gap-1"
            >
              View Offerings
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
