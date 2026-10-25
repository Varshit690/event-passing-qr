import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Building2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
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

export const BecomeOrganizerPage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [application, setApplication] = useState(null);
  const [showReapplyForm, setShowReapplyForm] = useState(false);

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
    } catch (err) {
      console.error('Error fetching application status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSubmit = async (e) => {
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
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to submit organizer application.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Already Approved State
  if (user?.role === 'ORGANIZER' || user?.role === 'ADMIN') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Card className="p-8 sm:p-10 bg-white border-slate-200 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <Badge variant="success" size="md">
              {user.role === 'ADMIN' ? 'Platform Administrator' : 'Verified Event Host'}
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              You Have Organizer Access
            </h1>
            <p className="text-slate-500 max-w-lg mx-auto text-sm leading-relaxed">
              Your account is authorized to create and publish events, configure ticket tiers, and verify entry with the QR scanner.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/organizer">
              <Button variant="primary" size="md" leftIcon={<LayoutDashboard className="w-4 h-4" />}>
                Go to Organizer Dashboard
              </Button>
            </Link>
            <Link to="/create-event">
              <Button variant="outline" size="md" leftIcon={<Calendar className="w-4 h-4" />}>
                Create New Event
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Building2 className="w-3.5 h-3.5" />
          <span>Host With Us</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          Apply to Become an Event Organizer
        </h1>
        <p className="text-slate-500 max-w-lg mx-auto text-sm leading-relaxed">
          Publish campus events, hackathons, and workshops with instant digital QR passes and camera ticket scanning.
        </p>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <Card className="p-8 bg-white border-slate-200 space-y-4 animate-pulse shadow-sm">
          <div className="h-6 w-1/3 bg-slate-100 rounded" />
          <div className="h-4 w-2/3 bg-slate-100 rounded" />
          <div className="h-24 bg-slate-50 rounded-lg" />
        </Card>
      )}

      {/* Pending Application State */}
      {!isLoading && application && application.status === 'PENDING' && (
        <Card className="p-6 sm:p-8 bg-white border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">Application Under Review</h2>
                  <Badge variant="warning" size="sm">PENDING</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submitted on {new Date(application.createdAt).toLocaleDateString()}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-slate-500 font-medium">Organization:</span>
              <p className="text-sm font-bold text-slate-900">{application.organizationName}</p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-slate-500 font-medium">College / Institution:</span>
              <p className="text-sm font-bold text-slate-900">{application.collegeOrOrg}</p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-slate-500 font-medium">Event Category:</span>
              <p className="text-sm font-bold text-blue-600">{application.category}</p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-slate-500 font-medium">Contact Phone:</span>
              <p className="text-sm font-bold text-slate-900">{application.contactPhone}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
            <span className="text-slate-500 font-medium">Application Purpose:</span>
            <p className="text-slate-700 leading-relaxed italic">"{application.reason}"</p>
          </div>

          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Your application is being reviewed by the platform administrators. You will be able to publish events as soon as your account is approved.
            </p>
          </div>
        </Card>
      )}

      {/* Rejected Application State */}
      {!isLoading && application && application.status === 'REJECTED' && !showReapplyForm && (
        <Card className="p-6 sm:p-8 bg-white border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Application Declined</h2>
                <Badge variant="danger" size="sm">DECLINED</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Reviewed on {application.reviewedAt ? new Date(application.reviewedAt).toLocaleDateString() : 'recently'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 space-y-1 text-xs">
            <span className="text-rose-700 font-bold uppercase tracking-wider text-[10px]">Review Feedback:</span>
            <p className="text-rose-900 leading-relaxed">
              {application.rejectionReason || 'Please provide official club details or faculty contact information.'}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="primary" size="md" onClick={() => setShowReapplyForm(true)}>
              Submit Updated Application
            </Button>
          </div>
        </Card>
      )}

      {/* Application Form */}
      {!isLoading && (!application || (application.status === 'REJECTED' && showReapplyForm)) && (
        <Card className="p-6 sm:p-8 bg-white border-slate-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Organization Information</h2>
              <p className="text-xs text-slate-500">
                Please enter details about your student club, college department, or organization.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Organization or Club Name *"
                placeholder="e.g. ACM Student Chapter"
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                leftIcon={<Building2 className="w-4 h-4 text-slate-400" />}
                required
              />

              <Input
                label="College or University *"
                placeholder="e.g. State University"
                value={formData.collegeOrOrg}
                onChange={(e) => setFormData({ ...formData, collegeOrOrg: e.target.value })}
                leftIcon={<GraduationCap className="w-4 h-4 text-slate-400" />}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Contact Email *"
                type="email"
                placeholder="organizer@university.edu"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                required
              />

              <Input
                label="Contact Phone Number *"
                placeholder="+1 (555) 000-0000"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Primary Event Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="TECHNOLOGY">Technology & AI</option>
                  <option value="HACKATHONS">Hackathons & Coding Sprints</option>
                  <option value="COLLEGE_FESTS">College Cultural & Tech Fests</option>
                  <option value="MUSIC">Music & Live Performances</option>
                  <option value="WORKSHOPS">Workshops & Bootcamps</option>
                  <option value="CONFERENCES">Academic Conferences</option>
                  <option value="SPORTS">Sports & Esports</option>
                  <option value="ARTS_CULTURE">Arts & Theater</option>
                </select>
              </div>

              <Input
                label="Website or Social Link (Optional)"
                placeholder="https://yourclub.edu"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                leftIcon={<Globe className="w-4 h-4 text-slate-400" />}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Brief Description of Planned Events *
              </label>
              <textarea
                rows={4}
                placeholder="Tell us about the events you plan to host, anticipated attendee count, and dates..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
              <p className="text-[11px] text-slate-400">Minimum 10 characters.</p>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <p className="text-[11px] text-slate-500">
                All applications are reviewed to ensure quality event listings.
              </p>
              <Button
                type="submit"
                variant="primary"
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
