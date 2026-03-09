/*
  # Create login_logs table

  ## Summary
  Registers every successful login event so the system can track user access history.

  ## New Tables
  - `login_logs`
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users) — who logged in
    - `email` (text) — email at time of login
    - `logged_at` (timestamptz) — when the login occurred

  ## Security
  - RLS enabled
  - Authenticated users can INSERT their own log entries
  - Authenticated users can SELECT only their own entries
  - No UPDATE or DELETE allowed (immutable audit log)
*/

CREATE TABLE IF NOT EXISTS public.login_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  email text NOT NULL DEFAULT '',
  logged_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own login log"
  ON public.login_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own login logs"
  ON public.login_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON public.login_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_logged_at ON public.login_logs (logged_at DESC);
