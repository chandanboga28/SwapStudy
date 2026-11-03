-- ==============================================================================
-- SWAPSTUDY PRODUCTION ROLLBACK SCRIPT
-- Migration: 20261102_swapstudy_master_schema.sql
-- Description: Safely and cleanly rolls back all public schema objects, functions,
--              triggers, and publication memberships created by SwapStudy.
-- Safety: ONLY drops objects created by this migration. Does NOT drop extensions,
--         auth tables, storage objects, or unrelated Supabase schemas.
-- ==============================================================================

BEGIN;

-- 1. DROP TRIGGERS ON auth.users (owned by SwapStudy)
-- Must be dropped first so that auth.users operations do not call non-existent functions.
DROP TRIGGER IF EXISTS tr_on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS tr_on_auth_user_email_sync ON auth.users;

-- 2. DYNAMICALLY REMOVE SWAPSTUDY TABLES FROM supabase_realtime PUBLICATION
-- Uses a dynamic query over pg_publication_tables to prevent syntax errors
-- if the publication does not exist or if tables were not added.
DO $$
DECLARE
  r RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOR r IN (
      SELECT tablename FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename IN (
          'community_posts', 'post_comments', 'messages', 'conversations',
          'conversation_participants', 'credit_transactions', 'sessions',
          'college_verification_requests', 'student_connections'
        )
    ) LOOP
      EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.' || quote_ident(r.tablename);
    END LOOP;
  END IF;
END $$;

-- 3. DROP VIEW
DROP VIEW IF EXISTS public.users CASCADE;

-- 4. DROP SWAPSTUDY TABLES (19 Base Tables)
-- Dropped with CASCADE to remove all table-level foreign keys, indexes, and triggers.
DROP TABLE IF EXISTS public.skill_swap_invitations CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversation_participants CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.learning_group_members CASCADE;
DROP TABLE IF EXISTS public.learning_groups CASCADE;
DROP TABLE IF EXISTS public.post_bookmarks CASCADE;
DROP TABLE IF EXISTS public.post_likes CASCADE;
DROP TABLE IF EXISTS public.post_comments CASCADE;
DROP TABLE IF EXISTS public.community_posts CASCADE;
DROP TABLE IF EXISTS public.student_connections CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.skills CASCADE;
DROP TABLE IF EXISTS public.college_verification_requests CASCADE;
DROP TABLE IF EXISTS public.credit_transactions CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.colleges CASCADE;

-- 5. DROP CUSTOM FUNCTIONS (Exact 22 Functions created by SwapStudy)
DROP FUNCTION IF EXISTS public.fn_protect_profile_integrity CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_college CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_auth_user CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_email_sync_and_verification CASCADE;
DROP FUNCTION IF EXISTS public.fn_submit_college_verification CASCADE;
DROP FUNCTION IF EXISTS public.fn_approve_college_verification CASCADE;
DROP FUNCTION IF EXISTS public.has_accepted_connection CASCADE;
DROP FUNCTION IF EXISTS public.fn_before_conversation_insert CASCADE;
DROP FUNCTION IF EXISTS public.is_conversation_participant CASCADE;
DROP FUNCTION IF EXISTS public.fn_validate_conversation_participant CASCADE;
DROP FUNCTION IF EXISTS public.fn_protect_participant_update CASCADE;
DROP FUNCTION IF EXISTS public.fn_before_message_insert CASCADE;
DROP FUNCTION IF EXISTS public.fn_after_message_insert CASCADE;
DROP FUNCTION IF EXISTS public.fn_validate_skill_swap_invitation CASCADE;
DROP FUNCTION IF EXISTS public.fn_protect_invitation_update CASCADE;
DROP FUNCTION IF EXISTS public.fn_get_or_create_direct_conversation CASCADE;
DROP FUNCTION IF EXISTS public.fn_send_skill_swap_invitation CASCADE;
DROP FUNCTION IF EXISTS public.fn_respond_to_skill_swap_invitation CASCADE;
DROP FUNCTION IF EXISTS public.fn_mark_conversation_read CASCADE;
DROP FUNCTION IF EXISTS public.fn_book_session_with_escrow CASCADE;
DROP FUNCTION IF EXISTS public.fn_decline_or_cancel_session CASCADE;
DROP FUNCTION IF EXISTS public.fn_complete_session CASCADE;

COMMIT;
