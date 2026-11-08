-- ==============================================================================
-- SWAPSTUDY SAFE PRODUCTION ROLLBACK SCRIPT (Baseline-Coupled Hardened v5)
-- Migration: 20261102_swapstudy_master_schema.sql
-- Safety: Enforces RESTRICT throughout (no CASCADE), strict PostgreSQL OID,
--         definition hash, trigger configuration (tgtype, tgenabled, tgargs),
--         and function execution properties (prosecdef, provolatile, etc.).
--         Aborts cleanly if any object was replaced, disabled, or modified.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 0. BASELINE PRESENCE CHECK
-- Guarantees rollback is running against a database where the baseline exists.
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON c.relnamespace = n.oid 
    WHERE n.nspname = 'public' AND c.relname = '_swapstudy_migration_baseline'
  ) THEN
    RAISE EXCEPTION 'Cannot perform rollback: public._swapstudy_migration_baseline not found. Cannot verify migration ownership.';
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 0.5. PRE-VERIFICATION IDENTITY & CONFIGURATION GATE
-- Scans all baseline objects against the live catalog BEFORE any DROP is executed.
-- If ANY table, view, function, or trigger was replaced, disabled, or modified,
-- aborts immediately to protect replacement objects.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_rec RECORD;
  v_cur_oid oid;
  v_cur_kind "char";
  v_cur_func RECORD;
  v_cur_trigger RECORD;
