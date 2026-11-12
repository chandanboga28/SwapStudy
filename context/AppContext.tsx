'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Skill, Session, CreditTransaction, Review, SkillSwapInvitation } from '@/types';
import { useAuth } from './AuthContext';
import {
  fetchSkills,
  fetchReviews,
  fetchUserSessions,
  fetchCreditTransactions,
  createSkillListing,
  deleteSkillListing,
  bookSessionWithEscrow,
  acceptSession as acceptSessionApi,
  declineOrCancelSession as declineSessionApi,
  completeSession as completeSessionApi,
  fetchUserSkillSwapInvitations,
  sendMutualSwapProposal,
  acceptMutualSwapProposal as acceptMutualSwapProposalApi,
  declineMutualSwapProposal as declineMutualSwapProposalApi,
  updateSessionMeetingUrlRpc,
} from '@/lib/supabase-service';
import { INITIAL_SKILLS, INITIAL_SESSIONS, INITIAL_TRANSACTIONS, INITIAL_REVIEWS } from '@/lib/mock-data';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { validateGoogleMeetUrl } from '@/lib/meeting-url';

interface AppContextType {
  skills: Skill[];
  sessions: Session[];
  transactions: CreditTransaction[];
  swapInvitations: SkillSwapInvitation[];
  reviews: Review[];
  isLoading: boolean;
  addSkill: (skillData: Omit<Skill, 'id' | 'teacherId' | 'teacherName' | 'teacherAvatar' | 'teacherUniversity' | 'teacherMajor' | 'teacherRating' | 'reviewsCount'>) => Promise<{ success: boolean; error?: string; skill?: Skill }>;
  deleteSkill: (skillId: string) => Promise<{ success: boolean; error?: string }>;
  bookSession: (params: {
    skillId: string;
    date: string;
    time: string;
    notes?: string;
  }) => Promise<{ success: boolean; error?: string; sessionId?: string }>;
  acceptSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
  updateSessionMeetingUrl: (
    sessionId: string,
    meetingUrl: string
  ) => Promise<{ success: boolean; meetingUrl?: string; error?: string }>;
  declineSession: (sessionId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  completeSession: (sessionId: string, rating: number, review: string) => Promise<{ success: boolean; error?: string }>;
  cancelSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
  sendSwapProposal: (params: {
    recipientId: string;
    offeredSkillId: string;
    offeredSkillTitle: string;
    requestedSkillId: string;
    requestedSkillTitle: string;
    credits: number;
    note?: string;
  }) => Promise<{ success: boolean; error?: string; invitationId?: string }>;
  acceptSwapProposal: (
    invitationId: string,
    session1Date: string,
    session1Time: string,
    session2Date: string,
    session2Time: string
  ) => Promise<{ success: boolean; error?: string }>;
  declineSwapProposal: (invitationId: string) => Promise<{ success: boolean; error?: string }>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, refreshUser } = useAuth();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [swapInvitations, setSwapInvitations] = useState<SkillSwapInvitation[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const inFlightOpsRef = useRef<Set<string>>(new Set());

  const withOperationLock = useCallback(
    async <T extends { success: boolean; error?: string }>(
      lockKey: string,
      busyError: string,
      fn: () => Promise<T>
    ): Promise<T | { success: false; error: string }> => {
      if (inFlightOpsRef.current.has(lockKey)) {
        return { success: false, error: busyError };
      }
      inFlightOpsRef.current.add(lockKey);
      try {
        return await fn();
      } finally {
        inFlightOpsRef.current.delete(lockKey);
      }
    },
    []
  );

  // Fetch all core app data
  const loadAppData = useCallback(async () => {
    setIsLoading(true);

    if (!isSupabaseConfigured) {
      setSkills(INITIAL_SKILLS);
      setSessions(INITIAL_SESSIONS);
      setTransactions(INITIAL_TRANSACTIONS);
      setSwapInvitations([]);
      setReviews(INITIAL_REVIEWS);
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch available skills and merge with Indian campus showcase listings
      const skillsData = await fetchSkills(user?.collegeId);
      const mergedSkills =
        skillsData && skillsData.length > 0
          ? [...skillsData, ...INITIAL_SKILLS.filter((m) => !skillsData.some((d) => d.id === m.id))]
          : INITIAL_SKILLS;
      setSkills(mergedSkills);

      // 2. If user is authenticated, fetch their sessions, transactions, reviews, and swap invitations
      if (user?.id) {
        const [sessionsData, transactionsData, invitationsData, reviewsData] = await Promise.all([
          fetchUserSessions(user.id),
          fetchCreditTransactions(user.id),
          fetchUserSkillSwapInvitations(user.id),
          fetchReviews(),
        ]);
        setSessions(sessionsData);
        setTransactions(transactionsData);
        setSwapInvitations(invitationsData);
        setReviews(reviewsData && reviewsData.length > 0 ? reviewsData : INITIAL_REVIEWS);
      } else {
        setSessions([]);
        setTransactions([]);
        setSwapInvitations([]);
        setReviews(INITIAL_REVIEWS);
      }
    } catch (err) {
      console.error('[AppProvider] Error loading app data:', err);
      setSkills((prev) => (prev.length > 0 ? prev : INITIAL_SKILLS));
      setReviews((prev) => (prev.length > 0 ? prev : INITIAL_REVIEWS));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAppData();
  }, [loadAppData]);

  // Keep participant session states and Google Meet links synced live across tabs/users
  const currentUserId = user?.id;
  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client || !currentUserId) return;

    const channel = client
      .channel(`sessions-live-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
        },
        (payload) => {
          const newRow = (payload.new || {}) as {
            id?: string;
            learner_id?: string;
            teacher_id?: string;
            meeting_url?: string | null;
            meeting_link?: string | null;
            status?: string;
          };
          const oldRow = (payload.old || {}) as {
            id?: string;
            learner_id?: string;
            teacher_id?: string;
          };

          const rowId = newRow.id || oldRow.id;
          if (!rowId) return;

          const involvesUser =
            newRow.learner_id === currentUserId ||
            newRow.teacher_id === currentUserId ||
            oldRow.learner_id === currentUserId ||
            oldRow.teacher_id === currentUserId;

          if (payload.eventType === 'INSERT') {
            if (involvesUser) {
              void loadAppData();
            }
            return;
          }

          if (payload.eventType === 'DELETE') {
            setSessions((prev) => prev.filter((s) => s.id !== rowId));
            return;
          }

          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== rowId) return s;
              const nextStatus =
                typeof newRow.status === 'string'
                  ? (newRow.status as typeof s.status)
                  : s.status;
              const nextMeetingUrl =
                typeof newRow.meeting_url === 'string'
                  ? newRow.meeting_url
                  : newRow.meeting_url === null
                  ? null
                  : s.meetingUrl;
              return {
                ...s,
                status: nextStatus,
                meetingUrl: nextMeetingUrl,
                meetingLink: newRow.meeting_link ?? s.meetingLink,
              };
            })
          );
        }
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [currentUserId, loadAppData]);

  // Add new skill listing
  const addSkill = async (
    skillData: Omit<
      Skill,
      | 'id'
      | 'teacherId'
      | 'teacherName'
      | 'teacherAvatar'
      | 'teacherUniversity'
      | 'teacherMajor'
      | 'teacherRating'
      | 'reviewsCount'
    >
  ) => {
    if (!user) return { success: false, error: 'Must be signed in to list a skill' };

    if (!isSupabaseConfigured) {
      const newSkill: Skill = {
        ...skillData,
        id: `skill-${Date.now()}`,
        teacherId: user.id,
        teacherName: user.name,
        teacherAvatar: user.avatar,
        teacherUniversity: user.university,
        teacherMajor: user.major,
        teacherRating: user.repRating || 5.0,
        reviewsCount: 0,
      };
      setSkills((prev) => [newSkill, ...prev]);
      return { success: true, skill: newSkill };
    }

    const collegeId = user.collegeId || 'adypu';
    const res = await createSkillListing(user.id, collegeId, {
      title: skillData.title,
      category: skillData.category,
      level: skillData.level,
      hourlyCredits: skillData.hourlyCredits,
      description: skillData.description,
      topics: skillData.topics,
      prerequisites: skillData.prerequisites,
      sessionDurationMinutes: skillData.sessionDurationMinutes,
    });

    if (res.success && res.skillId) {
      await loadAppData();
      await refreshUser();
      const newSkill: Skill = {
        id: res.skillId,
        teacherId: user.id,
        teacherName: user.name,
        teacherAvatar: user.avatar,
        teacherUniversity: user.university,
        teacherMajor: user.major,
        teacherRating: user.repRating || 5.0,
        reviewsCount: 0,
        title: skillData.title.trim(),
        category: skillData.category,
        level: skillData.level,
        hourlyCredits: skillData.hourlyCredits,
        description: skillData.description.trim(),
        topics: skillData.topics || [],
        prerequisites: skillData.prerequisites || [],
        sessionDurationMinutes: skillData.sessionDurationMinutes || 60,
      };
      return { success: true, skill: newSkill };
    }
    return { success: false, error: res.error || 'Failed to create skill listing in database.' };
  };

  // Delete skill listing
  const deleteSkill = async (skillId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured) {
      setSkills((prev) => prev.filter((s) => s.id !== skillId));
      return { success: true };
    }

    const res = await deleteSkillListing(skillId);
    if (res.success) {
      setSkills((prev) => prev.filter((s) => s.id !== skillId));
      await loadAppData();
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  // Book session with credit escrow (deduplicated against double-clicks & active bookings)
  const bookSession = async (params: {
    skillId: string;
    date: string;
    time: string;
    notes?: string;
  }) => {
    if (!user) return { success: false, error: 'Must be signed in to book a session' };

    const hasActiveBooking = sessions.some(
      (s) =>
        s.skillId === params.skillId &&
        s.learnerId === user.id &&
        (s.status === 'pending' || s.status === 'confirmed')
    );
    if (hasActiveBooking) {
      return { success: false, error: 'You already have an active session request for this skill.' };
    }

    return withOperationLock(
      `book:${user.id}:${params.skillId}`,
      'Booking confirmation is already in progress. Please wait.',
      async () => {
        if (!isSupabaseConfigured) {
          const targetSkill = skills.find((s) => s.id === params.skillId);
          if (!targetSkill) return { success: false, error: 'Skill not found' };

          const cost = targetSkill.hourlyCredits || 1;
          if (user.credits < cost) {
            return { success: false, error: `Insufficient credits. You need ${cost} credits.` };
          }

          const newSession: Session = {
            id: `session-${Date.now()}`,
            skillId: targetSkill.id,
            skillTitle: targetSkill.title,
            category: targetSkill.category,
            teacherId: targetSkill.teacherId,
            teacherName: targetSkill.teacherName,
            teacherAvatar: targetSkill.teacherAvatar,
            learnerId: user.id,
            learnerName: user.name,
            learnerAvatar: user.avatar,
            credits: cost,
            date: params.date,
            time: params.time,
            durationMinutes: targetSkill.sessionDurationMinutes || 60,
            status: 'pending',
            learnerNotes: params.notes,
            createdAt: new Date().toISOString(),
          };

          setSessions((prev) => [newSession, ...prev]);
          return { success: true, sessionId: newSession.id };
        }

        const res = await bookSessionWithEscrow(params);
        if (res.success) {
          await loadAppData();
          await refreshUser();
          return { success: true, sessionId: res.sessionId };
        }

        // Sync local state if the DB rejected due to an active booking or balance discrepancy
        if (
          res.error &&
          (res.error.toLowerCase().includes('active session') ||
            res.error.toLowerCase().includes('insufficient credit'))
        ) {
          await loadAppData();
          await refreshUser();
        }
        return { success: false, error: res.error };
      }
    );
  };

  // Accept session (teacher confirms booking)
  const acceptSession = async (sessionId: string) => {
    return withOperationLock(
      `session-op:${sessionId}`,
      'Session update is already in progress.',
      async () => {
        if (!isSupabaseConfigured) {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === sessionId
                ? {
                    ...s,
                    status: 'confirmed',
                    meetingLink: `https://meet.jit.si/swapstudy-${sessionId.substring(0, 8)}`,
                  }
                : s
            )
          );
          return { success: true };
        }

        const res = await acceptSessionApi(sessionId);
        if (res.success) {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === sessionId
                ? {
                    ...s,
                    status: 'confirmed',
                    meetingLink:
                      s.meetingLink || `https://meet.jit.si/swapstudy-${sessionId.substring(0, 8)}`,
                  }
                : s
            )
          );
          await loadAppData();
          return { success: true };
        }
        return { success: false, error: res.error };
      }
    );
  };

  // Decline session (escrow refund)
  const declineSession = async (sessionId: string, reason?: string) => {
    return withOperationLock(
      `session-op:${sessionId}`,
      'Session update is already in progress.',
      async () => {
        if (!isSupabaseConfigured) {
          setSessions((prev) =>
            prev.map((s) => (s.id === sessionId ? { ...s, status: 'declined' } : s))
          );
          return { success: true };
        }

        const res = await declineSessionApi(sessionId, reason);
        if (res.success) {
          setSessions((prev) =>
            prev.map((s) => (s.id === sessionId ? { ...s, status: 'declined' } : s))
          );
          await loadAppData();
          await refreshUser();
          return { success: true };
        }
        return { success: false, error: res.error };
      }
    );
  };

  // Cancel session (escrow refund)
  const cancelSession = async (sessionId: string) => {
    return withOperationLock(
      `session-op:${sessionId}`,
      'Session cancellation is already in progress.',
      async () => {
        if (!isSupabaseConfigured) {
          setSessions((prev) =>
            prev.map((s) => (s.id === sessionId ? { ...s, status: 'cancelled' } : s))
          );
          return { success: true };
        }

        const res = await declineSessionApi(sessionId, 'Cancelled by learner');
        if (res.success) {
          setSessions((prev) =>
            prev.map((s) => (s.id === sessionId ? { ...s, status: 'cancelled' } : s))
          );
          await loadAppData();
          await refreshUser();
          return { success: true };
        }
        return { success: false, error: res.error };
      }
    );
  };

  // Complete session (escrow settlement + review creation)
  const completeSession = async (
    sessionId: string,
    rating: number,
    reviewText: string
  ) => {
    return withOperationLock(
      `session-op:${sessionId}`,
      'Session completion is already in progress.',
      async () => {
        if (!isSupabaseConfigured) {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === sessionId
                ? {
                    ...s,
                    status: 'completed',
                    completedAt: new Date().toISOString(),
                    ratingGiven: rating,
                    reviewGiven: reviewText,
                  }
                : s
            )
          );
          return { success: true };
        }

        const res = await completeSessionApi(sessionId, rating, reviewText);
        if (res.success) {
          await loadAppData();
          await refreshUser();
          return { success: true };
        }
        return { success: false, error: res.error };
      }
    );
  };

  // Send mutual skill swap proposal
  const sendSwapProposal = async (params: {
    recipientId: string;
    offeredSkillId: string;
    offeredSkillTitle: string;
    requestedSkillId: string;
    requestedSkillTitle: string;
    credits: number;
    note?: string;
  }) => {
    if (!user) return { success: false, error: 'Must be logged in to propose a swap' };

    return withOperationLock(
      `swap-send:${user.id}:${params.recipientId}:${params.offeredSkillId}:${params.requestedSkillId}`,
      'Swap proposal submission is already in progress.',
      async () => {
        const res = await sendMutualSwapProposal(params);
        if (res.success) {
          if (isSupabaseConfigured) {
            const updated = await fetchUserSkillSwapInvitations(user.id);
            setSwapInvitations(updated);
          }
          return { success: true, invitationId: res.invitationId };
        }
        return { success: false, error: res.error };
      }
    );
  };

  // Accept mutual skill swap proposal
  const acceptSwapProposal = async (
    invitationId: string,
    session1Date: string,
    session1Time: string,
    session2Date: string,
    session2Time: string
  ) => {
    if (!user) return { success: false, error: 'Must be logged in to accept swap proposal' };

    return withOperationLock(
      `swap-respond:${invitationId}`,
      'Swap confirmation is already in progress.',
      async () => {
        const res = await acceptMutualSwapProposalApi(
          invitationId,
          session1Date,
          session1Time,
          session2Date,
          session2Time
        );
        if (res.success) {
          await loadAppData();
          await refreshUser();
          return { success: true };
        }
        return { success: false, error: res.error };
      }
    );
  };

  // Decline mutual skill swap proposal
  const declineSwapProposal = async (invitationId: string) => {
    if (!user) return { success: false, error: 'Must be logged in to decline swap proposal' };

    return withOperationLock(
      `swap-respond:${invitationId}`,
      'Swap update is already in progress.',
      async () => {
        const res = await declineMutualSwapProposalApi(invitationId);
        if (res.success) {
          await loadAppData();
          return { success: true };
        }
        return { success: false, error: res.error };
      }
    );
  };

  // Add or update Google Meet URL for a confirmed session (assigned teacher only)
  const updateSessionMeetingUrl = async (sessionId: string, meetingUrl: string) => {
    if (!user) {
      return { success: false, error: 'Must be logged in to update a meeting link.' };
    }

    const validation = validateGoogleMeetUrl(meetingUrl);
    if (!validation.valid || !validation.normalizedUrl) {
      return { success: false, error: validation.error || 'Invalid Google Meet link.' };
    }
    const normalizedUrl = validation.normalizedUrl;

    const targetSession = sessions.find((s) => s.id === sessionId);
    if (!targetSession) {
      return { success: false, error: 'Session not found.' };
    }
    if (targetSession.teacherId !== user.id) {
      return { success: false, error: 'Only the assigned teacher can update the meeting link.' };
    }
    if (targetSession.status !== 'confirmed') {
      return {
        success: false,
        error: 'Meeting links can only be added or updated while the session is confirmed.',
      };
    }

    return withOperationLock(
      `meeting-url:${sessionId}`,
      'Meeting link update is already in progress.',
      async () => {
        if (!isSupabaseConfigured) {
          setSessions((prev) =>
            prev.map((s) => (s.id === sessionId ? { ...s, meetingUrl: normalizedUrl } : s))
          );
          return { success: true, meetingUrl: normalizedUrl };
        }

        const res = await updateSessionMeetingUrlRpc(sessionId, normalizedUrl);
        if (res.success) {
          const savedUrl = res.meetingUrl || normalizedUrl;
          setSessions((prev) =>
            prev.map((s) => (s.id === sessionId ? { ...s, meetingUrl: savedUrl } : s))
          );
          return { success: true, meetingUrl: savedUrl };
        }
        return { success: false, error: res.error };
      }
    );
  };

  return (
    <AppContext.Provider
      value={{
        skills,
        sessions,
        transactions,
        swapInvitations,
        reviews,
        isLoading,
        addSkill,
        deleteSkill,
        bookSession,
        acceptSession,
        declineSession,
        completeSession,
        cancelSession,
        sendSwapProposal,
        acceptSwapProposal,
        declineSwapProposal,
        updateSessionMeetingUrl,
        refreshData: loadAppData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
