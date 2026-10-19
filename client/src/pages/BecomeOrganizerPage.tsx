import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Building2, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowRight, 
  Send, 
  RefreshCw,
  Globe,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  ShieldCheck,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const BecomeOrganizerPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [application, setApplication] = useState<any>(null);
  const [showReapplyForm, setShowReapplyForm] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    organizationName: '',
    collegeOrOrg: '',
    contactPhone: '',
    contactEmail: user?.email || '',
    category: 'TECHNOLOGY',
    reason: '',
    website: '',
  });

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/organizer/application/status');
      if (res.data?.application) {
        setApplication(res.data.application);
      }
      if (res.data?.userRole === 'ORGANIZER') {
        await refreshUser();
      }
    } catch (err: any) {
      console.error('Error fetching application status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.organizationName.trim() || !formData.collegeOrOrg.trim()) {
      toast.error('Please specify your Organization and College / Institution name.');
      return;
    }
    if (!formData.contactPhone.trim() || !formData.contactEmail.trim()) {
      toast.error('Please provide valid contact phone number and email.');
      return;
    }
    if (formData.reason.trim().length < 10) {
      toast.error('Please share a brief rationale (minimum 10 characters) explaining your planned events.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/organizer/apply', formData);
      if (res.data?.success) {
        toast.success('Organizer application submitted successfully!');
        setApplication(res.data.application);
        setShowReapplyForm(false);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to submit organizer application.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Already Approved State
  if (user?.role === 'ORGANIZER' || user?.role === 'ADMIN') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Card className="p-8 sm:p-12 bg-[#171723]/90 border-purple-500/20 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <Badge variant="success" size="md">
              {user.role === 'ADMIN' ? 'Platform Administrator' : 'Verified Event Host'}
            </Badge>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              You Have Active Host Permissions
            </h1>
            <p className="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
              Your account is fully authorized to publish events, manage ticketing tiers, and operate live gate QR verification.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/organizer">
              <Button variant="gradient" size="md" leftIcon={<LayoutDashboard className="w-4 h-4" />}>
                Go to Organizer Hub
              </Button>
            </Link>
            <Link to="/create-event">
              <Button variant="outline" size="md" leftIcon={<Calendar className="w-4 h-4" />}>
                Publish New Event
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>EVENTORA Host Network</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
          Become an <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400">Event Organizer</span>
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          Unlock the ability to publish college festivals, technical hackathons, and music summits with instant QR pass minting and gate check-in scanners.
        </p>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <Card className="p-8 bg-[#171723]/60 border-white/5 space-y-4 animate-pulse">
          <div className="h-6 w-1/3 bg-white/10 rounded" />
          <div className="h-4 w-2/3 bg-white/5 rounded" />
          <div className="h-24 bg-white/5 rounded-xl" />
        </Card>
      )}

      {/* Pending Application State */}
      {!isLoading && application && application.status === 'PENDING' && (
        <Card className="p-8 sm:p-10 bg-[#171723]/90 border-amber-500/30 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Clock className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">Application Under Review</h2>
                  <Badge variant="warning" size="sm">PENDING APPROVAL</Badge>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Submitted on {new Date(application.createdAt).toLocaleDateString()} at {new Date(application.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStatus}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh Status
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#11111B] border border-white/5 space-y-1">
              <span className="text-slate-400 font-medium">Organization / Brand:</span>
              <p className="text-sm font-bold text-white">{application.organizationName}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#11111B] border border-white/5 space-y-1">
              <span className="text-slate-400 font-medium">Institution / College:</span>
              <p className="text-sm font-bold text-white">{application.collegeOrOrg}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#11111B] border border-white/5 space-y-1">
              <span className="text-slate-400 font-medium">Event Category:</span>
              <p className="text-sm font-bold text-purple-300">{application.category}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#11111B] border border-white/5 space-y-1">
              <span className="text-slate-400 font-medium">Contact Phone:</span>
              <p className="text-sm font-bold text-white">{application.contactPhone}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#11111B] border border-white/5 space-y-1 text-xs">
            <span className="text-slate-400 font-medium">Application Purpose:</span>
            <p className="text-slate-300 leading-relaxed italic">"{application.reason}"</p>
          </div>

          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Your application has been received. Platform administrators review pending host credentials to preserve high event quality and gate security. You will receive host access immediately upon approval.
            </p>
          </div>
        </Card>
      )}

      {/* Rejected Application State */}
      {!isLoading && application && application.status === 'REJECTED' && !showReapplyForm && (
        <Card className="p-8 sm:p-10 bg-[#171723]/90 border-rose-500/30 shadow-2xl space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-white/10">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <XCircle className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">Application Not Approved</h2>
                <Badge variant="danger" size="sm">DECLINED</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Reviewed on {application.reviewedAt ? new Date(application.reviewedAt).toLocaleDateString() : 'recently'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1 text-xs">
            <span className="text-rose-400 font-bold uppercase tracking-wider text-[10px]">Reviewer Note:</span>
            <p className="text-rose-200 leading-relaxed">
              {application.rejectionReason || 'Your application did not satisfy the initial verification criteria.'}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="gradient" size="md" onClick={() => setShowReapplyForm(true)}>
              Submit Updated Application
            </Button>
          </div>
        </Card>
      )}

      {/* Application Form */}
      {!isLoading && (!application || application.status === 'REJECTED' && showReapplyForm) && (
        <Card className="p-6 sm:p-10 bg-[#171723]/90 border-white/10 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1 pb-4 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Organizer Details</h2>
              <p className="text-xs text-slate-400">
                Please provide accurate details about your student club, college department, or event organization.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Organization / Brand Name *"
                placeholder="e.g. ACM Student Chapter or Neon Festivals"
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                leftIcon={<Building2 className="w-4 h-4 text-purple-400" />}
                required
              />

              <Input
                label="Institution or College *"
                placeholder="e.g. Stanford University / Tech Club"
                value={formData.collegeOrOrg}
                onChange={(e) => setFormData({ ...formData, collegeOrOrg: e.target.value })}
                leftIcon={<GraduationCap className="w-4 h-4 text-purple-400" />}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Official Contact Email *"
                type="email"
                placeholder="organizer@university.edu"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                leftIcon={<Mail className="w-4 h-4 text-purple-400" />}
                required
              />

              <Input
                label="Contact Phone Number *"
                placeholder="+1 (555) 000-0000"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                leftIcon={<Phone className="w-4 h-4 text-purple-400" />}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Primary Event Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-[#11111B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="TECHNOLOGY">Technology & AI Summits</option>
                  <option value="HACKATHONS">Hackathons & Coding Sprints</option>
                  <option value="COLLEGE_FESTS">College Cultural & Tech Fests</option>
                  <option value="MUSIC">Music & Live Concerts</option>
                  <option value="WORKSHOPS">Workshops & Bootcamps</option>
                  <option value="CONFERENCES">Academic & Research Conferences</option>
                  <option value="SPORTS">Sports & Esports Tournaments</option>
                  <option value="ARTS_CULTURE">Arts, Theater & Film</option>
                </select>
              </div>

              <Input
                label="Website or Social Portfolio (Optional)"
                placeholder="https://yourclub.edu or https://instagram.com/..."
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                leftIcon={<Globe className="w-4 h-4 text-purple-400" />}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Reason for Application & Planned Events *
              </label>
              <textarea
                rows={4}
                placeholder="Tell us about the events you plan to host on EVENTORA, expected audience size, and ticketing requirements..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full bg-[#11111B] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 resize-none"
                required
              />
              <p className="text-[11px] text-slate-500">Minimum 10 characters.</p>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-white/10">
              <p className="text-[11px] text-slate-400">
                By submitting, you agree to EVENTORA organizer terms and safety guidelines.
              </p>
              <Button
                type="submit"
                variant="gradient"
                size="md"
                isLoading={isSubmitting}
                rightIcon={<Send className="w-4 h-4" />}
              >
                Submit Application
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};