BEGIN
  -- Verify recorded tables (if present, must match recorded OID and relkind)
  FOR v_rec IN (
    SELECT object_name AS tbl_name, (metadata->>'oid')::oid AS expected_oid
    FROM public._swapstudy_migration_baseline
    WHERE category = 'table' AND schema_name = 'public'
  ) LOOP
    SELECT c.oid, c.relkind INTO v_cur_oid, v_cur_kind
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = v_rec.tbl_name;

    IF FOUND THEN
      IF v_cur_kind != 'r' OR v_cur_oid != v_rec.expected_oid THEN
        RAISE EXCEPTION 'Aborting rollback: table public.% was replaced after migration (current OID: %, baseline OID: %). Rollback cannot safely proceed.',
          v_rec.tbl_name, v_cur_oid, v_rec.expected_oid;
      END IF;
    END IF;
  END LOOP;

  -- Verify recorded view public.users
  FOR v_rec IN (
    SELECT (metadata->>'oid')::oid AS expected_oid, (metadata->>'viewdef_hash') AS expected_hash
    FROM public._swapstudy_migration_baseline
    WHERE category = 'view' AND schema_name = 'public' AND object_name = 'users'
  ) LOOP
    SELECT c.oid, c.relkind INTO v_cur_oid, v_cur_kind
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'users';

    IF FOUND THEN
      IF v_cur_kind != 'v' OR v_cur_oid != v_rec.expected_oid OR md5(pg_get_viewdef(v_cur_oid)) != v_rec.expected_hash THEN
        RAISE EXCEPTION 'Aborting rollback: view public.users was replaced or modified after migration (current OID: %, baseline OID: %). Rollback cannot safely proceed.',
          v_cur_oid, v_rec.expected_oid;
      END IF;
    END IF;
  END LOOP;

  -- Verify recorded functions (OID, body hash, and security/execution attributes)
  FOR v_rec IN (
    SELECT object_name AS proname, sub_object_name AS args, metadata
    FROM public._swapstudy_migration_baseline
    WHERE category = 'function' AND schema_name = 'public'
  ) LOOP
    SELECT 
      p.oid,
      md5(p.prosrc) AS body_hash,
      p.prosecdef,
      p.provolatile,
      p.proparallel,
      coalesce(p.proconfig::text, '') AS proconfig_text,
      p.proisstrict,
      p.proleakproof
    INTO v_cur_func
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = v_rec.proname
      AND oidvectortypes(p.proargtypes) = v_rec.args;

    IF FOUND THEN
      IF v_cur_func.oid != (v_rec.metadata->>'oid')::oid
         OR v_cur_func.body_hash != (v_rec.metadata->>'body_hash')
         OR v_cur_func.prosecdef != (v_rec.metadata->>'prosecdef')::boolean
         OR v_cur_func.provolatile != (v_rec.metadata->>'provolatile')
         OR v_cur_func.proparallel != (v_rec.metadata->>'proparallel')
         OR v_cur_func.proconfig_text != coalesce(v_rec.metadata->>'proconfig_text', '')
         OR v_cur_func.proisstrict != (v_rec.metadata->>'proisstrict')::boolean
         OR v_cur_func.proleakproof != (v_rec.metadata->>'proleakproof')::boolean THEN
        RAISE EXCEPTION 'Aborting rollback: function public.%(%) was replaced or modified after migration (current OID: %, baseline OID: %). Rollback cannot safely proceed.',
          v_rec.proname, v_rec.args, v_cur_func.oid, (v_rec.metadata->>'oid')::oid;
      END IF;
    END IF;
  END LOOP;

  -- Verify recorded triggers (OID, table OID, proc OID, and trigger configuration: tgtype, tgenabled, etc.)
  FOR v_rec IN (
    SELECT schema_name, object_name AS table_name, sub_object_name AS trigger_name, metadata
    FROM public._swapstudy_migration_baseline
    WHERE category = 'trigger'
  ) LOOP
    SELECT 
      t.oid AS trigger_oid,
      c.oid AS table_oid,
      p.oid AS proc_oid,
      np.nspname AS proc_schema,
      p.proname AS proc_name,
      t.tgtype,
      t.tgenabled,
      t.tgnargs,
      encode(t.tgargs, 'hex') AS tgargs_hex,
      t.tgdeferrable,
      t.tginitdeferred
    INTO v_cur_trigger
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace nc ON c.relnamespace = nc.oid
    JOIN pg_proc p ON t.tgfoid = p.oid
    JOIN pg_namespace np ON p.pronamespace = np.oid
    WHERE nc.nspname = v_rec.schema_name
      AND c.relname = v_rec.table_name
      AND t.tgname = v_rec.trigger_name
      AND NOT t.tgisinternal;

    IF FOUND THEN
      IF v_cur_trigger.trigger_oid != (v_rec.metadata->>'trigger_oid')::oid
         OR v_cur_trigger.table_oid != (v_rec.metadata->>'table_oid')::oid
         OR v_cur_trigger.proc_oid != (v_rec.metadata->>'proc_oid')::oid
         OR v_cur_trigger.proc_schema != (v_rec.metadata->>'proc_schema')
         OR v_cur_trigger.proc_name != (v_rec.metadata->>'proc_name')
         OR v_cur_trigger.tgtype != (v_rec.metadata->>'tgtype')::int
         OR v_cur_trigger.tgenabled != (v_rec.metadata->>'tgenabled')
         OR v_cur_trigger.tgnargs != (v_rec.metadata->>'tgnargs')::int
         OR v_cur_trigger.tgargs_hex != (v_rec.metadata->>'tgargs_hex')
         OR v_cur_trigger.tgdeferrable != (v_rec.metadata->>'tgdeferrable')::boolean
         OR v_cur_trigger.tginitdeferred != (v_rec.metadata->>'tginitdeferred')::boolean THEN
        RAISE EXCEPTION 'Aborting rollback: trigger % on %.% was replaced or modified after migration (trigger_oid: %, expected: %; proc_oid: %, expected: %). Rollback cannot safely proceed.',
          v_rec.trigger_name, v_rec.schema_name, v_rec.table_name,
          v_cur_trigger.trigger_oid, v_rec.metadata->>'trigger_oid',
          v_cur_trigger.proc_oid, v_rec.metadata->>'proc_oid';
      END IF;
    END IF;
  END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 1. AUTH TRIGGER OWNERSHIP & CONFIGURATION VALIDATION & SAFE DROP
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_rec RECORD;
  v_cur RECORD;
