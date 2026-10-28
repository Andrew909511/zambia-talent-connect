import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Briefcase, Hammer, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { inputCls, type Role } from "@/lib/zamwork";
import { LocationPicker, SkillsInput } from "@/components/ProfileFields";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  role: z.enum(["worker", "employer"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in or join Zamwork" },
      { name: "description", content: "Create a free Zamwork account as a worker or employer, or sign in to your account." },
      { property: "og:title", content: "Sign in or join Zamwork" },
      { property: "og:description", content: "Create a free worker or employer account on Zamwork." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const signupSchema = z.object({
  full_name: z.string().trim().min(2, "Please enter your name").max(100),
  phone: z.string().trim().min(9, "Please enter a valid phone number").max(30),
  town: z.string().trim().max(80),
  province: z.string().max(60),
  district: z.string().max(80),
  email: z.string().trim().email("Please enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? (search.role ? "signup" : "signin"));
  const [role, setRole] = useState<Role>(search.role ?? "worker");
  const [form, setForm] = useState({ full_name: "", phone: "", province: "", district: "", town: "", email: "", password: "" });
  const [skills, setSkills] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate({ to: "/dashboard", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setInfo("");
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
        if (error) setError(
          error.message === "Invalid login credentials" ? "Wrong email or password. If you signed up with Google, use \"Continue with Google\"."
          : /not confirmed/i.test(error.message) ? "Your email isn't confirmed yet. Please check your inbox, or try again in a moment."
          : error.message);
      } else {
        const parsed = signupSchema.safeParse(form);
        if (!parsed.success) { setError((parsed.error.issues[0]?.message ?? "Please check your details")); return; }
        if (!parsed.data.town && !parsed.data.province) { setError("Please choose your province or type your town"); return; }
        const { full_name, phone, town, province, district, email, password } = parsed.data;
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}auth`, data: { full_name, phone, town, province, district, skills: role === "worker" ? skills : [], role } },

        });
        if (error) setError(error.message);
        else if (!data.session) setInfo(`Almost done! We sent a confirmation link to ${email}. Open it to activate your account.`);
      }
    } finally { setBusy(false); }
  }

  async function google() {
    setError("");
    localStorage.setItem("zamwork_pending_role", role);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth` });

    if (result.error) setError("Google sign-in didn't work. Please try again.");
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center"><Briefcase className="w-6 h-6 text-primary-foreground" /></div>
            <span className="text-xl font-bold">Zamwork</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-start sm:items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 my-6">
          <div className="grid grid-cols-2 gap-1 bg-muted p-1 rounded-lg mb-6">
            {(["signin", "signup"] as const).map((m) => (
              <button key={m} type="button" onClick={() => { setMode(m); setError(""); setInfo(""); }} className={`py-2 rounded-md text-sm font-medium ${mode === m ? "bg-card shadow text-foreground" : "text-muted-foreground"}`}>
                {m === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {mode === "signup" && (
            <div className="mb-5">
              <p className="text-sm font-medium mb-2">I want to…</p>
              <div className="grid grid-cols-2 gap-3">
                {([["worker", Hammer, "Find work", "Worker / job seeker"], ["employer", Building2, "Hire people", "Employer / client"]] as const).map(([r, Icon, t, d]) => (
                  <button key={r} type="button" onClick={() => setRole(r)} className={`p-3 rounded-lg border-2 text-left ${role === r ? "border-primary bg-primary/5" : "border-border"}`}>
                    <Icon className="w-5 h-5 text-primary mb-1" />
                    <p className="font-semibold text-sm">{t}</p>
                    <p className="text-xs text-muted-foreground">{d}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <>
                <input className={inputCls} placeholder={role === "employer" ? "Your name or business name" : "Full name"} value={form.full_name} onChange={set("full_name")} autoComplete="name" />
                <input className={inputCls} placeholder="Phone number (e.g. 097...)" type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" />
                <LocationPicker value={form} onChange={(pl) => setForm({ ...form, ...pl })} />
                {role === "worker" && <div><p className="text-sm font-medium mb-1">What I do</p><SkillsInput value={skills} onChange={setSkills} /></div>}
              </>
            )}
            <input className={inputCls} placeholder="Email" type="email" value={form.email} onChange={set("email")} autoComplete="email" required />
            <input className={inputCls} placeholder="Password" type="password" value={form.password} onChange={set("password")} autoComplete={mode === "signin" ? "current-password" : "new-password"} required />
            {error && <p className="text-sm text-destructive">{error}</p>}
            {info && <p className="text-sm text-primary bg-primary/10 p-3 rounded">{info}</p>}
            <button disabled={busy} className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-60">
              {busy ? "Please wait…" : mode === "signin" ? "Sign In" : `Create ${role} account`}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4 text-xs text-muted-foreground"><div className="h-px bg-border flex-1" />or<div className="h-px bg-border flex-1" /></div>
          <button type="button" onClick={google} className="w-full py-3 border border-border rounded-lg font-medium hover:bg-muted">Continue with Google</button>
          <p className="text-xs text-muted-foreground mt-4 text-center">Free during our launch.</p>
        </div>
      </main>
    </div>
  );
}
