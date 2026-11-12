'use client';

import React from 'react';
import Link from 'next/link';
import { Skill } from '@/types';
import { Star, Clock, Coins, ArrowUpRight, Repeat, Sparkles } from 'lucide-react';

interface SkillCardProps {
  skill: Skill;
  onBook?: (skill: Skill) => void;
  matchBadge?: 'wishlist' | 'mutual' | null;
}

export default function SkillCard({ skill, onBook, matchBadge }: SkillCardProps) {
  return (
    <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] hover:-translate-y-0.5 hover:shadow-[4.5px_4.5px_0_#B5B0A3] rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 group">
      <div>
        {/* Top Row: Category, Match Indicator & Credit Cost */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-[#E6E3DA] border border-[#4A4E57] text-[#1F2227]">
              {skill.category}
            </span>
            {matchBadge === 'mutual' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-[#DCF2E4] border border-[#47785B] text-[#195434]">
                <Repeat className="w-3 h-3" />
                Mutual Swap
              </span>
            )}
            {matchBadge === 'wishlist' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-[#DCEB8E] border border-[#4A4E57] text-[#1F2227]">
                <Sparkles className="w-3 h-3" />
                Wishlist Match
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-[#25282E] border border-[#4A4E57] text-[#CCE27A] shrink-0">
            <Coins className="w-3.5 h-3.5" />
            {skill.hourlyCredits} {skill.hourlyCredits === 1 ? 'CR' : 'CR'}
          </span>
        </div>

        {/* Title */}
        <Link href={`/skills/${skill.id}`} className="block mb-2">
          <h3 className="text-lg sm:text-xl font-extrabold text-[#1F2227] group-hover:text-[#2F4D96] transition-colors leading-snug line-clamp-2">
            {skill.title}
          </h3>
        </Link>

        {/* Level & Duration Meta */}
        <div className="flex items-center gap-3 text-xs font-mono font-semibold text-[#464B55] mb-3">
          <span>{skill.level}</span>
          <span className="w-1 h-1 rounded-full bg-[#4A4E57]" />
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#464B55]" />
            {skill.sessionDurationMinutes}m session
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-[#3A3E47] leading-relaxed line-clamp-2 mb-4">
          {skill.description}
        </p>

        {/* Topics Tags */}
        {skill.topics && skill.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {skill.topics.slice(0, 3).map((topic, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#EFECE4] border border-[#CEC9BC] text-[#363940]"
              >
                {topic}
              </span>
            ))}
            {skill.topics.length > 3 && (
              <span className="px-2 py-1 text-xs font-mono font-bold text-[#464B55]">
                +{skill.topics.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer: Teacher & Action */}
      <div className="pt-4 border-t border-dashed border-[#B9B4A8] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={skill.teacherAvatar}
            alt={skill.teacherName}
            className="w-9 h-9 rounded-lg object-cover border-[1.5px] border-[#4A4E57] bg-[#EFECE4] shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#1F2227] truncate">{skill.teacherName}</p>
            {skill.teacherUniversity && (
              <p className="text-[11px] font-medium text-[#525763] truncate">{skill.teacherUniversity}</p>
            )}
            <div className="flex items-center gap-1.5 text-xs text-[#464B55] mt-0.5">
              <Star className="w-3.5 h-3.5 text-[#8A6500] fill-[#F4DC82] shrink-0" />
              <span className="font-bold text-[#1F2227]">
                {skill.teacherRating > 0 ? skill.teacherRating.toFixed(1) : 'New'}
              </span>
              {skill.reviewsCount > 0 && (
                <span>({skill.reviewsCount})</span>
              )}
            </div>
          </div>
        </div>

        {onBook ? (
          <button
            onClick={() => onBook(skill)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-xs font-mono font-bold transition-colors shrink-0 cursor-pointer"
          >
            BOOK_SLOT
            <ArrowUpRight className="w-4 h-4" />
          </button>
        ) : (
          <Link
            href={`/skills/${skill.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F4DC82] hover:bg-[#EDD066] border-[1.5px] border-[#4A4E57] shadow-[0_2px_0_#9D998F] text-[#1F2227] text-xs font-mono font-bold transition-colors shrink-0"
          >
            DETAILS
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
