import type { BaseCollector, CollectorResult, CostRecord } from './base'

/**
 * Render hybrid collector.
 * No billing API exists — uses service list API + known pricing formulas.
 * Pricing verified against live Render billing 2026-03-14.
 *
 * Render hourly rates (always-on monthly equivalent):
 * - Free:     $0.0000/hr ($0/mo)
 * - Starter:  $0.0094/hr (~$6.85/mo)
 * - Standard: $0.0336/hr (~$24.50/mo)
 * - Pro:      $0.0800/hr (~$58.40/mo)
 * - Basic-256mb DB: ~$5.90/mo base
 * - DB storage: ~$0.29/mo per GB
 * - Static sites: $0
 * - Cron jobs: ~$0.29/mo minimum
 */

const PLAN_MONTHLY_COST: Record<string, number> = {
  free: 0,
  starter: 6.85,
  standard: 24.50,
  pro: 58.40,
  pro_plus: 175.20,
}

const RENDER_PRICING = {
  professional_plan: 19.00,
  db_basic_256mb: 5.90,
  db_storage_per_gb: 0.29,
  cron_minimum: 0.29,
  static_site: 0,
}

interface RenderService {
  id: string
  name: string
  type: string // web_service, private_service, background_worker, cron_job, static_site, postgres
  serviceDetails?: {
    plan?: string
    region?: string
    disk?: { sizeGB: number }
    env?: string
  }
  // Also sometimes at top level
  plan?: string
}

export function createRenderCollector(apiKey: string, platformId: number): BaseCollector {
  return {
    platformSlug: 'render',

    async collect(periodStart: Date, periodEnd: Date): Promise<CollectorResult> {
      const records: CostRecord[] = []
      const errors: string[] = []

      try {
        // Fetch all services from Render API
        const response = await fetch('https://api.render.com/v1/services?limit=50', {
          headers: { Authorization: `Bearer ${apiKey}` },
        })

        if (!response.ok) {
          errors.push(`Render API error ${response.status}: ${await response.text()}`)
          return { records, errors }
        }

        const servicesData = await response.json() as Array<{ service: RenderService }>

        // Professional plan (fixed monthly)
        records.push({
          platformId,
          recordDate: new Date(),
          periodStart,
          periodEnd,
          amount: RENDER_PRICING.professional_plan.toFixed(2),
          currency: 'USD',
          costType: 'subscription',
          collectionMethod: 'hybrid',
          rawData: { type: 'professional_plan' },
          notes: 'Render Professional plan (1 seat)',
        })

        // Calculate costs per service based on known pricing
        for (const { service } of servicesData) {
          let cost = 0
          let costType: CostRecord['costType'] = 'subscription'
          let notes = ''

          // Get plan from serviceDetails or top-level
          const plan = (service.serviceDetails?.plan ?? service.plan ?? '').toLowerCase()

          if (service.type === 'postgres') {
            // DB pricing: base instance + storage
            const diskGB = service.serviceDetails?.disk?.sizeGB || 1
            cost = RENDER_PRICING.db_basic_256mb + (diskGB * RENDER_PRICING.db_storage_per_gb)
            notes = `PostgreSQL: Basic-256mb + ${diskGB}GB disk`
          }
          else if (service.type === 'static_site') {
            cost = 0
            notes = 'Static site (free)'
          }
          else if (service.type === 'cron_job') {
            cost = RENDER_PRICING.cron_minimum
            costType = 'usage'
            notes = 'Cron job (minimum charge)'
          }
          else if (plan && PLAN_MONTHLY_COST[plan] !== undefined) {
            // Web service / private service / background worker with known plan
            cost = PLAN_MONTHLY_COST[plan]
            costType = cost === 0 ? 'usage' : 'subscription'
            notes = `${service.type}: ${plan} plan`
          }
          else if (plan === '' || plan === 'free') {
            cost = 0
            costType = 'usage'
            notes = 'Free tier'
          }
          else {
            // Unknown plan — log it and estimate as Starter
            cost = PLAN_MONTHLY_COST.starter
            notes = `${service.type}: unknown plan "${plan}" (estimated as Starter)`
            errors.push(`Render: unknown plan "${plan}" for ${service.name} — estimated as Starter $6.85/mo`)
          }

          records.push({
            platformId,
            recordDate: new Date(),
            periodStart,
            periodEnd,
            amount: cost.toFixed(2),
            currency: 'USD',
            costType,
            collectionMethod: 'hybrid',
            rawData: { service },
            notes: `${service.name}: ${notes}`,
          })
        }
      }
      catch (err) {
        errors.push(`Render collector error: ${err instanceof Error ? err.message : String(err)}`)
      }

      return { records, errors }
    },
  }
}
