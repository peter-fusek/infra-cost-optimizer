/**
 * Analytics configuration — maps projects to their GA4 and GSC properties.
 * GA4 Property ID: numeric ID from Google Analytics (e.g. "123456789")
 * GSC Site URL: the property URL in Search Console (e.g. "https://infracost.eu")
 *
 * To find your GA4 Property ID: GA4 Admin > Property Settings > Property ID
 * To find GSC sites: Search Console > Settings > Property
 */

export interface ProjectAnalyticsConfig {
  slug: string
  ga4PropertyId: string | null
  gscSiteUrl: string | null
}

// Map project slugs to their analytics properties
// Update these when adding GA4 or GSC to a project
export const ANALYTICS_CONFIG: ProjectAnalyticsConfig[] = [
  { slug: 'infracost', ga4PropertyId: null, gscSiteUrl: 'https://infracost.eu' },
  { slug: 'homegrif.com', ga4PropertyId: null, gscSiteUrl: 'https://homegrif.com' },
  { slug: 'oncoteam', ga4PropertyId: null, gscSiteUrl: 'https://dashboard.oncoteam.cloud' },
  { slug: 'oncofiles', ga4PropertyId: null, gscSiteUrl: 'https://oncofiles.com' },
  { slug: 'contacts-refiner', ga4PropertyId: null, gscSiteUrl: 'https://contactrefiner.com' },
  { slug: 'budgetco', ga4PropertyId: null, gscSiteUrl: null },
  { slug: 'pulseshape', ga4PropertyId: null, gscSiteUrl: 'https://pulseshape.com' },
  { slug: 'instarea', ga4PropertyId: null, gscSiteUrl: 'https://instarea.com' },
  { slug: 'scrabsnap', ga4PropertyId: null, gscSiteUrl: null },
]

export function getAnalyticsConfig(slug: string): ProjectAnalyticsConfig | undefined {
  return ANALYTICS_CONFIG.find(c => c.slug === slug)
}

export function getProjectsWithAnalytics(): ProjectAnalyticsConfig[] {
  return ANALYTICS_CONFIG.filter(c => c.ga4PropertyId || c.gscSiteUrl)
}
