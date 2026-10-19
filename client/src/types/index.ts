export type Role = 'ATTENDEE' | 'ORGANIZER' | 'ADMIN';

export type EventCategory =
  | 'MUSIC'
  | 'TECHNOLOGY'
  | 'WORKSHOPS'
  | 'HACKATHONS'
  | 'CONFERENCES'
  | 'COLLEGE_FESTS'
  | 'SPORTS'
  | 'ARTS_CULTURE';

export type TicketStatus = 'VALID' | 'CHECKED_IN' | 'CANCELLED';
export type BookingStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  createdAt: string;
}

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  price: number;
  totalQuantity: number;
  remainingQuantity: number;
  maxPerUser: number;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  bannerUrl: string;
  location: string;
  venue: string;
  category: EventCategory;
  startDate: string;
  endDate: string;
  organizerId: string;
  organizerName: string;
  organizerAvatar?: string;
  totalCapacity: number;
  remainingTickets: number;
  minPrice: number;
  isFeatured: boolean;
  isTrending: boolean;
  isPublished: boolean;
  rules?: string[];
  ticketTypes: TicketType[];
  createdAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  bookingId: string;
  ticketTypeId: string;
  ticketTypeName: string;
  price: number;
  qrCodeToken: string;
  qrCodeDataUrl?: string;
  status: TicketStatus;
  attendeeName: string;
  attendeeEmail: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
  checkedInAt?: string;
}

export interface Booking {
  id: string;
  userId: string;
  eventId: string;
  event?: Event;
  status: BookingStatus;
  totalAmount: number;
  ticketsCount: number;
  createdAt: string;
  tickets: Ticket[];
}
