'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Skill, Session, CreditTransaction, Review } from '@/types';
import {
  INITIAL_SKILLS,
  INITIAL_SESSIONS,
  INITIAL_TRANSACTIONS,
  INITIAL_REVIEWS,
} from '@/lib/mock-data';
import { useAuth } from './AuthContext';

interface AppContextType {
  skills: Skill[];
  sessions: Session[];
  transactions: CreditTransaction[];
  reviews: Review[];
  addSkill: (skillData: Omit<Skill, 'id' | 'teacherId' | 'teacherName' | 'teacherAvatar' | 'teacherUniversity' | 'teacherMajor' | 'teacherRating' | 'reviewsCount'>) => { success: boolean; error?: string; skill?: Skill };
  bookSession: (params: {
    skillId: string;
    date: string;
    time: string;
    notes?: string;
  }) => { success: boolean; error?: string; session?: Session };
  acceptSession: (sessionId: string) => { success: boolean; error?: string };
  declineSession: (sessionId: string, reason?: string) => { success: boolean; error?: string };
  completeSession: (sessionId: string, rating: number, review: string) => { success: boolean; error?: string };
  cancelSession: (sessionId: string) => { success: boolean; error?: string };
  resetToDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SKILLS_KEY = 'swapstudy_skills_data';
const SESSIONS_KEY = 'swapstudy_sessions_data';
const TRANSACTIONS_KEY = 'swapstudy_transactions_data';
const REVIEWS_KEY = 'swapstudy_reviews_data';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, updateUser } = useAuth();

  const [skills, setSkills] = useState<Skill[]>(INITIAL_SKILLS);
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [transactions, setTransactions] = useState<CreditTransaction[]>(INITIAL_TRANSACTIONS);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from LocalStorage
  useEffect(() => {
    try {
      const storedSkills = localStorage.getItem(SKILLS_KEY);
      if (storedSkills) setSkills(JSON.parse(storedSkills));

      const storedSessions = localStorage.getItem(SESSIONS_KEY);
      if (storedSessions) setSessions(JSON.parse(storedSessions));

      const storedTransactions = localStorage.getItem(TRANSACTIONS_KEY);
      if (storedTransactions) setTransactions(JSON.parse(storedTransactions));

      const storedReviews = localStorage.getItem(REVIEWS_KEY);
      if (storedReviews) setReviews(JSON.parse(storedReviews));
    } catch (e) {
      console.warn('Failed to parse local storage in AppContext', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to LocalStorage whenever state changes after initial load
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(SKILLS_KEY, JSON.stringify(skills));
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
    } catch (e) {
      console.error('Failed to sync to local storage', e);
    }
  }, [skills, sessions, transactions, reviews, isLoaded]);

  const addSkill = (skillData: Omit<Skill, 'id' | 'teacherId' | 'teacherName' | 'teacherAvatar' | 'teacherUniversity' | 'teacherMajor' | 'teacherRating' | 'reviewsCount'>) => {
    if (!user) return { success: false, error: 'Must be signed in to list a skill' };

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

    // Update user skills to teach
    if (!user.skillsToTeach.includes(newSkill.title)) {
      updateUser({
        skillsToTeach: [...user.skillsToTeach, newSkill.title],
      });
    }

    return { success: true, skill: newSkill };
  };

  const bookSession = ({
    skillId,
    date,
    time,
    notes,
  }: {
    skillId: string;
    date: string;
    time: string;
    notes?: string;
  }) => {
    if (!user) return { success: false, error: 'Please log in to book a session.' };

    const targetSkill = skills.find((s) => s.id === skillId);
    if (!targetSkill) return { success: false, error: 'Skill not found.' };

    if (targetSkill.teacherId === user.id) {
      return { success: false, error: 'You cannot book a session with yourself!' };
    }

    const cost = targetSkill.hourlyCredits;
    if (user.credits < cost) {
      return {
        success: false,
        error: `Insufficient credits. This session costs ${cost} credits, but you currently have ${user.credits} credits. Teach a skill to earn more!`,
      };
    }

    // Deduct credits from learner immediately as escrow
    const newCreditBalance = user.credits - cost;
    updateUser({ credits: newCreditBalance });

    // Create session record
    const newSession: Session = {
      id: `sess-${Date.now()}`,
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
      date,
      time,
      durationMinutes: targetSkill.sessionDurationMinutes || 60,
      status: 'pending',
      learnerNotes: notes || '',
      createdAt: new Date().toISOString().split('T')[0],
      meetingLink: `https://meet.swapstudy.org/room/${targetSkill.id}-${Date.now().toString().slice(-4)}`,
    };

    setSessions((prev) => [newSession, ...prev]);

    // Add debit transaction to learner
    const newTx: CreditTransaction = {
      id: `tx-${Date.now()}`,
      userId: user.id,
      amount: -cost,
      type: 'spent_learning',
      title: `Booked: ${targetSkill.title}`,
      description: `1-on-1 session with ${targetSkill.teacherName}`,
      date: new Date().toISOString().split('T')[0],
      sessionId: newSession.id,
    };

    setTransactions((prev) => [newTx, ...prev]);

    return { success: true, session: newSession };
  };

  const acceptSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return { success: false, error: 'Session not found' };

    const updated = sessions.map((s) =>
      s.id === sessionId ? { ...s, status: 'confirmed' as const } : s
    );
    setSessions(updated);
    return { success: true };
  };

  const declineSession = (sessionId: string, reason?: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return { success: false, error: 'Session not found' };

    // Refund credits to learner
    if (session.status !== 'declined' && session.status !== 'cancelled') {
      const refundTx: CreditTransaction = {
        id: `tx-ref-${Date.now()}`,
        userId: session.learnerId,
        amount: session.credits,
        type: 'refund',
        title: `Refund: ${session.skillTitle}`,
        description: `Session was declined. ${reason ? `Reason: ${reason}` : ''}`,
        date: new Date().toISOString().split('T')[0],
        sessionId: session.id,
      };
      setTransactions((prev) => [refundTx, ...prev]);

      // If current user is the learner, update their state
      if (user && user.id === session.learnerId) {
        updateUser({ credits: user.credits + session.credits });
      }
    }

    const updated = sessions.map((s) =>
      s.id === sessionId
        ? {
            ...s,
            status: 'declined' as const,
            teacherNotes: reason || 'Teacher was unavailable for this time slot.',
          }
        : s
    );
    setSessions(updated);
    return { success: true };
  };

  const cancelSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return { success: false, error: 'Session not found' };

    // Refund credits to learner
    const refundTx: CreditTransaction = {
      id: `tx-cancel-${Date.now()}`,
      userId: session.learnerId,
      amount: session.credits,
      type: 'refund',
      title: `Refund: Cancelled ${session.skillTitle}`,
      description: 'Session was cancelled before completion.',
      date: new Date().toISOString().split('T')[0],
      sessionId: session.id,
    };
    setTransactions((prev) => [refundTx, ...prev]);

    if (user && user.id === session.learnerId) {
      updateUser({ credits: user.credits + session.credits });
    }

    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: 'cancelled' as const } : s))
    );
    return { success: true };
  };

  const completeSession = (sessionId: string, rating: number, review: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return { success: false, error: 'Session not found' };

    // Transfer credits to teacher
    const teacherTx: CreditTransaction = {
      id: `tx-earn-${Date.now()}`,
      userId: session.teacherId,
      amount: session.credits,
      type: 'earned_teaching',
      title: `Taught: ${session.skillTitle}`,
      description: `Session completed with ${session.learnerName}`,
      date: new Date().toISOString().split('T')[0],
      sessionId: session.id,
    };
    setTransactions((prev) => [teacherTx, ...prev]);

    // If active user is teacher, give credits
    if (user && user.id === session.teacherId) {
      updateUser({
        credits: user.credits + session.credits,
        totalHoursTaught: user.totalHoursTaught + 1,
      });
    }

    // If active user is learner, update hours learned
    if (user && user.id === session.learnerId) {
      updateUser({
        totalHoursLearned: user.totalHoursLearned + 1,
      });
    }

    // Add review
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      reviewerId: session.learnerId,
      reviewerName: session.learnerName,
      reviewerAvatar: session.learnerAvatar,
      rating,
      comment: review,
      date: 'Just now',
      skillTitle: session.skillTitle,
    };
    setReviews((prev) => [newReview, ...prev]);

    // Update skill review count
    setSkills((prev) =>
      prev.map((sk) => {
        if (sk.id === session.skillId) {
          const newCount = sk.reviewsCount + 1;
          const newRating = Number(((sk.teacherRating * sk.reviewsCount + rating) / newCount).toFixed(1));
          return {
            ...sk,
            reviewsCount: newCount,
            teacherRating: newRating,
          };
        }
        return sk;
      })
    );

    // Update session status
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              status: 'completed' as const,
              completedAt: new Date().toISOString(),
              ratingGiven: rating,
              reviewGiven: review,
            }
          : s
      )
    );

    return { success: true };
  };

  const resetToDefaults = () => {
    setSkills(INITIAL_SKILLS);
    setSessions(INITIAL_SESSIONS);
    setTransactions(INITIAL_TRANSACTIONS);
    setReviews(INITIAL_REVIEWS);
    localStorage.removeItem(SKILLS_KEY);
    localStorage.removeItem(SESSIONS_KEY);
    localStorage.removeItem(TRANSACTIONS_KEY);
    localStorage.removeItem(REVIEWS_KEY);
  };

  return (
    <AppContext.Provider
      value={{
        skills,
        sessions,
        transactions,
        reviews,
        addSkill,
        bookSession,
        acceptSession,
        declineSession,
        completeSession,
        cancelSession,
        resetToDefaults,
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
