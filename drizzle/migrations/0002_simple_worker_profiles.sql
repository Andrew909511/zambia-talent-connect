ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS about text NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS experience text NOT NULL DEFAULT '';
DROP FUNCTION IF EXISTS public.list_workers();
CREATE FUNCTION public.list_workers()
 RETURNS TABLE(id uuid, full_name text, location text, skills text[], province text, district text, town text, created_at timestamptz, about text, experience text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT p.id, p.full_name, p.location, p.skills, p.province, p.district, p.town, p.created_at, p.about, p.experience
  FROM public.profiles p JOIN public.user_roles r ON r.user_id = p.id AND r.role = 'worker'
  ORDER BY p.created_at DESC LIMIT 500
$$;
GRANT EXECUTE ON FUNCTION public.list_workers() TO anon, authenticated;
CREATE OR REPLACE FUNCTION public.get_worker_contact(_worker_id uuid)
 RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT p.phone FROM public.profiles p JOIN public.user_roles r ON r.user_id = p.id AND r.role = 'worker'
  WHERE p.id = _worker_id AND auth.uid() IS NOT NULL
$$;
REVOKE EXECUTE ON FUNCTION public.get_worker_contact(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_worker_contact(uuid) TO authenticated;