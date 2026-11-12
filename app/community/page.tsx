'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { PostCategory, Skill, User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useCommunity } from '@/context/CommunityContext';
import CommunityPostCard from '@/components/CommunityPostCard';
import CreatePostModal from '@/components/CreatePostModal';
import LearningGroupsSection from '@/components/LearningGroupsSection';
import CollegeStudentDiscovery from '@/components/CollegeStudentDiscovery';
import StudentProfileModal from '@/components/StudentProfileModal';
import BookingModal from '@/components/BookingModal';
import {
  Users,
  MessageSquare,
  Bookmark,
  Search,
  Plus,
  Sparkles,
  BookOpen,
  Hash,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';

type CommunityTab = 'feed' | 'groups' | 'peers' | 'saved';

function CommunityContent() {
  const { user } = useAuth();
  const { skills } = useApp();
  const {
    currentCollege,
    posts,
    groups,
    savedPostIds,
    sameCollegeStudents,
    isLoading,
  } = useCommunity();

  const [activeTab, setActiveTab] = useState<CommunityTab>('feed');
  const [selectedCategory, setSelectedCategory] = useState<'All' | PostCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<User | null>(null);
  const [bookingSkill, setBookingSkill] = useState<Skill | null>(null);

  const visiblePosts = useMemo(() => {
    const base =
      activeTab === 'saved'
        ? posts.filter(
            (p) => savedPostIds.includes(p.id) || (user ? p.savedBy.includes(user.id) : false)
          )
        : posts;

    return base.filter((post) => {
      if (selectedCategory !== 'All' && post.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = [post.title, post.content, post.authorName, ...post.tags]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [posts, activeTab, selectedCategory, searchQuery, savedPostIds, user]);

  const trendingTags = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach((p) => {
      p.tags.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag]) => tag);
  }, [posts]);

  const suggestedPeers = useMemo(() => {
    return sameCollegeStudents.filter((s) => s.id !== user?.id).slice(0, 3);
  }, [sameCollegeStudents, user]);

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Bronze Campus Hub Header */}
      <section className="hero-bronze rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#171715]/30 border border-[#F7F5F0]/20 text-xs font-bold text-[#FF9B45]">
              <GraduationCap className="w-3.5 h-3.5" />
              {currentCollege.shortName} Campus Hub
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F7F5F0] tracking-tight">
              {currentCollege.name} Community
            </h1>
            <p className="text-sm sm:text-base text-[#F7F5F0]/85 leading-relaxed">
              Ask study questions, share notes, form weekly study circles, and connect with campus peers for skill exchanges.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="bg-[#171715]/35 border border-[#F7F5F0]/15 rounded-2xl px-4 py-2.5 text-center">
              <p className="text-lg font-extrabold text-[#F7F5F0] tabular-nums">
                {sameCollegeStudents.length}
              </p>
              <p className="text-xs text-[#F7F5F0]/75">Active Peers</p>
            </div>
            <div className="bg-[#171715]/35 border border-[#F7F5F0]/15 rounded-2xl px-4 py-2.5 text-center">
              <p className="text-lg font-extrabold text-[#F7F5F0] tabular-nums">{groups.length}</p>
              <p className="text-xs text-[#F7F5F0]/75">Study Circles</p>
            </div>
            {user && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-sm font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create Post
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#37332E] pb-4">
        {[
          { key: 'feed', label: 'Campus Feed', icon: MessageSquare, count: posts.length },
          { key: 'groups', label: 'Study Circles', icon: BookOpen, count: groups.length },
          { key: 'peers', label: 'Peer Directory', icon: Users, count: sameCollegeStudents.length },
          { key: 'saved', label: 'Saved Posts', icon: Bookmark, count: savedPostIds.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as CommunityTab)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-colors cursor-pointer ${
                active
                  ? 'bg-[#FF9B45] text-[#171715]'
                  : 'bg-[#22211F] hover:bg-[#2B2824] border border-[#37332E] text-[#AAA69F] hover:text-[#F7F5F0]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs tabular-nums ${
                  active ? 'bg-[#171715]/15 text-[#171715]' : 'bg-[#171715] text-[#AAA69F]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {(activeTab === 'feed' || activeTab === 'saved') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Feed Column (8 Cols) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Search & Category Strip */}
            <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-4 space-y-3.5">
              <div className="relative">
                <Search className="w-4 h-4 text-[#AAA69F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search posts, questions, tags, or peers..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] placeholder-[#AAA69F]/60 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(['All', 'Discussions', 'Questions', 'Resources', 'Achievements'] as const).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-[#2B2824] border border-[#FF9B45] text-[#FF9B45]'
                          : 'bg-[#171715] border border-[#37332E] text-[#AAA69F] hover:text-[#F7F5F0]'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-48 rounded-2xl bg-[#22211F] border border-[#37332E] animate-pulse"
                  />
                ))}
              </div>
            ) : visiblePosts.length > 0 ? (
              <div className="space-y-5">
                {visiblePosts.map((post) => (
                  <CommunityPostCard
                    key={post.id}
                    post={post}
                    onViewProfile={(student) => setViewingStudent(student)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-12 text-center space-y-3">
                <Sparkles className="w-9 h-9 text-[#FF9B45] mx-auto" />
                <h3 className="text-xl font-bold text-[#F7F5F0]">
                  {activeTab === 'saved' ? 'No saved posts yet' : 'No matching posts found'}
                </h3>
                <p className="text-sm text-[#AAA69F] max-w-md mx-auto">
                  {activeTab === 'saved'
                    ? 'Bookmark helpful discussions and study resources to find them quickly here.'
                    : 'Start a campus thread or adjust your category filter.'}
                </p>
              </div>
            )}
          </div>

          {/* Right Sidebar (4 Cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Trending Tags */}
            <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-[#F7F5F0] flex items-center gap-2">
                <Hash className="w-4 h-4 text-[#FF9B45]" />
                Trending Topics
              </h3>
              {trendingTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {trendingTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSearchQuery(tag)}
                      className="px-3 py-1.5 rounded-full bg-[#2B2824] hover:bg-[#37332E] border border-[#37332E] text-xs font-semibold text-[#F7F5F0] transition-colors cursor-pointer"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#AAA69F]">Tags from new discussions will appear here.</p>
              )}
            </div>

            {/* Suggested Campus Peers */}
            <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#F7F5F0]">Active Peers</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('peers')}
                  className="text-xs font-bold text-[#FF9B45] hover:text-[#F5B66B] inline-flex items-center gap-1 cursor-pointer"
                >
                  Directory
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {suggestedPeers.length > 0 ? (
                <div className="space-y-3">
                  {suggestedPeers.map((peer) => (
                    <button
                      key={peer.id}
                      type="button"
                      onClick={() => setViewingStudent(peer)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#2B2824] hover:bg-[#37332E] border border-[#37332E] text-left transition-colors cursor-pointer"
                    >
                      <img
                        src={peer.avatar}
                        alt={peer.name}
                        className="w-9 h-9 rounded-full object-cover border border-[#37332E] bg-[#171715]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#F7F5F0] truncate">{peer.name}</p>
                        <p className="text-xs text-[#AAA69F] truncate">
                          {peer.skillsToTeach[0] || peer.major || 'Campus Peer'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#AAA69F]">No classmates discovered yet.</p>
              )}
            </div>

            {/* Study Circles Preview */}
            <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#F7F5F0]">Study Circles</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('groups')}
                  className="text-xs font-bold text-[#FF9B45] hover:text-[#F5B66B] cursor-pointer"
                >
                  View all
                </button>
              </div>

              {groups.slice(0, 2).map((grp) => (
                <div
                  key={grp.id}
                  className="bg-[#2B2824] border border-[#37332E] rounded-xl p-3.5 space-y-1"
                >
                  <p className="text-sm font-bold text-[#F7F5F0]">{grp.name}</p>
                  <p className="text-xs text-[#AAA69F]">
                    {grp.topic} · {grp.memberIds.length} members
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'groups' && <LearningGroupsSection />}

      {activeTab === 'peers' && (
        <CollegeStudentDiscovery onViewProfile={(student) => setViewingStudent(student)} />
      )}

      {/* Modals */}
      {showCreateModal && <CreatePostModal onClose={() => setShowCreateModal(false)} />}

      {viewingStudent && (
        <StudentProfileModal
          student={viewingStudent}
          onClose={() => setViewingStudent(null)}
          onSelectSkill={(skill) => setBookingSkill(skill)}
          availableSkills={skills.filter((s) => s.teacherId === viewingStudent.id)}
        />
      )}

      {bookingSkill && (
        <BookingModal skill={bookingSkill} onClose={() => setBookingSkill(null)} />
      )}
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
          <div className="h-96 rounded-2xl bg-[#22211F] border border-[#37332E] animate-pulse" />
        </div>
      }
    >
      <CommunityContent />
    </Suspense>
  );
}
