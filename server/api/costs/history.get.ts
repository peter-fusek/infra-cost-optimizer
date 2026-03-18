import { getCostHistory } from '../../services/cost-aggregation'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const db = useDB()

  const now = new Date()
  const startDate = query.start
    ? new Date(query.start as string)
    : new Date(now.getFullYear(), now.getMonth(), 1)
  const endDate = query.end
    ? new Date(query.end as string)
    : now
  const platformSlug = query.platform as string | undefined
  const { limit, offset } = parsePagination(query as Record<string, unknown>, 200)

  return getCostHistory(db, startDate, endDate, platformSlug, limit, offset)
})
