import { and, eq, isNull, desc, gte } from 'drizzle-orm'
import { alerts, budgets } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const db = useDB()

  // Default: show alerts from current month
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const onlyActive = query.status !== 'all'

  const conditions = [
    eq(alerts.isActive, true),
    isNull(alerts.deletedAt),
    gte(alerts.createdAt, monthStart),
  ]

  if (onlyActive) {
    conditions.push(eq(alerts.status, 'pending'))
  }

  const { limit, offset } = parsePagination(query as Record<string, unknown>)

  const rows = await db
    .select({
      id: alerts.id,
      severity: alerts.severity,
      status: alerts.status,
      alertType: alerts.alertType,
      message: alerts.message,
      budgetName: budgets.name,
      createdAt: alerts.createdAt,
      resolvedAt: alerts.resolvedAt,
    })
    .from(alerts)
    .leftJoin(budgets, eq(alerts.budgetId, budgets.id))
    .where(and(...conditions))
    .orderBy(desc(alerts.createdAt))
    .limit(limit)
    .offset(offset)

  return rows
})
