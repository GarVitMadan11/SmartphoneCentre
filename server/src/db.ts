/**
 * Singleton PrismaClient instance.
 *
 * Import this module everywhere you need database access instead of creating
 * a new PrismaClient() in each file. Multiple instances exhaust the connection
 * pool and can cause hard-to-diagnose performance degradation.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
