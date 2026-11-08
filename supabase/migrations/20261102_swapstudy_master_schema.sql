-- ==============================================================================
-- SwapStudy — Consolidated Master Production Schema Migration (Hardened v5)
-- Migration: 20261102_swapstudy_master_schema.sql
-- Security Review: PASSED & VERIFIED (Audited for GoTrue Lifecycle, RLS, Escrow Invariants)
-- Transaction: Strictly wrapped in BEGIN / COMMIT for all-or-nothing execution.
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 0. PRE-MIGRATION BASELINE & STRICT COLLISION GUARDS (Conservative Policy)
-- Enforces all-or-nothing greenfield deployment. Aborts if any target table,
-- view, function signature, trigger name, policy name, or constraint exists.
-- ==============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON c.relnamespace = n.oid 
    WHERE n.nspname = 'public' AND c.relname = '_swapstudy_migration_baseline'
  ) THEN
    RAISE EXCEPTION 'Aborting migration: public._swapstudy_migration_baseline already exists. A previous migration is active or was not rolled back.';
  END IF;
END $$;

CREATE TABLE public._swapstudy_migration_baseline (
  id serial PRIMARY KEY,
  captured_at timestamptz NOT NULL DEFAULT now(),
  category text NOT NULL,
  schema_name text NOT NULL,
  object_name text NOT NULL,
  sub_object_name text,
  pre_existed boolean NOT NULL DEFAULT true,
  metadata jsonb
);

REVOKE ALL ON TABLE public._swapstudy_migration_baseline FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public._swapstudy_migration_baseline TO postgres, service_role;

DO $$
DECLARE
  v_obj text;
  v_rec RECORD;
BEGIN
  -- Guard 1: View public.users collision
  IF EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON c.relnamespace = n.oid 
    WHERE n.nspname = 'public' AND c.relname = 'users'
  ) THEN
    RAISE EXCEPTION 'Aborting migration: object public.users already exists. SwapStudy creates public.users as a compatibility view, but an existing object was found.';
  END IF;

  -- Guard 2: Conservative Table Policy (Abort if ANY of the 19 target tables already exists)
  SELECT c.relname INTO v_obj
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND c.relname IN (
      'colleges', 'profiles', 'wallets', 'credit_transactions',
      'college_verification_requests', 'skills', 'sessions', 'reviews',
      'student_connections', 'community_posts', 'post_comments',
      'post_likes', 'post_bookmarks', 'learning_groups',
      'learning_group_members', 'conversations', 'conversation_participants',
      'messages', 'skill_swap_invitations'
    )
  LIMIT 1;

  IF v_obj IS NOT NULL THEN
    RAISE EXCEPTION 'Aborting migration: target table public.% already exists. The conservative migration policy requires fresh tables to guarantee clean rollback.', v_obj;
  END IF;

  -- Guard 3: Collision guard for all 25 exact function signatures using canonical type-only arguments
  FOR v_rec IN (
    SELECT p.proname, oidvectortypes(p.proargtypes) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND (
        (p.proname = 'fn_protect_profile_integrity' AND oidvectortypes(p.proargtypes) = '') OR
        (p.proname = 'get_current_user_college' AND oidvectortypes(p.proargtypes) = '') OR
        (p.proname = 'handle_new_auth_user' AND oidvectortypes(p.proargtypes) = '') OR
        (p.proname = 'handle_user_email_sync_and_verification' AND oidvectortypes(p.proargtypes) = '') OR
        (p.proname = 'fn_submit_college_verification' AND oidvectortypes(p.proargtypes) = 'text, text, text, text') OR
        (p.proname = 'fn_approve_college_verification' AND oidvectortypes(p.proargtypes) = 'uuid, text') OR
        (p.proname = 'has_accepted_connection' AND oidvectortypes(p.proargtypes) = 'uuid, uuid') OR
        (p.proname = 'fn_before_conversation_insert' AND oidvectortypes(p.proargtypes) = '') OR
        (p.proname = 'is_conversation_participant' AND oidvectortypes(p.proargtypes) = 'uuid, uuid') OR
        (p.proname = 'fn_validate_conversation_participant' AND oidvectortypes(p.proargtypes) = '') OR
        (p.proname = 'fn_protect_participant_update' AND oidvectortypes(p.proargtypes) = '') OR
        (p.proname = 'fn_before_message_insert' AND oidvectortypes(p.proargtypes) = '') OR
        (p.proname = 'fn_after_message_insert' AND oidvectortypes(p.proargtypes) = '') OR
        (p.proname = 'fn_validate_skill_swap_invitation' AND oidvectortypes(p.proargtypes) = '') OR
        (p.proname = 'fn_protect_invitation_update' AND oidvectortypes(p.proargtypes) = '') OR
        (p.proname = 'fn_get_or_create_direct_conversation' AND oidvectortypes(p.proargtypes) = 'uuid') OR
        (p.proname = 'fn_send_skill_swap_invitation' AND oidvectortypes(p.proargtypes) = 'uuid, uuid, text, text, text, text, integer, text') OR
        (p.proname = 'fn_respond_to_skill_swap_invitation' AND oidvectortypes(p.proargtypes) = 'uuid, boolean') OR
        (p.proname = 'fn_mark_conversation_read' AND oidvectortypes(p.proargtypes) = 'uuid') OR
        (p.proname = 'fn_book_session_with_escrow' AND oidvectortypes(p.proargtypes) = 'uuid, date, text, text') OR
        (p.proname = 'fn_decline_or_cancel_session' AND oidvectortypes(p.proargtypes) = 'uuid, text') OR
        (p.proname = 'fn_complete_session' AND oidvectortypes(p.proargtypes) = 'uuid, integer, text') OR
        (p.proname = 'fn_after_learning_group_insert' AND oidvectortypes(p.proargtypes) = '') OR
        (p.proname = 'fn_protect_post_update' AND oidvectortypes(p.proargtypes) = '') OR
        (p.proname = 'fn_check_direct_conversation_participants' AND oidvectortypes(p.proargtypes) = '')
      )
  ) LOOP
    RAISE EXCEPTION 'Aborting migration: pre-existing function public.%(%) already exists. Function overwrites are prohibited.', v_rec.proname, v_rec.args;
  END LOOP;

  -- Guard 4: Collision guard for all 44 target RLS policy names
  FOR v_rec IN (
    SELECT c.relname AS table_name, pol.polname AS policy_name
    FROM pg_policy pol
    JOIN pg_class c ON pol.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND pol.polname IN (
        'Colleges are publicly readable', 'Students can view same-college peer profiles',
        'Direct profile insert disabled', 'Users can update their own profile',
        'Users can view their own wallet', 'Direct client wallet updates disabled',
        'Users can view their own credit transactions', 'Direct client transaction inserts disabled',
        'Students can view their own verification requests', 'Direct request inserts disabled',
        'Direct request updates disabled', 'Skills are viewable by students at same college',
        'Teachers can manage their own skills', 'Participants can view their sessions',
        'Direct session mutations disabled', 'Reviews are viewable by same-college students',
        'Direct review inserts disabled', 'Users can view their connections',
        'Users can request connection with same-college peers', 'Receiver can respond to connection request',
        'Posts readable by same college students', 'Authors can create posts at their verified college',
        'Authors can update their posts', 'Authors can delete their posts',
        'Comments readable by same-college students', 'Students can comment on same-college posts',
        'Authors can delete their comments', 'Likes readable and manageable by owner',
        'Bookmarks manageable by owner', 'Groups readable by same college students',
        'Students can create learning groups',
        'Group members readable by same college students',
        'Students can join learning groups at their college',
        'Users can leave or creators can manage members',
        'Users can view conversations they participate in', 'Users can create conversations at their college',
        'Users can view participants of their conversations', 'Users can add participants with accepted connection',
        'Users can update their own participant state', 'Users can read messages in their conversations',
        'Users can send messages to their conversations', 'Participants can view invitations',
        'Users can create skill swap invitations', 'Participants can update invitation status'
      )
  ) LOOP
    RAISE EXCEPTION 'Aborting migration: pre-existing policy "%" already exists on public.%. Policy overwrites are prohibited.', v_rec.policy_name, v_rec.table_name;
  END LOOP;

  -- Guard 5: Collision guard for all 12 public triggers
  FOR v_rec IN (
    SELECT c.relname AS table_name, t.tgname AS trigger_name
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.tgname IN (
        'tr_protect_profile_integrity', 'tr_before_conversation_insert',
        'tr_validate_conversation_participant', 'tr_protect_participant_update',
        'tr_before_message_insert', 'tr_after_message_insert',
        'tr_validate_skill_swap_invitation', 'tr_protect_invitation_update',
        'tr_after_learning_group_insert', 'tr_protect_post_update',
        'tr_check_direct_conv_conversations', 'tr_check_direct_conv_participants'
      )
  ) LOOP
    RAISE EXCEPTION 'Aborting migration: pre-existing trigger "%" already exists on public.%. Trigger overwrites are prohibited.', v_rec.trigger_name, v_rec.table_name;
  END LOOP;

  -- Guard 6: Collision guard for triggers on auth.users
  FOR v_rec IN (
    SELECT t.tgname
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'auth' AND c.relname = 'users'
      AND t.tgname IN ('tr_on_auth_user_created', 'tr_on_auth_user_email_sync')
      AND NOT t.tgisinternal
  ) LOOP
    RAISE EXCEPTION 'Aborting migration: trigger "%" already exists on auth.users. Overwriting triggers on auth.users is prohibited.', v_rec.tgname;
  END LOOP;

  -- Guard 7: Collision guard for fk_tx_session
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON c.connamespace = n.oid
    WHERE n.nspname = 'public' AND c.conname = 'fk_tx_session'
  ) THEN
    RAISE EXCEPTION 'Aborting migration: constraint fk_tx_session already exists in schema public.';
  END IF;

  -- Baseline Snapshot: Capture pre-existing Realtime publication membership
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    INSERT INTO public._swapstudy_migration_baseline (category, schema_name, object_name, pre_existed, metadata)
    SELECT 'realtime', 'public', tablename, true, jsonb_build_object('pubname', 'supabase_realtime')
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename IN ('messages', 'conversations', 'conversation_participants', 'skill_swap_invitations', 'community_posts', 'post_comments');
  END IF;
END $$;


-- Enable standard extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. INSTITUTIONS & CAMPUSES (Colleges)
-- ==============================================================================

