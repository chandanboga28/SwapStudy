-- ==============================================================================
-- SWAPSTUDY: Atomic Session Acceptance Procedure
-- ==============================================================================

-- 1. Ensure any direct UPDATE policy is removed (direct session mutations stay disabled)
DROP POLICY IF EXISTS "Teachers can confirm their pending sessions" ON public.sessions;

-- 2. Atomic Accept Procedure: Teacher confirms booking request (pending -> confirmed)
CREATE OR REPLACE FUNCTION public.fn_accept_session(
  p_session_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id uuid;
  v_status text;
  v_teacher_id uuid;
  v_meeting_link text;
BEGIN
  -- Authenticate caller
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  -- Acquire row lock and fetch session details
  SELECT teacher_id, status, meeting_link
  INTO v_teacher_id, v_status, v_meeting_link
  FROM public.sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found.';
  END IF;

  -- Verify caller is the assigned teacher
  IF v_caller_id <> v_teacher_id THEN
    RAISE EXCEPTION 'Only the assigned teacher can accept this session booking.';
  END IF;

  -- Verify session is in pending state
  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'Session cannot be accepted because it is already %.', v_status;
  END IF;

  -- Ensure meeting link exists
  IF v_meeting_link IS NULL OR trim(v_meeting_link) = '' THEN
    v_meeting_link := 'https://meet.jit.si/swapstudy-' || substr(p_session_id::text, 1, 8);
  END IF;

  -- Atomically update session status to confirmed (wallets and escrow remain untouched)
  UPDATE public.sessions
  SET status = 'confirmed',
      meeting_link = v_meeting_link
  WHERE id = p_session_id;

  RETURN true;
END;
$$;

-- 3. Restrict execution permissions to authenticated users only
REVOKE ALL ON FUNCTION public.fn_accept_session FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_accept_session TO authenticated;
