import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, 
  Ticket, 
  CheckCircle2, 
  DollarSign, 
  QrCode, 
  Calendar, 
  Eye
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { api } from '../services/api';

export const OrganizerDashboardPage = () => {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalBookings: 0,
    ticketsIssued: 0,
    ticketsCheckedIn: 0,
    totalCapacity: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    // Fetch live metrics & organized events from backend
    api.get('/organizer/analytics')
      .then((res) => {
        if (res.data?.stats) {
          setStats(res.data.stats);
        }
        if (res.data?.events && Array.isArray(res.data.events)) {
          setEvents(res.data.events);
        }
      })
      .catch(() => {
        // Fallback to public events if analytics endpoint unavailable
        api.get('/events').then((res) => {
          if (res.data?.events) {
            setEvents(res.data.events);
          }
        }).catch(() => {});
      });
  }, []);

  const checkInRate = stats.ticketsIssued > 0
    ? Math.round((stats.ticketsCheckedIn / stats.ticketsIssued) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Organizer Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-0.5">
            Event Management Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your campus events, monitor ticket reservations, and verify gate check-ins.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/scanner">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<QrCode className="w-4 h-4 text-slate-600" />}
            >
              Scan Passes
            </Button>
          </Link>
          <Link to="/create-event">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Create Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Total Events</p>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.totalEvents}</p>
          <p className="text-[11px] text-slate-500">Active or past listings</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Tickets Issued</p>
            <Ticket className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.ticketsIssued}</p>
          <p className="text-[11px] text-slate-500">{stats.totalBookings} orders confirmed</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Gate Check-ins</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{stats.ticketsCheckedIn}</p>
          <p className="text-[11px] text-slate-500">{checkInRate}% attendance rate</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Gross Sales</p>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">${stats.totalRevenue.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500">Free & paid ticket tiers</p>
        </div>
      </div>

      {/* Events Capacity & Quick Scanner Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Capacity Breakdown */}
        <Card className="lg:col-span-2 p-5 bg-white border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm">Event Registration Status</h3>
          <p className="text-xs text-slate-500 mt-0.5">Capacity occupancy across active events</p>

          <div className="space-y-4 mt-4">
            {events.slice(0, 3).map((evt) => {
              const booked = evt.totalCapacity - evt.remainingTickets;
              const pct = evt.totalCapacity > 0 ? Math.round((booked / evt.totalCapacity) * 100) : 0;
              return (
                <div key={evt.id} className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-900 truncate max-w-[240px]">{evt.title}</span>
                    <span className="font-bold text-blue-700">{pct}% filled</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>{booked} booked of {evt.totalCapacity} capacity</span>
                    <span>{evt.remainingTickets} spots left</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Quick Scanner Action Card */}
        <Card className="p-5 bg-white border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Gate Pass Verification</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Scan attendees' digital tickets at event entry using your device's camera. Supports instant check-in and duplicate-scan prevention.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
            <Link to="/scanner" className="block">
              <Button variant="primary" size="sm" className="w-full" leftIcon={<QrCode className="w-4 h-4" />}>
                Open QR Scanner
              </Button>
            </Link>
            <p className="text-center text-[11px] text-slate-400">
              Works on mobile and desktop web browsers
            </p>
          </div>
        </Card>
      </div>

      {/* Events Management Table */}
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Your Hosted Events</h3>
            <p className="text-xs text-slate-500">Manage listings, view capacity, and access door check-in</p>
          </div>
          <Link to="/create-event">
            <Button variant="outline" size="sm" leftIcon={<PlusCircle className="w-3.5 h-3.5" />}>
              Add Event
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">Event</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-5 flex items-center gap-3">
                    <img
                      src={evt.bannerUrl}
                      alt={evt.title}
                      className="w-10 h-10 rounded-lg object-cover shrink-0 ring-1 ring-slate-200"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">{evt.title}</p>
                      <p className="text-slate-500 text-[11px] truncate max-w-[200px]">{evt.venue}</p>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant="neutral" size="sm">
                      {evt.category ? evt.category.replace('_', ' ') : ''}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    {new Date(evt.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900">{evt.totalCapacity - evt.remainingTickets}</span>
                    <span className="text-slate-400"> / {evt.totalCapacity}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant="success" size="sm">
                      Active
                    </Badge>
                  </td>
                  <td className="py-3.5 px-5 text-right space-x-1.5">
                    <Link to={`/events/${evt.id}`}>
                      <button className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors" title="View Public Page">
                        <Eye className="w-4 h-4" />
                      </button>
                    </Link>
                    <Link to="/scanner">
                      <button className="p-1.5 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors" title="Open QR Scanner">
                        <QrCode className="w-4 h-4" />
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
