'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCommunity } from '@/context/CommunityContext';
import { useMessaging } from '@/context/MessagingContext';
import {
  X,
  Search,
  MessageSquare,
  UserPlus,
  Check,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface NewConversationModalProps {
  onClose: () => void;
  onConversationStarted: (conversationId: string) => void;
}

export default function NewConversationModal({
  onClose,
  onConversationStarted,
}: NewConversationModalProps) {
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
  const [filterMode, setFilterMode] = useState<'all' | 'connected' | 'not_connected'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const filteredStudents = useMemo(() => {
    return sameCollegeStudents
      .filter((s) => s.id !== user?.id)
      .filter((student) => {
        const status = getConnectionStatus(student.id);
        if (filterMode === 'connected' && status !== 'accepted') return false;
        if (filterMode === 'not_connected' && status === 'accepted') return false;

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
  }, [sameCollegeStudents, user?.id, getConnectionStatus, filterMode, query]);

  const handleStartChat = async (studentId: string) => {
    if (busyId) return;
    setErrorMsg('');
    setBusyId(`chat-${studentId}`);
    try {
      const res = await startConversationWith(studentId);
      if (!res.success || !res.conversationId) {
        setErrorMsg(res.error || 'Could not start conversation.');
        return;
      }
      onConversationStarted(res.conversationId);
      onClose();
    } finally {
      setBusyId(null);
    }
  };

  const handleConnect = async (studentId: string, isIncoming: boolean) => {
    if (busyId) return;
    setErrorMsg('');
    setBusyId(`conn-${studentId}`);
    try {
      const res = isIncoming
        ? await acceptConnection(studentId)
        : await sendConnectionRequest(studentId);
      if (!res.success) {
        setErrorMsg(res.error || 'Could not update peer connection.');
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#22211F] border border-[#37332E] rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        <div className="px-6 py-5 border-b border-[#37332E] bg-[#1B1A18] flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-[#F7F5F0]">Start New Conversation</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#AAA69F] hover:text-[#F7F5F0] hover:bg-[#2B2824] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 border-b border-[#37332E] space-y-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-[#AAA69F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search peers by name, major, or skill..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#171715] border border-[#37332E] focus:border-[#FF9B45] text-sm text-[#F7F5F0] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            {[
              { key: 'all', label: 'All Peers' },
              { key: 'connected', label: 'Connected' },
              { key: 'not_connected', label: 'New Peers' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() =>
                  setFilterMode(tab.key as 'all' | 'connected' | 'not_connected')
                }
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  filterMode === tab.key
                    ? 'bg-[#FF9B45] text-[#171715]'
                    : 'bg-[#171715] border border-[#37332E] text-[#AAA69F]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-[#F07878]/10 border border-[#F07878]/30 text-xs text-[#F07878]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredStudents.length === 0 ? (
            <p className="text-center text-sm text-[#AAA69F] py-8">
              No peers matched your search.
            </p>
          ) : (
            filteredStudents.map((student) => {
              const status = getConnectionStatus(student.id);
              const rec = getConnectionRecord(student.id);
              const isIncoming = status === 'pending' && rec?.receiverId === user?.id;

              return (
                <div
                  key={student.id}
                  className="bg-[#2B2824] border border-[#37332E] rounded-xl p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-10 h-10 rounded-full object-cover border border-[#37332E] bg-[#171715] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#F7F5F0] truncate">
                        {student.name}
                      </p>
                      <p className="text-xs text-[#AAA69F] truncate">
                        {student.major || student.university}
                      </p>
                    </div>
                  </div>

                  {status === 'accepted' ? (
                    <button
                      type="button"
                      disabled={busyId === `chat-${student.id}`}
                      onClick={() => handleStartChat(student.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] text-xs font-bold shrink-0 cursor-pointer"
                    >
                      {busyId === `chat-${student.id}` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <MessageSquare className="w-3.5 h-3.5" />
                      )}
                      Message
                    </button>
                  ) : status === 'pending' && !isIncoming ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#171715] border border-[#37332E] text-xs font-semibold text-[#F5B66B] shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      Pending
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === `conn-${student.id}`}
                      onClick={() => handleConnect(student.id, isIncoming)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#171715] hover:bg-[#37332E] border border-[#37332E] text-xs font-bold text-[#F7F5F0] shrink-0 cursor-pointer"
                    >
                      {busyId === `conn-${student.id}` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isIncoming ? (
                        <Check className="w-3.5 h-3.5 text-[#65C995]" />
                      ) : (
                        <UserPlus className="w-3.5 h-3.5 text-[#FF9B45]" />
                      )}
                      {isIncoming ? 'Accept' : 'Connect'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
