import type { BaseCollector, CollectorResult, CostRecord } from './base'

/**
 * Resend collector — checks email sending usage via API.
 * Free tier: 3000 emails/mo, 100/day. No billing API — check usage via domains endpoint.
 * API docs: https://resend.com/docs/api-reference
 */
export function createResendCollector(apiKey: string, platformId: number, serviceId?: number): BaseCollector {
  return {
    platformSlug: 'resend',

    async collect(periodStart: Date, periodEnd: Date): Promise<CollectorResult> {
      const records: CostRecord[] = []
      const errors: string[] = []

      try {
        // Verify API key by listing domains
        const response = await fetch('https://api.resend.com/domains', {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(15_000),
        })

        if (!response.ok) {
          errors.push(`Resend API error ${response.status}: ${await response.text()}`)
          return { records, errors }
        }

        const domains = await response.json() as { data: Array<{ id: string; name: string; status: string }> }

        // Resend doesn't expose billing — report as $0 (free tier)
        records.push({
          platformId,
          serviceId,
          recordDate: new Date(),
          periodStart,
          periodEnd,
          amount: '0.00',
          currency: 'USD',
          costType: 'usage',
          collectionMethod: 'api',
          rawData: { domains: domains.data?.length ?? 0 },
          notes: `Resend: ${domains.data?.length ?? 0} domain(s), free tier (3000 emails/mo)`,
        })
      }
      catch (err) {
        errors.push(`Resend collector error: ${err instanceof Error ? err.message : String(err)}`)
      }

      return { records, errors }
    },
  }
}
