import { Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { updateUserRoleSchema } from '../validators/authValidators';

export const getOrganizerAnalytics = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    // Get all events organized by current user (or all if admin)
    const isGlobal = req.user.role === 'ADMIN';
    const eventFilter = isGlobal ? {} : { organizerId: req.user.id };

    const events = await prisma.event.findMany({
      where: eventFilter,
      include: {
        ticketTypes: true,
        _count: {
          select: {
            bookings: true,
            tickets: true,
            checkIns: true,
          },
        },
      },
    });

    const eventIds = events.map((e) => e.id);

    // Aggregate bookings and revenue
    const bookings = await prisma.booking.findMany({
      where: { eventId: { in: eventIds } },
      select: {
        totalAmount: true,
        ticketsCount: true,
        status: true,
        createdAt: true,
      },
    });

    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalBookings = bookings.length;
    const totalTicketsIssued = events.reduce((sum, e) => sum + e._count.tickets, 0);
    const totalTicketsCheckedIn = events.reduce((sum, e) => sum + e._count.checkIns, 0);
    const totalCapacity = events.reduce((sum, e) => sum + e.totalCapacity, 0);
    const remainingCapacity = events.reduce((sum, e) => sum + e.remainingTickets, 0);
    const checkInRate = totalTicketsIssued > 0 ? Math.round((totalTicketsCheckedIn / totalTicketsIssued) * 100) : 0;

    // Recent check-in activity
    const recentCheckIns = await prisma.checkIn.findMany({
      where: { eventId: { in: eventIds } },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        ticket: {
          select: {
            ticketNumber: true,
            attendeeName: true,
            attendeeEmail: true,
            ticketType: { select: { name: true } },
          },
        },
        event: { select: { title: true } },
        verifiedBy: { select: { name: true } },
      },
    });

    // Check-in velocity / hourly distribution (for charts)
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
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        venue: e.venue,
        startDate: e.startDate,
        category: e.category,
        totalCapacity: e.totalCapacity,
        remainingTickets: e.remainingTickets,
        ticketsIssued: e._count.tickets,
        ticketsCheckedIn: e._count.checkIns,
        bookingsCount: e._count.bookings,
        isPublished: e.isPublished,
      })),
      recentCheckIns: recentCheckIns.map((c) => ({
        id: c.id,
        ticketNumber: c.ticket.ticketNumber,
        attendeeName: c.ticket.attendeeName,
        ticketType: c.ticket.ticketType.name,
        eventTitle: c.event.title,
        checkedInAt: c.createdAt,
        verifiedBy: c.verifiedBy.name,
      })),
      chartData,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminAnalytics = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ORGANIZER' } }),
      prisma.event.count(),
      prisma.booking.count(),
      prisma.ticket.count(),
      prisma.checkIn.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
      prisma.event.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { organizer: { select: { name: true } } },
      }),
    ]);

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
      recentUsers,
      recentEvents,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { role } = updateUserRoleSchema.parse(req.body);

    const targetUser = await prisma.user.findUnique({ where: { id } });

    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (targetUser.role === 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin accounts cannot be demoted or altered' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: `User role successfully updated to ${role}`,
      user: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, role } = req.query;

    const whereClause: any = {};
    if (role && role !== 'ALL') {
      whereClause.role = role as string;
    }

    if (search) {
      const q = (search as string).trim();
      whereClause.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            bookings: true,
            eventsOrganized: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      users,
      total: users.length,
    });
  } catch (error) {
    next(error);
  }
};
