import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Briefcase, LogOut, MapPin, Phone, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, JOB_TYPES, LOCATIONS, inputCls, useAccount, type Role } from "@/lib/zamwork";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My Account — Zamwork" },
      { name: "description", content: "Manage your Zamwork profile, jobs and applications." },
      { property: "og:title", content: "My Account — Zamwork" },
      { property: "og:description", content: "Manage your Zamwork profile, jobs and applications." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Please enter your name").max(100),
  phone: z.string().trim().min(9, "Please enter a valid phone number").max(30),
  location: z.string().min(1),
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const account = useAccount(user.id);
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const ready = account.data?.role && account.data?.profile;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center"><Briefcase className="w-6 h-6 text-primary-foreground" /></div>
            <span className="text-xl font-bold">Zamwork</span>
          </Link>
          <button onClick={signOut} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground p-2"><LogOut className="w-4 h-4" />Sign out</button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        {account.isLoading ? <p className="text-muted-foreground">Loading…</p>
          : !ready ? <Onboarding userId={user.id} meta={user.user_metadata ?? {}} existingRole={account.data?.role ?? null} existingProfile={account.data?.profile ?? null} />
          : (
            <>
              <div className="mb-8">
                <p className="text-sm text-primary font-semibold uppercase tracking-wide">{account.data!.role === "worker" ? "Worker account" : "Employer account"}</p>
                <h1 className="text-2xl sm:text-3xl font-bold">Welcome, {account.data!.profile!.full_name}</h1>
              </div>
              {account.data!.role === "employer" ? <EmployerView userId={user.id} name={account.data!.profile!.full_name} /> : <WorkerView userId={user.id} />}
              <ProfileEditor userId={user.id} profile={account.data!.profile!} />
            </>
          )}
      </main>
    </div>
  );
}

type Profile = { full_name: string; phone: string; location: string };

function Onboarding({ userId, meta, existingRole, existingProfile }: { userId: string; meta: Record<string, unknown>; existingRole: Role | null; existingProfile: Profile | null }) {
  const qc = useQueryClient();
  const pending = typeof window !== "undefined" ? localStorage.getItem("zamwork_pending_role") : null;
  const metaRole = (meta["role"] === "worker" || meta["role"] === "employer" ? meta["role"] : pending === "worker" || pending === "employer" ? pending : null) as Role | null;
  const [role, setRole] = useState<Role>(existingRole ?? metaRole ?? "worker");
  const [form, setForm] = useState<Profile>({
    full_name: existingProfile?.full_name ?? String(meta["full_name"] ?? meta["name"] ?? ""),
    phone: existingProfile?.phone ?? String(meta["phone"] ?? ""),
    location: existingProfile?.location ?? String(meta["location"] ?? "Lusaka"),
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setError("");
    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) { setError((parsed.error.issues[0]?.message ?? "Please check your details")); return; }
    setBusy(true);
    const { error: pErr } = await supabase.from("profiles").upsert({ id: userId, ...parsed.data, updated_at: new Date().toISOString() });
    const { error: rErr } = existingRole ? { error: null } : await supabase.rpc("set_my_role", { _role: role });
    setBusy(false);
    if (pErr || rErr) { setError("Couldn't save your details. Please try again."); return; }
    localStorage.removeItem("zamwork_pending_role");
    qc.invalidateQueries({ queryKey: ["account", userId] });
  }

  // Details given at sign-up are saved automatically on first visit.
  const complete = !!metaRole && profileSchema.safeParse(form).success;
  useEffect(() => { if (complete) save(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  return (
    <div className="max-w-md mx-auto bg-card border border-border rounded-2xl p-6">
      <h1 className="text-xl font-bold mb-1">Finish setting up your account</h1>
      <p className="text-sm text-muted-foreground mb-5">This only takes a moment.</p>
      {!existingRole && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {(["worker", "employer"] as const).map((r) => (
            <button key={r} type="button" onClick={() => setRole(r)} className={`p-3 rounded-lg border-2 text-sm font-semibold ${role === r ? "border-primary bg-primary/5" : "border-border"}`}>
              {r === "worker" ? "I want to find work" : "I want to hire"}
            </button>
          ))}
        </div>
      )}
      <div className="space-y-3">
        <input className={inputCls} placeholder="Full name or business name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <input className={inputCls} placeholder="Phone number" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <select className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>{LOCATIONS.map((l) => <option key={l}>{l}</option>)}</select>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button onClick={save} disabled={busy} className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-60">{busy ? "Saving…" : "Continue"}</button>
      </div>
    </div>
  );
}

function ProfileEditor({ userId, profile }: { userId: string; profile: Profile }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Profile>({ full_name: profile.full_name, phone: profile.phone, location: profile.location });
  const [msg, setMsg] = useState("");
  async function save() {
    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) { setMsg((parsed.error.issues[0]?.message ?? "Please check your details")); return; }
    const { error } = await supabase.from("profiles").update({ ...parsed.data, updated_at: new Date().toISOString() }).eq("id", userId);
    setMsg(error ? "Couldn't save. Try again." : "Saved.");
    qc.invalidateQueries({ queryKey: ["account", userId] });
  }
  return (
    <section className="mt-10 bg-card border border-border rounded-xl p-5">
      <h2 className="text-lg font-bold mb-4">My profile</h2>
      <div className="grid sm:grid-cols-3 gap-3">
        <input className={inputCls} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} aria-label="Name" />
        <input className={inputCls} value={form.phone} type="tel" onChange={(e) => setForm({ ...form, phone: e.target.value })} aria-label="Phone" />
        <select className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} aria-label="Location">{LOCATIONS.map((l) => <option key={l}>{l}</option>)}</select>
      </div>
      <div className="flex items-center gap-3 mt-3">
        <button onClick={save} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium">Save profile</button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
      <p className="text-xs text-muted-foreground mt-3">Your phone number is only shown to employers whose jobs you apply for.</p>
    </section>
  );
}

