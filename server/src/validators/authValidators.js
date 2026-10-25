import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ATTENDEE']).default('ATTENDEE'),
  avatarUrl: z.string().url().optional(),
});

export const registerOrganizerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  organizationName: z.string().min(2, 'Organization or College name is required'),
  contactPhone: z.string().min(7, 'Valid contact phone number is required'),
  avatarUrl: z.string().url().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(1, 'Password is required'),
  portal: z.enum(['ATTENDEE', 'ORGANIZER', 'ADMIN']).optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['ATTENDEE', 'ORGANIZER', 'ADMIN']),
});
