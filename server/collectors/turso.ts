import type { BaseCollector, CollectorResult, CostRecord } from './base'

/**
 * Turso collector — checks database usage via API.
 * Free tier: 9 GiB total storage, 500 databases, 25 billion rows read/mo.
 * API docs: https://docs.turso.tech/api-reference
 */
export function createTursoCollector(apiKey: string, platformId: number): BaseCollector {
  return {
    platformSlug: 'turso',

    async collect(periodStart: Date, periodEnd: Date): Promise<CollectorResult> {
      const records: CostRecord[] = []
      const errors: string[] = []

      try {
        // List databases to verify key
        const response = await fetch('https://api.turso.tech/v1/organizations', {
          headers: { Authorization: `Bearer ${apiKey}` },
        })

        if (!response.ok) {
          errors.push(`Turso API error ${response.status}: ${await response.text()}`)
          return { records, errors }
        }

        const orgs = await response.json() as Array<{ slug: string; name: string }>
        const orgSlug = orgs[0]?.slug

        let dbCount = 0
        if (orgSlug) {
          const dbResponse = await fetch(`https://api.turso.tech/v1/organizations/${orgSlug}/databases`, {
            headers: { Authorization: `Bearer ${apiKey}` },
          })
          if (dbResponse.ok) {
            const dbData = await dbResponse.json() as { databases: Array<{ name: string }> }
            dbCount = dbData.databases?.length ?? 0
          }
        }

        // Turso free tier — $0
        records.push({
          platformId,
          recordDate: new Date(),
          periodStart,
          periodEnd,
          amount: '0.00',
          currency: 'USD',
          costType: 'usage',
          collectionMethod: 'api',
          rawData: { org: orgSlug, databases: dbCount },
          notes: `Turso: ${dbCount} database(s) in org "${orgSlug}", free tier`,
        })
      }
      catch (err) {
        errors.push(`Turso collector error: ${err instanceof Error ? err.message : String(err)}`)
      }

      return { records, errors }
    },
  }
}
