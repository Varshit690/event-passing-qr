import { z } from 'zod';

export const ticketTypeInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Ticket type name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  totalQuantity: z.number().int().min(1, 'Quantity must be at least 1'),
  maxPerUser: z.number().int().min(1).max(10).default(4),
});

export const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  shortDescription: z.string().optional(),
  bannerUrl: z.string().url('Banner image URL is required'),
  location: z.string().min(2, 'City/Region is required'),
  venue: z.string().min(2, 'Specific venue is required'),
  category: z.enum([
    'MUSIC',
    'TECHNOLOGY',
    'WORKSHOPS',
    'HACKATHONS',
    'CONFERENCES',
    'COLLEGE_FESTS',
    'SPORTS',
    'ARTS_CULTURE',
  ]),
  startDate: z.string().datetime('Start date must be ISO format'),
  endDate: z.string().datetime('End date must be ISO format'),
  rules: z.array(z.string()).optional(),
  ticketTypes: z.array(ticketTypeInputSchema).min(1, 'At least one ticket tier is required'),
});

export const updateEventSchema = createEventSchema.partial();
