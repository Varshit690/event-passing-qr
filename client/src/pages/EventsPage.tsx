import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  DollarSign, 
  X, 
  Sparkles, 
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { EventCard } from '../components/events/EventCard';
import { Button } from '../components/ui/Button';
import { MOCK_EVENTS, CATEGORIES_CONFIG } from '../services/mockEvents';
import { EventCategory } from '../types';
import { api } from '../services/api';

export const EventsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL params
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'ALL';
  const initialLocation = searchParams.get('location') || 'ALL';
  const initialPriceType = searchParams.get('price') || 'ALL';
  const initialSort = searchParams.get('sort') || 'upcoming';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [selectedPriceType, setSelectedPriceType] = useState(initialPriceType);
  const [sortBy, setSortBy] = useState(initialSort);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const [liveEvents, setLiveEvents] = useState(MOCK_EVENTS);

  // Fetch live events from API
  useEffect(() => {
    api.get('/events')
      .then((res) => {
        if (res.data?.success && res.data.events?.length > 0) {
          setLiveEvents(res.data.events);
        }
      })
      .catch(() => {
        // Fallback to initial mock events
      });
  }, []);

  // Synchronize state with URL parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
    if (selectedLocation !== 'ALL') params.set('location', selectedLocation);
    if (selectedPriceType !== 'ALL') params.set('price', selectedPriceType);
    if (sortBy !== 'upcoming') params.set('sort', sortBy);
    setSearchParams(params, { replace: true });
  }, [searchQuery, selectedCategory, selectedLocation, selectedPriceType, sortBy, setSearchParams]);

  // Unique locations from events
  const locations = useMemo(() => {
    const locs = Array.from(new Set(liveEvents.map(e => e.location)));
    return ['ALL', ...locs];
  }, [liveEvents]);

  // Filter and Sort Events
  const filteredEvents = useMemo(() => {
    return liveEvents.filter((event) => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(q);
        const matchesDesc = event.description.toLowerCase().includes(q);
        const matchesVenue = event.venue.toLowerCase().includes(q);
        const matchesOrganizer = event.organizerName.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesVenue && !matchesOrganizer) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'ALL' && event.category !== selectedCategory) {
        return false;
      }

      // Location filter
      if (selectedLocation !== 'ALL' && event.location !== selectedLocation) {
        return false;
      }

      // Price filter
      if (selectedPriceType === 'FREE' && event.minPrice > 0) {
        return false;
      }
      if (selectedPriceType === 'PAID' && event.minPrice === 0) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'upcoming') {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }
      if (sortBy === 'popular') {
        return (b.totalCapacity - b.remainingTickets) - (a.totalCapacity - a.remainingTickets);
      }
      if (sortBy === 'price-low') {
        return a.minPrice - b.minPrice;
      }
      if (sortBy === 'price-high') {
        return b.minPrice - a.minPrice;
      }
      return 0;
    });
  }, [searchQuery, selectedCategory, selectedLocation, selectedPriceType, sortBy]);

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'ALL' || selectedLocation !== 'ALL' || selectedPriceType !== 'ALL';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedLocation('ALL');
    setSelectedPriceType('ALL');
    setSortBy('upcoming');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Search Bar */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Discover Events
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Explore college fests, concerts, hackathons, and conferences happening near you.
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="p-3 rounded-2xl bg-[#171723] border border-white/10 shadow-lg flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full flex items-center gap-3 px-3 py-2 bg-[#11111B] rounded-xl border border-white/5">
            <Search className="w-5 h-5 text-purple-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by title, artist, university, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-[#11111B] border border-white/10 text-xs font-medium text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="upcoming">Upcoming First</option>
              <option value="popular">Most Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              className="sm:hidden px-3.5 py-2.5 rounded-xl bg-[#11111B] border border-white/10 text-xs font-medium text-slate-200 flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Categories Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-purple-600 text-white shadow-glow-purple'
                : 'bg-[#171723] text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES_CONFIG.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-purple-600 text-white shadow-glow-purple'
                  : 'bg-[#171723] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid & Filters Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden lg:block space-y-6 p-6 rounded-2xl bg-[#171723] border border-white/5 h-fit">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <span className="font-bold text-white text-sm flex items-center gap-2">
              <Filter className="w-4 h-4 text-purple-400" />
              <span>Refine Search</span>
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-rose-400 hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          {/* Location Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#11111B] border border-white/10 text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Cities & Regions</option>
              {locations.filter(l => l !== 'ALL').map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Price Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pricing Tier
            </label>
            <div className="space-y-1.5">
              {[
                { id: 'ALL', label: 'All Events' },
                { id: 'FREE', label: 'Free RSVP' },
                { id: 'PAID', label: 'Paid Passes' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPriceType(p.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    selectedPriceType === p.id
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{p.label}</span>
                  {selectedPriceType === p.id && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Events Results Column */}
        <main className="lg:col-span-3 space-y-6">
          {/* Active Chips & Count */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <p>
              Showing <span className="font-bold text-white">{filteredEvents.length}</span> event{filteredEvents.length === 1 ? '' : 's'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-purple-400 hover:underline flex items-center gap-1 font-medium"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear all filters</span>
              </button>
            )}
          </div>

          {/* Event Cards Grid */}
          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="p-12 text-center rounded-2xl bg-[#171723]/50 border border-dashed border-white/10 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto text-purple-400">
                <Search className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">No events found</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                  We couldn't find any events matching your selected criteria. Try adjusting your search query or filters.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
