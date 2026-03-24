import { fetchGSCPerformance } from '../../services/analytics-gsc'
import { getAnalyticsConfig } from '../../utils/analytics-config'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const slug = query.project as string

  if (!slug) {
    throw createError({ statusCode: 400, message: 'project query param required' })
  }

  const config = getAnalyticsConfig(slug)
  if (!config?.gscSiteUrl) {
    return { project: slug, configured: false, error: 'No GSC site configured for this project' }
  }

  const days = Math.min(Number(query.days) || 30, 90)
  const result = await fetchGSCPerformance(config.gscSiteUrl, days)

  return { project: slug, configured: true, ...result }
})
