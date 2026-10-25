import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createApp } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runE2EVerification() {
  console.log('🚀 Starting EVENTORA End-to-End Real MongoDB Atlas Flow Verification...\n');

  // Read credentials strictly from environment variables
  const testEmail = process.env.E2E_TEST_EMAIL?.trim();
  const testPassword = process.env.E2E_TEST_PASSWORD;

  if (!testEmail || !testPassword) {
    console.error('❌ E2E Verification aborted: Missing required test credentials.');
    console.error('   Please define E2E_TEST_EMAIL and E2E_TEST_PASSWORD in your environment or server/.env file.');
    console.error('\nUsage Example (Windows PowerShell):');
    console.error('   $env:E2E_TEST_EMAIL="your_attendee_email@domain.com"');
    console.error('   $env:E2E_TEST_PASSWORD="your_test_password"');
    console.error('   node src/scripts/verifyE2E.js\n');
    process.exit(1);
  }

  await connectDB();
  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`📡 Test server running on ${baseUrl}\n`);

  try {
    // Step 1: Login as attendee using environment credentials
    console.log(`1️⃣ Logging in as attendee (${testEmail})...`);
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const loginData = await loginRes.json();
    if (loginRes.status !== 200 || !loginData.token) {
      throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginData)}`);
    }
    const token = loginData.token;
    console.log('   ✅ Authenticated successfully! Received JWT.\n');

    // Step 2: Fetch events from database
    console.log('2️⃣ Fetching events from GET /api/events...');
    const eventsRes = await fetch(`${baseUrl}/api/events`);
    const eventsData = await eventsRes.json();
    if (eventsRes.status !== 200 || !eventsData.events?.length) {
      throw new Error(`Failed to fetch events: ${JSON.stringify(eventsData)}`);
    }
    const realEvent = eventsData.events[0];
    console.log(`   ✅ Found ${eventsData.events.length} real events in MongoDB Atlas.`);
    console.log(`   📌 Selected Event: "${realEvent.title}"`);
    console.log(`   🆔 Event ObjectId: ${realEvent.id}\n`);

    // Step 3: Fetch event details
    console.log(`3️⃣ Fetching event details from GET /api/events/${realEvent.id}...`);
    const detailsRes = await fetch(`${baseUrl}/api/events/${realEvent.id}`);
    const detailsData = await detailsRes.json();
    if (detailsRes.status !== 200 || !detailsData.event) {
      throw new Error(`Failed to fetch event details: ${JSON.stringify(detailsData)}`);
    }
    const eventDetails = detailsData.event;
    if (!eventDetails.ticketTypes?.length) {
      throw new Error('Event has no ticket types in database!');
    }
    const realTicketType = eventDetails.ticketTypes[0];
    console.log(`   ✅ Event details loaded.`);
    console.log(`   🎫 Selected Tier: "${realTicketType.name}" (Price: $${realTicketType.price})`);
    console.log(`   🆔 TicketType ObjectId: ${realTicketType.id}\n`);

    // Step 4: Checkout & Book Ticket
    console.log(`4️⃣ Booking ticket via POST /api/bookings with real MongoDB ObjectIds...`);
    const bookingPayload = {
      eventId: realEvent.id,
      items: [
        {
          ticketTypeId: realTicketType.id,
          quantity: 1,
          attendeeNames: ['Verified Attendee'],
        },
      ],
      idempotencyKey: `test-idemp-${Date.now()}`,
      paymentConfirmed: true,
    };

    const bookingRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bookingPayload),
    });
    const bookingData = await bookingRes.json();

    if (bookingRes.status !== 201 || !bookingData.booking) {
      throw new Error(`Booking failed with status ${bookingRes.status}: ${JSON.stringify(bookingData)}`);
    }
    const booking = bookingData.booking;
    const ticket = booking.tickets[0];
    console.log('   ✅ Booking CONFIRMED in MongoDB Atlas!');
    console.log(`   🎟️ Booking ID: ${booking.id}`);
    console.log(`   🎫 Ticket Number: ${ticket.ticketNumber}`);
    console.log(`   🔑 QR Code Token: ${ticket.qrCodeToken}`);
    console.log(`   🖼️ QR Code Data URL generated: ${ticket.qrCodeDataUrl.substring(0, 40)}...\n`);

    // Step 5: Verify Ticket in My Tickets
    console.log('5️⃣ Verifying ticket appears on attendee dashboard (GET /api/tickets/me)...');
    const myTicketsRes = await fetch(`${baseUrl}/api/tickets/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const myTicketsData = await myTicketsRes.json();
    const foundTicket = myTicketsData.tickets?.find((t) => t.ticketNumber === ticket.ticketNumber);
    if (!foundTicket) {
      throw new Error('Created ticket was not found in attendee tickets dashboard!');
    }
    console.log(`   ✅ Ticket "${foundTicket.ticketNumber}" successfully retrieved from My Tickets.\n`);

    // Step 6: Verify Graceful Invalid Event ID Handling
    console.log('6️⃣ Testing invalid demo ID ("evt-1") graceful error handling...');
    const invalidGet = await fetch(`${baseUrl}/api/events/evt-1`);
    const invalidGetData = await invalidGet.json();
    console.log(`   • GET /api/events/evt-1 returned status: ${invalidGet.status} (Expected: 404)`);
    console.log(`   • Message: "${invalidGetData.message}"`);
    if (invalidGet.status !== 404) {
      throw new Error(`Expected 404 for invalid event ID, got ${invalidGet.status}`);
    }

    const invalidBook = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        eventId: 'evt-1',
        items: [{ ticketTypeId: 'tt-1-1', quantity: 1 }],
      }),
    });
    const invalidBookData = await invalidBook.json();
    console.log(`   • POST /api/bookings with "evt-1" returned status: ${invalidBook.status} (Expected: 404)`);
    console.log(`   • Message: "${invalidBook.body?.message || invalidBookData.message}"`);
    if (invalidBook.status !== 404) {
      throw new Error(`Expected 404 for invalid event ID booking, got ${invalidBook.status}`);
    }

    console.log('\n🎉 ALL REAL MONGODB ATLAS END-TO-END FLOW TESTS PASSED!');
  } finally {
    server.close();
    await disconnectDB();
  }
}

runE2EVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ E2E Verification failed:', err);
    process.exit(1);
  });
