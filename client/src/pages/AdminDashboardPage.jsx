import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  ShieldCheck, 
  Users, 
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
  Phone,
  Globe,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { api } from '../services/api';

export const AdminDashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') || 'users';

  const [activeTab, setActiveTab] = useState(
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
  const [applications, setApplications] = useState([]);
  const [applicationFilter, setApplicationFilter] = useState('PENDING');
  const [applicationCounts, setApplicationCounts] = useState({ PENDING: 0, APPROVED: 0, REJECTED: 0, ALL: 0 });
  const [isLoadingApps, setIsLoadingApps] = useState(true);

  // Dialog State
  const [confirmApproveId, setConfirmApproveId] = useState(null);
  const [confirmRejectId, setConfirmRejectId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Users Management State
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'users' || tab === 'approvals' || tab === 'telemetry') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
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
    } catch (e) {
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
  const handleApprove = async (id) => {
    setIsActionLoading(true);
    try {
      const res = await api.post(`/admin/organizer-applications/${id}/approve`);
      if (res.data?.success) {
        toast.success(res.data.message || 'Organizer application approved successfully!');
        setConfirmApproveId(null);
        fetchApplications();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve application.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Reject Application
  const handleReject = async (id) => {
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
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject application.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Direct Role Change in User Directory
  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data?.success) {
        toast.success(`User role updated to ${newRole}`);
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        fetchStats();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update user role.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Platform Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage user accounts, review organizer applications, and monitor platform health.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>System Operational</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-medium text-slate-500">Total Users</p>
          <p className="text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
          <p className="text-[11px] text-slate-400">Registered</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-medium text-slate-500">Organizers</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalOrganizers}</p>
          <p className="text-[11px] text-slate-400">Approved Hosts</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-medium text-slate-500">Pending Requests</p>
          <p className="text-2xl font-bold text-amber-600">{applicationCounts.PENDING}</p>
          <p className="text-[11px] text-slate-400">Needs Review</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-medium text-slate-500">Total Events</p>
          <p className="text-2xl font-bold text-slate-900">{stats.totalEvents}</p>
          <p className="text-[11px] text-slate-400">Published</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-medium text-slate-500">Passes Booked</p>
          <p className="text-2xl font-bold text-slate-900">{stats.totalBookings}</p>
          <p className="text-[11px] text-slate-400">Completed</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-medium text-slate-500">QR Check-ins</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.totalCheckIns}</p>
          <p className="text-[11px] text-slate-400">Verified at Gate</p>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 text-xs font-bold">
        <button
          onClick={() => handleTabChange('users')}
          className={`flex items-center gap-2 pb-3 px-3 transition-colors border-b-2 ${
            activeTab === 'users'
              ? 'text-blue-600 border-blue-600'
              : 'text-slate-500 border-transparent hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory</span>
        </button>

        <button
          onClick={() => handleTabChange('approvals')}
          className={`flex items-center gap-2 pb-3 px-3 transition-colors border-b-2 ${
            activeTab === 'approvals'
              ? 'text-blue-600 border-blue-600'
              : 'text-slate-500 border-transparent hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Organizer Applications</span>
          {applicationCounts.PENDING > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-semibold">
              {applicationCounts.PENDING}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('telemetry')}
          className={`flex items-center gap-2 pb-3 px-3 transition-colors border-b-2 ${
            activeTab === 'telemetry'
              ? 'text-blue-600 border-blue-600'
              : 'text-slate-500 border-transparent hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>System Information</span>
        </button>
      </div>

      {/* TAB 1: ORGANIZER APPROVALS */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          {/* Sub-Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 border border-slate-200 text-xs">
              {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setApplicationFilter(filter)}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                    applicationFilter === filter
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter === 'ALL' ? 'All' : filter.charAt(0) + filter.slice(1).toLowerCase()}
                  {filter !== 'ALL' && (
                    <span className="ml-1.5 text-[10px] opacity-75">
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
              Refresh
            </Button>
          </div>

          {/* Loading Skeletons */}
          {isLoadingApps && (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 rounded-xl bg-white border border-slate-200 space-y-3 animate-pulse">
                  <div className="h-5 w-1/4 bg-slate-100 rounded" />
                  <div className="h-4 w-1/2 bg-slate-100 rounded" />
                  <div className="h-16 bg-slate-50 rounded-lg" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoadingApps && applications.length === 0 && (
            <div className="p-12 text-center rounded-xl bg-white border border-dashed border-slate-300 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No applications found</h3>
              <p className="text-xs text-slate-500">
                {applicationFilter === 'PENDING'
                  ? 'All organizer applications have been reviewed. No pending requests.'
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
                  className="p-6 bg-white border-slate-200 space-y-5 shadow-sm"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{app.organizationName}</h3>
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
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-600">
                            {app.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                          <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
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
                          leftIcon={<X className="w-3.5 h-3.5 text-rose-500" />}
                          className="hover:border-rose-300 text-rose-600"
                        >
                          Reject
                        </Button>
                        <Button
                          variant="primary"
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
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                      <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-600" /> Applicant
                      </span>
                      <p className="font-semibold text-slate-900">{app.user?.name}</p>
                      <p className="text-[11px] text-slate-500">{app.user?.email}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                      <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-blue-600" /> Direct Contact
                      </span>
                      <p className="font-semibold text-slate-900">{app.contactPhone}</p>
                      <p className="text-[11px] text-slate-500 truncate">{app.contactEmail}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                      <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600" /> Timeline
                      </span>
                      <p className="font-semibold text-slate-900">
                        Applied {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                      {app.reviewedAt && (
                        <p className="text-[11px] text-slate-500">
                          Reviewed by {app.reviewedBy?.name || 'Admin'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Rationale */}
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                    <span className="text-slate-500 font-semibold text-[11px]">Proposed Events & Mission:</span>
                    <p className="text-slate-700 leading-relaxed italic">"{app.reason}"</p>
                  </div>

                  {/* Website link if present */}
                  {app.website && (
                    <div className="flex items-center gap-2 text-xs text-blue-600">
                      <Globe className="w-3.5 h-3.5" />
                      <a href={app.website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                        {app.website}
                      </a>
                    </div>
                  )}

                  {/* Rejection Note if rejected */}
                  {app.status === 'REJECTED' && app.rejectionReason && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs space-y-0.5">
                      <span className="text-rose-700 font-bold uppercase text-[10px]">Rejection Reason:</span>
                      <p className="text-rose-900">{app.rejectionReason}</p>
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
          <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex-1 w-full sm:max-w-md">
                <Input
                  placeholder="Search users by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <div className="p-8 text-center text-xs text-slate-500">Loading directory...</div>
            ) : usersList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No users match your filter criteria.</div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {usersList.map((u) => (
                  <div key={u.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`}
                        alt={u.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 text-sm">{u.name}</p>
                          <Badge
                            variant={
                              u.role === 'ADMIN' ? 'warning' : u.role === 'ORGANIZER' ? 'primary' : 'neutral'
                            }
                            size="sm"
                          >
                            {u.role}
                          </Badge>
                        </div>
                        <p className="text-slate-500 text-xs">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-slate-500 text-[11px]">
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
                          variant="outline"
                          size="sm"
                          className="text-[11px] h-7 px-2.5 text-blue-600 hover:bg-blue-50 border-blue-200"
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

      {/* TAB 3: SYSTEM INFORMATION */}
      {activeTab === 'telemetry' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Server className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Database & Transactions</h3>
              </div>
              <Badge variant="success" size="sm">ACTIVE</Badge>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mongoose transactions and atomic operations manage ticket availability, order records, and user role updates consistently.
            </p>
          </Card>

          <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Ticket className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">QR Code Security</h3>
              </div>
              <Badge variant="success" size="sm">ACTIVE</Badge>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Unique secure pass tokens generated on checkout ensure genuine ticket passes during gate scanning.
            </p>
          </Card>

          <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Check-in Verification</h3>
              </div>
              <Badge variant="success" size="sm">ENFORCED</Badge>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Real-time validation prevents duplicate entry attempts and logs timestamped check-in records per attendee.
            </p>
          </Card>
        </div>
      )}

      {/* Confirmation Modal: Approve Organizer */}
      {confirmApproveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="max-w-md w-full p-6 rounded-xl bg-white border border-slate-200 space-y-5 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Approve Organizer Request</h3>
                <p className="text-xs text-slate-500">Grant event publishing and scanner access</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to approve this applicant? Their role will transition to{' '}
              <span className="font-semibold text-blue-600">ORGANIZER</span>, enabling them to publish events and verify entry passes.
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
                variant="primary"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="max-w-md w-full p-6 rounded-xl bg-white border border-slate-200 space-y-5 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Decline Application</h3>
                <p className="text-xs text-slate-500">Reject this organizer request with feedback</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Reason for Rejection (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Please provide student club details or department email..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
                variant="danger"
                size="sm"
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
