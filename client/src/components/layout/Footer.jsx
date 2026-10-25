import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Github, Twitter, Linkedin, Instagram, ShieldCheck } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 pt-12 pb-8 mt-16 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-8 border-b border-slate-200">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <Ticket className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                EVENTORA
              </span>
            </Link>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              A clean, modern ticketing platform for college campus fests, hackathons, workshops, and community events with instant QR pass verification.
            </p>
            <div className="flex items-center gap-2 pt-1 text-slate-500">
              <a href="#" aria-label="Twitter" className="p-1.5 rounded-lg bg-slate-50 hover:text-blue-600 hover:bg-slate-100 border border-slate-200 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" aria-label="GitHub" className="p-1.5 rounded-lg bg-slate-50 hover:text-blue-600 hover:bg-slate-100 border border-slate-200 transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" aria-label="LinkedIn" className="p-1.5 rounded-lg bg-slate-50 hover:text-blue-600 hover:bg-slate-100 border border-slate-200 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" aria-label="Instagram" className="p-1.5 rounded-lg bg-slate-50 hover:text-blue-600 hover:bg-slate-100 border border-slate-200 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 1 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Discover</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><Link to="/events?category=COLLEGE_FESTS" className="hover:text-blue-600 transition-colors">College Fests</Link></li>
              <li><Link to="/events?category=HACKATHONS" className="hover:text-blue-600 transition-colors">Hackathons</Link></li>
              <li><Link to="/events?category=MUSIC" className="hover:text-blue-600 transition-colors">Concerts & Shows</Link></li>
              <li><Link to="/events?category=WORKSHOPS" className="hover:text-blue-600 transition-colors">Tech Workshops</Link></li>
              <li><Link to="/events" className="hover:text-blue-600 transition-colors">All Events</Link></li>
            </ul>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Organizers</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><Link to="/create-event" className="hover:text-blue-600 transition-colors">Host an Event</Link></li>
              <li><Link to="/organizer" className="hover:text-blue-600 transition-colors">Organizer Hub</Link></li>
              <li><Link to="/scanner" className="hover:text-blue-600 transition-colors">QR Pass Scanner</Link></li>
              <li><Link to="/auth/register?portal=organizer" className="hover:text-blue-600 transition-colors">Organizer Sign-up</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">About Project</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <ShieldCheck className="w-4 h-4" /> Verified QR Entry
              </li>
              <li><a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a></li>
              <li><Link to="/tickets" className="hover:text-blue-600 transition-colors">Attendee Tickets</Link></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Terms & Privacy</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} EVENTORA — Event Ticketing with QR Pass. College Student Project.</p>
          <div className="flex items-center gap-1 text-slate-500">
            <span>Built with React, Tailwind CSS, Express & MongoDB</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
