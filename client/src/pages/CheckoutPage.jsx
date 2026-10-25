import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  Ticket as TicketIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { DigitalTicketCard } from '../components/tickets/DigitalTicketCard';
import { api } from '../services/api';

export const CheckoutPage = () => {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [isEventLoading, setIsEventLoading] = useState(true);
  const [eventError, setEventError] = useState(null);

  // Parse items from URL query
  const itemsParam = searchParams.get('items');
  const initialQuantities = itemsParam ? JSON.parse(decodeURIComponent(itemsParam)) : {};

  // Form states
  const [attendeeNames, setAttendeeNames] = useState(() => {
    return {
      '0': user?.name || '',
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmedTickets, setConfirmedTickets] = useState([]);

  // Fetch real event details from backend
  useEffect(() => {
    if (eventId) {
      setIsEventLoading(true);
      setEventError(null);
      api.get(`/events/${eventId}`)
        .then((res) => {
          if (res.data?.success && res.data.event) {
            setEvent(res.data.event);
          } else {
            setEventError('Event not found.');
          }
        })
        .catch((err) => {
          console.error('Failed to load event details:', err);
          setEventError(err?.response?.data?.message || 'Event not found or has been removed.');
        })
        .finally(() => {
          setIsEventLoading(false);
        });
    }
  }, [eventId]);

  // Calculate totals
  const selectedTiers = (event?.ticketTypes || []).filter((tt) => (initialQuantities[tt.id] || 0) > 0);
  const totalTickets = Object.values(initialQuantities).reduce((a, b) => a + b, 0);
  const grandTotal = selectedTiers.reduce((sum, tt) => sum + (initialQuantities[tt.id] || 0) * tt.price, 0);

  const handleNameChange = (index, name) => {
    setAttendeeNames((prev) => ({ ...prev, [index]: name }));
  };

  const handleConfirmBooking = async () => {
    setIsLoading(true);

    try {
      let bookingItems = selectedTiers.map((tt) => ({
        ticketTypeId: tt.id,
        quantity: initialQuantities[tt.id] || 0,
      })).filter((item) => item.quantity > 0);

      if (bookingItems.length === 0 && event.ticketTypes?.length > 0) {
        const firstTier = event.ticketTypes[0];
        const firstQty = Object.values(initialQuantities)[0] || 1;
        bookingItems = [{ ticketTypeId: firstTier.id, quantity: firstQty }];
      }

      if (bookingItems.length === 0) {
        toast.error('Please select at least one ticket to proceed.');
        setIsLoading(false);
        return;
      }

      const res = await api.post('/bookings', {
        eventId: event.id,
        items: bookingItems,
        idempotencyKey: `idemp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        paymentConfirmed: grandTotal > 0,
      });

      if (res.data?.success && res.data.booking?.tickets?.length > 0) {
        const ticketsFromDb = res.data.booking.tickets.map((t, idx) => ({
          ...t,
          attendeeName: attendeeNames[idx] || t.attendeeName || user?.name || 'Attendee',
          eventTitle: event.title,
          eventDate: new Date(event.startDate).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }),
          venue: `${event.venue}, ${event.location}`,
          ticketTypeName: t.ticketTypeName || t.ticketType?.name || selectedTiers[0]?.name || 'General Admission',
          price: t.price ?? t.ticketType?.price ?? 0,
        }));

        setConfirmedTickets(ticketsFromDb);
        setIsConfirmed(true);

        localStorage.removeItem('eventora-tickets');

        // Celebration Confetti with blue & green palette
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#2563EB', '#16A34A', '#0F172A', '#60A5FA'],
        });

        toast.success('Booking confirmed! Your QR tickets are ready.');
      } else {
        throw new Error(res.data?.message || 'Booking could not be confirmed.');
      }
    } catch (err) {
      console.error('Booking confirmation error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to complete booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEventLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-500">Loading checkout details...</p>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <TicketIcon className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Event Not Found</h2>
        <p className="text-sm text-slate-500">
          {eventError || 'The event you are trying to book does not exist or has expired.'}
        </p>
        <Button variant="primary" size="md" onClick={() => navigate('/events')}>
          Browse All Events
        </Button>
      </div>
    );
  }

  if (isConfirmed) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 animate-fade-in">
        {/* Success Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Booking Confirmed!
          </h1>
          <p className="text-slate-600 text-sm max-w-md mx-auto">
            Your registration is confirmed. Your digital QR tickets have been generated below.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link to="/tickets">
              <Button variant="primary" size="md">
                View in My Tickets
              </Button>
            </Link>
            <Link to="/events">
              <Button variant="outline" size="md">
                Browse More Events
              </Button>
            </Link>
          </div>
        </div>

        {/* Issued Digital Passes Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 text-center">Your Event Passes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-center">
            {confirmedTickets.map((t) => (
              <DigitalTicketCard key={t.id} ticket={t} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to event details</span>
      </button>

      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Checkout & Attendee Information
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Review your ticket selection and enter attendee names for event check-in.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Attendee Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Snippet Card */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
            <img
              src={event.bannerUrl}
              alt={event.title}
              className="w-20 h-20 rounded-lg object-cover shrink-0 border border-slate-100"
            />
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{event.title}</h3>
              <p className="text-xs text-blue-600 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {new Date(event.startDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5" />
                <span>{event.venue}, {event.location}</span>
              </p>
            </div>
          </div>

          {/* Attendee Names for each ticket */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Attendee Details</h2>
              <span className="text-xs text-slate-500">{totalTickets} Ticket{totalTickets === 1 ? '' : 's'}</span>
            </div>

            <div className="space-y-3">
              {Array.from({ length: totalTickets }).map((_, idx) => (
                <div key={idx} className="space-y-1.5">
                  <Input
                    label={`Attendee ${idx + 1} Name`}
                    placeholder="Enter full name"
                    value={attendeeNames[idx] ?? (idx === 0 ? user?.name || '' : '')}
                    onChange={(e) => handleNameChange(idx, e.target.value)}
                    helperText="This name will appear on the digital pass."
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Verification Protocol Notice */}
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">Digital Pass Check-in</p>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                Each ticket includes a unique QR code. Present it on your phone or bring a printout for scanning at the venue gate.
              </p>
            </div>
          </div>
        </div>

        {/* Right Col: Order Summary & Confirmation */}
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
              Order Summary
            </h2>

            <div className="space-y-3 text-xs">
              {selectedTiers.map((tt) => {
                const qty = initialQuantities[tt.id] || 0;
                return (
                  <div key={tt.id} className="flex justify-between items-center">
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
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-500">Total Amount</p>
                <p className="text-2xl font-bold text-slate-900">
                  {grandTotal === 0 ? 'Free' : `$${grandTotal}`}
                </p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                Instant Pass
              </span>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              onClick={handleConfirmBooking}
            >
              {grandTotal === 0 ? 'Confirm Free Registration' : `Pay $${grandTotal} & Get Tickets`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
