import { supabase } from './supabase';
import {
  User,
  Skill,
  Session,
  CreditTransaction,
  College,
  CommunityPost,
  LearningGroup,
  StudentConnection,
  Conversation,
  Message,
  MessageType,
  SkillInvitationData,
} from '@/types';

// ==============================================================================
// 1. PROFILES & USERS
// ==============================================================================

export async function fetchUserProfile(userId: string): Promise<User | null> {
  if (!supabase) return null;

  try {
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr || !profile) {
      if (profileErr) console.warn('[fetchUserProfile] Profile query error:', profileErr.message);
      return null;
    }

    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      avatar:
        profile.avatar_url ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile.name || profile.email)}`,
      university: profile.university || 'University Student',
      major: profile.major || 'General Studies',
      graduationYear: profile.graduation_year || '2026',
      bio: profile.bio || 'Passionate student learning and teaching on SwapStudy.',
      credits: wallet?.balance ?? 0,
      repRating: Number(profile.rep_rating) || 5.0,
      totalHoursTaught: Number(profile.total_hours_taught) || 0,
      totalHoursLearned: Number(profile.total_hours_learned) || 0,
      skillsToTeach: profile.skills_to_teach || [],
      skillsToLearn: profile.skills_to_learn || [],
      createdAt: profile.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      collegeId: profile.college_id || undefined,
      isCollegeVerified: Boolean(profile.is_college_verified),
    };
  } catch (err) {
    console.error('[fetchUserProfile] Unexpected error:', err);
    return null;
  }
}

export async function fetchCollegePeers(collegeId?: string): Promise<User[]> {
  if (!supabase) return [];

  try {
    let query = supabase.from('profiles').select('*');
    if (collegeId) {
      query = query.eq('college_id', collegeId);
    }

    const { data: profiles, error } = await query;
    if (error || !profiles) {
      if (error) console.warn('[fetchCollegePeers] Error:', error.message);
      return [];
    }

    const userIds = profiles.map((p) => p.id);
    const walletsMap: Record<string, number> = {};

    if (userIds.length > 0) {
      const { data: wallets } = await supabase
        .from('wallets')
        .select('user_id, balance')
        .in('user_id', userIds);

      if (wallets) {
        wallets.forEach((w) => {
          walletsMap[w.user_id] = w.balance;
        });
      }
    }

    return profiles.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      avatar:
        p.avatar_url ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.name || p.email)}`,
      university: p.university || 'University Student',
      major: p.major || 'General Studies',
      graduationYear: p.graduation_year || '2026',
      bio: p.bio || '',
      credits: walletsMap[p.id] ?? 0,
      repRating: Number(p.rep_rating) || 5.0,
      totalHoursTaught: Number(p.total_hours_taught) || 0,
      totalHoursLearned: Number(p.total_hours_learned) || 0,
      skillsToTeach: p.skills_to_teach || [],
      skillsToLearn: p.skills_to_learn || [],
      createdAt: p.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      collegeId: p.college_id || undefined,
      isCollegeVerified: Boolean(p.is_college_verified),
    }));
  } catch (err) {
    console.error('[fetchCollegePeers] Unexpected error:', err);
    return [];
  }
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<User>
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Database not connected' };

  try {
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.avatar !== undefined) payload.avatar_url = updates.avatar;
    if (updates.bio !== undefined) payload.bio = updates.bio;
    if (updates.major !== undefined) payload.major = updates.major;
    if (updates.graduationYear !== undefined) payload.graduation_year = updates.graduationYear;
    if (updates.skillsToTeach !== undefined) payload.skills_to_teach = updates.skillsToTeach;
    if (updates.skillsToLearn !== undefined) payload.skills_to_learn = updates.skillsToLearn;

    const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update profile' };
  }
}

