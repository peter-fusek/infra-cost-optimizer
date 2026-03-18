import { eq, sql } from 'drizzle-orm'
import { platforms } from '../../db/schema'

export default defineEventHandler(async () => {
  const db = useDB()

  // Get platforms with service count
  const platformRows = await db
    .select({
      id: platforms.id,
      slug: platforms.slug,
      name: platforms.name,
      type: platforms.type,
      collectionMethod: platforms.collectionMethod,
      billingCycle: platforms.billingCycle,
      accountIdentifier: platforms.accountIdentifier,
      isActive: platforms.isActive,
      serviceCount: sql<number>`(select count(*) from services where services.platform_id = ${platforms.id} and services.is_active = true)`,
    })
    .from(platforms)
    .where(eq(platforms.isActive, true))
    .orderBy(platforms.name)

  // Get latest collection run per platform using DISTINCT ON
  const latestRuns = await db.execute<{
    platform_id: number
    status: string
    completed_at: string | null
    records_collected: number | null
    error_message: string | null
  }>(sql`
    select distinct on (platform_id)
      platform_id, status, completed_at, records_collected, error_message
    from collection_runs
    order by platform_id, started_at desc
  `)

  const runMap = new Map(latestRuns.rows.map(r => [r.platform_id, r]))

  return platformRows.map(p => {
    const run = runMap.get(p.id)
    return {
      ...p,
      lastCollectedAt: run?.completed_at ?? null,
      lastRunStatus: run?.status ?? null,
      lastRecordsCollected: run?.records_collected ?? null,
      lastError: run?.error_message ?? null,
    }
  })
})
