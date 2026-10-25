import mongoose from 'mongoose';
import { Event, TicketType, User } from '../models/index.js';
import { createEventSchema, updateEventSchema } from '../validators/eventValidators.js';

export const getEvents = async (req, res, next) => {
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

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const query = {
      isPublished: true,
    };

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (location && location !== 'ALL') {
      query.location = { $regex: location, $options: 'i' };
    }

    if (price === 'FREE') {
      query.minPrice = 0;
    } else if (price === 'PAID') {
      query.minPrice = { $gt: 0 };
    }

    if (q) {
      const searchStr = q.trim();
      query.$or = [
        { title: { $regex: searchStr, $options: 'i' } },
        { description: { $regex: searchStr, $options: 'i' } },
        { venue: { $regex: searchStr, $options: 'i' } },
        { location: { $regex: searchStr, $options: 'i' } },
      ];
    }

    let sortOption = { startDate: 1 };
    if (sort === 'popular') {
      sortOption = { remainingTickets: 1 };
    } else if (sort === 'price-low') {
      sortOption = { minPrice: 1 };
    } else if (sort === 'price-high') {
      sortOption = { minPrice: -1 };
    }

    const [events, total] = await Promise.all([
      Event.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Event.countDocuments(query),
    ]);

    // Attach ticketTypes and organizer info
    const eventIds = events.map((e) => e._id.toString());
    const organizerIds = Array.from(new Set(events.map((e) => e.organizerId)));

    const [allTicketTypes, allOrganizers] = await Promise.all([
      TicketType.find({ eventId: { $in: eventIds } }).lean(),
      User.find({ _id: { $in: organizerIds } }).select('id name avatarUrl').lean(),
    ]);

    const organizerMap = new Map(allOrganizers.map((u) => [u._id.toString(), u]));
    const ticketTypeMap = new Map();
    allTicketTypes.forEach((tt) => {
      const eId = tt.eventId;
      if (!ticketTypeMap.has(eId)) {
        ticketTypeMap.set(eId, []);
      }
      ticketTypeMap.get(eId).push({
        ...tt,
        id: tt._id.toString(),
      });
    });

    const formattedEvents = events.map((event) => {
      const eventIdStr = event._id.toString();
      const org = organizerMap.get(event.organizerId);
      const ticketTypes = ticketTypeMap.get(eventIdStr) || [];

      return {
        ...event,
        id: eventIdStr,
        rules: Array.isArray(event.rules)
          ? event.rules
          : typeof event.rules === 'string'
          ? JSON.parse(event.rules)
          : [],
        ticketTypes,
        organizer: org ? { id: org._id.toString(), name: org.name, avatarUrl: org.avatarUrl } : undefined,
        organizerName: org?.name || 'Event Organizer',
        organizerAvatar: org?.avatarUrl,
      };
    });

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

export const getEventById = async (req, res, next) => {
  try {
    const id = req.params.id;

    const eventSlugMap = {
      'evt-1': 'pulse-neon-fest-2026',
      'evt-2': 'hacknova-2026-global-ai-hackathon',
      'evt-3': 'apex-campus-fest-2026',
    };
    const searchSlug = eventSlugMap[id] || id;

    const isMongoId = mongoose.Types.ObjectId.isValid(id);
    const searchConditions = [{ slug: id }, { slug: searchSlug }];
    if (isMongoId) {
      searchConditions.unshift({ _id: id });
    }

    const event = await Event.findOne({
      $or: searchConditions,
    }).lean();

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
      return;
    }

    const eventIdStr = event._id.toString();
    const [ticketTypes, organizer] = await Promise.all([
      TicketType.find({ eventId: eventIdStr }).lean(),
      User.findById(event.organizerId).select('id name email avatarUrl').lean(),
    ]);

    const formattedEvent = {
      ...event,
      id: eventIdStr,
      rules: Array.isArray(event.rules)
        ? event.rules
        : typeof event.rules === 'string'
        ? JSON.parse(event.rules)
        : [],
      ticketTypes: ticketTypes.map((tt) => ({ ...tt, id: tt._id.toString() })),
      organizer: organizer
        ? {
            id: organizer._id.toString(),
            name: organizer.name,
            email: organizer.email,
            avatarUrl: organizer.avatarUrl,
          }
        : undefined,
      organizerName: organizer?.name || 'Event Organizer',
      organizerAvatar: organizer?.avatarUrl,
    };

    res.status(200).json({
      success: true,
      event: formattedEvent,
    });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req, res, next) => {
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

    const event = await Event.create({
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
      rules: data.rules || [],
    });

    const createdTicketTypes = await TicketType.insertMany(
      data.ticketTypes.map((tt) => ({
        eventId: event.id,
        name: tt.name,
        description: tt.description,
        price: tt.price,
        totalQuantity: tt.totalQuantity,
        remainingQuantity: tt.totalQuantity,
        maxPerUser: tt.maxPerUser,
      }))
    );

    const eventObj = event.toJSON();

    res.status(201).json({
      success: true,
      message: 'Event created successfully.',
      event: {
        ...eventObj,
        ticketTypes: createdTicketTypes.map((tt) => tt.toJSON()),
        organizer: {
          id: req.user.id,
          name: req.user.name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const isMongoId = mongoose.Types.ObjectId.isValid(id);
    const existing = await Event.findOne(
      isMongoId ? { $or: [{ _id: id }, { slug: id }] } : { slug: id }
    );
    if (!existing) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    if (existing.organizerId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Unauthorized to edit this event.' });
      return;
    }

    const data = updateEventSchema.parse(req.body);

    const updateFields = {};
    if (data.title) updateFields.title = data.title;
    if (data.description) updateFields.description = data.description;
    if (data.shortDescription !== undefined) updateFields.shortDescription = data.shortDescription;
    if (data.bannerUrl) updateFields.bannerUrl = data.bannerUrl;
    if (data.location) updateFields.location = data.location;
    if (data.venue) updateFields.venue = data.venue;
    if (data.category) updateFields.category = data.category;
    if (data.startDate) updateFields.startDate = new Date(data.startDate);
    if (data.endDate) updateFields.endDate = new Date(data.endDate);
    if (data.rules !== undefined) updateFields.rules = data.rules;

    const updated = await Event.findByIdAndUpdate(existing._id, { $set: updateFields }, { returnDocument: 'after' });
    const ticketTypes = await TicketType.find({ eventId: existing._id.toString() });

    res.status(200).json({
      success: true,
      message: 'Event updated successfully.',
      event: {
        ...(updated?.toJSON() || {}),
        ticketTypes: ticketTypes.map((tt) => tt.toJSON()),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const isMongoId = mongoose.Types.ObjectId.isValid(id);
    const existing = await Event.findOne(
      isMongoId ? { $or: [{ _id: id }, { slug: id }] } : { slug: id }
    );
    if (!existing) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    if (existing.organizerId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Unauthorized to delete this event.' });
      return;
    }

    await Promise.all([
      Event.findByIdAndDelete(existing._id),
      TicketType.deleteMany({ eventId: existing._id.toString() }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
