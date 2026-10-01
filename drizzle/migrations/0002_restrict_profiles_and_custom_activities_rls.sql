DROP POLICY IF EXISTS "Authenticated can delete activities" ON public.custom_activities;
DROP POLICY IF EXISTS "Authenticated can update activities" ON public.custom_activities;
DROP POLICY IF EXISTS "Anyone can read activities" ON public.custom_activities;
DROP POLICY IF EXISTS "Authenticated can create activities" ON public.custom_activities;

CREATE POLICY "Admins can read activities"
ON public.custom_activities FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create activities"
ON public.custom_activities FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Admins can update activities"
ON public.custom_activities FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete activities"
ON public.custom_activities FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can search profiles" ON public.profiles;

CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can read profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.get_custom_activities(
  _grade_id text,
  _subject_id text,
  _unit_index integer
)
RETURNS SETOF public.custom_activities
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.custom_activities
  WHERE grade_id = _grade_id
    AND subject_id = _subject_id
    AND unit_index = _unit_index
  ORDER BY created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_custom_activities(text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_custom_activities(text, text, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.search_public_profiles(_query text, _exclude_user_id uuid)
RETURNS TABLE(user_id uuid, username text, display_name text, grade_id text, xp integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.username, p.display_name, p.grade_id, p.xp
  FROM public.profiles p
  WHERE p.user_id <> _exclude_user_id
    AND length(trim(_query)) >= 2
    AND (
      p.username ILIKE '%' || replace(replace(_query, '%', ''), ',', '') || '%'
      OR p.display_name ILIKE '%' || replace(replace(_query, '%', ''), ',', '') || '%'
    )
  ORDER BY p.display_name
  LIMIT 20;
$$;

REVOKE ALL ON FUNCTION public.search_public_profiles(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_public_profiles(text, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_public_profiles(_user_ids uuid[])
RETURNS TABLE(user_id uuid, username text, display_name text, grade_id text, xp integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.username, p.display_name, p.grade_id, p.xp
  FROM public.profiles p
  WHERE p.user_id = ANY(_user_ids)
  LIMIT 100;
$$;

REVOKE ALL ON FUNCTION public.get_public_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_public_leaderboard()
RETURNS TABLE(user_id uuid, username text, display_name text, grade_id text, xp integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.username, p.display_name, p.grade_id, p.xp
  FROM public.profiles p
  ORDER BY p.xp DESC
  LIMIT 50;
$$;

REVOKE ALL ON FUNCTION public.get_public_leaderboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_leaderboard() TO authenticated;