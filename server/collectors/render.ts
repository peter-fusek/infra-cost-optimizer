import type { BaseCollector, CollectorResult, CostRecord } from './base'
import { getMonthProgress } from './base'
import { withRetry } from '../utils/retry'

/**
 * Render hybrid collector.
 * No billing API exists — uses service list API + known pricing formulas.
 * Pricing verified against live Render billing 2026-03-14.
 *
 * Render hourly rates (always-on monthly equivalent):
 * - Free:     $0/mo
 * - Starter:  ~$6.85/mo
 * - Standard: ~$24.50/mo
 * - Pro:      ~$58.40/mo
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
}

interface RenderService {
  id: string
  name: string
  type: string
  suspended?: string // 'not_suspended' | 'suspended'
  serviceDetails?: {
    plan?: string
    region?: string
    env?: string
  }
}

interface RenderDeploy {
  id: string
  createdAt: string
  finishedAt: string | null
  status: string
}

const PIPELINE_LIMIT = 500
const OVERAGE_RATE = 5 / 1000 // $5 per 1000 minutes

function computeDeployMinutes(deploy: RenderDeploy): number {
  if (!deploy.finishedAt) return 0
  // Only count completed deploys (live or build_failed consume build minutes)
  if (deploy.status !== 'live' && deploy.status !== 'build_failed') return 0
  const ms = new Date(deploy.finishedAt).getTime() - new Date(deploy.createdAt).getTime()
  if (ms <= 0) return 0
  // Cap at 60 minutes per deploy as a safety guard
  return Math.min(60, ms / 60_000)
}

interface RenderPostgres {
  id: string
  name: string
  plan: string
  status: string
  diskSizeGB?: number
  databaseName?: string
  region?: string
}

export function createRenderCollector(
  apiKey: string,
  platformId: number,
  serviceMap?: Map<string, number>, // name → serviceId for linking
): BaseCollector {
  const headers = { Authorization: `Bearer ${apiKey}` }

  return {
    platformSlug: 'render',

    async collect(periodStart: Date, periodEnd: Date): Promise<CollectorResult> {
      const records: CostRecord[] = []
      const errors: string[] = []

      function findServiceId(name: string): number | undefined {
        return serviceMap?.get(name)
      }

      try {
        // 1. Fetch web/static/cron services
        const svcResponse = await fetch('https://api.render.com/v1/services?limit=50', { headers, signal: AbortSignal.timeout(15_000) })
        if (!svcResponse.ok) {
          errors.push(`Render services API error ${svcResponse.status}: ${await svcResponse.text()}`)
          return { records, errors }
        }
        const servicesData = await svcResponse.json() as Array<{ service: RenderService }>

        // 2. Fetch PostgreSQL databases
        const dbResponse = await fetch('https://api.render.com/v1/postgres?limit=50', { headers, signal: AbortSignal.timeout(15_000) })
        let databases: RenderPostgres[] = []
        if (dbResponse.ok) {
          const dbData = await dbResponse.json() as Array<{ postgres: RenderPostgres }>
          databases = dbData.map(d => d.postgres)
        } else {
          errors.push(`Render postgres API error ${dbResponse.status} — databases not collected`)
        }

        // Professional plan (fixed monthly)
        records.push({
          platformId,
          serviceId: findServiceId('Professional Plan'),
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

        // Price each service
        for (const { service } of servicesData) {
          let cost = 0
          let costType: CostRecord['costType'] = 'subscription'
          let notes = ''
          const plan = (service.serviceDetails?.plan ?? '').toLowerCase()

          // Suspended services cost $0
          if (service.suspended === 'suspended') {
            cost = 0
            costType = 'usage'
            notes = 'SUSPENDED'
          }
          else if (service.type === 'static_site') {
            cost = 0
            notes = 'Static site (free)'
          }
          else if (service.type === 'cron_job') {
            cost = RENDER_PRICING.cron_minimum
            costType = 'usage'
            notes = `Cron job: ${plan} plan`
          }
          else if (plan && PLAN_MONTHLY_COST[plan] !== undefined) {
            cost = PLAN_MONTHLY_COST[plan]
            costType = cost === 0 ? 'usage' : 'subscription'
            notes = `${service.type}: ${plan} plan`
          }
          else {
            cost = PLAN_MONTHLY_COST.starter ?? 0
            notes = `${service.type}: unknown plan "${plan}" (est. Starter)`
            errors.push(`Render: unknown plan "${plan}" for ${service.name}`)
          }

          records.push({
            platformId,
            serviceId: findServiceId(service.name),
            recordDate: new Date(),
            periodStart,
            periodEnd,
            amount: cost.toFixed(2),
            currency: 'USD',
            costType,
            collectionMethod: 'hybrid',
            rawData: { serviceId: service.id, type: service.type, plan },
            notes: `${service.name}: ${notes}`,
          })
        }

        // Price each database
        for (const db of databases) {
          const isSuspended = db.status === 'suspended'
          const diskGB = db.diskSizeGB || 1
          const cost = isSuspended ? 0 : RENDER_PRICING.db_basic_256mb + (diskGB * RENDER_PRICING.db_storage_per_gb)

          records.push({
            platformId,
            serviceId: findServiceId(db.name),
            recordDate: new Date(),
            periodStart,
            periodEnd,
            amount: cost.toFixed(2),
            currency: 'USD',
            costType: 'subscription',
            collectionMethod: 'hybrid',
            rawData: { postgresId: db.id, diskSizeGB: diskGB, plan: db.plan, status: db.status },
            notes: `${db.name}: ${isSuspended ? 'SUSPENDED' : `PostgreSQL ${db.plan || 'basic-256mb'} + ${diskGB}GB disk`}`,
          })
        }
        // Pipeline build minutes — estimate from deploy timestamps
        try {
          const perService: Record<string, number> = {}
          let totalMinutes = 0

          for (const { service } of servicesData) {
            if (service.suspended === 'suspended') continue

            try {
              const deploysUrl = `https://api.render.com/v1/services/${service.id}/deploys?limit=100`
              const deploysRes = await withRetry(
                () => fetch(deploysUrl, { headers, signal: AbortSignal.timeout(15_000) }),
                { attempts: 2, label: `deploys:${service.name}` },
              )

              if (!deploysRes.ok) {
                errors.push(`Render deploys API ${deploysRes.status} for ${service.name}`)
                continue
              }

              const deploysData = await deploysRes.json() as Array<{ deploy: RenderDeploy }>
              let serviceMinutes = 0
              for (const { deploy } of deploysData) {
                // Only count deploys within the collection period
                const created = new Date(deploy.createdAt)
                if (created < periodStart || created > periodEnd) continue
                serviceMinutes += computeDeployMinutes(deploy)
              }

              serviceMinutes = Math.round(serviceMinutes * 100) / 100
              if (serviceMinutes > 0) {
                perService[service.name] = serviceMinutes
              }
              totalMinutes += serviceMinutes
            }
            catch (err) {
              errors.push(`Render deploys fetch failed for ${service.name}: ${err instanceof Error ? err.message : String(err)}`)
            }
          }

          totalMinutes = Math.round(totalMinutes * 100) / 100
          const monthProgress = Math.max(0.1, getMonthProgress())
          const projectedEOM = Math.round(totalMinutes / monthProgress)
          const overageCost = Math.max(0, (totalMinutes - PIPELINE_LIMIT) * OVERAGE_RATE)
          const projectedOverageCost = Math.max(0, (projectedEOM - PIPELINE_LIMIT) * OVERAGE_RATE)

          records.push({
            platformId,
            serviceId: undefined,
            recordDate: new Date(),
            periodStart,
            periodEnd,
            amount: overageCost.toFixed(4),
            currency: 'USD',
            costType: 'usage',
            collectionMethod: 'hybrid',
            rawData: {
              type: 'pipeline_minutes',
              pipelineMinutesTotal: totalMinutes,
              perService,
              projectedEOM,
              overageCost: Math.round(overageCost * 100) / 100,
              projectedOverageCost: Math.round(projectedOverageCost * 100) / 100,
              isEstimated: true,
              manualOverride: null,
            },
            notes: `Render build minutes: ${totalMinutes} min MTD (${projectedEOM} projected EOM)`,
          })
        }
        catch (err) {
          errors.push(`Render pipeline minutes collection failed: ${err instanceof Error ? err.message : String(err)}`)
        }
      }
      catch (err) {
        errors.push(`Render collector error: ${err instanceof Error ? err.message : String(err)}`)
      }

      // Identify account via /owners endpoint
      let accountIdentifier: string | undefined
      try {
        const ownerRes = await fetch('https://api.render.com/v1/owners?limit=1', { headers, signal: AbortSignal.timeout(15_000) })
        if (ownerRes.ok) {
          const owners = await ownerRes.json() as Array<{ owner: { name: string; email: string } }>
          if (owners[0]) {
            accountIdentifier = owners[0].owner.email || owners[0].owner.name
          }
        }
      }
      catch (err) {
        errors.push(`Render: account identification failed: ${err instanceof Error ? err.message : String(err)}`)
      }

      return { records, errors, accountIdentifier }
    },
  }
}
