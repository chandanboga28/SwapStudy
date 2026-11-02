'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';
import { INITIAL_USERS } from '@/lib/mock-data';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchDemoUser: (userId: string) => void;
  updateUser: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'swapstudy_current_user_id';
const USERS_STORAGE_KEY = 'swapstudy_users_list';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>(INITIAL_USERS);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize users and session on mount
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      let usersList = INITIAL_USERS;
      if (storedUsers) {
        usersList = JSON.parse(storedUsers);
      } else {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      }
      setAllUsers(usersList);

      const storedUserId = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUserId) {
        const found = usersList.find((u) => u.id === storedUserId);
        if (found) {
          setUser(found);
        } else {
          // Default to Chandan
          setUser(usersList[0]);
          localStorage.setItem(AUTH_STORAGE_KEY, usersList[0].id);
        }
      } else {
        // Default to Chandan for instant demo exploration
        setUser(usersList[0]);
        localStorage.setItem(AUTH_STORAGE_KEY, usersList[0].id);
      }
    } catch (err) {
      console.warn('Failed to load user state from localStorage:', err);
      setUser(INITIAL_USERS[0]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveUsersList = (updatedUsers: User[]) => {
    setAllUsers(updatedUsers);
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    } catch (e) {
      console.error('Error saving users to localStorage', e);
    }
  };

  const login = async (email: string, password?: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: password || 'demo123456',
        });
        if (error) {
          return { success: false, error: error.message };
        }
        // In real supabase, we would fetch or create their public.users profile
        const matched = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
        const loggedUser = matched || {
          id: data.user.id,
          name: data.user.user_metadata?.name || email.split('@')[0],
          email: data.user.email || email,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
          university: 'University Student',
          major: 'General Studies',
          graduationYear: '2026',
          bio: 'Passionate student learning and teaching on SwapStudy.',
          credits: 3,
          repRating: 5.0,
          totalHoursTaught: 0,
          totalHoursLearned: 0,
          skillsToTeach: [],
          skillsToLearn: [],
          createdAt: new Date().toISOString().split('T')[0],
        };
        setUser(loggedUser);
        localStorage.setItem(AUTH_STORAGE_KEY, loggedUser.id);
        return { success: true };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message || 'Authentication failed' };
      }
    }

    // Demo Mode fallback
    const matched = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      setUser(matched);
      localStorage.setItem(AUTH_STORAGE_KEY, matched.id);
      return { success: true };
    }

    // If not found in demo mode, create student profile dynamically
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: email.split('@')[0].replace('.', ' '),
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
      university: 'State University',
      major: 'Computer Science',
      graduationYear: '2026',
      bio: 'New student on SwapStudy excited to teach and learn!',
      credits: 3,
      repRating: 5.0,
      totalHoursTaught: 0,
      totalHoursLearned: 0,
      skillsToTeach: ['Intro to Coding'],
      skillsToLearn: ['UI/UX Design'],
      createdAt: new Date().toISOString().split('T')[0],
      isDemo: true,
    };
    const updated = [...allUsers, newUser];
    saveUsersList(updated);
    setUser(newUser);
    localStorage.setItem(AUTH_STORAGE_KEY, newUser.id);
    return { success: true };
  };

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
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password || 'demo123456',
          options: {
            data: {
              name: userData.name,
              university: userData.university,
              major: userData.major,
            },
          },
        });
        if (error) return { success: false, error: error.message };

        const newUser: User = {
          id: data.user?.id || `user-${Date.now()}`,
          name: userData.name,
          email: userData.email,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.name)}`,
          university: userData.university,
          major: userData.major,
          graduationYear: userData.graduationYear || '2026',
          bio: `Student at ${userData.university} studying ${userData.major}.`,
          credits: 3, // Starter bonus
          repRating: 5.0,
          totalHoursTaught: 0,
          totalHoursLearned: 0,
          skillsToTeach: userData.skillsToTeach,
          skillsToLearn: userData.skillsToLearn,
          createdAt: new Date().toISOString().split('T')[0],
        };
        const updated = [...allUsers, newUser];
        saveUsersList(updated);
        setUser(newUser);
        localStorage.setItem(AUTH_STORAGE_KEY, newUser.id);
        return { success: true };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message || 'Signup failed' };
      }
    }

    // Demo Mode signup
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.name)}`,
      university: userData.university,
      major: userData.major,
      graduationYear: userData.graduationYear || '2026',
      bio: `Student at ${userData.university} studying ${userData.major}.`,
      credits: 3, // 3 free starter credits!
      repRating: 5.0,
      totalHoursTaught: 0,
      totalHoursLearned: 0,
      skillsToTeach: userData.skillsToTeach,
      skillsToLearn: userData.skillsToLearn,
      createdAt: new Date().toISOString().split('T')[0],
      isDemo: true,
    };
    const updated = [...allUsers, newUser];
    saveUsersList(updated);
    setUser(newUser);
    localStorage.setItem(AUTH_STORAGE_KEY, newUser.id);
    return { success: true };
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const switchDemoUser = (userId: string) => {
    const selected = allUsers.find((u) => u.id === userId);
    if (selected) {
      setUser(selected);
      localStorage.setItem(AUTH_STORAGE_KEY, selected.id);
    }
  };

  const updateUser = (updatedData: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    const updatedList = allUsers.map((u) => (u.id === user.id ? updatedUser : u));
    saveUsersList(updatedList);
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