BEGIN
  FOR v_rec IN (
    SELECT schema_name, object_name, sub_object_name AS trigger_name, metadata
    FROM public._swapstudy_migration_baseline
    WHERE category = 'trigger' AND schema_name = 'auth' AND object_name = 'users'
  ) LOOP
    SELECT 
      t.oid AS trigger_oid,
      c.oid AS table_oid,
      p.oid AS proc_oid,
      np.nspname AS proc_schema,
      p.proname AS proc_name,
      t.tgtype,
      t.tgenabled
    INTO v_cur
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n_table ON c.relnamespace = n_table.oid
    JOIN pg_proc p ON t.tgfoid = p.oid
    JOIN pg_namespace np ON p.pronamespace = np.oid
    WHERE n_table.nspname = v_rec.schema_name
      AND c.relname = v_rec.object_name
      AND t.tgname = v_rec.trigger_name
      AND NOT t.tgisinternal;

    IF FOUND THEN
      IF v_cur.trigger_oid != (v_rec.metadata->>'trigger_oid')::oid
         OR v_cur.table_oid != (v_rec.metadata->>'table_oid')::oid
         OR v_cur.proc_oid != (v_rec.metadata->>'proc_oid')::oid
         OR v_cur.proc_schema != (v_rec.metadata->>'proc_schema')
         OR v_cur.proc_name != (v_rec.metadata->>'proc_name')
         OR v_cur.tgtype != (v_rec.metadata->>'tgtype')::int
         OR v_cur.tgenabled != (v_rec.metadata->>'tgenabled') THEN
        RAISE EXCEPTION 'Aborting rollback: trigger % on %.% has been replaced or modified after migration. Rollback cannot safely proceed.',
          v_rec.trigger_name, v_rec.schema_name, v_rec.object_name;
      END IF;

      EXECUTE format('DROP TRIGGER %I ON %I.%I', v_rec.trigger_name, v_rec.schema_name, v_rec.object_name);
      RAISE NOTICE 'Dropped verified SwapStudy trigger % on %.%', v_rec.trigger_name, v_rec.schema_name, v_rec.object_name;
    END IF;
  END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 2. PUBLIC TABLE TRIGGER OWNERSHIP & CONFIGURATION VALIDATION & SAFE DROP
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_rec RECORD;
  v_cur RECORD;
