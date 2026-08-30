/// <reference types="node" />
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BRANDS, MODELS, getDeviceImage, buildVariantPricesForModel, getModelSupportedStorage, getModelSupportedRam } from '../../src/data/mockDatabase';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);




const dbUrl = (process.env.DATABASE_URL || '').trim();
const schemaPath = path.resolve(__dirname, 'schema.prisma');
if (fs.existsSync(schemaPath) && dbUrl) {
  const targetProvider = (dbUrl.startsWith('postgres:') || dbUrl.startsWith('postgresql:')) ? 'postgresql' : 'sqlite';
  let schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const updatedSchema = schemaContent.replace(/provider\s*=\s*"(sqlite|postgresql)"/, `provider = "${targetProvider}"`);
  if (schemaContent !== updatedSchema) {
    fs.writeFileSync(schemaPath, updatedSchema, 'utf8');
  }
}

const prisma = new PrismaClient();

const DEFAULT_ADMIN_PASSWORD_HASH = bcrypt.hashSync('AdminPass123!', 10);

const DEFAULT_ADMIN_USERS = [
  { username: 'superadmin', email: 'admin@smartphonecentre.com', passwordHash: DEFAULT_ADMIN_PASSWORD_HASH, role: 'SUPER_ADMIN', active: true },
  { username: 'finance_lead', email: 'finance@smartphonecentre.com', passwordHash: DEFAULT_ADMIN_PASSWORD_HASH, role: 'FINANCE_APPROVER', active: true },
  { username: 'ops_agent1', email: 'ops@smartphonecentre.com', passwordHash: DEFAULT_ADMIN_PASSWORD_HASH, role: 'OPERATIONS_AGENT', active: true },
  { username: 'catalog_mgr', email: 'catalog@smartphonecentre.com', passwordHash: DEFAULT_ADMIN_PASSWORD_HASH, role: 'CATALOG_EDITOR', active: true },
];

async function main() {
  console.log('🌱 Syncing database brands, catalog models & admin accounts from master mock database...');

  // 1. Sync Brands
  for (const b of BRANDS) {
    await prisma.brand.upsert({
      where: { id: b.id },
      create: { id: b.id, name: b.name, logo: b.logo, active: true },
      update: { name: b.name, logo: b.logo },
    });
  }
  console.log(`  ✓ ${BRANDS.length} brands ready`);

  // 2. Sync Models (Smartphones, Tablets, Smartwatches)
  const chunkSize = 25;
  for (let i = 0; i < MODELS.length; i += chunkSize) {
    const chunk = MODELS.slice(i, i + chunkSize);
    await Promise.all(chunk.map(async (m) => {
      const storageArr = getModelSupportedStorage(m);
      const ramArr = getModelSupportedRam(m);
      const variantPricesObj = buildVariantPricesForModel(m);
      const modelImageUrl = m.imageUrl || getDeviceImage(m) || '';

      const modelData = {
        brandId: m.brandId,
        name: m.name,
        category: m.category,
        releaseYear: m.releaseYear,
        basePrice128GB: m.basePrice128GB,
        series: m.series || '',
        imageUrl: modelImageUrl,
        supportedStorageGb: JSON.stringify(storageArr),
        supportedRamGb: JSON.stringify(ramArr),
        variantPrices: JSON.stringify(variantPricesObj),
        hidden: true,
      };

      try {
        await prisma.model.upsert({
          where: { legacyId: m.id },
          create: { legacyId: m.id, ...modelData },
          update: modelData,
        });
      } catch (err) {
        // Retry once after brief delay if DB connection reset
        await new Promise(r => setTimeout(r, 200));
        await prisma.model.upsert({
          where: { legacyId: m.id },
          create: { legacyId: m.id, ...modelData },
          update: modelData,
        });
      }
    }));
  }
  console.log(`  ✓ ${MODELS.length} catalog models synced`);

  // 3. Sync Admin Users
  for (const adminUser of DEFAULT_ADMIN_USERS) {
    await prisma.adminUser.upsert({
      where: { username: adminUser.username },
      create: adminUser,
      update: {}, // Preserve any live admin password changes
    });
  }
  console.log(`  ✓ ${DEFAULT_ADMIN_USERS.length} admin staff accounts ready`);

  console.log('✅ Database sync complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
