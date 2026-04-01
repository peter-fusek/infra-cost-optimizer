import { sql } from 'drizzle-orm'

const PIPELINE_LIMIT = 500
const OVERAGE_RATE = 5 / 1000

export default defineEventHandler(async () => {
  const db = useDB()

  const result = await db.execute<{ raw_data: Record<string, unknown> | null; record_date: string }>(sql`
    select cr.raw_data, cr.record_date
    from cost_records cr
    join platforms p on p.id = cr.platform_id
    where p.slug = 'render'
      and cr.is_active = true and cr.deleted_at is null
      and cr.raw_data->>'type' = 'pipeline_minutes'
    order by cr.record_date desc
    limit 1
  `)

  const row = result.rows[0]
  if (!row?.raw_data) {
    return {
      totalMinutes: null,
      limitMinutes: PIPELINE_LIMIT,
      pct: null,
      projectedEOM: null,
      projectedOverageCost: null,
      overageCost: 0,
      isEstimated: true,
      manualOverride: null,
      perService: {},
      recordedAt: null,
    }
  }

  const rd = row.raw_data
  const override = typeof rd.manualOverride === 'number' ? rd.manualOverride : null
  const computed = typeof rd.pipelineMinutesTotal === 'number' ? rd.pipelineMinutesTotal : null
  const totalMinutes = override ?? computed
  const pct = totalMinutes !== null ? Math.round((totalMinutes / PIPELINE_LIMIT) * 100) : null

  return {
    totalMinutes,
    limitMinutes: PIPELINE_LIMIT,
    pct,
    projectedEOM: typeof rd.projectedEOM === 'number' ? rd.projectedEOM : null,
    projectedOverageCost: typeof rd.projectedOverageCost === 'number' ? rd.projectedOverageCost : null,
    overageCost: typeof rd.overageCost === 'number' ? rd.overageCost : 0,
    isEstimated: override === null,
    manualOverride: override,
    perService: (rd.perService && typeof rd.perService === 'object') ? rd.perService as Record<string, number> : {},
    recordedAt: row.record_date,
  }
})
