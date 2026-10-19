import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  ShieldAlert, 
  Users, 
  Calendar, 
  Ticket, 
  CheckCircle2, 
  Activity, 
  Search, 
  Check, 
  X,
  Server,
  Clock,
  Building2,
  GraduationCap,
  Mail,
  Phone,
  Globe,
  RefreshCw,
  UserCheck,
  UserX,
  AlertTriangle,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { api } from '../services/api';

export const AdminDashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') || 'users';

  const [activeTab, setActiveTab] = useState<'approvals' | 'users' | 'telemetry'>(
    activeTabParam === 'approvals' ? 'approvals' : activeTabParam === 'telemetry' ? 'telemetry' : 'users'
  );

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrganizers: 0,
    totalEvents: 0,
    totalBookings: 0,
    totalTickets: 0,
    totalCheckIns: 0,
  });

  // Organizer Applications State
  const [applications, setApplications] = useState<any[]>([]);
  const [applicationFilter, setApplicationFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [applicationCounts, setApplicationCounts] = useState({ PENDING: 0, APPROVED: 0, REJECTED: 0, ALL: 0 });
  const [isLoadingApps, setIsLoadingApps] = useState<boolean>(true);

  // Dialog State
  const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null);
  const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Users Management State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'users' || tab === 'approvals' || tab === 'telemetry') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'approvals' | 'users' | 'telemetry') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/analytics');
      if (res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (e) {
      console.error('Failed to fetch admin stats:', e);
    }
  };

  const fetchApplications = async () => {
    setIsLoadingApps(true);
    try {
      const res = await api.get(`/admin/organizer-applications?status=${applicationFilter}`);
      if (res.data?.success) {
        setApplications(res.data.applications);
        if (res.data.counts) {
          setApplicationCounts(res.data.counts);
        }
      }
    } catch (e: any) {
      toast.error('Failed to fetch organizer applications.');
    } finally {
      setIsLoadingApps(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const params = new URLSearchParams();
      if (userSearch.trim()) params.append('search', userSearch.trim());
      if (userRoleFilter !== 'ALL') params.append('role', userRoleFilter);

      const res = await api.get(`/admin/users?${params.toString()}`);
      if (res.data?.success) {
        setUsersList(res.data.users);
      }
    } catch (e) {
      toast.error('Failed to load user directory.');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [applicationFilter]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, userRoleFilter]);

  // Handle Approve Application
  const handleApprove = async (id: string) => {
    setIsActionLoading(true);
    try {
      const res = await api.post(`/admin/organizer-applications/${id}/approve`);
      if (res.data?.success) {
        toast.success(res.data.message || 'Organizer application approved successfully!');
        setConfirmApproveId(null);
        fetchApplications();
        fetchStats();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve application.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Reject Application
  const handleReject = async (id: string) => {
    setIsActionLoading(true);
    try {
      const res = await api.post(`/admin/organizer-applications/${id}/reject`, {
        reason: rejectionReason.trim() || undefined,
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Application rejected.');
        setConfirmRejectId(null);
        setRejectionReason('');
        fetchApplications();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject application.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Direct Role Change in User Directory
  const handleRoleChange = async (userId: string, newRole: 'ATTENDEE' | 'ORGANIZER') => {
    try {
      const res = await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data?.success) {
        toast.success(`User role updated to ${newRole}`);
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        fetchStats();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update user role.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Platform Administration & Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
            Admin Control Center
          </h1>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Role Guard & Gate Services Active</span>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#171723] border border-white/5 space-y-1">
          <p className="text-xs font-semibold text-slate-400">Total Users</p>
          <p className="text-2xl font-extrabold text-white">{stats.totalUsers}</p>
          <p className="text-[11px] text-purple-400">Registered Accounts</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#171723] border border-white/5 space-y-1">
          <p className="text-xs font-semibold text-slate-400">Organizers</p>
          <p className="text-2xl font-extrabold text-cyan-400">{stats.totalOrganizers}</p>
          <p className="text-[11px] text-slate-400">Event Hosts</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#171723] border border-white/5 space-y-1">
          <p className="text-xs font-semibold text-slate-400">Pending Requests</p>
          <p className="text-2xl font-extrabold text-amber-400">{applicationCounts.PENDING}</p>
          <p className="text-[11px] text-amber-400/80">Awaiting Review</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#171723] border border-white/5 space-y-1">
          <p className="text-xs font-semibold text-slate-400">Total Events</p>
          <p className="text-2xl font-extrabold text-white">{stats.totalEvents}</p>
          <p className="text-[11px] text-slate-400">Published</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#171723] border border-white/5 space-y-1">
          <p className="text-xs font-semibold text-slate-400">Passes Booked</p>
          <p className="text-2xl font-extrabold text-purple-400">{stats.totalBookings}</p>
          <p className="text-[11px] text-slate-400">Confirmed</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#171723] border border-white/5 space-y-1">
          <p className="text-xs font-semibold text-slate-400">QR Check-ins</p>
          <p className="text-2xl font-extrabold text-emerald-400">{stats.totalCheckIns}</p>
          <p className="text-[11px] text-emerald-400 font-semibold">Gate Scanned</p>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex border-b border-white/10 gap-2 sm:gap-4 text-xs font-bold">
        <button
          onClick={() => handleTabChange('users')}
          className={`flex items-center gap-2 pb-3 px-3 transition-colors relative ${
            activeTab === 'users'
              ? 'text-cyan-400 border-b-2 border-cyan-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User & Organizer Directory</span>
        </button>

        <button
          onClick={() => handleTabChange('telemetry')}
          className={`flex items-center gap-2 pb-3 px-3 transition-colors relative ${
            activeTab === 'telemetry'
              ? 'text-emerald-400 border-b-2 border-emerald-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Platform Telemetry & Stats</span>
        </button>

        <button
          onClick={() => handleTabChange('approvals')}
          className={`flex items-center gap-2 pb-3 px-3 transition-colors relative ${
            activeTab === 'approvals'
              ? 'text-purple-400 border-b-2 border-purple-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Applications Archive</span>
          {applicationCounts.PENDING > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {applicationCounts.PENDING}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ORGANIZER APPROVALS */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          {/* Sub-Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#171723] border border-white/10 text-xs">
              {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setApplicationFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    applicationFilter === filter
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {filter === 'ALL' ? 'All Requests' : filter.charAt(0) + filter.slice(1).toLowerCase()}
                  {filter !== 'ALL' && (
                    <span className="ml-1.5 text-[10px] opacity-80">
                      ({applicationCounts[filter] || 0})
                    </span>
                  )}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchApplications}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh Requests
            </Button>
          </div>

          {/* Loading Skeletons */}
          {isLoadingApps && (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 rounded-2xl bg-[#171723] border border-white/5 space-y-3 animate-pulse">
                  <div className="h-6 w-1/4 bg-white/10 rounded" />
                  <div className="h-4 w-1/2 bg-white/5 rounded" />
                  <div className="h-16 bg-white/5 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoadingApps && applications.length === 0 && (
            <div className="p-12 text-center rounded-2xl bg-[#171723]/60 border border-dashed border-white/10 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-white">No applications found</h3>
              <p className="text-xs text-slate-400">
                {applicationFilter === 'PENDING'
                  ? 'All organizer applications have been reviewed. Zero pending requests.'
                  : `No ${applicationFilter.toLowerCase()} applications to display.`}
              </p>
            </div>
          )}

          {/* Applications Grid */}
          {!isLoadingApps && applications.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              {applications.map((app) => (
                <Card
                  key={app.id}
                  className="p-6 bg-[#171723] border-white/10 hover:border-purple-500/30 transition-all space-y-5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-white">{app.organizationName}</h3>
                          <Badge
                            variant={
                              app.status === 'APPROVED'
                                ? 'success'
                                : app.status === 'REJECTED'
                                ? 'danger'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {app.status}
                          </Badge>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/5 text-slate-300">
                            {app.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                          <span>{app.collegeOrOrg}</span>
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons for PENDING */}
                    {app.status === 'PENDING' && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmRejectId(app.id)}
                          leftIcon={<X className="w-3.5 h-3.5 text-rose-400" />}
                          className="hover:border-rose-500/40 text-rose-300"
                        >
                          Reject
                        </Button>
                        <Button
                          variant="gradient"
                          size="sm"
                          onClick={() => setConfirmApproveId(app.id)}
                          leftIcon={<Check className="w-3.5 h-3.5" />}
                        >
                          Approve Organizer
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-[#11111B] border border-white/5 space-y-1">
                      <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-purple-400" /> Applicant
                      </span>
                      <p className="font-semibold text-white">{app.user?.name}</p>
                      <p className="text-[11px] text-slate-400">{app.user?.email}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#11111B] border border-white/5 space-y-1">
                      <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-purple-400" /> Direct Contact
                      </span>
                      <p className="font-semibold text-white">{app.contactPhone}</p>
                      <p className="text-[11px] text-slate-400 truncate">{app.contactEmail}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#11111B] border border-white/5 space-y-1">
                      <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-purple-400" /> Timeline
                      </span>
                      <p className="font-semibold text-white">
                        Applied {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                      {app.reviewedAt && (
                        <p className="text-[11px] text-slate-400">
                          Reviewed by {app.reviewedBy?.name || 'Admin'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Rationale */}
                  <div className="p-3.5 rounded-xl bg-[#11111B] border border-white/5 text-xs space-y-1">
                    <span className="text-slate-400 font-semibold text-[11px]">Proposed Events & Mission:</span>
                    <p className="text-slate-200 leading-relaxed italic">"{app.reason}"</p>
                  </div>

                  {/* Website link if present */}
                  {app.website && (
                    <div className="flex items-center gap-2 text-xs text-cyan-400">
                      <Globe className="w-3.5 h-3.5" />
                      <a href={app.website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                        {app.website}
                      </a>
                    </div>
                  )}

                  {/* Rejection Note if rejected */}
                  {app.status === 'REJECTED' && app.rejectionReason && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-0.5">
                      <span className="text-rose-400 font-bold uppercase text-[10px]">Rejection Reason:</span>
                      <p className="text-rose-200">{app.rejectionReason}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <Card className="p-6 bg-[#171723] border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex-1 w-full sm:max-w-md">
                <Input
                  placeholder="Search users by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  leftIcon={<Search className="w-4 h-4 text-purple-400" />}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="bg-[#11111B] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">All Roles</option>
                  <option value="ATTENDEE">Attendees</option>
                  <option value="ORGANIZER">Organizers</option>
                  <option value="ADMIN">Admins</option>
                </select>

                <Button variant="outline" size="sm" onClick={fetchUsers}>
                  Search
                </Button>
              </div>
            </div>

            {/* Users Table */}
            {isLoadingUsers ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading directory...</div>
            ) : usersList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No users match your filter criteria.</div>
            ) : (
              <div className="divide-y divide-white/5 text-xs">
                {usersList.map((u) => (
                  <div key={u.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`}
                        alt={u.name}
                        className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/10"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white text-sm">{u.name}</p>
                          <Badge
                            variant={
                              u.role === 'ADMIN' ? 'warning' : u.role === 'ORGANIZER' ? 'secondary' : 'neutral'
                            }
                            size="sm"
                          >
                            {u.role}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-xs">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-slate-400 text-[11px]">
                      <div>
                        <span>Joined: {new Date(u.createdAt).toLocaleDateString()}</span>
                      </div>
                      {u._count && (
                        <div className="hidden md:flex items-center gap-3">
                          <span>{u._count.bookings} bookings</span>
                          <span>•</span>
                          <span>{u._count.eventsOrganized} hosted</span>
                        </div>
                      )}
                      {u.role !== 'ADMIN' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[11px] h-7 px-2.5 text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/10 border border-cyan-500/20"
                          onClick={() => handleRoleChange(u.id, u.role === 'ORGANIZER' ? 'ATTENDEE' : 'ORGANIZER')}
                        >
                          {u.role === 'ORGANIZER' ? 'Demote to Attendee' : 'Promote to Host'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: TELEMETRY & ENGINES */}
      {activeTab === 'telemetry' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-[#171723] border-white/5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Server className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-sm">Database & Transactions</h3>
              </div>
              <Badge variant="success" size="sm">ONLINE</Badge>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Prisma ORM with strict ACID transactions. Protects ticket capacity, idempotent bookings, and atomic role transitions.
            </p>
          </Card>

          <Card className="p-6 bg-[#171723] border-white/5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Ticket className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">Cryptographic QR Tokens</h3>
              </div>
              <Badge variant="success" size="sm">ACTIVE</Badge>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unpredictable cryptographic 128-bit hex tokens with SHA-256 indexing. Fast gate scanner lookup with zero collisions.
            </p>
          </Card>

          <Card className="p-6 bg-[#171723] border-white/5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Gate Anti-Fraud Guard</h3>
              </div>
              <Badge variant="success" size="sm">ENFORCED</Badge>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Atomic double-scan prevention in PostgreSQL/SQLite transaction guarantees zero replay attacks across multiple simultaneous gate scanners.
            </p>
          </Card>
        </div>
      )}

      {/* Confirmation Modal: Approve Organizer */}
      {confirmApproveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#171723] border border-purple-500/30 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Approve Organizer Request</h3>
                <p className="text-xs text-slate-400">Grant event publishing & gate scanner privileges</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to approve this applicant? Their role will immediately transition to{' '}
              <span className="font-semibold text-purple-400">ORGANIZER</span>, enabling them to publish events and verify passes.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmApproveId(null)}
                disabled={isActionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="gradient"
                size="sm"
                isLoading={isActionLoading}
                onClick={() => handleApprove(confirmApproveId)}
              >
                Confirm & Promote
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reject Organizer */}
      {confirmRejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#171723] border border-rose-500/30 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Decline Application</h3>
                <p className="text-xs text-slate-400">Reject this organizer request with feedback</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Reason for Rejection (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Please provide official club affiliation or department email..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-[#11111B] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setConfirmRejectId(null);
                  setRejectionReason('');
                }}
                disabled={isActionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-rose-500/10 border-rose-500/30 text-rose-400"
                isLoading={isActionLoading}
                onClick={() => handleReject(confirmRejectId)}
              >
                Decline Application
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
