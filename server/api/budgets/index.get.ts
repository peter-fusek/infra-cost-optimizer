import { and, eq, isNull } from 'drizzle-orm'
import { budgets, platforms } from '../../db/schema'

export default defineEventHandler(async () => {
  const db = useDB()

  const rows = await db
    .select({
      id: budgets.id,
      name: budgets.name,
      platformId: budgets.platformId,
      platformName: platforms.name,
      monthlyLimit: budgets.monthlyLimit,
      alertAt50: budgets.alertAt50,
      alertAt75: budgets.alertAt75,
      alertAt90: budgets.alertAt90,
      alertAt100: budgets.alertAt100,
      isActive: budgets.isActive,
      createdAt: budgets.createdAt,
    })
    .from(budgets)
    .leftJoin(platforms, eq(budgets.platformId, platforms.id))
    .where(and(eq(budgets.isActive, true), isNull(budgets.deletedAt)))
    .orderBy(budgets.createdAt)

  return { budgets: rows }
})
