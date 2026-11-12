'use client';

import React, { useState, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Skill, SkillCategory, SkillLevel } from '@/types';
import SkillCard from '@/components/SkillCard';
import BookingModal from '@/components/BookingModal';
import {
  Search,
  Sparkles,
  BookOpen,
  SlidersHorizontal,
  X,
  PlusCircle,
} from 'lucide-react';

const CATEGORIES: SkillCategory[] = [
  'Programming & Tech',
  'Design & Creative',
  'Academics & Science',
  'Media & Production',
  'Business & Career',
  'Language & Writing',
];

const LEVELS: SkillLevel[] = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

function ExploreSkillsContent() {
  const { skills, isLoading } = useApp();
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const initialCategory = searchParams.get('category') || 'All';
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedUniversity, setSelectedUniversity] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [maxCredits, setMaxCredits] = useState<number>(5);
  const [wishlistOnly, setWishlistOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'credits-asc'>('popular');
  const [bookingSkill, setBookingSkill] = useState<Skill | null>(null);

  const isWishlistMatch = useCallback(
    (skill: Skill) => {
      if (!user || !user.skillsToLearn || user.skillsToLearn.length === 0) return false;
      const titleLower = skill.title.toLowerCase();
      const topicsLower = skill.topics.map((t) => t.toLowerCase());
      return user.skillsToLearn.some((wish) => {
        const w = wish.toLowerCase();
        return titleLower.includes(w) || topicsLower.some((t) => t.includes(w));
      });
    },
    [user]
  );

  const isMutualExchange = (skill: Skill) => {
    if (!user || !user.skillsToTeach || user.skillsToTeach.length === 0) return false;
    if (!isWishlistMatch(skill)) return false;
    // Check if the skill's teacher has wishlist overlap or matches category context
    return skill.teacherId !== user.id;
  };

  const UNIVERSITIES = [
    'All',
    'Ajeenkya DY Patil University',
    'Newton School of Technology',
    'Vedam School of Technology',
    'upGrad School of Technology',
  ];

  const filteredSkills = useMemo(() => {
    return skills
      .filter((skill) => {
        if (selectedCategory !== 'All' && skill.category !== selectedCategory) return false;
        if (selectedUniversity !== 'All' && skill.teacherUniversity !== selectedUniversity) return false;
        if (selectedLevel !== 'All' && skill.level !== selectedLevel) return false;
        if (skill.hourlyCredits > maxCredits) return false;
        if (wishlistOnly && !isWishlistMatch(skill)) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const haystack = [
            skill.title,
            skill.description,
            skill.category,
            skill.teacherName,
            skill.teacherUniversity,
            ...skill.topics,
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.teacherRating - a.teacherRating;
        if (sortBy === 'credits-asc') return a.hourlyCredits - b.hourlyCredits;
        return b.reviewsCount - a.reviewsCount;
      });
  }, [
    skills,
    selectedCategory,
    selectedUniversity,
    selectedLevel,
    maxCredits,
    wishlistOnly,
    searchQuery,
    sortBy,
    isWishlistMatch,
  ]);

  const hasActiveFilters =
    selectedCategory !== 'All' ||
    selectedUniversity !== 'All' ||
    selectedLevel !== 'All' ||
    maxCredits < 5 ||
    wishlistOnly ||
    searchQuery.trim() !== '';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedUniversity('All');
    setSelectedLevel('All');
    setMaxCredits(5);
    setWishlistOnly(false);
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-7">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#2F4D96]">
            Skill Marketplace
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1F2227]">
            Explore Campus Skills
          </h1>
          <p className="text-sm sm:text-base text-[#464B55] max-w-2xl">
            Browse 1-on-1 peer sessions published by fellow students. Pay using earned time credits with escrow protection.
          </p>
        </div>

        <Link
          href="/teach"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-sm font-bold transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Publish a Skill
        </Link>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedCategory('All')}
          className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
            selectedCategory === 'All'
              ? 'bg-[#3B5CA8] text-[#FFFFFF]'
              : 'bg-[#F8F6F0] hover:bg-[#E6E3DA] border border-[#4A4E57] text-[#464B55] hover:text-[#1F2227]'
          }`}
        >
          All Categories
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#3B5CA8] text-[#FFFFFF]'
                : 'bg-[#F8F6F0] hover:bg-[#E6E3DA] border border-[#4A4E57] text-[#464B55] hover:text-[#1F2227]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search & Controls Bar */}
      <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-[#464B55] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search skills, topics, or mentors..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] placeholder-[#5A606B] focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] focus:outline-none"
              aria-label="Filter by difficulty level"
            >
              <option value="All" className="bg-[#F8F6F0]">All Levels</option>
              {LEVELS.map((lvl) => (
                <option key={lvl} value={lvl} className="bg-[#F8F6F0]">
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={maxCredits}
              onChange={(e) => setMaxCredits(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] focus:outline-none"
              aria-label="Filter by max credits"
            >
              <option value={5} className="bg-[#F8F6F0]">Up to 5 Credits</option>
              <option value={3} className="bg-[#F8F6F0]">Up to 3 Credits</option>
              <option value={2} className="bg-[#F8F6F0]">Up to 2 Credits</option>
              <option value={1} className="bg-[#F8F6F0]">1 Credit Only</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'popular' | 'rating' | 'credits-asc')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] focus:outline-none"
              aria-label="Sort skills"
            >
              <option value="popular" className="bg-[#F8F6F0]">Sort: Most Reviewed</option>
              <option value="rating" className="bg-[#F8F6F0]">Sort: Highest Rated</option>
              <option value="credits-asc" className="bg-[#F8F6F0]">Sort: Lowest Credits</option>
            </select>
          </div>
        </div>

        {/* Campus / School Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#525763] mr-1">
            Campus:
          </span>
          {UNIVERSITIES.map((uni) => {
            const active = selectedUniversity === uni;
            const shortLabel =
              uni === 'All'
                ? 'All Schools'
                : uni === 'Ajeenkya DY Patil University'
                ? 'ADYPU'
                : uni === 'Newton School of Technology'
                ? 'Newton School of Tech (NST)'
                : uni;
            return (
              <button
                key={uni}
                type="button"
                onClick={() => setSelectedUniversity(uni)}
                className={`px-3 py-1 rounded-lg font-mono text-xs font-bold border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#3B5CA8] text-[#FFFFFF] border-[#2C437A]'
                    : 'bg-[#FFFFFF] text-[#464B55] hover:text-[#1F2227] border-[#9D998F] hover:bg-[#EFECE4]'
                }`}
              >
                {shortLabel}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#CEC9BC]">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xs sm:text-sm font-medium text-[#464B55] inline-flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#2F4D96]" />
              Showing <strong className="text-[#1F2227]">{filteredSkills.length}</strong>{' '}
              {filteredSkills.length === 1 ? 'listing' : 'listings'}
            </span>

            {user && (
              <label className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#1F2227] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={wishlistOnly}
                  onChange={(e) => setWishlistOnly(e.target.checked)}
                  className="rounded border-[#4A4E57] bg-[#EFECE4] accent-[#3B5CA8]"
                />
                <Sparkles className="w-3.5 h-3.5 text-[#2F4D96]" />
                Wishlist matches only
              </label>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#2F4D96] hover:text-[#9E3922] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Skills Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 rounded-2xl bg-[#F8F6F0] border border-[#4A4E57] animate-pulse"
            />
          ))}
        </div>
      ) : filteredSkills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSkills.map((skill) => {
            const badge = isMutualExchange(skill)
              ? 'mutual'
              : isWishlistMatch(skill)
              ? 'wishlist'
              : null;
            return (
              <SkillCard
                key={skill.id}
                skill={skill}
                matchBadge={badge}
                onBook={(s) => setBookingSkill(s)}
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-12 text-center space-y-4">
          <BookOpen className="w-9 h-9 text-[#2F4D96] mx-auto" />
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-[#1F2227]">No matching skill listings found</h2>
            <p className="text-sm text-[#464B55] max-w-md mx-auto">
              Try clearing your filters or searching with broader keywords, or publish a skill listing for peers to discover.
            </p>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-5 py-2.5 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-sm font-bold cursor-pointer"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {bookingSkill && (
        <BookingModal skill={bookingSkill} onClose={() => setBookingSkill(null)} />
      )}
    </div>
  );
}

export default function ExploreSkillsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
          <div className="h-80 rounded-2xl bg-[#F8F6F0] border border-[#4A4E57] animate-pulse" />
        </div>
      }
    >
      <ExploreSkillsContent />
    </Suspense>
  );
}
