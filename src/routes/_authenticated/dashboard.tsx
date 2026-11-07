import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Briefcase, LogOut, MapPin, Phone, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { JOB_TYPES, inputCls, useAccount, type Role } from "@/lib/zamwork";
import { ALL_PLACES, formatLocation, PROFESSIONS, resolvePlace, type Place } from "@/lib/zambia";
import { LocationPicker, SkillsInput } from "@/components/ProfileFields";

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
  province: z.string().max(60),
  district: z.string().max(80),
  town: z.string().trim().max(80),
  skills: z.array(z.string().trim().min(1).max(60)).max(8),
  about: z.string().trim().max(1500),
  experience: z.string().trim().max(60),
}).refine((p) => p.town || p.province, { message: "Please type your town or city" });

function toRow(p: Profile) {
  return { ...p, location: formatLocation(p) };
}

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
  const [editing, setEditing] = useState(false);

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
              <h1 className="text-2xl sm:text-3xl font-bold mb-6">Welcome, {account.data!.profile!.full_name}</h1>
              {account.data!.role === "employer" ? (
                <>
                  <Link to="/" search={{ view: "workers" }} className="block text-center w-full max-w-md py-4 mb-8 bg-primary text-primary-foreground rounded-xl text-lg font-bold">Find Workers</Link>
                  <EmployerView userId={user.id} name={account.data!.profile!.full_name} />
                  {editing ? <ProfileEditor userId={user.id} profile={account.data!.profile!} role="employer" onDone={() => setEditing(false)} /> : <button onClick={() => setEditing(true)} className="mt-8 w-full max-w-md py-3 border border-border rounded-xl font-semibold">Edit my details</button>}
                </>
              ) : editing ? (
                <ProfileEditor userId={user.id} profile={account.data!.profile!} role="worker" onDone={() => setEditing(false)} />
              ) : (
                <div className="max-w-md space-y-6">
                  <section className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <h2 className="text-lg font-bold">Your Profile</h2>
                    <Link to="/worker/$workerId" params={{ workerId: user.id }} className="block text-center w-full py-4 bg-primary text-primary-foreground rounded-xl text-lg font-bold">View Profile</Link>
                    <button onClick={() => setEditing(true)} className="w-full py-4 border-2 border-primary text-primary rounded-xl text-lg font-bold">Edit Profile</button>
                  </section>
                  <section className="bg-card border border-border rounded-xl p-4">
                    <h2 className="text-lg font-bold mb-3">Find Jobs</h2>
                    <Link to="/" search={{ view: "jobs" }} className="block text-center w-full py-4 bg-brand-gold text-brand-ink rounded-xl text-lg font-bold">Find Jobs</Link>
                  </section>
                  <WorkerView userId={user.id} />
                  <button onClick={signOut} className="w-full py-3 text-muted-foreground font-medium flex items-center justify-center gap-2"><LogOut className="w-4 h-4" />Sign Out</button>
                </div>
              )}
            </>
          )}
      </main>
    </div>
  );
}

type Profile = { full_name: string; phone: string; province: string; district: string; town: string; skills: string[]; about: string; experience: string };
type ProfileRow = Partial<Profile> & { full_name: string; phone: string; location: string };

function fromRow(p: ProfileRow | null, meta: Record<string, unknown> = {}): Profile {
  const town = p?.town || (p ? "" : String(meta["town"] ?? "")) || (p && !p.province ? p.location : "");
  return { full_name: p?.full_name ?? String(meta["full_name"] ?? meta["name"] ?? ""), phone: p?.phone ?? String(meta["phone"] ?? ""), province: p?.province ?? String(meta["province"] ?? ""), district: p?.district ?? String(meta["district"] ?? ""), town, skills: p?.skills ?? (Array.isArray(meta["skills"]) ? (meta["skills"] as string[]) : []), about: p?.about ?? "", experience: p?.experience ?? "" };
}

const labelCls = "block text-base font-semibold mb-1";