BEGIN
  FOR v_rec IN (
    SELECT schema_name, object_name, sub_object_name AS trigger_name, metadata
    FROM public._swapstudy_migration_baseline
    WHERE category = 'trigger' AND schema_name = 'public'
  ) LOOP
    SELECT 
      t.oid AS trigger_oid,
      c.oid AS table_oid,
      p.oid AS proc_oid,
      np.nspname AS proc_schema,
      p.proname AS proc_name,
      t.tgtype,
      t.tgenabled
    INTO v_cur
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace nc ON c.relnamespace = nc.oid
    JOIN pg_proc p ON t.tgfoid = p.oid
    JOIN pg_namespace np ON p.pronamespace = np.oid
    WHERE nc.nspname = v_rec.schema_name
      AND c.relname = v_rec.object_name
      AND t.tgname = v_rec.trigger_name
      AND NOT t.tgisinternal;

    IF FOUND THEN
      IF v_cur.trigger_oid != (v_rec.metadata->>'trigger_oid')::oid
         OR v_cur.table_oid != (v_rec.metadata->>'table_oid')::oid
         OR v_cur.proc_oid != (v_rec.metadata->>'proc_oid')::oid
         OR v_cur.proc_schema != (v_rec.metadata->>'proc_schema')
         OR v_cur.proc_name != (v_rec.metadata->>'proc_name')
         OR v_cur.tgtype != (v_rec.metadata->>'tgtype')::int
         OR v_cur.tgenabled != (v_rec.metadata->>'tgenabled') THEN
        RAISE EXCEPTION 'Aborting rollback: trigger % on %.% has been replaced or modified after migration. Rollback cannot safely proceed.',
          v_rec.trigger_name, v_rec.schema_name, v_rec.object_name;
      END IF;

      EXECUTE format('DROP TRIGGER %I ON %I.%I', v_rec.trigger_name, v_rec.schema_name, v_rec.object_name);
      RAISE NOTICE 'Dropped verified trigger % on %.%', v_rec.trigger_name, v_rec.schema_name, v_rec.object_name;
    END IF;
  END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 3. REMOVE MIGRATION RLS POLICIES FROM TABLES
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_pol RECORD;
BEGIN
  FOR v_pol IN (
    SELECT c.relname AS table_name, pol.polname AS policy_name
    FROM pg_policy pol
    JOIN pg_class c ON pol.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND (
        (c.relname = 'colleges' AND pol.polname = 'Colleges are publicly readable') OR
        (c.relname = 'profiles' AND pol.polname IN ('Students can view same-college peer profiles', 'Direct profile insert disabled', 'Users can update their own profile')) OR
        (c.relname = 'wallets' AND pol.polname IN ('Users can view their own wallet', 'Direct client wallet updates disabled')) OR
        (c.relname = 'credit_transactions' AND pol.polname IN ('Users can view their own credit transactions', 'Direct client transaction inserts disabled')) OR
        (c.relname = 'college_verification_requests' AND pol.polname IN ('Students can view their own verification requests', 'Direct request inserts disabled', 'Direct request updates disabled')) OR
        (c.relname = 'skills' AND pol.polname IN ('Skills are viewable by students at same college', 'Teachers can manage their own skills')) OR
        (c.relname = 'sessions' AND pol.polname IN ('Participants can view their sessions', 'Direct session mutations disabled')) OR
        (c.relname = 'reviews' AND pol.polname IN ('Reviews are viewable by same-college students', 'Direct review inserts disabled')) OR
        (c.relname = 'student_connections' AND pol.polname IN ('Users can view their connections', 'Users can request connection with same-college peers', 'Receiver can respond to connection request')) OR
        (c.relname = 'community_posts' AND pol.polname IN ('Posts readable by same college students', 'Authors can create posts at their verified college', 'Authors can update their posts', 'Authors can delete their posts')) OR
        (c.relname = 'post_comments' AND pol.polname IN ('Comments readable by same-college students', 'Students can comment on same-college posts', 'Authors can delete their comments')) OR
        (c.relname = 'post_likes' AND pol.polname = 'Likes readable and manageable by owner') OR
        (c.relname = 'post_bookmarks' AND pol.polname = 'Bookmarks manageable by owner') OR
        (c.relname = 'learning_groups' AND pol.polname IN ('Groups readable by same college students', 'Students can create learning groups')) OR
        (c.relname = 'learning_group_members' AND pol.polname IN (
          'Group members readable by same college students',
          'Students can join learning groups at their college',
          'Users can leave or creators can manage members',
          'Group members manageable by users'
        )) OR
        (c.relname = 'conversations' AND pol.polname IN ('Users can view conversations they participate in', 'Users can create conversations at their college')) OR
        (c.relname = 'conversation_participants' AND pol.polname IN ('Users can view participants of their conversations', 'Users can add participants with accepted connection', 'Users can update their own participant state')) OR
        (c.relname = 'messages' AND pol.polname IN ('Users can read messages in their conversations', 'Users can send messages to their conversations')) OR
        (c.relname = 'skill_swap_invitations' AND pol.polname IN ('Participants can view invitations', 'Users can create skill swap invitations', 'Participants can update invitation status'))
      )
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_pol.policy_name, v_pol.table_name);
    RAISE NOTICE 'Dropped SwapStudy policy % from public.%', v_pol.policy_name, v_pol.table_name;
  END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 4. RESTORE REALTIME PUBLICATION STATE
-- Removes ONLY tables that were not already published in the baseline snapshot.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_target_table text;
  v_was_pre_existing boolean;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOR v_target_table IN (
      SELECT tablename FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename IN ('messages', 'conversations', 'conversation_participants', 'skill_swap_invitations', 'community_posts', 'post_comments')
    ) LOOP
      v_was_pre_existing := false;
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_swapstudy_migration_baseline') THEN
        SELECT pre_existed INTO v_was_pre_existing
        FROM public._swapstudy_migration_baseline
        WHERE category = 'realtime' AND object_name = v_target_table;
      END IF;

      IF NOT COALESCE(v_was_pre_existing, false) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.' || quote_ident(v_target_table);
        RAISE NOTICE 'Removed public.% from supabase_realtime (added by migration).', v_target_table;
      ELSE
        RAISE NOTICE 'Preserved public.% in supabase_realtime (pre-existed prior to migration).', v_target_table;
      END IF;
    END LOOP;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 5. DROP VIEW public.users (RESTRICT) WITH OID IDENTITY VERIFICATION
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_rec_oid oid;
  v_rec_hash text;
  v_cur_oid oid;
  v_cur_kind "char";
