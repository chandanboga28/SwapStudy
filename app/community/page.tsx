'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useCommunity } from '@/context/CommunityContext';
import CommunityPostCard from '@/components/CommunityPostCard';
import CreatePostModal from '@/components/CreatePostModal';
import LearningGroupsSection from '@/components/LearningGroupsSection';
import CollegeStudentDiscovery from '@/components/CollegeStudentDiscovery';
import StudentProfileModal from '@/components/StudentProfileModal';
import BookingModal from '@/components/BookingModal';
import { User, Skill, PostCategory } from '@/types';
import {
  Users,
  Sparkles,
  ShieldCheck,
  Search,
  Plus,
  Bookmark,
  MessageSquare,
  GraduationCap,
  TrendingUp,
  Building,
  CheckCircle2,
  X,
} from 'lucide-react';

const CATEGORIES: ('All' | PostCategory)[] = [
  'All',
  'Discussions',
  'Questions',
  'Resources',
  'Achievements',
];

const TRENDING_TAGS = [
  'figma',
  'leetcode',
  'nextjs',
  'algorithms',
  'dubhacks',
  'video-editing',
  'linear-algebra',
];

function CommunityContent() {
  const { allUsers } = useAuth();
  const { skills, sessions } = useApp();
  const {
    currentCollege,
    posts,
    groups,
    savedPostIds,
    sameCollegeStudents,
  } = useCommunity();

  // Active view tab: 'feed' | 'groups' | 'peers' | 'saved'
  const [activeTab, setActiveTab] = useState<'feed' | 'groups' | 'peers' | 'saved'>('feed');
  const [selectedCategory, setSelectedCategory] = useState<'All' | PostCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Modals state
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [inspectingUser, setInspectingUser] = useState<User | null>(null);
  const [bookingSkill, setBookingSkill] = useState<Skill | null>(null);

  // Filter posts based on category, tag, and search query
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Saved tab filter
      if (activeTab === 'saved') {
        if (!savedPostIds.includes(post.id)) return false;
      }

      // Category filter
      if (selectedCategory !== 'All' && post.category !== selectedCategory) {
        return false;
      }

      // Tag filter
      if (selectedTag && !post.tags.includes(selectedTag)) {
        return false;
      }

      // Search query
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      return (
        post.title.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q) ||
        post.authorName.toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [posts, activeTab, savedPostIds, selectedCategory, selectedTag, searchQuery]);

  const handleOpenAuthorProfile = (authorId: string) => {
    const found = allUsers.find((u) => u.id === authorId);
    if (found) {
      setInspectingUser(found);
    }
  };

  const handleBookSkill = (skillId: string) => {
    const found = skills.find((s) => s.id === skillId);
    if (found) {
      setBookingSkill(found);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* College Community Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-700/50">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold tracking-wide uppercase text-emerald-200">
                  <Building className="w-3.5 h-3.5 text-emerald-300" />
                  College-First Community
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-xs font-semibold text-emerald-100">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  {currentCollege.domain} Verified Network
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                  {currentCollege.name} Hub
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100/90 mt-1.5 leading-relaxed">
                  {currentCollege.description} Connect with classmates, ask questions, join study circles, and share learning resources.
                </p>
              </div>

              {/* Campus Stats Bar */}
              <div className="flex items-center gap-4 sm:gap-6 pt-1 text-xs text-emerald-100 font-medium">
                <div>
                  <span className="text-white font-bold text-sm block">
                    {currentCollege.memberCount.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-emerald-200/80">Campus Members</span>
                </div>
                <div className="h-6 w-px bg-white/20" />
                <div>
                  <span className="text-white font-bold text-sm block">{groups.length}</span>
                  <span className="text-[11px] text-emerald-200/80">Study Circles</span>
                </div>
                <div className="h-6 w-px bg-white/20" />
                <div>
                  <span className="text-white font-bold text-sm block">{posts.length}</span>
                  <span className="text-[11px] text-emerald-200/80">Discussions</span>
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
              <button
                onClick={() => setIsCreatePostOpen(true)}
                className="px-5 py-3 rounded-2xl bg-white text-emerald-950 hover:bg-emerald-50 font-bold text-xs sm:text-sm transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
              >
                <Plus className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
                Create Campus Post
              </button>
              <div className="text-[11px] text-emerald-200/80 text-center flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Restricted to {currentCollege.shortName} students</span>
              </div>
            </div>
          </div>

          {/* Background Ambient Glow */}
          <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* View Navigation Tabs */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-1 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('feed');
                setSelectedTag(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-[13px] font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'feed'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Community Feed ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-[13px] font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'groups'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Learning Groups ({groups.length})
            </button>
            <button
              onClick={() => setActiveTab('peers')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-[13px] font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'peers'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Student Directory ({sameCollegeStudents.length})
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-[13px] font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'saved'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Saved ({savedPostIds.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Community Feed View */}
        {activeTab === 'feed' || activeTab === 'saved' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Cols: Main Post Feed */}
            <div className="lg:col-span-8 space-y-5">
              {/* Filter & Search Bar */}
              <div className="card-subtle rounded-2xl p-4 sm:p-5 space-y-3.5 bg-white border border-slate-200/80">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search posts, topics, questions, or authors..."
                      className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900"
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

                  <button
                    onClick={() => setIsCreatePostOpen(true)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create Post
                  </button>
                </div>

                {/* Category Pills & Active Tag Indicator */}
                <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                          selectedCategory === cat
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {selectedTag && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <span>Tag: #{selectedTag}</span>
                      <button
                        onClick={() => setSelectedTag(null)}
                        className="text-emerald-600 hover:text-emerald-900 ml-0.5"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Feed Post List */}
              {filteredPosts.length > 0 ? (
                <div className="space-y-4">
                  {filteredPosts.map((post) => (
                    <CommunityPostCard
                      key={post.id}
                      post={post}
                      onViewAuthorProfile={handleOpenAuthorProfile}
                      onBookRelatedSkill={handleBookSkill}
                      availableSkills={skills}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {activeTab === 'saved'
                        ? 'No Saved Posts Yet'
                        : 'No Posts Found in this View'}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      {activeTab === 'saved'
                        ? 'Bookmark useful discussions or study resources to view them here anytime.'
                        : 'Be the first student to start a discussion in this topic!'}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCreatePostOpen(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Write New Post
                  </button>
                </div>
              )}
            </div>

            {/* Right 4 Cols: Campus Trending & Sidebar Widgets */}
            <aside className="lg:col-span-4 space-y-6">
              {/* Trending Topics / Tags */}
              <div className="card-subtle rounded-2xl p-5 space-y-3.5 bg-white border border-slate-200/80">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Trending on Campus</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TRENDING_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTag(selectedTag === tag ? null : tag);
                        setActiveTab('feed');
                      }}
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                        selectedTag === tag
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Suggested Peers from Same College */}
              <div className="card-subtle rounded-2xl p-5 space-y-3.5 bg-white border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Suggested Peers</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('peers')}
                    className="text-[11px] font-semibold text-emerald-700 hover:underline"
                  >
                    View All →
                  </button>
                </div>

                <div className="space-y-3">
                  {sameCollegeStudents.slice(0, 3).map((peer) => (
                    <div
                      key={peer.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={peer.avatar}
                          alt={peer.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{peer.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{peer.major}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setInspectingUser(peer)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 font-semibold text-[11px] bg-white transition-colors shrink-0"
                      >
                        Profile
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Popular Study Circles Preview */}
              <div className="card-subtle rounded-2xl p-5 space-y-3.5 bg-white border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Active Study Circles</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('groups')}
                    className="text-[11px] font-semibold text-emerald-700 hover:underline"
                  >
                    Browse ({groups.length}) →
                  </button>
                </div>

                <div className="space-y-2.5">
                  {groups.slice(0, 2).map((grp) => (
                    <div
                      key={grp.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 truncate">{grp.name}</span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 shrink-0">
                          {grp.memberIds.length} members
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{grp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        ) : activeTab === 'groups' ? (
          /* Tab 2: Learning Groups View */
          <LearningGroupsSection
            onViewMemberProfile={(id) => handleOpenAuthorProfile(id)}
          />
        ) : (
          /* Tab 3: Same-College Student Discovery View */
          <CollegeStudentDiscovery
            onViewProfile={(student) => setInspectingUser(student)}
            availableSkills={skills}
            sessions={sessions}
          />
        )}
      </div>

      {/* Create Post Modal */}
      {isCreatePostOpen && (
        <CreatePostModal
          onClose={() => setIsCreatePostOpen(false)}
          availableSkills={skills}
        />
      )}

      {/* Student Profile Modal */}
      {inspectingUser && (
        <StudentProfileModal
          student={inspectingUser}
          onClose={() => setInspectingUser(null)}
          onSelectSkill={(skill) => {
            setInspectingUser(null);
            setBookingSkill(skill);
          }}
          availableSkills={skills}
        />
      )}

      {/* Booking Modal for Skill Swap */}
      {bookingSkill && (
        <BookingModal
          skill={bookingSkill}
          onClose={() => setBookingSkill(null)}
        />
      )}
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8">Loading Campus Community...</div>}>
      <CommunityContent />
    </Suspense>
  );
}
