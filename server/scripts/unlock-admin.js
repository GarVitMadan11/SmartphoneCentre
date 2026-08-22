import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.adminUser.updateMany({
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
  console.log(`✅ Unlocked ${result.count} admin user accounts.`);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Failed unlocking admin users:', err);
  process.exit(1);
});
