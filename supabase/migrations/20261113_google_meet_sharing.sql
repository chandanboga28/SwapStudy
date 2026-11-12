-- ==============================================================================
-- SwapStudy Migration: Google Meet Link Sharing (MVP)
-- Date: 2026-11-13
-- Purpose:
--   1. Add nullable meeting_url column to public.sessions without modifying
--      existing session records or credit transactions.
--   2. Preserve all existing RLS policies on public.sessions (direct client
--      mutations remain disabled).
--   3. Provide atomic SECURITY DEFINER RPC fn_update_session_meeting_url so ONLY
--      the assigned teacher of a CONFIRMED session can add or update a valid
--      https://meet.google.com/... URL.
--   4. Publish public.sessions to supabase_realtime so both teacher and learner
--      see live meeting link updates without manual page refresh.
-- ==============================================================================

-- 1. Add nullable meeting_url column (leaves existing rows untouched as NULL)
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS meeting_url text;

-- 2. Enforce Google Meet URL format at the database constraint level for non-null values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_sessions_meeting_url_google_meet'
      AND conrelid = 'public.sessions'::regclass
  ) THEN
    ALTER TABLE public.sessions
      ADD CONSTRAINT chk_sessions_meeting_url_google_meet
      CHECK (
        meeting_url IS NULL
        OR (
          char_length(meeting_url) <= 500
          AND meeting_url !~ '\s'
          AND meeting_url ~ '^https://meet\.google\.com/[A-Za-z0-9_-]{3,}(/[A-Za-z0-9_-]+)*([?#][A-Za-z0-9_.~:/?#\[\]@!$&''()*+,;=%-]*)?$'
          AND lower(split_part(split_part(substr(meeting_url, 25), '?', 1), '#', 1)) <> 'new'
        )
      );
  END IF;
END $$;

-- 3. Teacher-only RPC to add or update Google Meet URL on confirmed sessions
CREATE OR REPLACE FUNCTION public.fn_update_session_meeting_url(
  p_session_id uuid,
  p_meeting_url text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id uuid;
  v_teacher_id uuid;
  v_status text;
  v_clean_url text;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  IF p_session_id IS NULL THEN
    RAISE EXCEPTION 'Session ID is required.' USING ERRCODE = '22004';
  END IF;

  -- Lock target session row to verify teacher ownership and confirmed status atomically
  SELECT teacher_id, status
  INTO v_teacher_id, v_status
  FROM public.sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found.' USING ERRCODE = 'P0002';
  END IF;

  IF v_caller_id <> v_teacher_id THEN
    RAISE EXCEPTION 'Only the assigned teacher can update the meeting link for this session.'
      USING ERRCODE = '42501';
  END IF;

  IF v_status <> 'confirmed' THEN
    RAISE EXCEPTION 'Google Meet links can only be added or updated for confirmed sessions (current status: %).', v_status
      USING ERRCODE = 'P0001';
  END IF;

  v_clean_url := trim(COALESCE(p_meeting_url, ''));
  IF v_clean_url ~* '^https://meet\.google\.com/' THEN
    v_clean_url := 'https://meet.google.com/' || substr(v_clean_url, 25);
  END IF;

  IF v_clean_url = ''
     OR char_length(v_clean_url) > 500
     OR v_clean_url ~ '\s'
     OR v_clean_url !~ '^https://meet\.google\.com/[A-Za-z0-9_-]{3,}(/[A-Za-z0-9_-]+)*([?#][A-Za-z0-9_.~:/?#\[\]@!$&''()*+,;=%-]*)?$'
     OR lower(split_part(split_part(substr(v_clean_url, 25), '?', 1), '#', 1)) = 'new' THEN
    RAISE EXCEPTION 'Please enter a valid Google Meet link starting with https://meet.google.com/ (e.g., https://meet.google.com/abc-defg-hij).'
      USING ERRCODE = '23514';
  END IF;

  UPDATE public.sessions
  SET meeting_url = v_clean_url
  WHERE id = p_session_id;

  RETURN v_clean_url;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_update_session_meeting_url(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_update_session_meeting_url(uuid, text) TO authenticated, service_role;

-- 4. Enable Supabase Realtime for session meeting link & status updates
ALTER TABLE public.sessions REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'sessions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
    END IF;
  END IF;
END $$;

