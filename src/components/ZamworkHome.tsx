import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BriefcaseBusiness, Hammer, Building2, MapPin, Search, MoveUpRight, ShieldCheck, Sprout, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ALL_PLACES, PROFESSIONS, PROVINCE_NAMES } from "@/lib/zambia";
import workshop from "@/assets/zamwork_workshop.jpg";

type Props = { go: (view: string) => void; search: string; setSearch: (value: string) => void; location: string; setLocation: (value: string) => void };

export function ZamworkHome({ go, search, setSearch, location, setLocation }: Props) {
  const [mode, setMode] = useState("jobs");
  const categories = ["Electrician", "Plumber", "Driver", "Cleaner", "Tailor", "Graphic Designer"];
  return <>
    <section className="zw-hero relative isolate overflow-hidden">
      <img src={workshop} width={1920} height={1024} alt="Illustrative workshop scene of a carpenter meeting a client" className="absolute inset-0 h-full w-full object-cover zw-hero-image" />
      <div className="zw-hero-shade absolute inset-0" />
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-14 pb-16 sm:pt-20 sm:pb-20">
        <div className="zw-reveal max-w-xl">
          <p className="flex items-center gap-2 text-sm font-semibold text-hero-foreground/90 mb-6"><span className="h-2 w-2 rounded-full bg-brand-gold" /> LOCAL TALENT. REAL POSSIBILITIES.</p>
          <h1 className="text-5xl sm:text-7xl font-extrabold text-hero-foreground leading-none mb-5">ZamWork<span className="text-brand-gold">.</span></h1>
          <p className="text-3xl sm:text-4xl font-semibold text-hero-foreground leading-tight mb-5">For workers.<br />For people who <span className="text-brand-gold">need them.</span></p>
          <p className="text-base sm:text-lg leading-relaxed text-hero-foreground/85 max-w-md mb-7">Connecting Zambians to jobs and opportunities. Your next opportunity could be closer than you think.</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="h-12 px-6 bg-brand-gold text-brand-ink hover:bg-brand-gold/90"><Link to="/auth" search={{ role: "worker" }}>Create your profile <ArrowRight /></Link></Button>
            <Button variant="outline" onClick={() => go("workers")} className="h-12 px-6 border-hero-foreground/40 bg-transparent text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground">Find a worker <MoveUpRight /></Button>
          </div>
          <p className="flex items-center gap-2 text-xs text-hero-foreground/80 mt-5"><Check className="w-4 h-4 text-brand-gold" /> Free during launch <span className="mx-1">·</span> Made for Zambia 🇿🇲</p>
        </div>
      </div>
    </section>

    <section className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-7 sm:py-8">
        <div className="flex flex-wrap gap-5 sm:gap-8 mb-5 items-center"><h2 className="text-lg font-bold mr-auto">What are you looking for?</h2><div className="flex border-b border-border gap-5"><Button variant="ghost" onClick={() => setMode("jobs")} className={`rounded-none px-0 hover:bg-transparent ${mode === "jobs" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}><BriefcaseBusiness /> A job</Button><Button variant="ghost" onClick={() => setMode("workers")} className={`rounded-none px-0 hover:bg-transparent ${mode === "workers" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}><Hammer /> A skilled worker</Button></div></div>
        <form onSubmit={(e) => { e.preventDefault(); go(mode); }} className="grid md:grid-cols-[1.3fr_1fr_auto] gap-3">
          <label className="relative"><Search className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" /><input aria-label="Profession, skill or service" list="home-professions" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={mode === "jobs" ? "Job title, profession or skill" : "What do you need help with?"} className="w-full h-13 pl-12 pr-4 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary" /></label>
          <label className="relative"><MapPin className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" /><input aria-label="Town, district or province" list="home-places" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Town, district or province" className="w-full h-13 pl-12 pr-4 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary" /></label>
          <Button type="submit" className="h-13 px-7">{mode === "jobs" ? "Find jobs" : "Find workers"} <ArrowRight /></Button>
          <datalist id="home-professions">{PROFESSIONS.map((p) => <option key={p} value={p} />)}</datalist>
          <datalist id="home-places">{PROVINCE_NAMES.map((p) => <option key={p} value={p} />)}{ALL_PLACES.map((p) => <option key={p.province + p.town} value={p.town}>{p.province}</option>)}</datalist>
        </form>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs"><span className="text-muted-foreground">Popular searches:</span>{["Electrician", "Driver", "Cleaner"].map((p) => <Button key={p} variant="link" className="h-7 p-0 text-xs" onClick={() => { setSearch(p); go(mode); }}>{p}</Button>)}</div>
      </div>
    </section>

    <section className="py-14 sm:py-18 max-w-7xl mx-auto px-5 sm:px-8">
      <div className="flex flex-wrap gap-4 justify-between items-end mb-8"><div><p className="zw-eyebrow">YOUR SKILLS. YOUR NEXT CHAPTER.</p><h2 className="text-3xl sm:text-4xl font-bold mt-2">There’s a place for you here.</h2></div><p className="text-muted-foreground max-w-sm text-sm leading-relaxed">A growing community of job seekers, skilled workers, employers and clients across Zambia.</p></div>
      <div className="grid md:grid-cols-3 gap-5">
        {[
          { icon: BriefcaseBusiness, title: "Looking for work?", label: "JOB SEEKERS", text: "Create your profile and discover job opportunities.", cta: "Explore opportunities", action: () => go("jobs") },
          { icon: Hammer, title: "Good at what you do?", label: "SKILLED WORKERS", text: "Showcase your skills and make it easier for people to find you.", cta: "Create your profile", role: "worker" },
          { icon: Building2, title: "Need the right person?", label: "EMPLOYERS & CLIENTS", text: "Find skilled people for jobs and services you need.", cta: "Find local talent", action: () => go("workers") },
        ].map((item, i) => <div key={item.label} className={`zw-path border border-border rounded-lg p-7 flex flex-col ${i === 1 ? "bg-primary text-primary-foreground" : "bg-card"}`}><div className="flex justify-between items-start mb-7"><item.icon className={`h-9 w-9 ${i === 1 ? "text-brand-gold" : "text-primary"}`} /><span className={`text-xs font-semibold ${i === 1 ? "text-primary-foreground/60" : "text-muted-foreground"}`}>0{i + 1}</span></div><p className={`text-xs font-semibold mb-2 ${i === 1 ? "text-brand-gold" : "text-muted-foreground"}`}>{item.label}</p><h3 className="text-2xl font-bold mb-3">{item.title}</h3><p className={`text-sm leading-relaxed mb-6 flex-1 ${i === 1 ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{item.text}</p>{item.role ? <Button asChild variant="link" className="justify-start px-0 text-brand-gold"><Link to="/auth" search={{ role: "worker" }}>{item.cta} <ArrowRight /></Link></Button> : <Button variant="link" onClick={item.action} className="justify-start px-0">{item.cta} <ArrowRight /></Button>}</div>)}
      </div>
    </section>

    <section className="bg-secondary border-y border-border py-12">
      <div className="max-w-7xl mx-auto px-5 sm:px-8"><p className="zw-eyebrow">FROM EVERYDAY HELP TO SPECIALIST SKILLS</p><h2 className="text-3xl font-bold mt-2 mb-7">Find the skill you need.</h2><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">{categories.map((category) => <Button key={category} variant="outline" className="h-16 justify-between px-4 bg-card" onClick={() => { setSearch(category); go("workers"); }}>{category}<MoveUpRight className="h-4 w-4" /></Button>)}</div><p className="mt-5 text-sm text-muted-foreground">Every trade, talent and service belongs. Not on the list? Make it your own.</p></div>
    </section>

    <section className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-18"><div className="grid lg:grid-cols-[1fr_1.6fr] gap-10"><div><p className="zw-eyebrow">A SIMPLE START</p><h2 className="text-3xl sm:text-4xl font-bold mt-2">Make your<br className="hidden lg:block" /> next connection.</h2><Button asChild variant="link" className="px-0 mt-4"><Link to="/auth">Get started <ArrowRight /></Link></Button></div><div className="grid sm:grid-cols-3 gap-7">{[["01", "Introduce yourself", "Create your account. Add your skills and where you work."], ["02", "Find your match", "Discover opportunities or find someone with the skills you need."], ["03", "Take the next step", "Apply for a job or post an opportunity for local talent."]].map(([n, title, text]) => <div key={n} className="border-t-2 border-brand-gold pt-4"><span className="text-primary/45 text-3xl font-bold">{n}</span><h3 className="font-bold mt-4 mb-2">{title}</h3><p className="text-sm text-muted-foreground leading-relaxed">{text}</p></div>)}</div></div></section>

    <section className="bg-primary text-primary-foreground"><div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 flex flex-col md:flex-row gap-7 md:items-center md:justify-between"><div><div className="flex gap-2 items-center text-brand-gold text-sm mb-3"><Sprout className="w-5 h-5" /> BUILT FOR OUR GROWING COMMUNITY</div><h2 className="text-3xl sm:text-4xl font-bold">Let’s get Zambia working.</h2><p className="mt-3 text-primary-foreground/75">Find work. Find talent. Start a connection. Free during launch.</p></div><div className="flex flex-wrap gap-3"><Button asChild className="h-12 bg-brand-gold text-brand-ink hover:bg-brand-gold/90"><Link to="/auth" search={{ role: "worker" }}>Join as a worker <ArrowRight /></Link></Button><Button asChild variant="outline" className="h-12 bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link to="/auth" search={{ role: "employer" }}>Join as an employer</Link></Button></div></div></section>
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-7 flex items-start gap-3"><ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" /><p className="text-xs sm:text-sm text-muted-foreground leading-relaxed"><strong className="text-foreground">Connect with care.</strong> Always verify job offers, employers and workers before sharing money or sensitive personal information.</p></div>
  </>;
}