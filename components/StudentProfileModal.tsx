'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User, Skill } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useMessaging } from '@/context/MessagingContext';
import { useCommunity } from '@/context/CommunityContext';
import {
  X,
  GraduationCap,
  Star,
  BookOpen,
  Clock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  UserPlus,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface StudentProfileModalProps {
  student: User | null;
  onClose: () => void;
  onSelectSkill?: (skill: Skill) => void;
  availableSkills?: Skill[];
}

export default function StudentProfileModal({
  student,
  onClose,
  onSelectSkill,
  availableSkills = [],
}: StudentProfileModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { canMessageStudent, startConversationWith } = useMessaging();
  const { sendConnectionRequest, acceptConnection, getConnectionRecord } = useCommunity();
  const [isBusy, setIsBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const busyRef = useRef(false);

  if (!student) return null;

  const candidateSkills = availableSkills.filter((s) => s.teacherId === student.id);
  const isSelf = user?.id === student.id;
  const messageCheck = !isSelf ? canMessageStudent(student.id) : null;
  const connRecord = !isSelf ? getConnectionRecord(student.id) : null;
  const isIncomingPending = connRecord?.status === 'pending' && connRecord.receiverId === user?.id;

  const handleMessage = async () => {
    if (!messageCheck?.allowed || busyRef.current) return;
    busyRef.current = true;
    setIsBusy(true);
    setActionError(null);
    try {
      const res = await startConversationWith(student.id);
      if (res.success && res.conversationId) {
        onClose();
        router.push(`/messages?conversationId=${res.conversationId}`);
      } else {
        setActionError(res.error || 'Could not open conversation.');
      }
    } finally {
      busyRef.current = false;
      setIsBusy(false);
    }
  };

  const handleConnect = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setIsBusy(true);
    setActionError(null);
    try {
      const res = await sendConnectionRequest(
        student.id,
        'Hey! Would love to connect and chat about study skills.'
      );
      if (!res.success) {
        setActionError(res.error || 'Failed to send connection request.');
      }
    } finally {
      busyRef.current = false;
      setIsBusy(false);
    }
  };

  const handleAcceptAndMessage = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setIsBusy(true);
    setActionError(null);
    try {
      const acceptRes = await acceptConnection(student.id);
      if (!acceptRes.success) {
        setActionError(acceptRes.error || 'Failed to accept connection.');
        return;
      }
      const convRes = await startConversationWith(student.id);
      if (convRes.success && convRes.conversationId) {
        onClose();
        router.push(`/messages?conversationId=${convRes.conversationId}`);
      } else if (convRes.error) {
        setActionError(convRes.error);
      }
    } finally {
      busyRef.current = false;
      setIsBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header Banner */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 p-6 text-white shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white/80 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            <img
              src={student.avatar}
              alt={student.name}
              className="w-16 h-16 rounded-full border-2 border-white/60 object-cover shadow-md shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white truncate">{student.name}</h2>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold text-emerald-100">
                  Class of {student.graduationYear || '2026'}
                </span>
                {student.isCollegeVerified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/30 text-[10px] font-bold text-emerald-200 border border-emerald-400/30">
                    <ShieldCheck className="w-3 h-3 text-emerald-300" />
                    Verified
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-500/30 text-[10px] font-medium text-slate-300">
                    Unverified
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-100/90 truncate flex items-center gap-1.5 mt-0.5">
                <GraduationCap className="w-3.5 h-3.5" />
                {student.university} • {student.major}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-white/90 font-medium">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  {student.repRating?.toFixed(1) || '5.0'} Rep
                </span>
                <span>•</span>
                <span>{student.totalHoursTaught || 0}h Taught</span>
                <span>•</span>
                <span>{student.totalHoursLearned || 0}h Learned</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Bio */}
          {student.bio && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">About</h3>
              <p className="text-xs leading-relaxed text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                {student.bio}
              </p>
            </div>
          )}

          {/* Skills They Teach */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              Skills They Teach
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {student.skillsToTeach && student.skillsToTeach.length > 0 ? (
                student.skillsToTeach.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-semibold"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">No skills listed yet</span>
              )}
            </div>
          </div>

          {/* Published Courses & Listings */}
          {candidateSkills.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Active Skill Offerings ({candidateSkills.length})
              </h3>
              <div className="space-y-2">
                {candidateSkills.map((sk) => (
                  <div
                    key={sk.id}
                    className="p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{sk.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{sk.hourlyCredits} Credits</span>
                        <span>•</span>
                        <span>{sk.sessionDurationMinutes} mins</span>
                        <span>•</span>
                        <span>{sk.level}</span>
                      </p>
                    </div>
                    {onSelectSkill && (
                      <button
                        onClick={() => {
                          onClose();
                          onSelectSkill(sk);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shrink-0 transition-colors flex items-center gap-1"
                      >
                        Request Swap
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Learning Wishlist */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              What They Want to Learn
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {student.skillsToLearn && student.skillsToLearn.length > 0 ? (
                student.skillsToLearn.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">Wishlist empty</span>
              )}
            </div>
          </div>
        </div>

        {actionError && (
          <div className="px-6 py-2 bg-rose-50 border-t border-rose-200 text-rose-700 text-xs flex items-center gap-1.5 shrink-0">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
            {student.isCollegeVerified ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified {student.university} Student</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                <span>SwapStudy Student (College Verification Pending)</span>
              </>
            )}
          </span>
          <div className="flex items-center gap-2">
            {!isSelf && (
              <>
                {messageCheck?.allowed ? (
                  <button
                    disabled={isBusy}
                    onClick={handleMessage}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    {isBusy ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <MessageSquare className="w-3.5 h-3.5" />
                    )}
                    {isBusy ? 'Opening...' : 'Message Student'}
                  </button>
                ) : messageCheck?.connectionStatus === 'pending' ? (
                  isIncomingPending ? (
                    <button
                      disabled={isBusy}
                      onClick={handleAcceptAndMessage}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      {isBusy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      {isBusy ? 'Opening...' : 'Accept & Message'}
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Connection Pending
                    </span>
                  )
                ) : messageCheck?.connectionStatus === 'none' ? (
                  <button
                    disabled={isBusy}
                    onClick={handleConnect}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    {isBusy ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5" />
                    )}
                    {isBusy ? 'Sending...' : 'Connect to Message'}
                  </button>
                ) : null}
              </>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
