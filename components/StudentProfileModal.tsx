'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Skill } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useCommunity } from '@/context/CommunityContext';
import { useMessaging } from '@/context/MessagingContext';
import {
  X,
  Star,
  GraduationCap,
  ShieldCheck,
  Clock,
  BookOpen,
  Sparkles,
  UserPlus,
  MessageSquare,
  Check,
  Loader2,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react';

interface StudentProfileModalProps {
  student: User;
  onClose: () => void;
  onSelectSkill?: (skill: Skill) => void;
  availableSkills?: Skill[];
}

export default function StudentProfileModal({
  student,
  onClose,
  onSelectSkill,
  availableSkills,
}: StudentProfileModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { skills } = useApp();
  const {
    getConnectionStatus,
    getConnectionRecord,
    sendConnectionRequest,
    acceptConnection,
  } = useCommunity();
  const { startConversationWith } = useMessaging();

  const [isConnecting, setIsConnecting] = useState(false);
  const [isMessaging, setIsMessaging] = useState(false);
  const [actionError, setActionError] = useState('');

  const studentListings =
    availableSkills ?? skills.filter((s) => s.teacherId === student.id);

  const isSelf = user?.id === student.id;
  const connStatus = getConnectionStatus(student.id);
  const connRecord = getConnectionRecord(student.id);
  const isIncomingPending =
    connStatus === 'pending' && connRecord?.receiverId === user?.id;

  const handleConnect = async () => {
    if (!user || isSelf || isConnecting) return;
    setActionError('');
    setIsConnecting(true);
    try {
      const res = isIncomingPending
        ? await acceptConnection(student.id)
        : await sendConnectionRequest(student.id);
      if (!res.success) {
        setActionError(res.error || 'Could not update connection.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleMessage = async () => {
    if (!user || isSelf || isMessaging) return;
    setActionError('');
    setIsMessaging(true);
    try {
      const res = await startConversationWith(student.id);
      if (!res.success || !res.conversationId) {
        setActionError(res.error || 'Could not start conversation.');
        return;
      }
      onClose();
      router.push(`/messages?conversationId=${encodeURIComponent(res.conversationId)}`);
    } finally {
      setIsMessaging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-[#22211F] border border-[#37332E] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#37332E] bg-[#1B1A18] flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <img
              src={student.avatar}
              alt={student.name}
              className="w-14 h-14 rounded-full object-cover border border-[#37332E] bg-[#171715] shrink-0"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-[#F7F5F0] truncate">
                  {student.name}
                </h2>
                {student.isCollegeVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#65C995]/15 border border-[#65C995]/30 text-[#65C995]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Peer
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-[#AAA69F] flex items-center gap-1.5 mt-1 truncate">
                <GraduationCap className="w-4 h-4 text-[#FF9B45] shrink-0" />
                <span className="truncate">
                  {student.major || 'Student'}
                  {student.graduationYear ? ` · Class of ${student.graduationYear}` : ''} ·{' '}
                  {student.university}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#AAA69F] hover:text-[#F7F5F0] hover:bg-[#2B2824] transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Metrics Strip */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#2B2824] border border-[#37332E] rounded-xl p-3.5 text-center">
              <div className="flex items-center justify-center gap-1 text-lg font-extrabold text-[#F7F5F0]">
                <Star className="w-4 h-4 text-[#FF9B45] fill-[#FF9B45]" />
                {student.repRating > 0 ? student.repRating.toFixed(1) : 'New'}
              </div>
              <p className="text-xs text-[#AAA69F] mt-0.5">Peer Rating</p>
            </div>
            <div className="bg-[#2B2824] border border-[#37332E] rounded-xl p-3.5 text-center">
              <div className="text-lg font-extrabold text-[#F7F5F0] tabular-nums">
                {student.totalHoursTaught}h
              </div>
              <p className="text-xs text-[#AAA69F] mt-0.5">Hours Taught</p>
            </div>
            <div className="bg-[#2B2824] border border-[#37332E] rounded-xl p-3.5 text-center">
              <div className="text-lg font-extrabold text-[#F7F5F0] tabular-nums">
                {student.totalHoursLearned}h
              </div>
              <p className="text-xs text-[#AAA69F] mt-0.5">Hours Learned</p>
            </div>
          </div>

          {/* Bio */}
          {student.bio && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#AAA69F]">
                About
              </h3>
              <p className="text-sm text-[#F7F5F0] leading-relaxed">{student.bio}</p>
            </div>
          )}

          {/* Skills Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#171715] border border-[#37332E] rounded-xl p-4 space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-[#FF9B45] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Can Teach
              </p>
              {student.skillsToTeach.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {student.skillsToTeach.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#22211F] border border-[#37332E] text-[#F7F5F0]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#AAA69F]">No teaching tags listed yet.</p>
              )}
            </div>

            <div className="bg-[#171715] border border-[#37332E] rounded-xl p-4 space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-[#65C995] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Wants to Learn
              </p>
              {student.skillsToLearn.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {student.skillsToLearn.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#22211F] border border-[#37332E] text-[#F7F5F0]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#AAA69F]">No wishlist tags added yet.</p>
              )}
            </div>
          </div>

          {/* Active Listings */}
          {studentListings.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#AAA69F]">
                Active Session Listings ({studentListings.length})
              </h3>
              <div className="space-y-2.5">
                {studentListings.map((skill) => (
                  <div
                    key={skill.id}
                    className="bg-[#2B2824] border border-[#37332E] rounded-xl p-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#F7F5F0] truncate">
                        {skill.title}
                      </p>
                      <p className="text-xs text-[#AAA69F] flex items-center gap-2 mt-0.5">
                        <span>{skill.category}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {skill.sessionDurationMinutes} min
                        </span>
                        <span>·</span>
                        <span className="text-[#FF9B45] font-bold">
                          {skill.hourlyCredits} {skill.hourlyCredits === 1 ? 'Credit' : 'Credits'}
                        </span>
                      </p>
                    </div>
                    {onSelectSkill && !isSelf && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onSelectSkill(skill);
                        }}
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-xs font-bold transition-colors shrink-0 cursor-pointer"
                      >
                        Book
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {actionError && (
            <div className="flex items-start gap-2 p-3.5 rounded-xl bg-[#F07878]/10 border border-[#F07878]/30 text-sm text-[#F07878]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        {!isSelf && user && (
          <div className="px-6 py-4 border-t border-[#37332E] bg-[#1B1A18] flex flex-wrap items-center justify-end gap-3 shrink-0">
            {connStatus === 'accepted' ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#65C995]/15 border border-[#65C995]/30 text-xs font-bold text-[#65C995]">
                <Check className="w-3.5 h-3.5" />
                Connected
              </span>
            ) : connStatus === 'pending' && !isIncomingPending ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#2B2824] border border-[#37332E] text-xs font-semibold text-[#AAA69F]">
                <Clock className="w-3.5 h-3.5 text-[#F5B66B]" />
                Request Sent
              </span>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={isConnecting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#2B2824] hover:bg-[#37332E] border border-[#37332E] text-sm font-semibold text-[#F7F5F0] transition-colors cursor-pointer"
              >
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 text-[#FF9B45]" />
                )}
                {isIncomingPending ? 'Accept Connection' : 'Connect'}
              </button>
            )}

            <button
              type="button"
              onClick={handleMessage}
              disabled={isMessaging}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] disabled:opacity-50 text-[#171715] text-sm font-bold transition-colors cursor-pointer"
            >
              {isMessaging ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
              Message Peer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
