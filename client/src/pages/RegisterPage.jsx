import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Ticket, ArrowRight, Lock, Mail, User, Calendar, Building2, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { signup, signupOrganizer } = useAuth();

  const portalParam = (searchParams.get('portal') || '').toUpperCase();
  const initialRole = portalParam === 'ORGANIZER' ? 'ORGANIZER' : 'ATTENDEE';

  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const p = (searchParams.get('portal') || '').toUpperCase();
    if (p === 'ORGANIZER' || p === 'ATTENDEE') {
      setRole(p);
    }
  }, [searchParams]);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setSearchParams({ portal: newRole.toLowerCase() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    if (role === 'ORGANIZER') {
      if (!organizationName.trim()) {
        toast.error('Please enter your organization or college name.');
        return;
      }
      if (!contactPhone.trim() || contactPhone.trim().length < 7) {
        toast.error('Please provide a valid contact phone number.');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (role === 'ORGANIZER') {
        await signupOrganizer(name, email, password, organizationName, contactPhone);
        toast.success('Organizer account created successfully! Welcome to the Organizer Portal.');
        navigate('/organizer');
      } else {
        await signup(name, email, password);
        toast.success('Attendee account created! Welcome to EVENTORA.');
        navigate('/events');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm text-white">
              <Ticket className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">EVENTORA</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight pt-2">
            Create an Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Select your account type to register and get started.
          </p>
        </div>

        {/* Portal Registration Selector */}
        <div className="grid grid-cols-2 p-1 rounded-lg bg-slate-100 border border-slate-200 gap-1">
          <button
            type="button"
            onClick={() => handleRoleChange('ATTENDEE')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
              role === 'ATTENDEE'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Attendee Account</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('ORGANIZER')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
              role === 'ORGANIZER'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Organizer Account</span>
          </button>
        </div>

        <Card className="p-6 sm:p-7 bg-white border-slate-200 shadow-sm space-y-5">
          {/* Context Banner */}
          {role === 'ATTENDEE' ? (
            <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <Ticket className="w-4 h-4 text-blue-600" />
                <span>Attendee Registration</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Book event tickets, receive digital QR passes, and view your tickets anytime.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Organizer Registration</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Publish events, create custom ticket tiers, and scan attendee tickets with your device.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="e.g. Alex Rivera"
              leftIcon={<User className="w-4 h-4 text-slate-400" />}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            {role === 'ORGANIZER' && (
              <>
                <Input
                  label="Organization or College Name"
                  placeholder="e.g. CS Student Society / Robotics Club"
                  leftIcon={<Building2 className="w-4 h-4 text-slate-400" />}
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  required
                />

                <Input
                  label="Contact Phone Number"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  required
                />
              </>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {role === 'ORGANIZER' ? 'Register as Organizer' : 'Create Attendee Account'}
            </Button>
          </form>

          <div className="pt-2 border-t border-slate-100 space-y-2 text-center text-xs text-slate-500">
            <div>
              <span>Already have an account? </span>
              <Link
                to={`/auth/login?portal=${role.toLowerCase()}`}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Sign In to {role === 'ORGANIZER' ? 'Organizer' : 'Attendee'} Portal
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
