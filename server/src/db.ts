/**
 * Singleton PrismaClient instance.
 *
 * Import this module everywhere you need database access instead of creating
 * a new PrismaClient() in each file. Multiple instances exhaust the connection
 * pool and can cause hard-to-diagnose performance degradation.
 */
import { PrismaClient } from '@prisma/client';

// Safeguard PostgreSQL connection pool limits to prevent connection exhaustion
let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl && !dbUrl.includes('connection_limit=')) {
  const separator = dbUrl.includes('?') ? '&' : '?';
  dbUrl = `${dbUrl}${separator}connection_limit=15&pool_timeout=20`;
}

const prisma = new PrismaClient({
  datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
});

export default prisma;
