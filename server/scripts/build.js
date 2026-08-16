import { execSync } from 'node:child_process';
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
console.log(`🔧 Building with DATABASE_URL: ${process.env.DATABASE_URL} (Render: ${isRenderEnv})`);

// Dynamically sync schema.prisma provider to match DATABASE_URL (always postgresql for production auth)
const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
if (fs.existsSync(schemaPath)) {
  let schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const targetProvider = 'postgresql';
  const updatedSchema = schemaContent.replace(/provider\s*=\s*"(sqlite|postgresql)"/, `provider = "${targetProvider}"`);
  if (schemaContent !== updatedSchema) {
    fs.writeFileSync(schemaPath, updatedSchema, 'utf8');
    console.log(`📝 Updated schema.prisma datasource provider to "${targetProvider}"`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// BUILD — compile only. No database calls here.
//
// WHY: Render's build machines cannot reach the internal PostgreSQL hostname
// (dpg-...-a). Running `prisma db push` or seeding here causes the build to
// fail with a connection error, leaving the OLD deployment running forever.
//
// `prisma db push` and seed are deferred to server STARTUP (in the start
// script), when the web service IS inside Render's internal network and CAN
// reach the database.
// ─────────────────────────────────────────────────────────────────────────
try {
  execSync('npx prisma generate && tsc', {
    stdio: 'inherit',
    env: process.env,
  });
  console.log('\u2705 Server compiled successfully.');
} catch (err) {
  console.error('\u274c Server build failed:', err);
  process.exit(1);
}
