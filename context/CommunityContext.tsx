'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
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
  sendConnectionRequest: (targetUserId: string, note?: string) => { success: boolean; error?: string };
  acceptConnection: (targetUserIdOrConnId: string) => { success: boolean; error?: string };
  declineConnection: (targetUserIdOrConnId: string) => { success: boolean; error?: string };
  getConnectionStatus: (targetUserId: string) => 'none' | 'pending' | 'accepted' | 'declined';
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

const POSTS_KEY = 'swapstudy_community_posts';
const GROUPS_KEY = 'swapstudy_community_groups';
const CONNECTIONS_KEY = 'swapstudy_community_connections';
const SAVED_KEY = 'swapstudy_community_saved_posts';

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const { user, allUsers } = useAuth();

  const [allPosts, setAllPosts] = useState<CommunityPost[]>(INITIAL_POSTS);
  const [allGroups, setAllGroups] = useState<LearningGroup[]>(INITIAL_GROUPS);
  const [connections, setConnections] = useState<StudentConnection[]>(INITIAL_CONNECTIONS);
  const [savedPostIds, setSavedPostIds] = useState<string[]>(['post-1']);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from LocalStorage
  useEffect(() => {
    try {
      const storedPosts = localStorage.getItem(POSTS_KEY);
      if (storedPosts) setAllPosts(JSON.parse(storedPosts));

      const storedGroups = localStorage.getItem(GROUPS_KEY);
      if (storedGroups) setAllGroups(JSON.parse(storedGroups));

      const storedConnections = localStorage.getItem(CONNECTIONS_KEY);
      if (storedConnections) setConnections(JSON.parse(storedConnections));

      const storedSaved = localStorage.getItem(SAVED_KEY);
      if (storedSaved) setSavedPostIds(JSON.parse(storedSaved));
    } catch (e) {
      console.warn('Failed to parse community localStorage state', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync state to LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(POSTS_KEY, JSON.stringify(allPosts));
      localStorage.setItem(GROUPS_KEY, JSON.stringify(allGroups));
      localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(connections));
      localStorage.setItem(SAVED_KEY, JSON.stringify(savedPostIds));
    } catch (e) {
      console.error('Failed to sync community state to localStorage', e);
    }
  }, [allPosts, allGroups, connections, savedPostIds, isLoaded]);

  // Determine current user's college (default to 'uw')
  const userCollegeId = user?.collegeId || 'uw';
  const currentCollege = useMemo(() => {
    return COLLEGES.find((c) => c.id === userCollegeId) || COLLEGES[0];
  }, [userCollegeId]);

  // Filter posts to current college only
  const posts = useMemo(() => {
    return allPosts.filter((p) => p.collegeId === currentCollege.id);
  }, [allPosts, currentCollege.id]);

  // Filter groups to current college only
  const groups = useMemo(() => {
    return allGroups.filter((g) => g.collegeId === currentCollege.id);
  }, [allGroups, currentCollege.id]);

  // Discover students from the SAME college only (excluding self)
  const sameCollegeStudents = useMemo(() => {
    if (!user) return [];
    return allUsers.filter(
      (u) => (u.collegeId || 'uw') === currentCollege.id && u.id !== user.id
    );
  }, [allUsers, currentCollege.id, user]);

  // Create post
  const createPost = (data: {
    title: string;
    content: string;
    category: PostCategory;
    tags?: string[];
    relatedSkillId?: string;
    relatedSkillTitle?: string;
    resourceUrl?: string;
  }) => {
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

    setAllPosts((prev) => [newPost, ...prev]);
    return { success: true, post: newPost };
  };

  // Like / Unlike post
  const likePost = (postId: string) => {
    if (!user) return;
    setAllPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const alreadyLiked = post.likedBy.includes(user.id);
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
  };

  // Comment on post
  const commentPost = (postId: string, content: string) => {
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

    setAllPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          comments: [...post.comments, newComment],
        };
      })
    );

    return { success: true };
  };

  // Save / Unsave post
  const savePost = (postId: string) => {
    if (!user) return;
    setSavedPostIds((prev) => {
      const alreadySaved = prev.includes(postId);
      const nextSaved = alreadySaved ? prev.filter((id) => id !== postId) : [...prev, postId];
      return nextSaved;
    });

    setAllPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const alreadySaved = p.savedBy?.includes(user.id) ?? false;
        const nextSavedBy = alreadySaved
          ? (p.savedBy || []).filter((id) => id !== user.id)
          : [...(p.savedBy || []), user.id];
        return {
          ...p,
          savedBy: nextSavedBy,
        };
      })
    );
  };

  // Create learning group
  const createGroup = (data: {
    name: string;
    description: string;
    topic: string;
    skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
    meetingCadence?: string;
  }) => {
    if (!user) return { success: false, error: 'Must be signed in to create a learning group.' };
    if (!data.name.trim()) return { success: false, error: 'Group name is required.' };
    if (!data.description.trim()) return { success: false, error: 'Group description is required.' };

    const newGroup: LearningGroup = {
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

    setAllGroups((prev) => [newGroup, ...prev]);
    return { success: true, group: newGroup };
  };

  // Join group
  const joinGroup = (groupId: string) => {
    if (!user) return;
    setAllGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;
        if (group.memberIds.includes(user.id)) return group;
        return {
          ...group,
          memberIds: [...group.memberIds, user.id],
        };
      })
    );
  };

  // Leave group
  const leaveGroup = (groupId: string) => {
    if (!user) return;
    setAllGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;
        return {
          ...group,
          memberIds: group.memberIds.filter((id) => id !== user.id),
        };
      })
    );
  };

  // Send connection request
  const sendConnectionRequest = (targetUserId: string, note?: string) => {
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

    const newConnection: StudentConnection = {
      id: `conn-${Date.now()}`,
      collegeId: currentCollege.id,
      requesterId: user.id,
      receiverId: targetUserId,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
      note,
    };

    setConnections((prev) => [newConnection, ...prev]);
    return { success: true };
  };

  // Accept connection
  const acceptConnection = (targetUserIdOrConnId: string) => {
    if (!user) return { success: false, error: 'Must be signed in.' };
    setConnections((prev) =>
      prev.map((c) => {
        if (
          c.id === targetUserIdOrConnId ||
          (c.requesterId === targetUserIdOrConnId && c.receiverId === user.id) ||
          (c.receiverId === targetUserIdOrConnId && c.requesterId === user.id)
        ) {
          return { ...c, status: 'accepted' };
        }
        return c;
      })
    );
    return { success: true };
  };

  // Decline connection
  const declineConnection = (targetUserIdOrConnId: string) => {
    if (!user) return { success: false, error: 'Must be signed in.' };
    setConnections((prev) =>
      prev.map((c) => {
        if (
          c.id === targetUserIdOrConnId ||
          (c.requesterId === targetUserIdOrConnId && c.receiverId === user.id) ||
          (c.receiverId === targetUserIdOrConnId && c.requesterId === user.id)
        ) {
          return { ...c, status: 'declined' };
        }
        return c;
      })
    );
    return { success: true };
  };

  // Get connection status with another student
  const getConnectionStatus = (targetUserId: string): 'none' | 'pending' | 'accepted' | 'declined' => {
    if (!user) return 'none';
    const found = connections.find(
      (c) =>
        (c.requesterId === user.id && c.receiverId === targetUserId) ||
        (c.requesterId === targetUserId && c.receiverId === user.id)
    );
    if (!found) return 'none';
    return found.status;
  };

  return (
    <CommunityContext.Provider
      value={{
        currentCollege,
        allColleges: COLLEGES,
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
