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
    <div className="bg-[#22211F] border border-[#37332E] hover:border-[#4F4942] rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 group">
      <div>
        {/* Top Row: Category, Match Indicator & Credit Cost */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#2B2824] border border-[#37332E] text-[#F5B66B]">
              {skill.category}
            </span>
            {matchBadge === 'mutual' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#65C995]/15 border border-[#65C995]/30 text-[#65C995]">
                <Repeat className="w-3 h-3" />
                Mutual Swap
              </span>
            )}
            {matchBadge === 'wishlist' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FF9B45]/15 border border-[#FF9B45]/30 text-[#FF9B45]">
                <Sparkles className="w-3 h-3" />
                Wishlist Match
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#171715] border border-[#37332E] text-[#FF9B45] shrink-0">
            <Coins className="w-3.5 h-3.5" />
            {skill.hourlyCredits} {skill.hourlyCredits === 1 ? 'Credit' : 'Credits'}
          </span>
        </div>

        {/* Title */}
        <Link href={`/skills/${skill.id}`} className="block mb-2">
          <h3 className="text-lg sm:text-xl font-bold text-[#F7F5F0] group-hover:text-[#FF9B45] transition-colors leading-snug line-clamp-2">
            {skill.title}
          </h3>
        </Link>

        {/* Level & Duration Meta */}
        <div className="flex items-center gap-3 text-xs font-medium text-[#AAA69F] mb-3">
          <span>{skill.level}</span>
          <span className="w-1 h-1 rounded-full bg-[#37332E]" />
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#AAA69F]" />
            {skill.sessionDurationMinutes} min session
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-[#AAA69F] leading-relaxed line-clamp-2 mb-4">
          {skill.description}
        </p>

        {/* Topics Tags */}
        {skill.topics && skill.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {skill.topics.slice(0, 3).map((topic, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#171715] border border-[#37332E] text-[#AAA69F]"
              >
                {topic}
              </span>
            ))}
            {skill.topics.length > 3 && (
              <span className="px-2 py-1 text-xs font-medium text-[#AAA69F]">
                +{skill.topics.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer: Teacher & Action */}
      <div className="pt-4 border-t border-[#37332E] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={skill.teacherAvatar}
            alt={skill.teacherName}
            className="w-9 h-9 rounded-full object-cover border border-[#37332E] bg-[#171715] shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#F7F5F0] truncate">{skill.teacherName}</p>
            <div className="flex items-center gap-1.5 text-xs text-[#AAA69F]">
              <Star className="w-3.5 h-3.5 text-[#FF9B45] fill-[#FF9B45] shrink-0" />
              <span className="font-semibold text-[#F7F5F0]">
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
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-sm font-bold transition-colors shrink-0 cursor-pointer"
          >
            Book
            <ArrowUpRight className="w-4 h-4" />
          </button>
        ) : (
          <Link
            href={`/skills/${skill.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#2B2824] hover:bg-[#37332E] border border-[#37332E] text-[#F7F5F0] text-sm font-semibold transition-colors shrink-0"
          >
            Details
            <ArrowUpRight className="w-4 h-4 text-[#FF9B45]" />
          </Link>
        )}
      </div>
    </div>
  );
}
