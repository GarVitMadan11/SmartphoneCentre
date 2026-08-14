import { execSync } from 'node:child_process';

// Ensure DATABASE_URL is set and starts with valid protocol
let dbUrl = (process.env.DATABASE_URL ?? '').trim().replace(/^['"]|['"]$/g, '');

if (!dbUrl) {
  dbUrl = 'file:./dev.db';
} else if (!dbUrl.startsWith('file:') && !dbUrl.startsWith('postgres:') && !dbUrl.startsWith('postgresql:')) {
  dbUrl = `file:${dbUrl}`;
}

process.env.DATABASE_URL = dbUrl;
console.log(`🔧 Building with DATABASE_URL: ${process.env.DATABASE_URL}`);

try {
  execSync('npx prisma generate && npx prisma db push && npx tsx prisma/seed.ts && tsc', {
    stdio: 'inherit',
    env: process.env,
  });
} catch (err) {
  console.error('❌ Server build failed:', err);
  process.exit(1);
}
