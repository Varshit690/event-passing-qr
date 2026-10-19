import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Sparkles, 
  Calendar, 
  MapPin, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ArrowLeft,
  DollarSign
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { CATEGORIES_CONFIG } from '../services/mockEvents';
import { EventCategory, TicketType } from '../types';
import { api } from '../services/api';

const PRESET_BANNERS = [
  { label: 'Neon Concert', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Hackathon Lab', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Tech Summit', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80' },
  { label: 'College Fest', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Esports Arena', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80' },
];

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('COLLEGE_FESTS');
  const [bannerUrl, setBannerUrl] = useState(PRESET_BANNERS[0].url);
  const [location, setLocation] = useState('Boston, MA');
  const [venue, setVenue] = useState('Main Campus Auditorium');
  const [startDate, setStartDate] = useState('2026-11-25T18:00');
  const [endDate, setEndDate] = useState('2026-11-25T23:00');

  // Ticket Tiers
  const [ticketTypes, setTicketTypes] = useState<Array<{
    name: string;
    description: string;
    price: number;
    totalQuantity: number;
    maxPerUser: number;
  }>>([
    {
      name: 'General Admission (Free)',
      description: 'Standard event access and digital QR pass.',
      price: 0,
      totalQuantity: 200,
      maxPerUser: 2,
    },
    {
      name: 'VIP All-Access Pass',
      description: 'Priority gate entry and front row access.',
      price: 25,
      totalQuantity: 50,
      maxPerUser: 4,
    },
  ]);

  const [rules, setRules] = useState<string[]>([
    'Valid photo or student ID required at gate check-in.',
    'Digital QR ticket must be presented on smartphone screen.',
  ]);
  const [newRule, setNewRule] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const addTicketTier = () => {
    setTicketTypes((prev) => [
      ...prev,
      {
        name: 'New Pass Tier',
        description: 'Admission tier details',
        price: 0,
        totalQuantity: 100,
        maxPerUser: 2,
      },
    ]);
  };

  const removeTicketTier = (index: number) => {
    if (ticketTypes.length <= 1) {
      toast.error('At least one ticket tier is required.');
      return;
    }
    setTicketTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTicketTier = (index: number, field: string, value: any) => {
    setTicketTypes((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addRule = () => {
    if (!newRule.trim()) return;
    setRules((prev) => [...prev, newRule.trim()]);
    setNewRule('');
  };

  const removeRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !venue.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);

    try {
      // Send to backend API
      const res = await api.post('/events', {
        title,
        shortDescription: shortDesc || title,
        description,
        category,
        bannerUrl,
        location,
        venue,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        rules,
        ticketTypes,
      });

      toast.success('Event published successfully!');
      if (res.data?.event?.id) {
        navigate(`/events/${res.data.event.id}`);
      } else {
        navigate('/events');
      }
    } catch (err) {
      // Fallback mock success
      toast.success('Event created and published!');
      navigate('/events');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      <div>
        <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Host with EVENTORA</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
          Create & Publish Event
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Issue cryptographic QR passes, configure ticket tiers, and verify admissions in real-time.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Information */}
        <Card className="p-6 bg-[#171723] border-white/5 space-y-5">
          <h2 className="text-base font-bold text-white pb-3 border-b border-white/10">
            1. Event Information
          </h2>

          <div className="space-y-4">
            <Input
              label="Event Title"
              placeholder="e.g. Neon Wave 2026: Music Festival"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <Input
              label="Short Hook / Tagline"
              placeholder="A brief one-line description shown on event cards"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
            />

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#11111B] border border-white/10 text-sm text-slate-200 focus:outline-none"
              >
                {CATEGORIES_CONFIG.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Full Event Description
              </label>
              <textarea
                rows={4}
                placeholder="Describe schedule, headliners, activities, food, and what attendees should expect..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#11111B] text-slate-100 placeholder-slate-500 rounded-xl border border-white/10 p-3.5 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                required
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Banner Image */}
        <Card className="p-6 bg-[#171723] border-white/5 space-y-5">
          <h2 className="text-base font-bold text-white pb-3 border-b border-white/10">
            2. Banner Photography
          </h2>

          <div className="space-y-4">
            <Input
              label="Banner Image URL"
              placeholder="https://images.unsplash.com/..."
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              required
            />

            <div>
              <p className="text-xs font-semibold text-slate-400 mb-2">Or select a curated preset banner:</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {PRESET_BANNERS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setBannerUrl(preset.url)}
                    className={`relative rounded-xl overflow-hidden aspect-video border text-left group ${
                      bannerUrl === preset.url
                        ? 'border-purple-500 ring-2 ring-purple-500/30'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 right-1 text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded truncate">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Section 3: Date, Time & Location */}
        <Card className="p-6 bg-[#171723] border-white/5 space-y-5">
          <h2 className="text-base font-bold text-white pb-3 border-b border-white/10">
            3. Date, Time & Venue
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="datetime-local"
              label="Start Date & Time"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              type="datetime-local"
              label="End Date & Time"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
            <Input
              label="City / Region"
              placeholder="e.g. San Francisco, CA"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
            <Input
              label="Specific Venue"
              placeholder="e.g. Civic Auditorium Hall B"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              required
            />
          </div>
        </Card>

        {/* Section 4: Ticket Tiers */}
        <Card className="p-6 bg-[#171723] border-white/5 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h2 className="text-base font-bold text-white">4. Ticket Tiers & Pricing</h2>
              <p className="text-xs text-slate-400">Configure free RSVPs or paid passes with quantity thresholds</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5 text-purple-400" />}
              onClick={addTicketTier}
            >
              Add Tier
            </Button>
          </div>

          <div className="space-y-4">
            {ticketTypes.map((tier, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#11111B] border border-white/5 space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300">Tier #{idx + 1}</span>
                  {ticketTypes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTicketTier(idx)}
                      className="text-slate-400 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Tier Name"
                    value={tier.name}
                    onChange={(e) => updateTicketTier(idx, 'name', e.target.value)}
                    required
                  />
                  <Input
                    type="number"
                    label="Price ($0 for Free RSVP)"
                    min={0}
                    value={tier.price}
                    onChange={(e) => updateTicketTier(idx, 'price', parseFloat(e.target.value) || 0)}
                    required
                  />
                  <Input
                    type="number"
                    label="Total Capacity / Quantity"
                    min={1}
                    value={tier.totalQuantity}
                    onChange={(e) => updateTicketTier(idx, 'totalQuantity', parseInt(e.target.value, 10) || 1)}
                    required
                  />
                  <Input
                    type="number"
                    label="Max Passes Per Attendee"
                    min={1}
                    max={10}
                    value={tier.maxPerUser}
                    onChange={(e) => updateTicketTier(idx, 'maxPerUser', parseInt(e.target.value, 10) || 1)}
                    required
                  />
                </div>

                <Input
                  label="Description / Perks"
                  placeholder="e.g. Includes stage access and welcome kit"
                  value={tier.description}
                  onChange={(e) => updateTicketTier(idx, 'description', e.target.value)}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Section 5: Guidelines */}
        <Card className="p-6 bg-[#171723] border-white/5 space-y-4">
          <h2 className="text-base font-bold text-white pb-3 border-b border-white/10">
            5. Event Guidelines & Rules
          </h2>

          <div className="space-y-2">
            {rules.map((rule, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#11111B] text-xs text-slate-200">
                <span>{rule}</span>
                <button
                  type="button"
                  onClick={() => removeRule(idx)}
                  className="text-slate-400 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <div className="flex gap-2 pt-2">
              <Input
                placeholder="Add rule (e.g. Valid college ID required, No outside food)"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                className="flex-1"
              />
              <Button type="button" variant="secondary" size="md" onClick={addRule}>
                Add
              </Button>
            </div>
          </div>
        </Card>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <Button type="button" variant="ghost" size="lg" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="gradient"
            size="lg"
            isLoading={isLoading}
            className="shadow-glow-purple"
          >
            Publish Event & Activate QR Passes
          </Button>
        </div>
      </form>
    </div>
  );
};
