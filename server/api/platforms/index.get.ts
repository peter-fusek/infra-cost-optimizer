import { sql } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const db = useDB()

  // Single query: platforms + service count + latest collection run
  const rows = await db.execute<{
    id: number
    slug: string
    name: string
    type: string
    collection_method: string
    billing_cycle: string
    account_identifier: string | null
    is_active: boolean
    service_count: number
    last_collected_at: string | null
    last_run_status: string | null
    last_records_collected: number | null
    last_error: string | null
  }>(sql`
    select
      p.id,
      p.slug,
      p.name,
      p.type,
      p.collection_method,
      p.billing_cycle,
      p.account_identifier,
      p.is_active,
      coalesce(sc.cnt, 0)::int as service_count,
      lr.completed_at as last_collected_at,
      lr.status as last_run_status,
      lr.records_collected as last_records_collected,
      lr.error_message as last_error
    from platforms p
    left join (
      select platform_id, count(*) as cnt
      from services
      where is_active = true
      group by platform_id
    ) sc on sc.platform_id = p.id
    left join (
      select distinct on (platform_id)
        platform_id, status, completed_at, records_collected, error_message
      from collection_runs
      order by platform_id, started_at desc
    ) lr on lr.platform_id = p.id
    where p.is_active = true
    order by p.name
  `)

  return rows.rows.map(p => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    type: p.type,
    collectionMethod: p.collection_method,
    billingCycle: p.billing_cycle,
    accountIdentifier: p.account_identifier,
    isActive: p.is_active,
    serviceCount: p.service_count,
    lastCollectedAt: p.last_collected_at,
    lastRunStatus: p.last_run_status,
    lastRecordsCollected: p.last_records_collected,
    lastError: p.last_error,
  }))
})
