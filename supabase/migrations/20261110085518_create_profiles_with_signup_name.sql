/*
# Create profiles table for user full names

1. New Tables
- `profiles`
  - `id` (uuid, primary key, references the user's account, deleted with it)
  - `full_name` (text, not null) - the name entered at sign-up
  - `created_at` (timestamptz) - used as the "Member Since" date

2. Automation
- A trigger copies the Full Name from sign-up into `profiles` whenever a new account is created, so the name is saved even when email confirmation is pending.
- Existing accounts get a profile row backfilled from the name they signed up with (or their email prefix if none was saved).

3. Security
- Row Level Security enabled on `profiles`.
- Signed-in users can only read their own profile row.
- No client-side insert, update, or delete. Rows are written only by the trigger.

4. Important Notes
- The trigger function runs with elevated rights but only writes the new account's own profile row.
- Execute permission on the trigger function is revoked from public roles.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON profiles TO authenticated;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, created_at)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(btrim(NEW.raw_user_meta_data->>'full_name'), ''),
      NULLIF(btrim(NEW.raw_user_meta_data->>'display_name'), ''),
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(NEW.created_at, now())
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user_profile() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

INSERT INTO profiles (id, full_name, created_at)
SELECT
  u.id,
  COALESCE(
    NULLIF(btrim(u.raw_user_meta_data->>'full_name'), ''),
    NULLIF(btrim(u.raw_user_meta_data->>'display_name'), ''),
    split_part(u.email, '@', 1)
  ),
  COALESCE(u.created_at, now())
FROM auth.users u
ON CONFLICT (id) DO NOTHING;
