'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  College,
  CommunityPost,
  LearningGroup,
  StudentConnection,
  PostCategory,
  User,
} from '@/types';
import { COLLEGES, INITIAL_POSTS, INITIAL_GROUPS, INITIAL_CONNECTIONS } from '@/lib/mock-community-data';
import { useAuth } from './AuthContext';
import {
  fetchColleges,
  fetchCommunityPosts,
  createCommunityPost,
  togglePostLike,
  addPostComment,
  togglePostBookmark,
  fetchLearningGroups,
  createLearningGroup,
  joinLearningGroup,
  leaveLearningGroup,
  fetchStudentConnections,
  sendConnectionRequest as sendConnRequestDb,
  respondToConnectionRequest as respondConnRequestDb,
} from '@/lib/supabase-service';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface CommunityContextType {
  currentCollege: College;
  allColleges: College[];
  posts: CommunityPost[];
  groups: LearningGroup[];
  connections: StudentConnection[];
  sameCollegeStudents: User[];
  savedPostIds: string[];
  createPost: (data: {
    title: string;
    content: string;
    category: PostCategory;
    tags?: string[];
    relatedSkillId?: string;
    relatedSkillTitle?: string;
    resourceUrl?: string;
  }) => { success: boolean; error?: string; post?: CommunityPost };
  likePost: (postId: string) => void;
  commentPost: (postId: string, content: string) => { success: boolean; error?: string };
  savePost: (postId: string) => void;
  createGroup: (data: {
    name: string;
    description: string;
    topic: string;
    skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
    meetingCadence?: string;
  }) => { success: boolean; error?: string; group?: LearningGroup };
  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => void;
  sendConnectionRequest: (targetUserId: string, note?: string) => Promise<{ success: boolean; error?: string }>;
  acceptConnection: (targetUserIdOrConnId: string) => Promise<{ success: boolean; error?: string }>;
  declineConnection: (targetUserIdOrConnId: string) => Promise<{ success: boolean; error?: string }>;
  getConnectionStatus: (targetUserId: string) => 'none' | 'pending' | 'accepted' | 'declined';
  getConnectionRecord: (targetUserId: string) => StudentConnection | null;
  refreshConnections: () => Promise<void>;
  switchCollege: (collegeId: string) => void;
  isLoading: boolean;
}

