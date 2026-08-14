import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_POSTGRES_URL = 'postgresql://database_fplv_user:mhFh1bnyfLV4jpId5R0D8t7osV0Nlx0T@dpg-d9v6fa67bikc73bsvnhg-a/database_fplv';

let dbUrl = (process.env.DATABASE_URL ?? '').trim().replace(/^['"]|['"]$/g, '');
const isRenderEnv = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID);

if (isRenderEnv) {
  dbUrl = dbUrl || DEFAULT_POSTGRES_URL;
} else if (!dbUrl || dbUrl.includes('dpg-d9v6fa67bikc73bsvnhg-a') || dbUrl.startsWith('file:')) {
  let localDbPath = path.resolve(__dirname, '../prisma/dev.db');
  if (!fs.existsSync(localDbPath)) {
    localDbPath = path.resolve(__dirname, '../dev.db');
  }
  dbUrl = `file:${localDbPath}`;
}

process.env.DATABASE_URL = dbUrl;
console.log(`🚀 Starting server with DATABASE_URL: ${process.env.DATABASE_URL} (Render: ${isRenderEnv})`);

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

// ─────────────────────────────────────────────────────────────────────────
// DATABASE PUSH & SEED (Runs on Server Startup inside Render internal network)
// ─────────────────────────────────────────────────────────────────────────
try {
  console.log('🔄 Executing Prisma DB Push...');
  execSync('npx prisma db push --accept-data-loss', {
    stdio: 'inherit',
    env: process.env,
  });
  console.log('✅ Database schema in sync.');

  console.log('🌱 Syncing catalog seed data...');
  execSync('npx tsx prisma/seed.ts', {
    stdio: 'inherit',
    env: process.env,
  });
  console.log('✅ Catalog seed data synced.');
} catch (err) {
  console.error('⚠️ Database sync on startup notice:', (err && err.message) || err);
}

// Start Express Application Server
const serverProcess = spawn('node', ['dist/index.js'], {
  stdio: 'inherit',
  env: process.env,
});

serverProcess.on('exit', (code) => {
  process.exit(code ?? 0);
});
