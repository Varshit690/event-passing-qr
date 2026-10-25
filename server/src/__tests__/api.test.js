import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { seedDatabase } from '../scripts/seed.js';
import { Event, TicketType, Booking, Ticket } from '../models/index.js';

const app = createApp();

let mongoServer;
let attendeeToken;
let organizerToken;
let adminToken;
let userBToken;
let testEventId;
let testTicketTypeId;
let bookedTicketToken;
let bookedTicketId;
let attendeeUserId;

describe('EVENTORA Full-Stack REST API & Security Test Suite', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
      spawn: {
        timeout: 60000,
      },
    });
    await connectDB(mongoServer.getUri());
    await seedDatabase(false);

    const event = await Event.findOne();
    if (event) {
      testEventId = event.id;
      const tt = await TicketType.findOne({ eventId: event.id });
      if (tt) {
        testTicketTypeId = tt.id;
      }
    }
  }, 60000);

  afterAll(async () => {
    await disconnectDB();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe('1. Health Check Endpoint', () => {
    it('GET /api/health should return status UP', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
      expect(res.body.service).toBe('EVENTORA API');
    });
  });

  describe('2. Authentication System & RBAC', () => {
    const testEmail = `attendee_${Date.now()}@example.com`;

    it('POST /api/auth/register should create a new attendee and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Integration Test Attendee',
          email: testEmail,
          password: 'securePassword123',
          role: 'ATTENDEE',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.user.role).toBe('ATTENDEE');

      attendeeToken = res.body.token;
      attendeeUserId = res.body.user.id;
    });

    it('POST /api/auth/register with role ORGANIZER should be rejected (organizer access requires authorization)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Organizer Hopeful',
          email: `organizer_req_${Date.now()}@example.com`,
          password: 'password123',
          role: 'ORGANIZER',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/register with role ADMIN should be rejected (privilege escalation prevention)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Hacker',
          email: `hacker_${Date.now()}@example.com`,
          password: 'password123',
          role: 'ADMIN',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/register should create User B for isolation testing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'User B (Isolated)',
          email: `user_b_${Date.now()}@example.com`,
          password: 'password123',
        });

      expect(res.status).toBe(201);
      userBToken = res.body.token;
    });

    it('POST /api/auth/login should authenticate seeded organizer', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'organizer@eventora.io',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('ORGANIZER');

      organizerToken = res.body.token;
    });

    it('POST /api/auth/login should authenticate seeded admin', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@eventora.io',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('ADMIN');

      adminToken = res.body.token;
    });

    it('POST /api/auth/logout should successfully terminate session and clear cookie', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('POST /api/auth/login with wrong password should return 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'organizer@eventora.io',
          password: 'completelyWrongPassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/auth/me should return authenticated user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${attendeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(testEmail);
    });

    it('GET /api/auth/me without token should return 401 Unauthorized', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('Attendee should be blocked from Organizer analytics with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/organizer/analytics')
        .set('Authorization', `Bearer ${attendeeToken}`);

      expect(res.status).toBe(403);
    });

    it('Attendee and Organizer should be blocked from Admin analytics with 403 Forbidden', async () => {
      const res1 = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${attendeeToken}`);
      expect(res1.status).toBe(403);

      const res2 = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${organizerToken}`);
      expect(res2.status).toBe(403);
    });

    it('Admin can access admin analytics', async () => {
      const res = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Attendee cannot assign roles (privilege escalation blocked)', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${attendeeUserId}/role`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({ role: 'ORGANIZER' });

      expect(res.status).toBe(403);
    });

    it('Admin can promote attendee to organizer via authorized role assignment', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${attendeeUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'ORGANIZER' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('ORGANIZER');

      // Reset back to ATTENDEE for subsequent attendee tests
      await request(app)
        .patch(`/api/admin/users/${attendeeUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'ATTENDEE' });
    });
  });

  describe('3. Event Discovery & Management Permissions', () => {
    it('GET /api/events should return list of published events', async () => {
      const res = await request(app).get('/api/events');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.events)).toBe(true);
      expect(res.body.events.length).toBeGreaterThan(0);
    });

    it('POST /api/events by Attendee should return 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          title: 'Unauthorized Festival',
          description: 'This event should be rejected by role-based guard.',
          bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819',
          location: 'New York, NY',
          venue: 'Grand Central',
          category: 'MUSIC',
          startDate: new Date('2026-12-01T10:00:00Z').toISOString(),
          endDate: new Date('2026-12-01T20:00:00Z').toISOString(),
          ticketTypes: [{ name: 'General', price: 0, totalQuantity: 100 }],
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/events by Organizer should succeed', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Autonomous AI Builders Summit 2026',
          description: 'An exclusive summit for builders creating autonomous agentic systems and tools.',
          shortDescription: 'Exclusive agentic summit for founders.',
          bannerUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d',
          location: 'San Francisco, CA',
          venue: 'Palace of Fine Arts',
          category: 'TECHNOLOGY',
          startDate: new Date('2026-12-15T09:00:00Z').toISOString(),
          endDate: new Date('2026-12-15T18:00:00Z').toISOString(),
          ticketTypes: [
            { name: 'Founder Pass', price: 0, totalQuantity: 50, maxPerUser: 2 },
            { name: 'VIP Pass', price: 40, totalQuantity: 20, maxPerUser: 2 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.event.title).toBe('Autonomous AI Builders Summit 2026');
    });
  });

  describe('4. Ticket Booking & Cryptographic QR Token Generation', () => {
    it('POST /api/bookings should safely book tickets and issue QR passes', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          eventId: testEventId,
          items: [
            {
              ticketTypeId: testTicketTypeId,
              quantity: 1,
              attendeeNames: ['Alex Test Pass Holder'],
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.booking.tickets.length).toBe(1);

      const ticket = res.body.booking.tickets[0];
      expect(ticket.ticketNumber).toBeDefined();
      expect(ticket.qrCodeToken).toMatch(/^EVT-/);
      expect(ticket.status).toBe('VALID');
      expect(ticket.qrCodeDataUrl).toContain('data:image/png;base64');

      bookedTicketToken = ticket.qrCodeToken;
      bookedTicketId = ticket.id;
    });

    it('GET /api/tickets/me should return only tickets belonging to the authenticated user (strict isolation)', async () => {
      // User A (attendeeToken) sees their booked ticket
      const resA = await request(app)
        .get('/api/tickets/me')
        .set('Authorization', `Bearer ${attendeeToken}`);

      expect(resA.status).toBe(200);
      expect(resA.body.success).toBe(true);
      const ticketIds = resA.body.tickets.map((t) => t.id);
      expect(ticketIds).toContain(bookedTicketId);

      // User B (userBToken) receives an empty list and cannot see User A's tickets
      const resB = await request(app)
        .get('/api/tickets/me')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(resB.status).toBe(200);
      expect(resB.body.success).toBe(true);
      expect(resB.body.tickets.length).toBe(0);
    });

    it('GET /api/tickets/:id should reject unauthorized user attempting to access another person\'s ticket with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/tickets/${bookedTicketId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Unauthorized');
    });

    it('POST /api/bookings with quantity exceeding maxPerUser should fail', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          eventId: testEventId,
          items: [
            {
              ticketTypeId: testTicketTypeId,
              quantity: 99,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/bookings for paid tier without payment confirmation should mark PENDING and issue zero tickets', async () => {
      const paidTier = await TicketType.findOne({ price: { $gt: 0 } });

      if (paidTier) {
        const res = await request(app)
          .post('/api/bookings')
          .set('Authorization', `Bearer ${attendeeToken}`)
          .send({
            eventId: paidTier.eventId,
            items: [{ ticketTypeId: paidTier.id, quantity: 1 }],
          });

        expect(res.status).toBe(201);
        expect(res.body.booking.status).toBe('PENDING');
        expect(res.body.booking.tickets.length).toBe(0);
      }
    });
  });

  describe('5. QR Scanner & Gate Verification Protocol', () => {
    it('POST /api/checkin/verify should inspect valid ticket without redeeming', async () => {
      const res = await request(app)
        .post('/api/checkin/verify')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          token: bookedTicketToken,
          eventId: testEventId,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('VALID');
      expect(res.body.ticket.status).toBe('VALID');
    });

    it('POST /api/checkin/redeem should atomically mark ticket as CHECKED_IN', async () => {
      const res = await request(app)
        .post('/api/checkin/redeem')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          token: bookedTicketToken,
          eventId: testEventId,
          notes: 'Main Gate A - Verified',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('CHECKED_IN');
      expect(res.body.ticket.checkedInAt).toBeDefined();
    });

    it('POST /api/checkin/redeem on already used ticket should reject with ALREADY_USED', async () => {
      const res = await request(app)
        .post('/api/checkin/redeem')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          token: bookedTicketToken,
          eventId: testEventId,
        });

      expect(res.status).toBe(409);
      expect(res.body.status).toBe('ALREADY_USED');
      expect(res.body.message).toContain('already used');
    });

    it('POST /api/checkin/verify with fraudulent token should return 404 INVALID', async () => {
      const res = await request(app)
        .post('/api/checkin/verify')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          token: 'EVT-FAKE-FORGED-TOKEN-9999',
        });

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('INVALID');
    });
  });

  describe('6. Booking-to-Ticket-Dashboard Lifecycle & Isolation', () => {
    const freshAttendeeEmail = `flow_attendee_${Date.now()}@example.com`;
    const password = 'StrongPassword123!';
    let freshToken;
    let freshUserId;
    let createdBookingId;
    let createdTicketId;
    let createdTicketNumber;

    it('Step 1: Register a new attendee', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Dashboard Tester',
          email: freshAttendeeEmail,
          password: password,
          role: 'ATTENDEE',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      freshToken = res.body.token;
      freshUserId = res.body.user.id;
    });

    it('Step 2: Log in with credentials to obtain session token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: freshAttendeeEmail,
          password: password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      freshToken = res.body.token;
    });

    it('Step 3: Book one free ticket with valid database ObjectId', async () => {
      const freeTicket = await TicketType.findOne({ price: 0 });
      expect(freeTicket).not.toBeNull();

      const eventIdToUse = freeTicket.eventId;
      const ticketTypeIdToUse = freeTicket.id;

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${freshToken}`)
        .send({
          eventId: eventIdToUse,
          items: [
            {
              ticketTypeId: ticketTypeIdToUse,
              quantity: 1,
              attendeeNames: ['Dashboard Tester Pass'],
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.booking).toBeDefined();
      expect(res.body.booking.status).toBe('CONFIRMED');
      expect(res.body.booking.tickets.length).toBe(1);

      createdBookingId = res.body.booking.id;
      createdTicketId = res.body.booking.tickets[0].id;
      createdTicketNumber = res.body.booking.tickets[0].ticketNumber;
    });

    it('Step 4: Verify the booking and ticket directly exist in the database', async () => {
      const dbBooking = await Booking.findById(createdBookingId);
      const dbTickets = await Ticket.find({ bookingId: createdBookingId });

      expect(dbBooking).not.toBeNull();
      expect(dbBooking?.userId).toBe(freshUserId);
      expect(dbBooking?.status).toBe('CONFIRMED');
      expect(dbTickets.length).toBe(1);

      const dbTicket = dbTickets[0];
      expect(dbTicket?.id).toBe(createdTicketId);
      expect(dbTicket?.status).toBe('VALID');
      expect(dbTicket?.qrCodeToken).toMatch(/^EVT-/);
      expect(dbTicket?.tokenHash).toBeDefined();
    });

    it('Step 5: GET /api/tickets/me retrieves the ticket for My Tickets dashboard', async () => {
      const res = await request(app)
        .get('/api/tickets/me')
        .set('Authorization', `Bearer ${freshToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.tickets)).toBe(true);

      const foundTicket = res.body.tickets.find((t) => t.id === createdTicketId);
      expect(foundTicket).toBeDefined();
      expect(foundTicket.ticketNumber).toBe(createdTicketNumber);
      expect(foundTicket.status).toBe('VALID');
      expect(foundTicket.qrCodeDataUrl).toContain('data:image/png;base64');
      expect(foundTicket.event).toBeDefined();
      expect(foundTicket.ticketType).toBeDefined();
    });

    it('Step 6 & 7: Refresh simulation - GET /api/tickets/me consistently returns the ticket', async () => {
      const res = await request(app)
        .get('/api/tickets/me')
        .set('Authorization', `Bearer ${freshToken}`);

      expect(res.status).toBe(200);
      const foundTicket = res.body.tickets.find((t) => t.id === createdTicketId);
      expect(foundTicket).toBeDefined();
    });

    it('Step 8, 9 & 10: Log out and log back in, ticket remains accessible', async () => {
      await request(app).post('/api/auth/logout');

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: freshAttendeeEmail,
          password: password,
        });

      expect(loginRes.status).toBe(200);
      const reauthenticatedToken = loginRes.body.token;

      const ticketsRes = await request(app)
        .get('/api/tickets/me')
        .set('Authorization', `Bearer ${reauthenticatedToken}`);

      expect(ticketsRes.status).toBe(200);
      const foundTicket = ticketsRes.body.tickets.find((t) => t.id === createdTicketId);
      expect(foundTicket).toBeDefined();
    });

    it('Step 11: Confirm another attendee cannot access this ticket', async () => {
      const resMe = await request(app)
        .get('/api/tickets/me')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(resMe.status).toBe(200);
      const leak = resMe.body.tickets.find((t) => t.id === createdTicketId);
      expect(leak).toBeUndefined();

      const resSingle = await request(app)
        .get(`/api/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(resSingle.status).toBe(403);
    });

    it('Step 12: Verify QR generation and ticket details work for authorized owner', async () => {
      const res = await request(app)
        .get(`/api/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${freshToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.ticket.qrCodeDataUrl).toMatch(/^data:image\/png;base64/);
      expect(res.body.ticket.qrCodeToken).toMatch(/^EVT-/);
    });

    it('Step 13: Gracefully handles invalid event IDs (e.g. "evt-1") without Mongoose CastError 500', async () => {
      // 1. GET /api/events/evt-1 should return 404, not 500
      const getRes = await request(app).get('/api/events/evt-1');
      expect(getRes.status).toBe(404);
      expect(getRes.body.success).toBe(false);

      // 2. POST /api/bookings with invalid eventId should return 404, not CastError 500
      const bookRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${freshToken}`)
        .send({
          eventId: 'evt-1',
          items: [{ ticketTypeId: 'tt-1-1', quantity: 1 }],
        });
      expect(bookRes.status).toBe(404);
      expect(bookRes.body.success).toBe(false);
      expect(bookRes.body.message).toContain('Event not found');
    });
  });
});
