import type { BaseCollector, CollectorResult, CostRecord } from './base'

/**
 * GCP collector — minimal check for Cloud Run services.
 * GCP billing requires BigQuery export (complex setup).
 * This collector reports $0 for free tier usage.
 * For actual billing, use manual entry from GCP Console.
 */
export function createGcpCollector(apiKey: string, platformId: number, serviceId?: number): BaseCollector {
  return {
    platformSlug: 'gcp',

    async collect(periodStart: Date, periodEnd: Date): Promise<CollectorResult> {
      const records: CostRecord[] = []
      const errors: string[] = []

      // GCP doesn't have a simple billing API for free tier
      // Would need BigQuery billing export + service account
      errors.push('GCP: no simple billing API available. Use manual entry from console.cloud.google.com/billing')

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
        rawData: { note: 'GCP free tier — no billing API' },
        notes: 'GCP: free tier, manual verification needed',
      })

      return { records, errors }
    },
  }
}
