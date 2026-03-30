import { and, eq, isNull, sql } from 'drizzle-orm'
import { alerts } from '../../db/schema'
import { computeExpiryStatuses } from '../../utils/free-tier-expiry'

/**
 * Fast triage summary — DB + static data only, no external API calls.
 * Used by dashboard card and nav badge.
 */
export default defineEventHandler(async () => {
  const db = useDB()

  // Count pending alerts by severity
  const alertCounts = await db
    .select({
      severity: alerts.severity,
      count: sql<number>`count(*)`,
    })
    .from(alerts)
    .where(and(
      eq(alerts.isActive, true),
      isNull(alerts.deletedAt),
      eq(alerts.status, 'pending'),
    ))
    .groupBy(alerts.severity)

  let redCount = 0
  let yellowCount = 0
  for (const row of alertCounts) {
    if (row.severity === 'critical') redCount += Number(row.count)
    else if (row.severity === 'warning') yellowCount += Number(row.count)
  }

  // Expiry items (synchronous, static data)
  const expiryItems = computeExpiryStatuses()
  for (const item of expiryItems) {
    if (item.risk === 'expired' || item.risk === 'critical') redCount++
    else if (item.risk === 'warning') yellowCount++
  }

  return {
    redCount,
    yellowCount,
    totalCount: redCount + yellowCount,
    checkedAt: new Date().toISOString(),
  }
})
