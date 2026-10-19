import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/db';
import { verifyQrSchema, redeemQrSchema } from '../validators/checkInValidators';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Helper to find ticket by raw QR token, token hash, or fallback ticket number
 */
async function findTicketByToken(token: string) {
  const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

  return await prisma.ticket.findFirst({
    where: {
      OR: [
        { qrCodeToken: token.trim() },
        { tokenHash: tokenHash },
        { ticketNumber: token.trim().toUpperCase() },
      ],
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          venue: true,
          startDate: true,
          organizerId: true,
        },
      },
      ticketType: {
        select: {
          id: true,
          name: true,
          price: true,
        },
      },
      checkIns: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          verifiedBy: {
            select: { name: true },
          },
        },
      },
    },
  });
}

/**
 * Verify Ticket details without mutating state
 */
export const verifyTicket = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, eventId } = verifyQrSchema.parse(req.body);

    const ticket = await findTicketByToken(token);

    if (!ticket) {
      res.status(404).json({
        success: false,
        status: 'INVALID',
        message: 'Invalid ticket pass. No matching ticket found.',
      });
      return;
    }

    // Check if scanned ticket is for the requested event
    if (eventId && ticket.eventId !== eventId) {
      res.status(400).json({
        success: false,
        status: 'WRONG_EVENT',
        message: `Ticket is for a different event: "${ticket.event.title}".`,
        ticket: {
          ticketNumber: ticket.ticketNumber,
          attendeeName: ticket.attendeeName,
          eventTitle: ticket.event.title,
        },
      });
      return;
    }

    // Check organizer event authorization
    if (req.user && req.user.role === 'ORGANIZER') {
      const isOrganizer = ticket.event.organizerId === req.user.id;
      let isStaff = false;
      if (!isOrganizer) {
        const staffRecord = await prisma.eventStaff.findUnique({
          where: {
            eventId_userId: {
              eventId: ticket.eventId,
              userId: req.user.id,
            },
          },
        });
        isStaff = !!staffRecord;
      }

      if (!isOrganizer && !isStaff) {
        res.status(403).json({
          success: false,
          status: 'UNAUTHORIZED_ORGANIZER',
          message: 'Unauthorized. You are not the organizer or assigned staff for this event.',
        });
        return;
      }
    }

    if (ticket.status === 'CANCELLED') {
      res.status(400).json({
        success: false,
        status: 'CANCELLED',
        message: 'This ticket was cancelled or refunded.',
        ticket: {
          ticketNumber: ticket.ticketNumber,
          attendeeName: ticket.attendeeName,
        },
      });
      return;
    }

    if (ticket.status === 'CHECKED_IN') {
      const lastCheckIn = ticket.checkIns[0];
      res.status(409).json({
        success: false,
        status: 'ALREADY_USED',
        message: `Ticket already used at ${ticket.checkedInAt ? new Date(ticket.checkedInAt).toLocaleTimeString() : 'earlier'}.`,
        ticket: {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          attendeeName: ticket.attendeeName,
          ticketTypeName: ticket.ticketType.name,
          checkedInAt: ticket.checkedInAt,
          verifiedBy: lastCheckIn?.verifiedBy?.name,
        },
      });
      return;
    }

    // Valid ticket ready for entry
    res.status(200).json({
      success: true,
      status: 'VALID',
      message: 'Ticket is valid and ready for check-in.',
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        attendeeName: ticket.attendeeName,
        attendeeEmail: ticket.attendeeEmail,
        ticketTypeName: ticket.ticketType.name,
        eventTitle: ticket.event.title,
        venue: ticket.event.venue,
        status: ticket.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Redeem Ticket with ATOMIC double-scan protection
 */
export const redeemTicket = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { token, eventId, notes } = redeemQrSchema.parse(req.body);

    const ticket = await findTicketByToken(token);

    if (!ticket) {
      res.status(404).json({
        success: false,
        status: 'INVALID',
        message: 'Invalid ticket pass. No matching ticket found.',
      });
      return;
    }

    // Event check
    if (eventId && ticket.eventId !== eventId) {
      res.status(400).json({
        success: false,
        status: 'WRONG_EVENT',
        message: `Ticket belongs to "${ticket.event.title}", not this event.`,
      });
      return;
    }

    // Check organizer event authorization
    if (req.user && req.user.role === 'ORGANIZER') {
      const isOrganizer = ticket.event.organizerId === req.user.id;
      let isStaff = false;
      if (!isOrganizer) {
        const staffRecord = await prisma.eventStaff.findUnique({
          where: {
            eventId_userId: {
              eventId: ticket.eventId,
              userId: req.user.id,
            },
          },
        });
        isStaff = !!staffRecord;
      }

      if (!isOrganizer && !isStaff) {
        res.status(403).json({
          success: false,
          status: 'UNAUTHORIZED_ORGANIZER',
          message: 'Unauthorized. You are not the organizer or assigned staff for this event.',
        });
        return;
      }
    }

    if (ticket.status === 'CANCELLED') {
      res.status(400).json({
        success: false,
        status: 'CANCELLED',
        message: 'This ticket was cancelled or voided.',
      });
      return;
    }

    if (ticket.status === 'CHECKED_IN') {
      const lastCheckIn = ticket.checkIns[0];
      res.status(409).json({
        success: false,
        status: 'ALREADY_USED',
        message: `Ticket already used at ${ticket.checkedInAt ? new Date(ticket.checkedInAt).toLocaleTimeString() : 'earlier'}. Entry rejected.`,
        ticket: {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          attendeeName: ticket.attendeeName,
          ticketTypeName: ticket.ticketType.name,
          checkedInAt: ticket.checkedInAt,
          verifiedBy: lastCheckIn?.verifiedBy?.name,
        },
      });
      return;
    }

    // Atomic Redemption within Transaction
    const checkInResult = await prisma.$transaction(async (tx) => {
      // Atomic status check and update: only update if status is still 'VALID'
      const updated = await tx.ticket.updateMany({
        where: {
          id: ticket.id,
          status: 'VALID',
        },
        data: {
          status: 'CHECKED_IN',
          checkedInAt: new Date(),
        },
      });

      if (updated.count === 0) {
        // Was checked in concurrently by another scanner
        throw new Error('ALREADY_USED_CONCURRENT');
      }

      // Record CheckIn audit log
      const checkInLog = await tx.checkIn.create({
        data: {
          ticketId: ticket.id,
          eventId: ticket.eventId,
          verifiedById: req.user!.id,
          notes: notes || 'Verified via EVENTORA Scanner',
        },
      });

      return checkInLog;
    });

    res.status(200).json({
      success: true,
      status: 'CHECKED_IN',
      message: 'Ticket verified successfully! Welcome to the event.',
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        attendeeName: ticket.attendeeName,
        attendeeEmail: ticket.attendeeEmail,
        ticketTypeName: ticket.ticketType.name,
        eventTitle: ticket.event.title,
        venue: ticket.event.venue,
        checkedInAt: new Date(),
        verifiedBy: req.user.name,
      },
      checkIn: checkInResult,
    });
  } catch (error: any) {
    if (error.message === 'ALREADY_USED_CONCURRENT') {
      res.status(409).json({
        success: false,
        status: 'ALREADY_USED',
        message: 'Ticket was just verified by another scanner. Entry rejected.',
      });
      return;
    }
    next(error);
  }
};
