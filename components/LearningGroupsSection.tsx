'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCommunity } from '@/context/CommunityContext';
import {
  Users,
  Plus,
  X,
  Calendar,
  Sparkles,
  Check,
  AlertCircle,
} from 'lucide-react';

export default function LearningGroupsSection() {
  const { user } = useAuth();
  const { groups, currentCollege, createGroup, joinGroup, leaveGroup, openAuthPrompt } = useCommunity();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [skillLevel, setSkillLevel] = useState<'All Levels' | 'Beginner' | 'Intermediate' | 'Advanced'>(
    'All Levels'
  );
  const [cadence, setCadence] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !topic.trim() || !description.trim()) {
      setErrorMsg('Please fill out the group name, topic, and description.');
      return;
    }

    const res = createGroup({
      name: name.trim(),
      topic: topic.trim(),
      skillLevel,
      meetingCadence: cadence.trim() || undefined,
      description: description.trim(),
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Could not create study circle.');
      return;
    }

    setName('');
    setTopic('');
    setCadence('');
    setDescription('');
    setErrorMsg('');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-6">
        <div>
          <h2 className="text-xl font-bold text-[#1F2227]">
            {currentCollege.shortName} Study Circles
          </h2>
          <p className="text-sm text-[#464B55] mt-0.5">
            Join peer-led weekly study groups or launch a new focused circle.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!user) {
              openAuthPrompt('create a study circle');
              return;
            }
            setShowCreateModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-sm font-bold transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Study Circle
        </button>
      </div>

      {/* Groups Grid */}
      {groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((group) => {
            const isMember = user ? group.memberIds.includes(user.id) : false;

            return (
              <div
                key={group.id}
                className="bg-[#F8F6F0] border border-[#4A4E57] hover:border-[#2F4D96] rounded-2xl p-6 flex flex-col justify-between space-y-5 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#E6E3DA] border border-[#4A4E57] text-xs font-bold text-[#2F4D96]">
                      {group.topic}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-[#EFECE4] border border-[#4A4E57] text-xs font-semibold text-[#464B55]">
                      {group.skillLevel}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#1F2227] leading-snug">
                    {group.name}
                  </h3>

                  <p className="text-sm text-[#464B55] leading-relaxed line-clamp-3">
                    {group.description}
                  </p>
                </div>

                <div className="space-y-4 pt-3 border-t border-[#CEC9BC]">
                  <div className="flex items-center justify-between gap-2 text-xs text-[#464B55]">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#1F2227]">
                      <Users className="w-3.5 h-3.5 text-[#2F4D96]" />
                      {group.memberIds.length} {group.memberIds.length === 1 ? 'member' : 'members'}
                    </span>
                    {group.meetingCadence && (
                      <span className="inline-flex items-center gap-1 truncate">
                        <Calendar className="w-3.5 h-3.5 text-[#9E3922]" />
                        {group.meetingCadence}
                      </span>
                    )}
                  </div>

                  {isMember ? (
                    <button
                      type="button"
                      onClick={() => leaveGroup(group.id)}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-[#E6E3DA] hover:bg-[#FCE7E3] border-[1.5px] border-[#4A4E57] hover:border-[#B34B39] text-xs font-bold text-[#195434] hover:text-[#8F2618] transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      Joined (Click to Leave)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => joinGroup(group.id)}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Join Circle
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-12 text-center space-y-3">
          <Users className="w-9 h-9 text-[#2F4D96] mx-auto" />
          <h3 className="text-xl font-bold text-[#1F2227]">No study circles yet</h3>
          <p className="text-sm text-[#464B55] max-w-md mx-auto">
            Create the first study circle for algorithms, UI/UX reviews, or exam sprint prep.
          </p>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2227]/45 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-[#CEC9BC] bg-[#E6E3DA] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1F2227]">Create Study Circle</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl text-[#464B55] hover:text-[#1F2227] hover:bg-[#E6E3DA] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#464B55] mb-2">
                  Circle Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Weekend LeetCode & DSA Circle"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#464B55] mb-2">
                    Focus Topic
                  </label>
                  <input
                    type="text"
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Algorithms"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#464B55] mb-2">
                    Level
                  </label>
                  <select
                    value={skillLevel}
                    onChange={(e) =>
                      setSkillLevel(
                        e.target.value as 'All Levels' | 'Beginner' | 'Intermediate' | 'Advanced'
                      )
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] focus:outline-none"
                  >
                    <option value="All Levels" className="bg-[#F8F6F0]">All Levels</option>
                    <option value="Beginner" className="bg-[#F8F6F0]">Beginner</option>
                    <option value="Intermediate" className="bg-[#F8F6F0]">Intermediate</option>
                    <option value="Advanced" className="bg-[#F8F6F0]">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#464B55] mb-2">
                  Meeting Cadence (Optional)
                </label>
                <input
                  type="text"
                  value={cadence}
                  onChange={(e) => setCadence(e.target.value)}
                  placeholder="e.g. Saturdays 5 PM IST"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#464B55] mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What will members practice together?"
                  className="w-full px-4 py-3 rounded-xl bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] focus:outline-none resize-none"
                />
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-[#FCE7E3] border border-[#B34B39] text-sm text-[#8F2618]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-full bg-[#E6E3DA] border border-[#4A4E57] text-sm font-semibold text-[#1F2227] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-sm font-bold cursor-pointer"
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
