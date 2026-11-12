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
    <div className="flex flex-col h-full bg-[#E6E3DA] border-l border-[#4A4E57] overflow-y-auto p-5 space-y-6">
      {onClose && (
        <div className="flex items-center justify-between xl:hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-[#464B55]">
            Peer Details
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#F8F6F0] border border-[#4A4E57] text-[#464B55]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Partner Card */}
      <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-5 text-center space-y-3">
        <img
          src={partner.avatar}
          alt={partner.name}
          className="w-16 h-16 rounded-full object-cover border border-[#4A4E57] bg-[#EFECE4] mx-auto"
        />
        <div>
          <h3 className="text-base font-bold text-[#1F2227]">{partner.name}</h3>
          <p className="text-xs text-[#464B55] flex items-center justify-center gap-1 mt-0.5">
            <GraduationCap className="w-3.5 h-3.5 text-[#2F4D96]" />
            {partner.major || partner.university}
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 pt-1 text-xs text-[#464B55]">
          <span className="inline-flex items-center gap-1 font-bold text-[#1F2227]">
            <Star className="w-3.5 h-3.5 text-[#8A6500] fill-[#F4DC82]" />
            {partner.repRating > 0 ? partner.repRating.toFixed(1) : 'New'}
          </span>
          <span>{partner.totalHoursTaught}h taught</span>
        </div>

        <button
          type="button"
          onClick={() => onViewProfile(partner)}
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-full bg-[#E6E3DA] hover:bg-[#DCD8CD] border border-[#4A4E57] text-xs font-semibold text-[#1F2227] transition-colors cursor-pointer"
        >
          <UserIcon className="w-3.5 h-3.5 text-[#464B55]" />
          View Full Profile
        </button>
      </div>

      {/* Synergy Box */}
      {hasMutualSynergy && (
        <div className="bg-[#DCF2E4] border border-[#47785B] rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#195434]">
            <Repeat className="w-4 h-4" />
            Mutual Skill Synergy
          </div>
          <p className="text-xs text-[#1F2227]/85 leading-relaxed">
            You both have skills on each other&apos;s wishlist. Send a swap invite directly!
          </p>
          <button
            type="button"
            onClick={onOpenInviteSwap}
            className="w-full py-2 rounded-full bg-[#8AD7A8] hover:bg-[#77CA97] border-[1.5px] border-[#47785B] shadow-[0_2px_0_#47785B] text-[#18241C] text-xs font-bold transition-colors cursor-pointer"
          >
            Send Swap Invite
          </button>
        </div>
      )}

      {/* Partner Listings */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-[#464B55]">
          Skills They Teach ({partnerListings.length})
        </p>
        {partnerListings.length > 0 ? (
          <div className="space-y-2.5">
            {partnerListings.map((skill) => (
              <div
                key={skill.id}
                className="bg-[#F8F6F0] border border-[#4A4E57] rounded-xl p-3.5 space-y-2.5"
              >
                <p className="text-sm font-bold text-[#1F2227] leading-snug">{skill.title}</p>
                <div className="flex items-center justify-between text-xs text-[#464B55]">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {skill.sessionDurationMinutes}m
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-[#2F4D96]">
                    <Coins className="w-3 h-3" />
                    {skill.hourlyCredits} Cr
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onBookSkill(skill)}
                  className="w-full inline-flex items-center justify-center gap-1 py-2 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-xs font-bold transition-colors cursor-pointer"
                >
                  Book Session
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#464B55]">No active listings published yet.</p>
        )}
      </div>

      {/* Wishlist */}
      {partner.skillsToLearn.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#464B55]">
            Looking to Learn
          </p>
          <div className="flex flex-wrap gap-1.5">
            {partner.skillsToLearn.map((tag, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-[#F8F6F0] border border-[#4A4E57] text-xs font-medium text-[#464B55]"
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
