import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const minutes = body?.minutes

  // null clears the override, otherwise must be a non-negative number
  if (minutes !== null) {
    if (typeof minutes !== 'number' || minutes < 0 || minutes > 10_000) {
      throw createError({ statusCode: 400, message: 'minutes must be null or a number between 0 and 10000' })
    }
  }

  const db = useDB()

  // Update the manualOverride field on the latest pipeline_minutes record
  const result = await db.execute(sql`
    update cost_records
    set raw_data = jsonb_set(raw_data, '{manualOverride}', ${minutes === null ? sql`'null'::jsonb` : sql`${minutes}::jsonb`})
    where id = (
      select cr.id
      from cost_records cr
      join platforms p on p.id = cr.platform_id
      where p.slug = 'render'
        and cr.is_active = true and cr.deleted_at is null
        and cr.raw_data->>'type' = 'pipeline_minutes'
      order by cr.record_date desc
      limit 1
    )
  `)

  if (result.rowCount === 0) {
    throw createError({ statusCode: 404, message: 'No pipeline minutes record found — run a collection first' })
  }

  return { ok: true, manualOverride: minutes, note: 'Override active until next collection run (daily 06:00 UTC)' }
})
