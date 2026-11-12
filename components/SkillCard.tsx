'use client';

import React from 'react';
import Link from 'next/link';
import { Skill } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Star, Coins, ArrowRight } from 'lucide-react';

interface SkillCardProps {
  skill: Skill;
  onBook?: (skill: Skill) => void;
  matchBadge?: string;
}

export default function SkillCard({ skill, onBook, matchBadge }: SkillCardProps) {
  const { user } = useAuth();
  const isOwnListing = user?.id === skill.teacherId;
  const campusLabel = skill.teacherUniversity.includes('Ajeenkya')
    ? 'ADYPU'
    : skill.teacherUniversity.split(' ')[0];
  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'Programming & Tech':
        return 'bg-blue-50/70 text-blue-700 border-blue-200/60';
      case 'Design & Creative':
        return 'bg-purple-50/70 text-purple-700 border-purple-200/60';
      case 'Academics & Science':
        return 'bg-amber-50/70 text-amber-700 border-amber-200/60';
      case 'Media & Production':
        return 'bg-rose-50/70 text-rose-700 border-rose-200/60';
      case 'Business & Career':
        return 'bg-emerald-50/70 text-emerald-700 border-emerald-200/60';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="card-subtle-hover rounded-xl flex flex-col justify-between group overflow-hidden border border-slate-200/90">
      <div className="p-5">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${getCategoryBadge(
                skill.category
              )}`}
            >
              {skill.category}
            </span>
            {matchBadge && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300/70">
                {matchBadge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs font-semibold shrink-0">
            <Coins className="w-3 h-3 text-emerald-600" />
            <span>{skill.hourlyCredits} {skill.hourlyCredits === 1 ? 'Credit' : 'Credits'}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 mb-2">
          <Link href={`/skills/${skill.id}`}>{skill.title}</Link>
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
          {skill.description}
        </p>

        {/* Topics Pills */}
        <div className="flex flex-wrap gap-1 mb-2">
          {skill.topics.slice(0, 3).map((topic, i) => (
            <span
              key={i}
              className="text-[10px] bg-slate-50 text-slate-600 border border-slate-200/60 px-2 py-0.5 rounded font-medium"
            >
              {topic}
            </span>
          ))}
          {skill.topics.length > 3 && (
            <span className="text-[10px] text-slate-400 self-center pl-0.5">
              +{skill.topics.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Instructor Footer */}
      <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={skill.teacherAvatar}
            alt={skill.teacherName}
            className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
          />
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-900 truncate">{skill.teacherName}</p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="truncate">{campusLabel}</span>
              <span>•</span>
              <span className="flex items-center text-amber-600 font-medium">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                {skill.teacherRating}
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0">
          {isOwnListing ? (
            <Link
              href={`/skills/${skill.id}`}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors inline-flex items-center gap-1"
            >
              Manage
            </Link>
          ) : onBook ? (
            <button
              onClick={() => onBook(skill)}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs transition-colors flex items-center gap-1"
            >
              Book
              <ArrowRight className="w-3 h-3" />
            </button>
          ) : (
            <Link
              href={`/skills/${skill.id}`}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs transition-colors flex items-center gap-1"
            >
              View
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
