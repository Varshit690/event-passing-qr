import crypto from 'crypto';
import QRCode from 'qrcode';
import { Booking, Event, Ticket, TicketType } from '../models/index.js';
import { createBookingSchema } from '../validators/bookingValidators.js';

export const createBooking = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required to book tickets.' });
      return;
    }

    const { eventId, items, idempotencyKey } = createBookingSchema.parse(req.body);

    // 1. Idempotency Check: if key provided, check if booking already created
    if (idempotencyKey) {
      const existingBooking = await Booking.findOne({ idempotencyKey }).lean();

      if (existingBooking) {
        const [existingEvent, existingTickets] = await Promise.all([
          Event.findById(existingBooking.eventId).lean(),
          Ticket.find({ bookingId: existingBooking._id.toString() }).lean(),
        ]);

        const ticketsWithQR = await Promise.all(
          existingTickets.map(async (t) => {
            const qrCodeDataUrl = await QRCode.toDataURL(t.qrCodeToken, {
              width: 320,
              margin: 2,
              color: { dark: '#0F172A', light: '#FFFFFF' },
            });
            const { tokenHash, ...safeTicket } = t;
            return { ...safeTicket, id: t._id.toString(), qrCodeDataUrl };
          })
        );

        res.status(200).json({
          success: true,
          message: 'Booking already confirmed (idempotent replay).',
          booking: {
            ...existingBooking,
            id: existingBooking._id.toString(),
            event: existingEvent ? { ...existingEvent, id: existingEvent._id.toString() } : undefined,
            tickets: ticketsWithQR,
          },
        });
        return;
      }
    }

    // 2. Find event by ID, slug, or alias
    const eventSlugMap = {
      'evt-1': 'pulse-neon-fest-2026',
      'evt-2': 'hacknova-2026-global-ai-hackathon',
      'evt-3': 'apex-campus-fest-2026',
    };
    const searchSlug = eventSlugMap[eventId] || eventId;

    const event = await Event.findOne({
      $or: [{ _id: eventId }, { slug: eventId }, { slug: searchSlug }],
    });

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    if (!event.isPublished) {
      res.status(400).json({ success: false, message: 'This event is not published or currently active.' });
      return;
    }

    const eventTicketTypes = await TicketType.find({ eventId: event.id });

    let totalAmount = 0;
    let totalTicketsCount = 0;
    const ticketCreations = [];

    // Validate inventory and prepare ticket creations
    const tierUpdates = [];

    for (const item of items) {
      const ticketTierMap = {
        'tt-1-1': 'Early Bird General Admission',
        'tt-1-2': 'VIP Front Stage & Lounge Pass',
        'tt-2-1': 'Hacker Pass (Free RSVP)',
        'tt-2-2': 'Observer & Showcase Pass',
        'tt-3-1': 'Student Festival Pass (All 3 Days)',
        'tt-3-2': 'Star Night Musical Pass',
      };
      const targetTierName = ticketTierMap[item.ticketTypeId];

      let ticketType = eventTicketTypes.find(
        (tt) =>
          tt.id === item.ticketTypeId ||
          tt._id.toString() === item.ticketTypeId ||
          (targetTierName && tt.name.toLowerCase() === targetTierName.toLowerCase()) ||
          tt.name.toLowerCase() === item.ticketTypeId.toLowerCase()
      );

      if (!ticketType && eventTicketTypes.length > 0) {
        ticketType = eventTicketTypes[0];
      }

      if (!ticketType) {
        res.status(400).json({
          success: false,
          message: `Ticket type ${item.ticketTypeId} not found for this event.`,
        });
        return;
      }

      if (ticketType.remainingQuantity < item.quantity) {
        res.status(400).json({
          success: false,
          message: `Sold out or insufficient capacity for "${ticketType.name}". Only ${ticketType.remainingQuantity} remaining.`,
        });
        return;
      }

      if (item.quantity > ticketType.maxPerUser) {
        res.status(400).json({
          success: false,
          message: `Cannot book more than ${ticketType.maxPerUser} tickets for "${ticketType.name}".`,
        });
        return;
      }

      tierUpdates.push({ id: ticketType.id, quantity: item.quantity });
      totalAmount += ticketType.price * item.quantity;
      totalTicketsCount += item.quantity;

      for (let i = 0; i < item.quantity; i++) {
        const attendeeName =
          item.attendeeNames && item.attendeeNames[i]
            ? item.attendeeNames[i]
            : req.user.name;

        ticketCreations.push({
          ticketTypeId: ticketType.id,
          ticketTypeName: ticketType.name,
          price: ticketType.price,
          attendeeName,
          attendeeEmail: req.user.email,
        });
      }
    }

    // Atomically decrement tier quantities
    for (const update of tierUpdates) {
      const updated = await TicketType.findOneAndUpdate(
        { _id: update.id, remainingQuantity: { $gte: update.quantity } },
        { $inc: { remainingQuantity: -update.quantity } },
        { returnDocument: 'after' }
      );
      if (!updated) {
        res.status(400).json({
          success: false,
          message: 'Sold out or insufficient remaining capacity during checkout.',
        });
        return;
      }
    }

    // Atomically decrement event remainingTickets
    await Event.findOneAndUpdate(
      { _id: event.id, remainingTickets: { $gte: totalTicketsCount } },
      { $inc: { remainingTickets: -totalTicketsCount } }
    );

    // Paid event check
    const isPaidBooking = totalAmount > 0;
    const isPaymentVerified = req.body.paymentConfirmed === true || Boolean(req.body.paymentId);

    if (isPaidBooking && !isPaymentVerified) {
      const pendingBooking = await Booking.create({
        userId: req.user.id,
        eventId: event.id,
        status: 'PENDING',
        totalAmount,
        ticketsCount: totalTicketsCount,
        idempotencyKey: idempotencyKey || undefined,
      });

      res.status(201).json({
        success: true,
        message: 'Booking created. Awaiting payment.',
        booking: {
          ...pendingBooking.toJSON(),
          event: event.toJSON(),
          tickets: [],
        },
      });
      return;
    }

    // Create confirmed booking
    const booking = await Booking.create({
      userId: req.user.id,
      eventId: event.id,
      status: 'CONFIRMED',
      totalAmount,
      ticketsCount: totalTicketsCount,
      idempotencyKey: idempotencyKey || undefined,
    });

    // Create tickets
    const timestampSuffix = Date.now().toString().slice(-6);
    const ticketsToInsert = ticketCreations.map((tc) => {
      const ticketNumber = `TKT-${timestampSuffix}-${Math.floor(1000 + Math.random() * 9000)}`;
      const rawToken = `EVT-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      return {
        ticketNumber,
        bookingId: booking.id,
        eventId: event.id,
        ticketTypeId: tc.ticketTypeId,
        qrCodeToken: rawToken,
        tokenHash,
        status: 'VALID',
        attendeeName: tc.attendeeName,
        attendeeEmail: tc.attendeeEmail,
      };
    });

    const createdTickets = await Ticket.insertMany(ticketsToInsert);

    // Generate QR codes for immediate frontend response
    const ticketsWithQRCodes = await Promise.all(
      createdTickets.map(async (t, idx) => {
        const qrCodeDataUrl = await QRCode.toDataURL(t.qrCodeToken, {
          width: 320,
          margin: 2,
          color: { dark: '#0F172A', light: '#FFFFFF' },
        });
        const tc = ticketCreations[idx];
        const tObj = t.toJSON();
        const { tokenHash, ...safeTicket } = tObj;

        return {
          ...safeTicket,
          ticketTypeName: tc?.ticketTypeName,
          price: tc?.price,
          qrCodeDataUrl,
        };
      })
    );

    res.status(201).json({
      success: true,
      message: 'Tickets booked successfully! Your digital QR passes are ready.',
      booking: {
        ...booking.toJSON(),
        event: event.toJSON(),
        tickets: ticketsWithQRCodes,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyBookings = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const bookings = await Booking.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    const bookingIds = bookings.map((b) => b._id.toString());
    const eventIds = Array.from(new Set(bookings.map((b) => b.eventId)));

    const [events, tickets, ticketTypes] = await Promise.all([
      Event.find({ _id: { $in: eventIds } }).lean(),
      Ticket.find({ bookingId: { $in: bookingIds } }).lean(),
      TicketType.find({ eventId: { $in: eventIds } }).lean(),
    ]);

    const eventMap = new Map(events.map((e) => [e._id.toString(), { ...e, id: e._id.toString() }]));
    const ticketTypeMap = new Map(ticketTypes.map((tt) => [tt._id.toString(), { ...tt, id: tt._id.toString() }]));

    const bookingTicketsMap = new Map();
    tickets.forEach((t) => {
      const bId = t.bookingId;
      if (!bookingTicketsMap.has(bId)) {
        bookingTicketsMap.set(bId, []);
      }
      const tt = ticketTypeMap.get(t.ticketTypeId);
      bookingTicketsMap.get(bId).push({
        ...t,
        id: t._id.toString(),
        ticketType: tt,
        ticketTypeName: tt?.name,
        price: tt?.price ?? 0,
      });
    });

    const formattedBookings = bookings.map((b) => {
      const bId = b._id.toString();
      return {
        ...b,
        id: bId,
        event: eventMap.get(b.eventId),
        tickets: bookingTicketsMap.get(bId) || [],
      };
    });

    res.status(200).json({
      success: true,
      bookings: formattedBookings,
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const booking = await Booking.findById(id).lean();

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    if (booking.userId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Unauthorized to view this booking.' });
      return;
    }

    const [event, tickets] = await Promise.all([
      Event.findById(booking.eventId).lean(),
      Ticket.find({ bookingId: booking._id.toString() }).lean(),
    ]);

    const ticketTypeIds = tickets.map((t) => t.ticketTypeId);
    const ticketTypes = await TicketType.find({ _id: { $in: ticketTypeIds } }).lean();
    const ticketTypeMap = new Map(ticketTypes.map((tt) => [tt._id.toString(), { ...tt, id: tt._id.toString() }]));

    const ticketsWithQR = await Promise.all(
      tickets.map(async (t) => {
        const qrCodeDataUrl = await QRCode.toDataURL(t.qrCodeToken, {
          width: 320,
          margin: 2,
          color: { dark: '#0F172A', light: '#FFFFFF' },
        });
        const tt = ticketTypeMap.get(t.ticketTypeId);
        const { tokenHash, ...safeTicket } = t;
        return {
          ...safeTicket,
          id: t._id.toString(),
          ticketType: tt,
          ticketTypeName: tt?.name,
          price: tt?.price ?? 0,
          qrCodeDataUrl,
        };
      })
    );

    res.status(200).json({
      success: true,
      booking: {
        ...booking,
        id: booking._id.toString(),
        event: event ? { ...event, id: event._id.toString() } : undefined,
        tickets: ticketsWithQR,
      },
    });
  } catch (error) {
    next(error);
  }
};
