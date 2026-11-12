-- ==============================================================================
-- SwapStudy Migration: Booking Idempotency & Escrow Hardening
-- Date: 2026-11-12
-- Purpose:
--   1. Prevent duplicate pending/confirmed session bookings and extra escrow
--      deductions caused by rapid double-clicks or concurrent RPC calls in
--      public.fn_book_session_with_escrow(uuid, date, text, text).
--   2. Align booking date/time validation with IST (Asia/Kolkata) matching UI.
--   3. Add a partial unique index ensuring at most one escrow debit row in
--      public.credit_transactions per (session_id, user_id).
--   4. Ensure public.student_connections is published to supabase_realtime.
-- Note: Does NOT add a unique index on public.sessions(learner_id, skill_id)
--       so existing historical rows do not block migration deployment.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_book_session_with_escrow(
  p_skill_id uuid,
  p_date date,
  p_time text,
  p_notes text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id uuid;
  v_caller_college text;
  v_teacher_id uuid;
  v_teacher_college text;
  v_hourly_credits int;
  v_skill_title text;
  v_category text;
  v_duration int;
  v_learner_balance int;
  v_session_id uuid;
  v_trimmed_time text;
  v_current_ist_time timestamp;
  v_current_ist_date date;
  v_session_start timestamp;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  v_caller_college := get_current_user_college();
  IF v_caller_college IS NULL THEN
    RAISE EXCEPTION 'Only verified college students can book skill sessions.' USING ERRCODE = '42501';
  END IF;

  IF p_date IS NULL THEN
    RAISE EXCEPTION 'Session booking date is required.' USING ERRCODE = '23514';
  END IF;

  v_trimmed_time := trim(COALESCE(p_time, ''));
  IF v_trimmed_time = '' OR v_trimmed_time !~* '^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$' THEN
    RAISE EXCEPTION 'Invalid session time format (HH:MM expected).' USING ERRCODE = '22007';
  END IF;

  v_current_ist_time := now() AT TIME ZONE 'Asia/Kolkata';
  v_current_ist_date := v_current_ist_time::date;

  IF p_date < v_current_ist_date THEN
    RAISE EXCEPTION 'Session booking date cannot be in the past.' USING ERRCODE = '23514';
  END IF;

  v_session_start := p_date + v_trimmed_time::time;
  IF v_session_start <= v_current_ist_time THEN
    RAISE EXCEPTION 'Selected session date and time (% % IST) have already passed.', p_date, v_trimmed_time
      USING ERRCODE = '23514';
  END IF;

  -- 1. Fetch skill details
  SELECT teacher_id, college_id, hourly_credits, title, category, session_duration_minutes
  INTO v_teacher_id, v_teacher_college, v_hourly_credits, v_skill_title, v_category, v_duration
  FROM public.skills
  WHERE id = p_skill_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Skill listing not found.' USING ERRCODE = 'P0002';
  END IF;

  IF v_teacher_id = v_caller_id THEN
    RAISE EXCEPTION 'Students cannot book sessions with themselves.' USING ERRCODE = '42501';
  END IF;

  IF v_teacher_college <> v_caller_college THEN
    RAISE EXCEPTION 'Cross-college bookings are prohibited.' USING ERRCODE = '42501';
  END IF;

  -- 2. Serialize concurrent booking attempts by the same learner for the same skill
  PERFORM pg_advisory_xact_lock(
    hashtext('book_skill_' || v_caller_id::text),
    hashtext(p_skill_id::text)
  );

  -- 3. Reject duplicate active bookings before locking/deducting wallet credits
  IF EXISTS (
    SELECT 1
    FROM public.sessions
    WHERE learner_id = v_caller_id
      AND skill_id = p_skill_id
      AND status IN ('pending', 'confirmed')
  ) THEN
    RAISE EXCEPTION 'You already have an active session request for this skill.'
      USING ERRCODE = 'P0001';
  END IF;

  -- 4. Lock learner wallet row to prevent concurrent balance race conditions
  SELECT balance INTO v_learner_balance
  FROM public.wallets
  WHERE user_id = v_caller_id
  FOR UPDATE;

  IF v_learner_balance IS NULL OR v_learner_balance < v_hourly_credits THEN
    RAISE EXCEPTION 'Insufficient credit balance. Required: %, Available: %',
      v_hourly_credits, COALESCE(v_learner_balance, 0)
      USING ERRCODE = 'P0001';
  END IF;

  -- 5. Atomically reserve credits in escrow
  UPDATE public.wallets
  SET balance = balance - v_hourly_credits,
      escrow_locked = escrow_locked + v_hourly_credits,
      updated_at = now()
  WHERE user_id = v_caller_id;

  -- 6. Create pending session
  INSERT INTO public.sessions (
    skill_id, skill_title, category, teacher_id, learner_id,
    credits, date, time, duration_minutes, status, learner_notes,
    meeting_link
  ) VALUES (
    p_skill_id, v_skill_title, v_category, v_teacher_id, v_caller_id,
    v_hourly_credits, p_date, v_trimmed_time, v_duration, 'pending', COALESCE(p_notes, ''),
    'https://meet.swapstudy.org/room/' || p_skill_id || '-' || substr(md5(random()::text), 1, 6)
  ) RETURNING id INTO v_session_id;

  -- 7. Record escrow debit transaction in ledger
  INSERT INTO public.credit_transactions (
    user_id, session_id, amount, type, title, description
  ) VALUES (
    v_caller_id, v_session_id, -v_hourly_credits, 'spent_learning',
    'Escrow: ' || v_skill_title, 'Credits reserved for session.'
  );

  RETURN v_session_id;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_book_session_with_escrow(uuid, date, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_book_session_with_escrow(uuid, date, text, text) TO authenticated, service_role;

-- Guarantee at most one escrow debit entry per session per learner
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_spent_tx_per_session
  ON public.credit_transactions (session_id, user_id)
  WHERE session_id IS NOT NULL AND type IN ('spent_learning', 'escrow_hold');

-- Ensure connection updates stream over Supabase Realtime
ALTER TABLE public.student_connections REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'student_connections'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.student_connections;
    END IF;
  END IF;
END $$;

