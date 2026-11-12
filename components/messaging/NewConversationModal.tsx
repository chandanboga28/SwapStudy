'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useCommunity } from '@/context/CommunityContext';
import { useMessaging } from '@/context/MessagingContext';
import {
  X,
  Search,
  MessageSquarePlus,
  ShieldCheck,
  UserPlus,
  Clock,
  AlertCircle,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface NewConversationModalProps {
  onClose: () => void;
  onSelectStudent: (student: User) => void;
  onViewProfile?: (student: User) => void;
}

export default function NewConversationModal({
  onClose,
  onSelectStudent,
  onViewProfile,
}: NewConversationModalProps) {
  const { user, allUsers } = useAuth();
  const {
    sendConnectionRequest,
    acceptConnection,
    getConnectionRecord,
    refreshConnections,
  } = useCommunity();
  const { canMessageStudent, startConversationWith } = useMessaging();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'connected' | 'not_connected'>('all');
  const [actionNotice, setActionNotice] = useState<{ text: string; isError?: boolean } | null>(null);
  const [busyStudentId, setBusyStudentId] = useState<string | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    refreshConnections();
  }, [refreshConnections]);

  // Filter candidate students (exclude current user)
  const candidateStudents = useMemo(() => {
    if (!user) return [];
    return allUsers.filter((u) => u.id !== user.id);
  }, [allUsers, user]);

  const filteredStudents = useMemo(() => {
    let list = candidateStudents;

    // Filter by query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.major.toLowerCase().includes(q) ||
          s.university.toLowerCase().includes(q) ||
          s.skillsToTeach?.some((sk) => sk.toLowerCase().includes(q)) ||
          s.skillsToLearn?.some((sk) => sk.toLowerCase().includes(q))
      );
    }

    // Filter by connection tab
    if (filterTab === 'connected') {
      list = list.filter((s) => getConnectionRecord(s.id)?.status === 'accepted');
    } else if (filterTab === 'not_connected') {
      list = list.filter((s) => getConnectionRecord(s.id)?.status !== 'accepted');
    }

    return list;
  }, [candidateStudents, searchQuery, filterTab, getConnectionRecord]);

  const handleStartChat = async (targetUser: User) => {
    if (busyRef.current) return;
    const check = canMessageStudent(targetUser.id);
    if (!check.allowed) {
      setActionNotice({
        text: check.reason || 'Messaging unavailable with this student.',
        isError: true,
      });
      return;
    }

    busyRef.current = true;
    setBusyStudentId(targetUser.id);
    setActionNotice(null);
    try {
      const res = await startConversationWith(targetUser.id);
      if (res.success && res.conversationId) {
        onSelectStudent(targetUser);
        onClose();
      } else {
        setActionNotice({
          text: res.error || 'Failed to start conversation.',
          isError: true,
        });
      }
    } finally {
      busyRef.current = false;
      setBusyStudentId(null);
    }
  };

  const handleSendConnection = async (targetUser: User) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusyStudentId(targetUser.id);
    setActionNotice(null);
    try {
      const res = await sendConnectionRequest(
        targetUser.id,
        'Hey! Would love to connect on SwapStudy and chat about skills.'
      );
      if (res.success) {
        setActionNotice({
          text: `Connection request sent to ${targetUser.name}! Direct messaging will unlock once accepted.`,
        });
      } else {
        setActionNotice({
          text: res.error || 'Failed to send request.',
          isError: true,
        });
      }
    } finally {
      busyRef.current = false;
      setBusyStudentId(null);
    }
  };

  const handleAcceptConnection = async (targetUser: User) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusyStudentId(targetUser.id);
    setActionNotice(null);
    try {
      const acceptRes = await acceptConnection(targetUser.id);
      if (!acceptRes.success) {
        setActionNotice({
          text: acceptRes.error || 'Failed to accept connection.',
          isError: true,
        });
        return;
      }

      const convRes = await startConversationWith(targetUser.id);
      if (convRes.success && convRes.conversationId) {
        onSelectStudent(targetUser);
        onClose();
      } else {
        setActionNotice({
          text:
            convRes.error ||
            `Connection accepted with ${targetUser.name}! Click Start Chat to open your conversation.`,
          isError: Boolean(convRes.error),
        });
      }
    } finally {
      busyRef.current = false;
      setBusyStudentId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">New Study Message</h2>
              <p className="text-xs text-slate-400">
                Message accepted peers at {user?.university || 'your university'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 space-y-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, major, or skills (e.g. Figma, Python)..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-slate-200/60 p-0.5 rounded-lg text-[11px] font-semibold">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1 rounded-md transition-all ${
                  filterTab === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Students ({candidateStudents.length})
              </button>
              <button
                onClick={() => setFilterTab('connected')}
                className={`px-3 py-1 rounded-md transition-all ${
                  filterTab === 'connected'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Connected Peers
              </button>
              <button
                onClick={() => setFilterTab('not_connected')}
                className={`px-3 py-1 rounded-md transition-all ${
                  filterTab === 'not_connected'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Explore & Connect
              </button>
            </div>

            <span className="text-[11px] text-slate-500 hidden sm:inline-block">
              Rule: Accepted connection required
            </span>
          </div>

          {actionNotice && (
            <div
              className={`p-2.5 rounded-xl border text-[11px] flex items-center justify-between animate-in fade-in ${
                actionNotice.isError
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {actionNotice.isError ? (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                )}
                {actionNotice.text}
              </span>
              <button
                onClick={() => setActionNotice(null)}
                className={`font-bold text-xs px-1 ${
                  actionNotice.isError
                    ? 'text-rose-700 hover:text-rose-900'
                    : 'text-emerald-700 hover:text-emerald-900'
                }`}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Student List */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-xs font-semibold">No students found matching your criteria.</p>
              <p className="text-[11px] text-slate-400 mt-1">Try searching for other skills or clearing filters.</p>
            </div>
          ) : (
            filteredStudents.map((student) => {
              const connRecord = getConnectionRecord(student.id);
              const status = connRecord ? connRecord.status : 'none';
              const isIncomingPending = status === 'pending' && connRecord?.receiverId === user?.id;
              const isSameCollege = (user?.collegeId || 'adypu') === (student.collegeId || 'adypu');
              const isBusy = busyStudentId === student.id;

              return (
                <div
                  key={student.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                >
                  {/* Student Info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {student.name}
                        </span>
                        {student.isCollegeVerified ? (
                          <span
                            title="Verified Campus Student"
                            className="inline-flex items-center gap-0.5 text-emerald-600"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                            Unverified
                          </span>
                        )}
                        {!isSameCollege && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                            {student.university}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-slate-400" />
                        {student.major} • Class of {student.graduationYear || '2026'}
                      </p>

                      {/* Skills Snippets */}
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        <span className="text-[10px] font-semibold text-slate-400">Teaches:</span>
                        {student.skillsToTeach?.slice(0, 2).map((sk, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-100"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions & Status */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {onViewProfile && (
                      <button
                        onClick={() => onViewProfile(student)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-[11px] font-semibold transition-colors"
                      >
                        Profile
                      </button>
                    )}

                    {!isSameCollege ? (
                      <div
                        title="Messaging is restricted to students at your university."
                        className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 text-[11px] font-semibold flex items-center gap-1 cursor-not-allowed"
                      >
                        <AlertCircle className="w-3 h-3" />
                        Different College
                      </div>
                    ) : status === 'accepted' ? (
                      <button
                        disabled={isBusy}
                        onClick={() => handleStartChat(student)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white text-[11px] font-bold shadow-xs transition-all flex items-center gap-1.5"
                      >
                        {isBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <MessageSquarePlus className="w-3.5 h-3.5" />
                        )}
                        {isBusy ? 'Opening...' : 'Start Chat'}
                      </button>
                    ) : status === 'pending' ? (
                      isIncomingPending ? (
                        <button
                          disabled={isBusy}
                          onClick={() => handleAcceptConnection(student)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-[11px] font-semibold transition-colors flex items-center gap-1"
                        >
                          {isBusy ? (
                            <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          )}
                          {isBusy ? 'Accepting...' : 'Accept & Message'}
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-[11px] font-medium border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Request Sent (Pending)
                        </span>
                      )
                    ) : status === 'declined' ? (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-medium border border-slate-200">
                        Request Declined
                      </span>
                    ) : (
                      <button
                        disabled={isBusy}
                        onClick={() => handleSendConnection(student)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-700 text-[11px] font-semibold transition-colors flex items-center gap-1.5"
                        title="Must be connected to chat. Click to send request."
                      >
                        {isBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                        ) : (
                          <UserPlus className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        {isBusy ? 'Sending...' : 'Connect to Message'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Policy Notice */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Safe Campus Messaging: Encrypted and limited to accepted college peers.</span>
          </span>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-semibold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
