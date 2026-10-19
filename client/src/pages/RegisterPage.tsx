import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Ticket, ArrowRight, Lock, Mail, User, Sparkles, Building2, Phone, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

type RegistrationRole = 'ATTENDEE' | 'ORGANIZER';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { signup, signupOrganizer } = useAuth();

  const portalParam = (searchParams.get('portal') || '').toUpperCase();
  const initialRole: RegistrationRole = portalParam === 'ORGANIZER' ? 'ORGANIZER' : 'ATTENDEE';

  const [role, setRole] = useState<RegistrationRole>(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const p = (searchParams.get('portal') || '').toUpperCase();
    if (p === 'ORGANIZER' || p === 'ATTENDEE') {
      setRole(p as RegistrationRole);
    }
  }, [searchParams]);

  const handleRoleChange = (newRole: RegistrationRole) => {
    setRole(newRole);
    setSearchParams({ portal: newRole.toLowerCase() });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all required credentials.');
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
        toast.success('Organizer account activated! Welcome to the Organizer Portal.');
        navigate('/organizer');
      } else {
        await signup(name, email, password);
        toast.success('Attendee account created! Welcome to EVENTORA.');
        navigate('/events');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center shadow-glow-purple">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">EVENTORA</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight pt-2">
            Create Your Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Select your account type to register directly with full portal access
          </p>
        </div>

        {/* Portal Registration Selector */}
        <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-[#171723] border border-white/10 gap-1.5 shadow-xl">
          <button
            type="button"
            onClick={() => handleRoleChange('ATTENDEE')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
              role === 'ATTENDEE'
                ? 'bg-purple-600 text-white shadow-glow-purple'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Attendee Account</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('ORGANIZER')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
              role === 'ORGANIZER'
                ? 'bg-cyan-600 text-white shadow-glow-cyan'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Organizer Account</span>
          </button>
        </div>

        <Card className="p-6 sm:p-8 bg-[#171723] border-white/5 space-y-5 shadow-2xl">
          {/* Context Banner */}
          {role === 'ATTENDEE' ? (
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <Ticket className="w-4 h-4 text-purple-400" />
                <span>Attendee Portal Registration</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Book event tickets, generate cryptographically signed QR passes, and manage your registrations.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Direct Organizer Registration — No Waiting</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Publish events immediately, configure ticket tiers, access live analytics, and use the camera QR pass scanner.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="e.g. Alex Rivera"
              leftIcon={<User className="w-4 h-4" />}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            {role === 'ORGANIZER' && (
              <>
                <Input
                  label="Organization or College Name"
                  placeholder="e.g. Stanford Tech Society / Horizon Labs"
                  leftIcon={<Building2 className="w-4 h-4" />}
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  required
                />

                <Input
                  label="Contact Phone Number"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  leftIcon={<Phone className="w-4 h-4" />}
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
              leftIcon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              leftIcon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant={role === 'ORGANIZER' ? 'gradient' : 'gradient'}
              size="lg"
              className={`w-full ${
                role === 'ORGANIZER'
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-glow-cyan'
                  : 'shadow-glow-purple'
              }`}
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {role === 'ORGANIZER' ? 'Register as Organizer & Enter Portal' : 'Create Attendee Account'}
            </Button>
          </form>

          <div className="pt-2 border-t border-white/5 space-y-2 text-center text-xs text-slate-400">
            <div>
              <span>Already have an account? </span>
              <Link
                to={`/auth/login?portal=${role.toLowerCase()}`}
                className="text-purple-400 hover:text-purple-300 font-semibold"
              >
                Sign In to {role === 'ORGANIZER' ? 'Organizer' : 'Attendee'} Portal
              </Link>
            </div>
            <div className="text-[11px] text-slate-500 pt-1">
              Admin access? Provisioned securely via backend bootstrap. No public registration.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

