'use client';

import React, { useMemo } from 'react';
import { User, Skill } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import {
  GraduationCap,
  Star,
  Clock,
  Sparkles,
  ArrowRightLeft,
  ShieldCheck,
  BookOpen,
  User as UserIcon,
} from 'lucide-react';

interface ConversationDetailsProps {
  partner: User | null;
  conversationId?: string;
  onOpenInviteModal: () => void;
  onBookSkill: (skill: Skill) => void;
  onViewProfile: (user: User) => void;
}

export default function ConversationDetails({
  partner,
  onOpenInviteModal,
  onBookSkill,
  onViewProfile,
}: ConversationDetailsProps) {
  const { user } = useAuth();
  const { skills } = useApp();

  // Skills taught by partner
  const partnerSkills = useMemo(() => {
    if (!partner) return [];
    return skills.filter((s) => s.teacherId === partner.id);
  }, [skills, partner]);

  // Calculate mutual swap synergy
  const mutualCompatibility = useMemo(() => {
    if (!user || !partner) return null;

    const userTeaches = user.skillsToTeach || [];
    const userWants = user.skillsToLearn || [];
    const partnerTeaches = partner.skillsToTeach || [];
    const partnerWants = partner.skillsToLearn || [];

    // Partner wants what user teaches
    const userHelpsPartner = userTeaches.some((ut) =>
      partnerWants.some((pw) => pw.toLowerCase().includes(ut.toLowerCase()) || ut.toLowerCase().includes(pw.toLowerCase()))
    );

    // User wants what partner teaches
    const partnerHelpsUser = partnerTeaches.some((pt) =>
      userWants.some((uw) => uw.toLowerCase().includes(pt.toLowerCase()) || pt.toLowerCase().includes(uw.toLowerCase()))
    );

    const isMutual = userHelpsPartner && partnerHelpsUser;
    const isOneWay = userHelpsPartner || partnerHelpsUser;

    return {
      isMutual,
      isOneWay,
      score: isMutual ? 96 : isOneWay ? 78 : 65,
    };
  }, [user, partner]);

  if (!partner) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs">
        Select a conversation to view peer details.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50 border-l border-slate-200/90 overflow-y-auto p-4 space-y-4 text-xs select-none">
      {/* Student Profile Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <img
            src={partner.avatar}
            alt={partner.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/20"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-slate-900 truncate">{partner.name}</h2>
              {partner.isCollegeVerified && (
                <span title="Verified Student" className="text-emerald-600">
                  <ShieldCheck className="w-3.5 h-3.5 fill-emerald-100" />
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
              <GraduationCap className="w-3 h-3 text-slate-400" />
              {partner.major}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {partner.university} • Class of {partner.graduationYear || '2026'}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
          <div className="bg-slate-50 p-1.5 rounded-lg">
            <span className="text-[10px] text-slate-400 block font-medium">Reputation</span>
            <span className="text-xs font-bold text-slate-800 flex items-center justify-center gap-0.5 mt-0.5">
              <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
              {partner.repRating?.toFixed(1) || '5.0'}
            </span>
          </div>
          <div className="bg-slate-50 p-1.5 rounded-lg">
            <span className="text-[10px] text-slate-400 block font-medium">Taught</span>
            <span className="text-xs font-bold text-slate-800 mt-0.5 block">
              {partner.totalHoursTaught || 0} hrs
            </span>
          </div>
          <div className="bg-slate-50 p-1.5 rounded-lg">
            <span className="text-[10px] text-slate-400 block font-medium">Learned</span>
            <span className="text-xs font-bold text-slate-800 mt-0.5 block">
              {partner.totalHoursLearned || 0} hrs
            </span>
          </div>
        </div>

        {/* Quick Connection Badge */}
        <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-emerald-50/80 border border-emerald-200/60 text-emerald-800">
          <span className="font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Accepted Peer Connection
          </span>
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
            {partner.university.split(' ')[0]}
          </span>
        </div>
      </div>

      {/* Mutual Swap Compatibility Card */}
      {mutualCompatibility && (
        <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-50 rounded-2xl p-3.5 border border-emerald-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Swap Synergy
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px]">
              {mutualCompatibility.score}% Match
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {mutualCompatibility.isMutual ? (
              <span>
                <strong>Perfect Mutual Exchange!</strong> You teach what {partner.name.split(' ')[0]} wants to learn, and they teach what you desire.
              </span>
            ) : (
              <span>
                <strong>High Learning Compatibility.</strong> Strong alignment in technical curriculum and study goals.
              </span>
            )}
          </p>

          <button
            onClick={onOpenInviteModal}
            className="w-full mt-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Propose Skill Swap
          </button>
        </div>
      )}

      {/* Skills They Teach */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2.5">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            Skills They Teach
          </span>
          <span className="text-[10px] text-slate-400 lowercase font-normal">
            {partnerSkills.length} listings
          </span>
        </h3>

        <div className="space-y-2">
          {partnerSkills.map((skill) => (
            <div
              key={skill.id}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/80 transition-colors flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <span className="font-semibold text-slate-800 text-xs block truncate">
                  {skill.title}
                </span>
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <span>{skill.category}</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold">{skill.hourlyCredits} Cr/hr</span>
                </span>
              </div>
              <button
                onClick={() => onBookSkill(skill)}
                className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 hover:text-emerald-700 text-[10px] font-bold shadow-2xs transition-colors shrink-0"
              >
                Book
              </button>
            </div>
          ))}

          {partnerSkills.length === 0 && (
            <div className="flex flex-wrap gap-1">
              {partner.skillsToTeach?.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-medium border border-emerald-200/60"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* What They Want to Learn */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2.5">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          Learning Wishlist
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {partner.skillsToLearn && partner.skillsToLearn.length > 0 ? (
            partner.skillsToLearn.map((skill, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium"
              >
                {skill}
              </span>
            ))
          ) : (
            <span className="text-slate-400 text-xs">No wishlist listed</span>
          )}
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="space-y-2 pt-1">
        <button
          onClick={() => onViewProfile(partner)}
          className="w-full px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
        >
          <UserIcon className="w-3.5 h-3.5 text-slate-500" />
          View Full Student Profile
        </button>
      </div>
    </div>
  );
}
