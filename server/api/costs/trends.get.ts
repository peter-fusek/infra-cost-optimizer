import { and, eq, gte, lte, sql, isNull } from 'drizzle-orm'
import { costRecords, platforms } from '../../db/schema'

const EUR_USD_RATE = 0.92
function toEur(usd: number) { return Math.round(usd * EUR_USD_RATE * 100) / 100 }

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const db = useDB()

  // How many months back (default 6)
  const months = Math.min(Number(query.months) || 6, 12)

  const now = new Date()
  const results: Array<{
    month: string // YYYY-MM
    label: string // "Mar 2026"
    totalUsd: number
    totalEur: number
    byPlatform: Array<{
      platformSlug: string
      platformName: string
      totalUsd: number
      totalEur: number
      recordCount: number
    }>
  }> = []

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

    const rows = await db
      .select({
        platformSlug: platforms.slug,
        platformName: platforms.name,
        total: sql<string>`sum(${costRecords.amount})`,
        count: sql<number>`count(*)`,
      })
      .from(costRecords)
      .innerJoin(platforms, eq(costRecords.platformId, platforms.id))
      .where(
        and(
          gte(costRecords.periodStart, start),
          lte(costRecords.periodEnd, end),
          eq(costRecords.isActive, true),
          isNull(costRecords.deletedAt),
        ),
      )
      .groupBy(platforms.slug, platforms.name)

    const byPlatform = rows.map(r => ({
      platformSlug: r.platformSlug,
      platformName: r.platformName,
      totalUsd: Math.round(parseFloat(r.total || '0') * 100) / 100,
      totalEur: toEur(parseFloat(r.total || '0')),
      recordCount: r.count,
    }))

    const totalUsd = byPlatform.reduce((s, p) => s + p.totalUsd, 0)

    results.push({
      month: monthKey,
      label,
      totalUsd: Math.round(totalUsd * 100) / 100,
      totalEur: toEur(totalUsd),
      byPlatform: byPlatform.sort((a, b) => b.totalUsd - a.totalUsd),
    })
  }

  // Compute MoM changes
  const withChanges = results.map((m, i) => ({
    ...m,
    momChange: i > 0 && results[i - 1].totalUsd > 0
      ? Math.round(((m.totalUsd - results[i - 1].totalUsd) / results[i - 1].totalUsd) * 100)
      : null,
  }))

  return {
    months: withChanges,
    eurUsdRate: EUR_USD_RATE,
  }
})
