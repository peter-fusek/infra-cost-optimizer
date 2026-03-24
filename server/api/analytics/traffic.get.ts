import { fetchGA4Traffic } from '../../services/analytics-ga4'
import { getAnalyticsConfig } from '../../utils/analytics-config'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const slug = query.project as string

  if (!slug) {
    throw createError({ statusCode: 400, message: 'project query param required' })
  }

  const config = getAnalyticsConfig(slug)
  if (!config?.ga4PropertyId) {
    return { project: slug, configured: false, error: 'No GA4 property configured for this project' }
  }

  const days = Math.min(Number(query.days) || 30, 90)
  const result = await fetchGA4Traffic(config.ga4PropertyId, days)

  return { project: slug, configured: true, ...result }
})
