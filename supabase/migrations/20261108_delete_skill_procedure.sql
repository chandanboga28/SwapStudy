-- ==============================================================================
-- SWAPSTUDY: Atomic Skill Listing Deletion Procedure
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_delete_skill(
  p_skill_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id uuid;
  v_teacher_id uuid;
  v_active_sessions_count int;
BEGIN
  -- 1. Authenticate caller
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  -- 2. Verify skill exists and acquire row lock
  SELECT teacher_id
  INTO v_teacher_id
  FROM public.skills
  WHERE id = p_skill_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Skill listing not found.';
  END IF;

  -- 3. Verify teacher ownership
  IF v_caller_id <> v_teacher_id THEN
    RAISE EXCEPTION 'Only the teacher who created this skill listing can delete it.';
  END IF;

  -- 4. Check for active or confirmed sessions
  SELECT count(*)
  INTO v_active_sessions_count
  FROM public.sessions
  WHERE skill_id = p_skill_id
    AND status IN ('pending', 'confirmed');

  IF v_active_sessions_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete skill listing: there are % active or confirmed session(s) booked for this skill. Please complete or decline them first.', v_active_sessions_count;
  END IF;

  -- 5. Delete the skill listing
  DELETE FROM public.skills
  WHERE id = p_skill_id;

  RETURN true;
END;
$$;

-- Restrict execution to authenticated users only
REVOKE ALL ON FUNCTION public.fn_delete_skill FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_delete_skill TO authenticated;

