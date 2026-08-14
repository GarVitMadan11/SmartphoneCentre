import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure DATABASE_URL is set and starts with valid protocol
let dbUrl = (process.env.DATABASE_URL ?? '').trim().replace(/^['"]|['"]$/g, '');

if (!dbUrl) {
  dbUrl = 'file:./dev.db';
} else if (!dbUrl.startsWith('file:') && !dbUrl.startsWith('postgres:') && !dbUrl.startsWith('postgresql:')) {
  dbUrl = `file:${dbUrl}`;
}

process.env.DATABASE_URL = dbUrl;
console.log(`🔧 Building with DATABASE_URL: ${process.env.DATABASE_URL}`);

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

try {
  execSync('npx prisma generate && npx prisma db push && npx tsx prisma/seed.ts && tsc', {
    stdio: 'inherit',
    env: process.env,
  });
} catch (err) {
  console.error('❌ Server build failed:', err);
  process.exit(1);
}
