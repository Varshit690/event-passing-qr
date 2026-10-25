import { Booking, CheckIn, Event, Ticket, TicketType, User } from '../models/index.js';
import { updateUserRoleSchema } from '../validators/authValidators.js';

export const getOrganizerAnalytics = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const isGlobal = req.user.role === 'ADMIN';
    const eventFilter = isGlobal ? {} : { organizerId: req.user.id };

    const events = await Event.find(eventFilter).lean();
    const eventIds = events.map((e) => e._id.toString());

    // Aggregate counts and bookings per event
    const [bookings, tickets, checkIns, allTicketTypes] = await Promise.all([
      Booking.find({ eventId: { $in: eventIds } })
        .select('totalAmount ticketsCount status createdAt eventId')
        .lean(),
      Ticket.find({ eventId: { $in: eventIds } })
        .select('_id eventId')
        .lean(),
      CheckIn.find({ eventId: { $in: eventIds } })
        .select('_id eventId createdAt ticketId verifiedById')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      TicketType.find({ eventId: { $in: eventIds } }).lean(),
    ]);

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalBookings = bookings.length;
    const totalTicketsIssued = tickets.length;

    // CheckIn count for all events
    const allCheckInsCount = await CheckIn.countDocuments({ eventId: { $in: eventIds } });
    const totalTicketsCheckedIn = allCheckInsCount;
    const totalCapacity = events.reduce((sum, e) => sum + (e.totalCapacity || 0), 0);
    const remainingCapacity = events.reduce((sum, e) => sum + (e.remainingTickets || 0), 0);
    const checkInRate = totalTicketsIssued > 0 ? Math.round((totalTicketsCheckedIn / totalTicketsIssued) * 100) : 0;

    // Calculate per-event stats
    const eventBookingsCountMap = new Map();
    bookings.forEach((b) => {
      const eId = b.eventId;
      eventBookingsCountMap.set(eId, (eventBookingsCountMap.get(eId) || 0) + 1);
    });

    const eventTicketsCountMap = new Map();
    tickets.forEach((t) => {
      const eId = t.eventId;
      eventTicketsCountMap.set(eId, (eventTicketsCountMap.get(eId) || 0) + 1);
    });

    // Populate recent check-ins
    const recentCheckInTicketIds = checkIns.map((c) => c.ticketId);
    const recentCheckInUserIds = checkIns.map((c) => c.verifiedById);

    const [recentTickets, recentStaff] = await Promise.all([
      Ticket.find({ _id: { $in: recentCheckInTicketIds } }).lean(),
      User.find({ _id: { $in: recentCheckInUserIds } }).select('id name').lean(),
    ]);

    const eventMap = new Map(events.map((e) => [e._id.toString(), e]));
    const ticketTypeMap = new Map(allTicketTypes.map((tt) => [tt._id.toString(), tt]));
    const recentTicketMap = new Map(recentTickets.map((t) => [t._id.toString(), t]));
    const recentStaffMap = new Map(recentStaff.map((u) => [u._id.toString(), u]));

    const formattedRecentCheckIns = checkIns.map((c) => {
      const t = recentTicketMap.get(c.ticketId);
      const tt = t ? ticketTypeMap.get(t.ticketTypeId) : null;
      const evt = eventMap.get(c.eventId);
      const staff = recentStaffMap.get(c.verifiedById);

      return {
        id: c._id.toString(),
        ticketNumber: t?.ticketNumber || 'N/A',
        attendeeName: t?.attendeeName || 'Attendee',
        ticketType: tt?.name || 'Standard Pass',
        eventTitle: evt?.title || 'Event',
        checkedInAt: c.createdAt,
        verifiedBy: staff?.name || 'Gate Scanner',
      };
    });

    const chartData = [
      { name: '10:00', checkIns: Math.round(totalTicketsCheckedIn * 0.1), tickets: Math.round(totalTicketsIssued * 0.15) },
      { name: '12:00', checkIns: Math.round(totalTicketsCheckedIn * 0.25), tickets: Math.round(totalTicketsIssued * 0.3) },
      { name: '14:00', checkIns: Math.round(totalTicketsCheckedIn * 0.5), tickets: Math.round(totalTicketsIssued * 0.55) },
      { name: '16:00', checkIns: Math.round(totalTicketsCheckedIn * 0.75), tickets: Math.round(totalTicketsIssued * 0.8) },
      { name: '18:00', checkIns: totalTicketsCheckedIn, tickets: totalTicketsIssued },
    ];

    res.status(200).json({
      success: true,
      stats: {
        totalEvents: events.length,
        totalBookings,
        totalTicketsIssued,
        totalTicketsCheckedIn,
        totalCapacity,
        remainingCapacity,
        totalRevenue,
        checkInRate,
      },
      events: events.map((e) => {
        const eId = e._id.toString();
        const ticketsIssued = eventTicketsCountMap.get(eId) || 0;
        const bookingsCount = eventBookingsCountMap.get(eId) || 0;
        return {
          id: eId,
          title: e.title,
          venue: e.venue,
          startDate: e.startDate,
          category: e.category,
          totalCapacity: e.totalCapacity,
          remainingTickets: e.remainingTickets,
          ticketsIssued,
          ticketsCheckedIn: 0,
          bookingsCount,
          isPublished: e.isPublished,
        };
      }),
      recentCheckIns: formattedRecentCheckIns,
      chartData,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminAnalytics = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalOrganizers,
      totalEvents,
      totalBookings,
      totalTickets,
      totalCheckIns,
      recentUsers,
      recentEvents,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'ORGANIZER' }),
      Event.countDocuments(),
      Booking.countDocuments(),
      Ticket.countDocuments(),
      CheckIn.countDocuments(),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('id name email role createdAt')
        .lean(),
      Event.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('id title organizerId createdAt')
        .lean(),
    ]);

    // Populate organizer names for recentEvents
    const orgIds = Array.from(new Set(recentEvents.map((e) => e.organizerId)));
    const orgs = await User.find({ _id: { $in: orgIds } }).select('id name').lean();
    const orgMap = new Map(orgs.map((o) => [o._id.toString(), o.name]));

    const formattedRecentEvents = recentEvents.map((e) => ({
      ...e,
      id: e._id.toString(),
      organizer: {
        name: orgMap.get(e.organizerId) || 'Organizer',
      },
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalOrganizers,
        totalEvents,
        totalBookings,
        totalTickets,
        totalCheckIns,
      },
      recentUsers: recentUsers.map((u) => ({ ...u, id: u._id.toString() })),
      recentEvents: formattedRecentEvents,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { role } = updateUserRoleSchema.parse(req.body);

    const targetUser = await User.findById(id);

    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (targetUser.role === 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin accounts cannot be demoted or altered' });
      return;
    }

    targetUser.role = role;
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: `User role successfully updated to ${role}`,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        updatedAt: targetUser.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const { search, role } = req.query;

    const query = {};
    if (role && role !== 'ALL') {
      query.role = role;
    }

    if (search) {
      const q = search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .select('id name email role avatarUrl createdAt')
      .lean();

    const userIds = users.map((u) => u._id.toString());

    // Count bookings and events organized per user
    const [userBookings, userEvents] = await Promise.all([
      Booking.find({ userId: { $in: userIds } }).select('userId').lean(),
      Event.find({ organizerId: { $in: userIds } }).select('organizerId').lean(),
    ]);

    const bookingCountMap = new Map();
    userBookings.forEach((b) => {
      bookingCountMap.set(b.userId, (bookingCountMap.get(b.userId) || 0) + 1);
    });

    const eventCountMap = new Map();
    userEvents.forEach((e) => {
      eventCountMap.set(e.organizerId, (eventCountMap.get(e.organizerId) || 0) + 1);
    });

    const formattedUsers = users.map((u) => {
      const uId = u._id.toString();
      return {
        ...u,
        id: uId,
        _count: {
          bookings: bookingCountMap.get(uId) || 0,
          eventsOrganized: eventCountMap.get(uId) || 0,
        },
      };
    });

    res.status(200).json({
      success: true,
      users: formattedUsers,
      total: formattedUsers.length,
    });
  } catch (error) {
    next(error);
  }
};
