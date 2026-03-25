import { and, eq, gte, lte, isNull } from 'drizzle-orm'
import { costRecords, platforms } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const platformSlug = String(query.platform || '')

  if (!platformSlug) {
    throw createError({ statusCode: 400, message: 'platform query param is required' })
  }

  const db = useDB()

  const [platform] = await db
    .select({ id: platforms.id })
    .from(platforms)
    .where(eq(platforms.slug, platformSlug))
    .limit(1)

  if (!platform) {
    throw createError({ statusCode: 404, message: `Platform '${platformSlug}' not found` })
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const [existing] = await db
    .select({ id: costRecords.id, amount: costRecords.amount, recordDate: costRecords.recordDate })
    .from(costRecords)
    .where(and(
      eq(costRecords.platformId, platform.id),
      eq(costRecords.costType, 'subscription'),
      eq(costRecords.collectionMethod, 'manual'),
      gte(costRecords.periodStart, monthStart),
      lte(costRecords.periodEnd, monthEnd),
      eq(costRecords.isActive, true),
      isNull(costRecords.deletedAt),
    ))
    .limit(1)

  return {
    recorded: !!existing,
    recordId: existing?.id ?? null,
    amount: existing ? Number(existing.amount) : null,
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
  }
})
