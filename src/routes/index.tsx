import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  MapPin,
  Briefcase,
  Star,
  CheckCircle,
  ArrowRight,
  Shield,
  Zap,
  TrendingUp,
  Menu,
  X,
  Bell,
  User,
} from "lucide-react";

const jobs = [
  { id: 1, title: "Experienced Electrician Needed", employer: "BuildCo Zambia", category: "Skilled Trades", location: "Lusaka", salary: "3,500 - 5,000", type: "Contract", verified: true, image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=300&fit=crop" },
  { id: 2, title: "Security Guard - Night Shift", employer: "SafeGuard Services", category: "Security", location: "Copperbelt", salary: "2,000 - 2,500", type: "Full-time", verified: true, image: "https://images.unsplash.com/photo-1552058544-f6b08422138a?w=400&h=300&fit=crop" },
  { id: 3, title: "Domestic Cleaner - Weekly", employer: "Sarah M.", category: "Domestic Work", location: "Lusaka", salary: "800 - 1,200", type: "Casual", verified: false, image: "https://images.unsplash.com/photo-1563453392212-d0b604b1c622?w=400&h=300&fit=crop" },
  { id: 4, title: "Driver for Delivery Company", employer: "FastDeliver Zambia", category: "Driving", location: "Ndola", salary: "2,800 - 3,500", type: "Full-time", verified: true, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop" },
  { id: 5, title: "Graphic Designer - Freelance", employer: "Digital Agency Lusaka", category: "IT & Technology", location: "Remote", salary: "4,000 - 8,000", type: "Freelance", verified: true, image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop" },
  { id: 6, title: "Construction Workers - Multiple Positions", employer: "Zambia Construction Ltd", category: "Construction", location: "Livingstone", salary: "2,500 - 3,500", type: "Contract", verified: true, image: "https://images.unsplash.com/photo-1581092916550-e323be2ae537?w=400&h=300&fit=crop" },
];

const categories = [
  { name: "Skilled Trades", icon: "🔧", count: 234 },
  { name: "Driving", icon: "🚗", count: 156 },
  { name: "Security", icon: "🛡️", count: 89 },
  { name: "Domestic Work", icon: "🏠", count: 342 },
  { name: "IT & Technology", icon: "💻", count: 127 },
  { name: "Construction", icon: "🏗️", count: 201 },
];

const workers = [
  { id: 1, name: "John Banda", title: "Electrician", location: "Lusaka", rating: 4.9, reviews: 28, verified: true, image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop" },
  { id: 2, name: "Grace Mwale", title: "Domestic Cleaner", location: "Copperbelt", rating: 4.8, reviews: 45, verified: true, image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop" },
  { id: 3, name: "Moses Kapula", title: "Driver", location: "Ndola", rating: 4.7, reviews: 32, verified: true, image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop" },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zamwork — Connecting Zambia to Opportunity" },
      { name: "description", content: "Find jobs and skilled workers across Zambia. Zamwork connects job seekers and employers with verified opportunities in Lusaka, Ndola, Livingstone and beyond." },
      { property: "og:title", content: "Zamwork — Connecting Zambia to Opportunity" },
      { property: "og:description", content: "Find work, discover skilled workers, and build your future across Zambia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

export default function Index() {
  const [currentView, setCurrentView] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [savedJobs, setSavedJobs] = useState<number[]>([]);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || job.employer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = selectedLocation === "All Locations" || job.location === selectedLocation;
    const matchesCategory = selectedCategory === "All Categories" || job.category === selectedCategory;
    return matchesSearch && matchesLocation && matchesCategory;
  });

  const toggleSaveJob = (jobId: number) => {
    setSavedJobs(prev => prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]);
  };

  const locations = ["All Locations", ...new Set(jobs.map(j => j.location))];
  const categoryNames = ["All Categories", ...new Set(jobs.map(j => j.category))];

  const JobCard = ({ job }: { job: (typeof jobs)[number] }) => (
    <div className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition">
      <img src={job.image} alt={job.title} className="w-full h-40 object-cover" />
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-foreground">{job.title}</h3>
          <button onClick={() => toggleSaveJob(job.id)} className={`text-xl ${savedJobs.includes(job.id) ? "text-accent" : "text-muted-foreground"}`}>♥</button>
        </div>
        <p className="text-sm text-muted-foreground mb-2">{job.employer}</p>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{job.type}</span>
          {job.verified && <CheckCircle className="w-4 h-4 text-green-600" />}
        </div>
        <div className="flex justify-between items-center text-sm mb-3">
          <span className="text-muted-foreground flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
          <span className="font-semibold text-primary">K{job.salary}</span>
        </div>
        <button className="w-full py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition font-medium text-sm">Apply Now</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground hidden sm:inline">Zamwork</span>
            </div>

            <nav className="hidden md:flex gap-8">
              <button onClick={() => setCurrentView("home")} className={`text-sm font-medium transition ${currentView === "home" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>Home</button>
              <button onClick={() => setCurrentView("jobs")} className={`text-sm font-medium transition ${currentView === "jobs" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>Find Jobs</button>
              <button onClick={() => setCurrentView("workers")} className={`text-sm font-medium transition ${currentView === "workers" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>Find Workers</button>
            </nav>

            <div className="flex items-center gap-4">
              <button className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground transition"><Bell className="w-5 h-5" /></button>
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition font-medium text-sm"><User className="w-4 h-4" />Sign In</button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden">{mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <button onClick={() => { setCurrentView("home"); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-2 hover:bg-muted rounded">Home</button>
              <button onClick={() => { setCurrentView("jobs"); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-2 hover:bg-muted rounded">Find Jobs</button>
              <button onClick={() => { setCurrentView("workers"); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-2 hover:bg-muted rounded">Find Workers</button>
            </div>
          )}
        </div>
      </header>

      {currentView === "home" && (
        <>
          <section className="bg-gradient-to-br from-primary/5 to-accent/5 py-12 sm:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h1 className="text-3xl sm:text-5xl font-bold text-foreground mb-4">Connecting Zambia to Opportunity</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">Find work, discover skilled workers, and build your future. Zamwork makes it easy to connect with legitimate opportunities across Zambia.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto mb-8">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <input type="text" placeholder="What work are you looking for?" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer">
                    {locations.map(loc => (<option key={loc} value={loc}>{loc}</option>))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => setCurrentView("jobs")} className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-2">Find Jobs <ArrowRight className="w-4 h-4" /></button>
                <button onClick={() => setCurrentView("workers")} className="px-8 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/90 transition flex items-center justify-center gap-2">Find Workers <ArrowRight className="w-4 h-4" /></button>
              </div>
            </div>
          </section>

          <section className="py-12 sm:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-8">Popular Categories</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {categories.map(cat => (<button key={cat.name} onClick={() => { setCurrentView("jobs"); setSelectedCategory(cat.name); }} className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition text-center"><div className="text-3xl mb-2">{cat.icon}</div><p className="font-medium text-sm">{cat.name}</p><p className="text-xs text-muted-foreground">{cat.count} jobs</p></button>))}
              </div>
            </div>
          </section>

          <section className="py-12 sm:py-16 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center mb-8"><h2 className="text-2xl sm:text-3xl font-bold">Featured Jobs</h2><button onClick={() => setCurrentView("jobs")} className="text-primary hover:text-primary/80 font-medium flex items-center gap-2">View All <ArrowRight className="w-4 h-4" /></button></div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.slice(0, 3).map(job => <JobCard key={job.id} job={job} />)}
              </div>
            </div>
          </section>

          <section className="py-12 sm:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-8">Featured Workers</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {workers.map(worker => (<div key={worker.id} className="bg-card rounded-lg border border-border p-6 text-center hover:shadow-lg transition"><img src={worker.image} alt={worker.name} className="w-20 h-20 rounded-full mx-auto mb-4 object-cover" /><h3 className="font-bold text-lg">{worker.name}</h3><p className="text-primary font-medium mb-2">{worker.title}</p><div className="flex items-center justify-center gap-2 mb-3"><Star className="w-4 h-4 text-accent fill-accent" /><span className="font-semibold">{worker.rating}</span><span className="text-sm text-muted-foreground">({worker.reviews})</span></div><p className="text-sm text-muted-foreground mb-4 flex items-center justify-center gap-1"><MapPin className="w-4 h-4" /> {worker.location}</p><button className="w-full py-2 border border-primary text-primary rounded hover:bg-primary/5 transition font-medium text-sm">View Profile</button></div>))}
              </div>
            </div>
          </section>

          <section className="py-12 sm:py-16 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-12 text-center">How Zamwork Works</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center"><div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-2xl font-bold text-primary">1</span></div><h3 className="font-bold text-lg mb-2">Create Profile</h3><p className="text-muted-foreground">Sign up and tell us about yourself. Add skills, describe your business.</p></div>
                <div className="text-center"><div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-2xl font-bold text-primary">2</span></div><h3 className="font-bold text-lg mb-2">Find & Connect</h3><p className="text-muted-foreground">Browse jobs, apply, or search workers. Message to discuss opportunities.</p></div>
                <div className="text-center"><div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-2xl font-bold text-primary">3</span></div><h3 className="font-bold text-lg mb-2">Work & Grow</h3><p className="text-muted-foreground">Complete jobs, build reputation with reviews, earn on your terms.</p></div>
              </div>
            </div>
          </section>

          <section className="py-12 sm:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">Why Choose Zamwork?</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex gap-4"><Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" /><div><h3 className="font-bold mb-2">Verified & Trusted</h3><p className="text-muted-foreground text-sm">All users verified. Transparent reviews and ratings.</p></div></div>
                <div className="flex gap-4"><Zap className="w-6 h-6 text-primary flex-shrink-0 mt-1" /><div><h3 className="font-bold mb-2">Fast & Simple</h3><p className="text-muted-foreground text-sm">Easy to use. Works on any phone. No complicated process.</p></div></div>
                <div className="flex gap-4"><TrendingUp className="w-6 h-6 text-primary flex-shrink-0 mt-1" /><div><h3 className="font-bold mb-2">Grow Your Career</h3><p className="text-muted-foreground text-sm">Build reputation. Earn more. Find better opportunities.</p></div></div>
              </div>
            </div>
          </section>

          <section className="py-12 sm:py-16 bg-gradient-to-r from-primary to-primary/80">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">Ready to Get Started?</h2>
              <p className="text-lg text-primary-foreground/90 mb-8">Join thousands of Zambians finding work and building their future.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition">Sign Up as Worker</button>
                <button className="px-8 py-3 bg-primary-foreground text-primary rounded-lg font-semibold hover:bg-primary-foreground/90 transition">Sign Up as Employer</button>
              </div>
            </div>
          </section>
        </>
      )}

      {currentView === "jobs" && (
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-8">Find Jobs</h1>
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <div><label className="block text-sm font-medium mb-2">Search</label><input type="text" placeholder="Job title or employer..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium mb-2">Location</label><select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer">{locations.map(loc => (<option key={loc} value={loc}>{loc}</option>))}</select></div>
              <div><label className="block text-sm font-medium mb-2">Category</label><select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer">{categoryNames.map(cat => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
            </div>
            <div className="mb-4 text-sm text-muted-foreground">Found {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"}</div>
            {filteredJobs.length === 0 ? (
              <div className="text-center py-12"><Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" /><p className="text-lg text-muted-foreground">No jobs found matching your criteria.</p><p className="text-sm text-muted-foreground">Try adjusting your filters.</p></div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map(job => <JobCard key={job.id} job={job} />)}
              </div>
            )}
          </div>
        </section>
      )}

      {currentView === "workers" && (
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-8">Find Workers</h1>
            <div className="mb-8 text-sm text-muted-foreground">Featured workers available for hire</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {workers.map(worker => (<div key={worker.id} className="bg-card rounded-lg border border-border p-6 text-center hover:shadow-lg transition"><img src={worker.image} alt={worker.name} className="w-20 h-20 rounded-full mx-auto mb-4 object-cover" /><h3 className="font-bold text-lg">{worker.name}</h3><p className="text-primary font-medium mb-2">{worker.title}</p><div className="flex items-center justify-center gap-2 mb-3"><Star className="w-4 h-4 text-accent fill-accent" /><span className="font-semibold">{worker.rating}</span><span className="text-sm text-muted-foreground">({worker.reviews})</span></div><p className="text-sm text-muted-foreground mb-4 flex items-center justify-center gap-1"><MapPin className="w-4 h-4" /> {worker.location}</p><button className="w-full py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition font-medium text-sm">Hire Now</button></div>))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
