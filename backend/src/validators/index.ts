import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().optional(),
    role: z.enum(['ADMIN', 'VENDOR', 'CUSTOMER']).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const eventSchema = z.object({
  body: z.object({
    eventName: z.string().min(1, 'Event name is required'),
    eventDate: z.string().min(1, 'Event date is required'),
    eventTime: z.string().optional(),
    venueName: z.string().min(1, 'Venue name is required'),
    venueAddress: z.string().optional(),
    mapLink: z.string().optional(),
    description: z.string().optional(),
    sortOrder: z.number().optional(),
  }),
});

export const rsvpSchema = z.object({
  body: z.object({
    guestName: z.string().min(1, 'Guest name is required'),
    guestEmail: z.string().email().optional().or(z.literal('')),
    guestPhone: z.string().optional(),
    attending: z.boolean().default(true),
    guestCount: z.number().min(1).default(1),
    mealPreference: z.string().optional(),
    message: z.string().optional(),
  }),
});

export const blessingSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    message: z.string().min(1, 'Message is required'),
  }),
});
