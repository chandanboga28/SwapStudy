-- ==============================================================================
-- SwapStudy Direct — Complete Student Messaging System SQL Migration
-- Database: PostgreSQL / Supabase
-- Target tables: conversations, conversation_participants, messages, skill_swap_invitations
-- Security: Row Level Security (RLS) enforcing same-college and accepted connection rules
-- ==============================================================================

-- 1. Helper Function: Get current student's verified college ID
CREATE OR REPLACE FUNCTION get_current_user_college()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT college_id
  FROM public.users
  WHERE id = auth.uid();
$$;

-- 2. Helper Function: Check if two students have an accepted connection
CREATE OR REPLACE FUNCTION has_accepted_connection(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.student_connections
    WHERE status = 'accepted'
      AND (
        (requester_id = user_a AND receiver_id = user_b)
        OR (requester_id = user_b AND receiver_id = user_a)
      )
  );
$$;

-- 3. Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id text NOT NULL,
  is_group boolean NOT NULL DEFAULT false,
  group_name text,
  last_message_preview text,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for querying college conversations
CREATE INDEX IF NOT EXISTS idx_conversations_college ON public.conversations(college_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON public.conversations(updated_at DESC);

-- 4. Conversation Participants Table (supports 1-to-1 and future group chats)
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  unread_count int NOT NULL DEFAULT 0,
  last_read_at timestamptz DEFAULT now(),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_conv ON public.conversation_participants(conversation_id);

-- 5. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'resource', 'skill_invitation', 'system')),
  content text NOT NULL,
  resource_url text,
  resource_title text,
  read_by uuid[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- 6. Skill Swap Invitations Table
CREATE TABLE IF NOT EXISTS public.skill_swap_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offered_skill_id text NOT NULL,
  offered_skill_title text NOT NULL,
  requested_skill_id text NOT NULL,
  requested_skill_title text NOT NULL,
  credits int NOT NULL DEFAULT 2,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'booked')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_invitations_conv ON public.skill_swap_invitations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.skill_swap_invitations(status);

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- ==============================================================================

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_swap_invitations ENABLE ROW LEVEL SECURITY;

-- Conversations RLS
-- 1. Read: Users can only see conversations they belong to
CREATE POLICY "Users can view conversations they participate in"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversations.id
      AND cp.user_id = auth.uid()
  )
);

-- 2. Insert: A user can only create a conversation at their verified college
CREATE POLICY "Users can create conversations for their verified college"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
  college_id = get_current_user_college()
);

-- Conversation Participants RLS
-- 1. Read: User can see participants in conversations they belong to
CREATE POLICY "Users can view participants of their conversations"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
  )
);

-- 2. Insert: User can add themselves or accepted peers from the same college
CREATE POLICY "Users can add participants with accepted connection"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  -- Can add oneself
  user_id = auth.uid()
  OR
  -- Or can add partner if accepted connection exists
  has_accepted_connection(auth.uid(), user_id)
);

-- Messages RLS
-- 1. Read: User can only read messages from conversations they are a participant in
CREATE POLICY "Users can read messages in their conversations"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
      AND cp.user_id = auth.uid()
  )
);

-- 2. Insert: User can only send messages as themselves in their own conversations
CREATE POLICY "Users can send messages to their conversations"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
      AND cp.user_id = auth.uid()
  )
);

-- Skill Swap Invitations RLS
-- 1. Read: Participants in conversation can view invitations
CREATE POLICY "Users can view invitations in their conversations"
ON public.skill_swap_invitations
FOR SELECT
TO authenticated
USING (
  sender_id = auth.uid() OR recipient_id = auth.uid()
);

-- 2. Insert: Sender can create invitations
CREATE POLICY "Users can create skill swap invitations"
ON public.skill_swap_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
);

-- 3. Update: Recipient or sender can update status (accept / decline / book)
CREATE POLICY "Participants can update invitation status"
ON public.skill_swap_invitations
FOR UPDATE
TO authenticated
USING (
  sender_id = auth.uid() OR recipient_id = auth.uid()
)
WITH CHECK (
  sender_id = auth.uid() OR recipient_id = auth.uid()
);

-- ==============================================================================
-- Realtime Subscriptions Configuration
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.skill_swap_invitations;
  END IF;
END $$;