export async function submitCollegeVerification(
  collegeId: string,
  institutionalEmail: string,
  studentIdNumber?: string,
  documentUrl?: string
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  if (!supabase) return { success: false, error: 'Database not connected' };

  try {
    const { data, error } = await supabase.rpc('fn_submit_college_verification', {
      p_college_id: collegeId,
      p_institutional_email: institutionalEmail,
      p_student_id_number: studentIdNumber || null,
      p_document_url: documentUrl || null,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, requestId: data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Verification submission failed' };
  }
}

// ==============================================================================
// 2. SKILLS
// ==============================================================================

export async function fetchSkills(collegeId?: string): Promise<Skill[]> {
  if (!supabase) return [];

  try {
    let query = supabase
      .from('skills')
      .select(`
        *,
        teacher:profiles!skills_teacher_id_fkey(
          id, name, avatar_url, university, major, rep_rating
        )
      `)
      .order('created_at', { ascending: false });

    if (collegeId) {
      query = query.eq('college_id', collegeId);
    }

    const { data, error } = await query;
    if (error || !data) {
      if (error) console.warn('[fetchSkills] Error:', error.message);
      return [];
    }

    return data.map((r: any) => ({
      id: r.id,
      teacherId: r.teacher_id,
      teacherName: r.teacher?.name || 'Student Teacher',
      teacherAvatar:
        r.teacher?.avatar_url ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.teacher_id}`,
      teacherUniversity: r.teacher?.university || 'University Student',
      teacherMajor: r.teacher?.major || 'General Studies',
      teacherRating: Number(r.teacher?.rep_rating) || 5.0,
      title: r.title,
      category: r.category,
      level: r.level,
      hourlyCredits: r.hourly_credits,
      description: r.description,
      topics: r.topics || [],
      prerequisites: r.prerequisites || [],
      sessionDurationMinutes: r.session_duration_minutes || 60,
      reviewsCount: r.reviews_count || 0,
      isPopular: r.is_popular,
    }));
  } catch (err) {
    console.error('[fetchSkills] Unexpected error:', err);
    return [];
  }
}

export async function createSkillListing(
  teacherId: string,
  collegeId: string,
  skillData: {
    title: string;
    category: string;
    level: string;
    hourlyCredits: number;
    description: string;
    topics?: string[];
    prerequisites?: string[];
    sessionDurationMinutes?: number;
  }
): Promise<{ success: boolean; skillId?: string; error?: string }> {
  if (!supabase) return { success: false, error: 'Database not connected' };

  try {
    const { data, error } = await supabase
      .from('skills')
      .insert({
        teacher_id: teacherId,
        college_id: collegeId,
        title: skillData.title,
        category: skillData.category,
        level: skillData.level,
        hourly_credits: skillData.hourlyCredits,
        description: skillData.description,
        topics: skillData.topics || [],
        prerequisites: skillData.prerequisites || [],
        session_duration_minutes: skillData.sessionDurationMinutes || 60,
      })
      .select('id')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, skillId: data?.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to list skill' };
  }
}

// ==============================================================================
// 3. SESSIONS & ESCROW
// ==============================================================================

export async function fetchUserSessions(userId: string): Promise<Session[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        teacher:profiles!sessions_teacher_id_fkey(id, name, avatar_url),
        learner:profiles!sessions_learner_id_fkey(id, name, avatar_url)
      `)
      .or(`teacher_id.eq.${userId},learner_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error || !data) {
      if (error) console.warn('[fetchUserSessions] Error:', error.message);
      return [];
    }

    return data.map((r: any) => ({
      id: r.id,
      skillId: r.skill_id,
      skillTitle: r.skill_title,
      category: r.category,
      teacherId: r.teacher_id,
      teacherName: r.teacher?.name || 'Teacher',
      teacherAvatar:
        r.teacher?.avatar_url ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.teacher_id}`,
      learnerId: r.learner_id,
      learnerName: r.learner?.name || 'Learner',
      learnerAvatar:
        r.learner?.avatar_url ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.learner_id}`,
      credits: r.credits,
      date: r.date,
      time: r.time,
      durationMinutes: r.duration_minutes || 60,
      status: r.status,
      meetingLink: r.meeting_link,
      learnerNotes: r.learner_notes,
      teacherNotes: r.teacher_notes,
      createdAt: r.created_at,
      completedAt: r.completed_at,
      ratingGiven: r.rating_given,
      reviewGiven: r.review_given,
    }));
  } catch (err) {
    console.error('[fetchUserSessions] Unexpected error:', err);
    return [];
  }
}

export async function bookSessionWithEscrow(params: {
  skillId: string;
  date: string;
  time: string;
  notes?: string;
}): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  if (!supabase) return { success: false, error: 'Database not connected' };

  try {
    const { data: sessionId, error } = await supabase.rpc('fn_book_session_with_escrow', {
      p_skill_id: params.skillId,
      p_date: params.date,
      p_time: params.time,
      p_notes: params.notes || null,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, sessionId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to book session' };
  }
}

export async function acceptSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Database not connected' };

  try {
    const meetingLink = `https://meet.jit.si/swapstudy-${sessionId.substring(0, 8)}`;
    const { error } = await supabase
      .from('sessions')
      .update({
        status: 'confirmed',
        meeting_link: meetingLink,
      })
      .eq('id', sessionId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to accept session' };
  }
}

export async function declineOrCancelSession(
  sessionId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Database not connected' };

  try {
    const { error } = await supabase.rpc('fn_decline_or_cancel_session', {
      p_session_id: sessionId,
      p_reason: reason || 'Cancelled by user',
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to decline or cancel session' };
  }
}

export async function completeSession(
  sessionId: string,
  rating: number,
  reviewText: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Database not connected' };

  try {
    const { error } = await supabase.rpc('fn_complete_session', {
      p_session_id: sessionId,
      p_rating: rating,
      p_review: reviewText,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to complete session' };
  }
}

// ==============================================================================
// 4. WALLET & TRANSACTIONS
// ==============================================================================

export async function fetchCreditTransactions(userId: string): Promise<CreditTransaction[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      if (error) console.warn('[fetchCreditTransactions] Error:', error.message);
      return [];
    }

    return data.map((t: any) => {
      let mappedType: 'earned_teaching' | 'spent_learning' | 'signup_bonus' | 'refund' = 'signup_bonus';
      let title = 'Credit Transaction';

      if (t.type === 'signup_bonus') {
        mappedType = 'signup_bonus';
        title = 'Welcome Bonus Granted';
      } else if (t.type === 'session_earned') {
        mappedType = 'earned_teaching';
        title = 'Teaching Session Completed';
      } else if (t.type === 'session_spent') {
        mappedType = 'spent_learning';
        title = 'Learning Session Booked (Escrow)';
      } else {
        mappedType = 'refund';
        title = 'Session Cancelled (Refund)';
      }

      return {
        id: t.id,
        userId: t.user_id,
        amount: t.amount,
        type: mappedType,
        title,
        description: t.description || '',
        date: t.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        sessionId: t.reference_id,
      };
    });
  } catch (err) {
    console.error('[fetchCreditTransactions] Unexpected error:', err);
    return [];
  }
}

// ==============================================================================
// 5. COMMUNITY POSTS & GROUPS
// ==============================================================================

export async function fetchColleges(): Promise<College[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.from('colleges').select('*');
    if (error || !data) return [];

    return data.map((c: any) => ({
      id: c.id,
      name: c.name,
      shortName: c.short_name,
      domain: c.domain,
      location: c.location,
      mascot: c.mascot || 'Mascot',
      badgeColor: c.badge_color || '#059669',
      memberCount: 0,
      verifiedCount: 0,
      description: c.description || '',
    }));
  } catch (err) {
    console.error('[fetchColleges] Error:', err);
    return [];
  }
}

export async function fetchCommunityPosts(collegeId?: string): Promise<CommunityPost[]> {
  if (!supabase) return [];

  try {
    let query = supabase
      .from('community_posts')
      .select(`
        *,
        author:profiles!community_posts_author_id_fkey(
          id, name, avatar_url, major, is_college_verified
        ),
        comments:post_comments(
          id, post_id, author_id, content, created_at,
          author:profiles!post_comments_author_id_fkey(
            id, name, avatar_url, college_id, is_college_verified
          )
        ),
        likes:post_likes(user_id),
        bookmarks:post_bookmarks(user_id)
      `)
      .order('created_at', { ascending: false });

    if (collegeId) {
      query = query.eq('college_id', collegeId);
    }

    const { data, error } = await query;
    if (error || !data) {
      if (error) console.warn('[fetchCommunityPosts] Error:', error.message);
      return [];
    }

    return data.map((p: any) => ({
      id: p.id,
      collegeId: p.college_id,
      authorId: p.author_id,
      authorName: p.author?.name || 'Anonymous Student',
      authorAvatar:
        p.author?.avatar_url ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.author_id}`,
      authorMajor: p.author?.major || 'General Studies',
      isAuthorVerified: Boolean(p.author?.is_college_verified),
      category: p.category as any,
      title: p.title,
      content: p.content,
      tags: p.tags || [],
      resourceUrl: p.resource_url,
      likesCount: p.likes?.length || 0,
      likedBy: p.likes ? p.likes.map((l: any) => l.user_id) : [],
      savedBy: p.bookmarks ? p.bookmarks.map((b: any) => b.user_id) : [],
      comments: (p.comments || []).map((c: any) => ({
        id: c.id,
        postId: c.post_id,
        authorId: c.author_id,
        authorName: c.author?.name || 'Student',
        authorAvatar:
          c.author?.avatar_url ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.author_id}`,
        authorCollegeId: c.author?.college_id || '',
        isAuthorVerified: Boolean(c.author?.is_college_verified),
        content: c.content,
        createdAt: c.created_at,
        likesCount: 0,
      })),
      createdAt: p.created_at,
    }));
  } catch (err) {
    console.error('[fetchCommunityPosts] Unexpected error:', err);
    return [];
  }
}

export async function createCommunityPost(params: {
  collegeId: string;
  authorId: string;
  title: string;
  content: string;
  category: string;
  tags?: string[];
  resourceUrl?: string;
}): Promise<{ success: boolean; post?: CommunityPost; error?: string }> {
  if (!supabase) return { success: false, error: 'Database not connected' };

  try {
    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        college_id: params.collegeId,
        author_id: params.authorId,
        title: params.title,
        content: params.content,
        category: params.category,
        tags: params.tags || [],
        resource_url: params.resourceUrl || null,
      })
      .select(`
        *,
        author:profiles!community_posts_author_id_fkey(
          id, name, avatar_url, major, is_college_verified
        )
      `)
      .single();

    if (error || !data) return { success: false, error: error?.message || 'Failed to create post' };

    const post: CommunityPost = {
      id: data.id,
      collegeId: data.college_id,
      authorId: data.author_id,
      authorName: data.author?.name || 'Student',
      authorAvatar:
        data.author?.avatar_url ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.author_id}`,
      authorMajor: data.author?.major || 'General Studies',
      isAuthorVerified: Boolean(data.author?.is_college_verified),
      category: data.category as any,
      title: data.title,
      content: data.content,
      tags: data.tags || [],
      resourceUrl: data.resource_url,
      likesCount: 0,
      likedBy: [],
      savedBy: [],
      comments: [],
      createdAt: data.created_at,
    };

    return { success: true, post };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create post' };
  }
}

export async function togglePostLike(
  postId: string,
  userId: string,
  isCurrentlyLiked: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Database not connected' };

  try {
    if (isCurrentlyLiked) {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: userId });
      if (error) return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function addPostComment(
  postId: string,
  authorId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Database not connected' };

  try {
    const { error } = await supabase.from('post_comments').insert({
      post_id: postId,
      author_id: authorId,
      content,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function togglePostBookmark(
  postId: string,
  userId: string,
  isCurrentlySaved: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Database not connected' };

  try {
    if (isCurrentlySaved) {
      const { error } = await supabase
        .from('post_bookmarks')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase
        .from('post_bookmarks')
        .insert({ post_id: postId, user_id: userId });
      if (error) return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchLearningGroups(collegeId?: string): Promise<LearningGroup[]> {
  if (!supabase) return [];

  try {
    let query = supabase
      .from('learning_groups')
      .select(`
        *,
        creator:profiles!learning_groups_creator_id_fkey(
          id, name, avatar_url, is_college_verified
        ),
        members:learning_group_members(user_id)
      `)
      .order('created_at', { ascending: false });

    if (collegeId) {
      query = query.eq('college_id', collegeId);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((g: any) => ({
      id: g.id,
      collegeId: g.college_id,
      name: g.name,
      description: g.description,
      topic: g.topic,
      skillLevel: g.skill_level,
      creatorId: g.creator_id,
      creatorName: g.creator?.name || 'Group Creator',
      creatorAvatar:
        g.creator?.avatar_url ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${g.creator_id}`,
      isCreatorVerified: Boolean(g.creator?.is_college_verified),
      memberIds: (g.members || []).map((m: any) => m.user_id),
      meetingCadence: g.meeting_cadence,
      createdAt: g.created_at,
    }));
  } catch (err) {
    console.error('[fetchLearningGroups] Error:', err);
    return [];
  }
}

