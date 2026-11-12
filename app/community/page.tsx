'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
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
  Lock,
  X,
  Check,
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
    switchCollege,
    joinGroup,
    leaveGroup,
    authPromptAction,
    openAuthPrompt,
    closeAuthPrompt,
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
      {/* Campus Hub Header */}
      <section className="hero-synth-cobalt bg-[#3B5CA8] text-[#FFFFFF] border-[1.5px] border-[#2C437A] rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#DCEB8E] border-[1.5px] border-[#25282E] font-mono text-xs font-bold text-[#1F2227]">
                <GraduationCap className="w-3.5 h-3.5" />
                {currentCollege.shortName} Campus Hub
              </div>

              <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#25282E]/85 border border-[#5B606B]">
                {[
                  { id: 'all', label: 'All Campuses' },
                  { id: 'adypu', label: 'ADYPU' },
                  { id: 'nst', label: 'NST' },
                  { id: 'vedam', label: 'Vedam' },
                  { id: 'upgrad', label: 'upGrad' },
                ].map((campus) => {
                  const selected = currentCollege.id === campus.id;
                  return (
                    <button
                      key={campus.id}
                      type="button"
                      onClick={() => switchCollege(campus.id)}
                      className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-bold transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#F4DC82] text-[#1F2227]'
                          : 'text-[#E5E8EE] hover:text-[#FFFFFF]'
                      }`}
                    >
                      {campus.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#FFFFFF] tracking-tight">
              {currentCollege.name} Community
            </h1>
            <p className="text-sm sm:text-base text-[#EDF2FF] leading-relaxed font-medium">
              Ask study questions, share notes, form weekly study circles, and connect with campus peers for skill exchanges.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="bg-[#25282E] border-[1.5px] border-[#4A4E57] rounded-xl px-4 py-2.5 text-center">
              <p className="font-mono text-lg font-extrabold text-[#CCE27A] tabular-nums">
                {sameCollegeStudents.length}
              </p>
              <p className="font-mono text-[11px] font-bold text-[#C4C8D1]">ACTIVE_PEERS</p>
            </div>
            <div className="bg-[#25282E] border-[1.5px] border-[#4A4E57] rounded-xl px-4 py-2.5 text-center">
              <p className="font-mono text-lg font-extrabold text-[#7AD6A1] tabular-nums">{groups.length}</p>
              <p className="font-mono text-[11px] font-bold text-[#C4C8D1]">STUDY_CIRCLES</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  openAuthPrompt('create a community post');
                  return;
                }
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#F4DC82] hover:bg-[#EDD066] border-[1.5px] border-[#25282E] shadow-[0_2.5px_0_#25282E] text-[#1F2227] text-xs font-mono font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              CREATE_POST
            </button>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#CEC9BC] pb-4">
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
                  ? 'bg-[#3B5CA8] text-[#FFFFFF]'
                  : 'bg-[#F8F6F0] hover:bg-[#E6E3DA] border border-[#4A4E57] text-[#464B55] hover:text-[#1F2227]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs tabular-nums ${
                  active ? 'bg-[#FFFFFF]/20 text-[#FFFFFF]' : 'bg-[#E6E3DA] text-[#1F2227]'
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
            <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-4 space-y-3.5">
              <div className="relative">
                <Search className="w-4 h-4 text-[#464B55] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search posts, questions, tags, or peers..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] placeholder-[#5A606B] focus:outline-none"
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
                          ? 'bg-[#E6E3DA] border border-[#3B5CA8] text-[#2F4D96]'
                          : 'bg-[#EFECE4] border border-[#4A4E57] text-[#464B55] hover:text-[#1F2227]'
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
                    className="h-48 rounded-2xl bg-[#F8F6F0] border border-[#4A4E57] animate-pulse"
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
              <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-12 text-center space-y-3">
                <Sparkles className="w-9 h-9 text-[#2F4D96] mx-auto" />
                <h3 className="text-xl font-bold text-[#1F2227]">
                  {activeTab === 'saved' ? 'No saved posts yet' : 'No matching posts found'}
                </h3>
                <p className="text-sm text-[#464B55] max-w-md mx-auto">
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
            <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-[#1F2227] flex items-center gap-2">
                <Hash className="w-4 h-4 text-[#2F4D96]" />
                Trending Topics
              </h3>
              {trendingTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {trendingTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSearchQuery(tag)}
                      className="px-3 py-1.5 rounded-full bg-[#E6E3DA] hover:bg-[#DCD8CD] border border-[#4A4E57] text-xs font-semibold text-[#1F2227] transition-colors cursor-pointer"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#464B55]">Tags from new discussions will appear here.</p>
              )}
            </div>

            {/* Suggested Campus Peers */}
            <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1F2227]">Active Peers</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('peers')}
                  className="text-xs font-bold text-[#2F4D96] hover:text-[#9E3922] inline-flex items-center gap-1 cursor-pointer"
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
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#E6E3DA] hover:bg-[#DCD8CD] border border-[#4A4E57] text-left transition-colors cursor-pointer"
                    >
                      <img
                        src={peer.avatar}
                        alt={peer.name}
                        className="w-9 h-9 rounded-full object-cover border border-[#4A4E57] bg-[#EFECE4]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#1F2227] truncate">{peer.name}</p>
                        <p className="text-xs text-[#464B55] truncate">
                          {peer.skillsToTeach[0] || peer.major || 'Campus Peer'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#464B55]">No classmates discovered yet.</p>
              )}
            </div>

            {/* Study Circles Preview */}
            <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1F2227]">Study Circles</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('groups')}
                  className="text-xs font-bold text-[#2F4D96] hover:text-[#9E3922] cursor-pointer"
                >
                  View all
                </button>
              </div>

              {groups.slice(0, 2).map((grp) => {
                const isMember = user ? grp.memberIds.includes(user.id) : false;
                return (
                  <div
                    key={grp.id}
                    className="bg-[#E6E3DA] border border-[#4A4E57] rounded-xl p-3.5 space-y-2.5"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-[#1F2227]">{grp.name}</p>
                      <p className="text-xs text-[#464B55]">
                        {grp.topic} · {grp.memberIds.length} members
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => (isMember ? leaveGroup(grp.id) : joinGroup(grp.id))}
                      className={`w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                        isMember
                          ? 'bg-[#DCF2E4] border-[#47785B] text-[#195434] hover:bg-[#FCE7E3] hover:border-[#B34B39] hover:text-[#8F2618]'
                          : 'bg-[#3B5CA8] hover:bg-[#314E91] border-[#2A3F75] text-[#FFFFFF]'
                      }`}
                    >
                      {isMember ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Joined Circle
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Join Circle
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
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

      {/* Auth Gate Modal when unauthenticated visitors click Like, Comment, Save, or Join */}
      {authPromptAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2227]/45 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="community-auth-title"
        >
          <div className="w-full max-w-md bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[4px_4px_0_#C5C0B4] rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-[#E6E3DA] border-b border-[#CEC9BC] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F4DC82] border-[1.5px] border-[#4A4E57] flex items-center justify-center">
                  <Lock className="w-4 h-4 text-[#1F2227]" />
                </div>
                <h3 id="community-auth-title" className="text-base font-bold text-[#1F2227]">
                  Sign in required
                </h3>
              </div>
              <button
                type="button"
                onClick={closeAuthPrompt}
                className="p-1.5 rounded-lg text-[#464B55] hover:text-[#1F2227] hover:bg-[#DCD8CD] cursor-pointer"
                aria-label="Close sign in prompt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-sm text-[#464B55] leading-relaxed">
                Please log in with your SwapStudy student account to{' '}
                <strong className="text-[#1F2227]">{authPromptAction}</strong>. Guests can browse
                all campus discussions and study circles, and members can interact anytime.
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <Link
                  href="/login"
                  onClick={closeAuthPrompt}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-xs font-mono font-bold transition-colors"
                >
                  LOG_IN
                </Link>
                <Link
                  href="/signup"
                  onClick={closeAuthPrompt}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#F4DC82] hover:bg-[#EDD066] border-[1.5px] border-[#4A4E57] text-[#1F2227] text-xs font-mono font-bold transition-colors"
                >
                  CREATE_ACCOUNT
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
          <div className="h-96 rounded-2xl bg-[#F8F6F0] border border-[#4A4E57] animate-pulse" />
        </div>
      }
    >
      <CommunityContent />
    </Suspense>
  );
}
