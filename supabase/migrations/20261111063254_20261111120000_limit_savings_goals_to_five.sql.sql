/*
# Limit each owner to five dream folders

1. Summary
- Adds a database check so a single owner can hold at most 5 goal folders (savings_goals rows).
- Existing folders are not changed or removed. If an owner already has more than 5, they keep them, but cannot add more until they are below the limit.

2. Modified tables
- `savings_goals`: new BEFORE INSERT trigger `enforce_savings_goal_limit`.

3. Security
- The check runs inside a SECURITY DEFINER function so the count is accurate regardless of row level security.
- EXECUTE is revoked from PUBLIC, anon and authenticated; only the trigger uses this function.

4. Notes
- Ownership is matched on user_id, falling back to the legacy owner_key for rows created before sign-in.
- Inserting a sixth folder raises the error "goal_limit_reached".
*/

CREATE OR REPLACE FUNCTION public.enforce_savings_goal_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_count integer;
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    SELECT count(*) INTO existing_count FROM public.savings_goals WHERE user_id = NEW.user_id;
  ELSE
    SELECT count(*) INTO existing_count FROM public.savings_goals WHERE user_id IS NULL AND owner_key = NEW.owner_key;
  END IF;

  IF existing_count >= 5 THEN
    RAISE EXCEPTION 'goal_limit_reached' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_savings_goal_limit() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_savings_goal_limit ON public.savings_goals;
CREATE TRIGGER enforce_savings_goal_limit
BEFORE INSERT ON public.savings_goals
FOR EACH ROW
EXECUTE FUNCTION public.enforce_savings_goal_limit();
