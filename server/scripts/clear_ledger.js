import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearLedger() {
  console.log('🧹 Clearing transaction ledger...');
  const deletedEvents = await prisma.bookingEvent.deleteMany({});
  const deletedBookings = await prisma.booking.deleteMany({});
  const deletedQuotes = await prisma.quote.deleteMany({});
  const deletedAuditLogs = await prisma.adminAuditLog.deleteMany({});

  console.log(`✅ Transaction ledger reset completely!`);
  console.log(`   - Bookings deleted: ${deletedBookings.count}`);
  console.log(`   - Events deleted: ${deletedEvents.count}`);
  console.log(`   - Quotes deleted: ${deletedQuotes.count}`);
  console.log(`   - Audit logs deleted: ${deletedAuditLogs.count}`);
}

clearLedger()
  .catch((e) => {
    console.error('Failed to clear transaction ledger:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
