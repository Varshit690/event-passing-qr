import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  QrCode, 
  TrendingUp, 
  Music, 
  Cpu, 
  Code, 
  BookOpen, 
  Users, 
  Trophy, 
  Palette,
  CheckCircle2,
  Clock,
  Ticket
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { EventCard } from '../components/events/EventCard';
import { MOCK_EVENTS, CATEGORIES_CONFIG } from '../services/mockEvents';
import { api } from '../services/api';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [events, setEvents] = useState(MOCK_EVENTS);

  useEffect(() => {
    if (location.hash === '#portals') {
      const el = document.getElementById('portals');
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [location.hash]);

  useEffect(() => {
    api.get('/events')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.events) && res.data.events.length > 0) {
          setEvents(res.data.events);
        }
      })
      .catch(() => {});
  }, []);

  const featuredEvents = events.filter((e) => e.isFeatured).length > 0
    ? events.filter((e) => e.isFeatured)
    : events.slice(0, 3);
  const trendingEvents = events.filter((e) => e.isTrending).length > 0
    ? events.filter((e) => e.isTrending)
    : events.slice(0, 3);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedLocation && selectedLocation !== 'All Locations') params.set('location', selectedLocation);
    if (selectedCategory) params.set('category', selectedCategory);
    navigate(`/events?${params.toString()}`);
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Music': return <Music className="w-5 h-5" />;
      case 'Cpu': return <Cpu className="w-5 h-5" />;
      case 'Code': return <Code className="w-5 h-5" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5" />;
      case 'Users': return <Users className="w-5 h-5" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5" />;
      case 'Trophy': return <Trophy className="w-5 h-5" />;
      case 'Palette': return <Palette className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-24">
      {/* 1. Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        {/* Glow ambient background elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Badge pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold backdrop-blur-sm shadow-sm animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Next-Gen Event Ticketing & Instant QR Verification</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            Unforgettable Events.{' '}
            <span className="gradient-text-primary">One Perfect Pass.</span>
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Discover extraordinary experiences, reserve your spot in seconds, and enter effortlessly with your digital QR ticket.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button
              variant="gradient"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => navigate('/events')}
            >
              Explore Events
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-purple-500/40 hover:border-purple-500/80 text-purple-300"
              onClick={() => {
                const el = document.getElementById('portals');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else navigate('/#portals');
              }}
            >
              Three Portals
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/auth/register?portal=organizer')}
            >
              Host an Event
            </Button>
          </div>

          {/* Search Box Card */}
          <div className="pt-8 max-w-4xl mx-auto">
            <form
              onSubmit={handleSearch}
              className="p-3 sm:p-4 rounded-2xl bg-[#171723]/90 border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-center gap-3"
            >
              {/* Event Name Input */}
              <div className="flex-1 w-full flex items-center gap-3 px-3 py-2 bg-[#11111B] rounded-xl border border-white/5">
                <Search className="w-5 h-5 text-purple-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search concert, hackathon, summit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* Location Select */}
              <div className="w-full md:w-56 flex items-center gap-2 px-3 py-2 bg-[#11111B] rounded-xl border border-white/5">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="All Locations" className="bg-[#171723] text-white">All Locations</option>
                  <option value="San Francisco, CA" className="bg-[#171723] text-white">San Francisco, CA</option>
                  <option value="Austin, TX" className="bg-[#171723] text-white">Austin, TX</option>
                  <option value="Seattle, WA" className="bg-[#171723] text-white">Seattle, WA</option>
                  <option value="Boston, MA" className="bg-[#171723] text-white">Boston, MA</option>
                  <option value="New York, NY" className="bg-[#171723] text-white">New York, NY</option>
                  <option value="Los Angeles, CA" className="bg-[#171723] text-white">Los Angeles, CA</option>
                </select>
              </div>

              {/* Search Submit Button */}
              <Button
                type="submit"
                variant="gradient"
                size="md"
                className="w-full md:w-auto px-6 py-3 whitespace-nowrap"
              >
                Find Events
              </Button>
            </form>

            {/* Popular Searches */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-4 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Trending:</span>
              {['AI Summit', 'Hackathons', 'EDM Concert', 'College Fest', 'Tech Meetup'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => navigate(`/events?q=${encodeURIComponent(tag)}`)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto border-t border-white/[0.06]">
            <div className="p-4 rounded-xl bg-[#171723]/40 border border-white/5">
              <p className="text-2xl sm:text-3xl font-extrabold text-white">50K+</p>
              <p className="text-xs text-slate-400 mt-0.5">Tickets Issued</p>
            </div>
            <div className="p-4 rounded-xl bg-[#171723]/40 border border-white/5">
              <p className="text-2xl sm:text-3xl font-extrabold text-purple-400">&lt; 0.3s</p>
              <p className="text-xs text-slate-400 mt-0.5">Gate QR Verification</p>
            </div>
            <div className="p-4 rounded-xl bg-[#171723]/40 border border-white/5">
              <p className="text-2xl sm:text-3xl font-extrabold text-cyan-400">100%</p>
              <p className="text-xs text-slate-400 mt-0.5">Anti-Fraud Guarantee</p>
            </div>
            <div className="p-4 rounded-xl bg-[#171723]/40 border border-white/5">
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">4.9 / 5</p>
              <p className="text-xs text-slate-400 mt-0.5">Organizer Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THREE DEDICATED PORTALS SECTION */}
      <section id="portals" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Unified Architecture • Three Dedicated Roles</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Choose Your <span className="gradient-text-primary">Portal</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            EVENTORA is engineered with three streamlined, role-specific portals tailored for attendees, event organizers, and platform administrators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Attendee Portal Card */}
          <div className="group relative rounded-3xl bg-[#171723] border border-white/10 hover:border-purple-500/50 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-600/20 transition-all" />
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-glow-purple">
                  <Ticket className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Attendee Portal
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                  Discover & Attend
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Browse college fests, technical hackathons, concerts, and workshops. Reserve seats in seconds with cryptographically signed digital passes.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-white/5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Public Registration & Fast Login</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Interactive Event Catalog & Search</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Instant Pass Booking & Checkout</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>My Tickets & Downloadable QR Passes</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-6 mt-6 border-t border-white/5">
              <Button
                variant="gradient"
                size="md"
                className="w-full shadow-glow-purple"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => navigate('/events')}
              >
                Enter Attendee Portal
              </Button>
              <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
                <button
                  onClick={() => navigate('/auth/login?portal=attendee')}
                  className="hover:text-purple-300 transition-colors underline"
                >
                  Attendee Login
                </button>
                <span>•</span>
                <button
                  onClick={() => navigate('/auth/register?portal=attendee')}
                  className="hover:text-purple-300 transition-colors underline"
                >
                  Create Account
                </button>
              </div>
            </div>
          </div>

          {/* Organizer Portal Card */}
          <div className="group relative rounded-3xl bg-[#171723] border border-cyan-500/30 hover:border-cyan-400/60 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-2xl overflow-hidden ring-1 ring-cyan-500/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/20 transition-all" />
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Organizer Portal
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Host & Verify
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Direct organizer sign-up with instant access. Create events, manage ticket tiers, track attendance metrics, and scan QR passes at the door.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-white/5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Direct Organizer Registration (No Wait)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Event Creation & Ticket Tier Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Live Bookings & Sales Telemetry</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Camera QR Scanner & Gate Check-in</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-6 mt-6 border-t border-white/5">
              <Button
                variant="outline"
                size="md"
                className="w-full border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:bg-cyan-500/10"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => navigate('/organizer')}
              >
                Enter Organizer Portal
              </Button>
              <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
                <button
                  onClick={() => navigate('/auth/login?portal=organizer')}
                  className="hover:text-cyan-300 transition-colors underline"
                >
                  Organizer Login
                </button>
                <span>•</span>
                <button
                  onClick={() => navigate('/auth/register?portal=organizer')}
                  className="hover:text-cyan-300 transition-colors underline"
                >
                  Direct Sign-up
                </button>
              </div>
            </div>
          </div>

          {/* Admin Portal Card */}
          <div className="group relative rounded-3xl bg-[#171723] border border-white/10 hover:border-amber-500/50 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Admin Portal
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                  System Governance
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Authorized control center. Provisioned securely via backend bootstrap. Manage platform accounts, inspect system-wide stats, and oversee events.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-white/5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Secure Backend Provisioning (No Public Reg)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Platform-wide Performance Telemetry</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>User & Organizer Role Directory</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Event Governance & Historical Audits</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-6 mt-6 border-t border-white/5">
              <Button
                variant="outline"
                size="md"
                className="w-full border-amber-500/40 hover:border-amber-400 text-amber-300 hover:bg-amber-500/10"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => navigate('/auth/login?portal=admin')}
              >
                Admin Secure Login
              </Button>
              <div className="text-center text-[11px] text-slate-500">
                Provisioned via authorized bootstrap script
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Events Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Handpicked Highlights</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Featured Experiences
            </h2>
          </div>
          <Button
            variant="ghost"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => navigate('/events')}
            className="self-start sm:self-auto text-purple-400 hover:text-purple-300"
          >
            Explore All Events
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {featuredEvents.slice(0, 3).map((event) => (
            <EventCard key={event.id} event={event} featured />
          ))}
        </div>
      </section>

      {/* 3. Explore by Category Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Explore by Category
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Find the event that matches your passion, from high-octane hackathons to star-studded concerts.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {CATEGORIES_CONFIG.map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/events?category=${cat.id}`)}
              className="group p-5 rounded-2xl bg-[#171723] hover:bg-[#1E1E2E] border border-white/5 hover:border-purple-500/40 text-left transition-all duration-300 hover:-translate-y-1 shadow-card"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} p-[1px] mb-4 shadow-md`}>
                <div className="w-full h-full bg-[#171723] group-hover:bg-transparent rounded-[11px] flex items-center justify-center text-white transition-colors duration-300">
                  {getCategoryIcon(cat.icon)}
                </div>
              </div>
              <h3 className="font-bold text-white group-hover:text-purple-300 transition-colors text-sm sm:text-base">
                {cat.label}
              </h3>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <span>View listings</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* 4. Trending Events Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Selling Fast</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Trending Events This Month
            </h2>
          </div>
          <Button
            variant="ghost"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => navigate('/events')}
            className="text-cyan-400 hover:text-cyan-300"
          >
            See More
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {trendingEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section id="how-it-works" className="relative py-16 bg-[#11111B]/80 border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Simplicity By Design</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              How EVENTORA Works
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
              From discovering your next memory to entering through the gate in under a second.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-[#171723] border border-white/5 relative space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-extrabold text-lg">
                01
              </div>
              <h3 className="text-xl font-bold text-white">Discover & Reserve</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Browse college festivals, technical hackathons, summits, and musical concerts. Select your pass tier and reserve instantly.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-[#171723] border border-white/5 relative space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-extrabold text-lg">
                02
              </div>
              <h3 className="text-xl font-bold text-white">Instant QR Pass</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Receive an encrypted digital pass with a cryptographic QR code. Save to your wallet, view online, or download an official PDF pass.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-[#171723] border border-white/5 relative space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-extrabold text-lg">
                03
              </div>
              <h3 className="text-xl font-bold text-white">Frictionless Gate Entry</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Walk up to the gate, flash your QR code to the organizer scanner, and enter in 0.3 seconds with atomic anti-reuse verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Why Choose EVENTORA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Built for Modern Event Security
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Traditional paper and generic barcodes fail in large crowds. EVENTORA is engineered from the ground up for zero fraud and lightning throughput.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-[#171723] border border-white/5 space-y-3">
            <ShieldCheck className="w-8 h-8 text-purple-400" />
            <h3 className="font-bold text-white text-base">Cryptographic QR Pass</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every ticket is generated with a non-sequential, cryptographically hashed token to completely eliminate forged badges.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#171723] border border-white/5 space-y-3">
            <Zap className="w-8 h-8 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Atomic Double-Scan Guard</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Database transactions prevent race conditions. Two simultaneous gate entries cannot validate the same ticket twice.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#171723] border border-white/5 space-y-3">
            <QrCode className="w-8 h-8 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Hardware-Free Scanner</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Event staff can scan passes directly from any mobile phone or browser camera without renting costly laser scanner hardware.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#171723] border border-white/5 space-y-3">
            <TrendingUp className="w-8 h-8 text-amber-400" />
            <h3 className="font-bold text-white text-base">Live Attendance Telemetry</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time check-in stats, remaining capacity, check-in velocity graphs, and attendee logs right on your organizer dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Organizer Call To Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden p-8 sm:p-14 bg-gradient-to-r from-purple-900/60 via-[#171723] to-cyan-900/40 border border-purple-500/30 shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-6">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              For College Clubs, Festival Organizers & Tech Communities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Ready to host your next college fest, concert, or hackathon?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Launch your event page in under 3 minutes, issue digital tickets with dynamic QR codes, and verify entries at the gate with any smartphone camera.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                variant="gradient"
                size="lg"
                onClick={() => navigate('/create-event')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Create Event Now
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/organizer')}
              >
                View Organizer Hub
              </Button>
            </div>
          </div>

          {/* Decorative graphic element */}
          <div className="absolute right-0 bottom-0 top-0 w-1/3 hidden lg:flex items-center justify-center opacity-30 pointer-events-none">
            <QrCode className="w-64 h-64 text-purple-400" />
          </div>
        </div>
      </section>
    </div>
  );
};
