import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, X, User, Briefcase, Calendar, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { inputCls, useAccount, usePublicJobs, usePublicWorkers, useSession } from "@/lib/zamwork";
import { matches } from "@/lib/zambia";

type Filters = { search: string; location: string };

export function RealJobs({ filters }: { filters: Filters }) {
  const jobs = usePublicJobs();
  const [open, setOpen] = useState<NonNullable<typeof jobs.data>[number] | null>(null);
  const list = (jobs.data ?? []).filter((j) =>
    matches(filters.search, j.title, j.employer_name, j.category, j.description, j.requirements) &&
    matches(filters.location, j.location, j.town, j.district, j.province));
  if (jobs.isLoading) return <p className="text-muted-foreground mb-6">Loading jobs…</p>;
  if (!jobs.data?.length) return null;
  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold mb-4">Latest jobs ({list.length})</h2>
      {list.length === 0 ? <p className="text-muted-foreground">No posted jobs match your search.</p> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((j) => (
            <div key={j.id} className="bg-card border border-border rounded-lg p-4 flex flex-col">
              <h3 className="font-bold">{j.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">{j.employer_name}</p>
              <div className="flex gap-2 mb-2"><span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{j.job_type}</span><span className="text-xs bg-muted px-2 py-1 rounded">{j.category}</span></div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{j.description}</p>
              <div className="flex justify-between text-sm mt-auto mb-3">
                <span className="text-muted-foreground flex items-center gap-1"><MapPin className="w-4 h-4" />{j.location}</span>
                {j.salary && <span className="font-semibold text-primary">K{j.salary}</span>}
              </div>
              <button onClick={() => setOpen(j)} className="w-full py-3 bg-primary text-primary-foreground rounded font-medium text-sm">View & Apply</button>
            </div>
          ))}
        </div>
      )}
      {open && <ApplyModal job={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function ApplyModal({ job, onClose }: { job: { id: string; title: string; employer_name: string; location: string; job_type: string; salary: string; description: string; requirements: string; employer_id: string }; onClose: () => void }) {
  const { user } = useSession();
  const account = useAccount(user?.id);
  const qc = useQueryClient();
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error" | "dupe">("idle");

  async function apply() {
    setState("busy");
    const { error } = await supabase.from("applications").insert({ job_id: job.id, worker_id: user!.id, message: message.trim().slice(0, 1500) });
    if (error) setState(error.code === "23505" ? "dupe" : "error");
    else { setState("done"); qc.invalidateQueries({ queryKey: ["my-applications"] }); }
  }

  const role = account.data?.role;
  return (
    <div className="fixed inset-0 z-[60] bg-foreground/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-card w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 p-2 rounded hover:bg-muted"><X className="w-5 h-5" /></button>
        <h2 className="text-xl font-bold pr-8">{job.title}</h2>
        <p className="text-muted-foreground mb-3">{job.employer_name}</p>
        <div className="flex flex-wrap gap-3 text-sm mb-4">
          <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location}</span>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">{job.job_type}</span>
          {job.salary && <span className="font-semibold text-primary">K{job.salary}</span>}
        </div>
        <h3 className="font-semibold mb-1">Description</h3>
        <p className="text-sm text-muted-foreground mb-4 whitespace-pre-line">{job.description}</p>
        {job.requirements && <><h3 className="font-semibold mb-1">Requirements</h3><p className="text-sm text-muted-foreground mb-4 whitespace-pre-line">{job.requirements}</p></>}
        <p className="text-xs text-muted-foreground mb-4">Safety reminder: never pay money to get a job. Verify employers before sharing sensitive information.</p>
        {!user ? (
          <Link to="/auth" search={{ role: "worker" }} className="block text-center w-full py-3 bg-primary text-primary-foreground rounded font-medium">Sign in to apply (free)</Link>
        ) : account.isLoading ? null : !role ? (
          <Link to="/dashboard" className="block text-center w-full py-3 bg-primary text-primary-foreground rounded font-medium">Finish setting up your account</Link>
        ) : role === "employer" ? (
          <p className="text-sm text-muted-foreground bg-muted p-3 rounded">You're signed in as an employer. Only worker accounts can apply.</p>
        ) : state === "done" || state === "dupe" ? (
          <p className="text-sm text-primary bg-primary/10 p-3 rounded">{state === "done" ? "Application sent! " : "You've already applied for this job. "}Track it in <Link to="/dashboard" className="underline font-medium">My Account</Link>.</p>
        ) : (
          <>
            <textarea className={inputCls} rows={3} maxLength={1500} placeholder="Short message to the employer (your experience, availability…)" value={message} onChange={(e) => setMessage(e.target.value)} />
            {state === "error" && <p className="text-sm text-destructive mt-2">Couldn't send your application. Please try again.</p>}
            <button onClick={apply} disabled={state === "busy"} className="mt-3 w-full py-3 bg-primary text-primary-foreground rounded font-medium disabled:opacity-60">{state === "busy" ? "Sending…" : "Apply now (free)"}</button>
            <p className="text-xs text-muted-foreground mt-2">The employer will see your name, phone number and location.</p>
          </>
        )}
      </div>
    </div>
  );
}

type WorkerItem = NonNullable<ReturnType<typeof usePublicWorkers>["data"]>[number];

export function RealWorkers({ filters }: { filters: Filters }) {
  const workers = usePublicWorkers();
  const [selectedWorker, setSelectedWorker] = useState<WorkerItem | null>(null);

  if (!workers.data?.length) return null;
  const list = workers.data.filter((w) => matches(filters.search, w.skills, w.full_name) && matches(filters.location, w.location, w.town, w.district, w.province));

  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold mb-4">Workers on Zamwork ({list.length})</h2>
      {list.length === 0 && <p className="text-muted-foreground">No workers match your search yet.</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((w) => (
          <div
            key={w.id}
            onClick={() => setSelectedWorker(w)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedWorker(w); } }}
            tabIndex={0}
            role="button"
            className="bg-card border border-border rounded-lg p-4 flex flex-col justify-between text-left cursor-pointer transition hover:border-primary hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{w.full_name}</p>
                {w.skills?.length > 0 && (
                  <p className="text-sm text-primary line-clamp-1">{w.skills.join(" · ")}</p>
                )}
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{w.location}</span>
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Tap to view profile</span>
              <span className="font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">View Profile</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground mt-3">
        Want to hire? <Link to="/auth" search={{ role: "employer" }} className="text-primary font-medium">Post a job</Link> and workers can apply with their contact details.
      </p>

      {selectedWorker && (
        <WorkerProfileModal worker={selectedWorker} onClose={() => setSelectedWorker(null)} />
      )}
    </div>
  );
}

function WorkerProfileModal({ worker, onClose }: { worker: WorkerItem; onClose: () => void }) {
  const memberDate = worker.created_at
    ? new Date(worker.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short" })
    : null;

  const fullLocation = [worker.town, worker.district, worker.province].filter(Boolean).join(", ") || worker.location;

  return (
    <div className="fixed inset-0 z-[60] bg-foreground/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-card w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-6 relative shadow-lg" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 mb-4 pr-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{worker.full_name}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span>{fullLocation}</span>
            </p>
          </div>
        </div>

        {memberDate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 bg-muted/50 p-2 rounded">
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Member since {memberDate}</span>
          </div>
        )}

        <div className="mb-5">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-primary" />
            <span>Skills & Professions</span>
          </h3>
          {worker.skills && worker.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {worker.skills.map((s, i) => (
                <span key={i} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded font-medium">
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">General skilled worker</p>
          )}
        </div>

        <div className="border-t border-border pt-4 mb-5">
          <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>How to connect</span>
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            To protect worker privacy and prevent unsolicited calls, contact details are shared when you post a job and connect directly through Zamwork.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            to="/auth"
            search={{ role: "employer" }}
            onClick={onClose}
            className="block text-center w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
          >
            Post a Job to Connect (Free)
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 border border-border text-foreground rounded-lg text-sm hover:bg-muted transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