export async function createLearningGroup(params: {
  collegeId: string;
  creatorId: string;
  name: string;
  description: string;
  topic: string;
  skillLevel: string;
  meetingCadence?: string;
}): Promise<{ success: boolean; group?: LearningGroup; error?: string }> {
  if (!supabase) return { success: false, error: 'Database not connected' };

  try {
    const { data, error } = await supabase
      .from('learning_groups')
      .insert({
        college_id: params.collegeId,
        creator_id: params.creatorId,
        name: params.name,
        description: params.description,
        topic: params.topic,
        skill_level: params.skillLevel,
        meeting_cadence: params.meetingCadence || null,
      })
      .select(`
        *,
        creator:profiles!learning_groups_creator_id_fkey(
          id, name, avatar_url, is_college_verified
        )
      `)
      .single();

    if (error || !data) return { success: false, error: error?.message || 'Failed to create group' };

    const group: LearningGroup = {
      id: data.id,
      collegeId: data.college_id,
      name: data.name,
      description: data.description,
      topic: data.topic,
      skillLevel: data.skill_level,
      creatorId: data.creator_id,
      creatorName: data.creator?.name || 'Group Creator',
      creatorAvatar:
        data.creator?.avatar_url ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.creator_id}`,
      isCreatorVerified: Boolean(data.creator?.is_college_verified),
      memberIds: [params.creatorId],
      meetingCadence: data.meeting_cadence,
      createdAt: data.created_at,
    };

    return { success: true, group };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create group' };
  }
}

export async function joinLearningGroup(
  groupId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Database not connected' };

  try {
    const { error } = await supabase
      .from('learning_group_members')
      .insert({ group_id: groupId, user_id: userId });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function leaveLearningGroup(
  groupId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Database not connected' };

  try {
    const { error } = await supabase
      .from('learning_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchStudentConnections(userId: string): Promise<StudentConnection[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('student_connections')
      .select('*')
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

    if (error || !data) return [];

    return data.map((c: any) => ({
      id: c.id,
      collegeId: c.college_id,
      requesterId: c.requester_id,
      receiverId: c.receiver_id,
      status: c.status,
      createdAt: c.created_at,
      note: c.note,
    }));
  } catch (err) {
    console.error('[fetchStudentConnections] Error:', err);
    return [];
  }
}

export async function sendConnectionRequest(params: {
  collegeId: string;
  requesterId: string;
  receiverId: string;
  note?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Database not connected' };

  try {
    const { error } = await supabase.from('student_connections').insert({
      college_id: params.collegeId,
      requester_id: params.requesterId,
      receiver_id: params.receiverId,
      status: 'pending',
      note: params.note || null,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function respondToConnectionRequest(
  connectionId: string,
  status: 'accepted' | 'declined'
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Database not connected' };

  try {
    const { error } = await supabase
      .from('student_connections')
      .update({ status })
      .eq('id', connectionId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ==============================================================================
// 6. MESSAGING & REALTIME DIRECT CONVERSATIONS
// ==============================================================================

export async function fetchUserConversations(userId: string): Promise<Conversation[]> {
  if (!supabase) return [];

  try {
    // 1. Get all conversations the user participates in
    const { data: participations, error: pErr } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id, unread_count,
        conv:conversations(id, college_id, is_group, group_name, created_at, last_message_at)
      `)
      .eq('user_id', userId);

    if (pErr || !participations) return [];

    const convIds = participations.map((p: any) => p.conversation_id);
    if (convIds.length === 0) return [];

    // 2. Fetch all participants for these conversations
    const { data: allParticipants } = await supabase
      .from('conversation_participants')
      .select('conversation_id, user_id, unread_count')
      .in('conversation_id', convIds);

    // 3. Fetch the latest message for each conversation
    const { data: latestMsgs } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false });

    const latestMsgByConv: Record<string, any> = {};
    if (latestMsgs) {
      latestMsgs.forEach((m: any) => {
        if (!latestMsgByConv[m.conversation_id]) {
          latestMsgByConv[m.conversation_id] = m;
        }
      });
    }

    const participantsByConv: Record<string, string[]> = {};
    const unreadByConv: Record<string, Record<string, number>> = {};

    if (allParticipants) {
      allParticipants.forEach((p: any) => {
        if (!participantsByConv[p.conversation_id]) participantsByConv[p.conversation_id] = [];
        participantsByConv[p.conversation_id].push(p.user_id);

        if (!unreadByConv[p.conversation_id]) unreadByConv[p.conversation_id] = {};
        unreadByConv[p.conversation_id][p.user_id] = p.unread_count || 0;
      });
    }

    return participations
      .filter((p: any) => p.conv)
      .map((p: any) => {
        const c = p.conv;
        const last = latestMsgByConv[c.id];
        return {
          id: c.id,
          collegeId: c.college_id,
          participantIds: participantsByConv[c.id] || [userId],
          createdAt: c.created_at,
          updatedAt: c.last_message_at || c.created_at,
          isGroup: c.is_group,
          groupName: c.group_name,
          unreadCounts: unreadByConv[c.id] || { [userId]: p.unread_count || 0 },
          lastMessage: last
            ? {
                text: last.content,
                senderId: last.sender_id,
                createdAt: last.created_at,
                type: last.type,
              }
            : undefined,
        };
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (err) {
    console.error('[fetchUserConversations] Error:', err);
    return [];
  }
}

export async function getOrCreateDirectConversation(
  peerId: string
): Promise<{ success: boolean; conversationId?: string; error?: string }> {
  if (!supabase) return { success: false, error: 'Database not connected' };

  try {
    const { data: convId, error } = await supabase.rpc(
      'fn_get_or_create_direct_conversation',
      { p_peer_id: peerId }
    );

    if (error) return { success: false, error: error.message };
    return { success: true, conversationId: convId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to start conversation' };
  }
}

export async function fetchConversationMessages(conversationId: string): Promise<Message[]> {
  if (!supabase) return [];

  try {
    const { data: rawMsgs, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles(id, name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error || !rawMsgs) return [];

    // Fetch any skill swap invitations linked to this conversation
    const { data: rawInvites } = await supabase
      .from('skill_swap_invitations')
      .select('*')
      .eq('conversation_id', conversationId);

    const invitesByMsgId: Record<string, any> = {};
    if (rawInvites) {
      rawInvites.forEach((inv: any) => {
        invitesByMsgId[inv.message_id] = inv;
      });
    }

    return rawMsgs.map((m: any) => {
      const inv = invitesByMsgId[m.id];
      let invitationData: SkillInvitationData | undefined;

      if (inv) {
        invitationData = {
          invitationId: inv.id,
          offeredSkillId: inv.offered_skill_id,
          offeredSkillTitle: inv.offered_skill_title || 'Offered Skill',
          requestedSkillId: inv.requested_skill_id,
          requestedSkillTitle: inv.requested_skill_title || 'Requested Skill',
          credits: inv.credits || 1,
          status: inv.status,
          note: inv.note,
          respondedAt: inv.responded_at,
        };
      }

      return {
        id: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        senderName: m.sender?.name || 'Student',
        senderAvatar:
          m.sender?.avatar_url ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.sender_id}`,
        type: m.type as MessageType,
        content: m.content,
        resourceUrl: m.resource_url,
        resourceTitle: m.resource_title,
        invitation: invitationData,
        createdAt: m.created_at,
        readBy: m.read_by || [],
      };
    });
  } catch (err) {
    console.error('[fetchConversationMessages] Error:', err);
    return [];
  }
}

export async function sendDirectMessage(params: {
  conversationId: string;
  senderId: string;
  content: string;
  type?: MessageType;
  resourceUrl?: string;
  resourceTitle?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!supabase) return { success: false, error: 'Database not connected' };

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: params.conversationId,
        sender_id: params.senderId,
        content: params.content,
        type: params.type || 'text',
        resource_url: params.resourceUrl || null,
        resource_title: params.resourceTitle || null,
        read_by: [params.senderId],
      })
      .select('id')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, messageId: data?.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function markConversationRead(conversationId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.rpc('fn_mark_conversation_read', {
      p_conversation_id: conversationId,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function sendSkillSwapInvitationRpc(params: {
  conversationId: string;
  recipientId: string;
  offeredSkillId: string;
  offeredSkillTitle: string;
  requestedSkillId: string;
  requestedSkillTitle: string;
  credits: number;
  note?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Database not connected' };

  try {
    const { error } = await supabase.rpc('fn_send_skill_swap_invitation', {
      p_conversation_id: params.conversationId,
      p_recipient_id: params.recipientId,
      p_offered_skill_id: params.offeredSkillId,
      p_offered_skill_title: params.offeredSkillTitle,
      p_requested_skill_id: params.requestedSkillId,
      p_requested_skill_title: params.requestedSkillTitle,
      p_credits: params.credits,
      p_note: params.note || null,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function respondToSkillSwapInvitationRpc(
  invitationId: string,
  accept: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Database not connected' };

  try {
    const { error } = await supabase.rpc('fn_respond_to_skill_swap_invitation', {
      p_invitation_id: invitationId,
      p_accept: accept,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