BEGIN
  SELECT (metadata->>'oid')::oid, (metadata->>'viewdef_hash') INTO v_rec_oid, v_rec_hash
  FROM public._swapstudy_migration_baseline
  WHERE category = 'view' AND schema_name = 'public' AND object_name = 'users';

  SELECT c.oid, c.relkind INTO v_cur_oid, v_cur_kind
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public' AND c.relname = 'users';

  IF FOUND THEN
    IF v_cur_kind != 'v' OR v_rec_oid IS NULL OR v_cur_oid != v_rec_oid OR (v_rec_hash IS NOT NULL AND md5(pg_get_viewdef(v_cur_oid)) != v_rec_hash) THEN
      RAISE EXCEPTION 'Aborting rollback: view public.users OID (%) does not match recorded migration OID (%). The view was replaced after migration.',
        v_cur_oid, v_rec_oid;
    END IF;

    DROP VIEW public.users RESTRICT;
    RAISE NOTICE 'Dropped verified SwapStudy view public.users (OID matches migration).';
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 6. DROP TABLES IN STRICT REVERSE TOPOLOGICAL ORDER WITH OID IDENTITY VERIFICATION
-- All tables dropped with RESTRICT. Foreign keys from child tables (e.g.,
-- credit_transactions -> sessions) are dropped with their child table.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_tbl text;
  v_rec_oid oid;
  v_cur_oid oid;
  v_cur_kind "char";
BEGIN
  FOR v_tbl IN (
    SELECT unnest(ARRAY[
      'skill_swap_invitations',
      'messages',
      'conversation_participants',
      'conversations',
      'post_bookmarks',
      'post_likes',
      'post_comments',
      'community_posts',
      'learning_group_members',
      'learning_groups',
      'reviews',
      'credit_transactions',
      'sessions',
      'skills',
      'student_connections',
      'college_verification_requests',
      'wallets',
      'profiles',
      'colleges'
    ])
  ) LOOP
    SELECT (metadata->>'oid')::oid INTO v_rec_oid
    FROM public._swapstudy_migration_baseline
    WHERE category = 'table' AND schema_name = 'public' AND object_name = v_tbl;

    SELECT c.oid, c.relkind INTO v_cur_oid, v_cur_kind
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = v_tbl;

    IF FOUND THEN
      IF v_cur_kind != 'r' OR v_rec_oid IS NULL OR v_cur_oid != v_rec_oid THEN
        RAISE EXCEPTION 'Aborting rollback: table public.% OID (%) does not match recorded migration OID (%). The table was replaced after migration.',
          v_tbl, v_cur_oid, v_rec_oid;
      END IF;

      EXECUTE format('DROP TABLE public.%I RESTRICT', v_tbl);
      RAISE NOTICE 'Dropped verified migration table public.% (OID matches migration).', v_tbl;
    END IF;
  END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 7. DROP FUNCTIONS WITH OID & DEFINITION VERIFICATION (24 Functions with RESTRICT)
-- Uses canonical type-only arguments for exact PostgreSQL signature resolution.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_rec RECORD;
  v_cur_func RECORD;
