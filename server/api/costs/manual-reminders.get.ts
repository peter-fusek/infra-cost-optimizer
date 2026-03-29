import { and, eq, isNull, desc, gte, lte } from 'drizzle-orm'
import { costRecords, platforms } from '../../db/schema'

/** Expected monthly amounts for manual platforms (config map — only 3 platforms, no migration needed) */
const MANUAL_PLATFORM_CONFIG: Record<string, { expectedAmount: number; costType: string; serviceName: string }> = {
  'claude-max': { expectedAmount: 246, costType: 'subscription', serviceName: 'Max Subscription + Extra Usage' },
  'google-services': { expectedAmount: 62.50, costType: 'subscription', serviceName: 'Google Workspace Business Standard (5 seats)' },
  'websupport': { expectedAmount: 0.58, costType: 'subscription', serviceName: 'Domain (infracost.eu)' },
}

export default defineEventHandler(async () => {
  const db = useDB()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  // Get all manual platforms
  const manualPlatforms = await db
    .select({ id: platforms.id, slug: platforms.slug, name: platforms.name })
    .from(platforms)
    .where(and(
      eq(platforms.collectionMethod, 'manual'),
      eq(platforms.isActive, true),
      isNull(platforms.deletedAt),
    ))

  const reminders = await Promise.all(manualPlatforms.map(async (platform) => {
    const config = MANUAL_PLATFORM_CONFIG[platform.slug]

    // Latest cost record for this platform (any month)
    const [latest] = await db
      .select({ recordDate: costRecords.recordDate })
      .from(costRecords)
      .where(and(
        eq(costRecords.platformId, platform.id),
        eq(costRecords.isActive, true),
        isNull(costRecords.deletedAt),
      ))
      .orderBy(desc(costRecords.recordDate))
      .limit(1)

    // Current month record
    const [currentMonth] = await db
      .select({ id: costRecords.id, amount: costRecords.amount })
      .from(costRecords)
      .where(and(
        eq(costRecords.platformId, platform.id),
        eq(costRecords.collectionMethod, 'manual'),
        eq(costRecords.isActive, true),
        isNull(costRecords.deletedAt),
        gte(costRecords.periodStart, monthStart),
        lte(costRecords.periodEnd, monthEnd),
      ))
      .limit(1)

    const lastRecordedDate = latest?.recordDate?.toISOString() ?? null
    const daysSinceLastRecord = lastRecordedDate
      ? Math.floor((now.getTime() - new Date(lastRecordedDate).getTime()) / (1000 * 60 * 60 * 24))
      : null

    return {
      slug: platform.slug,
      name: platform.name,
      lastRecordedDate,
      daysSinceLastRecord,
      currentMonthRecorded: !!currentMonth,
      currentMonthAmount: currentMonth ? Number(currentMonth.amount) : null,
      expectedAmount: config?.expectedAmount ?? null,
      costType: config?.costType ?? 'subscription',
      serviceName: config?.serviceName ?? platform.name,
    }
  }))

  // Sort: unrecorded first, then by days since last record (descending)
  reminders.sort((a, b) => {
    if (a.currentMonthRecorded !== b.currentMonthRecorded) return a.currentMonthRecorded ? 1 : -1
    return (b.daysSinceLastRecord ?? 999) - (a.daysSinceLastRecord ?? 999)
  })

  return {
    reminders,
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
  }
})
