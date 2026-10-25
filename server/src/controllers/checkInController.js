import crypto from 'crypto';
import { CheckIn, Event, EventStaff, Ticket, TicketType, User } from '../models/index.js';
import { verifyQrSchema, redeemQrSchema } from '../validators/checkInValidators.js';

/**
 * Helper to find ticket by raw QR token, token hash, or fallback ticket number
 */
async function findTicketByToken(token) {
  const cleanToken = token.trim();
  const tokenHash = crypto.createHash('sha256').update(cleanToken).digest('hex');

  const ticket = await Ticket.findOne({
    $or: [
      { qrCodeToken: cleanToken },
      { tokenHash: tokenHash },
      { ticketNumber: cleanToken.toUpperCase() },
    ],
  }).lean();

  if (!ticket) return null;

  const [event, ticketType, checkIns] = await Promise.all([
    Event.findById(ticket.eventId)
      .select('id title venue startDate organizerId')
      .lean(),
    TicketType.findById(ticket.ticketTypeId)
      .select('id name price')
      .lean(),
    CheckIn.find({ ticketId: ticket._id.toString() })
      .sort({ createdAt: -1 })
      .limit(1)
      .lean(),
  ]);

  let lastCheckIn = null;
  if (checkIns.length > 0) {
    const verifiedUser = await User.findById(checkIns[0].verifiedById).select('name').lean();
    lastCheckIn = {
      ...checkIns[0],
      id: checkIns[0]._id.toString(),
      verifiedBy: verifiedUser ? { name: verifiedUser.name } : undefined,
    };
  }

  return {
    ...ticket,
    id: ticket._id.toString(),
    event: event ? { ...event, id: event._id.toString() } : null,
    ticketType: ticketType ? { ...ticketType, id: ticketType._id.toString() } : null,
    checkIns: lastCheckIn ? [lastCheckIn] : [],
  };
}

/**
 * Verify Ticket details without mutating state
 */
export const verifyTicket = async (req, res, next) => {
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
        message: `Ticket is for a different event: "${ticket.event?.title || 'Unknown Event'}".`,
        ticket: {
          ticketNumber: ticket.ticketNumber,
          attendeeName: ticket.attendeeName,
          eventTitle: ticket.event?.title,
        },
      });
      return;
    }

    // Check organizer event authorization
    if (req.user && req.user.role === 'ORGANIZER') {
      const isOrganizer = ticket.event?.organizerId === req.user.id;
      let isStaff = false;
      if (!isOrganizer) {
        const staffRecord = await EventStaff.findOne({
          eventId: ticket.eventId,
          userId: req.user.id,
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
          ticketTypeName: ticket.ticketType?.name,
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
        ticketTypeName: ticket.ticketType?.name,
        eventTitle: ticket.event?.title,
        venue: ticket.event?.venue,
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
export const redeemTicket = async (req, res, next) => {
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
        message: `Ticket belongs to "${ticket.event?.title || 'Another Event'}", not this event.`,
      });
      return;
    }

    // Check organizer event authorization
    if (req.user && req.user.role === 'ORGANIZER') {
      const isOrganizer = ticket.event?.organizerId === req.user.id;
      let isStaff = false;
      if (!isOrganizer) {
        const staffRecord = await EventStaff.findOne({
          eventId: ticket.eventId,
          userId: req.user.id,
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
          ticketTypeName: ticket.ticketType?.name,
          checkedInAt: ticket.checkedInAt,
          verifiedBy: lastCheckIn?.verifiedBy?.name,
        },
      });
      return;
    }

    // Atomic update with status condition: only succeeds if status is still 'VALID'
    const now = new Date();
    const updatedTicket = await Ticket.findOneAndUpdate(
      { _id: ticket.id, status: 'VALID' },
      { $set: { status: 'CHECKED_IN', checkedInAt: now } },
      { returnDocument: 'after' }
    );

    if (!updatedTicket) {
      res.status(409).json({
        success: false,
        status: 'ALREADY_USED',
        message: 'Ticket was just verified by another scanner. Entry rejected.',
      });
      return;
    }

    // Record CheckIn audit log
    const checkInLog = await CheckIn.create({
      ticketId: ticket.id,
      eventId: ticket.eventId,
      verifiedById: req.user.id,
      notes: notes || 'Verified via EVENTORA Scanner',
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
        ticketTypeName: ticket.ticketType?.name,
        eventTitle: ticket.event?.title,
        venue: ticket.event?.venue,
        checkedInAt: now,
        verifiedBy: req.user.name,
      },
      checkIn: checkInLog.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};
