'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Conversation, Message, MessageType, SkillInvitationData, ConnectionStatus, User } from '@/types';
import { INITIAL_CONVERSATIONS, INITIAL_MESSAGES } from '@/lib/mock-messaging-data';
import { useAuth } from './AuthContext';
import { useCommunity } from './CommunityContext';

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

const CONVERSATIONS_STORAGE_KEY = 'swapstudy_conversations_data';
const MESSAGES_STORAGE_KEY = 'swapstudy_messages_data';

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const { user, allUsers } = useAuth();
  const { getConnectionStatus } = useCommunity();

  const [allConversations, setAllConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [allMessages, setAllMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'warning' } | null>(null);

  // Initialize from LocalStorage
  useEffect(() => {
    try {
      const storedConvs = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
      if (storedConvs) {
        setAllConversations(JSON.parse(storedConvs));
      } else {
        localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(INITIAL_CONVERSATIONS));
      }

      const storedMsgs = localStorage.getItem(MESSAGES_STORAGE_KEY);
      if (storedMsgs) {
        setAllMessages(JSON.parse(storedMsgs));
      } else {
        localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(INITIAL_MESSAGES));
      }
    } catch (e) {
      console.warn('Failed to parse messaging storage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(allConversations));
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(allMessages));
    } catch (e) {
      console.error('Failed to sync messaging state to localStorage', e);
    }
  }, [allConversations, allMessages, isLoaded]);

  // Filter conversations for current user
  const userConversations = useMemo(() => {
    if (!user) return [];
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
      setActiveConversationId(null);
      return;
    }
    // If current active conversation is not one of user's conversations, pick the first
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
    return allMessages
      .filter((m) => m.conversationId === activeConversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [allMessages, activeConversationId]);

  // Mark conversation as read
  const markAsRead = useCallback(
    (convId: string) => {
      if (!user) return;
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

      setAllMessages((prev) =>
        prev.map((m) => {
          if (m.conversationId === convId && !m.readBy.includes(user.id)) {
            return {
              ...m,
              readBy: [...m.readBy, user.id],
            };
          }
          return m;
        })
      );
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
      const userCollege = user.collegeId || 'uw';
      const targetCollege = targetUser.collegeId || 'uw';
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

  // Start new conversation or return existing
  const startConversationWith = useCallback(
    (targetUserId: string): { success: boolean; conversationId?: string; error?: string } => {
      if (!user) return { success: false, error: 'Must be logged in.' };

      const check = canMessageStudent(targetUserId);
      if (!check.allowed) {
        return { success: false, error: check.reason };
      }

      const targetUser = allUsers.find((u) => u.id === targetUserId);
      if (!targetUser) return { success: false, error: 'Student not found.' };

      // Prevent duplicate conversations between the same pair of students
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

      // Create new conversation
      const now = new Date().toISOString();
      const newConvId = `conv-${Date.now()}`;
      const newConv: Conversation = {
        id: newConvId,
        collegeId: user.collegeId || 'uw',
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

      const sysMessage: Message = {
        id: `msg-${Date.now()}-sys`,
        conversationId: newConvId,
        senderId: 'system',
        senderName: 'SwapStudy Direct',
        senderAvatar: '',
        type: 'system',
        content: `Direct conversation started between ${user.name} and ${targetUser.name}. Both students are verified members of ${user.university}.`,
        createdAt: now,
        readBy: [user.id, targetUserId],
      };

      setAllConversations((prev) => [newConv, ...prev]);
      setAllMessages((prev) => [...prev, sysMessage]);
      setActiveConversationId(newConvId);

      setToast({
        message: `Conversation started with ${targetUser.name}`,
        type: 'success',
      });

      return { success: true, conversationId: newConvId };
    },
    [user, allUsers, allConversations, canMessageStudent, markAsRead]
  );

  // Send message with optimistic update and validation
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

      // Re-verify eligibility with partner
      const partnerId = conv.participantIds.find((id) => id !== user.id);
      if (partnerId && !conv.isGroup) {
        const check = canMessageStudent(partnerId);
        if (!check.allowed) {
          return { success: false, error: `Cannot send message: ${check.reason}` };
        }
      }

      const trimmedContent = content.trim();
      if (!trimmedContent && type !== 'skill_invitation') {
        return { success: false, error: 'Message cannot be empty.' };
      }

      const now = new Date().toISOString();
      const newMsgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      let lastMessagePreview = trimmedContent;
      if (type === 'skill_invitation') {
        lastMessagePreview = `Skill Swap Invitation: ${options?.invitation?.offeredSkillTitle || 'Skill'} ⇄ ${options?.invitation?.requestedSkillTitle || 'Skill'}`;
      } else if (type === 'resource') {
        lastMessagePreview = options?.resourceTitle ? `Shared resource: ${options.resourceTitle}` : trimmedContent;
      }

      const newMessage: Message = {
        id: newMsgId,
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

      // Optimistic update
      setAllMessages((prev) => [...prev, newMessage]);

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

      return { success: true };
    },
    [user, allConversations, canMessageStudent]
  );

  // Send contextual Skill Swap invitation
  const sendSkillSwapInvitation = useCallback(
    (
      conversationId: string,
      payload: SendInvitationPayload
    ): { success: boolean; error?: string } => {
      if (!user) return { success: false, error: 'Must be logged in.' };

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
        {
          invitation: invitationData,
        }
      );

      if (res.success) {
        setToast({
          message: 'Skill Swap invitation sent successfully!',
          type: 'success',
        });
      }

      return res;
    },
    [user, sendMessage]
  );

  // Respond to contextual Skill Swap invitation
  const respondToSkillSwapInvitation = useCallback(
    (messageId: string, accept: boolean): { success: boolean; error?: string } => {
      if (!user) return { success: false, error: 'Must be logged in.' };

      const targetMsg = allMessages.find((m) => m.id === messageId);
      if (!targetMsg || !targetMsg.invitation) {
        return { success: false, error: 'Skill Swap invitation not found.' };
      }

      const newStatus = accept ? 'accepted' : 'declined';
      const now = new Date().toISOString();

      setAllMessages((prev) =>
        prev.map((m) => {
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
        })
      );

      // Create a system message acknowledging the response
      const systemContent = accept
        ? `${user.name} accepted the Skill Swap invitation (${targetMsg.invitation.offeredSkillTitle} ⇄ ${targetMsg.invitation.requestedSkillTitle}). You can now coordinate session times and proceed to booking!`
        : `${user.name} declined the Skill Swap invitation.`;

      const sysMsg: Message = {
        id: `msg-${Date.now()}-resp`,
        conversationId: targetMsg.conversationId,
        senderId: 'system',
        senderName: 'SwapStudy Direct',
        senderAvatar: '',
        type: 'system',
        content: systemContent,
        createdAt: now,
        readBy: [user.id],
      };

      setAllMessages((prev) => [...prev, sysMsg]);

      // Update conversation lastMessage
      setAllConversations((prev) =>
        prev.map((c) => {
          if (c.id === targetMsg.conversationId) {
            return {
              ...c,
              updatedAt: now,
              lastMessage: {
                text: systemContent,
                senderId: 'system',
                createdAt: now,
                type: 'system',
              },
            };
          }
          return c;
        })
      );

      setToast({
        message: accept ? 'Invitation accepted! Booking is now available.' : 'Invitation declined.',
        type: accept ? 'success' : 'info',
      });

      return { success: true };
    },
    [user, allMessages]
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
        isLoading: !isLoaded,
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
