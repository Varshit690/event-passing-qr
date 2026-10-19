import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting EVENTORA database seeding...');

  // Clean existing records in reverse dependency order
  await prisma.checkIn.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.eventStaff.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // 1. Create Users
  const attendee = await prisma.user.create({
    data: {
      name: 'Alex Rivera',
      email: 'alex@eventora.io',
      passwordHash,
      role: 'ATTENDEE',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    },
  });

  const organizer = await prisma.user.create({
    data: {
      name: 'Sarah Chen (Neon Wave)',
      email: 'organizer@eventora.io',
      passwordHash,
      role: 'ORGANIZER',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: 'David Vance (Platform Admin)',
      email: 'admin@eventora.io',
      passwordHash,
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    },
  });

  console.log('✅ Created demo users (Attendee, Organizer, Admin)');

  // 2. Create Events with Ticket Types
  const event1 = await prisma.event.create({
    data: {
      title: 'Pulse Neon Fest 2026: Electronic Music Summit',
      slug: 'pulse-neon-fest-2026',
      description: 'Immerse yourself in 12 hours of non-stop cutting-edge electronic audio-visual performance across 3 stages. Featuring world-renowned synthwave and progressive house artists, laser choreography, interactive art installations, and curated gourmet food trucks.',
      shortDescription: 'The biggest electronic music and visual experience of the season with top headliners.',
      bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
      location: 'San Francisco, CA',
      venue: 'Pier 48 Waterfront Pavilion',
      category: 'MUSIC',
      startDate: new Date('2026-11-14T18:00:00Z'),
      endDate: new Date('2026-11-15T04:00:00Z'),
      organizerId: organizer.id,
      totalCapacity: 2500,
      remainingTickets: 184,
      minPrice: 0,
      isFeatured: true,
      isTrending: true,
      isPublished: true,
      rules: JSON.stringify([
        'Valid government or student ID required at entry QR checkpoint.',
        'Strictly 18+ event. Wristbands provided at security.',
        'No professional recording equipment or external liquids permitted.',
      ]),
      ticketTypes: {
        create: [
          {
            name: 'Early Bird General Admission',
            description: 'Full stage access, neon welcome kit, and immersive audiovisual areas.',
            price: 0,
            totalQuantity: 1000,
            remainingQuantity: 42,
            maxPerUser: 2,
          },
          {
            name: 'VIP Front Stage & Lounge Pass',
            description: 'Priority fast-track entry, elevated VIP lounge, private bar, and artist signing.',
            price: 49,
            totalQuantity: 300,
            remainingQuantity: 65,
            maxPerUser: 4,
          },
        ],
      },
    },
    include: {
      ticketTypes: true,
    },
  });

  const event2 = await prisma.event.create({
    data: {
      title: 'HackNova 2026: 36-Hour Global AI Hackathon',
      slug: 'hacknova-2026-global-ai-hackathon',
      description: 'Build the next generation of autonomous intelligent agents, multi-modal LLM applications, and decentralized infra. $50,000 in bounties, mentorship from Silicon Valley founders, and direct fast-track interviews.',
      shortDescription: 'Build next-gen autonomous agents & apps. $50,000 prizes + venture scouts.',
      bannerUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
      location: 'Austin, TX',
      venue: 'Innovation Hub & Labs, Tech Ridge',
      category: 'HACKATHONS',
      startDate: new Date('2026-11-20T09:00:00Z'),
      endDate: new Date('2026-11-21T21:00:00Z'),
      organizerId: organizer.id,
      totalCapacity: 600,
      remainingTickets: 88,
      minPrice: 0,
      isFeatured: true,
      isTrending: true,
      isPublished: true,
      rules: JSON.stringify([
        'Teams of 1 to 4 members. Pre-formed or match up at kickoff.',
        'All code must be written during the competition window.',
      ]),
      ticketTypes: {
        create: [
          {
            name: 'Hacker Pass (Free RSVP)',
            description: 'Includes 36hr lab access, swag pack, 4 catered meals, coffee & cloud API credits.',
            price: 0,
            totalQuantity: 500,
            remainingQuantity: 64,
            maxPerUser: 1,
          },
          {
            name: 'Observer & Showcase Pass',
            description: 'Access to keynote opening, mentor panels, and Sunday final project demo hall.',
            price: 15,
            totalQuantity: 100,
            remainingQuantity: 24,
            maxPerUser: 2,
          },
        ],
      },
    },
    include: {
      ticketTypes: true,
    },
  });

  const event3 = await prisma.event.create({
    data: {
      title: 'Apex Campus Fest 2026: Annual Intercollegiate Gala',
      slug: 'apex-campus-fest-2026',
      description: 'Three thrilling days of collegiate competitions, battle of the bands, dramatic arts, robotics arena, and celebrity night concert with participants from over 60 universities.',
      shortDescription: 'The biggest university cultural and technical fiesta with star-studded concert nights.',
      bannerUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
      location: 'Boston, MA',
      venue: 'Apex University Main Amphitheater',
      category: 'COLLEGE_FESTS',
      startDate: new Date('2026-11-28T10:00:00Z'),
      endDate: new Date('2026-11-30T23:00:00Z'),
      organizerId: organizer.id,
      totalCapacity: 5000,
      remainingTickets: 640,
      minPrice: 0,
      isFeatured: true,
      isTrending: true,
      isPublished: true,
      rules: JSON.stringify([
        'College ID card mandatory along with EVENTORA QR ticket.',
        'Re-entry allowed with valid stamp.',
      ]),
      ticketTypes: {
        create: [
          {
            name: 'Student Festival Pass (All 3 Days)',
            description: 'Access to all student competitions, exhibition stalls, and cultural night acts.',
            price: 0,
            totalQuantity: 4000,
            remainingQuantity: 520,
            maxPerUser: 2,
          },
          {
            name: 'Star Night Musical Pass',
            description: 'Guaranteed entrance into the main celebrity concert on final day.',
            price: 25,
            totalQuantity: 1000,
            remainingQuantity: 120,
            maxPerUser: 4,
          },
        ],
      },
    },
    include: {
      ticketTypes: true,
    },
  });

  console.log('✅ Created 3 flagship demo events with ticket types');

  // 3. Create Bookings & Real Tickets with Cryptographic QR Tokens
  const booking1 = await prisma.booking.create({
    data: {
      userId: attendee.id,
      eventId: event1.id,
      status: 'CONFIRMED',
      totalAmount: 0,
      ticketsCount: 2,
    },
  });

  const ttEarly = event1.ticketTypes[0];

  // Helper to generate secure QR token and hash
  const generateQRToken = () => {
    const rawToken = 'EVT-' + crypto.randomBytes(16).toString('hex').toUpperCase();
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    return { rawToken, tokenHash };
  };

  const { rawToken: token1, tokenHash: hash1 } = generateQRToken();
  const ticket1 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-2026-001',
      bookingId: booking1.id,
      eventId: event1.id,
      ticketTypeId: ttEarly.id,
      qrCodeToken: token1,
      tokenHash: hash1,
      status: 'VALID',
      attendeeName: 'Alex Rivera',
      attendeeEmail: 'alex@eventora.io',
    },
  });

  const { rawToken: token2, tokenHash: hash2 } = generateQRToken();
  const ticket2 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-2026-002',
      bookingId: booking1.id,
      eventId: event1.id,
      ticketTypeId: ttEarly.id,
      qrCodeToken: token2,
      tokenHash: hash2,
      status: 'VALID',
      attendeeName: 'Jordan Taylor',
      attendeeEmail: 'jordan@example.com',
    },
  });

  // Ticket 3 (Simulated already checked-in for analytics)
  const booking2 = await prisma.booking.create({
    data: {
      userId: attendee.id,
      eventId: event2.id,
      status: 'CONFIRMED',
      totalAmount: 0,
      ticketsCount: 1,
    },
  });

  const { rawToken: token3, tokenHash: hash3 } = generateQRToken();
  const ticket3 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-2026-003',
      bookingId: booking2.id,
      eventId: event2.id,
      ticketTypeId: event2.ticketTypes[0].id,
      qrCodeToken: token3,
      tokenHash: hash3,
      status: 'CHECKED_IN',
      attendeeName: 'Alex Rivera',
      attendeeEmail: 'alex@eventora.io',
      checkedInAt: new Date(),
    },
  });

  await prisma.checkIn.create({
    data: {
      ticketId: ticket3.id,
      eventId: event2.id,
      verifiedById: organizer.id,
      notes: 'Entry Gate 1 - Verified VIP Wristband Issued',
    },
  });

  console.log('✅ Created demo bookings, digital tickets, and check-in logs');
  console.log(`🎫 Demo Ticket 1 Reference: ${ticket1.ticketNumber} (Token: ${ticket1.qrCodeToken})`);
  console.log(`🎫 Demo Ticket 2 Reference: ${ticket2.ticketNumber} (Token: ${ticket2.qrCodeToken})`);
  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
