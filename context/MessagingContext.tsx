'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Conversation, Message, MessageType, SkillInvitationData, ConnectionStatus, User } from '@/types';
import { INITIAL_CONVERSATIONS, INITIAL_MESSAGES } from '@/lib/mock-messaging-data';
import { useAuth } from './AuthContext';
import { useCommunity } from './CommunityContext';
import {
  fetchUserConversations,
  fetchConversationMessages,
  getOrCreateDirectConversation,
  sendDirectMessage,
  markConversationRead,
  sendSkillSwapInvitationRpc,
  respondToSkillSwapInvitationRpc,
} from '@/lib/supabase-service';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface SendInvitationPayload {
  offeredSkillId: string;
  offeredSkillTitle: string;
  requestedSkillId: string;
  requestedSkillTitle: string;
  credits: number;
  note?: string;
}

interface MessagingContextType {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  activeChatPartner: User | null;
  messages: Message[];
  totalUnreadCount: number;
  isLoading: boolean;
  toast: { message: string; type: 'info' | 'success' | 'warning' } | null;
  clearToast: () => void;
  selectConversation: (id: string | null) => void;
  canMessageStudent: (targetUserId: string) => {
    allowed: boolean;
    reason?: string;
    connectionStatus: ConnectionStatus | 'none' | 'cross_college';
  };
  startConversationWith: (targetUserId: string) => Promise<{
    success: boolean;
    conversationId?: string;
    error?: string;
  }>;
  sendMessage: (
    conversationId: string,
    content: string,
    type?: MessageType,
    options?: {
      resourceUrl?: string;
      resourceTitle?: string;
      invitation?: SkillInvitationData;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  sendSkillSwapInvitation: (
    conversationId: string,
    payload: SendInvitationPayload
  ) => Promise<{ success: boolean; error?: string }>;
  respondToSkillSwapInvitation: (
    messageId: string,
    accept: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  markAsRead: (conversationId: string) => void;
  refreshConversations: () => Promise<void>;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const { user, allUsers } = useAuth();
  const { getConnectionStatus } = useCommunity();

  const [allConversations, setAllConversations] = useState<Conversation[]>(
    isSupabaseConfigured ? [] : INITIAL_CONVERSATIONS
  );
  const [messagesByConv, setMessagesByConv] = useState<Record<string, Message[]>>(
    isSupabaseConfigured
      ? {}
      : {
          'conv-1': INITIAL_MESSAGES.filter((m) => m.conversationId === 'conv-1'),
          'conv-2': INITIAL_MESSAGES.filter((m) => m.conversationId === 'conv-2'),
        }
  );
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'warning' } | null>(null);

  // Refs avoid resetting loadConversations / Realtime subscriptions when activeConversationId changes
  const activeConversationIdRef = useRef<string | null>(activeConversationId);
  const allConversationsRef = useRef<Conversation[]>(allConversations);
  const messagesByConvRef = useRef<Record<string, Message[]>>(messagesByConv);
  const userRef = useRef<User | null>(user);
  const allUsersRef = useRef<User[]>(allUsers);
  const loadSeqRef = useRef(0);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    allConversationsRef.current = allConversations;
  }, [allConversations]);

