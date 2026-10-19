import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Share2, 
  ShieldCheck, 
  Users, 
  Sparkles, 
  Check, 
  AlertCircle, 
  ArrowLeft,
  Minus,
  Plus,
  Ticket as TicketIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { MOCK_EVENTS } from '../services/mockEvents';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { EventCard } from '../components/events/EventCard';
import { TicketType } from '../types';
import { api } from '../services/api';

interface BookingSelection {
  [ticketTypeId: string]: number;
}

interface EventDetailsPageProps {
  onOpenBookingModal?: (eventId: string, selections: BookingSelection) => void;
}

export const EventDetailsPage: React.FC<EventDetailsPageProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState(() => {
    return MOCK_EVENTS.find((e) => e.id === id) || MOCK_EVENTS[0];
  });

  useEffect(() => {
    if (id) {
      api.get(`/events/${id}`)
        .then((res) => {
          if (res.data?.success && res.data.event) {
            setEvent(res.data.event);
          }
        })
        .catch(() => {
          // Fallback to local mock
          const fallback = MOCK_EVENTS.find((e) => e.id === id);
          if (fallback) setEvent(fallback);
        });
    }
  }, [id]);

  const relatedEvents = MOCK_EVENTS.filter((e) => e.id !== event.id && e.category === event.category).slice(0, 3);

  // Ticket quantities state
  const [quantities, setQuantities] = useState<BookingSelection>(() => {
    const initial: BookingSelection = {};
    if (event.ticketTypes && event.ticketTypes.length > 0) {
      initial[event.ticketTypes[0].id] = 1; // default 1 of first tier
    }
    return initial;
  });

  const formattedStartDate = new Date(event.startDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedStartTime = new Date(event.startDate).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const formattedEndTime = new Date(event.endDate).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const updateQuantity = (ticketTypeId: string, delta: number, max: number) => {
    setQuantities((prev) => {
      const current = prev[ticketTypeId] || 0;
      const next = Math.max(0, Math.min(max, current + delta));
      return { ...prev, [ticketTypeId]: next };
    });
  };

  const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0);
  
  const totalPrice = event.ticketTypes.reduce((sum, tt) => {
    const qty = quantities[tt.id] || 0;
    return sum + qty * tt.price;
  }, 0);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Event link copied to clipboard!');
    } else {
      toast.info('Share URL: ' + window.location.href);
    }
  };

  const handleProceedToBooking = () => {
    if (totalTickets <= 0) {
      toast.error('Please select at least 1 ticket to proceed.');
      return;
    }
    // Navigate to checkout or booking modal
    navigate(`/checkout/${event.id}?items=${encodeURIComponent(JSON.stringify(quantities))}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to events</span>
      </button>

      {/* Hero Banner Section */}
      <div className="relative rounded-3xl overflow-hidden aspect-[21/9] min-h-[300px] sm:min-h-[420px] bg-slate-900 shadow-2xl border border-white/10">
        <img
          src={event.bannerUrl}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090F] via-black/40 to-transparent" />

        {/* Floating Badges */}
        <div className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center gap-2">
          <Badge variant="primary" size="md" className="bg-[#09090F]/80 backdrop-blur-md">
            {event.category.replace('_', ' ')}
          </Badge>
          {event.isFeatured && (
            <Badge variant="secondary" size="md" className="bg-[#09090F]/80 backdrop-blur-md">
              Featured Experience
            </Badge>
          )}
        </div>

        {/* Share Button */}
        <div className="absolute top-4 sm:top-6 right-4 sm:right-6">
          <button
            onClick={handleShare}
            className="p-2.5 rounded-full bg-[#09090F]/80 hover:bg-[#09090F] border border-white/20 text-slate-200 hover:text-white backdrop-blur-md transition-all"
            title="Share event"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Event Title Banner Overlay */}
        <div className="absolute bottom-6 sm:bottom-8 left-4 sm:left-8 right-4 sm:right-8 space-y-2">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {event.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl line-clamp-2">
            {event.shortDescription || event.description}
          </p>
        </div>
      </div>

      {/* Main Content & Sticky Booking Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Event Details & Schedule */}
        <div className="lg:col-span-2 space-y-10">
          {/* Key Info Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-[#171723] border border-white/5">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Date & Time</p>
                <p className="text-sm font-bold text-white mt-0.5">{formattedStartDate}</p>
                <p className="text-xs text-purple-400">{formattedStartTime} - {formattedEndTime}</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Venue Location</p>
                <p className="text-sm font-bold text-white mt-0.5">{event.venue}</p>
                <p className="text-xs text-slate-400">{event.location}</p>
              </div>
            </div>
          </div>

          {/* Organizer Card */}
          <div className="flex items-center justify-between p-5 rounded-2xl bg-[#171723] border border-white/5">
            <div className="flex items-center gap-3.5">
              {event.organizerAvatar ? (
                <img
                  src={event.organizerAvatar}
                  alt={event.organizerName}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-purple-500/30"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-purple-900/50 flex items-center justify-center font-bold text-lg text-purple-300">
                  {event.organizerName[0]}
                </div>
              )}
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Organized By</p>
                <p className="text-base font-bold text-white">{event.organizerName}</p>
              </div>
            </div>
            <Badge variant="success" size="sm">
              Verified Host
            </Badge>
          </div>

          {/* Description Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight">About this Experience</h2>
            <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-3">
              <p>{event.description}</p>
            </div>
          </div>

          {/* Available Ticket Tiers (Cards on Mobile / Details) */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight">Select Passes</h2>
            <div className="space-y-3">
              {event.ticketTypes.map((tt) => {
                const qty = quantities[tt.id] || 0;
                return (
                  <div
                    key={tt.id}
                    className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      qty > 0
                        ? 'bg-[#1a1a2b] border-purple-500/40 shadow-glow-purple/10'
                        : 'bg-[#171723] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-base">{tt.name}</h3>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                          {tt.price === 0 ? 'FREE' : `$${tt.price}`}
                        </span>
                      </div>
                      {tt.description && (
                        <p className="text-xs text-slate-400 max-w-md">{tt.description}</p>
                      )}
                      <p className="text-[11px] text-cyan-400 font-medium">
                        {tt.remainingQuantity} passes remaining (Max {tt.maxPerUser} per attendee)
                      </p>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <button
                        onClick={() => updateQuantity(tt.id, -1, tt.maxPerUser)}
                        disabled={qty <= 0}
                        className="w-8 h-8 rounded-lg bg-[#11111B] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-bold text-sm text-white">
                        {qty}
                      </span>
                      <button
                        onClick={() => updateQuantity(tt.id, 1, tt.maxPerUser)}
                        disabled={qty >= tt.maxPerUser || qty >= tt.remainingQuantity}
                        className="w-8 h-8 rounded-lg bg-[#11111B] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Event Rules & Security */}
          {event.rules && event.rules.length > 0 && (
            <div className="space-y-4 p-5 rounded-2xl bg-[#171723] border border-white/5">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <span>Event Guidelines & Entry Protocols</span>
              </h2>
              <ul className="space-y-2 text-xs text-slate-300">
                {event.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Booking Widget (Desktop) */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 p-6 rounded-3xl bg-[#171723] border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Order Summary</span>
              <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1">
                <TicketIcon className="w-3.5 h-3.5" />
                <span>Instant QR Pass</span>
              </span>
            </div>

            {/* Selected Tickets Breakdown */}
            <div className="space-y-3">
              {event.ticketTypes.map((tt) => {
                const qty = quantities[tt.id] || 0;
                if (qty === 0) return null;
                return (
                  <div key={tt.id} className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-white">{tt.name}</p>
                      <p className="text-slate-400">{qty} x {tt.price === 0 ? 'Free' : `$${tt.price}`}</p>
                    </div>
                    <span className="font-bold text-white">
                      {tt.price === 0 ? 'FREE' : `$${qty * tt.price}`}
                    </span>
                  </div>
                );
              })}

              {totalTickets === 0 && (
                <p className="text-xs text-slate-500 italic py-2">
                  Select ticket quantity on the left to see your booking summary.
                </p>
              )}
            </div>

            {/* Price Total */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Total Passes</p>
                <p className="text-sm font-semibold text-white">{totalTickets} Pass{totalTickets === 1 ? '' : 'es'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Grand Total</p>
                <p className="text-2xl font-extrabold text-white">
                  {totalPrice === 0 ? 'FREE' : `$${totalPrice}`}
                </p>
              </div>
            </div>

            {/* Reserve Pass Button */}
            <Button
              variant="gradient"
              size="lg"
              className="w-full shadow-glow-purple"
              disabled={totalTickets === 0}
              onClick={handleProceedToBooking}
            >
              {totalPrice === 0 ? 'Claim Free QR Pass' : 'Reserve & Pay'}
            </Button>

            <div className="space-y-1.5 text-center text-[11px] text-slate-400">
              <p className="flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Official QR pass generated immediately</span>
              </p>
              <p>Non-transferable • Atomic check-in verified</p>
            </div>
          </div>
        </div>
      </div>

      {/* Related Events Section */}
      {relatedEvents.length > 0 && (
        <div className="space-y-6 pt-10 border-t border-white/5">
          <h2 className="text-2xl font-extrabold text-white">Similar Events You Might Like</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedEvents.map((re) => (
              <EventCard key={re.id} event={re} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
