import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { RealJobs, RealWorkers } from "@/components/RealListings";
import { ALL_PLACES, PROFESSIONS, PROVINCE_NAMES, matches, norm } from "@/lib/zambia";

const placeOf = (town: string) => ALL_PLACES.find((p) => norm(p.town) === norm(town))?.province ?? "";
const PlacesList = () => <datalist id="zm-places">{PROVINCE_NAMES.map((p) => <option key={p} value={p} />)}{ALL_PLACES.map((p) => <option key={p.province + p.town} value={p.town}>{p.province}</option>)}</datalist>;
const ProfessionsList = () => <datalist id="zm-professions">{PROFESSIONS.map((p) => <option key={p} value={p} />)}</datalist>;
import { useSession } from "@/lib/zamwork";
import {
  Search,
  MapPin,
  Briefcase,
  ArrowRight,
  Shield,
  Zap,
  TrendingUp,
  Menu,
  X,
  User,
  UserPlus,
  Hammer,
  Building2,
  AlertTriangle,
  Mail,
  Clock,
} from "lucide-react";

type Job = {
  id: number;
  title: string;
  employer: string;
  category: string;
  location: string;
  salary: string;
  type: string;
  description: string;
  requirements: string[];
  apply: string;
  image: string;
};

const jobs: Job[] = [
  { id: 1, title: "Electrician", employer: "Example Construction Company", category: "Skilled Trades", location: "Lusaka", salary: "3,500 - 5,000", type: "Contract", description: "Install and maintain electrical wiring for residential and commercial buildings.", requirements: ["Trade certificate in electrical installation", "2+ years experience", "Own basic tools"], apply: "Contact the employer through Zamwork with your CV and certificates.", image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=300&fit=crop" },
  { id: 2, title: "Security Guard - Night Shift", employer: "Example Security Firm", category: "Security", location: "Copperbelt", salary: "2,000 - 2,500", type: "Full-time", description: "Guard premises overnight, patrol the site and report incidents.", requirements: ["Grade 12 certificate", "Security training preferred", "Available for night shifts"], apply: "Send a message to the employer through Zamwork.", image: "https://images.unsplash.com/photo-1552058544-f6b08422138a?w=400&h=300&fit=crop" },
  { id: 3, title: "Domestic Cleaner - Weekly", employer: "Example Household", category: "Domestic Work", location: "Lusaka", salary: "800 - 1,200", type: "Casual", description: "Weekly cleaning of a family home including laundry and ironing.", requirements: ["Reliable and punctual", "References from previous work"], apply: "Contact the client through Zamwork.", image: "https://images.unsplash.com/photo-1563453392212-d0b604b1c622?w=400&h=300&fit=crop" },
  { id: 4, title: "Delivery Driver", employer: "Example Logistics Business", category: "Driving", location: "Ndola", salary: "2,800 - 3,500", type: "Full-time", description: "Deliver goods to customers around Ndola and nearby towns.", requirements: ["Valid driver's licence", "Good knowledge of Ndola roads", "Clean driving record"], apply: "Send your licence details and CV through Zamwork.", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop" },
  { id: 5, title: "Graphic Designer - Freelance", employer: "Example Digital Agency", category: "IT & Technology", location: "Remote", salary: "4,000 - 8,000", type: "Freelance", description: "Design logos, flyers and social media graphics for small businesses.", requirements: ["Portfolio of previous work", "Experience with design software"], apply: "Share your portfolio with the employer through Zamwork.", image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop" },
  { id: 6, title: "Construction Worker", employer: "Example Building Contractor", category: "Construction", location: "Livingstone", salary: "2,500 - 3,500", type: "Contract", description: "General labour on a building site: bricklaying, mixing and carrying materials.", requirements: ["Physically fit", "Previous site experience an advantage"], apply: "Contact the employer through Zamwork.", image: "https://images.unsplash.com/photo-1581092916550-e323be2ae537?w=400&h=300&fit=crop" },
];

type Worker = {
  id: number;
  name: string;
  title: string;
  location: string;
  experience: string;
  about: string;
  skills: string[];
  portfolio: string[];
  image: string;
};

const workers: Worker[] = [
  { id: 1, name: "Example Electrician", title: "Electrician", location: "Lusaka", experience: "5 years", about: "Sample profile showing how a skilled worker can describe their services, such as house wiring, repairs and installations.", skills: ["House wiring", "Fault finding", "Solar installation"], portfolio: ["https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&h=200&fit=crop"], image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop" },
  { id: 2, name: "Example Cleaner", title: "Domestic Cleaner", location: "Copperbelt", experience: "3 years", about: "Sample profile showing how a domestic worker can present their experience and availability.", skills: ["House cleaning", "Laundry & ironing", "Cooking"], portfolio: [], image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop" },
  { id: 3, name: "Example Driver", title: "Driver", location: "Ndola", experience: "7 years", about: "Sample profile showing how a driver can list licences, routes and vehicle experience.", skills: ["Class C licence", "Deliveries", "Vehicle maintenance"], portfolio: [], image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop" },
];

const categories = [
  { name: "Skilled Trades", icon: "🔧" },
  { name: "Driving", icon: "🚗" },
  { name: "Security", icon: "🛡️" },
  { name: "Domestic Work", icon: "🏠" },
  { name: "IT & Technology", icon: "💻" },
  { name: "Construction", icon: "🏗️" },
];

export const Route = createFileRoute("/")({
  validateSearch: z.object({ view: z.enum(["home", "jobs", "workers"]).optional() }),
  head: () => ({
    meta: [
      { title: "Zamwork — Find Work. Find Talent. Connect." },
      { name: "description", content: "Zamwork is a growing platform connecting job seekers, skilled workers, employers and clients across Zambia. Free during our launch." },
      { property: "og:title", content: "Zamwork — Find Work. Find Talent. Connect." },
      { property: "og:description", content: "Connecting Zambians to jobs and opportunities. Free during our launch." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const DemoBadge = () => (
  <span className="text-[10px] font-bold uppercase tracking-wide bg-accent text-accent-foreground px-2 py-0.5 rounded">Example</span>
);

const SafetyNotice = () => (
  <div className="flex gap-3 p-4 rounded-lg border border-accent/40 bg-accent/10 text-sm">
    <AlertTriangle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
    <p className="text-foreground"><strong>Safety reminder:</strong> Always verify job offers and users before sharing money or sensitive personal information. Zamwork helps people connect, but users should exercise caution and conduct their own verification.</p>
  </div>
);

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] bg-foreground/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-card w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 p-2 rounded hover:bg-muted"><X className="w-5 h-5" /></button>
        {children}
      </div>
    </div>
  );
}

function Index() {
  const initialView = Route.useSearch().view ?? "home";
  const [currentView, setCurrentView] = useState<string>(initialView);
  const { user } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [savedJobs, setSavedJobs] = useState<number[]>([]);
  const [openJob, setOpenJob] = useState<Job | null>(null);
  const [openWorker, setOpenWorker] = useState<Worker | null>(null);
  
  const go = (view: string) => { setCurrentView(view); setMobileMenuOpen(false); window.scrollTo({ top: 0 }); };

  const filteredJobs = jobs.filter((job) => {
    return matches(searchQuery, job.title, job.employer, job.category, job.description) && matches(selectedLocation, job.location, placeOf(job.location));
  });

  const toggleSaveJob = (jobId: number) => setSavedJobs((prev) => (prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]));

  const filteredWorkers = workers.filter((w) => matches(searchQuery, w.title, w.skills, w.about) && matches(selectedLocation, w.location, placeOf(w.location)));

  const JobCard = ({ job }: { job: Job }) => (
    <div className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition flex flex-col">
      <img src={job.image} alt={job.title} className="w-full h-40 object-cover" loading="lazy" />
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-foreground">{job.title}</h3>
          <button onClick={() => toggleSaveJob(job.id)} aria-label="Save job" className={`text-xl p-1 ${savedJobs.includes(job.id) ? "text-accent" : "text-muted-foreground"}`}>♥</button>
        </div>
        <p className="text-sm text-muted-foreground mb-2">{job.employer}</p>
        <div className="flex items-center gap-2 mb-3"><span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{job.type}</span><DemoBadge /></div>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{job.description}</p>
        <div className="flex justify-between items-center text-sm mb-3 mt-auto">
          <span className="text-muted-foreground flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
          <span className="font-semibold text-primary">K{job.salary}</span>
        </div>
        <button onClick={() => setOpenJob(job)} className="w-full py-3 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition font-medium text-sm">View Details & Apply</button>
      </div>
    </div>
  );

  const WorkerCard = ({ worker }: { worker: Worker }) => (
    <div className="bg-card rounded-lg border border-border p-6 text-center hover:shadow-lg transition">
      <img src={worker.image} alt={worker.name} className="w-20 h-20 rounded-full mx-auto mb-4 object-cover" loading="lazy" />
      <div className="flex justify-center mb-2"><DemoBadge /></div>
      <h3 className="font-bold text-lg">{worker.name}</h3>
      <p className="text-primary font-medium mb-1">{worker.title}</p>
      <p className="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-1"><MapPin className="w-4 h-4" /> {worker.location}</p>
      <p className="text-sm text-muted-foreground mb-4 flex items-center justify-center gap-1"><Clock className="w-4 h-4" /> {worker.experience} experience</p>
      <button onClick={() => setOpenWorker(worker)} className="w-full py-3 border border-primary text-primary rounded hover:bg-primary/5 transition font-medium text-sm">View Profile</button>
    </div>
  );

  const navBtn = (view: string, label: string) => (
    <button onClick={() => go(view)} className={`text-sm font-medium transition ${currentView === view ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>{label}</button>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="bg-primary text-primary-foreground text-center text-xs sm:text-sm py-2 px-4">Zamwork is now live 🇿🇲 — free to use during our launch</div>
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button onClick={() => go("home")} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center"><Briefcase className="w-6 h-6 text-primary-foreground" /></div>
              <span className="text-xl font-bold text-foreground">Zamwork</span>
            </button>
            <nav className="hidden md:flex gap-8">{navBtn("home", "Home")}{navBtn("jobs", "Find Jobs")}{navBtn("workers", "Find Workers")}</nav>
            <div className="flex items-center gap-3">
              <Link to={user ? "/dashboard" : "/auth"} className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition font-medium text-sm"><User className="w-4 h-4" />{user ? "My Account" : "Sign In"}</Link>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu" className="md:hidden p-2">{mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-1">
              <button onClick={() => go("home")} className="block w-full text-left px-4 py-3 hover:bg-muted rounded">Home</button>
              <button onClick={() => go("jobs")} className="block w-full text-left px-4 py-3 hover:bg-muted rounded">Find Jobs</button>
              <button onClick={() => go("workers")} className="block w-full text-left px-4 py-3 hover:bg-muted rounded">Find Workers</button>
              <Link to={user ? "/dashboard" : "/auth"} className="block w-full text-left px-4 py-3 hover:bg-muted rounded font-medium text-primary">{user ? "My Account" : "Sign In / Sign Up"}</Link>
            </div>
          )}
        </div>
      </header>

      {currentView === "home" && (
        <>
          <section className="bg-gradient-to-br from-primary/5 to-accent/5 py-12 sm:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <p className="text-primary font-semibold mb-3">Find Work. Find Talent. Connect.</p>
                <h1 className="text-3xl sm:text-5xl font-bold text-foreground mb-4">Connecting Zambians to Jobs and Opportunities</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Zamwork is a growing platform connecting job seekers, skilled workers, employers and clients across Zambia.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
                  <input type="text" placeholder="What work are you looking for?" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-card text-base focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
                  <input type="text" list="zm-places" placeholder="Town, district or province" value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-card text-base focus:outline-none focus:ring-2 focus:ring-primary" />
                  <PlacesList />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => go("jobs")} className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-2">Find Jobs <ArrowRight className="w-4 h-4" /></button>
                <button onClick={() => go("workers")} className="px-8 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/90 transition flex items-center justify-center gap-2">Find Workers <ArrowRight className="w-4 h-4" /></button>
              </div>
            </div>
          </section>

          <section className="py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-6 text-center">
                <h2 className="text-xl sm:text-2xl font-bold mb-2">Zamwork is now live 🇿🇲</h2>
                <p className="text-muted-foreground">Join our growing community of job seekers, skilled workers, employers and clients. Create your profile, discover opportunities and start making connections — free during our launch.</p>
              </div>
            </div>
          </section>

          <section className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">Who Zamwork Is For</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { icon: UserPlus, title: "For Job Seekers", text: "Create your profile and discover job opportunities.", action: () => go("jobs"), cta: "Browse jobs" },
                  { icon: Hammer, title: "For Skilled Workers", text: "Showcase your skills and make it easier for people to find you.", action: () => {}, to: "worker", cta: "Create a profile" },
                  { icon: Building2, title: "For Employers & Clients", text: "Find skilled people for jobs and services you need.", action: () => go("workers"), cta: "Find workers" },
                ].map((c) => (
                  <div key={c.title} className="bg-card border border-border rounded-lg p-6 flex flex-col">
                    <c.icon className="w-8 h-8 text-primary mb-3" />
                    <h3 className="font-bold text-lg mb-2">{c.title}</h3>
                    <p className="text-muted-foreground mb-4 flex-1">{c.text}</p>
                    {c.to ? <Link to="/auth" search={{ role: "worker" }} className="text-primary font-medium flex items-center gap-2 py-2">{c.cta} <ArrowRight className="w-4 h-4" /></Link> : <button onClick={c.action} className="text-primary font-medium flex items-center gap-2 py-2">{c.cta} <ArrowRight className="w-4 h-4" /></button>}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-12 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-8">Popular Categories</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {categories.map((cat) => (
                  <button key={cat.name} onClick={() => { setSearchQuery(cat.name); go("jobs"); }} className="p-4 rounded-lg border border-border bg-card hover:border-primary hover:bg-primary/5 transition text-center">
                    <div className="text-3xl mb-2">{cat.icon}</div>
                    <p className="font-medium text-sm">{cat.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center mb-2 gap-4"><h2 className="text-2xl sm:text-3xl font-bold">Example Jobs</h2><button onClick={() => go("jobs")} className="text-primary hover:text-primary/80 font-medium flex items-center gap-2 whitespace-nowrap">View All <ArrowRight className="w-4 h-4" /></button></div>
              <p className="text-sm text-muted-foreground mb-8">These are sample listings to show how jobs will appear on Zamwork.</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{jobs.slice(0, 3).map((job) => <JobCard key={job.id} job={job} />)}</div>
            </div>
          </section>

          <section className="py-12 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Example Worker Profiles</h2>
              <p className="text-sm text-muted-foreground mb-8">Sample profiles showing how skilled workers can present themselves.</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{workers.map((w) => <WorkerCard key={w.id} worker={w} />)}</div>
            </div>
          </section>

          <section className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-12 text-center">How Zamwork Works</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[["1", "Create Profile", "Sign up and tell us about yourself. Add skills, describe your business."], ["2", "Find & Connect", "Browse jobs, apply, or search workers. Message to discuss opportunities."], ["3", "Work & Grow", "Complete jobs, build your reputation, earn on your terms."]].map(([n, t, d]) => (
                  <div key={n} className="text-center"><div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-2xl font-bold text-primary">{n}</span></div><h3 className="font-bold text-lg mb-2">{t}</h3><p className="text-muted-foreground">{d}</p></div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-12 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">Why Choose Zamwork?</h2>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="flex gap-4"><Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" /><div><h3 className="font-bold mb-2">Safety First</h3><p className="text-muted-foreground text-sm">Clear profiles and listings, plus safety guidance to help you connect with confidence.</p></div></div>
                <div className="flex gap-4"><Zap className="w-6 h-6 text-primary flex-shrink-0 mt-1" /><div><h3 className="font-bold mb-2">Fast & Simple</h3><p className="text-muted-foreground text-sm">Easy to use. Works on any phone. No complicated process.</p></div></div>
                <div className="flex gap-4"><TrendingUp className="w-6 h-6 text-primary flex-shrink-0 mt-1" /><div><h3 className="font-bold mb-2">Free During Launch</h3><p className="text-muted-foreground text-sm">Creating a profile, searching, viewing listings and applying are all free.</p></div></div>
              </div>
              <div className="max-w-3xl mx-auto"><SafetyNotice /></div>
            </div>
          </section>

          <section className="py-12 sm:py-16 bg-gradient-to-r from-primary to-primary/80">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">Ready to Get Started?</h2>
              <p className="text-lg text-primary-foreground/90 mb-8">Be one of the first to join Zamwork — find work, find talent and connect. Free during our launch.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth" search={{ role: "worker" }} className="px-8 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition">Sign Up as Worker</Link>
                <Link to="/auth" search={{ role: "employer" }} className="px-8 py-3 bg-primary-foreground text-primary rounded-lg font-semibold hover:bg-primary-foreground/90 transition">Sign Up as Employer</Link>
              </div>
            </div>
          </section>
        </>
      )}

      {currentView === "jobs" && (
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-2">Find Jobs</h1>
            <p className="text-sm text-muted-foreground mb-6">Listings marked "Example" are samples to show how jobs appear on Zamwork.</p>
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div><label className="block text-sm font-medium mb-2">Profession, skill or service</label><input type="text" list="zm-professions" placeholder="e.g. Plumber, Tailor, Driver..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-border bg-card text-base focus:outline-none focus:ring-2 focus:ring-primary" /><ProfessionsList /></div>
              <div><label className="block text-sm font-medium mb-2">Location</label><input type="text" list="zm-places" placeholder="Town, district or province" value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-border bg-card text-base focus:outline-none focus:ring-2 focus:ring-primary" /><PlacesList /></div>
            </div>
            <div className="mb-6"><SafetyNotice /></div>
            <RealJobs filters={{ search: searchQuery, location: selectedLocation }} />
            <h2 className="text-xl font-bold mb-2">Example listings</h2>
            <div className="mb-4 text-sm text-muted-foreground">Found {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"}</div>
            {filteredJobs.length === 0 ? (
              <div className="text-center py-12"><Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" /><p className="text-lg text-muted-foreground">No jobs found matching your criteria.</p><button onClick={() => { setSearchQuery(""); setSelectedLocation(""); }} className="mt-3 text-primary font-medium">Clear filters</button></div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{filteredJobs.map((job) => <JobCard key={job.id} job={job} />)}</div>
            )}
          </div>
        </section>
      )}

      {currentView === "workers" && (
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-2">Find Workers</h1>
            <p className="text-sm text-muted-foreground mb-6">Profiles marked "Example" are samples to show how worker profiles appear on Zamwork.</p>
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div><label className="block text-sm font-medium mb-2">Profession, skill or service</label><input type="text" list="zm-professions" placeholder="e.g. Electrician, Barber, Tutor..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-border bg-card text-base focus:outline-none focus:ring-2 focus:ring-primary" /><ProfessionsList /></div>
              <div><label className="block text-sm font-medium mb-2">Location</label><input type="text" list="zm-places" placeholder="Town, district or province" value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-border bg-card text-base focus:outline-none focus:ring-2 focus:ring-primary" /><PlacesList /></div>
            </div>
            <div className="mb-6"><SafetyNotice /></div>
            <RealWorkers filters={{ search: searchQuery, location: selectedLocation }} />
            <h2 className="text-xl font-bold mb-4">Example profiles</h2>
            {filteredWorkers.length === 0 && <p className="text-muted-foreground mb-4">No example profiles match.</p>}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{filteredWorkers.map((w) => <WorkerCard key={w.id} worker={w} />)}</div>
          </div>
        </section>
      )}

      <footer className="border-t border-border py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="font-bold text-foreground mb-1">Zamwork</p>
          <p>Find Work. Find Talent. Connect. — Free during our launch.</p>
        </div>
      </footer>

      {openJob && (
        <Modal onClose={() => setOpenJob(null)}>
          <div className="mb-2"><DemoBadge /></div>
          <h2 className="text-xl font-bold pr-8">{openJob.title}</h2>
          <p className="text-muted-foreground mb-3">{openJob.employer}</p>
          <div className="flex flex-wrap gap-3 text-sm mb-4">
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{openJob.location}</span>
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">{openJob.type}</span>
            <span className="font-semibold text-primary">K{openJob.salary}</span>
          </div>
          <h3 className="font-semibold mb-1">Description</h3>
          <p className="text-sm text-muted-foreground mb-4">{openJob.description}</p>
          <h3 className="font-semibold mb-1">Requirements</h3>
          <ul className="list-disc pl-5 text-sm text-muted-foreground mb-4 space-y-1">{openJob.requirements.map((r) => <li key={r}>{r}</li>)}</ul>
          <h3 className="font-semibold mb-1">How to apply</h3>
          <p className="text-sm text-muted-foreground mb-4">{openJob.apply}</p>
          <div className="mb-4"><SafetyNotice /></div>
          <p className="text-xs text-muted-foreground mb-3">This is an example listing and is not an active job.</p>
          <button onClick={() => { setOpenJob(null); go("jobs"); }} className="w-full py-3 bg-primary text-primary-foreground rounded font-medium">See real jobs you can apply for</button>
        </Modal>
      )}

      {openWorker && (
        <Modal onClose={() => setOpenWorker(null)}>
          <div className="flex items-center gap-4 mb-4">
            <img src={openWorker.image} alt={openWorker.name} className="w-16 h-16 rounded-full object-cover" />
            <div><DemoBadge /><h2 className="text-xl font-bold">{openWorker.name}</h2><p className="text-primary font-medium">{openWorker.title}</p></div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm mb-4 text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{openWorker.location}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{openWorker.experience} experience</span>
          </div>
          <h3 className="font-semibold mb-1">About</h3>
          <p className="text-sm text-muted-foreground mb-4">{openWorker.about}</p>
          <h3 className="font-semibold mb-2">Skills</h3>
          <div className="flex flex-wrap gap-2 mb-4">{openWorker.skills.map((s) => <span key={s} className="text-xs bg-muted px-2 py-1 rounded">{s}</span>)}</div>
          <h3 className="font-semibold mb-2">Work samples</h3>
          {openWorker.portfolio.length ? (
            <div className="grid grid-cols-2 gap-2 mb-4">{openWorker.portfolio.map((p) => <img key={p} src={p} alt="Work sample" className="rounded w-full h-24 object-cover" />)}</div>
          ) : <p className="text-sm text-muted-foreground mb-4">No work samples added yet.</p>}
          <div className="mb-4"><SafetyNotice /></div>
          <p className="text-xs text-muted-foreground mb-3">This is an example profile, not a real person.</p>
          <Link to="/auth" search={{ role: "employer" }} onClick={() => setOpenWorker(null)} className="w-full py-3 bg-primary text-primary-foreground rounded font-medium flex items-center justify-center gap-2"><Mail className="w-4 h-4" />Contact (free)</Link>
        </Modal>
      )}

    </div>
  );
}
