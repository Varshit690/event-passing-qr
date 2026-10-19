import { z } from 'zod';

export const bookingItemSchema = z.object({
  ticketTypeId: z.string().min(1, 'Ticket type ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(10, 'Maximum 10 tickets per order'),
  attendeeNames: z.array(z.string().min(1)).optional(),
});

export const createBookingSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  items: z.array(bookingItemSchema).min(1, 'At least 1 ticket selection is required'),
  idempotencyKey: z.string().optional(),
});
