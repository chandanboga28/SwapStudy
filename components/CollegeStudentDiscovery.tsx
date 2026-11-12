'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useCommunity } from '@/context/CommunityContext';
import { useMessaging } from '@/context/MessagingContext';
import {
  Search,
  GraduationCap,
  ShieldCheck,
  Star,
  UserPlus,
  MessageSquare,
  Check,
  Clock,
  Users,
  Repeat,
  Loader2,
} from 'lucide-react';

interface CollegeStudentDiscoveryProps {
  onViewProfile: (student: User) => void;
}

export default function CollegeStudentDiscovery({ onViewProfile }: CollegeStudentDiscoveryProps) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    sameCollegeStudents,
    getConnectionStatus,
    getConnectionRecord,
    sendConnectionRequest,
    acceptConnection,
  } = useCommunity();
  const { startConversationWith } = useMessaging();

  const [query, setQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'matches' | 'connected'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const peers = useMemo(() => {
    const others = sameCollegeStudents.filter((s) => s.id !== user?.id);

    return others.filter((student) => {
      if (filterMode === 'connected' && getConnectionStatus(student.id) !== 'accepted') {
        return false;
      }

      if (filterMode === 'matches' && user) {
        const myLearn = user.skillsToLearn.map((s) => s.toLowerCase());
        const myTeach = user.skillsToTeach.map((s) => s.toLowerCase());
        const canHelpMe = student.skillsToTeach.some((s) =>
          myLearn.some((w) => s.toLowerCase().includes(w) || w.includes(s.toLowerCase()))
        );
        const wantsMyHelp = student.skillsToLearn.some((s) =>
          myTeach.some((t) => s.toLowerCase().includes(t) || t.includes(s.toLowerCase()))
        );
        if (!canHelpMe && !wantsMyHelp) return false;
      }

      if (query.trim()) {
        const q = query.toLowerCase();
        const hay = [
          student.name,
          student.major,
          ...student.skillsToTeach,
          ...student.skillsToLearn,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [sameCollegeStudents, user, filterMode, query, getConnectionStatus]);

  const handleConnect = async (studentId: string, isIncoming: boolean) => {
    if (busyId) return;
    setBusyId(studentId);
    try {
      if (isIncoming) {
        await acceptConnection(studentId);
      } else {
        await sendConnectionRequest(studentId);
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleMessage = async (studentId: string) => {
    if (busyId) return;
    setBusyId(`msg-${studentId}`);
    try {
      const res = await startConversationWith(studentId);
      if (res.success && res.conversationId) {
        router.push(`/messages?conversationId=${encodeURIComponent(res.conversationId)}`);
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Strip */}
      <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#AAA69F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search classmates by name, major, or skill..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] placeholder-[#AAA69F]/60 focus:outline-none"
          />
        </div>

        <div className="inline-flex p-1 rounded-full bg-[#171715] border border-[#37332E] self-start">
          {[
            { key: 'all', label: 'All Peers' },
            { key: 'matches', label: 'Skill Overlap' },
            { key: 'connected', label: 'Connected' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterMode(tab.key as 'all' | 'matches' | 'connected')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                filterMode === tab.key
                  ? 'bg-[#FF9B45] text-[#171715]'
                  : 'text-[#AAA69F] hover:text-[#F7F5F0]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Grid */}
      {peers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {peers.map((student) => {
            const connStatus = getConnectionStatus(student.id);
            const connRec = getConnectionRecord(student.id);
            const isIncoming = connStatus === 'pending' && connRec?.receiverId === user?.id;

            return (
              <div
                key={student.id}
                className="bg-[#22211F] border border-[#37332E] hover:border-[#4F4942] rounded-2xl p-6 flex flex-col justify-between space-y-5 transition-colors"
              >
                <div className="space-y-4">
                  <div className="flex items-start gap-3.5">
                    <button
                      type="button"
                      onClick={() => onViewProfile(student)}
                      className="shrink-0 cursor-pointer"
                    >
                      <img
                        src={student.avatar}
                        alt={student.name}
                        className="w-12 h-12 rounded-full object-cover border border-[#37332E] bg-[#171715]"
                      />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onViewProfile(student)}
                          className="text-base font-bold text-[#F7F5F0] hover:text-[#FF9B45] truncate cursor-pointer text-left"
                        >
                          {student.name}
                        </button>
                        {student.isCollegeVerified && (
                          <ShieldCheck className="w-4 h-4 text-[#65C995] shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-[#AAA69F] flex items-center gap-1 mt-0.5 truncate">
                        <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                        {student.major || student.university}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-[#AAA69F]">
                        <span className="inline-flex items-center gap-1 font-bold text-[#F7F5F0]">
                          <Star className="w-3.5 h-3.5 text-[#FF9B45] fill-[#FF9B45]" />
                          {student.repRating > 0 ? student.repRating.toFixed(1) : 'New'}
                        </span>
                        <span>· {student.totalHoursTaught}h taught</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#2B2824] border border-[#37332E] rounded-xl p-3.5 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#FF9B45]">
                      Teaches
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {student.skillsToTeach.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-[#171715] border border-[#37332E] text-xs font-medium text-[#F7F5F0]"
                        >
                          {tag}
                        </span>
                      ))}
                      {student.skillsToTeach.length === 0 && (
                        <span className="text-xs text-[#AAA69F]">Not listed yet</span>
                      )}
                    </div>

                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#65C995] pt-1">
                      Learning
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {student.skillsToLearn.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-[#171715] border border-[#37332E] text-xs font-medium text-[#AAA69F]"
                        >
                          {tag}
                        </span>
                      ))}
                      {student.skillsToLearn.length === 0 && (
                        <span className="text-xs text-[#AAA69F]">Open to explore</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2 border-t border-[#37332E]">
                  {connStatus === 'accepted' ? (
                    <button
                      type="button"
                      disabled={busyId === `msg-${student.id}`}
                      onClick={() => handleMessage(student.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-xs font-bold transition-colors cursor-pointer"
                    >
                      {busyId === `msg-${student.id}` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <MessageSquare className="w-3.5 h-3.5" />
                      )}
                      Message Peer
                    </button>
                  ) : connStatus === 'pending' && !isIncoming ? (
                    <span className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-[#2B2824] border border-[#37332E] text-xs font-semibold text-[#F5B66B]">
                      <Clock className="w-3.5 h-3.5" />
                      Pending
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === student.id}
                      onClick={() => handleConnect(student.id, isIncoming)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-xs font-bold transition-colors cursor-pointer"
                    >
                      {busyId === student.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isIncoming ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <UserPlus className="w-3.5 h-3.5" />
                      )}
                      {isIncoming ? 'Accept Invite' : 'Connect'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onViewProfile(student)}
                    className="px-4 py-2.5 rounded-full bg-[#2B2824] hover:bg-[#37332E] border border-[#37332E] text-xs font-semibold text-[#F7F5F0] transition-colors cursor-pointer"
                  >
                    Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#22211F] border border-[#37332E] rounded-2xl p-12 text-center space-y-3">
          {filterMode === 'matches' ? (
            <Repeat className="w-9 h-9 text-[#FF9B45] mx-auto" />
          ) : (
            <Users className="w-9 h-9 text-[#FF9B45] mx-auto" />
          )}
          <h3 className="text-xl font-bold text-[#F7F5F0]">No classmates matched this filter</h3>
          <p className="text-sm text-[#AAA69F] max-w-md mx-auto">
            Try switching to &ldquo;All Peers&rdquo; or updating your teaching and learning skill tags in your profile.
          </p>
        </div>
      )}
    </div>
  );
}
