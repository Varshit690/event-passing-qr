import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Share2, 
  ShieldCheck, 
  Check, 
  ArrowLeft,
  Minus,
  Plus,
  Ticket as TicketIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EventCard } from '../components/events/EventCard';
import { api } from '../services/api';

export const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [relatedEvents, setRelatedEvents] = useState([]);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    api.get(`/events/${id}`)
      .then((res) => {
        if (res.data?.success && res.data.event) {
          const loadedEvent = res.data.event;
          setEvent(loadedEvent);

          // Initialize ticket quantities with the first tier from the real database event
          if (loadedEvent.ticketTypes && loadedEvent.ticketTypes.length > 0) {
            setQuantities({ [loadedEvent.ticketTypes[0].id]: 1 });
          } else {
            setQuantities({});
          }

          // Fetch related events from live API
          api.get(`/events?category=${loadedEvent.category}&limit=4`)
            .then((catRes) => {
              if (catRes.data?.success && Array.isArray(catRes.data.events)) {
                setRelatedEvents(catRes.data.events.filter((e) => e.id !== loadedEvent.id).slice(0, 3));
              }
            })
            .catch(() => {});
        } else {
          setError('Event not found.');
        }
      })
      .catch((err) => {
        console.error('Failed to load event details:', err);
        setError(err.response?.data?.message || 'Event not found or has been removed.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-500">Loading event details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <TicketIcon className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Event Not Found</h2>
        <p className="text-sm text-slate-500">
          {error || 'The event you are looking for does not exist or has been removed.'}
        </p>
        <Button variant="primary" size="md" onClick={() => navigate('/events')}>
          Browse All Events
        </Button>
      </div>
    );
  }

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

  const updateQuantity = (ticketTypeId, delta, max) => {
    setQuantities((prev) => {
      const current = prev[ticketTypeId] || 0;
      const next = Math.max(0, Math.min(max, current + delta));
      return { ...prev, [ticketTypeId]: next };
    });
  };

  const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0);
  
  const totalPrice = (event.ticketTypes || []).reduce((sum, tt) => {
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
    navigate(`/checkout/${event.id}?items=${encodeURIComponent(JSON.stringify(quantities))}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to events</span>
      </button>

      {/* Hero Banner Section */}
      <div className="relative rounded-2xl overflow-hidden aspect-[21/9] min-h-[260px] sm:min-h-[360px] bg-slate-100 shadow-sm border border-slate-200">
        <img
          src={event.bannerUrl}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

        {/* Floating Badges */}
        <div className="absolute top-4 sm:top-5 left-4 sm:left-5 flex items-center gap-2">
          <Badge variant="secondary" size="md" className="bg-white/95 backdrop-blur-sm text-slate-900 shadow-sm border border-slate-200 font-semibold">
            {event.category ? event.category.replace('_', ' ') : ''}
          </Badge>
          {event.isFeatured && (
            <Badge variant="primary" size="md" className="shadow-sm font-semibold">
              Featured
            </Badge>
          )}
        </div>

        {/* Share Button */}
        <div className="absolute top-4 sm:top-5 right-4 sm:right-5">
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-sm transition-all"
            title="Share event"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Event Title Banner Overlay */}
        <div className="absolute bottom-5 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 space-y-1.5 text-white">
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight leading-tight">
            {event.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl line-clamp-2">
            {event.shortDescription || event.description}
          </p>
        </div>
      </div>

      {/* Main Content & Sticky Booking Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Event Details & Schedule */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Info Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Time</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{formattedStartDate}</p>
                <p className="text-xs text-blue-600 font-medium">{formattedStartTime} - {formattedEndTime}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Venue Location</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{event.venue}</p>
                <p className="text-xs text-slate-500">{event.location}</p>
              </div>
            </div>
          </div>

          {/* Organizer Card */}
          <div className="flex items-center justify-between p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              {event.organizerAvatar ? (
                <img
                  src={event.organizerAvatar}
                  alt={event.organizerName}
                  className="w-11 h-11 rounded-full object-cover ring-1 ring-slate-200"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base">
                  {event.organizerName ? event.organizerName[0] : 'O'}
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Organized By</p>
                <p className="text-sm font-bold text-slate-900">{event.organizerName}</p>
              </div>
            </div>
            <Badge variant="success" size="sm">
              Verified Host
            </Badge>
          </div>

          {/* Description Section */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900">About this Event</h2>
            <div className="text-slate-600 text-sm leading-relaxed space-y-2 whitespace-pre-line">
              <p>{event.description}</p>
            </div>
          </div>

          {/* Available Ticket Tiers */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">Select Tickets</h2>
            <div className="space-y-3">
              {(event.ticketTypes || []).map((tt) => {
                const qty = quantities[tt.id] || 0;
                return (
                  <div
                    key={tt.id}
                    className={`p-4 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      qty > 0
                        ? 'bg-blue-50/50 border-blue-200'
                        : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">{tt.name}</h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {tt.price === 0 ? 'FREE' : `$${tt.price}`}
                        </span>
                      </div>
                      {tt.description && (
                        <p className="text-xs text-slate-500 max-w-md">{tt.description}</p>
                      )}
                      <p className="text-[11px] text-slate-500">
                        {tt.remainingQuantity} tickets left (Max {tt.maxPerUser} per attendee)
                      </p>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2.5 self-end sm:self-center">
                      <button
                        onClick={() => updateQuantity(tt.id, -1, tt.maxPerUser)}
                        disabled={qty <= 0}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-bold text-sm text-slate-900">
                        {qty}
                      </span>
                      <button
                        onClick={() => updateQuantity(tt.id, 1, tt.maxPerUser)}
                        disabled={qty >= tt.maxPerUser || qty >= tt.remainingQuantity}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
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
            <div className="space-y-3 p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Event Guidelines & Rules</span>
              </h2>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {event.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Booking Widget (Desktop) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-5 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Order Summary</span>
              <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                <TicketIcon className="w-3.5 h-3.5" />
                <span>Instant QR Pass</span>
              </span>
            </div>

            {/* Selected Tickets Breakdown */}
            <div className="space-y-2.5">
              {(event.ticketTypes || []).map((tt) => {
                const qty = quantities[tt.id] || 0;
                if (qty === 0) return null;
                return (
                  <div key={tt.id} className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">{tt.name}</p>
                      <p className="text-slate-500">{qty} x {tt.price === 0 ? 'Free' : `$${tt.price}`}</p>
                    </div>
                    <span className="font-bold text-slate-900">
                      {tt.price === 0 ? 'FREE' : `$${qty * tt.price}`}
                    </span>
                  </div>
                );
              })}

              {totalTickets === 0 && (
                <p className="text-xs text-slate-400 italic py-1">
                  Select ticket quantity on the left to see your booking summary.
                </p>
              )}
            </div>

            {/* Price Total */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Total Tickets</p>
                <p className="text-sm font-semibold text-slate-900">{totalTickets} Ticket{totalTickets === 1 ? '' : 's'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Total Price</p>
                <p className="text-2xl font-bold text-slate-900">
                  {totalPrice === 0 ? 'FREE' : `$${totalPrice}`}
                </p>
              </div>
            </div>

            {/* Reserve Pass Button */}
            <Button
              variant="primary"
              size="md"
              className="w-full"
              disabled={totalTickets === 0}
              onClick={handleProceedToBooking}
            >
              {totalPrice === 0 ? 'Claim Free Tickets' : 'Proceed to Checkout'}
            </Button>

            <div className="space-y-1 text-center text-[11px] text-slate-500">
              <p className="flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified QR ticket issued instantly</span>
              </p>
              <p>Entry pass stored directly on your dashboard</p>
            </div>
          </div>
        </div>
      </div>

      {/* Related Events Section */}
      {relatedEvents.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Similar Events</h2>
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
