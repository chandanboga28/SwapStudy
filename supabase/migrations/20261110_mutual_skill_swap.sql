-- ==============================================================================
-- SWAPSTUDY: Mutual Skill Swap Lifecycle & Reciprocal Exchange Procedure
-- Migration: 20261110_mutual_skill_swap.sql
-- ==============================================================================

-- 1. Add optional swap_invitation_id column to sessions to link reciprocal exchanges
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'sessions' 
      AND column_name = 'swap_invitation_id'
  ) THEN
    ALTER TABLE public.sessions
      ADD COLUMN swap_invitation_id uuid REFERENCES public.skill_swap_invitations(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sessions_swap_invitation ON public.sessions(swap_invitation_id);

-- Drop obsolete procedure signatures if existing
DROP FUNCTION IF EXISTS public.fn_accept_skill_swap_proposal(uuid, date, text);
DROP FUNCTION IF EXISTS public.fn_accept_skill_swap_proposal(uuid, date, text, date, text);

-- 2. Atomic Accept Procedure: Recipient accepts mutual swap proposal and schedules independent reciprocal sessions
CREATE OR REPLACE FUNCTION public.fn_accept_skill_swap_proposal(
  p_invitation_id uuid,
  p_session1_date date,
  p_session1_time text,
  p_session2_date date,
  p_session2_time text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_inv RECORD;
  v_sender_name text;
  v_sender_college text;
  v_sender_verified boolean;
  v_recip_name text;
  v_recip_college text;
  v_recip_verified boolean;
  v_sender_balance int;
  v_recip_balance int;
  v_offered_uuid uuid;
  v_requested_uuid uuid;
  v_offered_skill RECORD;
  v_requested_skill RECORD;
  v_session_1_id uuid;
  v_session_2_id uuid;
  v_s1_start timestamp;
  v_s1_end timestamp;
  v_s2_start timestamp;
  v_s2_end timestamp;
  v_current_ist_time timestamp;
  v_current_ist_date date;
BEGIN
  -- 1. Authenticate caller
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  -- 2. Validate independent scheduling parameters & format
  IF p_session1_date IS NULL OR p_session2_date IS NULL OR 
     trim(COALESCE(p_session1_time, '')) = '' OR trim(COALESCE(p_session2_time, '')) = '' THEN
    RAISE EXCEPTION 'Valid dates and times must be provided for both reciprocal sessions.' USING ERRCODE = '23514';
  END IF;

  -- Reference Indian Standard Time (Asia/Kolkata, UTC+05:30) for schedule validation
  v_current_ist_time := now() AT TIME ZONE 'Asia/Kolkata';
  v_current_ist_date := v_current_ist_time::date;

  IF p_session1_date < v_current_ist_date OR p_session2_date < v_current_ist_date THEN
    RAISE EXCEPTION 'Session dates cannot be in the past (Current date in India: %).', v_current_ist_date USING ERRCODE = '23514';
  END IF;

  -- Validate time format (HH:MM or HH:MM:SS)
  IF trim(p_session1_time) !~* '^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$' THEN
    RAISE EXCEPTION 'Invalid time format for Session 1 (% provided; HH:MM expected).', p_session1_time USING ERRCODE = '22007';
  END IF;

  IF trim(p_session2_time) !~* '^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$' THEN
    RAISE EXCEPTION 'Invalid time format for Session 2 (% provided; HH:MM expected).', p_session2_time USING ERRCODE = '22007';
  END IF;

  -- Compute exact timestamp intervals for both 60-minute sessions (in Asia/Kolkata local timestamp frame)
  v_s1_start := p_session1_date + p_session1_time::time;
  v_s1_end := v_s1_start + interval '60 minutes';
  v_s2_start := p_session2_date + p_session2_time::time;
  v_s2_end := v_s2_start + interval '60 minutes';

  -- Both session start timestamps must be strictly in the future in IST (including when selected date is today)
  IF v_s1_start <= v_current_ist_time THEN
    RAISE EXCEPTION 'Session 1 scheduled start time (% % IST) must be strictly in the future (Current time in India: %).',
      p_session1_date, p_session1_time, to_char(v_current_ist_time, 'YYYY-MM-DD HH24:MI') USING ERRCODE = '23514';
  END IF;

  IF v_s2_start <= v_current_ist_time THEN
    RAISE EXCEPTION 'Session 2 scheduled start time (% % IST) must be strictly in the future (Current time in India: %).',
      p_session2_date, p_session2_time, to_char(v_current_ist_time, 'YYYY-MM-DD HH24:MI') USING ERRCODE = '23514';
  END IF;

  -- Prevent overlapping time intervals across reciprocal sessions (60 min duration)
  IF (v_s1_start, v_s1_end) OVERLAPS (v_s2_start, v_s2_end) THEN
    RAISE EXCEPTION 'The two reciprocal sessions overlap in schedule (Session 1: % to %, Session 2: % to % IST). Each session is 60 minutes; please allow at least 60 minutes between start times.',
      to_char(v_s1_start, 'YYYY-MM-DD HH24:MI'),
      to_char(v_s1_end, 'HH24:MI'),
      to_char(v_s2_start, 'YYYY-MM-DD HH24:MI'),
      to_char(v_s2_end, 'HH24:MI')
      USING ERRCODE = '23514';
  END IF;

  -- 3. Acquire row lock on invitation
  SELECT * INTO v_inv
  FROM public.skill_swap_invitations
  WHERE id = p_invitation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Swap invitation not found.' USING ERRCODE = 'P0002';
  END IF;

  -- 4. Verify invitation is pending (Atomic prevention of duplicate acceptance)
  IF v_inv.status <> 'pending' THEN
    RAISE EXCEPTION 'Swap invitation is no longer pending (current status: %).', v_inv.status
      USING ERRCODE = '42501';
  END IF;

  -- 5. Verify caller is designated recipient
  IF v_caller <> v_inv.recipient_id THEN
    RAISE EXCEPTION 'Only the designated recipient can accept this swap proposal.'
      USING ERRCODE = '42501';
  END IF;

  -- 6. Verify both participants exist and belong to the same verified college
  SELECT name, college_id, is_college_verified
  INTO v_sender_name, v_sender_college, v_sender_verified
  FROM public.profiles
  WHERE id = v_inv.sender_id;

  SELECT name, college_id, is_college_verified
  INTO v_recip_name, v_recip_college, v_recip_verified
  FROM public.profiles
  WHERE id = v_inv.recipient_id;

  IF NOT COALESCE(v_sender_verified, false) OR NOT COALESCE(v_recip_verified, false) THEN
    RAISE EXCEPTION 'Both students must be verified members of an institution.'
      USING ERRCODE = '42501';
  END IF;

  IF v_sender_college IS NULL OR v_recip_college IS NULL OR v_sender_college <> v_recip_college THEN
    RAISE EXCEPTION 'Both students must belong to the same verified college institution.'
      USING ERRCODE = '42501';
  END IF;

  -- 7. Skill Listing Status & Ownership Validation
  -- Confirms active existence in public.skills table, correct teacher_id ownership, and college match
  IF v_inv.offered_skill_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'Offered skill ID is not a valid UUID listing.' USING ERRCODE = '22P02';
  END IF;
  v_offered_uuid := v_inv.offered_skill_id::uuid;

  IF v_inv.requested_skill_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'Requested skill ID is not a valid UUID listing.' USING ERRCODE = '22P02';
  END IF;
  v_requested_uuid := v_inv.requested_skill_id::uuid;

  SELECT id, title, category, college_id, teacher_id
  INTO v_offered_skill
  FROM public.skills
  WHERE id = v_offered_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The offered skill listing is no longer active or published.' USING ERRCODE = 'P0002';
  END IF;

  IF v_offered_skill.teacher_id <> v_inv.sender_id THEN
    RAISE EXCEPTION 'The offered skill listing does not belong to the proposal sender.' USING ERRCODE = '42501';
  END IF;

  SELECT id, title, category, college_id, teacher_id
  INTO v_requested_skill
  FROM public.skills
  WHERE id = v_requested_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The requested skill listing is no longer active or published.' USING ERRCODE = 'P0002';
  END IF;

  IF v_requested_skill.teacher_id <> v_inv.recipient_id THEN
    RAISE EXCEPTION 'The requested skill listing does not belong to you (the recipient).' USING ERRCODE = '42501';
  END IF;

  IF v_offered_skill.college_id <> v_sender_college OR v_requested_skill.college_id <> v_recip_college THEN
    RAISE EXCEPTION 'Skill listings must belong to the verified college institution.' USING ERRCODE = '42501';
  END IF;

  -- 8. Deadlock-Safe Canonical Wallet Row Locking
  PERFORM 1 FROM public.wallets
  WHERE user_id IN (v_inv.sender_id, v_inv.recipient_id)
  ORDER BY user_id
  FOR UPDATE;

  SELECT balance INTO v_sender_balance FROM public.wallets WHERE user_id = v_inv.sender_id;
  SELECT balance INTO v_recip_balance FROM public.wallets WHERE user_id = v_inv.recipient_id;

  IF v_sender_balance IS NULL OR v_sender_balance < v_inv.credits THEN
    RAISE EXCEPTION 'Sender currently has insufficient credits (% required).', v_inv.credits
      USING ERRCODE = 'P0001';
  END IF;

  IF v_recip_balance IS NULL OR v_recip_balance < v_inv.credits THEN
    RAISE EXCEPTION 'You need at least % credit(s) to accept and reserve this mutual exchange.', v_inv.credits
      USING ERRCODE = 'P0001';
  END IF;

  -- 9. Reserve reciprocal escrow for both exchange sessions
  -- Sender locks escrow for Session 2 (learning requested skill from Recipient)
  UPDATE public.wallets
  SET balance = balance - v_inv.credits,
      escrow_locked = escrow_locked + v_inv.credits,
      updated_at = now()
  WHERE user_id = v_inv.sender_id;

  -- Recipient locks escrow for Session 1 (learning offered skill from Sender)
  UPDATE public.wallets
  SET balance = balance - v_inv.credits,
      escrow_locked = escrow_locked + v_inv.credits,
      updated_at = now()
  WHERE user_id = v_inv.recipient_id;

  -- 10. Create Session 1: Sender teaches Recipient (Recipient is learner)
  INSERT INTO public.sessions (
    skill_id,
    skill_title,
    category,
    teacher_id,
    learner_id,
    credits,
    date,
    time,
    duration_minutes,
    status,
    meeting_link,
    learner_notes,
    teacher_notes,
    swap_invitation_id
  ) VALUES (
    v_offered_uuid,
    v_offered_skill.title,
    v_offered_skill.category,
    v_inv.sender_id,
    v_inv.recipient_id,
    v_inv.credits,
    p_session1_date,
    p_session1_time,
    60,
    'confirmed',
    'https://meet.jit.si/swapstudy-mutual-' || substr(p_invitation_id::text, 1, 8) || '-1',
    'Mutual Skill Swap: Learning ' || v_offered_skill.title || ' in exchange for teaching ' || v_requested_skill.title,
    'Mutual Skill Swap session with ' || v_recip_name,
    p_invitation_id
  ) RETURNING id INTO v_session_1_id;

  -- 11. Create Session 2: Recipient teaches Sender (Sender is learner)
  INSERT INTO public.sessions (
    skill_id,
    skill_title,
    category,
    teacher_id,
    learner_id,
    credits,
    date,
    time,
    duration_minutes,
    status,
    meeting_link,
    learner_notes,
    teacher_notes,
    swap_invitation_id
  ) VALUES (
    v_requested_uuid,
    v_requested_skill.title,
    v_requested_skill.category,
    v_inv.recipient_id,
    v_inv.sender_id,
    v_inv.credits,
    p_session2_date,
    p_session2_time,
    60,
    'confirmed',
    'https://meet.jit.si/swapstudy-mutual-' || substr(p_invitation_id::text, 1, 8) || '-2',
    'Mutual Skill Swap: Learning ' || v_requested_skill.title || ' in exchange for teaching ' || v_offered_skill.title,
    'Mutual Skill Swap session with ' || v_sender_name,
    p_invitation_id
  ) RETURNING id INTO v_session_2_id;

  -- 12. Record debit ledger entries for each learner
  INSERT INTO public.credit_transactions (
    user_id, session_id, amount, type, title, description
  ) VALUES
    (v_inv.recipient_id, v_session_1_id, -v_inv.credits, 'spent_learning', 'Escrow: Mutual Swap - ' || v_offered_skill.title, 'Credits reserved for reciprocal exchange session.'),
    (v_inv.sender_id, v_session_2_id, -v_inv.credits, 'spent_learning', 'Escrow: Mutual Swap - ' || v_requested_skill.title, 'Credits reserved for reciprocal exchange session.');

  -- 13. Transition invitation status: pending -> accepted -> booked
  UPDATE public.skill_swap_invitations
  SET status = 'accepted',
      responded_at = now()
  WHERE id = p_invitation_id;

  UPDATE public.skill_swap_invitations
  SET status = 'booked'
  WHERE id = p_invitation_id;

  -- 14. Contextual notification in conversation detailing independent schedules
  INSERT INTO public.messages (conversation_id, sender_id, type, content, read_by)
  VALUES (
    v_inv.conversation_id,
    v_caller,
    'system',
    '🎉 Mutual Skill Swap accepted! 2 confirmed exchange sessions have been scheduled:' || E'\n' ||
    '1. ' || v_offered_skill.title || ' (Taught by ' || v_sender_name || ' on ' || p_session1_date || ' at ' || p_session1_time || ' IST)' || E'\n' ||
    '2. ' || v_requested_skill.title || ' (Taught by ' || v_recip_name || ' on ' || p_session2_date || ' at ' || p_session2_time || ' IST)',
    ARRAY[v_caller]
  );

  RETURN jsonb_build_object(
    'success', true,
    'invitation_id', p_invitation_id,
    'session_1_id', v_session_1_id,
    'session_2_id', v_session_2_id
  );
END;
$$;

-- 3. Atomic Cancellation / Decline Procedure: Safe reciprocal refund & partial completion handling
-- Preserves complete existing one-way booking behavior while providing deadlock-free reciprocal cancellation.
CREATE OR REPLACE FUNCTION public.fn_decline_or_cancel_session(
  p_session_id uuid,
  p_reason text DEFAULT 'Schedule conflict'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_status text;
  v_teacher_id uuid;
  v_learner_id uuid;
  v_credits int;
  v_skill_title text;
  v_swap_invitation_id uuid;
  v_learner_escrow int;
  
  -- Reciprocal paired session variables
  v_paired_id uuid;
  v_paired_status text;
  v_paired_learner_id uuid;
  v_paired_teacher_id uuid;
  v_paired_credits int;
  v_paired_title text;
  v_paired_escrow int;
  v_conv_id uuid;
BEGIN
  -- 1. Authentication
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  -- 2. Initial lookup to identify session and check if it is part of a reciprocal swap
  SELECT status, teacher_id, learner_id, credits, skill_title, swap_invitation_id
  INTO v_status, v_teacher_id, v_learner_id, v_credits, v_skill_title, v_swap_invitation_id
  FROM public.sessions
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found.';
  END IF;

  -- Verify caller authorization: only participant teacher or learner
  IF v_caller_id <> v_teacher_id AND v_caller_id <> v_learner_id THEN
    RAISE EXCEPTION 'Unauthorized.';
  END IF;

  -- Verify session can be cancelled/declined
  IF v_status NOT IN ('pending', 'confirmed') THEN
    RAISE EXCEPTION 'Session is already % and cannot be cancelled.', v_status;
  END IF;

  -- ============================================================================
  -- BRANCH A: RECIPROCAL MUTUAL SWAP SESSION (swap_invitation_id IS NOT NULL)
  -- ============================================================================
  IF v_swap_invitation_id IS NOT NULL THEN
    -- Step A1: Deadlock-free serialization on the shared swap invitation!
    -- Any concurrent cancellation on either reciprocal session MUST acquire this lock first.
    PERFORM 1
    FROM public.skill_swap_invitations
    WHERE id = v_swap_invitation_id
    FOR UPDATE;

    -- Step A2: Discover the paired reciprocal session
    SELECT id
    INTO v_paired_id
    FROM public.sessions
    WHERE swap_invitation_id = v_swap_invitation_id AND id <> p_session_id;

    -- Step A3: Lock sessions in deterministic canonical order (ORDER BY id)
    PERFORM 1
    FROM public.sessions
    WHERE id IN (p_session_id, v_paired_id)
    ORDER BY id
    FOR UPDATE;

    -- Step A4: Refresh statuses after acquiring locks
    SELECT status, teacher_id, learner_id, credits, skill_title
    INTO v_status, v_teacher_id, v_learner_id, v_credits, v_skill_title
    FROM public.sessions
    WHERE id = p_session_id;

    IF v_status NOT IN ('pending', 'confirmed') THEN
      RAISE EXCEPTION 'Session is already % and cannot be cancelled.', v_status;
    END IF;

    IF v_paired_id IS NOT NULL THEN
      SELECT status, teacher_id, learner_id, credits, skill_title
      INTO v_paired_status, v_paired_teacher_id, v_paired_learner_id, v_paired_credits, v_paired_title
      FROM public.sessions
      WHERE id = v_paired_id;
    END IF;

    -- Case A: Neither session has completed yet!
    -- Paired session is ALSO pending or confirmed.
    -- Cancelling cancels BOTH sessions and refunds BOTH students' escrowed credits!
    IF v_paired_id IS NOT NULL AND v_paired_status IN ('pending', 'confirmed') THEN
      -- Step A5: Lock wallets in deterministic canonical order (ORDER BY user_id)
      PERFORM 1
      FROM public.wallets
      WHERE user_id IN (v_learner_id, v_paired_learner_id)
      ORDER BY user_id
      FOR UPDATE;

      -- Check escrow integrity on both wallets
      SELECT escrow_locked INTO v_learner_escrow FROM public.wallets WHERE user_id = v_learner_id;
      IF v_learner_escrow < v_credits THEN
        RAISE EXCEPTION 'Database escrow consistency error: Insufficient escrow held.';
      END IF;

      SELECT escrow_locked INTO v_paired_escrow FROM public.wallets WHERE user_id = v_paired_learner_id;
      IF v_paired_escrow < v_paired_credits THEN
        RAISE EXCEPTION 'Database escrow consistency error: Insufficient escrow held on paired session.';
      END IF;

      -- Refund caller session learner
      UPDATE public.wallets
      SET balance = balance + v_credits,
          escrow_locked = escrow_locked - v_credits,
          updated_at = now()
      WHERE user_id = v_learner_id;

      -- Refund paired session learner
      UPDATE public.wallets
      SET balance = balance + v_paired_credits,
          escrow_locked = escrow_locked - v_paired_credits,
          updated_at = now()
      WHERE user_id = v_paired_learner_id;

      -- Update caller session status (preserving exact status assignment logic)
      UPDATE public.sessions
      SET status = CASE WHEN v_caller_id = v_teacher_id THEN 'declined' ELSE 'cancelled' END,
          teacher_notes = p_reason
      WHERE id = p_session_id;

      -- Update paired session status
      UPDATE public.sessions
      SET status = 'cancelled',
          teacher_notes = 'Reciprocal swap cancelled: ' || p_reason
      WHERE id = v_paired_id;

      -- Log refund transactions with exact descriptions
      INSERT INTO public.credit_transactions (user_id, session_id, amount, type, title, description)
      VALUES
        (v_learner_id, p_session_id, v_credits, 'refund', 'Refund: ' || v_skill_title, 'Session ' || v_status || ': ' || p_reason),
        (v_paired_learner_id, v_paired_id, v_paired_credits, 'refund', 'Refund: ' || v_paired_title, 'Reciprocal session ' || v_paired_status || ': ' || p_reason);

      -- Update invitation status
      UPDATE public.skill_swap_invitations
      SET status = 'declined',
          responded_at = now()
      WHERE id = v_swap_invitation_id;

      -- Post system message to conversation
      SELECT conversation_id INTO v_conv_id FROM public.skill_swap_invitations WHERE id = v_swap_invitation_id;
      IF v_conv_id IS NOT NULL THEN
        INSERT INTO public.messages (conversation_id, sender_id, type, content, read_by)
        VALUES (
          v_conv_id,
          v_caller_id,
          'system',
          'Mutual Skill Swap cancelled (' || p_reason || '). Both exchange sessions have been cancelled and escrowed credits refunded to both students.',
          ARRAY[v_caller_id]
        );
      END IF;

      RETURN true;
    END IF;

    -- Case B: Partial completion!
    -- The paired session was ALREADY completed (v_paired_status = 'completed') or cancelled!
    -- In this case, only refund the caller session's learner:
    SELECT escrow_locked INTO v_learner_escrow
    FROM public.wallets
    WHERE user_id = v_learner_id
    FOR UPDATE;

    IF v_learner_escrow < v_credits THEN
      RAISE EXCEPTION 'Database escrow consistency error: Insufficient escrow held.';
    END IF;

    UPDATE public.wallets
    SET balance = balance + v_credits,
        escrow_locked = escrow_locked - v_credits,
        updated_at = now()
    WHERE user_id = v_learner_id;

    UPDATE public.sessions
    SET status = CASE WHEN v_caller_id = v_teacher_id THEN 'declined' ELSE 'cancelled' END,
        teacher_notes = p_reason
    WHERE id = p_session_id;

    INSERT INTO public.credit_transactions (
      user_id, session_id, amount, type, title, description
    ) VALUES (
      v_learner_id, p_session_id, v_credits, 'refund',
      'Refund: ' || v_skill_title, 'Session ' || v_status || ': ' || p_reason
    );

    RETURN true;
  END IF;

  -- ============================================================================
  -- BRANCH B: STANDARD ONE-WAY BOOKING SESSION (swap_invitation_id IS NULL)
  -- Identical to master schema implementation in every check, update, and ledger entry!
  -- ============================================================================
  -- Lock session row
  SELECT status, teacher_id, learner_id, credits, skill_title
  INTO v_status, v_teacher_id, v_learner_id, v_credits, v_skill_title
  FROM public.sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF v_status NOT IN ('pending', 'confirmed') THEN
    RAISE EXCEPTION 'Session is already % and cannot be cancelled.', v_status;
  END IF;

  -- Lock learner wallet row
  SELECT escrow_locked INTO v_learner_escrow
  FROM public.wallets
  WHERE user_id = v_learner_id
  FOR UPDATE;

  IF v_learner_escrow < v_credits THEN
    RAISE EXCEPTION 'Database escrow consistency error: Insufficient escrow held.';
  END IF;

  -- Refund learner escrow
  UPDATE public.wallets
  SET balance = balance + v_credits,
      escrow_locked = escrow_locked - v_credits,
      updated_at = now()
  WHERE user_id = v_learner_id;

  -- Update session status
  UPDATE public.sessions
  SET status = CASE WHEN v_caller_id = v_teacher_id THEN 'declined' ELSE 'cancelled' END,
      teacher_notes = p_reason
  WHERE id = p_session_id;

  -- Log refund transaction
  INSERT INTO public.credit_transactions (
    user_id, session_id, amount, type, title, description
  ) VALUES (
    v_learner_id, p_session_id, v_credits, 'refund',
    'Refund: ' || v_skill_title, 'Session ' || v_status || ': ' || p_reason
  );

  RETURN true;
END;
$$;

-- 4. Execution grants
REVOKE ALL ON FUNCTION public.fn_accept_skill_swap_proposal(uuid, date, text, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_accept_skill_swap_proposal(uuid, date, text, date, text) TO authenticated;

REVOKE ALL ON FUNCTION public.fn_decline_or_cancel_session(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_decline_or_cancel_session(uuid, text) TO authenticated;
