import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Ticket, 
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
  Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui/Button';

export const Navbar = () => {
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
      className={`sticky top-0 z-40 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200'
          : 'bg-white border-b border-slate-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Ticket className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                EVENTORA
              </span>
              <span className="text-[10px] font-medium tracking-wide text-slate-500 uppercase mt-0.5">
                Events & QR Pass
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path || (link.path.includes('?') && location.pathname + location.search === link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className={isActive ? 'text-blue-600' : 'text-slate-400'}>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Role CTA, Theme, Profile */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Dynamic Role Action Button */}
            {user?.role === 'ORGANIZER' && (
              <Link to="/create-event">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
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
                  leftIcon={<ShieldAlert className="w-3.5 h-3.5 text-slate-600" />}
                >
                  Admin Center
                </Button>
              </Link>
            )}

            {!user && (
              <Link to="/#portals">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-600"
                >
                  Portals
                </Button>
              </Link>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* User Profile or Login */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200"
                  />
                  <span className="text-xs font-medium text-slate-800 max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-lg p-1.5 z-50">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs font-semibold text-slate-900">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-blue-50 text-blue-700">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      to="/tickets"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    >
                      <Ticket className="w-3.5 h-3.5 text-slate-400" />
                      <span>My Passes & QR Tickets</span>
                    </Link>

                    {user.role === 'ATTENDEE' && (
                      <Link
                        to="/auth/register?portal=organizer"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                        <span>Register as Organizer</span>
                      </Link>
                    )}

                    {user.role === 'ORGANIZER' && (
                      <>
                        <Link
                          to="/organizer"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                          <span>Organizer Dashboard</span>
                        </Link>
                        <Link
                          to="/create-event"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
                          <span>Host New Event</span>
                        </Link>
                        <Link
                          to="/scanner"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5 text-slate-400" />
                          <span>QR Pass Scanner</span>
                        </Link>
                      </>
                    )}

                    {user.role === 'ADMIN' && (
                      <>
                        <Link
                          to="/admin"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                          <span>Admin Control Center</span>
                        </Link>
                        <Link
                          to="/admin?tab=users"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                        >
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>User Directory</span>
                        </Link>
                        <Link
                          to="/scanner"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5 text-slate-400" />
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
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors mt-1 border-t border-slate-100"
                    >
                      <LogOut className="w-3.5 h-3.5" />
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
                <Button variant="primary" size="sm" onClick={() => navigate('/auth/register')}>
                  Sign Up
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-5 space-y-3">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <span className="text-slate-400">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
            {user?.role === 'ORGANIZER' && (
              <Link
                to="/create-event"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Host an Event</span>
              </Link>
            )}
            {!user && (
              <Link
                to="/#portals"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Sparkles className="w-4 h-4 text-slate-400" />
                <span>Three Portals</span>
              </Link>
            )}
          </nav>

          {isAuthenticated && user ? (
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-3 px-1">
                <img
                  src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700">
                  {user.role}
                </span>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  setIsMobileMenuOpen(false);
                  navigate('/');
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/auth/login');
                }}
              >
                Sign In
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/auth/register');
                }}
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
