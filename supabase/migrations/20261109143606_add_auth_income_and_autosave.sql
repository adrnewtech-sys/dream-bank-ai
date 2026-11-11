/*
# Add account ownership, income history, and AutoSave settings

1. Modified Tables
- `budget_profiles`: adds `user_id`, populated automatically from the signed-in account for new records.
- `savings_goals`: adds `user_id`, populated automatically from the signed-in account for new goals.
- `goal_transactions`: adds `user_id`, populated automatically from the signed-in account for new savings activity.

2. New Tables
- `income_history`: one monthly income and expense snapshot per account and month.
  - `user_id`, `month_start`, `monthly_income`, `monthly_expenses`, `created_at`, `updated_at`.
- `autosave_settings`: one AutoSave preference per account.
  - `user_id`, `enabled`, `monthly_amount`, `updated_at`.

3. Security
- Existing public policies are removed.
- All application tables are restricted to authenticated users and their own `user_id`.
- New tables have RLS enabled, authenticated-only grants, and separate CRUD policies.

4. Important Notes
- 1. Existing anonymous browser-key records are retained but are not assigned to an account because there is no safe way to identify their owner.
- 2. New records use `auth.uid()` by default, so the browser never needs to submit an account ID.
- 3. No existing columns or rows are deleted.
*/

ALTER TABLE budget_profiles ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE goal_transactions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE budget_profiles ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE savings_goals ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE goal_transactions ALTER COLUMN user_id SET DEFAULT auth.uid();

CREATE TABLE IF NOT EXISTS income_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  month_start date NOT NULL,
  monthly_income numeric(12, 2) NOT NULL CHECK (monthly_income >= 0),
  monthly_expenses numeric(12, 2) NOT NULL CHECK (monthly_expenses >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, month_start)
);

CREATE TABLE IF NOT EXISTS autosave_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  monthly_amount numeric(12, 2) NOT NULL DEFAULT 0 CHECK (monthly_amount >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_budget_profiles_user ON budget_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON savings_goals (user_id);
CREATE INDEX IF NOT EXISTS idx_goal_transactions_user ON goal_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_income_history_user_month ON income_history (user_id, month_start DESC);

ALTER TABLE budget_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE autosave_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON budget_profiles, savings_goals, goal_transactions FROM anon;
REVOKE ALL ON income_history, autosave_settings FROM anon;
GRANT SELECT, INSERT, UPDATE ON budget_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON savings_goals TO authenticated;
GRANT SELECT, INSERT, DELETE ON goal_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON income_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON autosave_settings TO authenticated;

DROP POLICY IF EXISTS "budget_profiles_select" ON budget_profiles;
DROP POLICY IF EXISTS "budget_profiles_insert" ON budget_profiles;
DROP POLICY IF EXISTS "budget_profiles_update" ON budget_profiles;
CREATE POLICY "budget_profiles_select" ON budget_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "budget_profiles_insert" ON budget_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budget_profiles_update" ON budget_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "savings_goals_select" ON savings_goals;
DROP POLICY IF EXISTS "savings_goals_insert" ON savings_goals;
DROP POLICY IF EXISTS "savings_goals_update" ON savings_goals;
DROP POLICY IF EXISTS "savings_goals_delete" ON savings_goals;
CREATE POLICY "savings_goals_select" ON savings_goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "savings_goals_insert" ON savings_goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "savings_goals_update" ON savings_goals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "savings_goals_delete" ON savings_goals FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "goal_transactions_select" ON goal_transactions;
DROP POLICY IF EXISTS "goal_transactions_insert" ON goal_transactions;
DROP POLICY IF EXISTS "goal_transactions_delete" ON goal_transactions;
CREATE POLICY "goal_transactions_select" ON goal_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "goal_transactions_insert" ON goal_transactions FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM savings_goals WHERE savings_goals.id = goal_transactions.goal_id AND savings_goals.user_id = auth.uid())
);
CREATE POLICY "goal_transactions_delete" ON goal_transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "income_history_select" ON income_history;
DROP POLICY IF EXISTS "income_history_insert" ON income_history;
DROP POLICY IF EXISTS "income_history_update" ON income_history;
DROP POLICY IF EXISTS "income_history_delete" ON income_history;
CREATE POLICY "income_history_select" ON income_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "income_history_insert" ON income_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "income_history_update" ON income_history FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "income_history_delete" ON income_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "autosave_settings_select" ON autosave_settings;
DROP POLICY IF EXISTS "autosave_settings_insert" ON autosave_settings;
DROP POLICY IF EXISTS "autosave_settings_update" ON autosave_settings;
DROP POLICY IF EXISTS "autosave_settings_delete" ON autosave_settings;
CREATE POLICY "autosave_settings_select" ON autosave_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "autosave_settings_insert" ON autosave_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "autosave_settings_update" ON autosave_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "autosave_settings_delete" ON autosave_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);
