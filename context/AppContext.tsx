'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Skill, Session, CreditTransaction, Review } from '@/types';
import { useAuth } from './AuthContext';
import {
  fetchSkills,
  fetchUserSessions,
  fetchCreditTransactions,
  createSkillListing,
  bookSessionWithEscrow,
  acceptSession as acceptSessionApi,
  declineOrCancelSession as declineSessionApi,
  completeSession as completeSessionApi,
} from '@/lib/supabase-service';
import { INITIAL_SKILLS, INITIAL_SESSIONS, INITIAL_TRANSACTIONS, INITIAL_REVIEWS } from '@/lib/mock-data';
import { isSupabaseConfigured } from '@/lib/supabase';

interface AppContextType {
  skills: Skill[];
  sessions: Session[];
  transactions: CreditTransaction[];
  reviews: Review[];
  isLoading: boolean;
  addSkill: (skillData: Omit<Skill, 'id' | 'teacherId' | 'teacherName' | 'teacherAvatar' | 'teacherUniversity' | 'teacherMajor' | 'teacherRating' | 'reviewsCount'>) => Promise<{ success: boolean; error?: string; skill?: Skill }>;
  bookSession: (params: {
    skillId: string;
    date: string;
    time: string;
    notes?: string;
  }) => Promise<{ success: boolean; error?: string; sessionId?: string }>;
  acceptSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
  declineSession: (sessionId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  completeSession: (sessionId: string, rating: number, review: string) => Promise<{ success: boolean; error?: string }>;
  cancelSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, refreshUser } = useAuth();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all core app data
  const loadAppData = useCallback(async () => {
    setIsLoading(true);

    if (!isSupabaseConfigured) {
      setSkills(INITIAL_SKILLS);
      setSessions(INITIAL_SESSIONS);
      setTransactions(INITIAL_TRANSACTIONS);
      setReviews(INITIAL_REVIEWS);
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch available skills for the college
      const skillsData = await fetchSkills(user?.collegeId);
      setSkills(skillsData);

      // 2. If user is authenticated, fetch their sessions and transactions
      if (user?.id) {
        const [sessionsData, transactionsData] = await Promise.all([
          fetchUserSessions(user.id),
          fetchCreditTransactions(user.id),
        ]);
        setSessions(sessionsData);
        setTransactions(transactionsData);
      } else {
        setSessions([]);
        setTransactions([]);
      }
    } catch (err) {
      console.error('[AppProvider] Error loading app data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAppData();
  }, [loadAppData]);

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

    if (res.success) {
      await loadAppData();
      await refreshUser();
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  // Book session with credit escrow
  const bookSession = async (params: {
    skillId: string;
    date: string;
    time: string;
    notes?: string;
  }) => {
    if (!user) return { success: false, error: 'Must be signed in to book a session' };

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
    return { success: false, error: res.error };
  };

  // Accept session (teacher confirms booking)
  const acceptSession = async (sessionId: string) => {
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
      await loadAppData();
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  // Decline session (escrow refund)
  const declineSession = async (sessionId: string, reason?: string) => {
    if (!isSupabaseConfigured) {
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, status: 'declined' } : s))
      );
      return { success: true };
    }

    const res = await declineSessionApi(sessionId, reason);
    if (res.success) {
      await loadAppData();
      await refreshUser();
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  // Cancel session (escrow refund)
  const cancelSession = async (sessionId: string) => {
    if (!isSupabaseConfigured) {
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, status: 'cancelled' } : s))
      );
      return { success: true };
    }

    const res = await declineSessionApi(sessionId, 'Cancelled by learner');
    if (res.success) {
      await loadAppData();
      await refreshUser();
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  // Complete session (escrow settlement + review creation)
  const completeSession = async (
    sessionId: string,
    rating: number,
    reviewText: string
  ) => {
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
  };

  return (
    <AppContext.Provider
      value={{
        skills,
        sessions,
        transactions,
        reviews,
        isLoading,
        addSkill,
        bookSession,
        acceptSession,
        declineSession,
        completeSession,
        cancelSession,
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
