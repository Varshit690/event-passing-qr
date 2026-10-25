import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Ticket as TicketIcon, 
  ArrowRight 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DigitalTicketCard } from '../components/tickets/DigitalTicketCard';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { api } from '../services/api';

export const TicketsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('ALL');
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTickets = () => {
    setIsLoading(true);
    setError(null);
    api.get('/tickets/me')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.tickets)) {
          const formatted = res.data.tickets.map((t) => ({
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              My Passes
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.name || 'Attendee'}
          </h1>
          <p className="text-sm text-slate-500 max-w-xl">
            View your event tickets below. Present the QR code on your phone or print a copy for check-in at the gate.
          </p>
        </div>

        <Link to="/events">
          <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Explore More Events
          </Button>
        </Link>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs
          tabs={[
            { id: 'ALL', label: 'All Passes', count: tickets.length },
            { id: 'VALID', label: 'Active Passes', count: validCount },
            { id: 'CHECKED_IN', label: 'Checked In', count: checkedInCount },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <p className="text-xs text-slate-500">
          Showing <span className="text-slate-900 font-bold">{filteredTickets.length}</span> pass{filteredTickets.length === 1 ? '' : 'es'}
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 rounded-xl bg-white border border-slate-200 animate-pulse p-6 space-y-4 shadow-sm">
              <div className="h-5 w-1/3 bg-slate-100 rounded" />
              <div className="h-7 w-2/3 bg-slate-100 rounded" />
              <div className="h-44 bg-slate-50 rounded-lg" />
              <div className="h-10 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="p-12 text-center rounded-xl bg-rose-50 border border-rose-200 space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <TicketIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Error Loading Tickets</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchTickets}>
            Try Again
          </Button>
        </div>
      )}

      {/* Tickets Grid */}
      {!isLoading && !error && filteredTickets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTickets.map((ticket) => (
            <DigitalTicketCard key={ticket.id} ticket={ticket} onRefresh={fetchTickets} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredTickets.length === 0 && (
        <div className="p-12 text-center rounded-xl bg-white border border-dashed border-slate-300 space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <TicketIcon className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              {tickets.length > 0 ? 'No passes in this category' : 'No tickets yet'}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {tickets.length > 0
                ? 'Try switching tabs to view your active or used tickets.'
                : 'You have not booked any event passes yet. Browse upcoming campus and community events to reserve your pass.'}
            </p>
          </div>
          {tickets.length > 0 ? (
            <Button variant="secondary" size="md" onClick={() => setActiveTab('ALL')}>
              Show All Passes
            </Button>
          ) : (
            <Link to="/events">
              <Button variant="primary" size="md">
                Browse Events
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};
