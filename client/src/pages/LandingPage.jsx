import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  ShieldCheck, 
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
  Ticket,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { EventCard } from '../components/events/EventCard';
import { MOCK_EVENTS, CATEGORIES_CONFIG } from '../services/mockEvents';
import { api } from '../services/api';

export const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedCategory, setSelectedCategory] = useState(null);
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

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedLocation && selectedLocation !== 'All Locations') params.set('location', selectedLocation);
    if (selectedCategory) params.set('category', selectedCategory);
    navigate(`/events?${params.toString()}`);
  };

  const getCategoryIcon = (iconName) => {
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
    <div className="space-y-16">
      {/* 1. Hero Section */}
      <section className="bg-white border-b border-slate-200 pt-12 pb-16 md:pt-16 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Badge pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Ticket className="w-3.5 h-3.5 text-blue-600" />
            <span>Campus Event Ticketing & QR Pass Management</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 max-w-3xl mx-auto leading-tight">
            Find and book campus events with instant QR passes.
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Discover upcoming college festivals, hackathons, seminars, and concerts. Reserve your spot in seconds and check in at the gate with your digital QR ticket.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Button
              variant="primary"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => navigate('/events')}
            >
              Browse Events
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/auth/register?portal=organizer')}
            >
              Host an Event
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                const el = document.getElementById('portals');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else navigate('/#portals');
              }}
            >
              Role Portals
            </Button>
          </div>

          {/* Search Box Card */}
          <div className="pt-6 max-w-3xl mx-auto">
            <form
              onSubmit={handleSearch}
              className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-300 shadow-sm flex flex-col md:flex-row items-center gap-2 text-left"
            >
              {/* Event Name Input */}
              <div className="flex-1 w-full flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search events, workshops, hackathons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                />
              </div>

              {/* Location Select */}
              <div className="w-full md:w-52 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="All Locations">All Locations</option>
                  <option value="San Francisco, CA">San Francisco, CA</option>
                  <option value="Austin, TX">Austin, TX</option>
                  <option value="Seattle, WA">Seattle, WA</option>
                  <option value="Boston, MA">Boston, MA</option>
                  <option value="New York, NY">New York, NY</option>
                  <option value="Los Angeles, CA">Los Angeles, CA</option>
                </select>
              </div>

              {/* Search Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full md:w-auto px-5 py-2 text-xs sm:text-sm whitespace-nowrap"
              >
                Search Events
              </Button>
            </form>

            {/* Popular Searches */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-xs text-slate-500">
              <span className="font-medium text-slate-600">Quick filters:</span>
              {['Hackathons', 'Tech Workshops', 'Campus Fest', 'Concerts', 'Conferences'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => navigate(`/events?q=${encodeURIComponent(tag)}`)}
                  className="px-2.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 hover:text-slate-900 text-slate-600 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Practical Highlights */}
          <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto border-t border-slate-200 text-left">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div className="p-2 rounded-md bg-blue-100 text-blue-700 shrink-0">
                <Ticket className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Instant QR Pass</p>
                <p className="text-xs text-slate-500 mt-0.5">Tickets generated immediately with downloadable PDF passes.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div className="p-2 rounded-md bg-emerald-100 text-emerald-700 shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Camera Check-in</p>
                <p className="text-xs text-slate-500 mt-0.5">Scan gate tickets directly using any mobile phone or browser.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div className="p-2 rounded-md bg-slate-200 text-slate-700 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Dedicated Portals</p>
                <p className="text-xs text-slate-500 mt-0.5">Streamlined workflows for attendees, organizers, and admins.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THREE DEDICATED PORTALS SECTION */}
      <section id="portals" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            <span>Role-Based Access</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Choose Your Portal
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm">
            Access the dedicated tools designed for your specific role on the platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Attendee Portal Card */}
          <div className="rounded-xl bg-white border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:border-slate-300 hover:shadow-md transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
                  <Ticket className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Attendee
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Discover & Attend
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Browse college events, seminars, and concerts. Reserve seats and access your digital QR tickets anytime on your dashboard.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Public registration & quick login</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Filter by category, price, and location</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Instant pass booking & seat reservation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Downloadable PDF admission passes</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-5 mt-4 border-t border-slate-100">
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => navigate('/events')}
              >
                Browse Events
              </Button>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <button
                  onClick={() => navigate('/auth/login?portal=attendee')}
                  className="hover:text-blue-600 transition-colors underline"
                >
                  Attendee Login
                </button>
                <span>•</span>
                <button
                  onClick={() => navigate('/auth/register?portal=attendee')}
                  className="hover:text-blue-600 transition-colors underline"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>

          {/* Organizer Portal Card */}
          <div className="rounded-xl bg-white border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:border-slate-300 hover:shadow-md transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  Organizer
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Host & Manage
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Sign up directly as an organizer. Create events, configure ticket tiers, monitor registrations, and verify QR passes at the entrance.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Direct organizer registration</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Publish events with custom ticket tiers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>View total bookings & remaining capacity</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Camera-based gate pass verification</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-5 mt-4 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => navigate('/organizer')}
              >
                Organizer Dashboard
              </Button>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <button
                  onClick={() => navigate('/auth/login?portal=organizer')}
                  className="hover:text-blue-600 transition-colors underline"
                >
                  Organizer Login
                </button>
                <span>•</span>
                <button
                  onClick={() => navigate('/auth/register?portal=organizer')}
                  className="hover:text-blue-600 transition-colors underline"
                >
                  Direct Sign-up
                </button>
              </div>
            </div>
          </div>

          {/* Admin Portal Card */}
          <div className="rounded-xl bg-white border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:border-slate-300 hover:shadow-md transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  Administrator
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Platform Oversight
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Platform management center for administrators. Review organizer applications, manage user accounts, and oversee event listings.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Secure pre-configured admin access</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Approve & reject organizer requests</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>User and organizer role directory</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>System-wide statistics & audits</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-5 mt-4 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => navigate('/auth/login?portal=admin')}
              >
                Admin Sign In
              </Button>
              <div className="text-center text-[11px] text-slate-500">
                Pre-configured administrator account
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Events Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-0.5">
              <span>Highlighted Listings</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Featured Events
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => navigate('/events')}
            className="self-start sm:self-auto text-blue-600 hover:text-blue-700"
          >
            View All Events
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredEvents.slice(0, 3).map((event) => (
            <EventCard key={event.id} event={event} featured />
          ))}
        </div>
      </section>

      {/* 4. Explore by Category Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-slate-900">
            Browse by Category
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm max-w-lg mx-auto">
            Find the events that match your interests, from academic workshops to campus cultural fests.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {CATEGORIES_CONFIG.map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/events?category=${cat.id}`)}
              className="group p-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-400 text-left transition-all shadow-sm"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {getCategoryIcon(cat.icon)}
              </div>
              <h3 className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                {cat.label}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <span>View listings</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* 5. Trending Events Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Upcoming</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Popular Events
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => navigate('/events')}
            className="text-blue-600 hover:text-blue-700"
          >
            See All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>

      {/* 6. How It Works Section */}
      <section id="how-it-works" className="py-14 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Simple Process</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              How EVENTORA Works
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm max-w-lg mx-auto">
              From finding an event to entering through the gate with your digital QR pass.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h3 className="text-base font-bold text-slate-900">Browse & Select Tickets</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Explore campus fests, workshops, and hackathons. Choose free registration or select paid ticket tiers.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h3 className="text-base font-bold text-slate-900">Receive Digital QR Pass</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Get an instant QR ticket on your dashboard. View it on your smartphone or download the printable PDF pass.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h3 className="text-base font-bold text-slate-900">Scan at the Gate</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Show your QR pass to the event organizer at the entrance for quick camera verification and entry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Key Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Practical Features for Campus Events
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm max-w-lg mx-auto">
            Everything needed to manage ticket registration and gate verification without complex hardware.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Unique QR Pass</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every booking issues a unique QR code token that ensures each ticket can only be used once.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Anti-Duplicate Guard</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Atomic check-in checks prevent the same ticket from being validated more than once at entry gates.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Browser QR Scanner</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Event staff can scan tickets directly using their smartphone camera or laptop webcam.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Attendee Counts</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Organizers see live check-in counts and remaining ticket capacity on their dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* 8. Organizer Call To Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl p-8 sm:p-10 bg-blue-600 text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl text-left">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-700 text-blue-100">
              For College Clubs & Event Organizers
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Hosting a college fest, hackathon, or seminar?
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
              Create your event listing, configure custom ticket tiers, issue QR passes, and verify attendees at the gate with any smartphone camera.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="secondary"
              size="md"
              className="bg-white text-blue-700 hover:bg-blue-50 font-semibold"
              onClick={() => navigate('/create-event')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create an Event
            </Button>
            <Button
              variant="outline"
              size="md"
              className="text-white border-white/40 hover:bg-blue-700 hover:border-white"
              onClick={() => navigate('/organizer')}
            >
              Organizer Hub
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
