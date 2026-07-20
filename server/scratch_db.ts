import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const legacyId = 'goog-8'; // This model exists in the DB according to our previous output
  console.log('Trying to delete model:', legacyId);
  try {
    const model = await prisma.model.findUnique({ where: { legacyId } });
    if (!model) {
      console.log('Model not found in DB!');
      return;
    }
    const deleted = await prisma.model.delete({ where: { legacyId } });
    console.log('Deleted successfully:', deleted);
  } catch (err) {
    console.error('Error during deletion:', err);
  }
}

main().finally(() => prisma.$disconnect());