const statusCls: Record<string, string> = { pending: "bg-muted text-muted-foreground", accepted: "bg-primary/10 text-primary", rejected: "bg-destructive/10 text-destructive" };

function WorkerView({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const apps = useQuery({
    queryKey: ["my-applications", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("applications").select("*, jobs(title, employer_name, location)").eq("worker_id", userId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  async function withdraw(id: string) {
    await supabase.from("applications").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["my-applications", userId] });
  }
  return (
    <section>
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="text-lg font-bold">My applications</h2>
        <Link to="/" search={{ view: "jobs" }} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Find jobs</Link>
      </div>
      {apps.isLoading ? <p className="text-muted-foreground">Loading…</p> : !apps.data?.length ? (
        <p className="text-muted-foreground bg-card border border-border rounded-xl p-6 text-center">You haven't applied for any jobs yet.</p>
      ) : (
        <div className="space-y-3">
          {apps.data.map((a) => (
            <div key={a.id} className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{a.jobs?.title ?? "Job removed"}</p>
                <p className="text-sm text-muted-foreground">{a.jobs?.employer_name} · {a.jobs?.location}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded capitalize ${statusCls[a.status]}`}>{a.status}</span>
                <button onClick={() => withdraw(a.id)} className="text-sm text-muted-foreground hover:text-destructive">Withdraw</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const jobSchema = z.object({
  title: z.string().trim().min(2, "Enter a job title").max(120),
  category: z.string().min(1),
  location: z.string().min(1),
  job_type: z.string().min(1),
  salary: z.string().trim().max(60),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(3000),
  requirements: z.string().trim().max(2000),
});

function EmployerView({ userId, name }: { userId: string; name: string }) {
  const qc = useQueryClient();
  const empty = { title: "", category: CATEGORIES[0], location: "Lusaka", job_type: JOB_TYPES[0], salary: "", description: "", requirements: "" };
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const jobs = useQuery({
    queryKey: ["my-jobs", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*, applications(*)").eq("employer_id", userId).order("created_at", { ascending: false });
      if (error) throw error;
      const workerIds = [...new Set(data.flatMap((j) => j.applications.map((a) => a.worker_id)))];
      const { data: profiles } = workerIds.length ? await supabase.from("profiles").select("*").in("id", workerIds) : { data: [] };
      return { jobs: data, profiles: Object.fromEntries((profiles ?? []).map((p) => [p.id, p])) };
    },
  });

  async function post(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = jobSchema.safeParse(form);
    if (!parsed.success) { setError((parsed.error.issues[0]?.message ?? "Please check your details")); return; }
    const { error } = await supabase.from("jobs").insert({ ...parsed.data, employer_id: userId, employer_name: name });
    if (error) { setError("Couldn't post the job. Please try again."); return; }
    setForm(empty); setShowForm(false);
    qc.invalidateQueries({ queryKey: ["my-jobs", userId] });
    qc.invalidateQueries({ queryKey: ["jobs"] });
  }
  async function removeJob(id: string) {
    if (!confirm("Delete this job and its applications?")) return;
    await supabase.from("jobs").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["my-jobs", userId] });
    qc.invalidateQueries({ queryKey: ["jobs"] });
  }
  async function setStatus(id: string, status: "accepted" | "rejected") {
    await supabase.from("applications").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["my-jobs", userId] });
  }
  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <section>
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="text-lg font-bold">My jobs</h2>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">{showForm ? "Cancel" : "Post a job"}</button>
      </div>
      {showForm && (
        <form onSubmit={post} className="bg-card border border-border rounded-xl p-5 mb-6 space-y-3">
          <input className={inputCls} placeholder="Job title (e.g. Plumber needed)" value={form.title} onChange={f("title")} />
          <div className="grid sm:grid-cols-3 gap-3">
            <select className={inputCls} value={form.category} onChange={f("category")} aria-label="Category">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            <select className={inputCls} value={form.location} onChange={f("location")} aria-label="Location">{LOCATIONS.map((c) => <option key={c}>{c}</option>)}</select>
            <select className={inputCls} value={form.job_type} onChange={f("job_type")} aria-label="Job type">{JOB_TYPES.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          <input className={inputCls} placeholder="Pay in Kwacha (e.g. 3,000 - 4,000 per month)" value={form.salary} onChange={f("salary")} />
          <textarea className={inputCls} rows={4} placeholder="Describe the work" value={form.description} onChange={f("description")} />
          <textarea className={inputCls} rows={3} placeholder="Requirements (one per line, optional)" value={form.requirements} onChange={f("requirements")} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold">Publish job</button>
        </form>
      )}
      {jobs.isLoading ? <p className="text-muted-foreground">Loading…</p> : !jobs.data?.jobs.length ? (
        <p className="text-muted-foreground bg-card border border-border rounded-xl p-6 text-center">You haven't posted any jobs yet.</p>
      ) : (
        <div className="space-y-4">
          {jobs.data.jobs.map((j) => (
            <div key={j.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{j.title}</p>
                  <p className="text-sm text-muted-foreground">{j.location} · {j.job_type}{j.salary && ` · K${j.salary}`}</p>
                </div>
                <button onClick={() => removeJob(j.id)} aria-label="Delete job" className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
              <p className="text-sm font-medium mt-3 mb-2">{j.applications.length} {j.applications.length === 1 ? "applicant" : "applicants"}</p>
              <div className="space-y-2">
                {j.applications.map((a) => {
                  const p = jobs.data!.profiles[a.worker_id];
                  return (
                    <div key={a.id} className="border border-border rounded-lg p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{p?.full_name ?? "Applicant"}</p>
                          <p className="text-sm text-muted-foreground flex flex-wrap gap-3">
                            {p?.phone && <a href={`tel:${p.phone}`} className="flex items-center gap-1 text-primary"><Phone className="w-3 h-3" />{p.phone}</a>}
                            {p?.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.location}</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded capitalize ${statusCls[a.status]}`}>{a.status}</span>
                          {a.status !== "accepted" && <button onClick={() => setStatus(a.id, "accepted")} className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground">Accept</button>}
                          {a.status !== "rejected" && <button onClick={() => setStatus(a.id, "rejected")} className="text-xs px-3 py-1.5 rounded border border-border">Decline</button>}
                        </div>
                      </div>
                      {a.message && <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{a.message}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
