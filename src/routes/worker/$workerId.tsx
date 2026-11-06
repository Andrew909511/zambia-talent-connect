import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Phone, MessageCircle, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, workersQueryOptions } from "@/lib/zamwork";

export const Route = createFileRoute("/worker/$workerId")({
  loader: ({ context }) => context.queryClient.ensureQueryData(workersQueryOptions),
  head: () => ({
    meta: [
      { title: "Worker profile | Zamwork" },
      { name: "description", content: "View a worker's profession, skills, experience and location on Zamwork, and call or WhatsApp them." },
      { property: "og:title", content: "Worker profile | Zamwork" },
      { property: "og:description", content: "View a worker's skills and experience on Zamwork." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WorkerProfilePage,
});

function whatsappNumber(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("260")) return d;
  if (d.startsWith("0")) return "260" + d.slice(1);
  return d.length === 9 ? "260" + d : d;
}

function WorkerProfilePage() {
  const { workerId } = Route.useParams();
  const { data: workers } = useSuspenseQuery(workersQueryOptions);
  const worker = workers.find((w) => w.id === workerId);
  const { user, ready } = useSession();
  const contact = useQuery({
    queryKey: ["worker-contact", workerId, user?.id],
    enabled: !!user && !!worker,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_worker_contact", { _worker_id: workerId });
      if (error) throw error;
      return data ?? "";
    },
  });

  if (!worker) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
        <User className="w-12 h-12 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold mb-2">Worker not found</h1>
        <p className="text-muted-foreground mb-6">This profile may have been removed.</p>
        <Link to="/" search={{ view: "workers" }} className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium">Find other workers</Link>
      </div>
    );
  }

  const [profession, ...otherSkills] = worker.skills ?? [];
  const place = [worker.town, worker.district, worker.province].filter(Boolean).join(", ") || worker.location;
  const btn = "flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center gap-2">
          <Link to="/" search={{ view: "workers" }} className="flex items-center gap-2 p-2 -ml-2 rounded hover:bg-muted font-medium">
            <ArrowLeft className="w-5 h-5" /> Back to workers
          </Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-3xl font-bold">{worker.full_name}</h1>
          {profession && <p className="text-xl text-primary font-semibold mt-1">{profession}</p>}
          {place && <p className="text-base text-muted-foreground flex items-center gap-1 mt-2"><MapPin className="w-5 h-5 text-primary" />{place}</p>}
        </div>

        <section className="bg-card border border-border rounded-xl p-4">
          <h2 className="font-bold mb-3">Contact worker</h2>
          {!ready ? null : !user ? (
            <>
              <Link to="/auth" search={{ mode: "signin" }} className="block text-center w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg">Sign in to Call or WhatsApp</Link>
              <p className="text-sm text-muted-foreground mt-2">Free. Signing in helps protect workers from spam.</p>
            </>
          ) : contact.isLoading ? <p className="text-muted-foreground">Loading…</p> : contact.data ? (
            <>
              <div className="flex gap-3">
                <a href={`tel:${contact.data}`} className={`${btn} bg-primary text-primary-foreground`}><Phone className="w-5 h-5" />Call</a>
                <a href={`https://wa.me/${whatsappNumber(contact.data)}`} target="_blank" rel="noreferrer" className={`${btn} bg-brand-gold text-brand-ink`}><MessageCircle className="w-5 h-5" />WhatsApp</a>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{contact.data}</p>
            </>
          ) : <p className="text-muted-foreground">This worker hasn't added a phone number yet.</p>}
        </section>

        {worker.about && <section><h2 className="font-bold text-lg mb-1">About</h2><p className="text-base leading-relaxed whitespace-pre-line">{worker.about}</p></section>}
        {otherSkills.length > 0 && <section><h2 className="font-bold text-lg mb-1">Skills</h2><ul className="list-disc pl-5 text-base space-y-0.5">{otherSkills.map((s) => <li key={s}>{s}</li>)}</ul></section>}
        {worker.experience && <section><h2 className="font-bold text-lg mb-1">Experience</h2><p className="text-base">{worker.experience}</p></section>}

        <p className="text-xs text-muted-foreground">Stay safe: never pay money upfront. Meet in a safe place.</p>
      </main>
    </div>
  );
}
