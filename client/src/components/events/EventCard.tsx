import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowUpRight, Sparkles } from 'lucide-react';
import { Event } from '../../types';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface EventCardProps {
  event: Event;
  featured?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ event, featured = false }) => {
  const formattedDate = new Date(event.startDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const formattedTime = new Date(event.startDate).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const isLowCapacity = event.remainingTickets < 50 && event.remainingTickets > 0;
  const isSoldOut = event.remainingTickets <= 0;

  return (
    <Link to={`/events/${event.id}`} className="group block h-full">
      <Card
        hoverable
        className={`h-full flex flex-col overflow-hidden border border-white/[0.08] bg-[#171723] hover:border-purple-500/40 transition-all duration-300 ${
          featured ? 'ring-1 ring-purple-500/30' : ''
        }`}
      >
        {/* Event Image & Badges */}
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
          <img
            src={event.bannerUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#171723] via-transparent to-black/30" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
            <Badge variant="primary" size="sm" className="bg-[#09090F]/80 backdrop-blur-md">
              {event.category.replace('_', ' ')}
            </Badge>

            <span className="px-2.5 py-1 rounded-full text-xs font-bold tracking-wide backdrop-blur-md bg-purple-600/90 text-white shadow-sm">
              {event.minPrice === 0 ? 'FREE RSVP' : `From $${event.minPrice}`}
            </span>
          </div>

          {/* Low capacity indicator */}
          {isLowCapacity && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/90 text-white backdrop-blur-sm animate-pulse-subtle">
              <Sparkles className="w-3 h-3" />
              <span>Only {event.remainingTickets} spots left!</span>
            </div>
          )}

          {isSoldOut && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] flex items-center justify-center">
              <span className="px-4 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold uppercase tracking-wider">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            {/* Date & Time */}
            <div className="flex items-center gap-2 text-xs font-medium text-purple-400">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>{formattedDate} • {formattedTime}</span>
            </div>

            {/* Title */}
            <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug">
              {event.title}
            </h3>

            {/* Venue Location */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{event.venue}, {event.location}</span>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
            {/* Organizer */}
            <div className="flex items-center gap-2">
              {event.organizerAvatar ? (
                <img
                  src={event.organizerAvatar}
                  alt={event.organizerName}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-purple-900/50 flex items-center justify-center text-[10px] text-purple-300">
                  {event.organizerName[0]}
                </div>
              )}
              <span className="text-slate-400 truncate max-w-[120px]">
                {event.organizerName}
              </span>
            </div>

            {/* CTA action */}
            <span className="inline-flex items-center gap-1 font-semibold text-purple-400 group-hover:text-cyan-400 transition-colors">
              <span>View Pass</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
};
