import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BRANDS = [
  { name: 'Apple', logo: 'apple', legacyId: 'brand-apple' },
  { name: 'Xiaomi', logo: 'xiaomi', legacyId: 'brand-xiaomi' },
  { name: 'Samsung', logo: 'samsung', legacyId: 'brand-samsung' },
  { name: 'vivo', logo: 'vivo', legacyId: 'brand-vivo' },
  { name: 'OnePlus', logo: 'oneplus', legacyId: 'brand-oneplus' },
  { name: 'Google', logo: 'google', legacyId: 'brand-google' },
];

const MODELS = [
  // APPLE
  { legacyId:'apple-16pm', brandLegacy:'brand-apple', name:'iPhone 16 Pro Max', modelNumber:'A3296', category:'flagship', releaseYear:2024, basePrice128GB:67000, series:'iPhone 16 Series' },
  { legacyId:'apple-16p', brandLegacy:'brand-apple', name:'iPhone 16 Pro', modelNumber:'A3293', category:'flagship', releaseYear:2024, basePrice128GB:57000, series:'iPhone 16 Series' },
  { legacyId:'apple-16plus', brandLegacy:'brand-apple', name:'iPhone 16 Plus', modelNumber:'A3290', category:'premium', releaseYear:2024, basePrice128GB:45000, series:'iPhone 16 Series' },
  { legacyId:'apple-16', brandLegacy:'brand-apple', name:'iPhone 16', modelNumber:'A3287', category:'premium', releaseYear:2024, basePrice128GB:40000, series:'iPhone 16 Series' },
  { legacyId:'apple-16e', brandLegacy:'brand-apple', name:'iPhone 16e', modelNumber:'A3294', category:'midrange', releaseYear:2024, basePrice128GB:32000, series:'iPhone 16 Series' },
  { legacyId:'apple-15pm', brandLegacy:'brand-apple', name:'iPhone 15 Pro Max', modelNumber:'A3106', category:'flagship', releaseYear:2023, basePrice128GB:57000, series:'iPhone 15 Series' },
  { legacyId:'apple-15p', brandLegacy:'brand-apple', name:'iPhone 15 Pro', modelNumber:'A3102', category:'flagship', releaseYear:2023, basePrice128GB:47000, series:'iPhone 15 Series' },
  { legacyId:'apple-15plus', brandLegacy:'brand-apple', name:'iPhone 15 Plus', modelNumber:'A3094', category:'premium', releaseYear:2023, basePrice128GB:37000, series:'iPhone 15 Series' },
  { legacyId:'apple-15', brandLegacy:'brand-apple', name:'iPhone 15', modelNumber:'A3090', category:'premium', releaseYear:2023, basePrice128GB:33000, series:'iPhone 15 Series' },
  { legacyId:'apple-14pm', brandLegacy:'brand-apple', name:'iPhone 14 Pro Max', modelNumber:'A2894', category:'flagship', releaseYear:2022, basePrice128GB:37000, series:'iPhone 14 Series' },
  { legacyId:'apple-14p', brandLegacy:'brand-apple', name:'iPhone 14 Pro', modelNumber:'A2890', category:'flagship', releaseYear:2022, basePrice128GB:35000, series:'iPhone 14 Series' },
  { legacyId:'apple-14plus', brandLegacy:'brand-apple', name:'iPhone 14 Plus', modelNumber:'A2886', category:'premium', releaseYear:2022, basePrice128GB:26000, series:'iPhone 14 Series' },
  { legacyId:'apple-14', brandLegacy:'brand-apple', name:'iPhone 14', modelNumber:'A2882', category:'premium', releaseYear:2022, basePrice128GB:23000, series:'iPhone 14 Series' },
  { legacyId:'apple-13pm', brandLegacy:'brand-apple', name:'iPhone 13 Pro Max', modelNumber:'A2643', category:'flagship', releaseYear:2021, basePrice128GB:29000, series:'iPhone 13 Series' },
  { legacyId:'apple-13p', brandLegacy:'brand-apple', name:'iPhone 13 Pro', modelNumber:'A2638', category:'flagship', releaseYear:2021, basePrice128GB:27000, series:'iPhone 13 Series' },
  { legacyId:'apple-13', brandLegacy:'brand-apple', name:'iPhone 13', modelNumber:'A2633', category:'premium', releaseYear:2021, basePrice128GB:21000, series:'iPhone 13 Series' },
  { legacyId:'apple-13m', brandLegacy:'brand-apple', name:'iPhone 13 mini', modelNumber:'A2628', category:'midrange', releaseYear:2021, basePrice128GB:16000, series:'iPhone 13 Series' },
  { legacyId:'apple-12pm', brandLegacy:'brand-apple', name:'iPhone 12 Pro Max', modelNumber:'A2411', category:'premium', releaseYear:2020, basePrice128GB:18000, series:'iPhone 12 & 11 Series' },
  { legacyId:'apple-12p', brandLegacy:'brand-apple', name:'iPhone 12 Pro', modelNumber:'A2407', category:'premium', releaseYear:2020, basePrice128GB:16000, series:'iPhone 12 & 11 Series' },
  { legacyId:'apple-12', brandLegacy:'brand-apple', name:'iPhone 12', modelNumber:'A2403', category:'midrange', releaseYear:2020, basePrice128GB:13000, series:'iPhone 12 & 11 Series' },
  { legacyId:'apple-12m', brandLegacy:'brand-apple', name:'iPhone 12 mini', modelNumber:'A2399', category:'midrange', releaseYear:2020, basePrice128GB:10500, series:'iPhone 12 & 11 Series' },
  { legacyId:'apple-11pm', brandLegacy:'brand-apple', name:'iPhone 11 Pro Max', modelNumber:'A2218', category:'premium', releaseYear:2019, basePrice128GB:11000, series:'iPhone 12 & 11 Series' },
  { legacyId:'apple-11p', brandLegacy:'brand-apple', name:'iPhone 11 Pro', modelNumber:'A2160', category:'premium', releaseYear:2019, basePrice128GB:9500, series:'iPhone 12 & 11 Series' },
  { legacyId:'apple-11', brandLegacy:'brand-apple', name:'iPhone 11', modelNumber:'A2111', category:'midrange', releaseYear:2019, basePrice128GB:7500, series:'iPhone 12 & 11 Series' },
  { legacyId:'apple-se3', brandLegacy:'brand-apple', name:'iPhone SE3', modelNumber:'A2783', category:'budget', releaseYear:2022, basePrice128GB:8500, series:'iPhone SE & Legacy' },
  { legacyId:'apple-se2', brandLegacy:'brand-apple', name:'iPhone SE2', modelNumber:'A2275', category:'budget', releaseYear:2020, basePrice128GB:6000, series:'iPhone SE & Legacy' },
  { legacyId:'apple-xr', brandLegacy:'brand-apple', name:'iPhone XR', modelNumber:'A2105', category:'budget', releaseYear:2018, basePrice128GB:5500, series:'iPhone SE & Legacy' },
  { legacyId:'apple-xs', brandLegacy:'brand-apple', name:'iPhone XS', modelNumber:'A2097', category:'budget', releaseYear:2018, basePrice128GB:6500, series:'iPhone SE & Legacy' },
  { legacyId:'apple-xsmax', brandLegacy:'brand-apple', name:'iPhone XS Max', modelNumber:'A2101', category:'budget', releaseYear:2018, basePrice128GB:8000, series:'iPhone SE & Legacy' },
  { legacyId:'apple-x', brandLegacy:'brand-apple', name:'iPhone X', modelNumber:'A1901', category:'budget', releaseYear:2017, basePrice128GB:5000, series:'iPhone SE & Legacy' },
  // SAMSUNG
  { legacyId:'sam-s20u', brandLegacy:'brand-samsung', name:'Galaxy S20 Ultra', modelNumber:'SM-G988B', category:'premium', releaseYear:2020, basePrice128GB:12000, series:'S Series' },
  { legacyId:'sam-s21u', brandLegacy:'brand-samsung', name:'Galaxy S21 Ultra', modelNumber:'SM-G998B', category:'premium', releaseYear:2021, basePrice128GB:16000, series:'S Series' },
  { legacyId:'sam-s22u', brandLegacy:'brand-samsung', name:'Galaxy S22 Ultra', modelNumber:'SM-S908B', category:'premium', releaseYear:2022, basePrice128GB:21000, series:'S Series' },
  { legacyId:'sam-s23u', brandLegacy:'brand-samsung', name:'Galaxy S23 Ultra', modelNumber:'SM-S918B', category:'flagship', releaseYear:2023, basePrice128GB:30000, series:'S Series' },
  { legacyId:'sam-s24u', brandLegacy:'brand-samsung', name:'Galaxy S24 Ultra', modelNumber:'SM-S928B', category:'flagship', releaseYear:2024, basePrice128GB:42000, series:'S Series' },
  { legacyId:'sam-s25u', brandLegacy:'brand-samsung', name:'Galaxy S25 Ultra', modelNumber:'SM-S938B', category:'flagship', releaseYear:2025, basePrice128GB:46000, series:'S Series' },
  { legacyId:'sam-s21', brandLegacy:'brand-samsung', name:'Galaxy S21', modelNumber:'SM-G991B', category:'midrange', releaseYear:2021, basePrice128GB:9500, series:'S Series' },
  { legacyId:'sam-s22', brandLegacy:'brand-samsung', name:'Galaxy S22', modelNumber:'SM-S901B', category:'midrange', releaseYear:2022, basePrice128GB:12000, series:'S Series' },
  { legacyId:'sam-s23', brandLegacy:'brand-samsung', name:'Galaxy S23', modelNumber:'SM-S911B', category:'premium', releaseYear:2023, basePrice128GB:17000, series:'S Series' },
  { legacyId:'sam-s24', brandLegacy:'brand-samsung', name:'Galaxy S24', modelNumber:'SM-S921B', category:'premium', releaseYear:2024, basePrice128GB:25000, series:'S Series' },
  { legacyId:'sam-s25', brandLegacy:'brand-samsung', name:'Galaxy S25', modelNumber:'SM-S931B', category:'premium', releaseYear:2025, basePrice128GB:30000, series:'S Series' },
  { legacyId:'sam-flip5', brandLegacy:'brand-samsung', name:'Galaxy Z Flip 5', modelNumber:'SM-F731B', category:'flagship', releaseYear:2023, basePrice128GB:22000, series:'Z Fold & Z Flip' },
  { legacyId:'sam-flip6', brandLegacy:'brand-samsung', name:'Galaxy Z Flip 6', modelNumber:'SM-F741B', category:'flagship', releaseYear:2024, basePrice128GB:28000, series:'Z Fold & Z Flip' },
  { legacyId:'sam-fold5', brandLegacy:'brand-samsung', name:'Galaxy Z Fold 5', modelNumber:'SM-F946B', category:'flagship', releaseYear:2023, basePrice128GB:45000, series:'Z Fold & Z Flip' },
  { legacyId:'sam-fold6', brandLegacy:'brand-samsung', name:'Galaxy Z Fold 6', modelNumber:'SM-F956B', category:'flagship', releaseYear:2024, basePrice128GB:55000, series:'Z Fold & Z Flip' },
  { legacyId:'sam-a55', brandLegacy:'brand-samsung', name:'Galaxy A55', modelNumber:'SM-A556B', category:'midrange', releaseYear:2024, basePrice128GB:14000, series:'A Series' },
  { legacyId:'sam-a35', brandLegacy:'brand-samsung', name:'Galaxy A35', modelNumber:'SM-A356B', category:'midrange', releaseYear:2024, basePrice128GB:11000, series:'A Series' },
  { legacyId:'sam-a15-5g', brandLegacy:'brand-samsung', name:'Galaxy A15 5G', modelNumber:'SM-A156B', category:'budget', releaseYear:2024, basePrice128GB:7000, series:'A Series' },
  // XIAOMI
  { legacyId:'xi-14u', brandLegacy:'brand-xiaomi', name:'Xiaomi 14 Ultra', modelNumber:'24030PN60G', category:'flagship', releaseYear:2024, basePrice128GB:28000, series:'Xiaomi Series' },
  { legacyId:'xi-14', brandLegacy:'brand-xiaomi', name:'Xiaomi 14', modelNumber:'23127PN0CG', category:'flagship', releaseYear:2024, basePrice128GB:20000, series:'Xiaomi Series' },
  { legacyId:'xi-n14p', brandLegacy:'brand-xiaomi', name:'Redmi Note 14 Pro+', modelNumber:'24115RA8EG', category:'midrange', releaseYear:2024, basePrice128GB:12000, series:'Redmi Note Series' },
  { legacyId:'xi-poc6', brandLegacy:'brand-xiaomi', name:'POCO F6', modelNumber:'24069PC21G', category:'midrange', releaseYear:2024, basePrice128GB:11000, series:'POCO Series' },
  // VIVO
  { legacyId:'vi-x200p', brandLegacy:'brand-vivo', name:'vivo X200 Pro', modelNumber:'V2405A', category:'flagship', releaseYear:2024, basePrice128GB:38000, series:'X Series & Folds' },
  { legacyId:'vi-x200', brandLegacy:'brand-vivo', name:'vivo X200', modelNumber:'V2415A', category:'flagship', releaseYear:2024, basePrice128GB:32000, series:'X Series & Folds' },
  { legacyId:'vi-v50', brandLegacy:'brand-vivo', name:'vivo V50', modelNumber:'V2401', category:'premium', releaseYear:2024, basePrice128GB:17000, series:'V Series' },
  // ONEPLUS
  { legacyId:'op-12', brandLegacy:'brand-oneplus', name:'OnePlus 12', modelNumber:'CPH2581', category:'flagship', releaseYear:2024, basePrice128GB:24000, series:'Numbered Series' },
  { legacyId:'op-12r', brandLegacy:'brand-oneplus', name:'OnePlus 12R', modelNumber:'CPH2585', category:'premium', releaseYear:2024, basePrice128GB:16000, series:'Numbered Series' },
  { legacyId:'op-nord4', brandLegacy:'brand-oneplus', name:'OnePlus Nord 4', modelNumber:'CPH2621', category:'midrange', releaseYear:2024, basePrice128GB:13000, series:'Nord Series' },
  // GOOGLE
  { legacyId:'goog-8p', brandLegacy:'brand-google', name:'Pixel 8 Pro', modelNumber:'GC3VE', category:'flagship', releaseYear:2023, basePrice128GB:27000, series:'Pixel 8 Series' },
  { legacyId:'goog-8', brandLegacy:'brand-google', name:'Pixel 8', modelNumber:'GKWS6', category:'premium', releaseYear:2023, basePrice128GB:19000, series:'Pixel 8 Series' },
  { legacyId:'goog-8a', brandLegacy:'brand-google', name:'Pixel 8a', modelNumber:'G8HHN', category:'midrange', releaseYear:2024, basePrice128GB:14500, series:'Pixel 8 Series' },
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
  {
    id: 'STC-X9Y8Z7W6', modelLegacyId: 'op-12', modelName: 'OnePlus 12', modelNumber: 'CPH2581',
    storageGb: 256, color: 'Obsidian Black', customerName: 'Sneha Reddy', customerPhone: '7654321098',
    customerEmail: 'sneha.reddy@example.com', address: 'Plot 89, Kavuri Hills, Madhapur, Hyderabad - 500081',
    pickupDate: '2026-07-14', pickupTimeSlot: '03:00 PM - 06:00 PM (Evening)', finalPrice: 21800,
    verificationStatus: 'verified', verifiedName: 'SNEHA REDDY', maskedAadhaar: 'XXXX-XXXX-9012',
    verificationDate: '2026-07-14T14:15:00.000Z', payoutMethod: 'amazon', payoutMethodName: 'Amazon Gift Card',
    bonusPercentage: 0.03, bonusAmount: 654, finalPayoutAmount: 22454, inspectionStatus: 'rejected',
    payoutStatus: 'pending', dateCreated: '2026-07-14T14:02:00.000Z',
    payoutDetailsJson: '{}',
  },
  {
    id: 'STC-P4Q3R2S1', modelLegacyId: 'goog-8', modelName: 'Pixel 8', modelNumber: 'GKWS6',
    storageGb: 128, color: 'Obsidian', customerName: 'Priya Patel', customerPhone: '9988776655',
    customerEmail: 'priya.patel@example.com', address: 'B-104, Shanti Tower, Andheri West, Mumbai - 400053',
    pickupDate: '2026-07-14', pickupTimeSlot: '12:00 PM - 03:00 PM (Afternoon)', finalPrice: 16500,
    verificationStatus: 'failed', verifiedName: '', maskedAadhaar: '', verificationDate: '',
    payoutMethod: 'bank', payoutMethodName: 'Bank Transfer',
    bonusPercentage: 0, bonusAmount: 0, finalPayoutAmount: 16500, inspectionStatus: 'pending',
    payoutStatus: 'pending', dateCreated: '2026-07-14T11:45:00.000Z',
    payoutDetailsJson: JSON.stringify({ accountHolderName: 'Priya Patel', accountNumber: '1092837465', ifscCode: 'SBIN0000291' }),
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.booking.deleteMany();
  await prisma.model.deleteMany();
  await prisma.brand.deleteMany();

  // Seed brands — store mapping of legacyId -> dbId
  const brandMap: Record<string, string> = {};
  for (const b of BRANDS) {
    const created = await prisma.brand.create({
      data: { id: b.legacyId, name: b.name, logo: b.logo },
    });
    brandMap[b.legacyId] = created.id;
  }
  console.log(`  ✓ ${BRANDS.length} brands seeded`);

  // Seed models
  for (const m of MODELS) {
    await prisma.model.create({
      data: {
        legacyId: m.legacyId,
        brandId: brandMap[m.brandLegacy],
        name: m.name,
        modelNumber: m.modelNumber,
        category: m.category,
        releaseYear: m.releaseYear,
        basePrice128GB: m.basePrice128GB,
        series: m.series,
      },
    });
  }
  console.log(`  ✓ ${MODELS.length} models seeded`);

  // Seed bookings
  for (const b of INITIAL_BOOKINGS) {
    await prisma.booking.create({ data: b });
  }
  console.log(`  ✓ ${INITIAL_BOOKINGS.length} bookings seeded`);

  console.log('✅ Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
