/*
# Add account ownership uniqueness

1. Modified Tables
- `budget_profiles`: adds a unique constraint for one budget per signed-in account.

2. Security
- No access policy changes. Existing authenticated ownership policies remain in effect.

3. Important Notes
- 1. This supports safe upsert behavior when a user saves their budget.
- 2. No records are deleted or changed.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'budget_profiles_user_id_key') THEN
    ALTER TABLE budget_profiles ADD CONSTRAINT budget_profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;
