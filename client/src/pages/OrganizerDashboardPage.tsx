import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { 
  PlusCircle, 
  Users, 
  Ticket, 
  CheckCircle2, 
  DollarSign, 
  QrCode, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  ArrowUpRight,
  Eye,
  BarChart3
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { MOCK_EVENTS } from '../services/mockEvents';
import { api } from '../services/api';

const VELOCITY_CHART_DATA = [
  { time: '10:00 AM', checkIns: 18, tickets: 45 },
  { time: '12:00 PM', checkIns: 64, tickets: 110 },
  { time: '02:00 PM', checkIns: 142, tickets: 180 },
  { time: '04:00 PM', checkIns: 235, tickets: 250 },
  { time: '06:00 PM', checkIns: 380, tickets: 410 },
  { time: '08:00 PM', checkIns: 468, tickets: 490 },
];

export const OrganizerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [stats, setStats] = useState({
    totalEvents: 3,
    totalBookings: 840,
    ticketsIssued: 920,
    ticketsCheckedIn: 614,
    totalCapacity: 8100,
    totalRevenue: 14200,
  });

  useEffect(() => {
    // Fetch live metrics & organized events from backend
    api.get('/organizer/analytics')
      .then((res) => {
        if (res.data?.stats) {
          setStats(res.data.stats);
        }
        if (res.data?.events && res.data.events.length > 0) {
          setEvents(res.data.events);
        }
      })
      .catch(() => {
        // Fallback to computed mock stats
      });
  }, []);

  const checkInRate = stats.ticketsIssued > 0
    ? Math.round((stats.ticketsCheckedIn / stats.ticketsIssued) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
            SaaS Operations Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
            Organizer Telemetry & Analytics
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/scanner">
            <Button
              variant="outline"
              size="md"
              leftIcon={<QrCode className="w-4 h-4 text-cyan-400" />}
            >
              Launch Gate Scanner
            </Button>
          </Link>
          <Link to="/create-event">
            <Button
              variant="gradient"
              size="md"
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Create New Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-[#171723] border border-white/5 space-y-1">
          <p className="text-xs font-semibold text-slate-400">Total Events</p>
          <p className="text-2xl font-extrabold text-white">{stats.totalEvents}</p>
          <p className="text-[11px] text-purple-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Active & Hosted</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#171723] border border-white/5 space-y-1">
          <p className="text-xs font-semibold text-slate-400">Total Bookings</p>
          <p className="text-2xl font-extrabold text-white">{stats.totalBookings}</p>
          <p className="text-[11px] text-cyan-400">Confirmed orders</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#171723] border border-white/5 space-y-1">
          <p className="text-xs font-semibold text-slate-400">Tickets Issued</p>
          <p className="text-2xl font-extrabold text-white">{stats.ticketsIssued}</p>
          <p className="text-[11px] text-slate-400">Unique QR Passes</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#171723] border border-white/5 space-y-1">
          <p className="text-xs font-semibold text-slate-400">Gate Check-ins</p>
          <p className="text-2xl font-extrabold text-emerald-400">{stats.ticketsCheckedIn}</p>
          <p className="text-[11px] text-emerald-400 font-semibold">{checkInRate}% Throughput</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#171723] border border-white/5 space-y-1">
          <p className="text-xs font-semibold text-slate-400">Total Capacity</p>
          <p className="text-2xl font-extrabold text-white">{stats.totalCapacity}</p>
          <p className="text-[11px] text-slate-400">Venue threshold</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#171723] border border-white/5 space-y-1">
          <p className="text-xs font-semibold text-slate-400">Gross Sales</p>
          <p className="text-2xl font-extrabold text-purple-400">${stats.totalRevenue.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400">Free + Paid tiers</p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Check-In Velocity Stream */}
        <Card className="lg:col-span-2 p-6 bg-[#171723] border-white/5">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h3 className="font-bold text-white text-base">Check-In Velocity & Gate Throughput</h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time attendance telemetry throughout event hours</p>
            </div>
            <Badge variant="primary" size="sm">
              Live Stream
            </Badge>
          </div>

          <div className="h-64 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={VELOCITY_CHART_DATA}>
                <defs>
                  <linearGradient id="colorCheckIns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#11111B',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#F8FAFC'
                  }}
                />
                <Area type="monotone" dataKey="tickets" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorTickets)" name="Tickets Issued" />
                <Area type="monotone" dataKey="checkIns" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorCheckIns)" name="Gate Check-Ins" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Capacity Utilization Progress */}
        <Card className="p-6 bg-[#171723] border-white/5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Capacity Breakdown</h3>
            <p className="text-xs text-slate-400 mt-0.5">Active registration occupancy</p>

            <div className="space-y-4 mt-6">
              {events.slice(0, 3).map((evt) => {
                const booked = evt.totalCapacity - evt.remainingTickets;
                const pct = Math.round((booked / evt.totalCapacity) * 100);
                return (
                  <div key={evt.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-white truncate max-w-[170px]">{evt.title}</span>
                      <span className="font-bold text-purple-400">{pct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#11111B] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {booked} booked of {evt.totalCapacity} capacity ({evt.remainingTickets} left)
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 text-xs text-slate-400 flex items-center justify-between">
            <span>Overall Attendance Rate:</span>
            <span className="font-bold text-emerald-400">{checkInRate}%</span>
          </div>
        </Card>
      </div>

      {/* Events Management Table */}
      <Card className="bg-[#171723] border-white/5 overflow-hidden">
        <div className="p-6 pb-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Your Organized Events</h3>
            <p className="text-xs text-slate-400">Manage live events, view registrations, and access gate scanners</p>
          </div>
          <Link to="/create-event">
            <Button variant="outline" size="sm" leftIcon={<PlusCircle className="w-3.5 h-3.5" />}>
              Add Event
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#11111B] text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-white/5">
              <tr>
                <th className="py-3.5 px-6">Event</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Capacity</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {events.map((evt) => (
                <tr key={evt.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-6 flex items-center gap-3">
                    <img
                      src={evt.bannerUrl}
                      alt={evt.title}
                      className="w-10 h-10 rounded-xl object-cover shrink-0"
                    />
                    <div>
                      <p className="font-bold text-white">{evt.title}</p>
                      <p className="text-slate-400 text-[11px] truncate max-w-[200px]">{evt.venue}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant="neutral" size="sm">
                      {evt.category.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    {new Date(evt.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-bold text-white">{evt.totalCapacity - evt.remainingTickets}</span>
                    <span className="text-slate-500"> / {evt.totalCapacity}</span>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant="success" size="sm">
                      Active
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <Link to={`/events/${evt.id}`}>
                      <button className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5" title="View Public Page">
                        <Eye className="w-4 h-4" />
                      </button>
                    </Link>
                    <Link to="/scanner">
                      <button className="p-1.5 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10" title="Open QR Scanner">
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
