import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Ticket, 
  Search, 
  PlusCircle, 
  Compass, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  QrCode, 
  LayoutDashboard, 
  LogOut, 
  ShieldAlert,
  ChevronDown,
  Sparkles,
  Users,
  Building2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  }, [location.pathname]);

  // Dynamic navigation links strictly based on user role
  const getNavLinks = () => {
    const common = [
      { label: 'Discover', path: '/events', icon: <Compass className="w-4 h-4" /> },
    ];

    if (!user || user.role === 'ATTENDEE') {
      return [
        ...common,
        { label: 'My Tickets', path: '/tickets', icon: <Ticket className="w-4 h-4" /> },
      ];
    }

    if (user.role === 'ORGANIZER') {
      return [
        ...common,
        { label: 'My Tickets', path: '/tickets', icon: <Ticket className="w-4 h-4" /> },
        { label: 'Organizer Dashboard', path: '/organizer', icon: <LayoutDashboard className="w-4 h-4 text-purple-400" /> },
        { label: 'Host Event', path: '/create-event', icon: <PlusCircle className="w-4 h-4 text-indigo-400" /> },
        { label: 'QR Scanner', path: '/scanner', icon: <QrCode className="w-4 h-4 text-cyan-400" /> },
      ];
    }

    if (user.role === 'ADMIN') {
      return [
        ...common,
        { label: 'Admin Dashboard', path: '/admin', icon: <ShieldAlert className="w-4 h-4 text-amber-400" /> },
        { label: 'User Directory', path: '/admin?tab=users', icon: <Users className="w-4 h-4 text-cyan-400" /> },
      ];
    }

    return common;
  };

  const navLinks = getNavLinks();

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'glass-nav shadow-lg'
          : 'bg-[#09090F]/80 backdrop-blur-md border-b border-white/[0.04]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-[1.5px] transition-transform duration-300 group-hover:scale-105 shadow-glow-purple">
              <div className="w-full h-full bg-[#09090F] rounded-[10px] flex items-center justify-center">
                <Ticket className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                EVENTORA
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-purple-400 uppercase -mt-1">
                Discover • Book • QR Pass
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path || (link.path.includes('?') && location.pathname + location.search === link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Role CTA, Theme, Profile */}
          <div className="hidden md:flex items-center gap-3">
            {/* Dynamic Role Action Button */}
            {user?.role === 'ORGANIZER' && (
              <Link to="/create-event">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<PlusCircle className="w-4 h-4 text-purple-400" />}
                  className="border-purple-500/30 hover:border-purple-500/60"
                >
                  Host Event
                </Button>
              </Link>
            )}

            {user?.role === 'ADMIN' && (
              <Link to="/admin">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<ShieldAlert className="w-4 h-4 text-amber-400" />}
                  className="border-amber-500/30 hover:border-amber-500/60 text-amber-300"
                >
                  Admin Center
                </Button>
              </Link>
            )}

            {!user && (
              <Link to="/#portals">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Sparkles className="w-4 h-4 text-purple-400" />}
                  className="border-purple-500/30 hover:border-purple-500/60"
                >
                  Three Portals
                </Button>
              </Link>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>

            {/* User Profile or Login */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pl-2 pr-3 rounded-xl bg-[#171723] hover:bg-[#1E1E2E] border border-white/10 transition-colors"
                >
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                    alt={user.name}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-purple-500/30"
                  />
                  <span className="text-xs font-semibold text-slate-200 max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#171723] border border-white/10 shadow-2xl p-2 z-50 animate-slide-up">
                    <div className="px-3 py-2 border-b border-white/10 mb-1">
                      <p className="text-xs font-semibold text-white">{user.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-purple-500/20 text-purple-300">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      to="/tickets"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Ticket className="w-4 h-4 text-purple-400" />
                      <span>My Passes & QR Tickets</span>
                    </Link>

                    {user.role === 'ATTENDEE' && (
                      <Link
                        to="/auth/register?portal=organizer"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span>Register as Organizer</span>
                      </Link>
                    )}

                    {user.role === 'ORGANIZER' && (
                      <>
                        <Link
                          to="/organizer"
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                          <span>Organizer Dashboard</span>
                        </Link>
                        <Link
                          to="/create-event"
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <PlusCircle className="w-4 h-4 text-indigo-400" />
                          <span>Host New Event</span>
                        </Link>
                        <Link
                          to="/scanner"
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <QrCode className="w-4 h-4 text-emerald-400" />
                          <span>QR Scanner & Gate Pass</span>
                        </Link>
                      </>
                    )}

                    {user.role === 'ADMIN' && (
                      <>
                        <Link
                          to="/admin"
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <ShieldAlert className="w-4 h-4 text-amber-400" />
                          <span>Admin Control Center</span>
                        </Link>
                        <Link
                          to="/admin?tab=users"
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Users className="w-4 h-4 text-cyan-400" />
                          <span>User Directory</span>
                        </Link>
                        <Link
                          to="/scanner"
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <QrCode className="w-4 h-4 text-emerald-400" />
                          <span>Gate Scanner</span>
                        </Link>
                      </>
                    )}

                    <button
                      onClick={async () => {
                        await logout();
                        setIsProfileDropdownOpen(false);
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/auth/login')}>
                  Sign In
                </Button>
                <Button variant="gradient" size="sm" onClick={() => navigate('/auth/register')}>
                  Get Started
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#11111B] border-b border-white/10 px-4 pt-3 pb-6 space-y-3 animate-fade-in">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/5"
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
            {user?.role === 'ORGANIZER' && (
              <Link
                to="/create-event"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-purple-400 hover:bg-purple-500/10"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Host an Event</span>
              </Link>
            )}
            {!user && (
              <Link
                to="/#portals"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-purple-400 hover:bg-purple-500/10"
              >
                <Sparkles className="w-4 h-4" />
                <span>Three Portals</span>
              </Link>
            )}
          </nav>

          {isAuthenticated && user ? (
            <div className="pt-3 border-t border-white/10 space-y-3">
              <div className="flex items-center gap-3 px-2">
                <img
                  src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                  alt={user.name}
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-purple-500/30"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300">
                  {user.role}
                </span>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  setIsMobileMenuOpen(false);
                  navigate('/');
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/auth/login');
                }}
              >
                Sign In
              </Button>
              <Button
                variant="gradient"
                size="sm"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/auth/register');
                }}
              >
                Get Started
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
