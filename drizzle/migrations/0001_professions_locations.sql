ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}', ADD COLUMN IF NOT EXISTS province text NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS district text NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS town text NOT NULL DEFAULT '';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS province text NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS district text NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS town text NOT NULL DEFAULT '';
DROP FUNCTION IF EXISTS public.list_workers();
CREATE FUNCTION public.list_workers() RETURNS TABLE(id uuid, full_name text, location text, skills text[], province text, district text, town text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, p.location, p.skills, p.province, p.district, p.town, p.created_at
  FROM public.profiles p JOIN public.user_roles r ON r.user_id = p.id AND r.role = 'worker'
  ORDER BY p.created_at DESC LIMIT 500
$$;
GRANT EXECUTE ON FUNCTION public.list_workers() TO anon, authenticated;