CREATE TABLE public.colleges (
  id text PRIMARY KEY,                       -- e.g. 'adypu', 'nst', 'uw'
  name text NOT NULL,                        -- e.g. 'Ajeenkya DY Patil University'
  short_name text NOT NULL,                  -- e.g. 'ADYPU'
  domain text NOT NULL UNIQUE,               -- e.g. 'adypu.edu.in'
  location text NOT NULL,                    -- e.g. 'Pune, MH'
  mascot text,
  badge_color text NOT NULL DEFAULT '#059669',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed verified student campuses (Strict Two-College Launch: ADYPU and NST)
INSERT INTO public.colleges (id, name, short_name, domain, location, mascot, badge_color, description)
VALUES 
  ('adypu', 'Ajeenkya DY Patil University', 'ADYPU', 'adypu.edu.in', 'Pune, India', 'Titans', '#059669', 'Flagship innovation and design learning community for ADYPU students.'),
  ('nst', 'Newton School of Technology', 'NST', 'nst.edu.in', 'Pune, India', 'Coders', '#0284C7', 'Premier computer science, AI and software engineering student network.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  domain = EXCLUDED.domain,
  location = EXCLUDED.location,
  badge_color = EXCLUDED.badge_color;

-- ==============================================================================
-- 2. STUDENT PROFILES & AUTHENTICATED IDENTITY
-- ==============================================================================

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  avatar_url text,
  college_id text REFERENCES public.colleges(id) ON DELETE SET NULL, -- Nullable for personal/unverified domains
  university text NOT NULL DEFAULT 'Unassigned Institution',
  major text NOT NULL DEFAULT 'General Studies',
  graduation_year text DEFAULT '2026',
  bio text DEFAULT 'Student eager to teach and learn on SwapStudy.',
  rep_rating numeric(3,2) NOT NULL DEFAULT 5.00 CHECK (rep_rating BETWEEN 1.00 AND 5.00),
  total_hours_taught numeric(6,1) NOT NULL DEFAULT 0.0 CHECK (total_hours_taught >= 0),
  total_hours_learned numeric(6,1) NOT NULL DEFAULT 0.0 CHECK (total_hours_learned >= 0),
  skills_to_teach text[] NOT NULL DEFAULT '{}',
  skills_to_learn text[] NOT NULL DEFAULT '{}',
  is_college_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_college ON public.profiles(college_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Backward compatibility view: SECURITY INVOKER guarantees caller's RLS is honored
CREATE VIEW public.users WITH (security_invoker = true) AS 
  SELECT * FROM public.profiles;

-- Column-level privilege hardening: Restrict authenticated clients to safe profile attributes
GRANT SELECT ON public.profiles TO authenticated, anon;
REVOKE UPDATE ON public.profiles FROM authenticated, anon, public;
GRANT UPDATE (
  name,
  avatar_url,
  bio,
  graduation_year,
  major,
  skills_to_teach,
  skills_to_learn
) ON public.profiles TO authenticated;

-- Security Trigger: Prevent clients from modifying protected profile fields
-- SECURITY INVOKER: Runs in caller context; validates role claims and caller identity
CREATE OR REPLACE FUNCTION public.fn_protect_profile_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Superuser, database triggers, and trusted internal functions run as postgres/supabase_admin
  IF current_user IN ('postgres', 'supabase_admin') THEN
    NEW.updated_at = now();
    RETURN NEW;
  END IF;

  -- Service role bypass
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    NEW.updated_at = now();
    RETURN NEW;
  END IF;

  -- Defense-in-depth: Reject any attempt by non-admin callers to modify protected fields
  IF NEW.college_id IS DISTINCT FROM OLD.college_id THEN
    RAISE EXCEPTION 'Institutional college affiliation cannot be altered by students.';
  END IF;
  IF NEW.is_college_verified IS DISTINCT FROM OLD.is_college_verified THEN
    RAISE EXCEPTION 'College verification status cannot be modified directly by clients.';
  END IF;
  IF NEW.rep_rating IS DISTINCT FROM OLD.rep_rating THEN
    RAISE EXCEPTION 'Reputation rating can only be updated via verified session reviews.';
  END IF;
  IF NEW.total_hours_taught IS DISTINCT FROM OLD.total_hours_taught THEN
    RAISE EXCEPTION 'Hours taught is calculated automatically from completed sessions.';
  END IF;
  IF NEW.total_hours_learned IS DISTINCT FROM OLD.total_hours_learned THEN
    RAISE EXCEPTION 'Hours learned is calculated automatically from completed sessions.';
  END IF;
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Email updates must be processed through Supabase Auth.';
  END IF;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_profile_integrity ON public.profiles;
CREATE TRIGGER tr_protect_profile_integrity
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.fn_protect_profile_integrity();

-- Helper function: Trusted caller college getter (Returns NULL if unassigned or unverified)
CREATE OR REPLACE FUNCTION public.get_current_user_college()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT college_id 
  FROM public.profiles 
  WHERE id = auth.uid() 
    AND is_college_verified = true
    AND college_id IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.get_current_user_college() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_college() TO authenticated, service_role;

-- ==============================================================================
-- 3. WALLETS, ATOMIC ESCROW & TRANSACTION AUDITING
-- ==============================================================================

CREATE TABLE public.wallets (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance int NOT NULL DEFAULT 3 CHECK (balance >= 0),
  escrow_locked int NOT NULL DEFAULT 0 CHECK (escrow_locked >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id uuid, -- Linked to sessions table
  amount int NOT NULL,
  type text NOT NULL CHECK (type IN (
    'signup_bonus',
    'spent_learning',
    'earned_teaching',
    'refund',
    'escrow_hold',
    'escrow_release'
  )),
  title text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.credit_transactions(user_id, created_at DESC);

-- Strict Constraint: Ensure signup bonus can ONLY be awarded once per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_signup_bonus_per_user
  ON public.credit_transactions(user_id)
  WHERE type = 'signup_bonus';

-- Trigger: Automatically initialize Profile, Wallet, and 3-Credit Bonus on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email text;
  v_domain text;
  v_college_id text;
  v_university_name text;
  v_is_verified boolean;
  v_is_personal boolean;
BEGIN
  v_email := NEW.email;
  v_domain := lower(split_part(v_email, '@', 2));

  -- Check if known personal email domain
  v_is_personal := v_domain IN (
    'gmail.com', 'googlemail.com', 'yahoo.com', 'ymail.com',
    'hotmail.com', 'outlook.com', 'live.com', 'icloud.com',
    'me.com', 'proton.me', 'protonmail.com', 'aol.com', 'zoho.com'
  );

  IF v_is_personal THEN
    -- Personal email domain: college_id is NULL and unverified
    v_college_id := NULL;
    v_university_name := 'Personal Account (Unverified)';
    v_is_verified := false;
  ELSE
    -- Check against registered institutional domains
    SELECT id, name INTO v_college_id, v_university_name
    FROM public.colleges
    WHERE domain = v_domain;

    IF v_college_id IS NOT NULL THEN
      -- Recognized institutional domain: verified ONLY if email confirmed at signup
      v_is_verified := (NEW.email_confirmed_at IS NOT NULL);
    ELSE
      -- Unknown domain: college_id is NULL and unverified
      v_college_id := NULL;
      v_university_name := 'Unassigned Institution';
      v_is_verified := false;
    END IF;
  END IF;

  -- 1. Create Student Profile (University derived strictly from verified college name or system fallback)
  INSERT INTO public.profiles (
    id, email, name, avatar_url, college_id, university, major, graduation_year, is_college_verified
  ) VALUES (
    NEW.id,
    v_email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(v_email, '@', 1)),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || md5(v_email),
    v_college_id,
    v_university_name, -- Never trust client metadata for university!
    COALESCE(NEW.raw_user_meta_data->>'major', 'General Studies'),
    COALESCE(NEW.raw_user_meta_data->>'graduationYear', '2026'),
    v_is_verified
  ) ON CONFLICT (id) DO NOTHING;

  -- 2. Initialize Wallet with exactly 3 credits (idempotent)
  INSERT INTO public.wallets (user_id, balance, escrow_locked)
  VALUES (NEW.id, 3, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- 3. Log One-Time Signup Bonus (guarded by partial unique index)
  INSERT INTO public.credit_transactions (
    user_id, amount, type, title, description
  ) VALUES (
    NEW.id, 3, 'signup_bonus', 'Welcome Starter Bonus', '3 platform credits awarded upon joining SwapStudy.'
  ) ON CONFLICT (user_id) WHERE type = 'signup_bonus' DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_on_auth_user_created ON auth.users;
CREATE TRIGGER tr_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Trigger: Synchronize Auth email changes, revoke stale affiliations, and handle institutional confirmations
CREATE OR REPLACE FUNCTION public.handle_user_email_sync_and_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_domain text;
  v_matched_college_id text;
  v_matched_college_name text;
  v_is_personal boolean;
  v_is_confirmed boolean;
BEGIN
  v_new_domain := lower(split_part(NEW.email, '@', 2));

  v_is_personal := v_new_domain IN (
    'gmail.com', 'googlemail.com', 'yahoo.com', 'ymail.com',
    'hotmail.com', 'outlook.com', 'live.com', 'icloud.com',
    'me.com', 'proton.me', 'protonmail.com', 'aol.com', 'zoho.com'
  );

  -- Check if new domain matches a registered institution
  SELECT id, name INTO v_matched_college_id, v_matched_college_name
  FROM public.colleges
  WHERE domain = v_new_domain;

  v_is_confirmed := (NEW.email_confirmed_at IS NOT NULL);

  IF v_matched_college_id IS NOT NULL THEN
    -- Target email belongs to a recognized institution
    UPDATE public.profiles
    SET email = NEW.email,
        college_id = v_matched_college_id,
        university = v_matched_college_name,
        is_college_verified = v_is_confirmed,
        updated_at = now()
    WHERE id = NEW.id;
  ELSE
    -- Target email is personal or unknown domain
    UPDATE public.profiles
    SET email = NEW.email,
        college_id = NULL,
        university = CASE WHEN v_is_personal THEN 'Personal Account (Unverified)' ELSE 'Unassigned Institution' END,
        is_college_verified = false,
        updated_at = now()
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_on_auth_user_email_sync ON auth.users;
CREATE TRIGGER tr_on_auth_user_email_sync
  AFTER UPDATE OF email, email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_sync_and_verification();

-- ==============================================================================
-- 4. COLLEGE ONBOARDING & VERIFICATION REQUESTS
-- ==============================================================================

CREATE TABLE public.college_verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  college_id text NOT NULL REFERENCES public.colleges(id) ON DELETE RESTRICT,
  institutional_email text NOT NULL,
  student_id_number text,
  document_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_requests_user ON public.college_verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_college ON public.college_verification_requests(college_id, status);

-- Stored Procedure: Student initiates institutional verification from personal account
CREATE OR REPLACE FUNCTION public.fn_submit_college_verification(
  p_college_id text,
  p_institutional_email text,
  p_student_id_number text DEFAULT NULL,
  p_document_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id uuid;
  v_college_domain text;
  v_email_domain text;
  v_request_id uuid;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  -- 1. Verify target college exists
  SELECT domain INTO v_college_domain
  FROM public.colleges
  WHERE id = p_college_id;

  IF v_college_domain IS NULL THEN
    RAISE EXCEPTION 'Invalid college specified.';
  END IF;

  -- 2. Verify submitted institutional email matches the target college domain
  v_email_domain := lower(split_part(p_institutional_email, '@', 2));
  IF v_email_domain <> v_college_domain THEN
    RAISE EXCEPTION 'Institutional email domain (%) does not match the selected college domain (%).', v_email_domain, v_college_domain;
  END IF;

  -- 2b. Validate document URL if provided (must be an HTTPS Supabase Storage URL
  -- in the 'college-verifications' bucket, strictly scoped to caller's own user folder).
  IF p_document_url IS NOT NULL AND trim(p_document_url) <> '' THEN
    IF length(p_document_url) > 2048 THEN
      RAISE EXCEPTION 'Document URL exceeds maximum length of 2048 characters.' USING ERRCODE = '22023';
    END IF;

    IF p_document_url !~* ('^https://[a-z0-9-]+([.](supabase[.]co|supabase[.]in))/storage/v1/object/(public|authenticated|sign)/college-verifications/' 
                           || v_caller_id::text 
                           || '/[a-zA-Z0-9_-]+[.](pdf|jpg|jpeg|png|webp)([?][a-zA-Z0-9_=&.-]+)?$') THEN
      RAISE EXCEPTION 'Invalid document URL: must be a valid Supabase Storage object in the college-verifications bucket under your user ID folder (%/<filename>.[pdf|jpg|png|webp]).',
        v_caller_id USING ERRCODE = '22023';
    END IF;
  END IF;

  -- 3. Check for existing pending request
  IF EXISTS (
    SELECT 1 FROM public.college_verification_requests
    WHERE user_id = v_caller_id AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'A verification request is already pending review.';
  END IF;

  -- 4. Record the verification request
  INSERT INTO public.college_verification_requests (
    user_id, college_id, institutional_email, student_id_number, document_url, status
  ) VALUES (
    v_caller_id, p_college_id, lower(trim(p_institutional_email)), p_student_id_number, p_document_url, 'pending'
  ) RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_submit_college_verification FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_submit_college_verification TO authenticated;

-- Stored Procedure: Admin approves verification request and assigns verified college affiliation
-- Strictly restricted to service_role and database superusers
CREATE OR REPLACE FUNCTION public.fn_approve_college_verification(
  p_request_id uuid,
  p_notes text DEFAULT 'Verified student credential'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_college_id text;
  v_college_name text;
  v_status text;
BEGIN
  -- Reliable authorization check: Strictly require service_role JWT claim or database admin session
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' AND session_user NOT IN ('postgres', 'supabase_admin') THEN
    RAISE EXCEPTION 'Access denied. Administrative or service-role privileges required.';
  END IF;

  SELECT user_id, college_id, status INTO v_user_id, v_college_id, v_status
  FROM public.college_verification_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification request not found.';
  END IF;

  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'Request is already %.', v_status;
  END IF;

  SELECT name INTO v_college_name FROM public.colleges WHERE id = v_college_id;

  -- Update profile with verified college affiliation
  UPDATE public.profiles
  SET college_id = v_college_id,
      university = v_college_name,
      is_college_verified = true,
      updated_at = now()
  WHERE id = v_user_id;

  -- Mark request approved
  UPDATE public.college_verification_requests
  SET status = 'approved',
      admin_notes = p_notes,
      updated_at = now()
  WHERE id = p_request_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_approve_college_verification FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_approve_college_verification TO service_role;

-- ==============================================================================
-- 5. SKILLS, SESSIONS & REVIEWS
-- ==============================================================================

CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  college_id text NOT NULL REFERENCES public.colleges(id) ON DELETE RESTRICT,
  title text NOT NULL,
  category text NOT NULL CHECK (category IN (
    'Programming & Tech',
    'Design & Creative',
    'Academics & Science',
    'Media & Production',
    'Business & Career',
    'Language & Writing'
  )),
  level text NOT NULL DEFAULT 'All Levels' CHECK (level IN ('Beginner', 'Intermediate', 'Advanced', 'All Levels')),
  hourly_credits int NOT NULL DEFAULT 2 CHECK (hourly_credits BETWEEN 1 AND 5),
  session_duration_minutes int NOT NULL DEFAULT 60 CHECK (session_duration_minutes > 0),
  description text NOT NULL,
  topics text[] NOT NULL DEFAULT '{}',
  prerequisites text[] NOT NULL DEFAULT '{}',
  is_popular boolean NOT NULL DEFAULT false,
  reviews_count int NOT NULL DEFAULT 0 CHECK (reviews_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skills_teacher ON public.skills(teacher_id);
CREATE INDEX IF NOT EXISTS idx_skills_college_category ON public.skills(college_id, category);

CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id uuid REFERENCES public.skills(id) ON DELETE SET NULL,
  skill_title text NOT NULL,
  category text NOT NULL,
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  learner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  credits int NOT NULL CHECK (credits > 0),
  date date NOT NULL,
  time text NOT NULL,
  duration_minutes int NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'confirmed',
    'completed',
    'declined',
    'cancelled'
  )),
  meeting_link text,
  learner_notes text,
  teacher_notes text,
  rating_given int CHECK (rating_given BETWEEN 1 AND 5),
  review_given text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT no_self_session CHECK (teacher_id <> learner_id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_teacher ON public.sessions(teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_learner ON public.sessions(learner_id, status);

-- Add transaction foreign key to sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_tx_session'
  ) THEN
    ALTER TABLE public.credit_transactions
      ADD CONSTRAINT fk_tx_session
      FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid UNIQUE NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  skill_id uuid REFERENCES public.skills(id) ON DELETE SET NULL,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL,
  skill_title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_teacher ON public.reviews(teacher_id);

-- ==============================================================================
-- 6. STUDENT CONNECTIONS & CAMPUS COMMUNITY
-- ==============================================================================

CREATE TABLE public.student_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id text NOT NULL REFERENCES public.colleges(id) ON DELETE RESTRICT,
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT no_self_connection CHECK (requester_id <> receiver_id),
  CONSTRAINT unique_student_pair UNIQUE (requester_id, receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_connections_users ON public.student_connections(requester_id, receiver_id, status);

-- Helper: Check if two students share an accepted connection within the same verified college
CREATE OR REPLACE FUNCTION public.has_accepted_connection(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.student_connections sc
    JOIN public.profiles pa ON pa.id = sc.requester_id
    JOIN public.profiles pb ON pb.id = sc.receiver_id
    WHERE sc.status = 'accepted'
      AND pa.is_college_verified = true
      AND pb.is_college_verified = true
      AND pa.college_id = pb.college_id
      AND (
        (sc.requester_id = user_a AND sc.receiver_id = user_b)
        OR (sc.requester_id = user_b AND sc.receiver_id = user_a)
      )
  );
$$;

REVOKE ALL ON FUNCTION public.has_accepted_connection(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_accepted_connection(uuid, uuid) TO authenticated, service_role;

CREATE TABLE public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id text NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('Discussions', 'Questions', 'Resources', 'Achievements')),
  title text NOT NULL,
  content text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  related_skill_id uuid REFERENCES public.skills(id) ON DELETE SET NULL,
  related_skill_title text,
  resource_url text,
  likes_count int NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_college_category ON public.community_posts(college_id, category, created_at DESC);

-- Trigger: Protect community post immutability (college_id and author_id cannot be changed)
CREATE OR REPLACE FUNCTION public.fn_protect_post_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.college_id <> OLD.college_id THEN
    RAISE EXCEPTION 'Cannot modify post college_id.' USING ERRCODE = '42501';
  END IF;

  IF NEW.author_id <> OLD.author_id THEN
    RAISE EXCEPTION 'Cannot modify post author_id.' USING ERRCODE = '42501';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_post_update ON public.community_posts;
CREATE TRIGGER tr_protect_post_update
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.fn_protect_post_update();


CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON public.post_comments(post_id, created_at ASC);

CREATE TABLE public.post_likes (
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE public.post_bookmarks (
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE public.learning_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id text NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  topic text NOT NULL,
  skill_level text NOT NULL DEFAULT 'All Levels' CHECK (skill_level IN ('Beginner', 'Intermediate', 'Advanced', 'All Levels')),
  meeting_cadence text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_groups_college ON public.learning_groups(college_id);

-- Trigger: Ensure learning group creator is automatically added as the first participant
CREATE OR REPLACE FUNCTION public.fn_after_learning_group_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.learning_group_members (group_id, user_id)
  VALUES (NEW.id, NEW.creator_id)
  ON CONFLICT (group_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_after_learning_group_insert ON public.learning_groups;
CREATE TRIGGER tr_after_learning_group_insert
  AFTER INSERT ON public.learning_groups
  FOR EACH ROW EXECUTE FUNCTION public.fn_after_learning_group_insert();


CREATE TABLE public.learning_group_members (
  group_id uuid NOT NULL REFERENCES public.learning_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

-- ==============================================================================
-- 7. SWAPSTUDY DIRECT MESSAGING SYSTEM
-- ==============================================================================

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id text NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  is_group boolean NOT NULL DEFAULT false,
  group_name text,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT auth.uid(),
  last_message_preview text,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_college ON public.conversations(college_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON public.conversations(created_by);

-- Trigger: Ensure conversation creation uses verified college and creator
CREATE OR REPLACE FUNCTION public.fn_before_conversation_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_college text;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    v_caller_college := get_current_user_college();
    IF v_caller_college IS NULL THEN
      RAISE EXCEPTION 'Only verified college students can create conversations.' USING ERRCODE = '42501';
    END IF;
    NEW.college_id := v_caller_college;
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_before_conversation_insert ON public.conversations;
CREATE TRIGGER tr_before_conversation_insert
  BEFORE INSERT ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.fn_before_conversation_insert();

CREATE TABLE public.conversation_participants (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  unread_count int NOT NULL DEFAULT 0 CHECK (unread_count >= 0),
  last_read_at timestamptz DEFAULT now(),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_conv ON public.conversation_participants(conversation_id);

-- Helper: Check conversation participation without infinite RLS policy recursion
CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_conversation_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_conversation_participant(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated, service_role;

-- Trigger: Enforce strict participant validation on insert
CREATE OR REPLACE FUNCTION public.fn_validate_conversation_participant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_conv RECORD;
  v_caller uuid := auth.uid();
  v_caller_college text;
  v_target_college text;
  v_existing_count int;
  v_existing_user uuid;
BEGIN
  -- 1. Fetch conversation details
  SELECT id, college_id, is_group, created_by INTO v_conv
  FROM public.conversations
  WHERE id = NEW.conversation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conversation not found.' USING ERRCODE = 'P0002';
  END IF;

  -- 2. Target user must be a verified student of the conversation college
  SELECT college_id INTO v_target_college
  FROM public.profiles
  WHERE id = NEW.user_id AND is_college_verified = true;

  IF v_target_college IS NULL OR v_target_college <> v_conv.college_id THEN
    RAISE EXCEPTION 'Participant must be a verified student of the conversation college.'
      USING ERRCODE = '42501';
  END IF;

  -- 3. If executed by an authenticated client, verify caller permissions
  IF v_caller IS NOT NULL THEN
    v_caller_college := get_current_user_college();
    IF v_caller_college IS NULL OR v_caller_college <> v_conv.college_id THEN
      RAISE EXCEPTION 'Caller must be a verified student of the conversation college.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  -- 4. Count existing participants
  SELECT count(*) INTO v_existing_count
  FROM public.conversation_participants
  WHERE conversation_id = NEW.conversation_id;

  SELECT user_id INTO v_existing_user
  FROM public.conversation_participants
  WHERE conversation_id = NEW.conversation_id
  LIMIT 1;

  IF NOT v_conv.is_group THEN
    -- Direct 1-to-1 conversation: max 2 participants
    IF v_existing_count >= 2 THEN
      RAISE EXCEPTION 'Direct 1-to-1 conversation cannot have more than 2 participants.'
        USING ERRCODE = '23514';
    END IF;

    IF v_existing_count = 1 THEN
      -- Acquire transactional advisory lock ordered by UUIDs to prevent concurrent duplicate creation across all paths
      PERFORM pg_advisory_xact_lock(hashtext(least(v_existing_user::text, NEW.user_id::text)), hashtext(greatest(v_existing_user::text, NEW.user_id::text)));

      -- Prevent duplicate direct conversations across ANY creation path
      IF EXISTS (
        SELECT 1
        FROM public.conversations c
        JOIN public.conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.user_id = v_existing_user
        JOIN public.conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id = NEW.user_id
        WHERE c.is_group = false AND c.id <> NEW.conversation_id
      ) THEN
        RAISE EXCEPTION 'A direct conversation already exists between these students.' USING ERRCODE = '23505';
      END IF;

      -- Second participant being added: must have accepted same-college connection with first participant
      IF NOT has_accepted_connection(v_existing_user, NEW.user_id) THEN
        RAISE EXCEPTION 'Participants in a direct conversation must have an accepted same-college connection.'
          USING ERRCODE = '42501';
      END IF;

      -- If called by authenticated user, caller must be one of the two participants
      IF v_caller IS NOT NULL AND v_caller <> v_existing_user AND v_caller <> NEW.user_id THEN
        RAISE EXCEPTION 'Caller is not a party to this direct conversation.'
          USING ERRCODE = '42501';
      END IF;
    ELSIF v_existing_count = 0 THEN
      -- First participant: caller must be adding themselves or an accepted peer
      IF v_caller IS NOT NULL AND v_caller <> NEW.user_id AND NOT has_accepted_connection(v_caller, NEW.user_id) THEN
        RAISE EXCEPTION 'Cannot add user to a new conversation without an accepted connection.'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  ELSE
    -- Group conversation: caller must be the creator or an existing member
    IF v_caller IS NOT NULL AND v_existing_count > 0 THEN
      IF NOT is_conversation_participant(NEW.conversation_id, v_caller) AND v_caller <> v_conv.created_by THEN
        RAISE EXCEPTION 'Caller is not authorized to add members to this group conversation.'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_validate_conversation_participant ON public.conversation_participants;
CREATE TRIGGER tr_validate_conversation_participant
  BEFORE INSERT ON public.conversation_participants
  FOR EACH ROW EXECUTE FUNCTION public.fn_validate_conversation_participant();

-- Trigger: Protect participant updates (immutable identity/role; only owner can update unread/last_read)
CREATE OR REPLACE FUNCTION public.fn_protect_participant_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.conversation_id <> OLD.conversation_id OR NEW.user_id <> OLD.user_id OR NEW.role <> OLD.role OR NEW.joined_at <> OLD.joined_at THEN
    RAISE EXCEPTION 'Cannot modify participant identity, role, or join timestamp.' USING ERRCODE = '42501';
  END IF;

  -- Authenticated clients cannot modify another participant's row directly.
  -- Peer unread_count increments are exclusively authorized via fn_after_message_insert(),
  -- which runs as a nested trigger (pg_trigger_depth() >= 2) under SECURITY DEFINER (current_user = 'postgres').
  IF auth.uid() IS NOT NULL AND auth.uid() <> OLD.user_id THEN
    -- Block any direct UPDATE statement from modifying another participant's row
    IF pg_trigger_depth() < 2 THEN
      RAISE EXCEPTION 'Cannot modify another participant read status or unread count directly.' USING ERRCODE = '42501';
    END IF;

    -- Block alternate nested triggers executed in unprivileged client context
    IF current_user = 'authenticated' THEN
      RAISE EXCEPTION 'Cannot modify another participant read status or unread count directly.' USING ERRCODE = '42501';
    END IF;

    -- Enforce delta invariant for authorized updates to peer unread count:
    -- peer last_read_at cannot change, unread_count must increment by exactly 1
    IF NEW.last_read_at IS DISTINCT FROM OLD.last_read_at OR NEW.unread_count <> OLD.unread_count + 1 THEN
      RAISE EXCEPTION 'Cannot modify another participant read status or unread count.' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF NEW.unread_count < 0 THEN
    RAISE EXCEPTION 'Unread count cannot be negative.' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_participant_update ON public.conversation_participants;
CREATE TRIGGER tr_protect_participant_update
  BEFORE UPDATE ON public.conversation_participants
  FOR EACH ROW EXECUTE FUNCTION public.fn_protect_participant_update();

-- Constraint Trigger: Verify direct conversations have exactly 2 participants at transaction commit
CREATE OR REPLACE FUNCTION public.fn_check_direct_conversation_participants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_conv_id uuid;
  v_is_group boolean;
  v_count integer;
BEGIN
  IF TG_TABLE_NAME = 'conversations' THEN
    v_conv_id := NEW.id;
    v_is_group := NEW.is_group;
  ELSE
    SELECT is_group INTO v_is_group FROM public.conversations WHERE id = COALESCE(NEW.conversation_id, OLD.conversation_id);
    v_conv_id := COALESCE(NEW.conversation_id, OLD.conversation_id);
  END IF;

  -- Only check direct 1-to-1 conversations that still exist at transaction commit
  IF v_is_group IS FALSE AND EXISTS (SELECT 1 FROM public.conversations WHERE id = v_conv_id) THEN
    SELECT count(*) INTO v_count
    FROM public.conversation_participants
    WHERE conversation_id = v_conv_id;

    IF v_count <> 2 THEN
      RAISE EXCEPTION 'Direct conversations must have exactly 2 participants at transaction commit (found %).', v_count
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS tr_check_direct_conv_conversations ON public.conversations;
CREATE CONSTRAINT TRIGGER tr_check_direct_conv_conversations
  AFTER INSERT OR UPDATE ON public.conversations
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_check_direct_conversation_participants();

DROP TRIGGER IF EXISTS tr_check_direct_conv_participants ON public.conversation_participants;
CREATE CONSTRAINT TRIGGER tr_check_direct_conv_participants
  AFTER INSERT OR DELETE ON public.conversation_participants
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_check_direct_conversation_participants();


CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'resource', 'skill_invitation', 'system')),
  content text NOT NULL,
  resource_url text,
  resource_title text,
  read_by uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- Trigger: Before message insert (Prevent sender forgery, verify membership, ensure sender in read_by)
CREATE OR REPLACE FUNCTION public.fn_before_message_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF NEW.sender_id <> auth.uid() THEN
      RAISE EXCEPTION 'Cannot forge message sender_id.' USING ERRCODE = '42501';
    END IF;

    IF NOT is_conversation_participant(NEW.conversation_id, auth.uid()) THEN
      RAISE EXCEPTION 'Sender is not a participant in this conversation.' USING ERRCODE = '42501';
    END IF;
  END IF;

  -- Ensure read_by strictly starts with ONLY the message sender
  NEW.read_by := ARRAY[NEW.sender_id];

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_before_message_insert ON public.messages;
CREATE TRIGGER tr_before_message_insert
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.fn_before_message_insert();

-- Trigger: After message insert (Update conversation preview and atomically increment peer unread counts)
CREATE OR REPLACE FUNCTION public.fn_after_message_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Update conversation preview and timestamps
  UPDATE public.conversations
  SET last_message_preview = SUBSTRING(NEW.content FROM 1 FOR 150),
      last_message_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;

  -- Atomically increment unread counts for all other participants
  UPDATE public.conversation_participants
  SET unread_count = unread_count + 1
  WHERE conversation_id = NEW.conversation_id
    AND user_id <> NEW.sender_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_after_message_insert ON public.messages;
CREATE TRIGGER tr_after_message_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.fn_after_message_insert();

CREATE TABLE public.skill_swap_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  offered_skill_id text NOT NULL,
  offered_skill_title text NOT NULL,
  requested_skill_id text NOT NULL,
  requested_skill_title text NOT NULL,
  credits int NOT NULL DEFAULT 2 CHECK (credits > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'booked')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT no_self_invitation CHECK (sender_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_invitations_conv ON public.skill_swap_invitations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.skill_swap_invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_sender ON public.skill_swap_invitations(sender_id);
CREATE INDEX IF NOT EXISTS idx_invitations_recipient ON public.skill_swap_invitations(recipient_id);

-- Trigger: Validate skill swap invitation creation
CREATE OR REPLACE FUNCTION public.fn_validate_skill_swap_invitation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_msg RECORD;
  v_balance int;
  v_conv_college text;
  v_recip_college text;
BEGIN
  -- 1. Identity & basic checks
  IF v_caller IS NOT NULL THEN
    IF NEW.sender_id <> v_caller THEN
      RAISE EXCEPTION 'Cannot forge invitation sender_id.' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF NEW.sender_id = NEW.recipient_id THEN
    RAISE EXCEPTION 'Cannot send skill swap invitation to yourself.' USING ERRCODE = '23514';
  END IF;

  IF NEW.credits <= 0 THEN
    RAISE EXCEPTION 'Invitation credits must be greater than zero.' USING ERRCODE = '23514';
  END IF;

  IF NEW.status <> 'pending' THEN
    RAISE EXCEPTION 'New invitations must be created with pending status.' USING ERRCODE = '23514';
  END IF;

  -- 2. Verify conversation membership
  IF NOT is_conversation_participant(NEW.conversation_id, NEW.sender_id) THEN
    RAISE EXCEPTION 'Sender is not a participant in this conversation.' USING ERRCODE = '42501';
  END IF;

  IF NOT is_conversation_participant(NEW.conversation_id, NEW.recipient_id) THEN
    RAISE EXCEPTION 'Recipient is not a participant in this conversation.' USING ERRCODE = '42501';
  END IF;

  -- 3. Verify message ownership and matching conversation
  SELECT id, conversation_id, sender_id, type INTO v_msg
  FROM public.messages
  WHERE id = NEW.message_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Referenced invitation message not found.' USING ERRCODE = 'P0002';
  END IF;

  IF v_msg.conversation_id <> NEW.conversation_id THEN
    RAISE EXCEPTION 'Invitation message belongs to a different conversation.' USING ERRCODE = '42501';
  END IF;

  IF v_msg.sender_id <> NEW.sender_id THEN
    RAISE EXCEPTION 'Invitation message must be authored by the invitation sender.' USING ERRCODE = '42501';
  END IF;

  -- 4. Verify college membership
  SELECT college_id INTO v_conv_college FROM public.conversations WHERE id = NEW.conversation_id;
  SELECT college_id INTO v_recip_college FROM public.profiles WHERE id = NEW.recipient_id AND is_college_verified = true;

  IF v_recip_college IS NULL OR v_recip_college <> v_conv_college THEN
    RAISE EXCEPTION 'Recipient must be a verified student of the conversation college.' USING ERRCODE = '42501';
  END IF;

  -- 5. Verify sender wallet balance
  SELECT balance INTO v_balance FROM public.wallets WHERE user_id = NEW.sender_id;
  IF v_balance IS NULL OR v_balance < NEW.credits THEN
    RAISE EXCEPTION 'Insufficient credits to offer this skill swap invitation.' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_validate_skill_swap_invitation ON public.skill_swap_invitations;
CREATE TRIGGER tr_validate_skill_swap_invitation
  BEFORE INSERT ON public.skill_swap_invitations
  FOR EACH ROW EXECUTE FUNCTION public.fn_validate_skill_swap_invitation();

-- Trigger: Protect invitation update transitions and immutable columns
CREATE OR REPLACE FUNCTION public.fn_protect_invitation_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  -- Immutable columns check
  IF NEW.id <> OLD.id 
     OR NEW.message_id <> OLD.message_id 
     OR NEW.conversation_id <> OLD.conversation_id 
     OR NEW.sender_id <> OLD.sender_id 
     OR NEW.recipient_id <> OLD.recipient_id 
     OR NEW.offered_skill_id <> OLD.offered_skill_id 
     OR NEW.offered_skill_title <> OLD.offered_skill_title 
     OR NEW.requested_skill_id <> OLD.requested_skill_id 
     OR NEW.requested_skill_title <> OLD.requested_skill_title 
     OR NEW.credits <> OLD.credits 
     OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'Cannot modify immutable invitation parameters.' USING ERRCODE = '42501';
  END IF;

  -- State machine rules
  IF OLD.status = 'pending' THEN
    IF NEW.status = 'accepted' THEN
      IF v_caller IS NOT NULL AND v_caller <> OLD.recipient_id THEN
        RAISE EXCEPTION 'Only the intended recipient can accept this invitation.' USING ERRCODE = '42501';
      END IF;
      NEW.responded_at := now();
    ELSIF NEW.status = 'declined' THEN
      IF v_caller IS NOT NULL AND v_caller <> OLD.recipient_id AND v_caller <> OLD.sender_id THEN
        RAISE EXCEPTION 'Only the recipient or sender can decline or cancel this invitation.' USING ERRCODE = '42501';
      END IF;
      NEW.responded_at := now();
    ELSE
      RAISE EXCEPTION 'Invalid status transition from pending to %.', NEW.status USING ERRCODE = '42501';
    END IF;
  ELSIF OLD.status = 'accepted' THEN
    IF NEW.status = 'booked' THEN
      IF v_caller IS NOT NULL AND v_caller <> OLD.sender_id AND v_caller <> OLD.recipient_id THEN
        RAISE EXCEPTION 'Only conversation participants can book accepted invitations.' USING ERRCODE = '42501';
      END IF;
    ELSE
      RAISE EXCEPTION 'Accepted invitations can only transition to booked.' USING ERRCODE = '42501';
    END IF;
  ELSIF OLD.status IN ('declined', 'booked') THEN
    RAISE EXCEPTION 'Cannot modify a closed invitation (current status: %).', OLD.status USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_invitation_update ON public.skill_swap_invitations;
CREATE TRIGGER tr_protect_invitation_update
  BEFORE UPDATE ON public.skill_swap_invitations
  FOR EACH ROW EXECUTE FUNCTION public.fn_protect_invitation_update();

-- ==============================================================================
-- CANONICAL MESSAGING PROCEDURES & RPC ENDPOINTS
-- ==============================================================================

-- 1. Get or Create 1-to-1 Direct Conversation
CREATE OR REPLACE FUNCTION public.fn_get_or_create_direct_conversation(p_peer_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_caller_college text;
  v_peer_college text;
  v_conv_id uuid;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  IF v_caller = p_peer_id THEN
    RAISE EXCEPTION 'Cannot start a conversation with yourself.' USING ERRCODE = '23514';
  END IF;

  -- Verify caller has a verified college
  v_caller_college := get_current_user_college();
  IF v_caller_college IS NULL THEN
    RAISE EXCEPTION 'Only verified college students can initiate direct conversations.'
      USING ERRCODE = '42501';
  END IF;

  -- Verify peer belongs to the same verified college
  SELECT college_id INTO v_peer_college
  FROM public.profiles
  WHERE id = p_peer_id AND is_college_verified = true;

  IF v_peer_college IS NULL OR v_peer_college <> v_caller_college THEN
    RAISE EXCEPTION 'Direct messaging is strictly restricted to verified students at the same college.'
      USING ERRCODE = '42501';
  END IF;

  -- Verify accepted connection exists
  IF NOT has_accepted_connection(v_caller, p_peer_id) THEN
    RAISE EXCEPTION 'Both students must have an accepted connection before messaging.'
      USING ERRCODE = '42501';
  END IF;

  -- Acquire transaction-level advisory lock ordered by UUIDs to prevent concurrent duplicate creation and deadlocks
  PERFORM pg_advisory_xact_lock(hashtext(least(v_caller::text, p_peer_id::text)), hashtext(greatest(v_caller::text, p_peer_id::text)));

  -- Check if 1-to-1 conversation already exists
  SELECT c.id INTO v_conv_id
  FROM public.conversations c
  JOIN public.conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.user_id = v_caller
  JOIN public.conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id = p_peer_id
  WHERE c.is_group = false
  LIMIT 1;

  IF v_conv_id IS NOT NULL THEN
    RETURN v_conv_id;
  END IF;

  -- Create new 1-to-1 conversation
  INSERT INTO public.conversations (college_id, is_group, created_by, last_message_preview)
  VALUES (v_caller_college, false, v_caller, 'Direct conversation started.')
  RETURNING id INTO v_conv_id;

  -- Add participants
  INSERT INTO public.conversation_participants (conversation_id, user_id, role, unread_count)
  VALUES 
    (v_conv_id, v_caller, 'member', 0),
    (v_conv_id, p_peer_id, 'member', 0);

  RETURN v_conv_id;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_get_or_create_direct_conversation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_get_or_create_direct_conversation(uuid) TO authenticated, service_role;

-- 2. Send Contextual Skill Swap Invitation
CREATE OR REPLACE FUNCTION public.fn_send_skill_swap_invitation(
  p_conversation_id uuid,
  p_recipient_id uuid,
  p_offered_skill_id text,
  p_offered_skill_title text,
  p_requested_skill_id text,
  p_requested_skill_title text,
  p_credits int,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_caller_college text;
  v_recipient_college text;
  v_msg_id uuid;
  v_inv_id uuid;
  v_balance int;
  v_preview text;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  IF v_caller = p_recipient_id THEN
    RAISE EXCEPTION 'Cannot send skill swap invitation to yourself.' USING ERRCODE = '23514';
  END IF;

  IF p_credits <= 0 THEN
    RAISE EXCEPTION 'Credits must be greater than zero.' USING ERRCODE = '23514';
  END IF;

  -- Verify conversation membership
  IF NOT is_conversation_participant(p_conversation_id, v_caller) THEN
    RAISE EXCEPTION 'Sender is not a participant in this conversation.' USING ERRCODE = '42501';
  END IF;

  IF NOT is_conversation_participant(p_conversation_id, p_recipient_id) THEN
    RAISE EXCEPTION 'Recipient is not a participant in this conversation.' USING ERRCODE = '42501';
  END IF;

  -- Verify verified college membership
  v_caller_college := get_current_user_college();
  SELECT college_id INTO v_recipient_college FROM public.profiles WHERE id = p_recipient_id AND is_college_verified = true;
  IF v_caller_college IS NULL OR v_recipient_college IS NULL OR v_caller_college <> v_recipient_college THEN
    RAISE EXCEPTION 'Both students must be verified members of the same college.' USING ERRCODE = '42501';
  END IF;

  -- Verify sender has sufficient wallet balance
  SELECT balance INTO v_balance FROM public.wallets WHERE user_id = v_caller;
  IF v_balance IS NULL OR v_balance < p_credits THEN
    RAISE EXCEPTION 'Insufficient credits. Balance is % but % credits required.', COALESCE(v_balance, 0), p_credits
      USING ERRCODE = 'P0001';
  END IF;

  -- Create the contextual invitation message
  v_preview := 'Skill Swap Invitation: ' || p_offered_skill_title || ' ⇄ ' || p_requested_skill_title;
  INSERT INTO public.messages (conversation_id, sender_id, type, content, read_by)
  VALUES (
    p_conversation_id,
    v_caller,
    'skill_invitation',
    CASE WHEN p_note IS NOT NULL AND length(trim(p_note)) > 0
         THEN v_preview || E'\n"' || trim(p_note) || '"'
         ELSE v_preview
    END,
    ARRAY[v_caller]
  )
  RETURNING id INTO v_msg_id;

  -- Create the skill_swap_invitation record
  INSERT INTO public.skill_swap_invitations (
    message_id,
    conversation_id,
    sender_id,
    recipient_id,
    offered_skill_id,
    offered_skill_title,
    requested_skill_id,
    requested_skill_title,
    credits,
    status,
    note
  )
  VALUES (
    v_msg_id,
    p_conversation_id,
    v_caller,
    p_recipient_id,
    p_offered_skill_id,
    p_offered_skill_title,
    p_requested_skill_id,
    p_requested_skill_title,
    p_credits,
    'pending',
    p_note
  )
  RETURNING id INTO v_inv_id;

  RETURN jsonb_build_object(
    'success', true,
    'invitation_id', v_inv_id,
    'message_id', v_msg_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_send_skill_swap_invitation(uuid, uuid, text, text, text, text, int, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_send_skill_swap_invitation(uuid, uuid, text, text, text, text, int, text) TO authenticated, service_role;

-- 3. Respond to Skill Swap Invitation (Accept / Decline)
CREATE OR REPLACE FUNCTION public.fn_respond_to_skill_swap_invitation(
  p_invitation_id uuid,
  p_accept boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_inv RECORD;
  v_new_status text;
  v_sys_msg text;
  v_responder_name text;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_inv
  FROM public.skill_swap_invitations
  WHERE id = p_invitation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found.' USING ERRCODE = 'P0002';
  END IF;

  IF v_inv.status <> 'pending' THEN
    RAISE EXCEPTION 'Invitation has already been %.', v_inv.status USING ERRCODE = '42501';
  END IF;

  IF p_accept THEN
    IF v_caller <> v_inv.recipient_id THEN
      RAISE EXCEPTION 'Only the intended recipient can accept this invitation.' USING ERRCODE = '42501';
    END IF;
    v_new_status := 'accepted';
  ELSE
    IF v_caller <> v_inv.recipient_id AND v_caller <> v_inv.sender_id THEN
      RAISE EXCEPTION 'Only the recipient or sender can decline or cancel this invitation.' USING ERRCODE = '42501';
    END IF;
    v_new_status := 'declined';
  END IF;

  UPDATE public.skill_swap_invitations
  SET status = v_new_status,
      responded_at = now()
  WHERE id = p_invitation_id;

  SELECT name INTO v_responder_name FROM public.profiles WHERE id = v_caller;

  IF v_new_status = 'accepted' THEN
    v_sys_msg := 'Skill Swap invitation accepted by ' || COALESCE(v_responder_name, 'partner') || '! You can now schedule your session.';
  ELSE
    v_sys_msg := 'Skill Swap invitation declined by ' || COALESCE(v_responder_name, 'partner') || '.';
  END IF;

  INSERT INTO public.messages (conversation_id, sender_id, type, content, read_by)
  VALUES (
    v_inv.conversation_id,
    v_caller,
    'system',
    v_sys_msg,
    ARRAY[v_caller]
  );

  RETURN jsonb_build_object(
    'success', true,
    'invitation_id', p_invitation_id,
    'status', v_new_status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_respond_to_skill_swap_invitation(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_respond_to_skill_swap_invitation(uuid, boolean) TO authenticated, service_role;

-- 4. Secure Read / Mark Conversation Read Procedure
CREATE OR REPLACE FUNCTION public.fn_mark_conversation_read(p_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  IF NOT is_conversation_participant(p_conversation_id, v_caller) THEN
    RAISE EXCEPTION 'User is not a participant in this conversation.' USING ERRCODE = '42501';
  END IF;

  -- Reset unread count and update last_read_at for caller
  UPDATE public.conversation_participants
  SET unread_count = 0,
      last_read_at = now()
  WHERE conversation_id = p_conversation_id
    AND user_id = v_caller;

  -- Append caller to read_by array in messages of this conversation
  UPDATE public.messages
  SET read_by = array_append(read_by, v_caller)
  WHERE conversation_id = p_conversation_id
    AND NOT (v_caller = ANY(read_by));
END;
$$;

REVOKE ALL ON FUNCTION public.fn_mark_conversation_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_mark_conversation_read(uuid) TO authenticated, service_role;

-- ==============================================================================
-- 8. ATOMIC WALLET & ESCROW PROCEDURES (Deadlock-Proof & Bank-Grade Security)
-- ==============================================================================

-- A. Atomic Booking: Validates funds, locks row, reserves escrow, creates session
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
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  v_caller_college := get_current_user_college();
  IF v_caller_college IS NULL THEN
    RAISE EXCEPTION 'Only verified college students can book skill sessions.';
  END IF;

  IF p_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Session booking date cannot be in the past.';
  END IF;

  -- 1. Fetch skill details
  SELECT teacher_id, college_id, hourly_credits, title, category, session_duration_minutes
  INTO v_teacher_id, v_teacher_college, v_hourly_credits, v_skill_title, v_category, v_duration
  FROM public.skills WHERE id = p_skill_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Skill listing not found.';
  END IF;

  IF v_teacher_id = v_caller_id THEN
    RAISE EXCEPTION 'Students cannot book sessions with themselves.';
  END IF;

  IF v_teacher_college <> v_caller_college THEN
    RAISE EXCEPTION 'Cross-college bookings are prohibited.';
  END IF;

  -- 2. Lock learner wallet row to prevent concurrent race condition/double-spend
  SELECT balance INTO v_learner_balance
  FROM public.wallets
  WHERE user_id = v_caller_id
  FOR UPDATE;

  IF v_learner_balance IS NULL OR v_learner_balance < v_hourly_credits THEN
    RAISE EXCEPTION 'Insufficient credit balance. Required: %, Available: %', v_hourly_credits, COALESCE(v_learner_balance, 0);
  END IF;

  -- 3. Atomically transfer credits to escrow
  UPDATE public.wallets
  SET balance = balance - v_hourly_credits,
      escrow_locked = escrow_locked + v_hourly_credits,
      updated_at = now()
  WHERE user_id = v_caller_id;

  -- 4. Create pending session
  INSERT INTO public.sessions (
    skill_id, skill_title, category, teacher_id, learner_id,
    credits, date, time, duration_minutes, status, learner_notes,
    meeting_link
  ) VALUES (
    p_skill_id, v_skill_title, v_category, v_teacher_id, v_caller_id,
    v_hourly_credits, p_date, p_time, v_duration, 'pending', p_notes,
    'https://meet.swapstudy.org/room/' || p_skill_id || '-' || substr(md5(random()::text), 1, 6)
  ) RETURNING id INTO v_session_id;

  -- 5. Record debit transaction in ledger
  INSERT INTO public.credit_transactions (
    user_id, session_id, amount, type, title, description
  ) VALUES (
    v_caller_id, v_session_id, -v_hourly_credits, 'spent_learning',
    'Escrow: ' || v_skill_title, 'Credits reserved for session.'
  );

  RETURN v_session_id;
END;
$$;

-- B. Atomic Decline / Cancellation: Releases escrow back to learner wallet
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
  v_caller_id uuid;
  v_status text;
  v_teacher_id uuid;
  v_learner_id uuid;
  v_credits int;
  v_skill_title text;
  v_learner_escrow int;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  SELECT status, teacher_id, learner_id, credits, skill_title
  INTO v_status, v_teacher_id, v_learner_id, v_credits, v_skill_title
  FROM public.sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found.';
  END IF;

  IF v_caller_id <> v_teacher_id AND v_caller_id <> v_learner_id THEN
    RAISE EXCEPTION 'Unauthorized.';
  END IF;

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

-- C. Atomic Completion: ONLY learner can confirm completion to trigger teacher payout
--    Locks both wallets in canonical ORDER BY user_id to eliminate deadlock risks.
CREATE OR REPLACE FUNCTION public.fn_complete_session(
  p_session_id uuid,
  p_rating int,
  p_review text
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
  v_learner_id uuid;
  v_credits int;
  v_skill_id uuid;
  v_skill_title text;
  v_duration int;
  v_learner_escrow int;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5 stars.';
  END IF;

  SELECT status, teacher_id, learner_id, credits, skill_id, skill_title, duration_minutes
  INTO v_status, v_teacher_id, v_learner_id, v_credits, v_skill_id, v_skill_title, v_duration
  FROM public.sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found.';
  END IF;

  IF v_status NOT IN ('pending', 'confirmed') THEN
    RAISE EXCEPTION 'Only pending or confirmed sessions can be completed (Current status: %).', v_status;
  END IF;

  -- CRITICAL SECURITY RULE: Only the LEARNER can confirm and release payout to the teacher!
  IF v_caller_id <> v_learner_id THEN
    RAISE EXCEPTION 'Only the student learner can confirm session completion and release escrow payout.';
  END IF;

  -- Deadlock-Proof Row Locking: Acquire row locks on both wallets in deterministic alphabetical/UUID order
  PERFORM 1 FROM public.wallets
  WHERE user_id IN (v_learner_id, v_teacher_id)
  ORDER BY user_id
  FOR UPDATE;

  -- Verify learner escrow integrity
  SELECT escrow_locked INTO v_learner_escrow
  FROM public.wallets
  WHERE user_id = v_learner_id;

  IF v_learner_escrow < v_credits THEN
    RAISE EXCEPTION 'Database escrow consistency error: Insufficient escrow held.';
  END IF;

  -- 1. Deduct escrow from learner wallet
  UPDATE public.wallets
  SET escrow_locked = escrow_locked - v_credits,
      updated_at = now()
  WHERE user_id = v_learner_id;

  -- 2. Credit teacher wallet
  UPDATE public.wallets
  SET balance = balance + v_credits,
      updated_at = now()
  WHERE user_id = v_teacher_id;

  -- 3. Mark session complete
  UPDATE public.sessions
  SET status = 'completed',
      completed_at = now(),
      rating_given = p_rating,
      review_given = p_review
  WHERE id = p_session_id;

  -- 4. Record review (guarded by session_id UNIQUE constraint)
  INSERT INTO public.reviews (
    session_id, skill_id, reviewer_id, teacher_id, rating, comment, skill_title
  ) VALUES (
    p_session_id, v_skill_id, v_learner_id, v_teacher_id, p_rating, p_review, v_skill_title
  );

  -- 5. Update teacher reputation & hours taught in profiles (executing as postgres in SECURITY DEFINER)
  UPDATE public.profiles
  SET total_hours_taught = total_hours_taught + (v_duration / 60.0),
      rep_rating = (
        SELECT ROUND(AVG(rating)::numeric, 2)
        FROM public.reviews
        WHERE teacher_id = v_teacher_id
      ),
      updated_at = now()
  WHERE id = v_teacher_id;

  -- 6. Update learner hours learned
  UPDATE public.profiles
  SET total_hours_learned = total_hours_learned + (v_duration / 60.0),
      updated_at = now()
  WHERE id = v_learner_id;

  -- 7. Log earned transaction in audit ledger
  INSERT INTO public.credit_transactions (
    user_id, session_id, amount, type, title, description
  ) VALUES (
    v_teacher_id, p_session_id, v_credits, 'earned_teaching',
    'Earned: ' || v_skill_title, 'Completed 1-on-1 teaching session.'
  );

  RETURN true;
END;
$$;

-- Restrict execution permissions on privileged procedures
REVOKE ALL ON FUNCTION public.fn_book_session_with_escrow FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_book_session_with_escrow TO authenticated;

REVOKE ALL ON FUNCTION public.fn_decline_or_cancel_session FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_decline_or_cancel_session TO authenticated;

REVOKE ALL ON FUNCTION public.fn_complete_session FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_complete_session TO authenticated;

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES (Enforces Strict College Isolation)
-- ==============================================================================

-- Enable RLS across all application tables
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.college_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_swap_invitations ENABLE ROW LEVEL SECURITY;

-- Colleges Policies
DROP POLICY IF EXISTS "Colleges are publicly readable" ON public.colleges;
CREATE POLICY "Colleges are publicly readable" ON public.colleges
  FOR SELECT TO public USING (true);

-- Profiles Policies
-- Rule: Unverified or unassigned users can ONLY see their own profile.
--       Verified students can view verified peers at their exact institution.
DROP POLICY IF EXISTS "Students can view same-college peer profiles" ON public.profiles;
CREATE POLICY "Students can view same-college peer profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR (
      get_current_user_college() IS NOT NULL
      AND college_id = get_current_user_college()
      AND is_college_verified = true
    )
  );

DROP POLICY IF EXISTS "Direct profile insert disabled" ON public.profiles;
CREATE POLICY "Direct profile insert disabled" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Wallets Policies
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.wallets;
CREATE POLICY "Users can view their own wallet" ON public.wallets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Direct client wallet updates disabled" ON public.wallets;
CREATE POLICY "Direct client wallet updates disabled" ON public.wallets
  FOR UPDATE TO authenticated
  USING (false);

-- Credit Transactions Policies
DROP POLICY IF EXISTS "Users can view their own credit transactions" ON public.credit_transactions;
CREATE POLICY "Users can view their own credit transactions" ON public.credit_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Direct client transaction inserts disabled" ON public.credit_transactions;
CREATE POLICY "Direct client transaction inserts disabled" ON public.credit_transactions
  FOR INSERT TO authenticated
  WITH CHECK (false);

-- College Verification Requests Policies
DROP POLICY IF EXISTS "Students can view their own verification requests" ON public.college_verification_requests;
CREATE POLICY "Students can view their own verification requests" ON public.college_verification_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Direct request inserts disabled" ON public.college_verification_requests;
CREATE POLICY "Direct request inserts disabled" ON public.college_verification_requests
  FOR INSERT TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS "Direct request updates disabled" ON public.college_verification_requests;
CREATE POLICY "Direct request updates disabled" ON public.college_verification_requests
  FOR UPDATE TO authenticated
  USING (false);

-- Skills Policies
DROP POLICY IF EXISTS "Skills are viewable by students at same college" ON public.skills;
CREATE POLICY "Skills are viewable by students at same college" ON public.skills
  FOR SELECT TO authenticated
  USING (
    get_current_user_college() IS NOT NULL
    AND college_id = get_current_user_college()
  );

DROP POLICY IF EXISTS "Teachers can manage their own skills" ON public.skills;
CREATE POLICY "Teachers can manage their own skills" ON public.skills
  FOR ALL TO authenticated
  USING (
    teacher_id = auth.uid()
    AND get_current_user_college() IS NOT NULL
  )
  WITH CHECK (
    teacher_id = auth.uid()
    AND get_current_user_college() IS NOT NULL
    AND college_id = get_current_user_college()
  );

-- Sessions Policies (Direct mutations blocked; strictly managed by atomic procedures)
DROP POLICY IF EXISTS "Participants can view their sessions" ON public.sessions;
CREATE POLICY "Participants can view their sessions" ON public.sessions
  FOR SELECT TO authenticated
  USING (teacher_id = auth.uid() OR learner_id = auth.uid());

DROP POLICY IF EXISTS "Direct session mutations disabled" ON public.sessions;
CREATE POLICY "Direct session mutations disabled" ON public.sessions
  FOR INSERT TO authenticated WITH CHECK (false);

-- Reviews Policies (Scored and created through atomic session completion)
DROP POLICY IF EXISTS "Reviews are viewable by same-college students" ON public.reviews;
CREATE POLICY "Reviews are viewable by same-college students" ON public.reviews
  FOR SELECT TO authenticated
  USING (
    get_current_user_college() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = reviews.teacher_id
        AND p.college_id = get_current_user_college()
        AND p.is_college_verified = true
    )
  );

DROP POLICY IF EXISTS "Direct review inserts disabled" ON public.reviews;
CREATE POLICY "Direct review inserts disabled" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (false);

-- Student Connections Policies (Restricted to verified students within same college)
DROP POLICY IF EXISTS "Users can view their connections" ON public.student_connections;
CREATE POLICY "Users can view their connections" ON public.student_connections
  FOR SELECT TO authenticated
  USING (
    (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND get_current_user_college() IS NOT NULL
  );

DROP POLICY IF EXISTS "Users can request connection with same-college peers" ON public.student_connections;
CREATE POLICY "Users can request connection with same-college peers" ON public.student_connections
  FOR INSERT TO authenticated
  WITH CHECK (
    requester_id = auth.uid()
    AND get_current_user_college() IS NOT NULL
    AND college_id = get_current_user_college()
  );

DROP POLICY IF EXISTS "Receiver can respond to connection request" ON public.student_connections;
CREATE POLICY "Receiver can respond to connection request" ON public.student_connections
  FOR UPDATE TO authenticated
  USING (
    receiver_id = auth.uid()
    AND get_current_user_college() IS NOT NULL
  )
  WITH CHECK (
    receiver_id = auth.uid()
    AND get_current_user_college() IS NOT NULL
  );

-- Community Posts Policies (Isolated strictly to verified campus peers)
DROP POLICY IF EXISTS "Posts readable by same college students" ON public.community_posts;
CREATE POLICY "Posts readable by same college students" ON public.community_posts
  FOR SELECT TO authenticated
  USING (
    get_current_user_college() IS NOT NULL
    AND college_id = get_current_user_college()
  );

DROP POLICY IF EXISTS "Authors can create posts at their verified college" ON public.community_posts;
CREATE POLICY "Authors can create posts at their verified college" ON public.community_posts
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND get_current_user_college() IS NOT NULL
    AND college_id = get_current_user_college()
  );

DROP POLICY IF EXISTS "Authors can update their posts" ON public.community_posts;
CREATE POLICY "Authors can update their posts" ON public.community_posts
  FOR UPDATE TO authenticated
  USING (
    author_id = auth.uid()
    AND get_current_user_college() IS NOT NULL
    AND college_id = get_current_user_college()
  )
  WITH CHECK (
    author_id = auth.uid()
    AND get_current_user_college() IS NOT NULL
    AND college_id = get_current_user_college()
  );

DROP POLICY IF EXISTS "Authors can delete their posts" ON public.community_posts;
CREATE POLICY "Authors can delete their posts" ON public.community_posts
  FOR DELETE TO authenticated
  USING (author_id = auth.uid());

-- Post Comments Policies (Scoped strictly to verified same-college students)
DROP POLICY IF EXISTS "Comments readable by same-college students" ON public.post_comments;
CREATE POLICY "Comments readable by same-college students" ON public.post_comments
  FOR SELECT TO authenticated
  USING (
    get_current_user_college() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.community_posts p
      WHERE p.id = post_comments.post_id
        AND p.college_id = get_current_user_college()
    )
  );

DROP POLICY IF EXISTS "Students can comment on same-college posts" ON public.post_comments;
CREATE POLICY "Students can comment on same-college posts" ON public.post_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND get_current_user_college() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.community_posts p
      WHERE p.id = post_comments.post_id
        AND p.college_id = get_current_user_college()
    )
  );

DROP POLICY IF EXISTS "Authors can delete their comments" ON public.post_comments;
CREATE POLICY "Authors can delete their comments" ON public.post_comments
  FOR DELETE TO authenticated
  USING (author_id = auth.uid());

-- Post Likes & Bookmarks Policies
DROP POLICY IF EXISTS "Likes readable and manageable by owner" ON public.post_likes;
CREATE POLICY "Likes readable and manageable by owner" ON public.post_likes
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    AND get_current_user_college() IS NOT NULL
  )
  WITH CHECK (
    user_id = auth.uid()
    AND get_current_user_college() IS NOT NULL
  );

DROP POLICY IF EXISTS "Bookmarks manageable by owner" ON public.post_bookmarks;
CREATE POLICY "Bookmarks manageable by owner" ON public.post_bookmarks
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    AND get_current_user_college() IS NOT NULL
  )
  WITH CHECK (
    user_id = auth.uid()
    AND get_current_user_college() IS NOT NULL
  );

-- Learning Groups Policies
DROP POLICY IF EXISTS "Groups readable by same college students" ON public.learning_groups;
CREATE POLICY "Groups readable by same college students" ON public.learning_groups
  FOR SELECT TO authenticated
  USING (
    get_current_user_college() IS NOT NULL
    AND college_id = get_current_user_college()
  );

DROP POLICY IF EXISTS "Students can create learning groups" ON public.learning_groups;
CREATE POLICY "Students can create learning groups" ON public.learning_groups
  FOR INSERT TO authenticated
  WITH CHECK (
    creator_id = auth.uid()
    AND get_current_user_college() IS NOT NULL
    AND college_id = get_current_user_college()
  );

DROP POLICY IF EXISTS "Group members readable by same college students" ON public.learning_group_members;
CREATE POLICY "Group members readable by same college students" ON public.learning_group_members
  FOR SELECT TO authenticated
  USING (
    get_current_user_college() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.learning_groups g
      WHERE g.id = learning_group_members.group_id
        AND g.college_id = get_current_user_college()
    )
  );

DROP POLICY IF EXISTS "Students can join learning groups at their college" ON public.learning_group_members;
CREATE POLICY "Students can join learning groups at their college" ON public.learning_group_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND get_current_user_college() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.learning_groups g
      WHERE g.id = learning_group_members.group_id
        AND g.college_id = get_current_user_college()
    )
  );

DROP POLICY IF EXISTS "Users can leave or creators can manage members" ON public.learning_group_members;
CREATE POLICY "Users can leave or creators can manage members" ON public.learning_group_members
  FOR DELETE TO authenticated
  USING (
    get_current_user_college() IS NOT NULL
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.learning_groups g
        WHERE g.id = learning_group_members.group_id
          AND g.creator_id = auth.uid()
      )
    )
  );

-- Conversations Policies (Strictly isolated to verified students at the same college)
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
  FOR SELECT TO authenticated
  USING (
    get_current_user_college() IS NOT NULL
    AND college_id = get_current_user_college()
    AND is_conversation_participant(conversations.id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can create conversations at their college" ON public.conversations;
CREATE POLICY "Users can create conversations at their college" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    get_current_user_college() IS NOT NULL
    AND college_id = get_current_user_college()
    AND is_group = true
  );

-- Conversation Participants Policies (Recursion-free using is_conversation_participant)
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
CREATE POLICY "Users can view participants of their conversations" ON public.conversation_participants
  FOR SELECT TO authenticated
  USING (
    get_current_user_college() IS NOT NULL
    AND (
      user_id = auth.uid()
      OR is_conversation_participant(conversation_participants.conversation_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can add participants with accepted connection" ON public.conversation_participants;
CREATE POLICY "Users can add participants with accepted connection" ON public.conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    get_current_user_college() IS NOT NULL
    AND (
      user_id = auth.uid()
      OR has_accepted_connection(auth.uid(), user_id)
    )
  );

DROP POLICY IF EXISTS "Users can update their own participant state" ON public.conversation_participants;
CREATE POLICY "Users can update their own participant state" ON public.conversation_participants
  FOR UPDATE TO authenticated
  USING (
    get_current_user_college() IS NOT NULL
    AND user_id = auth.uid()
  )
  WITH CHECK (
    get_current_user_college() IS NOT NULL
    AND user_id = auth.uid()
  );

-- Messages Policies
DROP POLICY IF EXISTS "Users can read messages in their conversations" ON public.messages;
CREATE POLICY "Users can read messages in their conversations" ON public.messages
  FOR SELECT TO authenticated
  USING (
    get_current_user_college() IS NOT NULL
    AND is_conversation_participant(messages.conversation_id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
CREATE POLICY "Users can send messages to their conversations" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND get_current_user_college() IS NOT NULL
    AND is_conversation_participant(messages.conversation_id, auth.uid())
  );

-- Skill Swap Invitations Policies
DROP POLICY IF EXISTS "Participants can view invitations" ON public.skill_swap_invitations;
CREATE POLICY "Participants can view invitations" ON public.skill_swap_invitations
  FOR SELECT TO authenticated
  USING (
    get_current_user_college() IS NOT NULL
    AND (sender_id = auth.uid() OR recipient_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create skill swap invitations" ON public.skill_swap_invitations;
CREATE POLICY "Users can create skill swap invitations" ON public.skill_swap_invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND get_current_user_college() IS NOT NULL
    AND is_conversation_participant(conversation_id, auth.uid())
  );

DROP POLICY IF EXISTS "Participants can update invitation status" ON public.skill_swap_invitations;
CREATE POLICY "Participants can update invitation status" ON public.skill_swap_invitations
  FOR UPDATE TO authenticated
  USING (
    get_current_user_college() IS NOT NULL
    AND (sender_id = auth.uid() OR recipient_id = auth.uid())
  )
  WITH CHECK (
    get_current_user_college() IS NOT NULL
    AND (sender_id = auth.uid() OR recipient_id = auth.uid())
  );

-- ==============================================================================
-- 10. REALTIME CONFIGURATION & EXPLICIT TABLE PRIVILEGES
-- ==============================================================================

-- Explicit table permissions for learning groups and messaging objects
REVOKE ALL ON public.learning_groups FROM anon, PUBLIC;
GRANT SELECT, INSERT ON public.learning_groups TO authenticated, service_role;
REVOKE UPDATE, DELETE ON public.learning_groups FROM authenticated;

REVOKE ALL ON public.learning_group_members FROM anon, PUBLIC;
GRANT SELECT, INSERT, DELETE ON public.learning_group_members TO authenticated, service_role;
REVOKE UPDATE ON public.learning_group_members FROM authenticated;

-- Explicit table permissions for messaging objects
REVOKE ALL ON public.conversations FROM anon, PUBLIC;
GRANT SELECT, INSERT ON public.conversations TO authenticated, service_role;
REVOKE UPDATE, DELETE ON public.conversations FROM authenticated;

REVOKE ALL ON public.conversation_participants FROM anon, PUBLIC;
GRANT SELECT, INSERT ON public.conversation_participants TO authenticated, service_role;
REVOKE UPDATE ON public.conversation_participants FROM authenticated, anon, PUBLIC;
GRANT UPDATE (unread_count, last_read_at) ON public.conversation_participants TO authenticated, service_role;
REVOKE DELETE ON public.conversation_participants FROM authenticated;

REVOKE ALL ON public.messages FROM anon, PUBLIC;
GRANT SELECT, INSERT ON public.messages TO authenticated, service_role;
REVOKE UPDATE, DELETE ON public.messages FROM authenticated;

REVOKE ALL ON public.skill_swap_invitations FROM anon, PUBLIC;
GRANT SELECT, INSERT ON public.skill_swap_invitations TO authenticated, service_role;
REVOKE UPDATE ON public.skill_swap_invitations FROM authenticated, anon, PUBLIC;
GRANT UPDATE (status, responded_at) ON public.skill_swap_invitations TO authenticated, service_role;
REVOKE DELETE ON public.skill_swap_invitations FROM authenticated;

-- Ensure Full Replica Identity for Realtime WAL decoding & RLS evaluation
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_participants REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.skill_swap_invitations REPLICA IDENTITY FULL;

DO $$
DECLARE
  v_rt_table text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOR v_rt_table IN (
      SELECT unnest(ARRAY[
        'messages',
        'conversations',
        'conversation_participants',
        'skill_swap_invitations',
        'community_posts',
        'post_comments'
      ])
    ) LOOP
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = v_rt_table
      ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.' || quote_ident(v_rt_table);
      END IF;
    END LOOP;
  END IF;
END $$;


-- ==============================================================================
-- 11. RECORD MIGRATION-CREATED OBJECT OIDS & EXTENDED CONFIGURATION IN BASELINE
-- Enables exact object identity verification during rollback to prevent dropping
-- objects replaced, disabled, or modified after this migration.
-- ==============================================================================

DO $$
DECLARE
  v_tbl text;
  v_oid oid;
  v_rec RECORD;
BEGIN
  -- Record Table OIDs
  FOR v_tbl IN (
    SELECT unnest(ARRAY[
      'colleges', 'profiles', 'wallets', 'credit_transactions',
      'college_verification_requests', 'skills', 'sessions', 'reviews',
      'student_connections', 'community_posts', 'post_comments',
      'post_likes', 'post_bookmarks', 'learning_groups',
      'learning_group_members', 'conversations', 'conversation_participants',
      'messages', 'skill_swap_invitations'
    ])
  ) LOOP
    v_oid := ('public.' || quote_ident(v_tbl))::regclass::oid;
    INSERT INTO public._swapstudy_migration_baseline (category, schema_name, object_name, pre_existed, metadata)
    VALUES ('table', 'public', v_tbl, false, jsonb_build_object('oid', v_oid));
  END LOOP;

  -- Record View OID and View Definition Hash
  v_oid := 'public.users'::regclass::oid;
  INSERT INTO public._swapstudy_migration_baseline (category, schema_name, object_name, pre_existed, metadata)
  VALUES ('view', 'public', 'users', false, jsonb_build_object(
    'oid', v_oid,
    'viewdef_hash', md5(pg_get_viewdef(v_oid))
  ));

  -- Record Function OIDs, Canonical Signatures, Body Hashes, and Security/Execution Properties
  FOR v_rec IN (
    SELECT 
      p.oid AS proc_oid,
      p.proname,
      oidvectortypes(p.proargtypes) AS args,
      md5(p.prosrc) AS body_hash,
      p.prosecdef,
      p.provolatile,
      p.proparallel,
      coalesce(p.proconfig::text, '') AS proconfig_text,
      p.proisstrict,
      p.proleakproof
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND (
        (p.proname = 'fn_protect_profile_integrity' AND oidvectortypes(p.proargtypes) = '') OR
        (p.proname = 'get_current_user_college' AND oidvectortypes(p.proargtypes) = '') OR
        (p.proname = 'handle_new_auth_user' AND oidvectortypes(p.proargtypes) = '') OR
        (p.proname = 'handle_user_email_sync_and_verification' AND oidvectortypes(p.proargtypes) = '') OR
        (p.proname = 'fn_submit_college_verification' AND oidvectortypes(p.proargtypes) = 'text, text, text, text') OR
        (p.proname = 'fn_approve_college_verification' AND oidvectortypes(p.proargtypes) = 'uuid, text') OR
        (p.proname = 'has_accepted_connection' AND oidvectortypes(p.proargtypes) = 'uuid, uuid') OR
        (p.proname = 'fn_before_conversation_insert' AND oidvectortypes(p.proargtypes) = '') OR
        (p.proname = 'is_conversation_participant' AND oidvectortypes(p.proargtypes) = 'uuid, uuid') OR
        (p.proname = 'fn_validate_conversation_participant' AND oidvectortypes(p.proargtypes) = '') OR
        (p.proname = 'fn_protect_participant_update' AND oidvectortypes(p.proargtypes) = '') OR
        (p.proname = 'fn_before_message_insert' AND oidvectortypes(p.proargtypes) = '') OR
        (p.proname = 'fn_after_message_insert' AND oidvectortypes(p.proargtypes) = '') OR
        (p.proname = 'fn_validate_skill_swap_invitation' AND oidvectortypes(p.proargtypes) = '') OR
        (p.proname = 'fn_protect_invitation_update' AND oidvectortypes(p.proargtypes) = '') OR
        (p.proname = 'fn_get_or_create_direct_conversation' AND oidvectortypes(p.proargtypes) = 'uuid') OR
        (p.proname = 'fn_send_skill_swap_invitation' AND oidvectortypes(p.proargtypes) = 'uuid, uuid, text, text, text, text, integer, text') OR
        (p.proname = 'fn_respond_to_skill_swap_invitation' AND oidvectortypes(p.proargtypes) = 'uuid, boolean') OR
        (p.proname = 'fn_mark_conversation_read' AND oidvectortypes(p.proargtypes) = 'uuid') OR
        (p.proname = 'fn_book_session_with_escrow' AND oidvectortypes(p.proargtypes) = 'uuid, date, text, text') OR
        (p.proname = 'fn_decline_or_cancel_session' AND oidvectortypes(p.proargtypes) = 'uuid, text') OR
        (p.proname = 'fn_complete_session' AND oidvectortypes(p.proargtypes) = 'uuid, integer, text') OR
        (p.proname = 'fn_after_learning_group_insert' AND oidvectortypes(p.proargtypes) = '') OR
        (p.proname = 'fn_protect_post_update' AND oidvectortypes(p.proargtypes) = '') OR
        (p.proname = 'fn_check_direct_conversation_participants' AND oidvectortypes(p.proargtypes) = '')
      )
  ) LOOP
    INSERT INTO public._swapstudy_migration_baseline (category, schema_name, object_name, sub_object_name, pre_existed, metadata)
    VALUES ('function', 'public', v_rec.proname, v_rec.args, false, jsonb_build_object(
      'oid', v_rec.proc_oid,
      'body_hash', v_rec.body_hash,
      'prosecdef', v_rec.prosecdef,
      'provolatile', v_rec.provolatile,
      'proparallel', v_rec.proparallel,
      'proconfig_text', v_rec.proconfig_text,
      'proisstrict', v_rec.proisstrict,
      'proleakproof', v_rec.proleakproof
    ));
  END LOOP;

  -- Record Trigger OIDs and Extended Trigger Configuration (12 Public + 2 Auth)
  FOR v_rec IN (
    SELECT 
      t.oid AS trigger_oid,
      t.tgname,
      c.oid AS table_oid,
      c.relname AS table_name,
      nc.nspname AS table_schema,
      p.oid AS proc_oid,
      p.proname AS proc_name,
      np.nspname AS proc_schema,
      t.tgtype,
      t.tgenabled,
      t.tgnargs,
      encode(t.tgargs, 'hex') AS tgargs_hex,
      t.tgdeferrable,
      t.tginitdeferred
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace nc ON c.relnamespace = nc.oid
    JOIN pg_proc p ON t.tgfoid = p.oid
    JOIN pg_namespace np ON p.pronamespace = np.oid
    WHERE (
      (nc.nspname = 'public' AND t.tgname IN (
        'tr_protect_profile_integrity', 'tr_before_conversation_insert',
        'tr_validate_conversation_participant', 'tr_protect_participant_update',
        'tr_before_message_insert', 'tr_after_message_insert',
        'tr_validate_skill_swap_invitation', 'tr_protect_invitation_update',
        'tr_after_learning_group_insert', 'tr_protect_post_update',
        'tr_check_direct_conv_conversations', 'tr_check_direct_conv_participants'
      )) OR
      (nc.nspname = 'auth' AND c.relname = 'users' AND t.tgname IN (
        'tr_on_auth_user_created', 'tr_on_auth_user_email_sync'
      ))
    )
    AND NOT t.tgisinternal
  ) LOOP
    INSERT INTO public._swapstudy_migration_baseline (category, schema_name, object_name, sub_object_name, pre_existed, metadata)
    VALUES ('trigger', v_rec.table_schema, v_rec.table_name, v_rec.tgname, false, jsonb_build_object(
      'trigger_oid', v_rec.trigger_oid,
      'table_oid', v_rec.table_oid,
      'proc_oid', v_rec.proc_oid,
      'proc_schema', v_rec.proc_schema,
      'proc_name', v_rec.proc_name,
      'tgtype', v_rec.tgtype,
      'tgenabled', v_rec.tgenabled,
      'tgnargs', v_rec.tgnargs,
      'tgargs_hex', v_rec.tgargs_hex,
      'tgdeferrable', v_rec.tgdeferrable,
      'tginitdeferred', v_rec.tginitdeferred
    ));
  END LOOP;
END $$;


COMMIT;
