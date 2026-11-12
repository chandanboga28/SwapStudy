export type SkillCategory =
  | 'Programming & Tech'
  | 'Design & Creative'
  | 'Academics & Science'
  | 'Media & Production'
  | 'Business & Career'
  | 'Language & Writing';

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';

export interface Review {
  id: string;
  skillId?: string;
  teacherId?: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  skillTitle: string;
}

export interface Skill {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherAvatar: string;
  teacherUniversity: string;
  teacherMajor: string;
  teacherRating: number;
  title: string;
  category: SkillCategory;
  level: SkillLevel;
  hourlyCredits: number; // 1 to 5
  description: string;
  topics: string[];
  prerequisites?: string[];
  sessionDurationMinutes: number; // e.g. 45 or 60
  reviewsCount: number;
  isPopular?: boolean;
}

export type SessionStatus = 'pending' | 'confirmed' | 'completed' | 'declined' | 'cancelled';

export interface Session {
  id: string;
  skillId: string;
  skillTitle: string;
  category: SkillCategory;
  teacherId: string;
  teacherName: string;
  teacherAvatar: string;
  learnerId: string;
  learnerName: string;
  learnerAvatar: string;
  credits: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMinutes: number;
  status: SessionStatus;
  meetingLink?: string;
  meetingUrl?: string | null;
  learnerNotes?: string;
  teacherNotes?: string;
  createdAt: string;
  completedAt?: string;
  ratingGiven?: number;
  reviewGiven?: string;
  swapInvitationId?: string;
  isMutualSwap?: boolean;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number; // positive for earned, negative for spent
  type: 'earned_teaching' | 'spent_learning' | 'signup_bonus' | 'refund';
  title: string;
  description: string;
  date: string;
  sessionId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  university: string;
  major: string;
  graduationYear: string;
  bio: string;
  credits: number;
  repRating: number;
  totalHoursTaught: number;
  totalHoursLearned: number;
  skillsToTeach: string[]; // skill titles or IDs
  skillsToLearn: string[]; // list of skills desired
  createdAt: string;
  isDemo?: boolean;
  collegeId?: string;
  isCollegeVerified?: boolean;
}

export interface College {
  id: string; // e.g. 'adypu'
  name: string; // 'Ajeenkya DY Patil University'
  shortName: string; // 'ADYPU'
  domain: string; // 'adypu.edu.in'
  location: string; // 'Pune, India'
  mascot: string; // 'Titans'
  badgeColor: string; // '#059669'
  memberCount: number;
  verifiedCount: number;
  description: string;
}

export type PostCategory = 'Discussions' | 'Questions' | 'Resources' | 'Achievements';

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorCollegeId: string;
  isAuthorVerified: boolean;
  content: string;
  createdAt: string;
  likesCount: number;
}

export interface CommunityPost {
  id: string;
  collegeId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorMajor: string;
  isAuthorVerified: boolean;
  category: PostCategory;
  title: string;
  content: string;
  tags: string[];
  relatedSkillId?: string;
  relatedSkillTitle?: string;
  resourceUrl?: string;
  likesCount: number;
  likedBy: string[]; // user IDs
  savedBy: string[]; // user IDs
  comments: PostComment[];
  createdAt: string;
}

export interface LearningGroup {
  id: string;
  collegeId: string;
  name: string;
  description: string;
  topic: string;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  isCreatorVerified: boolean;
  memberIds: string[];
  meetingCadence?: string;
  createdAt: string;
}

export type ConnectionStatus = 'pending' | 'accepted' | 'declined';

export interface StudentConnection {
  id: string;
  collegeId: string;
  requesterId: string;
  receiverId: string;
  status: ConnectionStatus;
  createdAt: string;
  note?: string;
}

export type MatchType = 'mutual' | 'one-way-learn' | 'one-way-teach';

export interface SmartMatch {
  candidate: User;
  matchType: MatchType;
  score: number; // 0 to 100
  compatibilityTier: 'Mutual Exchange' | 'High Match' | 'Compatible';
  skillTheyTeach: string;
  matchedListing: Skill | null;
  skillYouTeach?: string;
  creditCost: number;
  hasEnoughCredits: boolean;
  creditsNeeded: number;
  explanation: string;
  isExistingRequestPending: boolean;
  existingSessionStatus?: SessionStatus;
  pendingInvitationId?: string;
}

// ==========================================
// SwapStudy Direct — Student Messaging System
// ==========================================

export type MessageType = 'text' | 'resource' | 'skill_invitation' | 'system';

export type SkillInvitationStatus = 'pending' | 'accepted' | 'declined' | 'booked';

export interface SkillInvitationData {
  invitationId: string;
  offeredSkillId: string;
  offeredSkillTitle: string;
  offeredSkillCategory?: SkillCategory;
  requestedSkillId: string;
  requestedSkillTitle: string;
  requestedSkillCategory?: SkillCategory;
  credits: number;
  status: SkillInvitationStatus;
  note?: string;
  respondedAt?: string;
}

export interface SkillSwapInvitation {
  id: string;
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  senderUniversity?: string;
  senderMajor?: string;
  senderRating?: number;
  recipientId: string;
  recipientName?: string;
  recipientAvatar?: string;
  recipientUniversity?: string;
  recipientMajor?: string;
  offeredSkillId: string;
  offeredSkillTitle: string;
  requestedSkillId: string;
  requestedSkillTitle: string;
  credits: number;
  status: SkillInvitationStatus;
  note?: string;
  createdAt: string;
  respondedAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  type: MessageType;
  content: string;
  resourceUrl?: string;
  resourceTitle?: string;
  invitation?: SkillInvitationData;
  createdAt: string;
  readBy: string[];
}

export interface Conversation {
  id: string;
  collegeId: string;
  participantIds: string[];
  createdAt: string;
  updatedAt: string;
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: string;
    type: MessageType;
  };
  unreadCounts: Record<string, number>; // userId -> unread count
  isGroup?: boolean;
  groupName?: string;
}
