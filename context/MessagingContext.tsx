'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
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
  startConversationWith: (targetUserId: string) => {
    success: boolean;
    conversationId?: string;
    error?: string;
  };
  sendMessage: (
    conversationId: string,
    content: string,
    type?: MessageType,
    options?: {
      resourceUrl?: string;
      resourceTitle?: string;
      invitation?: SkillInvitationData;
    }
  ) => { success: boolean; error?: string };
  sendSkillSwapInvitation: (
    conversationId: string,
    payload: SendInvitationPayload
  ) => { success: boolean; error?: string };
  respondToSkillSwapInvitation: (
    messageId: string,
    accept: boolean
  ) => { success: boolean; error?: string };
  markAsRead: (conversationId: string) => void;
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

  // Load conversations from Supabase
  const loadConversations = useCallback(async () => {
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
      setAllConversations(convs || []);
      if (convs && convs.length > 0) {
        if (!activeConversationId || !convs.some((c) => c.id === activeConversationId)) {
          setActiveConversationId(convs[0].id);
        }
      } else {
        setActiveConversationId(null);
      }
    } catch (err) {
      console.warn('Error loading conversations from Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, activeConversationId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages when active conversation changes
  const loadMessages = useCallback(async (convId: string) => {
    if (!convId) return;
    try {
      const msgs = await fetchConversationMessages(convId);
      if (msgs && msgs.length > 0) {
        setMessagesByConv((prev) => ({
          ...prev,
          [convId]: msgs,
        }));
      }
    } catch (err) {
      console.warn(`Error loading messages for ${convId}:`, err);
    }
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId, loadMessages]);

  // Supabase Realtime for direct messages
  useEffect(() => {
    if (!supabase || !activeConversationId) return;

    const channel = supabase
      .channel(`direct-messages-${activeConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversationId}`,
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
          const newMsg: Message = {
            id: row.id,
            conversationId: row.conversation_id,
            senderId: row.sender_id,
            senderName: row.sender_id === user?.id ? (user?.name || 'You') : 'Student',
            senderAvatar: row.sender_id === user?.id ? user?.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
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
        }
      )
      .subscribe();

    return () => {
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [activeConversationId, user]);

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

  const selectConversation = (id: string | null) => {
    setActiveConversationId(id);
    if (id && user) {
      markAsRead(id);
    }
  };

  const clearToast = () => setToast(null);

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
    (targetUserId: string): { success: boolean; conversationId?: string; error?: string } => {
      if (!user) return { success: false, error: 'Must be logged in.' };

      const check = canMessageStudent(targetUserId);
      if (!check.allowed) {
        return { success: false, error: check.reason };
      }

      const targetUser = allUsers.find((u) => u.id === targetUserId);
      if (!targetUser) return { success: false, error: 'Student not found.' };

      // Local check first
      const existing = allConversations.find(
        (c) =>
          !c.isGroup &&
          c.participantIds.includes(user.id) &&
          c.participantIds.includes(targetUserId)
      );

      if (existing) {
        setActiveConversationId(existing.id);
        markAsRead(existing.id);
        return { success: true, conversationId: existing.id };
      }

      const now = new Date().toISOString();
      const newConvId = `conv-${Date.now()}`;
      const newConv: Conversation = {
        id: newConvId,
        collegeId: user.collegeId || 'adypu',
        participantIds: [user.id, targetUserId],
        createdAt: now,
        updatedAt: now,
        unreadCounts: {
          [user.id]: 0,
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

      // Call database RPC fn_get_or_create_direct_conversation
      getOrCreateDirectConversation(targetUserId)
        .then((res) => {
          if (res.success && res.conversationId) {
            setAllConversations((prev) =>
              prev.map((c) => (c.id === newConvId ? { ...c, id: res.conversationId! } : c))
            );
            setActiveConversationId(res.conversationId);
          }
        })
        .catch((err) => {
          console.warn('DB conversation RPC background notice:', err);
        });

      return { success: true, conversationId: newConvId };
    },
    [user, allUsers, allConversations, canMessageStudent, markAsRead]
  );

  // Send message
  const sendMessage = useCallback(
    (
      conversationId: string,
      content: string,
      type: MessageType = 'text',
      options?: {
        resourceUrl?: string;
        resourceTitle?: string;
        invitation?: SkillInvitationData;
      }
    ): { success: boolean; error?: string } => {
      if (!user) return { success: false, error: 'Must be logged in to send messages.' };

      const conv = allConversations.find((c) => c.id === conversationId);
      if (!conv) return { success: false, error: 'Conversation not found.' };

      if (!conv.participantIds.includes(user.id)) {
        return { success: false, error: 'Access denied: You are not a participant in this conversation.' };
      }

      const trimmedContent = content.trim();
      if (!trimmedContent && type !== 'skill_invitation') {
        return { success: false, error: 'Message cannot be empty.' };
      }

      const now = new Date().toISOString();
      const tempId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      let lastMessagePreview = trimmedContent;
      if (type === 'skill_invitation') {
        lastMessagePreview = `Skill Swap Invitation: ${options?.invitation?.offeredSkillTitle || 'Skill'} ⇄ ${options?.invitation?.requestedSkillTitle || 'Skill'}`;
      } else if (type === 'resource') {
        lastMessagePreview = options?.resourceTitle ? `Shared resource: ${options.resourceTitle}` : trimmedContent;
      }

      const optimisticMsg: Message = {
        id: tempId,
        conversationId,
        senderId: user.id,
        senderName: user.name,
        senderAvatar: user.avatar,
        type,
        content: trimmedContent,
        resourceUrl: options?.resourceUrl,
        resourceTitle: options?.resourceTitle,
        invitation: options?.invitation,
        createdAt: now,
        readBy: [user.id],
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
              if (pId !== user.id) {
                nextUnread[pId] = (nextUnread[pId] || 0) + 1;
              }
            });
            return {
              ...c,
              updatedAt: now,
              lastMessage: {
                text: lastMessagePreview,
                senderId: user.id,
                createdAt: now,
                type,
              },
              unreadCounts: nextUnread,
            };
          }
          return c;
        })
      );

      // Persist to Supabase
      sendDirectMessage({
        conversationId,
        senderId: user.id,
        content: trimmedContent,
        type,
        resourceUrl: options?.resourceUrl,
        resourceTitle: options?.resourceTitle,
      }).catch((err) => {
        console.warn('Failed to persist message in Supabase:', err);
      });

      return { success: true };
    },
    [user, allConversations]
  );

  // Send contextual Skill Swap invitation
  const sendSkillSwapInvitation = useCallback(
    (
      conversationId: string,
      payload: SendInvitationPayload
    ): { success: boolean; error?: string } => {
      if (!user) return { success: false, error: 'Must be logged in.' };

      const conv = allConversations.find((c) => c.id === conversationId);
      const partnerId = conv?.participantIds.find((id) => id !== user.id) || '';

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

      const res = sendMessage(
        conversationId,
        payload.note
          ? `Skill Swap Invitation: ${payload.offeredSkillTitle} ⇄ ${payload.requestedSkillTitle}\n"${payload.note}"`
          : `Skill Swap Invitation: ${payload.offeredSkillTitle} ⇄ ${payload.requestedSkillTitle}`,
        'skill_invitation',
        { invitation: invitationData }
      );

      if (partnerId) {
        sendSkillSwapInvitationRpc({
          conversationId,
          recipientId: partnerId,
          offeredSkillId: payload.offeredSkillId,
          offeredSkillTitle: payload.offeredSkillTitle,
          requestedSkillId: payload.requestedSkillId,
          requestedSkillTitle: payload.requestedSkillTitle,
          credits: payload.credits,
          note: payload.note,
        }).catch((err) => {
          console.warn('RPC invitation background error:', err);
        });
      }

      if (res.success) {
        setToast({
          message: 'Skill Swap invitation sent successfully!',
          type: 'success',
        });
      }

      return res;
    },
    [user, allConversations, sendMessage]
  );

  // Respond to contextual Skill Swap invitation
  const respondToSkillSwapInvitation = useCallback(
    (messageId: string, accept: boolean): { success: boolean; error?: string } => {
      if (!user) return { success: false, error: 'Must be logged in.' };

      const newStatus = accept ? 'accepted' : 'declined';
      const now = new Date().toISOString();

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

      let targetInvitationId: string = messageId;
      Object.values(messagesByConv).forEach((msgs) => {
        const found = msgs.find((m) => m.id === messageId);
        if (found?.invitation?.invitationId) {
          targetInvitationId = found.invitation.invitationId;
        }
      });

      respondToSkillSwapInvitationRpc(targetInvitationId, accept).catch((err) => {
        console.warn('RPC respond invitation error:', err);
      });

      setToast({
        message: accept ? 'Invitation accepted! Booking is now available.' : 'Invitation declined.',
        type: accept ? 'success' : 'info',
      });

      return { success: true };
    },
    [user, messagesByConv]
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
