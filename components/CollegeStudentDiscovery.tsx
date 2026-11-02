'use client';

import React, { useState, useMemo } from 'react';
import { User, Skill, Session } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useCommunity } from '@/context/CommunityContext';
import { calculateSmartMatches } from '@/lib/matching';
import {
  Users,
  Search,
  Star,
  ShieldCheck,
  UserPlus,
  Check,
  Clock,
  ArrowRightLeft,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';

interface CollegeStudentDiscoveryProps {
  onViewProfile: (student: User) => void;
  availableSkills?: Skill[];
  sessions?: Session[];
}

export default function CollegeStudentDiscovery({
  onViewProfile,
  availableSkills = [],
  sessions = [],
}: CollegeStudentDiscoveryProps) {
  const { user } = useAuth();
  const { sameCollegeStudents, currentCollege, sendConnectionRequest, getConnectionStatus } = useCommunity();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'matches' | 'connected'>('all');
  const [requestFeedback, setRequestFeedback] = useState<string | null>(null);

  // Calculate smart matches for peers
  const smartMatches = useMemo(() => {
    return calculateSmartMatches(user, sameCollegeStudents, availableSkills, sessions);
  }, [user, sameCollegeStudents, availableSkills, sessions]);

  // Map candidate ID to smart match
  const matchesMap = useMemo(() => {
    const map = new Map<string, (typeof smartMatches)[0]>();
    for (const m of smartMatches) {
      map.set(m.candidate.id, m);
    }
    return map;
  }, [smartMatches]);

  const filteredStudents = useMemo(() => {
    return sameCollegeStudents.filter((student) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        student.name.toLowerCase().includes(q) ||
        student.major.toLowerCase().includes(q) ||
        student.skillsToTeach.some((s) => s.toLowerCase().includes(q)) ||
        student.skillsToLearn.some((s) => s.toLowerCase().includes(q));

      const status = getConnectionStatus(student.id);

      if (filterMode === 'connected') {
        return matchesSearch && status === 'accepted';
      }
      if (filterMode === 'matches') {
        const hasMatch = matchesMap.has(student.id);
        return matchesSearch && hasMatch;
      }
      return matchesSearch;
    });
  }, [sameCollegeStudents, searchQuery, filterMode, getConnectionStatus, matchesMap]);

  const handleConnect = (studentId: string, studentName: string) => {
    const res = sendConnectionRequest(studentId, `Hi ${studentName}, would love to connect on SwapStudy!`);
    if (res.success) {
      setRequestFeedback(`Connection request sent to ${studentName}!`);
      setTimeout(() => setRequestFeedback(null), 3000);
    } else {
      setRequestFeedback(res.error || 'Failed to send request.');
      setTimeout(() => setRequestFeedback(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast feedback */}
      {requestFeedback && (
        <div className="p-3 bg-slate-900 text-white rounded-xl text-xs font-medium shadow-md flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{requestFeedback}</span>
        </div>
      )}

      {/* Header card */}
      <div className="card-subtle rounded-2xl p-5 space-y-4 bg-white border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-[11px] font-semibold text-emerald-800 mb-1">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Campus Peer Directory</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Discover {currentCollege.shortName} Students
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Connect with fellow students from your campus. Filter by shared interests, mutual skill swaps, or active connections.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl text-xs self-start sm:self-auto border border-slate-200/60">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterMode === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({sameCollegeStudents.length})
            </button>
            <button
              onClick={() => setFilterMode('matches')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                filterMode === 'matches'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowRightLeft className="w-3 h-3" />
              Skill Swaps ({smartMatches.length})
            </button>
            <button
              onClick={() => setFilterMode('connected')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterMode === 'connected'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Connected
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="pt-2 border-t border-slate-100">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search peers by name, major, or skills (e.g. Python, Figma, LeetCode)..."
              className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Students Directory Grid */}
      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => {
            const match = matchesMap.get(student.id);
            const isMutual = match?.matchType === 'mutual';
            const connStatus = getConnectionStatus(student.id);

            return (
              <div
                key={student.id}
                className={`card-subtle rounded-2xl p-5 space-y-4 bg-white border transition-all flex flex-col justify-between ${
                  isMutual
                    ? 'border-emerald-300 ring-1 ring-emerald-500/10'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Row: Avatar & Name */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={student.avatar}
                        alt={student.name}
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {student.name}
                          </h3>
                          {student.isCollegeVerified ? (
                            <span title="Verified College Student">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">
                              (Unverified)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {student.major}
                        </p>
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 mt-0.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{student.repRating?.toFixed(1) || '5.0'}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400 font-normal">
                            Class of {student.graduationYear || '2026'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Match Badge if exists */}
                    {isMutual ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300/60 shrink-0 flex items-center gap-1">
                        <ArrowRightLeft className="w-2.5 h-2.5 text-emerald-600" />
                        Mutual Swap
                      </span>
                    ) : match ? (
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200/60 shrink-0 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                        Wishlist
                      </span>
                    ) : null}
                  </div>

                  {/* Skills Teaches */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Can Teach
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {student.skillsToTeach.slice(0, 2).map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-medium truncate max-w-full"
                        >
                          {s}
                        </span>
                      ))}
                      {student.skillsToTeach.length > 2 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{student.skillsToTeach.length - 2}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Skills Wants to Learn */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Wants to Learn
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {student.skillsToLearn.slice(0, 2).map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium truncate max-w-full"
                        >
                          {s}
                        </span>
                      ))}
                      {student.skillsToLearn.length > 2 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{student.skillsToLearn.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onViewProfile(student)}
                    className="flex-1 py-1.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold bg-white transition-colors flex items-center justify-center gap-1.5"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    Profile
                  </button>

                  {/* Connect / Pending / Connected Button */}
                  {connStatus === 'accepted' ? (
                    <span className="py-1.5 px-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-xs font-semibold flex items-center gap-1 shrink-0">
                      <Check className="w-3 h-3 text-emerald-600" />
                      Connected
                    </span>
                  ) : connStatus === 'pending' ? (
                    <span
                      className="py-1.5 px-3 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 text-xs font-medium flex items-center gap-1 shrink-0"
                      title="Connection request pending"
                    >
                      <Clock className="w-3 h-3 text-slate-400" />
                      Pending
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConnect(student.id, student.name)}
                      className="py-1.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-2xs flex items-center gap-1 shrink-0"
                    >
                      <UserPlus className="w-3 h-3" />
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">No Students Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Try adjusting your search query or switching the filter tab.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