  useEffect(() => {
    messagesByConvRef.current = messagesByConv;
  }, [messagesByConv]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    allUsersRef.current = allUsers;
  }, [allUsers]);

  // Load conversations from Supabase
  const loadConversations = useCallback(async () => {
    const seq = ++loadSeqRef.current;

    if (!user) {
      if (!isSupabaseConfigured) {
        setAllConversations(INITIAL_CONVERSATIONS);
      } else {
        setAllConversations([]);
        setActiveConversationId(null);
      }
      return;
    }

    if (!isSupabaseConfigured) {
      const fallback = INITIAL_CONVERSATIONS.filter((c) => c.participantIds.includes(user.id));
      setAllConversations(fallback.length > 0 ? fallback : INITIAL_CONVERSATIONS);
      return;
    }

    setIsLoading(true);
    try {
      const convs = await fetchUserConversations(user.id);
      if (seq !== loadSeqRef.current) return;

      const list = convs || [];
      setAllConversations(list);

      const currentActive = activeConversationIdRef.current;
      if (list.length > 0) {
        if (!currentActive || !list.some((c) => c.id === currentActive)) {
          setActiveConversationId(list[0].id);
        }
      } else if (currentActive) {
        setActiveConversationId(null);
      }
    } catch (err) {
      console.warn('Error loading conversations from Supabase:', err);
    } finally {
      if (seq === loadSeqRef.current) {
        setIsLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages when active conversation changes
  const loadMessages = useCallback(async (convId: string) => {
    if (!convId || convId.startsWith('conv-')) return;
    try {
      const msgs = await fetchConversationMessages(convId);
      setMessagesByConv((prev) => ({
        ...prev,
        [convId]: msgs || [],
      }));
    } catch (err) {
      console.warn(`Error loading messages for ${convId}:`, err);
    }
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId, loadMessages]);

  // Supabase Realtime for all conversations & messages accessible to the current user
  useEffect(() => {
    if (!supabase || !user?.id) return;

    const currentUserId = user.id;
    const channel = supabase
      .channel(`messaging-user-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            conversation_id: string;
            sender_id: string;
            type: string;
            content: string;
            resource_url?: string;
            resource_title?: string;
            invitation_data?: SkillInvitationData;
            created_at: string;
          };

          const me = userRef.current;
          const senderProfile = allUsersRef.current.find((u) => u.id === row.sender_id);
          const newMsg: Message = {
            id: row.id,
            conversationId: row.conversation_id,
            senderId: row.sender_id,
            senderName:
              row.sender_id === me?.id
                ? me?.name || 'You'
                : senderProfile?.name || 'Student',
            senderAvatar:
              row.sender_id === me?.id
                ? me?.avatar
                : senderProfile?.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(row.sender_id)}`,
            type: (row.type as MessageType) || 'text',
            content: row.content,
            resourceUrl: row.resource_url,
            resourceTitle: row.resource_title,
            invitation: row.invitation_data,
            createdAt: row.created_at,
            readBy: [row.sender_id],
          };

          setMessagesByConv((prev) => {
            const current = prev[row.conversation_id] || [];
            if (current.some((m) => m.id === newMsg.id)) return prev;
            return {
              ...prev,
              [row.conversation_id]: [...current, newMsg],
            };
          });

          const isKnownConv = allConversationsRef.current.some((c) => c.id === row.conversation_id);
          if (!isKnownConv) {
            loadConversations();
          } else {
            const isViewingConv = activeConversationIdRef.current === row.conversation_id;
            setAllConversations((prev) =>
              prev.map((c) => {
                if (c.id !== row.conversation_id) return c;
                const nextUnread = { ...(c.unreadCounts || {}) };
                if (row.sender_id !== currentUserId) {
                  nextUnread[currentUserId] = isViewingConv
                    ? 0
                    : (nextUnread[currentUserId] || 0) + 1;
                }
                return {
                  ...c,
                  updatedAt: row.created_at,
                  unreadCounts: nextUnread,
                  lastMessage: {
                    text: row.content,
                    senderId: row.sender_id,
                    createdAt: row.created_at,
                    type: (row.type as MessageType) || 'text',
                  },
                };
              })
            );
            if (isViewingConv && row.sender_id !== currentUserId) {
              markConversationRead(row.conversation_id).catch(() => {});
            }
          }

          if (row.type === 'skill_invitation' && !row.invitation_data) {
            loadMessages(row.conversation_id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_participants',
          filter: `user_id=eq.${currentUserId}`,
        },
        () => {
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'skill_swap_invitations',
        },
        (payload) => {
          const row = payload.new as { conversation_id?: string };
          if (row?.conversation_id) {
            loadMessages(row.conversation_id);
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id, loadConversations, loadMessages]);

  // Filter conversations for current user
  const userConversations = useMemo(() => {
    if (!user) return allConversations;
    return allConversations
      .filter((c) => c.participantIds.includes(user.id))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [allConversations, user]);

  // Total unread count for current user
  const totalUnreadCount = useMemo(() => {
    if (!user) return 0;
    return userConversations.reduce((sum, c) => sum + (c.unreadCounts?.[user.id] || 0), 0);
  }, [userConversations, user]);

  // Set default active conversation if none selected
  useEffect(() => {
    if (!user || userConversations.length === 0) {
      return;
    }
    if (!activeConversationId || !userConversations.some((c) => c.id === activeConversationId)) {
      setActiveConversationId(userConversations[0].id);
    }
  }, [user, userConversations, activeConversationId]);

  const activeConversation = useMemo(() => {
    if (!activeConversationId) return null;
    return userConversations.find((c) => c.id === activeConversationId) || null;
  }, [activeConversationId, userConversations]);

  // Active chat partner
  const activeChatPartner = useMemo(() => {
    if (!activeConversation || !user) return null;
    const partnerId = activeConversation.participantIds.find((id) => id !== user.id);
    if (!partnerId) return null;
    return allUsers.find((u) => u.id === partnerId) || null;
  }, [activeConversation, user, allUsers]);

  // Messages for active conversation
  const currentMessages = useMemo(() => {
    if (!activeConversationId) return [];
    const list = messagesByConv[activeConversationId] || [];
    return [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messagesByConv, activeConversationId]);

  // Mark conversation as read
  const markAsRead = useCallback(
    (convId: string) => {
      if (!user) return;

      // Optimistic update
      setAllConversations((prev) =>
        prev.map((c) => {
          if (c.id === convId && c.unreadCounts?.[user.id] > 0) {
            return {
              ...c,
              unreadCounts: {
                ...c.unreadCounts,
                [user.id]: 0,
              },
            };
          }
          return c;
        })
      );

      markConversationRead(convId).catch((err) => {
        console.warn('Failed to mark conversation read in DB:', err);
      });
    },
    [user]
  );

  // Automatically mark active conversation as read when selected
  useEffect(() => {
    if (activeConversationId && user) {
      markAsRead(activeConversationId);
    }
  }, [activeConversationId, user, markAsRead]);

  const selectConversation = useCallback(
    (id: string | null) => {
      activeConversationIdRef.current = id;
      setActiveConversationId(id);
      if (id && userRef.current) {
        markAsRead(id);
      }
    },
    [markAsRead]
  );

  const clearToast = useCallback(() => setToast(null), []);

  // Strict Connection & College validation in Data Access Layer
  const canMessageStudent = useCallback(
    (targetUserId: string): {
      allowed: boolean;
      reason?: string;
      connectionStatus: ConnectionStatus | 'none' | 'cross_college';
    } => {
      if (!user) {
        return {
          allowed: false,
          reason: 'You must sign in to SwapStudy to send messages.',
          connectionStatus: 'none',
        };
      }

      if (user.id === targetUserId) {
        return {
          allowed: false,
          reason: 'You cannot start a conversation with yourself.',
          connectionStatus: 'none',
        };
      }

      const targetUser = allUsers.find((u) => u.id === targetUserId);
      if (!targetUser) {
        return {
          allowed: false,
          reason: 'Student profile not found.',
          connectionStatus: 'none',
        };
      }

      if (isSupabaseConfigured && !user.isCollegeVerified) {
        return {
          allowed: false,
          reason: 'Your college student account must be verified before you can send direct messages.',
          connectionStatus: 'none',
        };
      }

      if (isSupabaseConfigured && !targetUser.isCollegeVerified) {
        return {
          allowed: false,
          reason: `${targetUser.name}'s college verification is still pending. Messaging unlocks once verified.`,
          connectionStatus: 'none',
        };
      }

      // Check 1: Same College Restriction
      const userCollege = user.collegeId || 'adypu';
      const targetCollege = targetUser.collegeId || 'adypu';
      if (userCollege !== targetCollege) {
        return {
          allowed: false,
          reason: 'Cross-college messaging is currently restricted. Students can only message peers enrolled at the same university.',
          connectionStatus: 'cross_college',
        };
      }

      // Check 2: Connection Status (Must be 'accepted')
      const status = getConnectionStatus(targetUserId);
      if (status === 'accepted') {
        return { allowed: true, connectionStatus: 'accepted' };
      }

      if (status === 'pending') {
        return {
          allowed: false,
          reason: 'Your connection request is pending acceptance. Once accepted, you will be able to message them directly.',
          connectionStatus: 'pending',
        };
      }

      if (status === 'declined') {
        return {
          allowed: false,
          reason: 'Connection request was declined. You cannot message this student.',
          connectionStatus: 'declined',
        };
      }

      return {
        allowed: false,
        reason: 'You must connect before sending direct messages. Send a connection request to connect.',
        connectionStatus: 'none',
      };
    },
    [user, allUsers, getConnectionStatus]
  );

  // Start new conversation or return existing using atomic RPC
  const startConversationWith = useCallback(
    async (
      targetUserId: string
    ): Promise<{ success: boolean; conversationId?: string; error?: string }> => {
      const currentUser = userRef.current;
      if (!currentUser) return { success: false, error: 'Must be logged in.' };

      const check = canMessageStudent(targetUserId);
      if (!check.allowed) {
        return { success: false, error: check.reason };
      }

      const targetUser = allUsersRef.current.find((u) => u.id === targetUserId);
      if (!targetUser) return { success: false, error: 'Student not found.' };

      // Check existing real conversation first
      const existing = allConversationsRef.current.find(
        (c) =>
          !c.isGroup &&
          c.participantIds.includes(currentUser.id) &&
          c.participantIds.includes(targetUserId) &&
          (!isSupabaseConfigured || !c.id.startsWith('conv-'))
      );

      if (existing) {
        activeConversationIdRef.current = existing.id;
        setActiveConversationId(existing.id);
        if (isSupabaseConfigured) {
          await loadMessages(existing.id);
        }
        markAsRead(existing.id);
        return { success: true, conversationId: existing.id };
      }

      if (isSupabaseConfigured) {
        const res = await getOrCreateDirectConversation(targetUserId);
        if (!res.success || !res.conversationId) {
          const errMsg =
            res.error || 'Could not start conversation. Please verify both accounts are connected.';
          setToast({ message: errMsg, type: 'warning' });
          return { success: false, error: errMsg };
        }

        const realId = res.conversationId;
        const seq = ++loadSeqRef.current;
        const freshConvs = await fetchUserConversations(currentUser.id);
        const now = new Date().toISOString();
        const fallbackConv: Conversation = {
          id: realId,
          collegeId: currentUser.collegeId || 'adypu',
          participantIds: [currentUser.id, targetUserId],
          createdAt: now,
          updatedAt: now,
          unreadCounts: {
            [currentUser.id]: 0,
            [targetUserId]: 0,
          },
          isGroup: false,
        };

        if (seq === loadSeqRef.current) {
          setAllConversations((prev) => {
            const base = freshConvs.length > 0 ? [...freshConvs] : [...prev];
            if (!base.some((c) => c.id === realId)) {
              base.unshift(fallbackConv);
            }
            return base;
          });
        }

        await loadMessages(realId);
        activeConversationIdRef.current = realId;
        setActiveConversationId(realId);
        markAsRead(realId);

        setToast({
          message: `Chat ready with ${targetUser.name}`,
          type: 'success',
        });
        return { success: true, conversationId: realId };
      }

      // Offline / local fallback only when Supabase is unconfigured
      const now = new Date().toISOString();
      const newConvId = `conv-${Date.now()}`;
      const newConv: Conversation = {
        id: newConvId,
        collegeId: currentUser.collegeId || 'adypu',
        participantIds: [currentUser.id, targetUserId],
        createdAt: now,
        updatedAt: now,
        unreadCounts: {
          [currentUser.id]: 0,
          [targetUserId]: 0,
        },
        isGroup: false,
        lastMessage: {
          text: 'Direct conversation started.',
          senderId: 'system',
          createdAt: now,
          type: 'system',
        },
      };

      setAllConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConvId);
      setToast({
        message: `Conversation started with ${targetUser.name}`,
        type: 'success',
      });
      return { success: true, conversationId: newConvId };
    },
    [canMessageStudent, loadMessages, markAsRead]
  );

  // Send message
  const sendMessage = useCallback(
    async (
      conversationId: string,
      content: string,
      type: MessageType = 'text',
      options?: {
        resourceUrl?: string;
        resourceTitle?: string;
        invitation?: SkillInvitationData;
      }
    ): Promise<{ success: boolean; error?: string }> => {
      const currentUser = userRef.current;
      if (!currentUser) return { success: false, error: 'Must be logged in to send messages.' };

      const conv = allConversationsRef.current.find((c) => c.id === conversationId);
      if (!conv) return { success: false, error: 'Conversation not found.' };

      if (!conv.participantIds.includes(currentUser.id)) {
        return { success: false, error: 'Access denied: You are not a participant in this conversation.' };
      }

      if (isSupabaseConfigured && conversationId.startsWith('conv-')) {
        return { success: false, error: 'Conversation is not synced with the server yet.' };
      }

      const trimmedContent = content.trim();
      if (!trimmedContent && type !== 'skill_invitation') {
        return { success: false, error: 'Message cannot be empty.' };
      }

      const now = new Date().toISOString();
      const tempId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const prevConvSnapshot = conv;

      let lastMessagePreview = trimmedContent;
      if (type === 'skill_invitation') {
        lastMessagePreview = `Skill Swap Invitation: ${options?.invitation?.offeredSkillTitle || 'Skill'} ⇄ ${options?.invitation?.requestedSkillTitle || 'Skill'}`;
      } else if (type === 'resource') {
        lastMessagePreview = options?.resourceTitle ? `Shared resource: ${options.resourceTitle}` : trimmedContent;
      }

      const optimisticMsg: Message = {
        id: tempId,
        conversationId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        type,
        content: trimmedContent,
        resourceUrl: options?.resourceUrl,
        resourceTitle: options?.resourceTitle,
        invitation: options?.invitation,
        createdAt: now,
        readBy: [currentUser.id],
      };

      // Optimistic state updates
      setMessagesByConv((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), optimisticMsg],
      }));

      setAllConversations((prev) =>
        prev.map((c) => {
          if (c.id === conversationId) {
            const nextUnread: Record<string, number> = { ...(c.unreadCounts || {}) };
            c.participantIds.forEach((pId) => {
              if (pId !== currentUser.id) {
                nextUnread[pId] = (nextUnread[pId] || 0) + 1;
              }
            });
            return {
              ...c,
              updatedAt: now,
              lastMessage: {
                text: lastMessagePreview,
                senderId: currentUser.id,
                createdAt: now,
                type,
              },
              unreadCounts: nextUnread,
            };
          }
          return c;
        })
      );

      if (!isSupabaseConfigured) {
        return { success: true };
      }

      const res = await sendDirectMessage({
        conversationId,
        senderId: currentUser.id,
        content: trimmedContent,
        type,
        resourceUrl: options?.resourceUrl,
        resourceTitle: options?.resourceTitle,
      });

      if (!res.success) {
        // Roll back optimistic message and preview
        setMessagesByConv((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).filter((m) => m.id !== tempId),
        }));
        setAllConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? prevConvSnapshot : c))
        );
        const errMsg = res.error || 'Failed to send message.';
        setToast({ message: errMsg, type: 'warning' });
        return { success: false, error: errMsg };
      }

      if (res.messageId) {
        setMessagesByConv((prev) => {
          const current = prev[conversationId] || [];
          const hasRealFromRealtime = current.some((m) => m.id === res.messageId);
          if (hasRealFromRealtime) {
            return {
              ...prev,
              [conversationId]: current.filter((m) => m.id !== tempId),
            };
          }
          return {
            ...prev,
            [conversationId]: current.map((m) =>
              m.id === tempId ? { ...m, id: res.messageId! } : m
            ),
          };
        });
      }

      return { success: true };
    },
    []
  );

  // Send contextual Skill Swap invitation
  const sendSkillSwapInvitation = useCallback(
    async (
      conversationId: string,
      payload: SendInvitationPayload
    ): Promise<{ success: boolean; error?: string }> => {
      const currentUser = userRef.current;
      if (!currentUser) return { success: false, error: 'Must be logged in.' };

      const conv = allConversationsRef.current.find((c) => c.id === conversationId);
      if (!conv) return { success: false, error: 'Conversation not found.' };
      const partnerId = conv.participantIds.find((id) => id !== currentUser.id) || '';

      if (isSupabaseConfigured) {
        if (!partnerId) {
          return { success: false, error: 'Could not identify recipient in this conversation.' };
        }
        const rpcRes = await sendSkillSwapInvitationRpc({
          conversationId,
          recipientId: partnerId,
          offeredSkillId: payload.offeredSkillId,
          offeredSkillTitle: payload.offeredSkillTitle,
          requestedSkillId: payload.requestedSkillId,
          requestedSkillTitle: payload.requestedSkillTitle,
          credits: payload.credits,
          note: payload.note,
        });

        if (!rpcRes.success) {
          const errMsg = rpcRes.error || 'Failed to send Skill Swap invitation.';
          setToast({ message: errMsg, type: 'warning' });
          return { success: false, error: errMsg };
        }

        await loadMessages(conversationId);
        loadConversations();
        setToast({
          message: 'Skill Swap invitation sent successfully!',
          type: 'success',
        });
        return { success: true };
      }

      const invitationData: SkillInvitationData = {
        invitationId: `inv-${Date.now()}`,
        offeredSkillId: payload.offeredSkillId,
        offeredSkillTitle: payload.offeredSkillTitle,
        requestedSkillId: payload.requestedSkillId,
        requestedSkillTitle: payload.requestedSkillTitle,
        credits: payload.credits,
        status: 'pending',
        note: payload.note,
      };

      const res = await sendMessage(
        conversationId,
        payload.note
          ? `Skill Swap Invitation: ${payload.offeredSkillTitle} ⇄ ${payload.requestedSkillTitle}\n"${payload.note}"`
          : `Skill Swap Invitation: ${payload.offeredSkillTitle} ⇄ ${payload.requestedSkillTitle}`,
        'skill_invitation',
        { invitation: invitationData }
      );

      if (res.success) {
        setToast({
          message: 'Skill Swap invitation sent successfully!',
          type: 'success',
        });
      }

      return res;
    },
    [sendMessage, loadMessages, loadConversations]
  );

  // Respond to contextual Skill Swap invitation
  const respondToSkillSwapInvitation = useCallback(
    async (
      messageId: string,
      accept: boolean
    ): Promise<{ success: boolean; error?: string }> => {
      const currentUser = userRef.current;
      if (!currentUser) return { success: false, error: 'Must be logged in.' };

      const newStatus = accept ? 'accepted' : 'declined';
      const now = new Date().toISOString();

      let targetInvitationId: string = messageId;
      let targetConvId: string | null = null;
      Object.entries(messagesByConvRef.current).forEach(([convId, msgs]) => {
        const found = msgs.find((m) => m.id === messageId);
        if (found) {
          targetConvId = convId;
          if (found.invitation?.invitationId) {
            targetInvitationId = found.invitation.invitationId;
          }
        }
      });

      if (isSupabaseConfigured) {
        const res = await respondToSkillSwapInvitationRpc(targetInvitationId, accept);
        if (!res.success) {
          const errMsg = res.error || 'Failed to respond to invitation.';
          setToast({ message: errMsg, type: 'warning' });
          return { success: false, error: errMsg };
        }
        if (targetConvId) {
          await loadMessages(targetConvId);
        }
      }

      setMessagesByConv((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((convId) => {
          next[convId] = next[convId].map((m) => {
            if (m.id === messageId && m.invitation) {
              return {
                ...m,
                invitation: {
                  ...m.invitation,
                  status: newStatus,
                  respondedAt: now,
                },
              };
            }
            return m;
          });
        });
        return next;
      });

      setToast({
        message: accept ? 'Invitation accepted! Booking is now available.' : 'Invitation declined.',
        type: accept ? 'success' : 'info',
      });

      return { success: true };
    },
    [loadMessages]
  );

  return (
    <MessagingContext.Provider
      value={{
        conversations: userConversations,
        activeConversationId,
        activeConversation,
        activeChatPartner,
        messages: currentMessages,
        totalUnreadCount,
        isLoading,
        toast,
        clearToast,
        selectConversation,
        canMessageStudent,
        startConversationWith,
        sendMessage,
        sendSkillSwapInvitation,
        respondToSkillSwapInvitation,
        markAsRead,
        refreshConversations: loadConversations,
      }}
    >
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
}
