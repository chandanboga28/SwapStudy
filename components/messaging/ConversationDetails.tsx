'use client';

import React from 'react';
import { Skill, User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import {
  X,
  Star,
  GraduationCap,
  Repeat,
  ArrowUpRight,
  Clock,
  Coins,
  User as UserIcon,
} from 'lucide-react';

interface ConversationDetailsProps {
  partner: User;
  onViewProfile: (student: User) => void;
  onBookSkill: (skill: Skill) => void;
  onOpenInviteSwap: () => void;
  onClose?: () => void;
}

export default function ConversationDetails({
  partner,
  onViewProfile,
  onBookSkill,
  onOpenInviteSwap,
  onClose,
}: ConversationDetailsProps) {
  const { user } = useAuth();
  const { skills } = useApp();

  const partnerListings = skills.filter((s) => s.teacherId === partner.id);

  const hasMutualSynergy = Boolean(
    user &&
      partner.skillsToTeach.some((s) =>
        user.skillsToLearn.some((w) => s.toLowerCase().includes(w.toLowerCase()))
      ) &&
      user.skillsToTeach.some((s) =>
        partner.skillsToLearn.some((w) => s.toLowerCase().includes(w.toLowerCase()))
      )
  );

  return (
    <div className="flex flex-col h-full bg-[#111110] border-l border-[#37332E] overflow-y-auto p-5 space-y-6">
      {onClose && (
        <div className="flex items-center justify-between xl:hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-[#AAA69F]">
            Peer Details
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#22211F] border border-[#37332E] text-[#AAA69F]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Partner Card */}
      <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-5 text-center space-y-3">
        <img
          src={partner.avatar}
          alt={partner.name}
          className="w-16 h-16 rounded-full object-cover border border-[#37332E] bg-[#171715] mx-auto"
        />
        <div>
          <h3 className="text-base font-bold text-[#F7F5F0]">{partner.name}</h3>
          <p className="text-xs text-[#AAA69F] flex items-center justify-center gap-1 mt-0.5">
            <GraduationCap className="w-3.5 h-3.5 text-[#FF9B45]" />
            {partner.major || partner.university}
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 pt-1 text-xs text-[#AAA69F]">
          <span className="inline-flex items-center gap-1 font-bold text-[#F7F5F0]">
            <Star className="w-3.5 h-3.5 text-[#FF9B45] fill-[#FF9B45]" />
            {partner.repRating > 0 ? partner.repRating.toFixed(1) : 'New'}
          </span>
          <span>{partner.totalHoursTaught}h taught</span>
        </div>

        <button
          type="button"
          onClick={() => onViewProfile(partner)}
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-full bg-[#2B2824] hover:bg-[#37332E] border border-[#37332E] text-xs font-semibold text-[#F7F5F0] transition-colors cursor-pointer"
        >
          <UserIcon className="w-3.5 h-3.5 text-[#AAA69F]" />
          View Full Profile
        </button>
      </div>

      {/* Synergy Box */}
      {hasMutualSynergy && (
        <div className="bg-[#65C995]/10 border border-[#65C995]/30 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#65C995]">
            <Repeat className="w-4 h-4" />
            Mutual Skill Synergy
          </div>
          <p className="text-xs text-[#F7F5F0]/85 leading-relaxed">
            You both have skills on each other&apos;s wishlist. Send a swap invite directly!
          </p>
          <button
            type="button"
            onClick={onOpenInviteSwap}
            className="w-full py-2 rounded-full bg-[#65C995] hover:bg-[#53b984] text-[#171715] text-xs font-bold transition-colors cursor-pointer"
          >
            Send Swap Invite
          </button>
        </div>
      )}

      {/* Partner Listings */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-[#AAA69F]">
          Skills They Teach ({partnerListings.length})
        </p>
        {partnerListings.length > 0 ? (
          <div className="space-y-2.5">
            {partnerListings.map((skill) => (
              <div
                key={skill.id}
                className="bg-[#22211F] border border-[#37332E] rounded-xl p-3.5 space-y-2.5"
              >
                <p className="text-sm font-bold text-[#F7F5F0] leading-snug">{skill.title}</p>
                <div className="flex items-center justify-between text-xs text-[#AAA69F]">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {skill.sessionDurationMinutes}m
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-[#FF9B45]">
                    <Coins className="w-3 h-3" />
                    {skill.hourlyCredits} Cr
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onBookSkill(skill)}
                  className="w-full inline-flex items-center justify-center gap-1 py-2 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-xs font-bold transition-colors cursor-pointer"
                >
                  Book Session
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#AAA69F]">No active listings published yet.</p>
        )}
      </div>

      {/* Wishlist */}
      {partner.skillsToLearn.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#AAA69F]">
            Looking to Learn
          </p>
          <div className="flex flex-wrap gap-1.5">
            {partner.skillsToLearn.map((tag, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-[#22211F] border border-[#37332E] text-xs font-medium text-[#AAA69F]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
