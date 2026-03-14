import type { BaseCollector, CollectorResult, CostRecord } from './base'

/**
 * Anthropic Claude API cost collector.
 *
 * NOTE: The Anthropic Admin API (as of March 2026) supports managing
 * workspaces, members, API keys, and invites — but does NOT expose
 * billing/usage data. Cost data must be entered manually or scraped
 * from the Anthropic Console (platform.claude.com/workspaces/default/cost).
 *
 * This collector attempts to read from the Admin API but will gracefully
 * return empty if no usage endpoint is available.
 */
export function createAnthropicCollector(apiKey: string, platformId: number, serviceId?: number): BaseCollector {
  return {
    platformSlug: 'anthropic',

    async collect(periodStart: Date, periodEnd: Date): Promise<CollectorResult> {
      const records: CostRecord[] = []
      const errors: string[] = []

      try {
        // Verify the admin key works by listing API keys
        const response = await fetch(
          'https://api.anthropic.com/v1/organizations/api_keys?limit=1',
          {
            headers: {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
          },
        )

        if (!response.ok) {
          const status = response.status
          if (status === 404) {
            errors.push('Anthropic Admin API: usage endpoint not available. Enter API costs manually via Manual Entry page.')
          }
          else if (status === 401 || status === 403) {
            errors.push(`Anthropic Admin API: authentication failed (${status}). Check ANTHROPIC_ADMIN_API_KEY.`)
          }
          else {
            errors.push(`Anthropic Admin API error ${status}: ${await response.text()}`)
          }
          return { records, errors }
        }

        // Key is valid but no usage/billing endpoint exists in the Admin API
        errors.push('Anthropic Admin API: key verified but no billing/usage endpoint available. Enter API costs manually.')
      }
      catch (err) {
        errors.push(`Anthropic collector error: ${err instanceof Error ? err.message : String(err)}`)
      }

      return { records, errors }
    },
  }
}
