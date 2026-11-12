'use client';

import React, { useState, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { isSkillMatch } from '@/lib/matching';
import SkillCard from '@/components/SkillCard';
import BookingModal from '@/components/BookingModal';
import { Skill } from '@/types';
import { Search, Sparkles, Plus, X } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = [
  'All',
  'Programming & Tech',
  'Design & Creative',
  'Academics & Science',
  'Media & Production',
  'Business & Career',
];

function SkillsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';

  const { skills, isLoading } = useApp();
  const { user, allUsers } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlistOnly, setWishlistOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [maxCredits, setMaxCredits] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'credits'>('popular');

  const [bookingSkill, setBookingSkill] = useState<Skill | null>(null);

  const isWishlistMatch = useCallback(
    (skill: Skill) => {
      if (!user || user.id === skill.teacherId) return false;
      return user.skillsToLearn.some(
        (wish) =>
          isSkillMatch(skill.title, wish) ||
          skill.topics.some((t) => isSkillMatch(t, wish))
      );
    },
    [user]
  );

  const isMutualExchange = useCallback(
    (skill: Skill) => {
      if (!user || user.id === skill.teacherId) return false;
      const teacher = allUsers.find((u) => u.id === skill.teacherId);
      if (!teacher) return false;
      const userWantsTheirSkill = user.skillsToLearn.some(
        (wish) =>
          isSkillMatch(skill.title, wish) ||
          skill.topics.some((t) => isSkillMatch(t, wish))
      );
      const theyWantUserSkill = teacher.skillsToLearn.some((wish) =>
        user.skillsToTeach.some((s) => isSkillMatch(s, wish))
      );
      return userWantsTheirSkill && theyWantUserSkill;
    },
    [user, allUsers]
  );

  // Filter and sort skills
  const filteredSkills = useMemo(() => {
    return skills
      .filter((skill) => {
        // Search query match
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !query ||
          skill.title.toLowerCase().includes(query) ||
          skill.description.toLowerCase().includes(query) ||
          skill.teacherName.toLowerCase().includes(query) ||
          skill.teacherUniversity.toLowerCase().includes(query) ||
          skill.topics.some((t) => t.toLowerCase().includes(query));

        // Category filter
        const matchesCategory =
          selectedCategory === 'All' || skill.category === selectedCategory;

        // Level filter
        const matchesLevel =
          selectedLevel === 'All' || skill.level === selectedLevel;

        // Credits filter
        const matchesCredits =
          maxCredits === 'all' || skill.hourlyCredits <= maxCredits;

        // Wishlist match filter
        const matchesWishlist = !wishlistOnly || isWishlistMatch(skill);

        return matchesQuery && matchesCategory && matchesLevel && matchesCredits && matchesWishlist;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') {
          return b.teacherRating - a.teacherRating;
        }
        if (sortBy === 'credits') {
          return a.hourlyCredits - b.hourlyCredits;
        }
        // default popular
        return (b.reviewsCount || 0) - (a.reviewsCount || 0);
      });
  }, [skills, searchQuery, selectedCategory, selectedLevel, maxCredits, sortBy, wishlistOnly, isWishlistMatch]);

  return (
    <div className="min-h-screen py-8 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-[11px] font-semibold text-emerald-800 mb-1.5">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Skill Marketplace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Explore Peer Skills
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-xl">
              1-on-1 tutoring sessions offered by motivated university students. Spend earned credits to book a session.
            </p>
          </div>

          <Link
            href="/teach"
            className="self-start md:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Offer to Teach a Skill
          </Link>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="card-subtle rounded-xl p-4 sm:p-5 space-y-4">
          {/* Top row: Search input & sorting */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by skill, topic (e.g. Python, Figma, Next.js), university..."
                className="w-full text-xs pl-9 pr-8 py-2.5 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50 text-slate-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-semibold px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Top Rated (Stars)</option>
                <option value="credits">Lowest Credits First</option>
              </select>
            </div>
          </div>

          {/* Categories Pill Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Subfilters: Level, Max Credits, and Wishlist Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 font-medium">Level:</span>
                {['All', 'Beginner', 'Intermediate', 'Advanced', 'All Levels'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      selectedLevel === lvl
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              <div className="h-3.5 w-px bg-slate-200 hidden sm:block" />

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Credits:</span>
                {[
                  { label: 'All Costs', val: 'all' },
                  { label: '≤ 2 Cr', val: 2 },
                  { label: '≤ 3 Cr', val: 3 },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setMaxCredits(item.val as any)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      maxCredits === item.val
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {user && (
                <>
                  <div className="h-3.5 w-px bg-slate-200 hidden sm:block" />
                  <button
                    onClick={() => setWishlistOnly(!wishlistOnly)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border ${
                      wishlistOnly
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-emerald-50/70 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/70'
                    }`}
                  >
                    <Sparkles className={`w-3 h-3 ${wishlistOnly ? 'text-white' : 'text-emerald-600'}`} />
                    Wishlist Matches Only
                  </button>
                </>
              )}
            </div>

            <div className="text-slate-400 text-[11px] font-medium">
              Showing <strong>{filteredSkills.length}</strong> skills
            </div>
          </div>
        </div>

        {/* Skills Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2, 3, 4, 5].map((skeleton) => (
              <div
                key={skeleton}
                className="bg-white rounded-xl border border-slate-200 p-5 h-52 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-4 w-28 bg-slate-200 rounded" />
                  <div className="h-5 w-3/4 bg-slate-200 rounded" />
                  <div className="h-3 w-full bg-slate-100 rounded" />
                </div>
                <div className="h-8 w-full bg-slate-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredSkills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSkills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onBook={(s) => setBookingSkill(s)}
                matchBadge={
                  isMutualExchange(skill)
                    ? 'Mutual Swap'
                    : isWishlistMatch(skill)
                    ? 'Wishlist Match'
                    : undefined
                }
              />
            ))}
          </div>
        ) : (
          <div className="card-subtle rounded-xl p-12 text-center space-y-3">
            <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-lg flex items-center justify-center mx-auto">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {skills.length === 0 ? 'No campus skills listed yet' : 'No matching skills found'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto">
                {skills.length === 0
                  ? user
                    ? 'Be the first verified student on campus to publish a peer learning skill listing.'
                    : 'Sign in with your campus account to browse live peer offerings, or publish your own.'
                  : 'Try clearing your search filters or offering to teach this topic yourself.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              {skills.length > 0 && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setSelectedLevel('All');
                    setMaxCredits('all');
                    setWishlistOnly(false);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Reset Filters
                </button>
              )}
              {!user ? (
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  Sign In to Browse Campus Skills
                </Link>
              ) : (
                <Link
                  href="/teach"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  + Offer this Skill
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {bookingSkill && (
        <BookingModal
          skill={bookingSkill}
          onClose={() => setBookingSkill(null)}
        />
      )}
    </div>
  );
}

export default function SkillsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen py-20 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SkillsContent />
    </Suspense>
  );
}
