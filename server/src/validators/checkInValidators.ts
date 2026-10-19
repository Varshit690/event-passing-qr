import { z } from 'zod';

export const verifyQrSchema = z.object({
  token: z.string().min(1, 'QR pass token or reference code is required'),
  eventId: z.string().optional(),
});

export const redeemQrSchema = z.object({
  token: z.string().min(1, 'QR pass token or reference code is required'),
  eventId: z.string().optional(),
  notes: z.string().max(200).optional(),
});
