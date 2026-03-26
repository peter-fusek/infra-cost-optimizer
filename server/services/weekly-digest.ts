import { and, eq, isNull, desc, gte, lte } from 'drizzle-orm'
import { alerts, costRecords, platforms } from '../db/schema'
import { getMTDSummary } from './cost-aggregation'
import { sendAlertEmail } from '../utils/notifications'

/**
 * Compose and send a weekly cost digest email.
 * Summarizes: MTD spend, budget %, active alerts, manual platform reminders.
 */
export async function sendWeeklyDigest(db: ReturnType<typeof useDB>, config: Record<string, string>) {
  const summary = await getMTDSummary(db)

  // Active (pending) alerts
  const pendingAlerts = await db
    .select({ severity: alerts.severity, alertType: alerts.alertType, message: alerts.message })
    .from(alerts)
    .where(and(eq(alerts.isActive, true), isNull(alerts.deletedAt), eq(alerts.status, 'pending')))
    .orderBy(desc(alerts.createdAt))
    .limit(10)

  // Manual platforms — check current month status
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const manualPlatforms = await db
    .select({ id: platforms.id, slug: platforms.slug, name: platforms.name })
    .from(platforms)
    .where(and(eq(platforms.collectionMethod, 'manual'), eq(platforms.isActive, true), isNull(platforms.deletedAt)))

  const manualReminders: string[] = []
  for (const p of manualPlatforms) {
    const [existing] = await db
      .select({ id: costRecords.id })
      .from(costRecords)
      .where(and(
        eq(costRecords.platformId, p.id),
        eq(costRecords.collectionMethod, 'manual'),
        eq(costRecords.isActive, true),
        isNull(costRecords.deletedAt),
        gte(costRecords.periodStart, monthStart),
        lte(costRecords.periodEnd, monthEnd),
      ))
      .limit(1)
    if (!existing) {
      manualReminders.push(p.name)
    }
  }

  // Build email body
  const lines: string[] = [
    'InfraCost Weekly Digest',
    '='.repeat(40),
    '',
    `Month-to-Date: $${summary.totalMTD.toFixed(2)} (€${summary.totalMTDEur.toFixed(2)})`,
    `EOM Estimate:  $${summary.eomEstimate.toFixed(2)} (€${summary.eomEstimateEur.toFixed(2)})`,
    `Budget Used:   ${summary.budgetUsedPct}% ($${summary.eomEstimate.toFixed(2)} / $${summary.budgetLimit.toFixed(2)})`,
    `Day ${summary.currentDay} of ${summary.daysInMonth} (${summary.monthProgress}% through month)`,
    '',
  ]

  // Top platforms by spend
  if (summary.byPlatform.length) {
    lines.push('Top Platforms:')
    const sorted = [...summary.byPlatform].sort((a, b) => b.mtd - a.mtd)
    for (const p of sorted.slice(0, 5)) {
      lines.push(`  ${p.platformName}: $${p.mtd.toFixed(2)} MTD → $${p.eomEstimate.toFixed(2)} EOM`)
    }
    lines.push('')
  }

  // Active alerts
  if (pendingAlerts.length) {
    lines.push(`Active Alerts (${pendingAlerts.length}):`)
    for (const a of pendingAlerts) {
      lines.push(`  [${a.severity.toUpperCase()}] ${a.message}`)
    }
    lines.push('')
  } else {
    lines.push('No active alerts.', '')
  }

  // Manual reminders
  if (manualReminders.length) {
    lines.push('Manual Costs Not Yet Recorded:')
    for (const name of manualReminders) {
      lines.push(`  ⚠ ${name}`)
    }
    lines.push('')
  }

  lines.push('—', 'View dashboard: https://infracost.eu')

  const body = lines.join('\n')
  const severity = summary.budgetUsedPct >= 90 ? 'warning' : 'info'

  await sendAlertEmail(body, severity, 'Weekly Cost Digest', config)

  return { sent: true, mtd: summary.totalMTD, eomEstimate: summary.eomEstimate, budgetPct: summary.budgetUsedPct, pendingAlerts: pendingAlerts.length, manualReminders }
}
