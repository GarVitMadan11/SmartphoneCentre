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

const INITIAL_BOOKINGS = [
  {
    id: 'STC-A8B9C0D1', modelLegacyId: 'apple-15pm', modelName: 'iPhone 15 Pro Max', modelNumber: 'A3106',
    storageGb: 256, color: 'Natural Titanium', customerName: 'Amit Sharma', customerPhone: '9876543210',
    customerEmail: 'amit.sharma@example.com', address: 'Flat 402, Block C, Green Park, New Delhi - 110016',
    pickupDate: '2026-07-12', pickupTimeSlot: '12:00 PM - 03:00 PM (Afternoon)', finalPrice: 53500,
    verificationStatus: 'verified', verifiedName: 'AMIT SHARMA', maskedAadhaar: 'XXXX-XXXX-4321',
    verificationDate: '2026-07-12T11:20:00.000Z', payoutMethod: 'upi', payoutMethodName: 'UPI Transfer',
    bonusPercentage: 0, bonusAmount: 0, finalPayoutAmount: 53500, inspectionStatus: 'approved',
    payoutStatus: 'completed', dateCreated: '2026-07-12T11:05:00.000Z',
    payoutDetailsJson: JSON.stringify({ upiId: 'amit.sharma@okaxis' }),
  },
  {
    id: 'STC-F5E4D3C2', modelLegacyId: 'sam-s24u', modelName: 'Galaxy S24 Ultra', modelNumber: 'SM-S928B',
    storageGb: 256, color: 'Phantom Black', customerName: 'Rohan Gupta', customerPhone: '8765432109',
    customerEmail: 'rohan.gupta@example.com', address: '15, Sector 4, HSR Layout, Bengaluru, Karnataka - 560102',
    pickupDate: '2026-07-13', pickupTimeSlot: '09:00 AM - 12:00 PM (Morning)', finalPrice: 38200,
    verificationStatus: 'verified', verifiedName: 'ROHAN GUPTA', maskedAadhaar: 'XXXX-XXXX-8765',
    verificationDate: '2026-07-13T08:45:00.000Z', payoutMethod: 'bank', payoutMethodName: 'Bank Transfer',
    bonusPercentage: 0, bonusAmount: 0, finalPayoutAmount: 38200, inspectionStatus: 'approved',
    payoutStatus: 'pending', dateCreated: '2026-07-13T08:30:00.000Z',
    payoutDetailsJson: JSON.stringify({ accountHolderName: 'Rohan Gupta', accountNumber: '918273645012', ifscCode: 'HDFC0000104' }),
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  for (const b of BRANDS) {
    await prisma.brand.upsert({
      where: { id: b.id },
      create: { id: b.id, name: b.name, logo: b.logo },
      update: { name: b.name, logo: b.logo },
    });
  }
  console.log(`  ✓ ${BRANDS.length} brands seeded`);

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
      update: {
        brandId: m.brandId, name: m.name, modelNumber: m.modelNumber,
        category: m.category, releaseYear: m.releaseYear, basePrice128GB: m.basePrice128GB, series: m.series,
      },
    });
  }
  console.log(`  ✓ ${MODELS.length} models seeded`);

  for (const adminUser of DEFAULT_ADMIN_USERS) {
    await prisma.adminUser.upsert({
      where: { username: adminUser.username },
      create: adminUser,
      update: { role: adminUser.role, passwordHash: adminUser.passwordHash },
    });
  }
  console.log(`  ✓ ${DEFAULT_ADMIN_USERS.length} admin staff accounts seeded`);

  for (const b of INITIAL_BOOKINGS) {
    await prisma.booking.upsert({ where: { id: b.id }, create: b, update: {} });
  }
  console.log(`  ✓ ${INITIAL_BOOKINGS.length} bookings seeded`);

  console.log('✅ Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
