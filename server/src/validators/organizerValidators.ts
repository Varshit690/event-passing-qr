import { z } from 'zod';

export const organizerApplicationSchema = z.object({
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters').max(100),
  collegeOrOrg: z.string().min(2, 'Institution or College name must be at least 2 characters').max(120),
  contactPhone: z.string().min(5, 'Valid contact phone number is required').max(25),
  contactEmail: z.string().email('Valid official contact email is required'),
  category: z.string().default('TECHNOLOGY'),
  reason: z.string().min(10, 'Please provide detailed rationale for becoming an event organizer (min 10 characters)').max(1000),
  website: z.string().optional().or(z.literal('')),
});

export const rejectApplicationSchema = z.object({
  reason: z.string().max(500).optional(),
});
