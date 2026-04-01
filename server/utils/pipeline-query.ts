import { sql } from 'drizzle-orm'

/** Shared SQL query for the latest Render pipeline_minutes cost record */
export async function fetchLatestPipelineRecord(db: ReturnType<typeof import('./db').useDB>): Promise<Record<string, unknown> | null> {
  const result = await db.execute<{ raw_data: Record<string, unknown> | null }>(sql`
    select cr.raw_data
    from cost_records cr
    join platforms p on p.id = cr.platform_id
    where p.slug = 'render'
      and cr.is_active = true and cr.deleted_at is null
      and cr.raw_data->>'type' = 'pipeline_minutes'
    order by cr.record_date desc
    limit 1
  `)
  return result.rows[0]?.raw_data ?? null
}
