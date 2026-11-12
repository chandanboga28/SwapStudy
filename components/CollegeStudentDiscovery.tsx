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
      <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#464B55] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search classmates by name, major, or skill..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] text-sm text-[#1F2227] placeholder-[#5A606B] focus:outline-none"
          />
        </div>

        <div className="inline-flex p-1 rounded-full bg-[#EFECE4] border border-[#4A4E57] self-start">
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
                  ? 'bg-[#3B5CA8] text-[#FFFFFF]'
                  : 'text-[#464B55] hover:text-[#1F2227]'
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
                className="bg-[#F8F6F0] border border-[#4A4E57] hover:border-[#2F4D96] rounded-2xl p-6 flex flex-col justify-between space-y-5 transition-colors"
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
                        className="w-12 h-12 rounded-full object-cover border border-[#4A4E57] bg-[#EFECE4]"
                      />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onViewProfile(student)}
                          className="text-base font-bold text-[#1F2227] hover:text-[#2F4D96] truncate cursor-pointer text-left"
                        >
                          {student.name}
                        </button>
                        {student.isCollegeVerified && (
                          <ShieldCheck className="w-4 h-4 text-[#195434] shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-[#464B55] flex items-center gap-1 mt-0.5 truncate">
                        <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                        {student.major || student.university}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-[#464B55]">
                        <span className="inline-flex items-center gap-1 font-bold text-[#1F2227]">
                          <Star className="w-3.5 h-3.5 text-[#8A6500] fill-[#F4DC82]" />
                          {student.repRating > 0 ? student.repRating.toFixed(1) : 'New'}
                        </span>
                        <span>· {student.totalHoursTaught}h taught</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#E6E3DA] border border-[#4A4E57] rounded-xl p-3.5 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#2F4D96]">
                      Teaches
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {student.skillsToTeach.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-[#EFECE4] border border-[#4A4E57] text-xs font-medium text-[#1F2227]"
                        >
                          {tag}
                        </span>
                      ))}
                      {student.skillsToTeach.length === 0 && (
                        <span className="text-xs text-[#464B55]">Not listed yet</span>
                      )}
                    </div>

                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#195434] pt-1">
                      Learning
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {student.skillsToLearn.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-[#EFECE4] border border-[#4A4E57] text-xs font-medium text-[#464B55]"
                        >
                          {tag}
                        </span>
                      ))}
                      {student.skillsToLearn.length === 0 && (
                        <span className="text-xs text-[#464B55]">Open to explore</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2 border-t border-[#CEC9BC]">
                  {connStatus === 'accepted' ? (
                    <button
                      type="button"
                      disabled={busyId === `msg-${student.id}`}
                      onClick={() => handleMessage(student.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-xs font-bold transition-colors cursor-pointer"
                    >
                      {busyId === `msg-${student.id}` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <MessageSquare className="w-3.5 h-3.5" />
                      )}
                      Message Peer
                    </button>
                  ) : connStatus === 'pending' && !isIncoming ? (
                    <span className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-[#E6E3DA] border border-[#4A4E57] text-xs font-semibold text-[#9E3922]">
                      <Clock className="w-3.5 h-3.5" />
                      Pending
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === student.id}
                      onClick={() => handleConnect(student.id, isIncoming)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] text-xs font-bold transition-colors cursor-pointer"
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
                    className="px-4 py-2.5 rounded-full bg-[#E6E3DA] hover:bg-[#DCD8CD] border border-[#4A4E57] text-xs font-semibold text-[#1F2227] transition-colors cursor-pointer"
                  >
                    Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] shadow-[3.5px_3.5px_0_#C5C0B4] rounded-2xl p-12 text-center space-y-3">
          {filterMode === 'matches' ? (
            <Repeat className="w-9 h-9 text-[#2F4D96] mx-auto" />
          ) : (
            <Users className="w-9 h-9 text-[#2F4D96] mx-auto" />
          )}
          <h3 className="text-xl font-bold text-[#1F2227]">No classmates matched this filter</h3>
          <p className="text-sm text-[#464B55] max-w-md mx-auto">
            Try switching to &ldquo;All Peers&rdquo; or updating your teaching and learning skill tags in your profile.
          </p>
        </div>
      )}
    </div>
  );
}
