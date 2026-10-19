import { Response, NextFunction } from 'express';
import QRCode from 'qrcode';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const getMyTickets = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        booking: {
          userId: req.user.id,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            bannerUrl: true,
            location: true,
            venue: true,
            startDate: true,
            endDate: true,
            category: true,
          },
        },
        ticketType: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    });

    const ticketsWithQRCodes = await Promise.all(
      tickets.map(async (t) => {
        const qrCodeDataUrl = await QRCode.toDataURL(t.qrCodeToken, {
          width: 300,
          margin: 2,
          color: {
            dark: '#09090F',
            light: '#FFFFFF',
          },
        });
        const { tokenHash, ...safeTicket } = t;
        return {
          ...safeTicket,
          qrCodeDataUrl,
          ticketTypeName: t.ticketType.name,
          price: t.ticketType.price,
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

export const getTicketById = async (
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

    const ticket: any = await prisma.ticket.findFirst({
      where: {
        OR: [{ id }, { ticketNumber: id }, { qrCodeToken: id }],
      },
      include: {
        booking: true,
        event: true,
        ticketType: true,
      },
    });

    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found.' });
      return;
    }

    // Permission check: owner or event organizer or admin
    const isOwner = ticket.booking.userId === req.user.id;
    const isOrganizer = ticket.event.organizerId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isOrganizer && !isAdmin) {
      res.status(403).json({ success: false, message: 'Unauthorized to view this ticket.' });
      return;
    }

    const qrCodeDataUrl = await QRCode.toDataURL(ticket.qrCodeToken, {
      width: 320,
      margin: 2,
    });

    const { tokenHash, ...safeTicket } = ticket;

    res.status(200).json({
      success: true,
      ticket: {
        ...safeTicket,
        qrCodeDataUrl,
        ticketTypeName: ticket.ticketType.name,
        price: ticket.ticketType.price,
      },
    });
  } catch (error) {
    next(error);
  }
};
