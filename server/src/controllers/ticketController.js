import QRCode from 'qrcode';
import { Booking, Event, Ticket, TicketType } from '../models/index.js';

export const getMyTickets = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const userBookings = await Booking.find({ userId: req.user.id }).select('_id').lean();
    const bookingIds = userBookings.map((b) => b._id.toString());

    const tickets = await Ticket.find({ bookingId: { $in: bookingIds } })
      .sort({ createdAt: -1 })
      .lean();

    const eventIds = Array.from(new Set(tickets.map((t) => t.eventId)));
    const ticketTypeIds = Array.from(new Set(tickets.map((t) => t.ticketTypeId)));

    const [events, ticketTypes] = await Promise.all([
      Event.find({ _id: { $in: eventIds } })
        .select('id title bannerUrl location venue startDate endDate category')
        .lean(),
      TicketType.find({ _id: { $in: ticketTypeIds } })
        .select('id name price')
        .lean(),
    ]);

    const eventMap = new Map(events.map((e) => [e._id.toString(), { ...e, id: e._id.toString() }]));
    const ticketTypeMap = new Map(ticketTypes.map((tt) => [tt._id.toString(), { ...tt, id: tt._id.toString() }]));

    const ticketsWithQRCodes = await Promise.all(
      tickets.map(async (t) => {
        const qrCodeDataUrl = await QRCode.toDataURL(t.qrCodeToken, {
          width: 300,
          margin: 2,
          color: {
            dark: '#0F172A',
            light: '#FFFFFF',
          },
        });
        const tt = ticketTypeMap.get(t.ticketTypeId);
        const { tokenHash, ...safeTicket } = t;
        return {
          ...safeTicket,
          id: t._id.toString(),
          event: eventMap.get(t.eventId),
          ticketType: tt,
          ticketTypeName: tt?.name || 'General Admission',
          price: tt?.price ?? 0,
          qrCodeDataUrl,
        };
      })
    );

    res.status(200).json({
      success: true,
      tickets: ticketsWithQRCodes,
    });
  } catch (error) {
    next(error);
  }
};

export const getTicketById = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const ticket = await Ticket.findOne({
      $or: [{ _id: id }, { ticketNumber: id }, { qrCodeToken: id }],
    }).lean();

    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found.' });
      return;
    }

    const [booking, event, ticketType] = await Promise.all([
      Booking.findById(ticket.bookingId).lean(),
      Event.findById(ticket.eventId).lean(),
      TicketType.findById(ticket.ticketTypeId).lean(),
    ]);

    if (!booking || !event) {
      res.status(404).json({ success: false, message: 'Associated event or booking not found.' });
      return;
    }

    // Permission check: owner or event organizer or admin
    const isOwner = booking.userId === req.user.id;
    const isOrganizer = event.organizerId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isOrganizer && !isAdmin) {
      res.status(403).json({ success: false, message: 'Unauthorized to view this ticket.' });
      return;
    }

    const qrCodeDataUrl = await QRCode.toDataURL(ticket.qrCodeToken, {
      width: 320,
      margin: 2,
      color: { dark: '#0F172A', light: '#FFFFFF' },
    });

    const { tokenHash, ...safeTicket } = ticket;

    res.status(200).json({
      success: true,
      ticket: {
        ...safeTicket,
        id: ticket._id.toString(),
        booking: { ...booking, id: booking._id.toString() },
        event: { ...event, id: event._id.toString() },
        ticketType: ticketType ? { ...ticketType, id: ticketType._id.toString() } : undefined,
        ticketTypeName: ticketType?.name || 'General Admission',
        price: ticketType?.price ?? 0,
        qrCodeDataUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};
