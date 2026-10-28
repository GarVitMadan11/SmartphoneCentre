import prisma from '../db.js';

let lastPruneTimestamp: string | null = null;
let lastPrunedCount = 0;

/**
 * Prunes expired quotes older than 7 days from PostgreSQL.
 * Keeps the Quote table and its indexes lean and performant.
 */
export async function pruneExpiredQuotes(olderThanDays = 7): Promise<number> {
  try {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    const result = await prisma.quote.deleteMany({
      where: {
        expiresAt: {
          lt: cutoffDate,
        },
      },
    });
    lastPruneTimestamp = new Date().toISOString();
    lastPrunedCount = result.count;
    if (result.count > 0) {
      console.log(`[Maintenance] Successfully pruned ${result.count} expired quotes older than ${olderThanDays} days.`);
    }
    return result.count;
  } catch (err) {
    console.warn('[Maintenance] Quote pruning routine encountered an issue:', err);
    return 0;
  }
}

/**
 * Returns database quote hygiene metrics.
 */
export async function getMaintenanceStats() {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalQuotes, expiredQuotes, pruneCandidateQuotes] = await Promise.all([
      prisma.quote.count(),
      prisma.quote.count({ where: { expiresAt: { lt: now } } }),
      prisma.quote.count({ where: { expiresAt: { lt: sevenDaysAgo } } }),
    ]);

    return {
      totalQuotes,
      activeQuotes: Math.max(0, totalQuotes - expiredQuotes),
      expiredQuotes,
      pruneCandidateQuotes,
      lastPruneTimestamp,
      lastPrunedCount,
      isPeriodicWorkerRunning: maintenanceTimer !== null,
    };
  } catch (err) {
    console.warn('[Maintenance] Failed to retrieve maintenance stats:', err);
    return {
      totalQuotes: 0,
      activeQuotes: 0,
      expiredQuotes: 0,
      pruneCandidateQuotes: 0,
      lastPruneTimestamp,
      lastPrunedCount,
      isPeriodicWorkerRunning: maintenanceTimer !== null,
    };
  }
}

let maintenanceTimer: NodeJS.Timeout | null = null;

/**
 * Starts the periodic background maintenance worker.
 * Runs once at server start (after 15s grace delay) and then every 24 hours.
 */
export function startPeriodicMaintenance(): NodeJS.Timeout {
  if (maintenanceTimer) return maintenanceTimer;

  // Initial run after brief startup delay
  setTimeout(() => {
    pruneExpiredQuotes().catch(() => {});
  }, 15_000);

  // Daily recurring interval (24 hours)
  const INTERVAL_24H = 24 * 60 * 60 * 1000;
  maintenanceTimer = setInterval(() => {
    pruneExpiredQuotes().catch(() => {});
  }, INTERVAL_24H);

  return maintenanceTimer;
}

export function stopPeriodicMaintenance(): void {
  if (maintenanceTimer) {
    clearInterval(maintenanceTimer);
    maintenanceTimer = null;
  }
}

