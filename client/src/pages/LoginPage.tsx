import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Ticket, ArrowRight, Lock, Mail, Sparkles, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

type PortalType = 'ATTENDEE' | 'ORGANIZER' | 'ADMIN';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { login } = useAuth();

  const portalParam = (searchParams.get('portal') || '').toUpperCase();
  const initialPortal: PortalType =
    portalParam === 'ADMIN' ? 'ADMIN' : portalParam === 'ORGANIZER' ? 'ORGANIZER' : 'ATTENDEE';

  const [selectedPortal, setSelectedPortal] = useState<PortalType>(initialPortal);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const p = (searchParams.get('portal') || '').toUpperCase();
    if (p === 'ADMIN' || p === 'ORGANIZER' || p === 'ATTENDEE') {
      setSelectedPortal(p as PortalType);
    }
  }, [searchParams]);

  const handlePortalChange = (portal: PortalType) => {
    setSelectedPortal(portal);
    setSearchParams({ portal: portal.toLowerCase() });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const loggedUser = await login(email, password, selectedPortal);
      toast.success(`Signed in successfully to ${selectedPortal} Portal! Welcome back.`);

      // Direct to portal-specific destination
      if (selectedPortal === 'ADMIN' || loggedUser.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (selectedPortal === 'ORGANIZER' || loggedUser.role === 'ORGANIZER') {
        navigate('/organizer', { replace: true });
      } else {
        const from = (location.state as any)?.from?.pathname || '/tickets';
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          'Invalid credentials. Please verify your email, password, and chosen portal.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center shadow-glow-purple">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">EVENTORA</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight pt-2">
            Portal Access
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Sign in to your role-specific portal with verified credentials
          </p>
        </div>

        {/* Portal Selector Tabs */}
        <div className="grid grid-cols-3 p-1.5 rounded-2xl bg-[#171723] border border-white/10 gap-1.5 shadow-xl">
          <button
            type="button"
            onClick={() => handlePortalChange('ATTENDEE')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
              selectedPortal === 'ATTENDEE'
                ? 'bg-purple-600 text-white shadow-glow-purple'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Attendee</span>
          </button>
          <button
            type="button"
            onClick={() => handlePortalChange('ORGANIZER')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
              selectedPortal === 'ORGANIZER'
                ? 'bg-cyan-600 text-white shadow-glow-cyan'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Organizer</span>
          </button>
          <button
            type="button"
            onClick={() => handlePortalChange('ADMIN')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
              selectedPortal === 'ADMIN'
                ? 'bg-amber-600 text-white shadow-glow-amber'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {/* Form Card */}
        <Card className="p-6 sm:p-8 bg-[#171723] border-white/5 space-y-5 shadow-2xl">
          {/* Portal Context Banner */}
          {selectedPortal === 'ATTENDEE' && (
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 flex items-center justify-between">
              <span className="font-medium">Sign in to view your tickets & reserve events</span>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-[10px] font-bold uppercase">
                Attendee
              </span>
            </div>
          )}

          {selectedPortal === 'ORGANIZER' && (
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 flex items-center justify-between">
              <span className="font-medium">Direct access to events, ticket tiers & QR scanner</span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-[10px] font-bold uppercase">
                Organizer
              </span>
            </div>
          )}

          {selectedPortal === 'ADMIN' && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
              <span className="font-medium">Secure access to platform telemetry & governance</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[10px] font-bold uppercase">
                Admin Only
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant={
                selectedPortal === 'ADMIN'
                  ? 'primary'
                  : selectedPortal === 'ORGANIZER'
                  ? 'gradient'
                  : 'gradient'
              }
              size="lg"
              className={`w-full ${
                selectedPortal === 'ADMIN'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : selectedPortal === 'ORGANIZER'
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  : 'shadow-glow-purple'
              }`}
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to {selectedPortal} Portal
            </Button>
          </form>

          {/* Footer Navigation */}
          <div className="pt-2 border-t border-white/5 space-y-2 text-center text-xs text-slate-400">
            {selectedPortal === 'ATTENDEE' && (
              <div>
                <span>Need an attendee account? </span>
                <Link
                  to="/auth/register?portal=attendee"
                  className="text-purple-400 hover:text-purple-300 font-semibold"
                >
                  Register as Attendee
                </Link>
              </div>
            )}

            {selectedPortal === 'ORGANIZER' && (
              <div>
                <span>Need to host events? </span>
                <Link
                  to="/auth/register?portal=organizer"
                  className="text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  Direct Organizer Registration (No Approval Required)
                </Link>
              </div>
            )}

            {selectedPortal === 'ADMIN' && (
              <div className="text-[11px] text-slate-500">
                <span>Admin accounts cannot be registered publicly. They are provisioned via backend bootstrap: </span>
                <code className="text-amber-400/90 font-mono bg-amber-500/10 px-1 py-0.5 rounded">
                  npm run --prefix server bootstrap:admin
                </code>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

