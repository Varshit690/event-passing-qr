import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Ticket, ArrowRight, Lock, Mail, ShieldCheck, User, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { login } = useAuth();

  const portalParam = (searchParams.get('portal') || '').toUpperCase();
  const initialPortal =
    portalParam === 'ADMIN' ? 'ADMIN' : portalParam === 'ORGANIZER' ? 'ORGANIZER' : 'ATTENDEE';

  const [selectedPortal, setSelectedPortal] = useState(initialPortal);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const p = (searchParams.get('portal') || '').toUpperCase();
    if (p === 'ADMIN' || p === 'ORGANIZER' || p === 'ATTENDEE') {
      setSelectedPortal(p);
    }
  }, [searchParams]);

  const handlePortalChange = (portal) => {
    setSelectedPortal(portal);
    setSearchParams({ portal: portal.toLowerCase() });
  };

  const handleSubmit = async (e) => {
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
        const from = location.state?.from?.pathname || '/tickets';
        navigate(from, { replace: true });
      }
    } catch (err) {
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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm text-white">
              <Ticket className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">EVENTORA</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight pt-2">
            Sign In to Your Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Choose your role and enter your details to continue.
          </p>
        </div>

        {/* Portal Selector Tabs */}
        <div className="grid grid-cols-3 p-1 rounded-lg bg-slate-100 border border-slate-200 gap-1">
          <button
            type="button"
            onClick={() => handlePortalChange('ATTENDEE')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
              selectedPortal === 'ATTENDEE'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Attendee</span>
          </button>
          <button
            type="button"
            onClick={() => handlePortalChange('ORGANIZER')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
              selectedPortal === 'ORGANIZER'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Organizer</span>
          </button>
          <button
            type="button"
            onClick={() => handlePortalChange('ADMIN')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
              selectedPortal === 'ADMIN'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {/* Form Card */}
        <Card className="p-6 sm:p-7 bg-white border-slate-200 shadow-sm space-y-5">
          {/* Portal Context Banner */}
          {selectedPortal === 'ATTENDEE' && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center justify-between">
              <span>View your passes and reserve tickets</span>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-[10px] font-bold uppercase text-blue-800">
                Attendee
              </span>
            </div>
          )}

          {selectedPortal === 'ORGANIZER' && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center justify-between">
              <span>Manage your events and scan tickets</span>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-[10px] font-bold uppercase text-blue-800">
                Organizer
              </span>
            </div>
          )}

          {selectedPortal === 'ADMIN' && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
              <span>Platform management and user governance</span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-[10px] font-bold uppercase text-amber-800">
                Admin
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="••••••••"
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
              Sign In to {selectedPortal.charAt(0) + selectedPortal.slice(1).toLowerCase()} Portal
            </Button>
          </form>

          {/* Footer Navigation */}
          <div className="pt-2 border-t border-slate-100 space-y-2 text-center text-xs text-slate-500">
            {selectedPortal === 'ATTENDEE' && (
              <div>
                <span>Need an attendee account? </span>
                <Link
                  to="/auth/register?portal=attendee"
                  className="text-blue-600 hover:text-blue-700 font-semibold"
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
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Register as an Organizer
                </Link>
              </div>
            )}

            {selectedPortal === 'ADMIN' && (
              <div className="text-[11px] text-slate-500">
                <span>Admin accounts are provisioned via backend bootstrap: </span>
                <code className="text-slate-700 font-mono bg-slate-100 px-1 py-0.5 rounded">
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