function Onboarding({ userId, meta, existingRole, existingProfile }: { userId: string; meta: Record<string, unknown>; existingRole: Role | null; existingProfile: ProfileRow | null }) {
  const qc = useQueryClient();
  const pending = typeof window !== "undefined" ? localStorage.getItem("zamwork_pending_role") : null;
  const metaRole = (meta["role"] === "worker" || meta["role"] === "employer" ? meta["role"] : pending === "worker" || pending === "employer" ? pending : null) as Role | null;
  const [role, setRole] = useState<Role>(existingRole ?? metaRole ?? "worker");
  const [form, setForm] = useState<Profile>(fromRow(existingProfile, meta));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setError("");
    if (role === "worker" && !form.skills[0]?.trim()) { setError("Please say what you do, e.g. Electrician"); return; }
    const parsed = profileSchema.safeParse({ ...form, skills: form.skills.map((s) => s.trim()).filter(Boolean) });
    if (!parsed.success) { setError((parsed.error.issues[0]?.message ?? "Please check your details")); return; }
    setBusy(true);
    const { error: pErr } = await supabase.from("profiles").upsert({ id: userId, ...toRow(parsed.data), updated_at: new Date().toISOString() });
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
    <div className="max-w-md mx-auto bg-card border border-border rounded-2xl p-5">
      <h1 className="text-2xl font-bold mb-1">{role === "worker" ? "Create your profile" : "Your details"}</h1>
      <p className="text-sm text-muted-foreground mb-5">Takes about 1 minute. You can add more later.</p>
      {!existingRole && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {(["worker", "employer"] as const).map((r) => (
            <button key={r} type="button" onClick={() => setRole(r)} className={`p-3 rounded-lg border-2 text-sm font-semibold ${role === r ? "border-primary bg-primary/5" : "border-border"}`}>
              {r === "worker" ? "I want to find work" : "I want to hire"}
            </button>
          ))}
        </div>
      )}
      <div className="space-y-4">
        <label className="block"><span className={labelCls}>Full name</span><input className={inputCls} placeholder={role === "worker" ? "e.g. John Banda" : "Your name or business name"} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} autoComplete="name" /></label>
        <label className="block"><span className={labelCls}>Phone number</span><input className={inputCls} placeholder="e.g. 097 123 4567" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" /></label>
        {role === "worker" && <label className="block"><span className={labelCls}>What do you do?</span><input className={inputCls} list="onb-prof" placeholder="e.g. Electrician" value={form.skills[0] ?? ""} onChange={(e) => setForm({ ...form, skills: [e.target.value, ...form.skills.slice(1)] })} /><datalist id="onb-prof">{PROFESSIONS.map((p) => <option key={p} value={p} />)}</datalist></label>}
        <label className="block"><span className={labelCls}>Town / City</span><input className={inputCls} list="onb-town" placeholder="e.g. Lusaka" value={form.town} onChange={(e) => setForm({ ...form, ...resolvePlace(e.target.value, "") })} /><datalist id="onb-town">{ALL_PLACES.map((p) => <option key={p.province + p.town} value={p.town}>{p.province}</option>)}</datalist></label>
        {role === "worker" && <label className="block"><span className={labelCls}>About you / experience <span className="font-normal text-muted-foreground">(optional)</span></span><textarea className={inputCls} rows={3} maxLength={1500} placeholder="e.g. I do house wiring and repairs. 5 years experience." value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} /></label>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button onClick={save} disabled={busy} className="w-full py-4 bg-primary text-primary-foreground rounded-xl text-lg font-bold disabled:opacity-60">{busy ? "Saving…" : "Save Profile"}</button>
      </div>
    </div>
  );
}

function ProfileEditor({ userId, profile, role, onDone }: { userId: string; profile: ProfileRow; role: Role; onDone: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Profile>(fromRow(profile));
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function save() {
    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) { setMsg((parsed.error.issues[0]?.message ?? "Please check your details")); return; }
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ ...toRow(parsed.data), updated_at: new Date().toISOString() }).eq("id", userId);
    setBusy(false);
    if (error) { setMsg("Couldn't save. Try again."); return; }
    await qc.invalidateQueries({ queryKey: ["account", userId] });
    qc.invalidateQueries({ queryKey: ["workers"] });
    onDone();
  }
  return (
    <section className="max-w-md bg-card border border-border rounded-xl p-5 space-y-4">
      <h2 className="text-xl font-bold">Edit Profile</h2>
      <label className="block"><span className={labelCls}>Full name</span><input className={inputCls} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></label>
      <label className="block"><span className={labelCls}>Phone number</span><input className={inputCls} value={form.phone} type="tel" onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
      <div><span className={labelCls}>Location</span><LocationPicker value={form} onChange={(pl: Place) => setForm({ ...form, ...pl })} /></div>
      {role === "worker" && <>
        <div><span className={labelCls}>What I do</span><p className="text-sm text-muted-foreground mb-1">The first one is shown as your profession. Add skills and services too.</p><SkillsInput value={form.skills} onChange={(skills) => setForm({ ...form, skills })} /></div>
        <label className="block"><span className={labelCls}>Years of experience</span><input className={inputCls} maxLength={60} placeholder="e.g. 5 years" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} /></label>
        <label className="block"><span className={labelCls}>About you</span><textarea className={inputCls} rows={4} maxLength={1500} value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} /></label>
        <p className="text-sm text-muted-foreground">Signed-in visitors can call or WhatsApp you from your profile.</p>
      </>}
      {msg && <p className="text-sm text-destructive">{msg}</p>}
      <div className="flex gap-3">
        <button onClick={save} disabled={busy} className="flex-1 py-4 bg-primary text-primary-foreground rounded-xl text-lg font-bold disabled:opacity-60">{busy ? "Saving…" : "Save"}</button>
        <button onClick={onDone} className="px-5 py-4 border border-border rounded-xl font-semibold">Cancel</button>
      </div>
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
  category: z.string().trim().min(2, "Say what kind of work this is (e.g. Plumber)").max(60),
  province: z.string().max(60),
  district: z.string().max(80),
  town: z.string().trim().max(80),
  job_type: z.string().min(1),
  salary: z.string().trim().max(60),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(3000),
  requirements: z.string().trim().max(2000),
});

function EmployerView({ userId, name }: { userId: string; name: string }) {
  const qc = useQueryClient();
  const empty = { title: "", category: "", province: "", district: "", town: "", job_type: JOB_TYPES[0], salary: "", description: "", requirements: "" };
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
    const { error } = await supabase.from("jobs").insert({ ...parsed.data, location: formatLocation(parsed.data) || "Zambia", employer_id: userId, employer_name: name });
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
          <div className="grid sm:grid-cols-2 gap-3">
            <input className={inputCls} list="job-professions" placeholder="Type of work (e.g. Plumber, Tailor)" value={form.category} onChange={f("category")} aria-label="Profession or service" />
            <datalist id="job-professions">{PROFESSIONS.map((c) => <option key={c} value={c} />)}</datalist>
            <select className={inputCls} value={form.job_type} onChange={f("job_type")} aria-label="Job type">{JOB_TYPES.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          <LocationPicker value={form} onChange={(pl: Place) => setForm({ ...form, ...pl })} />
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