BEGIN
  FOR v_rec IN (
    SELECT object_name AS proname, sub_object_name AS args, metadata
    FROM public._swapstudy_migration_baseline
    WHERE category = 'function' AND schema_name = 'public'
  ) LOOP
    SELECT 
      p.oid,
      md5(p.prosrc) AS body_hash,
      p.prosecdef,
      p.provolatile,
      p.proparallel,
      coalesce(p.proconfig::text, '') AS proconfig_text,
      p.proisstrict,
      p.proleakproof
    INTO v_cur_func
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = v_rec.proname
      AND oidvectortypes(p.proargtypes) = v_rec.args;

    IF FOUND THEN
      IF v_cur_func.oid != (v_rec.metadata->>'oid')::oid
         OR v_cur_func.body_hash != (v_rec.metadata->>'body_hash')
         OR v_cur_func.prosecdef != (v_rec.metadata->>'prosecdef')::boolean
         OR v_cur_func.provolatile != (v_rec.metadata->>'provolatile')
         OR v_cur_func.proparallel != (v_rec.metadata->>'proparallel')
         OR v_cur_func.proconfig_text != coalesce(v_rec.metadata->>'proconfig_text', '')
         OR v_cur_func.proisstrict != (v_rec.metadata->>'proisstrict')::boolean
         OR v_cur_func.proleakproof != (v_rec.metadata->>'proleakproof')::boolean THEN
        RAISE EXCEPTION 'Aborting rollback: function public.%(%) was replaced or modified after migration (current OID: %, baseline OID: %). Rollback cannot safely proceed.',
          v_rec.proname, v_rec.args, v_cur_func.oid, (v_rec.metadata->>'oid')::oid;
      END IF;

      EXECUTE format('DROP FUNCTION public.%I(%s) RESTRICT', v_rec.proname, v_rec.args);
      RAISE NOTICE 'Dropped verified function public.%(%) (OID matches migration).', v_rec.proname, v_rec.args;
    END IF;
  END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 8. POST-ROLLBACK VERIFICATION GATE
-- Proves all migration-owned objects are removed before baseline table deletion.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_leftover_tables int;
  v_leftover_funcs int;
BEGIN
  -- Check leftover tables
  SELECT count(*) INTO v_leftover_tables
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND c.relname IN (
      'skill_swap_invitations', 'messages', 'conversation_participants', 'conversations',
      'post_bookmarks', 'post_likes', 'post_comments', 'community_posts',
      'learning_group_members', 'learning_groups', 'reviews', 'credit_transactions',
      'sessions', 'skills', 'student_connections', 'college_verification_requests',
      'wallets', 'profiles', 'colleges'
    );

  IF v_leftover_tables > 0 THEN
    RAISE EXCEPTION 'Rollback verification gate failed: % migration-created tables still exist.', v_leftover_tables;
  END IF;

  -- Check leftover functions
  SELECT count(*) INTO v_leftover_funcs
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'fn_protect_profile_integrity', 'get_current_user_college', 'handle_new_auth_user',
      'handle_user_email_sync_and_verification', 'fn_submit_college_verification',
      'fn_approve_college_verification', 'has_accepted_connection', 'fn_before_conversation_insert',
      'is_conversation_participant', 'fn_validate_conversation_participant', 'fn_protect_participant_update',
      'fn_before_message_insert', 'fn_after_message_insert', 'fn_validate_skill_swap_invitation',
      'fn_protect_invitation_update', 'fn_get_or_create_direct_conversation', 'fn_send_skill_swap_invitation',
      'fn_respond_to_skill_swap_invitation', 'fn_mark_conversation_read', 'fn_book_session_with_escrow',
      'fn_decline_or_cancel_session', 'fn_complete_session',
      'fn_after_learning_group_insert', 'fn_protect_post_update',
      'fn_check_direct_conversation_participants'
    );

  IF v_leftover_funcs > 0 THEN
    RAISE EXCEPTION 'Rollback verification gate failed: % migration-created functions still exist.', v_leftover_funcs;
  END IF;

  -- Check leftover auth triggers
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_proc p ON t.tgfoid = p.oid
    JOIN pg_namespace np ON p.pronamespace = np.oid
    WHERE n.nspname = 'auth' AND c.relname = 'users'
      AND np.nspname = 'public' AND p.proname IN ('handle_new_auth_user', 'handle_user_email_sync_and_verification')
  ) THEN
    RAISE EXCEPTION 'Rollback verification gate failed: SwapStudy triggers still exist on auth.users.';
  END IF;

  RAISE NOTICE 'Rollback verification gate PASSED: All migration objects cleanly removed.';
END $$;

-- ------------------------------------------------------------------------------
-- 9. CLEAN UP BASELINE TRACKING TABLE
-- ------------------------------------------------------------------------------
DROP TABLE public._swapstudy_migration_baseline RESTRICT;

COMMIT;
