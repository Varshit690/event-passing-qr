import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export const EventCard = ({ event, featured = false }) => {
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
        className={`h-full flex flex-col overflow-hidden border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all duration-200 rounded-xl ${
          featured ? 'ring-1 ring-blue-200 border-blue-300' : ''
        }`}
      >
        {/* Event Image & Badges */}
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          <img
            src={event.bannerUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            loading="lazy"
          />

          {/* Top Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
            <Badge variant="secondary" size="sm" className="bg-white/95 backdrop-blur-sm text-slate-800 shadow-sm border border-slate-200 font-semibold">
              {event.category ? event.category.replace('_', ' ') : ''}
            </Badge>

            <span className="px-2.5 py-1 rounded-md text-xs font-bold tracking-tight bg-white/95 backdrop-blur-sm text-blue-700 shadow-sm border border-slate-200">
              {event.minPrice === 0 ? 'FREE' : `$${event.minPrice}`}
            </span>
          </div>

          {/* Low capacity indicator */}
          {isLowCapacity && (
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-600 text-white shadow-sm">
              <span>Only {event.remainingTickets} spots left</span>
            </div>
          )}

          {isSoldOut && (
            <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center">
              <span className="px-3 py-1 rounded-md bg-rose-600 text-white text-xs font-bold uppercase tracking-wider">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            {/* Date & Time */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>{formattedDate} • {formattedTime}</span>
            </div>

            {/* Title */}
            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
              {event.title}
            </h3>

            {/* Venue Location */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{event.venue}, {event.location}</span>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            {/* Organizer */}
            <div className="flex items-center gap-2">
              {event.organizerAvatar ? (
                <img
                  src={event.organizerAvatar}
                  alt={event.organizerName}
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                  {event.organizerName ? event.organizerName[0] : 'O'}
                </div>
              )}
              <span className="text-slate-600 truncate max-w-[120px] font-medium">
                {event.organizerName}
              </span>
            </div>

            {/* CTA action */}
            <span className="inline-flex items-center gap-1 font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
              <span>View Event</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
};
