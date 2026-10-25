import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  X, 
  SlidersHorizontal 
} from 'lucide-react';
import { EventCard } from '../components/events/EventCard';
import { Button } from '../components/ui/Button';
import { MOCK_EVENTS, CATEGORIES_CONFIG } from '../services/mockEvents';
import { api } from '../services/api';

export const EventsPage = () => {
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
  }, [liveEvents, searchQuery, selectedCategory, selectedLocation, selectedPriceType, sortBy]);

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'ALL' || selectedLocation !== 'ALL' || selectedPriceType !== 'ALL';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedLocation('ALL');
    setSelectedPriceType('ALL');
    setSortBy('upcoming');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Search Bar */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Discover Events
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Explore college fests, concerts, hackathons, and seminars happening near you.
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-300 shadow-sm flex flex-col sm:flex-row items-center gap-2">
          <div className="flex-1 w-full flex items-center gap-2.5 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by title, club, venue, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600"
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
              className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="upcoming">Upcoming First</option>
              <option value="popular">Most Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              className="sm:hidden px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Categories Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES_CONFIG.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid & Filters Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden lg:block space-y-5 p-5 rounded-xl bg-white border border-slate-200 h-fit shadow-sm text-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>Filter Events</span>
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-rose-600 hover:underline font-medium"
              >
                Reset
              </button>
            )}
          </div>

          {/* Location Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
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
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Pricing Tier
            </label>
            <div className="space-y-1">
              {[
                { id: 'ALL', label: 'All Events' },
                { id: 'FREE', label: 'Free RSVP' },
                { id: 'PAID', label: 'Paid Passes' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPriceType(p.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedPriceType === p.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span>{p.label}</span>
                  {selectedPriceType === p.id && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Events Results Column */}
        <main className="lg:col-span-3 space-y-5">
          {/* Active Chips & Count */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <p>
              Showing <span className="font-bold text-slate-900">{filteredEvents.length}</span> event{filteredEvents.length === 1 ? '' : 's'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear filters</span>
              </button>
            )}
          </div>

          {/* Event Cards Grid */}
          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="p-12 text-center rounded-xl bg-white border border-dashed border-slate-300 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mx-auto text-blue-600">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">No events found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  We couldn't find any events matching your selected criteria. Try adjusting your search query or reset filters.
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
