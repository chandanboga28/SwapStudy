'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  fetchUserProfile,
  fetchCollegePeers,
  updateUserProfile,
  submitCollegeVerification,
  createSkillListing,
} from '@/lib/supabase-service';
import { INITIAL_USERS } from '@/lib/mock-data';

interface AuthContextType {
  user: User | null;
  allUsers: User[];
  isLoading: boolean;
  isDemoMode: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: {
    name: string;
    email: string;
    password?: string;
    university: string;
    major: string;
    graduationYear?: string;
    skillsToTeach: string[];
    skillsToLearn: string[];
  }) => Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean }>;
  logout: () => Promise<void>;
  switchDemoUser: (userId: string) => void;
  updateUser: (updatedData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  submitVerification: (
    collegeId: string,
    institutionalEmail: string,
    studentIdNumber?: string,
    documentUrl?: string
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to load profile and college peers
  const loadUserData = useCallback(async (userId: string) => {
    try {
      const profile = await fetchUserProfile(userId);
      if (profile) {
        setUser(profile);
        const peers = await fetchCollegePeers(profile.collegeId);
        // Exclude current user from peers list for discovery/matching
        setAllUsers(peers.filter((p) => p.id !== profile.id));
      } else {
        // Fallback if profile row is not yet found
        setUser(null);
        setAllUsers([]);
      }
    } catch (err) {
      console.error('[AuthProvider] Failed to load user profile:', err);
    }
  }, []);

  // Listen to Supabase Auth state changes & persistent sessions
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // Local development without Supabase credentials
      setUser(INITIAL_USERS[0]);
      setAllUsers(INITIAL_USERS.slice(1));
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // Check active session on mount
    supabase.auth
      .getSession()
      .then(async ({ data: { session }, error }) => {
        if (!isMounted) return;
        if (error) {
          console.warn('[AuthProvider] getSession error:', error.message);
          setUser(null);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          await loadUserData(session.user.id);
        } else {
          setUser(null);
          setAllUsers([]);
        }
        if (isMounted) setIsLoading(false);
      })
      .catch((err) => {
        console.error('[AuthProvider] Session initialization error:', err);
        if (isMounted) setIsLoading(false);
      });

    // Listen to auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        setAllUsers([]);
        setIsLoading(false);
      } else if (session?.user) {
        await loadUserData(session.user.id);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  // Login handler
  const login = async (email: string, password?: string) => {
    if (!isSupabaseConfigured || !supabase) {
      const found = INITIAL_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (found) {
        setUser(found);
        setAllUsers(INITIAL_USERS.filter((u) => u.id !== found.id));
        return { success: true };
      }
      return { success: false, error: 'User not found in demo list' };
    }

    if (!password) {
      return { success: false, error: 'Please enter your password.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.user) {
        await loadUserData(data.user.id);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Authentication failed' };
    }
  };

  // Signup handler
  const signup = async (userData: {
    name: string;
    email: string;
    password?: string;
    university: string;
    major: string;
    graduationYear?: string;
    skillsToTeach: string[];
    skillsToLearn: string[];
  }) => {
    if (!isSupabaseConfigured || !supabase) {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: userData.name,
        email: userData.email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.name)}`,
        university: userData.university,
        major: userData.major,
        graduationYear: userData.graduationYear || '2026',
        bio: `Student at ${userData.university} studying ${userData.major}.`,
        credits: 3,
        repRating: 5.0,
        totalHoursTaught: 0,
        totalHoursLearned: 0,
        skillsToTeach: userData.skillsToTeach,
        skillsToLearn: userData.skillsToLearn,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setUser(newUser);
      return { success: true };
    }

    if (!userData.password || userData.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    try {
      const emailRedirectTo =
        typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined;

      const { data, error } = await supabase.auth.signUp({
        email: userData.email.trim(),
        password: userData.password,
        options: {
          emailRedirectTo,
          data: {
            name: userData.name.trim(),
            university: userData.university.trim(),
            major: userData.major.trim(),
            graduation_year: userData.graduationYear || '2026',
            graduationYear: userData.graduationYear || '2026',
            skillsToTeach: userData.skillsToTeach,
            skillsToLearn: userData.skillsToLearn,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const newUserId = data.user?.id;
      if (newUserId && data.session) {
        // Wait briefly for handle_new_auth_user trigger to populate profiles & wallets
        await new Promise((r) => setTimeout(r, 600));

        // Update profile with skills
        await updateUserProfile(newUserId, {
          skillsToTeach: userData.skillsToTeach,
          skillsToLearn: userData.skillsToLearn,
          graduationYear: userData.graduationYear || '2026',
        });

        const freshProfile = await fetchUserProfile(newUserId);

        // Insert first skill to teach into public.skills listing only when verified at a college
        const firstSkill = userData.skillsToTeach[0]?.trim();
        const isPlaceholder =
          !firstSkill ||
          firstSkill.length < 3 ||
          ['na', 'n/a', 'none', 'nil'].includes(firstSkill.toLowerCase());

        if (
          freshProfile?.collegeId &&
          freshProfile?.isCollegeVerified &&
          userData.skillsToTeach.length > 0 &&
          !isPlaceholder
        ) {
          await createSkillListing(newUserId, freshProfile.collegeId, {
            title: firstSkill,
            category: 'Programming & Tech',
            level: 'All Levels',
            hourlyCredits: 1,
            description: `Peer learning session on ${firstSkill} offered by ${userData.name.trim()}.`,
          });
        }

        await loadUserData(newUserId);
      }

      return {
        success: true,
        needsEmailConfirmation: !data.session,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Signup failed' };
    }
  };

  // Logout handler
  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[AuthProvider] SignOut error:', err);
      }
    }
    setUser(null);
    setAllUsers([]);
  };

  // Profile updates
  const updateUser = async (updatedData: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'You must be signed in to update your profile.' };

    if (isSupabaseConfigured && supabase) {
      const res = await updateUserProfile(user.id, updatedData);
      if (!res.success) {
        return { success: false, error: res.error || 'Failed to update profile.' };
      }
    }

    setUser({ ...user, ...updatedData });
    return { success: true };
  };

  // Refresh profile and balance
  const refreshUser = async () => {
    if (user?.id) {
      await loadUserData(user.id);
    }
  };

  // College verification submission
  const submitVerification = async (
    collegeId: string,
    institutionalEmail: string,
    studentIdNumber?: string,
    documentUrl?: string
  ) => {
    const res = await submitCollegeVerification(
      collegeId,
      institutionalEmail,
      studentIdNumber,
      documentUrl
    );
    if (res.success) {
      await refreshUser();
    }
    return res;
  };

  // Demo user switcher (only active when Supabase is not configured)
  const switchDemoUser = (userId: string) => {
    if (isSupabaseConfigured) return;
    const selected = allUsers.find((u) => u.id === userId);
    if (selected) {
      setUser(selected);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        allUsers,
        isLoading,
        isDemoMode: !isSupabaseConfigured,
        login,
        signup,
        logout,
        switchDemoUser,
        updateUser,
        refreshUser,
        submitVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
