import type { BaseCollector, CollectorResult, CostRecord } from './base'

/**
 * Neon collector — checks project consumption via API.
 * Free tier: 0.5 GiB storage, 191.9 compute hours/mo.
 * API docs: https://api-docs.neon.tech/reference
 */
export function createNeonCollector(apiKey: string, platformId: number): BaseCollector {
  return {
    platformSlug: 'neon',

    async collect(periodStart: Date, periodEnd: Date): Promise<CollectorResult> {
      const records: CostRecord[] = []
      const errors: string[] = []

      try {
        // List projects to verify key and get usage info
        const response = await fetch('https://console.neon.tech/api/v2/projects', {
          headers: { Authorization: `Bearer ${apiKey}` },
        })

        if (!response.ok) {
          errors.push(`Neon API error ${response.status}: ${await response.text()}`)
          return { records, errors }
        }

        const data = await response.json() as { projects: Array<{ id: string; name: string }> }
        const projectCount = data.projects?.length ?? 0

        // Try to get consumption data
        let totalCost = 0
        try {
          const billingResponse = await fetch('https://console.neon.tech/api/v2/consumption/projects', {
            headers: { Authorization: `Bearer ${apiKey}` },
          })
          if (billingResponse.ok) {
            const billing = await billingResponse.json() as {
              projects?: Array<{ project_id: string; data_storage_bytes_hour: number; compute_time_seconds: number }>
            }
            // On free tier, consumption exists but cost is $0
            records.push({
              platformId,
              recordDate: new Date(),
              periodStart,
              periodEnd,
              amount: totalCost.toFixed(2),
              currency: 'USD',
              costType: 'usage',
              collectionMethod: 'api',
              rawData: { projects: projectCount, consumption: billing.projects },
              notes: `Neon: ${projectCount} project(s), free tier`,
            })
          }
          else {
            // Consumption endpoint might not be available on free tier
            records.push({
              platformId,
              recordDate: new Date(),
              periodStart,
              periodEnd,
              amount: '0.00',
              currency: 'USD',
              costType: 'usage',
              collectionMethod: 'api',
              rawData: { projects: projectCount },
              notes: `Neon: ${projectCount} project(s), free tier (no consumption API access)`,
            })
          }
        }
        catch {
          records.push({
            platformId,
            recordDate: new Date(),
            periodStart,
            periodEnd,
            amount: '0.00',
            currency: 'USD',
            costType: 'usage',
            collectionMethod: 'api',
            rawData: { projects: projectCount },
            notes: `Neon: ${projectCount} project(s), free tier`,
          })
        }
      }
      catch (err) {
        errors.push(`Neon collector error: ${err instanceof Error ? err.message : String(err)}`)
      }

      return { records, errors }
    },
  }
}
