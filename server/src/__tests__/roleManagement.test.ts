import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../config/db';

const app = createApp();

let adminToken: string;
let adminUserId: string;
let attendeeToken: string;
let attendeeUserId: string;
let attendeeEmail: string;

let secondaryAttendeeToken: string;
let secondaryAttendeeUserId: string;

let createdApplicationId: string;
let createdEventId: string;
let createdTicketTypeId: string;
let attendeeBookedTicketToken: string;
let attendeeBookedTicketId: string;

describe('EVENTORA Admin & Organizer Role Management System Test Suite', () => {
  beforeAll(async () => {
    // Ensure seeded admin exists or authenticate
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });
    if (existingAdmin) {
      adminUserId = existingAdmin.id;
    }
  });

  describe('1 & 2: 3-Portal Registration, Direct Organizer & Login Gateways', () => {
    it('1. Register a fresh attendee account (strictly assigns ATTENDEE)', async () => {
      attendeeEmail = `role_tester_${Date.now()}@example.com`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Sarah Applicant',
          email: attendeeEmail,
          password: 'Password123!',
          role: 'ATTENDEE',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('ATTENDEE');
      expect(res.body.token).toBeDefined();

      attendeeToken = res.body.token;
      attendeeUserId = res.body.user.id;
    });

    it('Arbitrary client role tampering (e.g. claiming ADMIN on public register) is rejected with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Hacker Attempt',
          email: `hacker_${Date.now()}@example.com`,
          password: 'Password123!',
          role: 'ADMIN',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('Direct Organizer Registration: validates required details and creates ORGANIZER without Admin approval', async () => {
      const orgEmail = `direct_org_${Date.now()}@example.com`;
      const res = await request(app)
        .post('/api/auth/register-organizer')
        .send({
          name: 'Direct Tech Host',
          email: orgEmail,
          password: 'Password123!',
          organizationName: 'Global Hackathon League',
          contactPhone: '+1-555-888-9999',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('ORGANIZER');
      expect(res.body.token).toBeDefined();

      // Check DB persistence and linked approved application
      const dbUser = await prisma.user.findUnique({
        where: { email: orgEmail },
        include: { organizerApplications: true },
      });
      expect(dbUser?.role).toBe('ORGANIZER');
      expect(dbUser?.organizerApplications.length).toBeGreaterThanOrEqual(1);
      expect(dbUser?.organizerApplications[0].status).toBe('APPROVED');
    });

    it('Direct Organizer Registration rejects missing organization name or phone', async () => {
      const res = await request(app)
        .post('/api/auth/register-organizer')
        .send({
          name: 'Invalid Host',
          email: `invalid_org_${Date.now()}@example.com`,
          password: 'Password123!',
          organizationName: '', // Missing
          contactPhone: '123', // Too short
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('Register secondary attendee for cross-tenant isolation testing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Isolated Attendee',
          email: `isolated_${Date.now()}@example.com`,
          password: 'Password123!',
        });

      expect(res.status).toBe(201);
      secondaryAttendeeToken = res.body.token;
      secondaryAttendeeUserId = res.body.user.id;
    });

    it('2. Authenticate seeded Admin account', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@eventora.io',
          password: 'password123',
          portal: 'ADMIN',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('ADMIN');
      adminToken = res.body.token;
      adminUserId = res.body.user.id;
    });

    it('Portal Gateway: Attendee attempting to login to Organizer portal is rejected with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: attendeeEmail,
          password: 'Password123!',
          portal: 'ORGANIZER',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Organizer or Admin account is required');
    });

    it('Portal Gateway: Attendee attempting to login to Admin portal is rejected with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: attendeeEmail,
          password: 'Password123!',
          portal: 'ADMIN',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Admin credentials are required');
    });
  });

  describe('3, 4 & 5: Organizer Applications & Duplicate Prevention', () => {
    it('3. Attendee submits an application to become an event organizer', async () => {
      const res = await request(app)
        .post('/api/organizer/apply')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          organizationName: 'Hyperion Robotics Club',
          collegeOrOrg: 'Institute of Advanced Technology',
          contactPhone: '+1-555-019-2834',
          contactEmail: attendeeEmail,
          category: 'TECHNOLOGY',
          reason: 'We are organizing the National Autonomous Drone Sprint and AI Robotics Showcase 2026.',
          website: 'https://hyperion-robotics.org',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.application).toBeDefined();
      expect(res.body.application.status).toBe('PENDING');
      expect(res.body.application.organizationName).toBe('Hyperion Robotics Club');

      createdApplicationId = res.body.application.id;
    });

    it('Attendee can view their pending application status', async () => {
      const res = await request(app)
        .get('/api/organizer/application/status')
        .set('Authorization', `Bearer ${attendeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.application.id).toBe(createdApplicationId);
      expect(res.body.application.status).toBe('PENDING');
      expect(res.body.userRole).toBe('ATTENDEE');
    });

    it('4. Duplicate pending application is rejected with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/organizer/apply')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          organizationName: 'Duplicate Club Attempt',
          collegeOrOrg: 'Institute of Advanced Technology',
          contactPhone: '+1-555-000-1111',
          contactEmail: attendeeEmail,
          reason: 'Second submission should be blocked while first is pending.',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already have an organizer application pending');
    });

    it('5. Unauthorized attendee is blocked from viewing admin applications list with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/organizer-applications')
        .set('Authorization', `Bearer ${attendeeToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Unauthorized attendee is blocked from approving applications with 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/api/admin/organizer-applications/${createdApplicationId}/approve`)
        .set('Authorization', `Bearer ${attendeeToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('6, 7 & 8: Admin Approval & Role Elevation', () => {
    it('Admin can list pending organizer applications', async () => {
      const res = await request(app)
        .get('/api/admin/organizer-applications?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.applications)).toBe(true);

      const found = res.body.applications.find((a: any) => a.id === createdApplicationId);
      expect(found).toBeDefined();
      expect(found.organizationName).toBe('Hyperion Robotics Club');
      expect(found.user.id).toBe(attendeeUserId);
    });

    it('6. Admin approves the organizer application atomically', async () => {
      const res = await request(app)
        .post(`/api/admin/organizer-applications/${createdApplicationId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.application.status).toBe('APPROVED');
      expect(res.body.application.reviewedById).toBe(adminUserId);
      expect(res.body.user.role).toBe('ORGANIZER');
    });

    it('7. Verified: User role in database is elevated to ORGANIZER', async () => {
      const dbUser = await prisma.user.findUnique({
        where: { id: attendeeUserId },
      });
      expect(dbUser?.role).toBe('ORGANIZER');

      const dbApp = await prisma.organizerApplication.findUnique({
        where: { id: createdApplicationId },
      });
      expect(dbApp?.status).toBe('APPROVED');
    });

    it('8. User profile re-query (GET /api/auth/me) reflects ORGANIZER permissions without re-registering', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${attendeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('ORGANIZER');
    });

    it('Approved user cannot submit another application', async () => {
      const res = await request(app)
        .post('/api/organizer/apply')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          organizationName: 'Redundant Club',
          collegeOrOrg: 'College',
          contactPhone: '1234567890',
          contactEmail: attendeeEmail,
          reason: 'Already organizer.',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already holds the ORGANIZER role');
    });
  });

  describe('9 & 10: Role Escalation Guard & Event Creation Permissions', () => {
    it('9. Regular attendee cannot escalate their own role via PATCH /api/admin/users/:id/role (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${secondaryAttendeeUserId}/role`)
        .set('Authorization', `Bearer ${secondaryAttendeeToken}`)
        .send({ role: 'ADMIN' });

      expect(res.status).toBe(403);
    });

    it('Regular attendee cannot create events (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${secondaryAttendeeToken}`)
        .send({
          title: 'Unauthorized Event',
          description: 'This must be blocked.',
          bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819',
          location: 'Austin, TX',
          venue: 'Convention Center',
          category: 'TECHNOLOGY',
          startDate: new Date('2026-11-20T10:00:00Z').toISOString(),
          endDate: new Date('2026-11-20T18:00:00Z').toISOString(),
          ticketTypes: [{ name: 'General', price: 0, totalQuantity: 50 }],
        });

      expect(res.status).toBe(403);
    });

    it('10. Newly approved Organizer can successfully create an event', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          title: `Hyperion Autonomous Drone Sprint ${Date.now()}`,
          description: 'Official national robotics competition and autonomous navigation showcase.',
          shortDescription: 'National autonomous robotics competition.',
          bannerUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e',
          location: 'Seattle, WA',
          venue: 'Hyperion Flight Arena',
          category: 'TECHNOLOGY',
          startDate: new Date('2026-12-10T09:00:00Z').toISOString(),
          endDate: new Date('2026-12-10T19:00:00Z').toISOString(),
          ticketTypes: [
            { name: 'Student Competitor Pass', price: 0, totalQuantity: 100, maxPerUser: 2 },
            { name: 'VIP Spectator Pass', price: 25, totalQuantity: 50, maxPerUser: 2 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.event).toBeDefined();
      expect(res.body.event.organizerId).toBe(attendeeUserId);
      expect(res.body.event.ticketTypes.length).toBe(2);

      createdEventId = res.body.event.id;
      createdTicketTypeId = res.body.event.ticketTypes[0].id;
    });

    it('Newly approved Organizer can access Organizer Analytics dashboard', async () => {
      const res = await request(app)
        .get('/api/organizer/analytics')
        .set('Authorization', `Bearer ${attendeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats.totalEvents).toBeGreaterThanOrEqual(1);
    });
  });

  describe('11, 12, 13 & 14: Ticket Booking, QR Scanning & Ownership Isolation', () => {
    it('11. Secondary attendee books a ticket for the newly created event', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${secondaryAttendeeToken}`)
        .send({
          eventId: createdEventId,
          items: [
            {
              ticketTypeId: createdTicketTypeId,
              quantity: 1,
              attendeeNames: ['Drone Competitor Pass'],
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.booking.status).toBe('CONFIRMED');
      expect(res.body.booking.tickets.length).toBe(1);

      const ticket = res.body.booking.tickets[0];
      attendeeBookedTicketId = ticket.id;
      attendeeBookedTicketToken = ticket.qrCodeToken;
      expect(attendeeBookedTicketToken).toMatch(/^EVT-/);
    });

    it('14. Cross-event rejection: Scanning ticket with wrong eventId returns 400 WRONG_EVENT', async () => {
      // Find a different event
      const otherEvent = await prisma.event.findFirst({
        where: { id: { not: createdEventId } },
      });

      if (otherEvent) {
        const res = await request(app)
          .post('/api/checkin/verify')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            token: attendeeBookedTicketToken,
            eventId: otherEvent.id, // wrong event
          });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('WRONG_EVENT');
      }
    });

    it('12. Authorized Event Organizer verifies ticket at their event gate', async () => {
      const res = await request(app)
        .post('/api/checkin/verify')
        .set('Authorization', `Bearer ${attendeeToken}`) // Event organizer
        .send({
          token: attendeeBookedTicketToken,
          eventId: createdEventId,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('VALID');
      expect(res.body.ticket.status).toBe('VALID');
    });

    it('Authorized Event Organizer redeems ticket (marks CHECKED_IN atomically)', async () => {
      const res = await request(app)
        .post('/api/checkin/redeem')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          token: attendeeBookedTicketToken,
          eventId: createdEventId,
          notes: 'Gate 2 - Verified by Sarah',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('CHECKED_IN');
      expect(res.body.ticket.checkedInAt).toBeDefined();

      // Check DB
      const dbTicket = await prisma.ticket.findUnique({
        where: { id: attendeeBookedTicketId },
      });
      expect(dbTicket?.status).toBe('CHECKED_IN');
    });

    it('13. Duplicate QR rejection: Scanning already used ticket returns 409 ALREADY_USED', async () => {
      const res = await request(app)
        .post('/api/checkin/redeem')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          token: attendeeBookedTicketToken,
          eventId: createdEventId,
        });

      expect(res.status).toBe(409);
      expect(res.body.status).toBe('ALREADY_USED');
      expect(res.body.message).toContain('already used');
    });

    it('Unauthorized Organizer rejection: An unrelated organizer cannot scan passes for another organizer event', async () => {
      // Create another organizer
      const otherOrg = await prisma.user.create({
        data: {
          name: 'Unrelated Host',
          email: `other_org_${Date.now()}@example.com`,
          passwordHash: 'dummyhash',
          role: 'ORGANIZER',
        },
      });

      const jwt = await import('jsonwebtoken');
      const otherOrgToken = jwt.sign(
        { id: otherOrg.id, email: otherOrg.email, role: 'ORGANIZER' },
        process.env.JWT_SECRET || 'development-secret-key-super-secure-change-in-production-2026'
      );

      const res = await request(app)
        .post('/api/checkin/verify')
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .send({
          token: attendeeBookedTicketToken,
          eventId: createdEventId,
        });

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('UNAUTHORIZED_ORGANIZER');
      expect(res.body.message).toContain('not the organizer or assigned staff');
    });
  });

  describe('15. Admin User Directory & Rejection Flow', () => {
    it('Admin can view all users via GET /api/admin/users', async () => {
      const res = await request(app)
        .get('/api/admin/users?role=ORGANIZER')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.users)).toBe(true);

      const found = res.body.users.find((u: any) => u.id === attendeeUserId);
      expect(found).toBeDefined();
      expect(found.role).toBe('ORGANIZER');
    });

    it('Admin can reject an application with feedback rationale', async () => {
      // Submit a dummy application from secondary attendee
      const appRes = await request(app)
        .post('/api/organizer/apply')
        .set('Authorization', `Bearer ${secondaryAttendeeToken}`)
        .send({
          organizationName: 'Incomplete Org',
          collegeOrOrg: 'Some College',
          contactPhone: '5551234567',
          contactEmail: 'secondary@example.com',
          reason: 'Testing rejection workflow with admin feedback note.',
        });

      expect(appRes.status).toBe(201);
      const appId = appRes.body.application.id;

      // Reject it
      const rejectRes = await request(app)
        .post(`/api/admin/organizer-applications/${appId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Please provide official verification letter from college dean.',
        });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.application.status).toBe('REJECTED');
      expect(rejectRes.body.application.rejectionReason).toContain('verification letter');

      // Secondary attendee role remains ATTENDEE
      const dbUser = await prisma.user.findUnique({
        where: { id: secondaryAttendeeUserId },
      });
      expect(dbUser?.role).toBe('ATTENDEE');
    });
  });
});
