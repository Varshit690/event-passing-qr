import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  Ticket as TicketIcon, 
  Calendar, 
  MapPin, 
  Sparkles, 
  Download,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { MOCK_EVENTS } from '../services/mockEvents';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { DigitalTicketCard } from '../components/tickets/DigitalTicketCard';
import { Ticket } from '../types';
import { api } from '../services/api';

export const CheckoutPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(() => {
    return MOCK_EVENTS.find((e) => e.id === eventId) || MOCK_EVENTS[0];
  });
  const [isEventLoading, setIsEventLoading] = useState(true);

  // Parse items from URL query
  const itemsParam = searchParams.get('items');
  const initialQuantities: Record<string, number> = itemsParam ? JSON.parse(decodeURIComponent(itemsParam)) : {};

  // Form states
  const [attendeeNames, setAttendeeNames] = useState<Record<string, string>>(() => {
    return {
      '0': user?.name || '',
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmedTickets, setConfirmedTickets] = useState<Ticket[]>([]);

  // Fetch real event details from backend
  useEffect(() => {
    if (eventId) {
      setIsEventLoading(true);
      api.get(`/events/${eventId}`)
        .then((res) => {
          if (res.data?.success && res.data.event) {
            setEvent(res.data.event);
          }
        })
        .catch((err) => {
          console.error('Failed to load event details:', err);
        })
        .finally(() => {
          setIsEventLoading(false);
        });
    }
  }, [eventId]);

  // Calculate totals
  const selectedTiers = event.ticketTypes.filter((tt) => (initialQuantities[tt.id] || 0) > 0);
  const totalTickets = Object.values(initialQuantities).reduce((a, b) => a + b, 0);
  const grandTotal = selectedTiers.reduce((sum, tt) => sum + (initialQuantities[tt.id] || 0) * tt.price, 0);

  const handleNameChange = (index: number, name: string) => {
    setAttendeeNames((prev) => ({ ...prev, [index]: name }));
  };

  const handleConfirmBooking = async () => {
    setIsLoading(true);

    try {
      // Map booking items: either match tier by ID or if tier has fallback
      let bookingItems = selectedTiers.map((tt) => ({
        ticketTypeId: tt.id,
        quantity: initialQuantities[tt.id] || 0,
      })).filter((item) => item.quantity > 0);

      // If selectedTiers was empty because tier ID from URL didn't match event.ticketTypes, fallback to first tier
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
        const ticketsFromDb: Ticket[] = res.data.booking.tickets.map((t: any, idx: number) => ({
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

        // Invalidate / clear cached tickets in localStorage so live fetch pulls new passes
        localStorage.removeItem('eventora-tickets');

        // Celebration Confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8B5CF6', '#06B6D4', '#10B981', '#EC4899'],
        });

        toast.success('Passes reserved successfully! Digital QR tickets issued.');
      } else {
        throw new Error(res.data?.message || 'Booking could not be confirmed.');
      }
    } catch (err: any) {
      console.error('Booking confirmation error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to complete booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  if (isConfirmed) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 animate-fade-in">
        {/* Success Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-4 ring-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Booking Confirmed!
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Your admission passes have been secured and cryptographic QR tickets generated.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link to="/tickets">
              <Button variant="gradient" size="md">
                View in My Tickets
              </Button>
            </Link>
            <Link to="/events">
              <Button variant="outline" size="md">
                Explore More Events
              </Button>
            </Link>
          </div>
        </div>

        {/* Issued Digital Passes Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white text-center">Your QR Passes</h2>
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to event details</span>
      </button>

      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Checkout & Attendee Details
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Review your pass selection and confirm attendee names for gate identification.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Attendee Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Snippet Card */}
          <div className="p-4 rounded-2xl bg-[#171723] border border-white/5 flex items-center gap-4">
            <img
              src={event.bannerUrl}
              alt={event.title}
              className="w-20 h-20 rounded-xl object-cover shrink-0"
            />
            <div className="space-y-1">
              <h3 className="font-bold text-white text-sm line-clamp-1">{event.title}</h3>
              <p className="text-xs text-purple-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {new Date(event.startDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </p>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5" />
                <span>{event.venue}, {event.location}</span>
              </p>
            </div>
          </div>

          {/* Attendee Names for each ticket */}
          <div className="p-6 rounded-2xl bg-[#171723] border border-white/5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-sm font-bold text-white">Attendee Information</h2>
              <span className="text-xs text-slate-400">{totalTickets} Ticket{totalTickets === 1 ? '' : 's'}</span>
            </div>

            <div className="space-y-3">
              {Array.from({ length: totalTickets }).map((_, idx) => (
                <div key={idx} className="space-y-1.5">
                  <Input
                    label={`Attendee ${idx + 1} Name`}
                    placeholder="Enter pass holder full name"
                    value={attendeeNames[idx] ?? (idx === 0 ? user?.name || '' : '')}
                    onChange={(e) => handleNameChange(idx, e.target.value)}
                    helperText="Name printed on digital QR pass for gate identity matching"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Verification Protocol Notice */}
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Cryptographic Pass Issuance</p>
              <p className="text-slate-300 mt-0.5 leading-relaxed">
                Tickets are digitally minted with unique cryptographic tokens. Double-scanning or sharing screenshots will trigger an entry alert at the organizer checkpoint.
              </p>
            </div>
          </div>
        </div>

        {/* Right Col: Order Summary & Confirmation */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#171723] border border-white/10 space-y-5 shadow-xl">
            <h2 className="text-sm font-bold text-white pb-3 border-b border-white/10">
              Order Summary
            </h2>

            <div className="space-y-3 text-xs">
              {selectedTiers.map((tt) => {
                const qty = initialQuantities[tt.id] || 0;
                return (
                  <div key={tt.id} className="flex justify-between items-center">
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
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400">Total Due</p>
                <p className="text-2xl font-extrabold text-white">
                  {grandTotal === 0 ? 'FREE' : `$${grandTotal}`}
                </p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                Guaranteed Pass
              </span>
            </div>

            <Button
              variant="gradient"
              size="lg"
              className="w-full shadow-glow-purple"
              isLoading={isLoading}
              onClick={handleConfirmBooking}
            >
              {grandTotal === 0 ? 'Confirm & Mint QR Passes' : `Pay $${grandTotal} & Issue Passes`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
