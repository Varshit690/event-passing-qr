import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Github, Twitter, Linkedin, Instagram, Heart, Sparkles, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#09090F] border-t border-white/[0.06] pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/[0.06]">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-[1px] shadow-glow-purple">
                <div className="w-full h-full bg-[#09090F] rounded-[11px] flex items-center justify-center">
                  <Ticket className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                EVENTORA
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Discover extraordinary experiences, reserve your spot in seconds, and enter effortlessly with your cryptographic digital QR ticket pass.
            </p>
            <div className="flex items-center gap-3 text-slate-400 pt-2">
              <a href="#" className="p-2 rounded-xl bg-[#171723] hover:text-purple-400 hover:border-purple-500/30 border border-white/5 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-xl bg-[#171723] hover:text-purple-400 hover:border-purple-500/30 border border-white/5 transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-xl bg-[#171723] hover:text-purple-400 hover:border-purple-500/30 border border-white/5 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-xl bg-[#171723] hover:text-purple-400 hover:border-purple-500/30 border border-white/5 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 1 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">Discover</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link to="/events?category=MUSIC" className="hover:text-purple-400 transition-colors">Concerts & Music</Link></li>
              <li><Link to="/events?category=HACKATHONS" className="hover:text-purple-400 transition-colors">Hackathons & AI</Link></li>
              <li><Link to="/events?category=COLLEGE_FESTS" className="hover:text-purple-400 transition-colors">College Fests</Link></li>
              <li><Link to="/events?category=WORKSHOPS" className="hover:text-purple-400 transition-colors">Tech Workshops</Link></li>
              <li><Link to="/events" className="hover:text-purple-400 transition-colors">All Events</Link></li>
            </ul>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">Organizers</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link to="/create-event" className="hover:text-cyan-400 transition-colors">Host an Event</Link></li>
              <li><Link to="/organizer" className="hover:text-cyan-400 transition-colors">Organizer Hub</Link></li>
              <li><Link to="/scanner" className="hover:text-cyan-400 transition-colors">Gate QR Scanner</Link></li>
              <li><a href="#how-it-works" className="hover:text-cyan-400 transition-colors">Verification Protocol</a></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">Platform & Trust</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-center gap-1.5 text-emerald-400"><ShieldCheck className="w-4 h-4" /> Anti-Fraud Passes</li>
              <li><a href="#" className="hover:text-slate-200 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-slate-200 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-slate-200 transition-colors">Security Architecture</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} EVENTORA Inc. All rights reserved. Crafted for extraordinary experiences.</p>
          <div className="flex items-center gap-2">
            <span>Built with precision for next-gen event ticketing</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
        </div>
      </div>
    </footer>
  );
};
