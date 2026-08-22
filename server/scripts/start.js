import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbUrl = (process.env.DATABASE_URL ?? '').trim().replace(/^['\"]|['\"]$/g, '');
const isRenderEnv = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID);

if (!dbUrl) {
  let localDbPath = path.resolve(__dirname, '../prisma/dev.db');
  if (!fs.existsSync(localDbPath)) {
    localDbPath = path.resolve(__dirname, '../dev.db');
  }
  dbUrl = `file:${localDbPath}`;
}

process.env.DATABASE_URL = dbUrl;
console.log(`🚀 Starting server (Render: ${isRenderEnv}, Provider: ${dbUrl.startsWith('file:') ? 'sqlite' : 'postgresql'})`);

// Dynamically sync schema.prisma provider to match DATABASE_URL
const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
if (fs.existsSync(schemaPath)) {
  let schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const targetProvider = (dbUrl.startsWith('postgres:') || dbUrl.startsWith('postgresql:')) ? 'postgresql' : 'sqlite';
  const updatedSchema = schemaContent.replace(/provider\s*=\s*"(sqlite|postgresql)"/, `provider = "${targetProvider}"`);
  if (schemaContent !== updatedSchema) {
    fs.writeFileSync(schemaPath, updatedSchema, 'utf8');
    console.log(`📝 Updated schema.prisma datasource provider to "${targetProvider}"`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE PUSH & CONDITIONAL SEED
//
// KEY FIX: The seed script runs only when the database is empty (first boot).
// On every subsequent restart it is SKIPPED — this preserves all admin changes
// made via the admin panel (model edits, price changes, hidden flags, etc.).
//
// Previously the seed ran on EVERY restart, overwriting live admin data.
// ─────────────────────────────────────────────────────────────────────────────
async function initDatabase() {
  try {
    console.log('🔄 Executing Prisma DB Push (schema sync only)...');
    execSync('npx prisma db push --accept-data-loss', {
      stdio: 'inherit',
      env: process.env,
    });
    console.log('✅ Database schema in sync.');

    // Check if the database already has models (i.e. it has been seeded before)
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    let modelCount = 0;
    try {
      modelCount = await prisma.model.count();
    } finally {
      await prisma.$disconnect();
    }

    if (modelCount === 0) {
      // Fresh / empty database — run the seed to populate the initial catalog
      console.log('🌱 Fresh database detected — running initial catalog seed...');
      execSync('npx tsx prisma/seed.ts', {
        stdio: 'inherit',
        env: process.env,
      });
      console.log('✅ Initial catalog seed complete.');
    } else {
      // Data already exists — skip seed to preserve admin changes
      console.log(`✅ Database has ${modelCount} models — skipping seed (admin changes preserved).`);
    }
  } catch (err) {
    console.error('⚠️ Database init notice:', (err && err.message) || err);
  }
}

await initDatabase();

// ─── Start Express Application Server ────────────────────────────────────────
const serverProcess = spawn('node', ['dist/index.js'], {
  stdio: 'inherit',
  env: process.env,
});

serverProcess.on('exit', (code) => {
  process.exit(code ?? 0);
});
