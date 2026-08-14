import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_ADMIN_PASSWORD_HASH = bcrypt.hashSync('AdminPass123!', 10);

const BRANDS = [
  { id: 'brand-apple', name: 'Apple', logo: 'apple' },
  { id: 'brand-xiaomi', name: 'Xiaomi', logo: 'xiaomi' },
  { id: 'brand-samsung', name: 'Samsung', logo: 'samsung' },
  { id: 'brand-vivo', name: 'vivo', logo: 'vivo' },
  { id: 'brand-oneplus', name: 'OnePlus', logo: 'oneplus' },
  { id: 'brand-google', name: 'Google', logo: 'google' },
];

const MODELS = [
  { id: 'apple-16pm', brandId: 'brand-apple', name: 'iPhone 16 Pro Max', modelNumber: 'A3296', category: 'flagship', releaseYear: 2024, basePrice128GB: 67000, series: 'iPhone 16 Series' },
  { id: 'apple-16p', brandId: 'brand-apple', name: 'iPhone 16 Pro', modelNumber: 'A3293', category: 'flagship', releaseYear: 2024, basePrice128GB: 57000, series: 'iPhone 16 Series' },
  { id: 'apple-15pm', brandId: 'brand-apple', name: 'iPhone 15 Pro Max', modelNumber: 'A3106', category: 'flagship', releaseYear: 2023, basePrice128GB: 57000, series: 'iPhone 15 Series' },
  { id: 'sam-s24u', brandId: 'brand-samsung', name: 'Galaxy S24 Ultra', modelNumber: 'SM-S928B', category: 'flagship', releaseYear: 2024, basePrice128GB: 42000, series: 'S Series' },
  { id: 'op-12', brandId: 'brand-oneplus', name: 'OnePlus 12', modelNumber: 'CPH2581', category: 'flagship', releaseYear: 2024, basePrice128GB: 24000, series: 'Numbered Series' },
  { id: 'goog-8', brandId: 'brand-google', name: 'Pixel 8', modelNumber: 'GKWS6', category: 'premium', releaseYear: 2023, basePrice128GB: 19000, series: 'Pixel 8 Series' },
];

const DEFAULT_ADMIN_USERS = [
  { username: 'superadmin', email: 'admin@smartphonecentre.com', passwordHash: DEFAULT_ADMIN_PASSWORD_HASH, role: 'SUPER_ADMIN', active: true },
  { username: 'finance_lead', email: 'finance@smartphonecentre.com', passwordHash: DEFAULT_ADMIN_PASSWORD_HASH, role: 'FINANCE_APPROVER', active: true },
  { username: 'ops_agent1', email: 'ops@smartphonecentre.com', passwordHash: DEFAULT_ADMIN_PASSWORD_HASH, role: 'OPERATIONS_AGENT', active: true },
  { username: 'catalog_mgr', email: 'catalog@smartphonecentre.com', passwordHash: DEFAULT_ADMIN_PASSWORD_HASH, role: 'CATALOG_EDITOR', active: true },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const INITIAL_BOOKINGS: any[] = [];

async function main() {
  const existingBrandCount = await prisma.brand.count();
  const existingModelCount = await prisma.model.count();

  if (existingBrandCount > 0 && existingModelCount > 0) {
    console.log(`🌱 Database already contains live data (${existingBrandCount} brands, ${existingModelCount} models). Skipping initial seeding to preserve your actual live catalog edits.`);
    return;
  }

  console.log('🌱 Initializing database with starter catalog & admin accounts...');

  for (const b of BRANDS) {
    await prisma.brand.upsert({
      where: { id: b.id },
      create: { id: b.id, name: b.name, logo: b.logo },
      update: {}, // Do NOT overwrite existing live brand edits
    });
  }
  console.log(`  ✓ ${BRANDS.length} brands initialized`);

  for (const m of MODELS) {
    await prisma.model.upsert({
      where: { legacyId: m.id },
      create: {
        legacyId: m.id,
        brandId: m.brandId,
        name: m.name,
        modelNumber: m.modelNumber,
        category: m.category,
        releaseYear: m.releaseYear,
        basePrice128GB: m.basePrice128GB,
        series: m.series,
      },
      update: {}, // Do NOT overwrite existing live model edits
    });
  }
  console.log(`  ✓ ${MODELS.length} models initialized`);

  for (const adminUser of DEFAULT_ADMIN_USERS) {
    await prisma.adminUser.upsert({
      where: { username: adminUser.username },
      create: adminUser,
      update: {}, // Do NOT overwrite existing live admin user edits
    });
  }
  console.log(`  ✓ ${DEFAULT_ADMIN_USERS.length} admin staff accounts initialized`);

  for (const b of INITIAL_BOOKINGS) {
    await prisma.booking.upsert({ where: { id: b.id }, create: b, update: {} });
  }
  console.log(`  ✓ ${INITIAL_BOOKINGS.length} bookings initialized`);

  console.log('✅ Database initialization complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
