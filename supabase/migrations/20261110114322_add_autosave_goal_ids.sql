/*
# Allow AutoPay to fund multiple dream goals

1. Modified Tables
- `autosave_settings`
  - New column `goal_ids` (uuid array, not null, defaults to empty): the dream goals the user selected for AutoPay.
  - Existing single selections in `goal_id` are copied into `goal_ids` so current users keep their choice.

2. Security
- No new tables, so no grants or policies change. The existing owner-scoped policies on `autosave_settings` cover the new column.

3. Important Notes
- The old `goal_id` column is no longer written by the app. It is left in place so no data is removed.
- Goal ids in `goal_ids` are not foreign keys (Postgres does not support them on arrays). The app ignores ids of goals that no longer exist.
*/

ALTER TABLE autosave_settings ADD COLUMN IF NOT EXISTS goal_ids uuid[] NOT NULL DEFAULT '{}';

UPDATE autosave_settings
SET goal_ids = ARRAY[goal_id]
WHERE goal_id IS NOT NULL AND cardinality(goal_ids) = 0;
