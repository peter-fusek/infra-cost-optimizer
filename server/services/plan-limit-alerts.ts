import { sql } from 'drizzle-orm'
import { and, eq, gte } from 'drizzle-orm'
import { alerts } from '../db/schema'
import { PLAN_LIMITS, formatUsage, formatLimit } from '../utils/plan-limits'

const THRESHOLDS = [
  { pct: 100, severity: 'critical' as const, label: 'exceeded limit' },
  { pct: 90, severity: 'warning' as const, label: 'at 90%' },
  { pct: 75, severity: 'warning' as const, label: 'at 75%' },
]

/**
 * Extract usage values from the latest rawData for each platform.
 * Mirrors logic from /api/limits.get.ts.
 */
function extractUsage(slug: string, rawData: Record<string, unknown>): Record<string, number | null> {
  switch (slug) {
    case 'neon':
      return {
        active_seconds: typeof rawData.activeSecondsLimit === 'number' ? 0 : null,
        projects: typeof rawData.projectsLimit === 'number' ? rawData.projectsLimit as number : null,
      }
    case 'turso':
      return {
        rows_read: typeof rawData.rowsRead === 'number' ? rawData.rowsRead : null,
        rows_written: typeof rawData.rowsWritten === 'number' ? rawData.rowsWritten : null,
        storage_bytes: typeof rawData.storageBytes === 'number' ? rawData.storageBytes : null,
        databases: typeof rawData.databases === 'number' ? rawData.databases : null,
      }
    case 'uptimerobot':
      return {
        monitors: typeof rawData.totalMonitors === 'number' ? rawData.totalMonitors : null,
      }
    case 'resend':
      return { emails_per_month: null, emails_per_day: null }
    case 'render':
      return { pipeline_minutes: null }
    case 'railway':
      return { monthly_credit_usd: null }
    default:
      return {}
  }
}

async function sendAlertEmail(message: string, severity: string, config: Record<string, string>) {
  if (!config.resendApiKey) return
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'InfraCost <alerts@contactrefiner.com>',
        to: ['peterfusek1980@gmail.com'],
        subject: `[InfraCost ${severity.toUpperCase()}] Plan limit alert`,
        text: message,
      }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) {
      console.error(`[plan-limit-alerts] Email send returned ${response.status}: ${await response.text()}`)
    }
  }
  catch (err) {
    console.error('[plan-limit-alerts] Email send failed:', err instanceof Error ? err.message : err)
  }
}

async function sendWhatsApp(message: string, config: Record<string, string>) {
  const phone = config.whatsappPhone
  const apikey = config.whatsappApikey
  if (!phone || !apikey) return
  try {
    const encoded = encodeURIComponent(message)
    const response = await fetch(`https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apikey}`, {
      signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) {
      console.error(`[plan-limit-alerts] WhatsApp send returned ${response.status}: ${await response.text()}`)
    }
  }
  catch (err) {
    console.error('[plan-limit-alerts] WhatsApp send failed:', err instanceof Error ? err.message : err)
  }
}

export async function checkPlanLimitAlerts(db: ReturnType<typeof import('../utils/db').useDB>, config?: Record<string, string>) {
  const newAlerts: Array<{ severity: string; message: string; platform: string; metric: string }> = []

  // Get latest cost record per platform (same query as /api/limits)
  const latestRecords = await db.execute<{
    platform_id: number
    slug: string
    name: string
    raw_data: Record<string, unknown> | null
    amount: string
  }>(sql`
    select distinct on (cr.platform_id)
      cr.platform_id, p.slug, p.name, cr.raw_data, cr.amount
    from cost_records cr
    join platforms p on p.id = cr.platform_id
    where cr.is_active = true and cr.deleted_at is null
      and cr.collection_method != 'manual'
    order by cr.platform_id, cr.record_date desc
  `)

  // Railway credit: sum all project costs this month
  const railwayTotal = await db.execute<{ total: string }>(sql`
    select coalesce(sum(cr.amount::numeric), 0) as total
    from cost_records cr
    join platforms p on p.id = cr.platform_id
    where p.slug = 'railway'
      and cr.is_active = true and cr.deleted_at is null
      and cr.collection_method = 'api'
      and cr.period_start >= date_trunc('month', now())
  `)

  for (const row of latestRecords.rows) {
    const limits = PLAN_LIMITS[row.slug]
    if (!limits) continue

    const rawData = row.raw_data || {}
    const usage = extractUsage(row.slug, rawData)

    if (row.slug === 'railway') {
      usage.monthly_credit_usd = parseFloat(railwayTotal.rows[0]?.total || '0')
    }

    for (const [metricKey, limitDef] of Object.entries(limits)) {
      const used = usage[metricKey] ?? null
      if (used === null) continue

      const pct = Math.round((used / limitDef.limit) * 100)

      // Find highest breached threshold
      for (const threshold of THRESHOLDS) {
        if (pct < threshold.pct) continue

        const alertType = `limit_${threshold.pct}_${row.slug}_${metricKey}`

        // 24h dedup
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
        const existing = await db
          .select()
          .from(alerts)
          .where(
            and(
              eq(alerts.alertType, alertType),
              gte(alerts.createdAt, since),
              eq(alerts.isActive, true),
            ),
          )
          .limit(1)

        if (existing.length > 0) break // already alerted

        const message = `Plan limit ${threshold.label}: ${row.name} — ${limitDef.label} at ${pct}% (${formatUsage(used, limitDef.unit)} / ${formatLimit(limitDef)})`
        await db.insert(alerts).values({
          severity: threshold.severity,
          alertType,
          message,
        })
        newAlerts.push({ severity: threshold.severity, message, platform: row.slug, metric: metricKey })

        // Send notifications for warning/critical
        if (config && (threshold.severity === 'warning' || threshold.severity === 'critical')) {
          await sendAlertEmail(message, threshold.severity, config)
          await sendWhatsApp(`🚨 InfraCost ${threshold.severity}: ${message}`, config)
        }

        break // only highest threshold
      }
    }
  }

  return newAlerts
}