const DEFAULT_CAMPUS: College = {
  id: 'adypu',
  name: 'Ajeenkya DY Patil University',
  shortName: 'ADYPU',
  domain: 'adypu.edu.in',
  location: 'Pune, India',
  mascot: 'Titans',
  badgeColor: '#059669',
  memberCount: 0,
  verifiedCount: 0,
  description: 'Campus peer learning community for ADYPU students.',
};

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const { user, allUsers } = useAuth();

  const [colleges, setColleges] = useState<College[]>(isSupabaseConfigured ? [] : COLLEGES);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('adypu');
  const [posts, setPosts] = useState<CommunityPost[]>(isSupabaseConfigured ? [] : INITIAL_POSTS);
  const [groups, setGroups] = useState<LearningGroup[]>(isSupabaseConfigured ? [] : INITIAL_GROUPS);
  const [connections, setConnections] = useState<StudentConnection[]>(
    isSupabaseConfigured ? [] : INITIAL_CONNECTIONS
  );
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync selected college with current user's profile
  useEffect(() => {
    if (user?.collegeId) {
      setSelectedCollegeId(user.collegeId);
    }
  }, [user?.collegeId]);

  // Load colleges from Supabase
  useEffect(() => {
    async function loadColleges() {
      try {
        const dbColleges = await fetchColleges();
        if (dbColleges && dbColleges.length > 0) {
          setColleges(dbColleges);
        }
      } catch (err) {
        console.warn('Error loading colleges from DB, using defaults:', err);
      }
    }
    loadColleges();
  }, []);

  const currentCollege = useMemo(() => {
    return (
      colleges.find((c) => c.id === selectedCollegeId) ||
      colleges[0] ||
      (isSupabaseConfigured ? DEFAULT_CAMPUS : COLLEGES[0])
    );
  }, [colleges, selectedCollegeId]);

  // Fetch community data when current college or user changes
  const refreshCommunityData = useCallback(async () => {
    if (!currentCollege?.id) return;
    setIsLoading(true);

    if (!isSupabaseConfigured) {
      setPosts(INITIAL_POSTS.filter((p) => p.collegeId === currentCollege.id));
      setGroups(INITIAL_GROUPS.filter((g) => g.collegeId === currentCollege.id));
      setConnections(INITIAL_CONNECTIONS);
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch posts directly from Supabase
      const dbPosts = await fetchCommunityPosts(currentCollege.id);
      setPosts(dbPosts || []);
      if (user && dbPosts) {
        const userSaved = dbPosts
          .filter((p) => p.savedBy?.includes(user.id))
          .map((p) => p.id);
        setSavedPostIds(userSaved);
      } else {
        setSavedPostIds([]);
      }

      // 2. Fetch learning groups directly from Supabase
      const dbGroups = await fetchLearningGroups(currentCollege.id);
      setGroups(dbGroups || []);

      // 3. Fetch connections if user is logged in
      if (user?.id) {
        const dbConnections = await fetchStudentConnections(user.id);
        setConnections(dbConnections || []);
      } else {
        setConnections([]);
      }
    } catch (err) {
      console.warn('Failed to load community data from Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentCollege.id, user]);

  useEffect(() => {
    refreshCommunityData();
  }, [refreshCommunityData]);

  const currentCollegeId = currentCollege?.id;
  const currentUserId = user?.id;

  // Refresh connections cleanly without reloading entire community feed
  const refreshConnections = useCallback(async () => {
    if (!isSupabaseConfigured || !currentUserId) return;
    try {
      const dbConnections = await fetchStudentConnections(currentUserId);
      setConnections(dbConnections || []);
    } catch (err) {
      console.warn('Failed to refresh student connections:', err);
    }
  }, [currentUserId]);

  // Realtime subscription for posts, comments, and student connections
  useEffect(() => {
    if (!supabase || !currentCollegeId) return;

    const channel = supabase
      .channel(`community-feed-${currentCollegeId}-${currentUserId || 'anon'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_posts', filter: `college_id=eq.${currentCollegeId}` },
        () => {
          refreshCommunityData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'student_connections' },
        () => {
          refreshConnections();
        }
      )
      .subscribe();

    return () => {
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [currentCollegeId, currentUserId, refreshCommunityData, refreshConnections]);

  // Discover students from the SAME college only (excluding self)
  const sameCollegeStudents = useMemo(() => {
    if (!user) return [];
    return allUsers.filter(
      (u) => (u.collegeId || 'adypu') === currentCollege.id && u.id !== user.id
    );
  }, [allUsers, currentCollege.id, user]);

  // Create post (Optimistic with Supabase background persistence)
  const createPost = (data: {
    title: string;
    content: string;
    category: PostCategory;
    tags?: string[];
    relatedSkillId?: string;
    relatedSkillTitle?: string;
    resourceUrl?: string;
  }): { success: boolean; error?: string; post?: CommunityPost } => {
    if (!user) return { success: false, error: 'Must be signed in to post.' };
    if (!data.title.trim()) return { success: false, error: 'Post title is required.' };
    if (!data.content.trim()) return { success: false, error: 'Post content cannot be empty.' };

    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      collegeId: currentCollege.id,
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar,
      authorMajor: user.major || 'Student',
      isAuthorVerified: user.isCollegeVerified !== false,
      category: data.category,
      title: data.title.trim(),
      content: data.content.trim(),
      tags: data.tags || [],
      relatedSkillId: data.relatedSkillId,
      relatedSkillTitle: data.relatedSkillTitle,
      resourceUrl: data.resourceUrl?.trim(),
      likesCount: 0,
      likedBy: [],
      savedBy: [],
      comments: [],
      createdAt: 'Just now',
    };

    setPosts((prev) => [newPost, ...prev]);

    // Persist to Supabase
    createCommunityPost({
      collegeId: currentCollege.id,
      authorId: user.id,
      title: data.title.trim(),
      content: data.content.trim(),
      category: data.category,
      tags: data.tags || [],
      resourceUrl: data.resourceUrl?.trim(),
    }).then((res) => {
      if (res.success && res.post) {
        setPosts((prev) => prev.map((p) => (p.id === newPost.id ? res.post! : p)));
      }
    }).catch((err) => {
      console.warn('Background Supabase post create warning:', err);
    });

    return { success: true, post: newPost };
  };

  // Like / Unlike post
  const likePost = (postId: string) => {
    if (!user) return;

    const target = posts.find((p) => p.id === postId);
    const alreadyLiked = target ? target.likedBy.includes(user.id) : false;

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const updatedLikedBy = alreadyLiked
          ? post.likedBy.filter((id) => id !== user.id)
          : [...post.likedBy, user.id];
        return {
          ...post,
          likedBy: updatedLikedBy,
          likesCount: Math.max(0, post.likesCount + (alreadyLiked ? -1 : 1)),
        };
      })
    );

    togglePostLike(postId, user.id, alreadyLiked).catch((err) => {
      console.warn('Failed to sync like with Supabase:', err);
    });
  };

  // Comment on post
  const commentPost = (postId: string, content: string): { success: boolean; error?: string } => {
    if (!user) return { success: false, error: 'Must be signed in to comment.' };
    if (!content.trim()) return { success: false, error: 'Comment cannot be empty.' };

    const newComment = {
      id: `comm-${Date.now()}`,
      postId,
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar,
      authorCollegeId: currentCollege.id,
      isAuthorVerified: user.isCollegeVerified !== false,
      content: content.trim(),
      createdAt: 'Just now',
      likesCount: 0,
    };

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          comments: [...post.comments, newComment],
        };
      })
    );

    addPostComment(postId, user.id, content.trim()).catch((err) => {
      console.warn('Failed to sync comment with Supabase:', err);
    });

    return { success: true };
  };

  // Save / Unsave post
  const savePost = (postId: string) => {
    if (!user) return;

    const alreadySaved = savedPostIds.includes(postId);
    const nextSaved = alreadySaved
      ? savedPostIds.filter((id) => id !== postId)
      : [...savedPostIds, postId];
    setSavedPostIds(nextSaved);

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const nextSavedBy = alreadySaved
          ? (p.savedBy || []).filter((id) => id !== user.id)
          : [...(p.savedBy || []), user.id];
        return {
          ...p,
          savedBy: nextSavedBy,
        };
      })
    );

    togglePostBookmark(postId, user.id, alreadySaved).catch((err) => {
      console.warn('Failed to sync bookmark with Supabase:', err);
    });
  };

  // Create learning group
  const createGroup = (data: {
    name: string;
    description: string;
    topic: string;
    skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
    meetingCadence?: string;
  }): { success: boolean; error?: string; group?: LearningGroup } => {
    if (!user) return { success: false, error: 'Must be signed in to create a learning group.' };
    if (!data.name.trim()) return { success: false, error: 'Group name is required.' };
    if (!data.description.trim()) return { success: false, error: 'Group description is required.' };

    const optimisticGroup: LearningGroup = {
      id: `group-${Date.now()}`,
      collegeId: currentCollege.id,
      name: data.name.trim(),
      description: data.description.trim(),
      topic: data.topic.trim(),
      skillLevel: data.skillLevel,
      creatorId: user.id,
      creatorName: user.name,
      creatorAvatar: user.avatar,
      isCreatorVerified: user.isCollegeVerified !== false,
      memberIds: [user.id],
      meetingCadence: data.meetingCadence?.trim() || 'Flexible Schedule',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setGroups((prev) => [optimisticGroup, ...prev]);

    createLearningGroup({
      collegeId: currentCollege.id,
      creatorId: user.id,
      name: data.name.trim(),
      description: data.description.trim(),
      topic: data.topic.trim(),
      skillLevel: data.skillLevel,
      meetingCadence: data.meetingCadence?.trim() || 'Flexible Schedule',
    }).then((res) => {
      if (res.success && res.group) {
        setGroups((prev) => prev.map((g) => (g.id === optimisticGroup.id ? res.group! : g)));
      }
    }).catch((err) => {
      console.warn('Failed to create learning group in DB:', err);
    });

    return { success: true, group: optimisticGroup };
  };

  // Join group
  const joinGroup = (groupId: string) => {
    if (!user) return;
    setGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;
        if (group.memberIds.includes(user.id)) return group;
        return {
          ...group,
          memberIds: [...group.memberIds, user.id],
        };
      })
    );

    joinLearningGroup(groupId, user.id).catch((err) => {
      console.warn('Failed to join group in DB:', err);
    });
  };

  // Leave group
  const leaveGroup = (groupId: string) => {
    if (!user) return;
    setGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;
        return {
          ...group,
          memberIds: group.memberIds.filter((id) => id !== user.id),
        };
      })
    );

    leaveLearningGroup(groupId, user.id).catch((err) => {
      console.warn('Failed to leave group in DB:', err);
    });
  };

  // Send connection request
  const sendConnectionRequest = async (
    targetUserId: string,
    note?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Must be signed in to connect.' };
    if (user.id === targetUserId) return { success: false, error: 'Cannot connect with yourself.' };

    const existing = connections.find(
      (c) =>
        (c.requesterId === user.id && c.receiverId === targetUserId) ||
        (c.requesterId === targetUserId && c.receiverId === user.id)
    );

    if (existing) {
      return { success: false, error: 'A connection request already exists.' };
    }

    if (isSupabaseConfigured) {
      const targetUser = allUsers.find((u) => u.id === targetUserId);
      const collegeId = user.collegeId || targetUser?.collegeId || currentCollege.id;
      const res = await sendConnRequestDb({
        collegeId,
        requesterId: user.id,
        receiverId: targetUserId,
        note,
      });

      if (!res.success) {
        await refreshConnections();
        return { success: false, error: res.error || 'Failed to send connection request.' };
      }

      if (res.connection) {
        setConnections((prev) => [
          res.connection!,
          ...prev.filter((c) => c.id !== res.connection!.id),
        ]);
      } else {
        await refreshConnections();
      }
      return { success: true };
    }

    const offlineConn: StudentConnection = {
      id: `conn-${Date.now()}`,
      collegeId: currentCollege.id,
      requesterId: user.id,
      receiverId: targetUserId,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
      note,
    };

    setConnections((prev) => [offlineConn, ...prev]);
    return { success: true };
  };

  // Shared helper for accepting/declining an incoming connection request
  const respondToConnection = async (
    targetUserIdOrConnId: string,
    status: 'accepted' | 'declined'
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Must be signed in.' };

    const matchConnection = (list: StudentConnection[]) =>
      list.find(
        (c) =>
          c.id === targetUserIdOrConnId ||
          (c.requesterId === targetUserIdOrConnId && c.receiverId === user.id) ||
          (c.receiverId === targetUserIdOrConnId && c.requesterId === user.id)
      );

    let targetConn = matchConnection(connections);
    if ((!targetConn || (isSupabaseConfigured && targetConn.id.startsWith('conn-'))) && isSupabaseConfigured) {
      const fresh = await fetchStudentConnections(user.id);
      setConnections(fresh || []);
      targetConn = matchConnection(fresh || []);
    }

    if (!targetConn) {
      return { success: false, error: 'Connection request not found.' };
    }

    if (targetConn.receiverId !== user.id) {
      return {
        success: false,
        error: 'Waiting for the other student to accept your connection request.',
      };
    }

    if (isSupabaseConfigured) {
      const res = await respondConnRequestDb(targetConn.id, status);
      if (!res.success) {
        return { success: false, error: res.error || `Failed to mark connection as ${status}.` };
      }
    }

    setConnections((prev) =>
      prev.map((c) => (c.id === targetConn!.id ? { ...c, status } : c))
    );
    return { success: true };
  };

  const acceptConnection = (targetUserIdOrConnId: string) =>
    respondToConnection(targetUserIdOrConnId, 'accepted');

  const declineConnection = (targetUserIdOrConnId: string) =>
    respondToConnection(targetUserIdOrConnId, 'declined');

  // Get full connection record with another student
  const getConnectionRecord = (targetUserId: string): StudentConnection | null => {
    if (!user) return null;
    return (
      connections.find(
        (c) =>
          (c.requesterId === user.id && c.receiverId === targetUserId) ||
          (c.requesterId === targetUserId && c.receiverId === user.id)
      ) || null
    );
  };

  // Get connection status with another student
  const getConnectionStatus = (targetUserId: string): 'none' | 'pending' | 'accepted' | 'declined' => {
    const found = getConnectionRecord(targetUserId);
    return found ? found.status : 'none';
  };

  const switchCollege = (collegeId: string) => {
    setSelectedCollegeId(collegeId);
  };

  return (
    <CommunityContext.Provider
      value={{
        currentCollege,
        allColleges: colleges,
        posts,
        groups,
        connections,
        sameCollegeStudents,
        savedPostIds,
        createPost,
        likePost,
        commentPost,
        savePost,
        createGroup,
        joinGroup,
        leaveGroup,
        sendConnectionRequest,
        acceptConnection,
        declineConnection,
        getConnectionStatus,
        getConnectionRecord,
        refreshConnections,
        switchCollege,
        isLoading,
      }}
    >
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity() {
  const context = useContext(CommunityContext);
  if (!context) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
}
