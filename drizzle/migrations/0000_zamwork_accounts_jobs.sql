CREATE TYPE public.app_role AS ENUM ('worker', 'employer');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- A user picks their account type once; it cannot be changed or added to afterwards.
CREATE OR REPLACE FUNCTION public.set_my_role(_role public.app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()) THEN RETURN; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), _role);
END $$;
REVOKE EXECUTE ON FUNCTION public.set_my_role(public.app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.set_my_role(public.app_role) TO authenticated;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 100),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 5 AND 30),
  location text NOT NULL CHECK (char_length(location) BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL DEFAULT auth.uid(),
  employer_name text NOT NULL CHECK (char_length(employer_name) BETWEEN 1 AND 120),
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 120),
  category text NOT NULL CHECK (char_length(category) BETWEEN 1 AND 60),
  location text NOT NULL CHECK (char_length(location) BETWEEN 1 AND 100),
  salary text NOT NULL DEFAULT '' CHECK (char_length(salary) <= 60),
  job_type text NOT NULL CHECK (char_length(job_type) BETWEEN 1 AND 40),
  description text NOT NULL CHECK (char_length(description) BETWEEN 10 AND 3000),
  requirements text NOT NULL DEFAULT '' CHECK (char_length(requirements) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.jobs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view jobs" ON public.jobs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Employers post jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (employer_id = auth.uid() AND public.has_role(auth.uid(), 'employer'));
CREATE POLICY "Employers edit own jobs" ON public.jobs FOR UPDATE TO authenticated USING (employer_id = auth.uid()) WITH CHECK (employer_id = auth.uid());
CREATE POLICY "Employers delete own jobs" ON public.jobs FOR DELETE TO authenticated USING (employer_id = auth.uid());

CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL DEFAULT auth.uid(),
  message text NOT NULL DEFAULT '' CHECK (char_length(message) <= 1500),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, worker_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_job_owner(_job_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.jobs WHERE id = _job_id AND employer_id = _user_id)
$$;

CREATE POLICY "Workers and job owners view applications" ON public.applications FOR SELECT TO authenticated
  USING (worker_id = auth.uid() OR public.is_job_owner(job_id, auth.uid()));
CREATE POLICY "Workers apply" ON public.applications FOR INSERT TO authenticated
  WITH CHECK (worker_id = auth.uid() AND status = 'pending' AND public.has_role(auth.uid(), 'worker'));
CREATE POLICY "Job owners update status" ON public.applications FOR UPDATE TO authenticated
  USING (public.is_job_owner(job_id, auth.uid())) WITH CHECK (public.is_job_owner(job_id, auth.uid()));
CREATE POLICY "Workers withdraw" ON public.applications FOR DELETE TO authenticated USING (worker_id = auth.uid());

-- Profiles: own, or an employer viewing someone who applied to their job
CREATE OR REPLACE FUNCTION public.applied_to_my_job(_worker_id uuid, _employer_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.applications a JOIN public.jobs j ON j.id = a.job_id
    WHERE a.worker_id = _worker_id AND j.employer_id = _employer_id)
$$;
CREATE POLICY "View own or applicant profiles" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.applied_to_my_job(id, auth.uid()));

-- Public worker directory: name and location only, never phone
CREATE OR REPLACE FUNCTION public.list_workers()
RETURNS TABLE (id uuid, full_name text, location text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, p.location, p.created_at FROM public.profiles p
  JOIN public.user_roles r ON r.user_id = p.id AND r.role = 'worker'
  ORDER BY p.created_at DESC LIMIT 200
$$;
GRANT EXECUTE ON FUNCTION public.list_workers() TO anon, authenticated;