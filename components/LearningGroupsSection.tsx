'use client';

import React, { useState, useMemo } from 'react';
import { User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useCommunity } from '@/context/CommunityContext';
import {
  Users,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  X,
  AlertCircle,
} from 'lucide-react';

interface LearningGroupsSectionProps {
  onViewMemberProfile?: (userId: string) => void;
}

export default function LearningGroupsSection({
  onViewMemberProfile,
}: LearningGroupsSectionProps) {
  const { user, allUsers } = useAuth();
  const { groups, joinGroup, leaveGroup, createGroup, currentCollege } = useCommunity();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Group creation form state
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [skillLevel, setSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels'>('All Levels');
  const [meetingCadence, setMeetingCadence] = useState('Tuesdays • 6:00 PM IST');
  const [error, setError] = useState<string | null>(null);

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        g.name.toLowerCase().includes(q) ||
        g.topic.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q);
      const matchesLevel = selectedLevel === 'All' || g.skillLevel === selectedLevel;
      return matchesSearch && matchesLevel;
    });
  }, [groups, searchQuery, selectedLevel]);

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!groupName.trim()) {
      setError('Group name is required.');
      return;
    }
    if (!topic.trim()) {
      setError('Topic or subject is required.');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    const res = createGroup({
      name: groupName,
      description,
      topic,
      skillLevel,
      meetingCadence,
    });

    if (res.success) {
      setGroupName('');
      setDescription('');
      setTopic('');
      setIsCreateModalOpen(false);
    } else {
      setError(res.error || 'Failed to create group.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="card-subtle rounded-2xl p-5 space-y-4 bg-white border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-[11px] font-semibold text-emerald-800 mb-1">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Campus Study Circles</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {currentCollege.shortName} Learning Groups
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Collaborative study circles organized by verified students. Join regular sessions and practice together.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Start a Group
          </button>
        </div>

        {/* Search & Level Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groups by name or topic (e.g. LeetCode, Figma, Web)..."
              className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
            {['All', 'Beginner', 'Intermediate', 'All Levels'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedLevel === lvl
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Groups Grid */}
      {filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGroups.map((group) => {
            const isMember = user ? group.memberIds.includes(user.id) : false;
            const isCreator = user ? group.creatorId === user.id : false;

            // Resolve member user objects
            const groupMembers = group.memberIds
              .map((id) => allUsers.find((u) => u.id === id))
              .filter(Boolean) as User[];

            return (
              <div
                key={group.id}
                className="card-subtle rounded-2xl p-5 space-y-4 bg-white border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar: Topic & Skill Level */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 truncate">
                        {group.topic}
                      </span>
                      {isCreator && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 shrink-0">
                          Your Group
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                      {group.skillLevel}
                    </span>
                  </div>

                  {/* Group Name & Description */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {group.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-3">
                      {group.description}
                    </p>
                  </div>

                  {/* Meeting Cadence */}
                  {group.meetingCadence && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-medium truncate">{group.meetingCadence}</span>
                    </div>
                  )}

                  {/* Creator Info */}
                  <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                    <img
                      src={group.creatorAvatar}
                      alt={group.creatorName}
                      className="w-6 h-6 rounded-full object-cover border border-slate-200"
                    />
                    <div className="flex items-center gap-1 truncate">
                      <span className="text-slate-400">Created by</span>
                      <button
                        onClick={() => onViewMemberProfile?.(group.creatorId)}
                        className="font-bold text-slate-800 hover:text-emerald-700 transition-colors truncate"
                      >
                        {group.creatorName}
                      </button>
                      {group.isCreatorVerified && (
                        <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer: Member avatars & Join/Leave CTA */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  {/* Member avatars */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {groupMembers.slice(0, 4).map((member) => (
                        <img
                          key={member.id}
                          src={member.avatar}
                          alt={member.name}
                          title={member.name}
                          className="w-6 h-6 rounded-full ring-2 ring-white object-cover cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => onViewMemberProfile?.(member.id)}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {group.memberIds.length} {group.memberIds.length === 1 ? 'member' : 'members'}
                    </span>
                  </div>

                  {/* Join / Leave Action */}
                  {isMember ? (
                    <button
                      onClick={() => leaveGroup(group.id)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Joined
                    </button>
                  ) : (
                    <button
                      onClick={() => joinGroup(group.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-2xs"
                    >
                      Join Circle
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">No Learning Groups Match</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Start your own study circle and collaborate with other {currentCollege.shortName} students!
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Create First Group
          </button>
        </div>
      )}

      {/* Create Group Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  {currentCollege.shortName} Campus
                </span>
                <h3 className="text-base font-bold text-slate-900">Start a Learning Group</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Group Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. DSA Problem Solving or Campus Hackathon Prep..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Topic / Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Data Structures, React, UI Design..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What will members practice or work on together?"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Skill Level
                  </label>
                  <select
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(e.target.value as any)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 bg-white"
                  >
                    <option value="All Levels">All Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Meeting Cadence
                  </label>
                  <input
                    type="text"
                    value={meetingCadence}
                    onChange={(e) => setMeetingCadence(e.target.value)}
                    placeholder="e.g. Thursdays 6 PM"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-2xs"
                >
                  Create Circle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
