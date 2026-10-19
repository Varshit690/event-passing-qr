import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { createEventSchema, updateEventSchema } from '../validators/eventValidators';
import { AuthenticatedRequest } from '../middleware/auth';

export const getEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      q,
      category,
      location,
      price,
      sort = 'upcoming',
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      isPublished: true,
    };

    if (category && category !== 'ALL') {
      where.category = category as string;
    }

    if (location && location !== 'ALL') {
      where.location = { contains: location as string };
    }

    if (price === 'FREE') {
      where.minPrice = 0;
    } else if (price === 'PAID') {
      where.minPrice = { gt: 0 };
    }

    if (q) {
      const searchStr = q as string;
      where.OR = [
        { title: { contains: searchStr } },
        { description: { contains: searchStr } },
        { venue: { contains: searchStr } },
        { location: { contains: searchStr } },
      ];
    }

    let orderBy: any = { startDate: 'asc' };
    if (sort === 'popular') {
      orderBy = { remainingTickets: 'asc' };
    } else if (sort === 'price-low') {
      orderBy = { minPrice: 'asc' };
    } else if (sort === 'price-high') {
      orderBy = { minPrice: 'desc' };
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          ticketTypes: true,
          organizer: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    // Parse JSON rules if stored as string
    const formattedEvents = events.map((event) => ({
      ...event,
      rules: event.rules ? JSON.parse(event.rules) : [],
      organizerName: event.organizer.name,
      organizerAvatar: event.organizer.avatarUrl,
    }));

    res.status(200).json({
      success: true,
      events: formattedEvents,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const eventSlugMap: Record<string, string> = {
      'evt-1': 'pulse-neon-fest-2026',
      'evt-2': 'hacknova-2026-global-ai-hackathon',
      'evt-3': 'apex-campus-fest-2026',
    };
    const searchSlug = eventSlugMap[id] || id;

    const event: any = await prisma.event.findFirst({
      where: {
        OR: [{ id }, { slug: id }, { slug: searchSlug }],
      },
      include: {
        ticketTypes: true,
        organizer: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });


    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
      return;
    }

    const formattedEvent = {
      ...event,
      rules: event.rules ? JSON.parse(event.rules) : [],
      organizerName: event.organizer.name,
      organizerAvatar: event.organizer.avatarUrl,
    };

    res.status(200).json({
      success: true,
      event: formattedEvent,
    });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const data = createEventSchema.parse(req.body);

    // Generate unique slug
    const baseSlug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    // Calculate capacity and min price from ticket tiers
    const totalCapacity = data.ticketTypes.reduce((sum, tt) => sum + tt.totalQuantity, 0);
    const minPrice = Math.min(...data.ticketTypes.map((tt) => tt.price));

    const event = await prisma.event.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        shortDescription: data.shortDescription,
        bannerUrl: data.bannerUrl,
        location: data.location,
        venue: data.venue,
        category: data.category,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        organizerId: req.user.id,
        totalCapacity,
        remainingTickets: totalCapacity,
        minPrice,
        rules: data.rules ? JSON.stringify(data.rules) : null,
        ticketTypes: {
          create: data.ticketTypes.map((tt) => ({
            name: tt.name,
            description: tt.description,
            price: tt.price,
            totalQuantity: tt.totalQuantity,
            remainingQuantity: tt.totalQuantity,
            maxPerUser: tt.maxPerUser,
          })),
        },
      },
      include: {
        ticketTypes: true,
        organizer: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully.',
      event,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    if (existing.organizerId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Unauthorized to edit this event.' });
      return;
    }

    const data = updateEventSchema.parse(req.body);

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.shortDescription !== undefined && { shortDescription: data.shortDescription }),
        ...(data.bannerUrl && { bannerUrl: data.bannerUrl }),
        ...(data.location && { location: data.location }),
        ...(data.venue && { venue: data.venue }),
        ...(data.category && { category: data.category }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
        ...(data.rules !== undefined && { rules: data.rules ? JSON.stringify(data.rules) : null }),
      },
      include: {
        ticketTypes: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Event updated successfully.',
      event: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    if (existing.organizerId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Unauthorized to delete this event.' });
      return;
    }

    await prisma.event.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
