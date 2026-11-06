import { Link } from "@tanstack/react-router";
import { BriefcaseBusiness, Hammer, UserPlus, ShieldCheck, ArrowRight } from "lucide-react";
import workshop from "@/assets/zamwork_workshop.jpg";

type Props = { go: (view: string) => void; search: string; setSearch: (value: string) => void; location: string; setLocation: (value: string) => void };

export function ZamworkHome({ go }: Props) {
  const big = "w-full flex items-center gap-4 rounded-xl p-5 text-left shadow-sm transition active:scale-[0.99]";
  return <>
    <section className="zw-hero relative isolate overflow-hidden">
      <img src={workshop} width={1920} height={1024} alt="A carpenter meeting a client in a Zambian workshop" className="absolute inset-0 h-full w-full object-cover zw-hero-image" />
      <div className="zw-hero-shade absolute inset-0" />
      <div className="relative max-w-xl mx-auto px-5 pt-10 pb-10 sm:pt-16 sm:pb-16">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-hero-foreground leading-none mb-3">ZamWork<span className="text-brand-gold">.</span></h1>
        <p className="text-lg sm:text-xl text-hero-foreground/90 mb-7">Jobs and skilled workers across Zambia. Free.</p>
        <div className="space-y-3">
          <button onClick={() => go("jobs")} className={`${big} bg-card text-foreground`}>
            <BriefcaseBusiness className="w-9 h-9 text-primary shrink-0" />
            <span className="flex-1"><span className="block text-xl font-bold">Find Work</span><span className="block text-sm text-muted-foreground">I am looking for a job</span></span>
            <ArrowRight className="w-6 h-6 text-primary" />
          </button>
          <button onClick={() => go("workers")} className={`${big} bg-card text-foreground`}>
            <Hammer className="w-9 h-9 text-primary shrink-0" />
            <span className="flex-1"><span className="block text-xl font-bold">Find Workers</span><span className="block text-sm text-muted-foreground">I need someone for a job or service</span></span>
            <ArrowRight className="w-6 h-6 text-primary" />
          </button>
          <Link to="/auth" search={{ role: "worker", mode: "signup" }} className={`${big} bg-brand-gold text-brand-ink`}>
            <UserPlus className="w-9 h-9 shrink-0" />
            <span className="flex-1"><span className="block text-xl font-bold">Create Your Profile</span><span className="block text-sm opacity-80">Let people find you for work</span></span>
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </div>
    </section>
    <div className="max-w-xl mx-auto px-5 py-6 flex items-start gap-3"><ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" /><p className="text-sm text-muted-foreground"><strong className="text-foreground">Stay safe.</strong> Never pay money to get a job. Check people before sharing personal details.</p></div>
  </>;
}
