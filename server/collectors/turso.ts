import type { BaseCollector, CollectorResult, CostRecord } from './base'

/**
 * Turso collector — fetches database usage via API.
 * Free tier: 500M rows read/mo, 10M rows written/mo, 5GB storage.
 * API: https://docs.turso.tech/api-reference
 */
export function createTursoCollector(apiKey: string, platformId: number): BaseCollector {
  return {
    platformSlug: 'turso',

    async collect(periodStart: Date, periodEnd: Date): Promise<CollectorResult> {
      const records: CostRecord[] = []
      const errors: string[] = []

      try {
        // Get organizations
        const orgResponse = await fetch('https://api.turso.tech/v1/organizations', {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(15_000),
        })

        if (!orgResponse.ok) {
          errors.push(`Turso API error ${orgResponse.status}: ${await orgResponse.text()}`)
          return { records, errors }
        }

        const orgs = await orgResponse.json() as Array<{ slug: string; name: string }>
        const orgSlug = orgs[0]?.slug
        if (!orgSlug) {
          errors.push('Turso: no organizations found')
          return { records, errors }
        }

        // Get org-level usage
        const usageResponse = await fetch(`https://api.turso.tech/v1/organizations/${orgSlug}/usage`, {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(15_000),
        })

        let usageData: Record<string, unknown> = {}
        if (usageResponse.ok) {
          usageData = await usageResponse.json()
        } else {
          errors.push(`Turso usage API error ${usageResponse.status}: usage data not collected`)
        }

        // Get databases
        const dbResponse = await fetch(`https://api.turso.tech/v1/organizations/${orgSlug}/databases`, {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(15_000),
        })

        let dbCount = 0
        if (dbResponse.ok) {
          const dbData = await dbResponse.json() as { databases: Array<{ name: string }> }
          dbCount = dbData.databases?.length ?? 0
        } else {
          errors.push(`Turso databases API error ${dbResponse.status}: database count not collected`)
        }

        // Extract normalized usage metrics from Turso API response
        const orgUsage = (usageData as { organization?: { usage?: { rows_read?: number; rows_written?: number; storage_bytes?: number } } })
          ?.organization?.usage
        const rowsRead = orgUsage?.rows_read ?? 0
        const rowsWritten = orgUsage?.rows_written ?? 0
        const storageBytes = orgUsage?.storage_bytes ?? 0

        // Free tier — $0 cost but track usage metrics
        records.push({
          platformId,
          recordDate: new Date(),
          periodStart,
          periodEnd,
          amount: '0.00',
          currency: 'USD',
          costType: 'usage',
          collectionMethod: 'api',
          rawData: {
            org: orgSlug,
            databases: dbCount,
            rowsRead,
            rowsWritten,
            storageBytes,
            usage: usageData,
          },
          notes: `Turso: ${dbCount} database(s) in "${orgSlug}", free tier`,
        })

        return { records, errors, accountIdentifier: orgSlug }
      }
      catch (err) {
        errors.push(`Turso collector error: ${err instanceof Error ? err.message : String(err)}`)
      }

      return { records, errors }
    },
  }
}
