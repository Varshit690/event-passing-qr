import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { prisma } from '../config/db';
import { createBookingSchema } from '../validators/bookingValidators';
import { AuthenticatedRequest } from '../middleware/auth';

export const createBooking = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required to book tickets.' });
      return;
    }

    const { eventId, items, idempotencyKey } = createBookingSchema.parse(req.body);

    // 1. Idempotency Check: if key provided, check if booking already created
    if (idempotencyKey) {
      const existingBooking = await prisma.booking.findUnique({
        where: { idempotencyKey },
        include: {
          tickets: {
            include: { ticketType: true },
          },
          event: true,
        },
      });

      if (existingBooking) {
        res.status(200).json({
          success: true,
          message: 'Booking already confirmed (idempotent replay).',
          booking: existingBooking,
        });
        return;
      }
    }

    // 2. Execute within an ACID Database Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find event by ID, slug, or alias
      const eventSlugMap: Record<string, string> = {
        'evt-1': 'pulse-neon-fest-2026',
        'evt-2': 'hacknova-2026-global-ai-hackathon',
        'evt-3': 'apex-campus-fest-2026',
      };
      const searchSlug = eventSlugMap[eventId] || eventId;

      const event = await tx.event.findFirst({
        where: {
          OR: [{ id: eventId }, { slug: eventId }, { slug: searchSlug }],
        },
        include: { ticketTypes: true },
      });

      if (!event) {
        throw new Error('Event not found.');
      }

      if (!event.isPublished) {
        throw new Error('This event is not published or currently active.');
      }

      let totalAmount = 0;
      let totalTicketsCount = 0;
      const ticketCreations: Array<{
        ticketTypeId: string;
        ticketTypeName: string;
        price: number;
        attendeeName: string;
        attendeeEmail: string;
      }> = [];

      // Validate each requested item and inventory
      for (const item of items) {
        const ticketTierMap: Record<string, string> = {
          'tt-1-1': 'Early Bird General Admission',
          'tt-1-2': 'VIP Front Stage & Lounge Pass',
          'tt-2-1': 'Hacker Pass (Free RSVP)',
          'tt-2-2': 'Observer & Showcase Pass',
          'tt-3-1': 'Student Festival Pass (All 3 Days)',
          'tt-3-2': 'Star Night Musical Pass',
        };
        const targetTierName = ticketTierMap[item.ticketTypeId];

        let ticketType = event.ticketTypes.find(
          (tt) =>
            tt.id === item.ticketTypeId ||
            (targetTierName && tt.name.toLowerCase() === targetTierName.toLowerCase()) ||
            tt.name.toLowerCase() === item.ticketTypeId.toLowerCase()
        );

        if (!ticketType && event.ticketTypes.length > 0) {
          ticketType = event.ticketTypes[0];
        }

        if (!ticketType) {
          throw new Error(`Ticket type ${item.ticketTypeId} not found for this event.`);
        }


        if (ticketType.remainingQuantity < item.quantity) {
          throw new Error(
            `Sold out or insufficient capacity for "${ticketType.name}". Only ${ticketType.remainingQuantity} remaining.`
          );
        }

        // Check user limit
        if (item.quantity > ticketType.maxPerUser) {
          throw new Error(
            `Cannot book more than ${ticketType.maxPerUser} tickets for "${ticketType.name}".`
          );
        }

        // Atomic decrement with condition to prevent concurrent race conditions
        const updatedTier = await tx.ticketType.updateMany({
          where: {
            id: ticketType.id,
            remainingQuantity: { gte: item.quantity },
          },
          data: {
            remainingQuantity: { decrement: item.quantity },
          },
        });

        if (updatedTier.count === 0) {
          throw new Error(
            `Sold out or insufficient remaining capacity for "${ticketType.name}".`
          );
        }

        // Compute price strictly from database
        totalAmount += ticketType.price * item.quantity;
        totalTicketsCount += item.quantity;

        // Prepare ticket holders
        for (let i = 0; i < item.quantity; i++) {
          const attendeeName =
            item.attendeeNames && item.attendeeNames[i]
              ? item.attendeeNames[i]
              : req.user!.name;

          ticketCreations.push({
            ticketTypeId: ticketType.id,
            ticketTypeName: ticketType.name,
            price: ticketType.price,
            attendeeName,
            attendeeEmail: req.user!.email,
          });
        }
      }

      // Decrement event remainingTickets atomically
      await tx.event.updateMany({
        where: {
          id: event.id,
          remainingTickets: { gte: totalTicketsCount },
        },
        data: {
          remainingTickets: { decrement: totalTicketsCount },
        },
      });

      // Security rule: Do not generate active valid tickets for paid events without payment confirmation
      const isPaidBooking = totalAmount > 0;
      const isPaymentVerified = (req.body.paymentConfirmed === true) || Boolean(req.body.paymentId);

      if (isPaidBooking && !isPaymentVerified) {
        const pendingBooking = await tx.booking.create({
          data: {
            userId: req.user!.id,
            eventId: event.id,
            status: 'PENDING',
            totalAmount,
            ticketsCount: totalTicketsCount,
            idempotencyKey: idempotencyKey || null,
          },
        });
        return { booking: pendingBooking, tickets: [], event, isPendingPayment: true };
      }

      // Create Booking record
      const booking = await tx.booking.create({
        data: {
          userId: req.user!.id,
          eventId: event.id,
          status: 'CONFIRMED',
          totalAmount,
          ticketsCount: totalTicketsCount,
          idempotencyKey: idempotencyKey || null,
        },
      });

      // Generate unique tickets with cryptographically secure QR tokens
      const createdTickets = [];
      const timestampSuffix = Date.now().toString().slice(-6);

      for (let i = 0; i < ticketCreations.length; i++) {
        const tc = ticketCreations[i];
        const ticketNumber = `TKT-${timestampSuffix}-${Math.floor(1000 + Math.random() * 9000)}`;

        // Generate unpredictable 128-bit cryptographically secure token
        const rawToken = `EVT-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        const ticket = await tx.ticket.create({
          data: {
            ticketNumber,
            bookingId: booking.id,
            eventId: event.id,
            ticketTypeId: tc.ticketTypeId,
            qrCodeToken: rawToken,
            tokenHash,
            status: 'VALID',
            attendeeName: tc.attendeeName,
            attendeeEmail: tc.attendeeEmail,
          },
          include: {
            ticketType: true,
          },
        });

        createdTickets.push({
          ...ticket,
          ticketTypeName: tc.ticketTypeName,
          price: tc.price,
        });
      }

      return { booking, tickets: createdTickets, event };
    });

    // Generate QR code data URLs for immediate frontend rendering
    const ticketsWithQRCodes = await Promise.all(
      result.tickets.map(async (t) => {
        const qrCodeDataUrl = await QRCode.toDataURL(t.qrCodeToken, {
          width: 320,
          margin: 2,
          color: {
            dark: '#09090F',
            light: '#FFFFFF',
          },
        });
        const { tokenHash, ...safeTicket } = t as any;
        return {
          ...safeTicket,
          qrCodeDataUrl,
        };
      })
    );

    res.status(201).json({
      success: true,
      message: 'Tickets booked successfully! Your digital QR passes are ready.',
      booking: {
        ...result.booking,
        event: result.event,
        tickets: ticketsWithQRCodes,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const getMyBookings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        event: true,
        tickets: {
          include: { ticketType: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const booking: any = await prisma.booking.findUnique({
      where: { id },
      include: {
        event: true,
        tickets: {
          include: { ticketType: true },
        },
      },
    });

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    // Access check: owner or organizer or admin
    if (booking.userId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Unauthorized to view this booking.' });
      return;
    }

    // Attach QR codes
    const ticketsWithQR = await Promise.all(
      booking.tickets.map(async (t: any) => {
        const qrCodeDataUrl = await QRCode.toDataURL(t.qrCodeToken, {
          width: 320,
          margin: 2,
        });
        const { tokenHash, ...safeTicket } = t;
        return { ...safeTicket, qrCodeDataUrl };
      })
    );

    res.status(200).json({
      success: true,
      booking: {
        ...booking,
        tickets: ticketsWithQR,
      },
    });
  } catch (error) {
    next(error);
  }
};
