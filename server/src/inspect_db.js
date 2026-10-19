const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findUnique({
    where: { email: 'peelavarshit@gmail.com' },
    include: {
      bookings: {
        include: {
          tickets: true,
          event: true,
        }
      }
    }
  });
  console.log('USER peelavarshit:', JSON.stringify(user, null, 2));

  const allBookings = await prisma.booking.findMany({
    include: {
      user: { select: { email: true } },
      event: { select: { title: true, id: true } },
      tickets: true
    }
  });
  console.log('ALL BOOKINGS:', JSON.stringify(allBookings.map(b => ({
    id: b.id,
    userEmail: b.user.email,
    eventTitle: b.event?.title,
    eventId: b.eventId,
    ticketsCount: b.tickets.length,
    status: b.status
  })), null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());
