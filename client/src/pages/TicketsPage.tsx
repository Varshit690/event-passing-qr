import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Ticket as TicketIcon, 
  Calendar, 
  MapPin, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  Clock, 
  Download, 
  ArrowRight 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DigitalTicketCard } from '../components/tickets/DigitalTicketCard';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { Ticket } from '../types';
import { api } from '../services/api';

export const TicketsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('ALL');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = () => {
    setIsLoading(true);
    setError(null);
    api.get('/tickets/me')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.tickets)) {
          const formatted = res.data.tickets.map((t: any) => ({
            ...t,
            eventTitle: t.event?.title || 'Event Pass',
            eventDate: t.event?.startDate
              ? new Date(t.event.startDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Upcoming',
            venue: t.event?.venue ? `${t.event.venue}, ${t.event.location}` : 'Event Venue',
          }));
          setTickets(formatted);
        } else {
          setTickets([]);
        }
      })
      .catch((err) => {
        setError(err?.response?.data?.message || 'Unable to load your tickets from the server.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchTickets();
  }, [user]);

  const filteredTickets = tickets.filter((t) => {
    if (activeTab === 'VALID') return t.status === 'VALID';
    if (activeTab === 'CHECKED_IN') return t.status === 'CHECKED_IN';
    return true;
  });

  const validCount = tickets.filter((t) => t.status === 'VALID').length;
  const checkedInCount = tickets.filter((t) => t.status === 'CHECKED_IN').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-900/40 via-[#171723] to-cyan-900/30 border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
              Attendee Dashboard
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name || 'Attendee'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Here are your official admission passes. Keep your QR tickets handy or download the PDF version for instant offline check-in at the gate.
          </p>
        </div>

        <Link to="/events">
          <Button variant="gradient" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Explore More Events
          </Button>
        </Link>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs
          tabs={[
            { id: 'ALL', label: 'All Passes', count: tickets.length },
            { id: 'VALID', label: 'Active & Ready', count: validCount },
            { id: 'CHECKED_IN', label: 'Past / Checked In', count: checkedInCount },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <p className="text-xs text-slate-400">
          Showing <span className="text-white font-bold">{filteredTickets.length}</span> pass{filteredTickets.length === 1 ? '' : 'es'}
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 rounded-3xl bg-[#171723] border border-white/5 animate-pulse p-6 space-y-4">
              <div className="h-6 w-1/3 bg-white/10 rounded-lg" />
              <div className="h-8 w-2/3 bg-white/10 rounded-lg" />
              <div className="h-40 bg-white/5 rounded-2xl" />
              <div className="h-10 bg-white/10 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="p-12 text-center rounded-3xl bg-rose-500/10 border border-rose-500/20 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
            <TicketIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Error Retrieving Passes</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchTickets}>
            Try Again
          </Button>
        </div>
      )}

      {/* Tickets Grid */}
      {!isLoading && !error && filteredTickets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTickets.map((ticket) => (
            <DigitalTicketCard key={ticket.id} ticket={ticket} onRefresh={fetchTickets} />
          ))}
        </div>
      )}

      {/* Empty State - No Passes in current tab */}
      {!isLoading && !error && filteredTickets.length === 0 && (
        <div className="p-12 text-center rounded-3xl bg-[#171723]/60 border border-dashed border-white/10 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto text-purple-400">
            <TicketIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">
              {tickets.length > 0 ? 'No passes in this category' : 'No passes booked yet'}
            </h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              {tickets.length > 0
                ? 'Try selecting another tab to view your active or checked-in tickets.'
                : 'You have not booked any admission passes yet. Explore upcoming summits, hackathons, and festivals to secure your verified QR ticket.'}
            </p>
          </div>
          {tickets.length > 0 ? (
            <Button variant="secondary" size="md" onClick={() => setActiveTab('ALL')}>
              Show All Passes
            </Button>
          ) : (
            <Link to="/events">
              <Button variant="gradient" size="md">
                Find Upcoming Events
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};
