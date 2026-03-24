import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, message: 'slug is required' })
  }

  const db = useDB()

  const runs = await db.execute<{
    id: number
    trigger_type: string
    status: string
    records_collected: number
    error_message: string | null
    started_at: string
    completed_at: string | null
    duration_ms: number | null
  }>(sql`
    select
      cr.id,
      cr.trigger_type,
      cr.status,
      cr.records_collected,
      cr.error_message,
      cr.started_at,
      cr.completed_at,
      case when cr.completed_at is not null
        then extract(epoch from (cr.completed_at - cr.started_at)) * 1000
        else null
      end::int as duration_ms
    from collection_runs cr
    join platforms p on p.id = cr.platform_id
    where p.slug = ${slug}
    order by cr.started_at desc
    limit 10
  `)

  return { runs: runs.rows }
})
