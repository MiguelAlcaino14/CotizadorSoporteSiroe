/*
  # Fix profiles RLS, app_config RLS, and handle_new_user search path

  ## Summary
  1. Fix profiles RLS policies to use (select auth.uid()) to avoid per-row re-evaluation
  2. Fix duplicate UPDATE policies on profiles (merge "Users can update own profile" and 
     "Admins can update any profile role" to avoid multiple permissive policy warning)
  3. Fix app_config RLS policy to use (select auth.uid()) pattern
  4. Fix handle_new_user function to have a stable search_path

  ## Security changes
  - RLS policies now use subselect pattern for auth functions (performance improvement)
  - handle_new_user now runs with a fixed search_path to prevent search path injection
*/

-- ============================================================
-- profiles: drop and recreate with (select auth.uid()) pattern
-- ============================================================
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile role" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  );

-- ============================================================
-- app_config: fix Admins can update app_config
-- ============================================================
DROP POLICY IF EXISTS "Admins can update app_config" ON public.app_config;

CREATE POLICY "Admins can update app_config"
  ON public.app_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- handle_new_user: fix mutable search_path
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count integer;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  INSERT INTO profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    CASE WHEN user_count = 0 THEN 'admin' ELSE 'comercial' END,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;
