import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Briefcase, Calendar, MapPin, ShieldCheck, User } from "lucide-react";
import { workersQueryOptions } from "@/lib/zamwork";

export const Route = createFileRoute("/worker/$workerId")({
  loader: ({ context }) => context.queryClient.ensureQueryData(workersQueryOptions),
  head: () => ({
    meta: [
      { title: "Worker profile | Zamwork" },
      { name: "description", content: "View a worker's skills, profession and location on Zamwork, and connect by posting a job." },
      { property: "og:title", content: "Worker profile | Zamwork" },
      { property: "og:description", content: "View a worker's skills, profession and location on Zamwork." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WorkerProfilePage,
});

function WorkerProfilePage() {
  const { workerId } = Route.useParams();
  const { data: workers } = useSuspenseQuery(workersQueryOptions);
  const worker = workers.find((w) => w.id === workerId);

  if (!worker) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
        <User className="w-12 h-12 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold mb-2">Worker not found</h1>
        <p className="text-muted-foreground mb-6">This profile may have been removed or the link is incorrect.</p>
        <Link to="/" className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium">
          Back to Zamwork
        </Link>
      </div>
    );
  }

  const memberDate = worker.created_at
    ? new Date(worker.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short" })
    : null;
  const fullLocation = [worker.town, worker.district, worker.province].filter(Boolean).join(", ") || worker.location;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link to="/" aria-label="Back to search" className="p-2 -ml-2 rounded hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-semibold">Worker profile</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{worker.full_name}</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span>{fullLocation}</span>
              </p>
            </div>
          </div>

          {memberDate && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-5 bg-muted/50 p-2 rounded">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Member since {memberDate}</span>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-primary" />
              <span>Skills & Professions</span>
            </h2>
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

          <div className="border-t border-border pt-4 mb-6">
            <h2 className="text-sm font-semibold mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>How to connect</span>
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              To protect worker privacy and prevent unsolicited calls, contact details are shared when you post a job and connect directly through Zamwork.
            </p>
          </div>

          <Link
            to="/auth"
            search={{ role: "employer" }}
            className="block text-center w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
          >
            Post a Job to Connect (Free)
          </Link>
        </div>
      </main>
    </div>
  );
}
