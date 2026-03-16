// Temporary: update budget limit
import { eq } from 'drizzle-orm'
import { budgets } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const db = useDB()
  
  const [updated] = await db
    .update(budgets)
    .set({ monthlyLimit: String(body.limit) })
    .where(eq(budgets.name, 'Total Infrastructure'))
    .returning()
  
  return { updated: updated?.monthlyLimit }
})
